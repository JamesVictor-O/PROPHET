// ─────────────────────────────────────────────────────────────────────────────
// Prophet Market Maker Agent
//
// Lifecycle:
//   1. On startup: scan all Open markets and seed missing price quotes
//   2. Listen for MarketCreated events → call 0G Compute → post opening quotes
//   3. Periodic repricing loop → adjust quotes based on liquidityTier
//   4. Write all price state to 0G Storage KV for frontend reads
//
// 0G integrations:
//   - 0G Chain:   reads market state and liquidityTier
//   - 0G Compute: Qwen/DeepSeek for initial pricing + repricing inference
//   - 0G Storage: writes live price quotes (KV layer) + global MM state
// ─────────────────────────────────────────────────────────────────────────────

import "dotenv/config";
import { ethers }             from "ethers";
import { createLogger }       from "../shared/logger";
import { createProvider, createWallet, getFactory, getMarket,
         listenForEvent, getMarketInfo, getAllActiveMarkets, getLiquidityPool } from "../shared/chain";
import { callAllocationScoring, callPricingInference }  from "../shared/compute";
import { writeMarketPrices, writeMMState } from "../shared/storage";
import { cfg, cfgNum } from "../shared/config";
import type { AllocationScoreResponse, MarketPrices, MarketMakerState, LiquidityTierString } from "../shared/types";

const TIER_NAMES: LiquidityTierString[] = ["Seed", "Low", "Medium", "High"];

const logger = createLogger("market-maker");

// ── Active market tracking ────────────────────────────────────────────────────

interface TrackedMarket {
  address:      string;
  question:     string;
  category:     string;
  deadline:     number;
  yesPrice:     number;   // 1–99
  noPrice:      number;   // derived: 100 - yesPrice
  lastPriced:   number;   // unix ms
  liquidityTier: number;  // 0=Seed 1=Low 2=Medium 3=High
}

const activeMarkets = new Map<string, TrackedMarket>();
const settlementListeners = new Set<string>();
const tradingListeners = new Set<string>();
let txQueue: Promise<void> = Promise.resolve();
let repricingTickInFlight = false;
let recoveryTickInFlight = false;

async function runQueuedTx<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const run = txQueue.then(fn, fn);
  txQueue = run.then(
    () => undefined,
    (err) => {
      logger.error("Queued transaction failed", {
        label,
        err,
      });
    }
  );
  return run;
}

// ── Repricing interval by liquidity tier ─────────────────────────────────────
// Higher tier → more capital → more frequent repricing

function getRepricingInterval(tier: number): number {
  const base = cfgNum("REPRICE_INTERVAL_MS");
  switch (tier) {
    case 3: return Math.floor(base * 0.5);   // High:   0.5x interval
    case 2: return Math.floor(base * 1.0);   // Medium: base interval
    case 1: return Math.floor(base * 2.0);   // Low:    2x interval
    default: return Math.floor(base * 4.0);  // Seed:   4x interval
  }
}

// ── Price a single market ─────────────────────────────────────────────────────

/**
 * Calls 0G Compute for a pricing estimate and writes the result to 0G Storage.
 * Safe to call multiple times — always overwrites previous price with newest.
 */
async function priceMarket(
  marketAddress: string,
  question:      string,
  category:      string,
  deadline:      number,
  liquidityTier: number,
  mmWallet:      ReturnType<typeof createWallet>
): Promise<number> {
  logger.info("Pricing market via 0G Compute...", { market: marketAddress, question });

  let yesProbability: number;
  try {
    const market = getMarket(marketAddress, mmWallet);
    const state = await market.getAmmState(ethers.ZeroAddress) as readonly [
      bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint
    ];
    if (state[0] > BigInt(0) && state[1] > BigInt(0)) {
      yesProbability = Math.round(Number(state[6]) / 100);
      logger.info("Using on-chain AMM price", { market: marketAddress, yesProbability });
    } else {
      const result = await callPricingInference(question, deadline, mmWallet);
      yesProbability = result.yesProbability;
      logger.info("0G Compute pricing result", {
        market: marketAddress,
        yesProbability,
        rationale: result.rationale,
      });
    }
  } catch (err) {
    logger.error("0G Compute pricing failed — using default 50/50", err);
    yesProbability = 50;
  }

  const prices: MarketPrices = {
    yesPrice:   yesProbability,
    noPrice:    100 - yesProbability,
    lastUpdated: Date.now(),
    volume24h:  "0",   // TODO: compute from on-chain events when time permits
  };

  try {
    const rootHash = await writeMarketPrices(marketAddress, prices, mmWallet);
    logger.info("Prices written to 0G Storage", { market: marketAddress, rootHash });
  } catch (err) {
    logger.warn("0G Storage price write failed (non-fatal)", { message: err instanceof Error ? err.message : String(err) });
  }

  // Update in-memory tracker
  const existing = activeMarkets.get(marketAddress.toLowerCase());
  if (existing) {
    existing.yesPrice   = yesProbability;
    existing.noPrice    = 100 - yesProbability;
    existing.lastPriced = Date.now();
    existing.category   = category;
  } else {
    activeMarkets.set(marketAddress.toLowerCase(), {
      address:      marketAddress,
      question,
      category,
      deadline,
      yesPrice:     yesProbability,
      noPrice:      100 - yesProbability,
      lastPriced:   Date.now(),
      liquidityTier,
    });
  }

  // Push prices to the frontend API so the UI reflects live quotes immediately
  pushPriceToFrontend(marketAddress, yesProbability);

  return yesProbability;
}

// ── Push prices to frontend price cache ──────────────────────────────────────

function pushPriceToFrontend(marketAddress: string, yesProbability: number): void {
  const frontendUrl = process.env.FRONTEND_API_URL ?? "http://localhost:3000";
  const url = `${frontendUrl}/api/prices`;
  fetch(url, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      market:      marketAddress,
      yesPrice:    yesProbability,
      noPrice:     100 - yesProbability,
      lastUpdated: Date.now(),
    }),
  }).then((r) => {
    if (!r.ok) logger.warn("Frontend price push non-2xx", { status: r.status });
    else logger.debug("Pushed price to frontend", { market: marketAddress, yesProbability });
  }).catch((err: unknown) => {
    logger.warn("Frontend price push failed (non-fatal)", { error: err instanceof Error ? err.message : String(err) });
  });
}

async function pushOnChainAmmPrice(
  marketAddress: string,
  provider:      ReturnType<typeof createProvider>
): Promise<void> {
  try {
    const market = getMarket(marketAddress, provider);
    const state = await market.getAmmState(ethers.ZeroAddress) as readonly [
      bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint
    ];
    const yesPrice = Number(state[6]) / 100;
    if (!Number.isFinite(yesPrice) || yesPrice <= 0) return;
    pushPriceToFrontend(marketAddress, Math.round(yesPrice));
  } catch (err) {
    logger.warn("Failed to push on-chain AMM price", { market: marketAddress, err });
  }
}

// ── Persist global MM state to 0G Storage ────────────────────────────────────

async function persistMMState(mmWallet: ReturnType<typeof createWallet>): Promise<void> {
  const state: MarketMakerState = {
    activeMarkets: Array.from(activeMarkets.values()).map((m) => ({
      address:  m.address,
      yesPrice: m.yesPrice,
      noPrice:  m.noPrice,
      tier:     TIER_NAMES[m.liquidityTier] ?? "Seed",
    })),
    lastRun: Date.now(),
  };

  try {
    await writeMMState(state, mmWallet);
    logger.debug("MM state persisted to 0G Storage", {
      marketCount: state.activeMarkets.length,
    });
  } catch (err) {
    logger.warn("MM state write failed (non-fatal)", err);
  }
}

// ── Allocate pool liquidity to a new market ───────────────────────────────────

/**
 * Tier → target BPS mapping.
 *
 * Seed  (0): minBps          — just enough to show a live spread on a brand-new market
 * Low   (1): min + range/3   — small but meaningful; some bettors have joined
 * Medium(2): min + range*2/3 — solid volume; worth deeper liquidity
 * High  (3): maxBps          — top-tier market; deploy maximum capital
 *
 * All values are clamped between minBps and maxBps from the contract.
 */
function tierToBps(tier: number, minBps: bigint, maxBps: bigint): bigint {
  const range = maxBps - minBps;
  switch (tier) {
    case 0:  return minBps;                          // Seed
    case 1:  return minBps + range / BigInt(3);      // Low
    case 2:  return minBps + (range * BigInt(2)) / BigInt(3); // Medium
    case 3:  return maxBps;                          // High
    default: return minBps;
  }
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function localAllocationScore(
  question: string,
  category: string,
  deadline: number,
  tier: number,
  totalCollateral: bigint
): AllocationScoreResponse {
  const normalized = question.trim().toLowerCase();
  const hoursToDeadline = Math.max(0, (deadline * 1000 - Date.now()) / 3_600_000);
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;

  let resolvability = 50;
  if (normalized.endsWith("?")) resolvability += 8;
  if (/\b(will|does|did|is|are|has|have|before|by|on or before)\b/.test(normalized)) resolvability += 12;
  if (/\b(best|popular|important|successful|good|bad|major|significant)\b/.test(normalized)) resolvability -= 22;
  if (wordCount >= 7 && wordCount <= 28) resolvability += 10;
  if (wordCount < 5 || wordCount > 40) resolvability -= 12;

  const categoryBase: Record<string, number> = {
    crypto: 72,
    sports: 70,
    politics: 66,
    finance: 64,
    ai: 62,
    custom: 52,
  };
  let demand = categoryBase[category.toLowerCase()] ?? categoryBase.custom;
  if (tier >= 1) demand += 12;
  if (tier >= 2) demand += 10;
  if (totalCollateral >= BigInt(100e6)) demand += 8;

  let deadlineScore = 58;
  if (hoursToDeadline < 6) deadlineScore = 25;
  else if (hoursToDeadline <= 24 * 14) deadlineScore = 76;
  else if (hoursToDeadline <= 24 * 90) deadlineScore = 66;
  else if (hoursToDeadline > 24 * 365) deadlineScore = 36;

  let manipulationRisk = 34;
  if (/\b(tweet|post|like|poll|price of|floor price|volume|followers)\b/.test(normalized)) manipulationRisk += 18;
  if (/\b(my|our|this project|prophet)\b/.test(normalized)) manipulationRisk += 10;
  if (resolvability < 45) manipulationRisk += 14;
  if (tier >= 2) manipulationRisk -= 8;

  resolvability = clampScore(resolvability);
  demand = clampScore(demand);
  manipulationRisk = clampScore(manipulationRisk);

  const score = clampScore(
    resolvability * 0.38 +
    demand * 0.28 +
    deadlineScore * 0.18 +
    (100 - manipulationRisk) * 0.16
  );

  return {
    score,
    resolvability,
    demand,
    manipulationRisk,
    rationale: "Local fallback scored resolvability, expected demand, deadline quality, and manipulation risk.",
  };
}

function scoreToBps(score: number, minBps: bigint, maxBps: bigint): bigint {
  const clamped = BigInt(clampScore(score));
  const range = maxBps - minBps;
  return minBps + (range * clamped) / BigInt(100);
}

function maxBigint(a: bigint, b: bigint): bigint {
  return a > b ? a : b;
}

async function getAllocationScore(
  question: string,
  category: string,
  deadline: number,
  tier: number,
  totalCollateral: bigint,
  mmWallet: ReturnType<typeof createWallet>
): Promise<AllocationScoreResponse> {
  try {
    return await callAllocationScoring(question, category, deadline, mmWallet);
  } catch (err) {
    const fallback = localAllocationScore(question, category, deadline, tier, totalCollateral);
    logger.warn("0G Compute allocation scoring failed — using local fallback", {
      error: err instanceof Error ? err.message : String(err),
      score: fallback.score,
      resolvability: fallback.resolvability,
      demand: fallback.demand,
      manipulationRisk: fallback.manipulationRisk,
    });
    return fallback;
  }
}

/**
 * Allocates initial pool liquidity for a market, scaled by market quality/risk.
 *
 * The pool is a neutral market initializer, not a directional trader. We only
 * seed a market once; later top-ups would add complete sets after traders have
 * moved the AMM and could pull price back toward 50/50.
 */
async function allocateLiquidityToMarket(
  marketAddress: string,
  question:      string,
  category:      string,
  deadline:      number,
  tier:          number,
  totalCollateral: bigint,
  mmWallet:      ReturnType<typeof createWallet>
): Promise<void> {
  const pool = getLiquidityPool(mmWallet);
  if (!pool) {
    logger.info("LIQUIDITY_POOL_ADDRESS not set — skipping allocation", { market: marketAddress });
    return;
  }

  try {
    const [existing, available, poolValue, maxBps, minBps] = await Promise.all([
      pool.marketAllocation(marketAddress) as Promise<bigint>,
      pool.availableLiquidity()            as Promise<bigint>,
      pool.totalPoolValue()                as Promise<bigint>,
      pool.maxAllocationBps()              as Promise<bigint>,
      pool.minAllocationBps()              as Promise<bigint>,
    ]);

    if (poolValue === BigInt(0)) {
      logger.warn("Pool has no value — skipping allocation", { market: marketAddress });
      return;
    }

    const allocationScore = await getAllocationScore(
      question,
      category,
      deadline,
      tier,
      totalCollateral,
      mmWallet
    );
    if (existing > BigInt(0)) {
      logger.info("Market already has initial pool liquidity — skipping top-up", {
        market: marketAddress,
        existing: existing.toString(),
      });
      return;
    }

    const tierFloorBps = tierToBps(tier, minBps, maxBps);
    const scoreBps     = scoreToBps(allocationScore.score, minBps, maxBps);
    const targetBps    = maxBigint(tierFloorBps, scoreBps);
    const targetAmount = (poolValue * targetBps) / BigInt(10_000);

    const finalAmount = targetAmount > available ? available : targetAmount;

    if (finalAmount === BigInt(0)) {
      logger.warn("Pool has no available liquidity for initial allocation", {
        market:    marketAddress,
        needed:    targetAmount.toString(),
        available: available.toString(),
      });
      return;
    }

    logger.info("Allocating pool liquidity to market", {
      market:    marketAddress,
      tier:      TIER_NAMES[tier] ?? "Seed",
      targetBps: targetBps.toString(),
      score:     allocationScore.score,
      resolvability: allocationScore.resolvability,
      demand: allocationScore.demand,
      manipulationRisk: allocationScore.manipulationRisk,
      rationale: allocationScore.rationale,
      amount:    finalAmount.toString(),
      existing:  existing.toString(),
    });

    const tx      = await runQueuedTx("allocateToMarket", () =>
      pool.allocateToMarket(marketAddress, finalAmount)
    );
    const receipt = await tx.wait();

    logger.info("Pool liquidity allocated", {
      market: marketAddress,
      tier:   TIER_NAMES[tier] ?? "Seed",
      amount: finalAmount.toString(),
      txHash: receipt.hash,
      block:  receipt.blockNumber,
    });
  } catch (err) {
    // Non-fatal — market still works without pool liquidity
    logger.error("Failed to allocate pool liquidity to market", {
      market: marketAddress,
      err,
    });
  }
}

// ── Return settled pool liquidity ────────────────────────────────────────────

async function returnLiquidityToPool(
  marketAddress: string,
  mmWallet:      ReturnType<typeof createWallet>
): Promise<void> {
  const pool = getLiquidityPool(mmWallet);
  const poolAddress = cfg("LIQUIDITY_POOL_ADDRESS");
  if (!pool || !poolAddress) return;

  try {
    const allocation = await pool.marketAllocation(marketAddress) as bigint;
    if (allocation === BigInt(0)) return;

    const market = getMarket(marketAddress, mmWallet);
    logger.info("Returning settled market liquidity to pool", {
      market: marketAddress,
      allocation: allocation.toString(),
    });

    const tx = await runQueuedTx("returnLiquidityToPool", () =>
      market.returnLiquidityToPool(poolAddress)
    );
    const receipt = await tx.wait();

    logger.info("Settled liquidity returned to pool", {
      market: marketAddress,
      txHash: receipt.hash,
      block: receipt.blockNumber,
    });
  } catch (err) {
    logger.error("Failed to return liquidity to pool", { market: marketAddress, err });
  }
}

function attachSettlementListeners(
  marketAddress: string,
  mmWallet:      ReturnType<typeof createWallet>,
  provider:      ReturnType<typeof createProvider>
): void {
  const key = marketAddress.toLowerCase();
  if (settlementListeners.has(key)) return;
  settlementListeners.add(key);

  const marketContract = getMarket(marketAddress, provider);

  listenForEvent<[string, boolean, bigint, unknown]>(
    marketContract,
    "ResolutionFinalized",
    async (market) => {
      await returnLiquidityToPool(market, mmWallet);
    }
  );

  listenForEvent<[string, string, unknown]>(
    marketContract,
    "MarketCancelled",
    async (market) => {
      await returnLiquidityToPool(market, mmWallet);
    }
  );
}

function attachTradingListeners(
  marketAddress: string,
  provider:      ReturnType<typeof createProvider>
): void {
  const key = marketAddress.toLowerCase();
  if (tradingListeners.has(key)) return;
  tradingListeners.add(key);

  const marketContract = getMarket(marketAddress, provider);
  const refresh = async (market: string) => {
    await pushOnChainAmmPrice(market, provider);
  };

  listenForEvent<[string, string, boolean, bigint, bigint, bigint, unknown]>(
    marketContract,
    "SharesPurchased",
    async (market) => refresh(market)
  );

  listenForEvent<[string, string, boolean, bigint, bigint, bigint, unknown]>(
    marketContract,
    "SharesSold",
    async (market) => refresh(market)
  );
}

// ── Handle new market created ─────────────────────────────────────────────────

async function handleMarketCreated(
  marketAddress: string,
  mmWallet:      ReturnType<typeof createWallet>,
  provider:      ReturnType<typeof createProvider>
): Promise<void> {
  logger.info("New market created — fetching info and pricing", {
    market: marketAddress,
  });

  try {
    const info = await getMarketInfo(marketAddress, provider);

    if (info.status !== "Open" && info.status !== "Pending") {
      logger.info("Market not in priceable state — skipping", {
        market: marketAddress,
        status: info.status,
      });
      return;
    }

    const market = getMarket(marketAddress, provider);
    const tier   = Number(await market.liquidityTier()) as number;

    // Run pricing and allocation in parallel. Allocation now has its own
    // risk score, so it no longer gives every Seed market the same amount.
    await Promise.all([
      priceMarket(marketAddress, info.question, info.category, info.deadline, tier, mmWallet),
      allocateLiquidityToMarket(
        marketAddress,
        info.question,
        info.category,
        info.deadline,
        tier,
        info.totalCollateral,
        mmWallet
      ),
    ]);

    await persistMMState(mmWallet);
  } catch (err) {
    logger.error("Failed to handle MarketCreated", { market: marketAddress, err });
  }
}

// ── Repricing loop ────────────────────────────────────────────────────────────

/**
 * Runs continuously. On each tick, checks every tracked market:
 *   - If enough time has passed since last pricing (per liquidityTier interval),
 *     calls 0G Compute for a fresh quote.
 *   - Skips markets past their deadline.
 *   - Removes resolved/cancelled markets from the active set.
 */
async function startRepricingLoop(
  mmWallet: ReturnType<typeof createWallet>,
  provider: ReturnType<typeof createProvider>
): Promise<void> {
  const loopInterval = cfgNum("REPRICE_INTERVAL_MS"); // default 5 min

  logger.info("Starting repricing loop", { intervalMs: loopInterval });

  setInterval(async () => {
    if (repricingTickInFlight) {
      logger.warn("Skipping repricing tick — previous tick still running");
      return;
    }
    repricingTickInFlight = true;
    const now = Date.now();

    try {
      logger.debug(`Repricing tick — ${activeMarkets.size} tracked markets`);

      for (const [addr, tracked] of activeMarkets) {
        try {
          // Skip if market deadline has passed
          if (tracked.deadline * 1000 < now) {
            logger.info("Market past deadline — removing from tracker", {
              market: tracked.address,
            });
            activeMarkets.delete(addr);
            continue;
          }

          // Check if it's time to reprice based on tier
          const interval = getRepricingInterval(tracked.liquidityTier);
          if (now - tracked.lastPriced < interval) {
            continue;
          }

          // Verify market is still Open before repricing
          const info = await getMarketInfo(tracked.address, provider);
          if (info.status !== "Open") {
            logger.info("Market no longer Open — removing from repricing", {
              market: tracked.address,
              status: info.status,
            });
            activeMarkets.delete(addr);
            continue;
          }

          // Skip 0G Compute call if market has zero collateral (no bettors yet)
          // — saves inference credits on empty Seed-tier markets
          if (info.totalCollateral === BigInt(0)) {
            logger.debug("Market has no collateral — skipping reprice to save compute credits", {
              market: tracked.address,
            });
            continue;
          }

          // Check if tier has increased since last reprice — top up allocation if so
          const market      = getMarket(tracked.address, provider);
          const currentTier = Number(await market.liquidityTier()) as number;
          if (currentTier !== tracked.liquidityTier) {
            logger.info("Market tier changed — updating allocation", {
              market:  tracked.address,
              oldTier: TIER_NAMES[tracked.liquidityTier] ?? "Seed",
              newTier: TIER_NAMES[currentTier] ?? "Seed",
            });
            tracked.liquidityTier = currentTier;
            await allocateLiquidityToMarket(
              tracked.address,
              tracked.question,
              tracked.category,
              tracked.deadline,
              currentTier,
              info.totalCollateral,
              mmWallet
            );
          }

          // Reprice
          await priceMarket(
            tracked.address,
            tracked.question,
            tracked.category,
            tracked.deadline,
            tracked.liquidityTier,
            mmWallet
          );
        } catch (err) {
          logger.error("Repricing failed for market", { market: tracked.address, err });
        }
      }

      // Persist updated MM state after each tick
      if (activeMarkets.size > 0) {
        await persistMMState(mmWallet);
      }
    } finally {
      repricingTickInFlight = false;
    }
  }, loopInterval);
}

// ── Startup scan ──────────────────────────────────────────────────────────────

/**
 * On startup, find all Open markets and ensure they have:
 *   1. Price quotes (from 0G Compute)
 *   2. Pool liquidity allocation (from LiquidityPool)
 *
 * This is the crash-recovery path — any market created while the agent
 * was offline gets fully caught up here before we start listening for events.
 */
async function seedExistingMarkets(
  mmWallet: ReturnType<typeof createWallet>,
  provider: ReturnType<typeof createProvider>
): Promise<void> {
  logger.info("Scanning for existing Open markets to seed prices and liquidity...");

  const markets = await getAllActiveMarkets(provider);
  logger.info(`Found ${markets.length} total markets`);

  let seeded = 0;
  for (const addr of markets) {
    try {
      const info = await getMarketInfo(addr, provider);

      if (info.status !== "Open") continue;
      if (info.deadline * 1000 < Date.now()) continue;

      const market = getMarket(addr, provider);
      const tier   = Number(await market.liquidityTier()) as number;

      logger.info("Seeding existing Open market", {
        market: addr,
        question: info.question,
        tier,
      });

      await Promise.all([
        priceMarket(addr, info.question, info.category, info.deadline, tier, mmWallet),
        allocateLiquidityToMarket(
          addr,
          info.question,
          info.category,
          info.deadline,
          tier,
          info.totalCollateral,
          mmWallet
        ),
      ]);
      attachSettlementListeners(addr, mmWallet, provider);
      attachTradingListeners(addr, provider);
      await pushOnChainAmmPrice(addr, provider);

      seeded++;

      // Small delay between markets to avoid hammering 0G Compute
      await new Promise((r) => setTimeout(r, 2_000));
    } catch (err) {
      logger.error("Failed to seed market", { market: addr, err });
    }
  }

  logger.info(`Seeded prices for ${seeded} markets`);

  if (seeded > 0) {
    await persistMMState(mmWallet);
  }
}

async function recoverSettledLiquidity(
  mmWallet: ReturnType<typeof createWallet>,
  provider: ReturnType<typeof createProvider>
): Promise<void> {
  const markets = await getAllActiveMarkets(provider);

  for (const addr of markets) {
    try {
      attachSettlementListeners(addr, mmWallet, provider);
      attachTradingListeners(addr, provider);
      const info = await getMarketInfo(addr, provider);
      if (info.status === "Resolved" || info.status === "Cancelled") {
        await returnLiquidityToPool(addr, mmWallet);
      }
    } catch (err) {
      logger.warn("Failed settled-liquidity recovery check", { market: addr, err });
    }
  }
}

function startRecoveryLoop(
  mmWallet: ReturnType<typeof createWallet>,
  provider: ReturnType<typeof createProvider>
): void {
  const intervalMs = cfgNum("RECOVERY_INTERVAL_MS");
  logger.info("Starting market-maker recovery loop", { intervalMs });

  setInterval(async () => {
    if (recoveryTickInFlight) {
      logger.warn("Skipping recovery tick — previous tick still running");
      return;
    }

    recoveryTickInFlight = true;
    try {
      await recoverSettledLiquidity(mmWallet, provider);
    } catch (err) {
      logger.error("Market-maker recovery loop failed", { err });
    } finally {
      recoveryTickInFlight = false;
    }
  }, intervalMs);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  logger.info("==============================================");
  logger.info("  Prophet Market Maker Agent — starting up");
  logger.info("  Powered by 0G Compute + 0G Storage");
  logger.info("==============================================");

  // Validate the only truly required env var for the market maker
  if (!process.env.PRIVATE_KEY_MM) {
    throw new Error("Missing required environment variable: PRIVATE_KEY_MM");
  }

  const provider = createProvider();
  const mmWallet = createWallet(process.env.PRIVATE_KEY_MM!, provider);

  logger.info("Market maker wallet", { address: mmWallet.address });
  logger.info("0G Chain RPC",        { rpc: cfg("OG_CHAIN_RPC") });
  logger.info("0G Compute provider", { address: cfg("COMPUTE_PROVIDER_ADDRESS") });
  logger.info("Reprice interval",    { ms: cfgNum("REPRICE_INTERVAL_MS") });

  // Check balance
  const balance = await provider.getBalance(mmWallet.address);
  logger.info("Wallet balance", { balance: ethers.formatEther(balance) + " 0G" });

  // Seed prices for all existing Open markets
  await seedExistingMarkets(mmWallet, provider);
  await recoverSettledLiquidity(mmWallet, provider);
  startRecoveryLoop(mmWallet, provider);

  // Start repricing loop
  await startRepricingLoop(mmWallet, provider);

  // Listen for new markets being created
  const factory = getFactory(provider);

  listenForEvent<[string, string, string, bigint, string, string, bigint, unknown]>(
    factory,
    "MarketCreated",
    async (marketAddress) => {
      logger.info("MarketCreated event received", { market: marketAddress });

      // Wait a moment for the market contract to be fully initialized
      await new Promise((r) => setTimeout(r, 3_000));
      attachSettlementListeners(marketAddress, mmWallet, provider);
      attachTradingListeners(marketAddress, provider);
      await handleMarketCreated(marketAddress, mmWallet, provider);
      await pushOnChainAmmPrice(marketAddress, provider);
    }
  );

  logger.info("Market maker agent running — listening for events + repricing loop active");
}

main().catch((err) => {
  console.error("[FATAL] Market maker agent crashed:", err);
  process.exit(1);
});
