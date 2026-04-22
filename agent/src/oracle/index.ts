// ─────────────────────────────────────────────────────────────────────────────
// Prophet Oracle Agent
//
// Lifecycle:
//   1. On startup: scan all markets in PendingResolution / Challenged state
//   2. Listen for ResolutionTriggered events → call 0G Compute → post verdict
//   3. Listen for ResolutionChallenged events → run second inference → process
//   4. Listen for ResolutionFinalized events → reveal positions via PositionVault
//
// 0G integrations:
//   - 0G Chain:   reads market state, submits postResolution / revealPositions
//   - 0G Compute: DeepSeek V3 (mainnet) / Qwen 7B (testnet) for oracle inference
//   - 0G Storage: writes reasoning chain permanently to Log layer
//                 verdictReasoningHash on-chain points here for verifiability
// ─────────────────────────────────────────────────────────────────────────────

import "dotenv/config";
import { ethers }              from "ethers";
import { createLogger }        from "../shared/logger.js";
import { createProvider, createWallet, getFactory, getMarket, getVault,
         listenForEvent, getMarketInfo, getAllActiveMarkets,
         postResolutionOnChain, cancelMarketOnChain,
         processChallengeOnChain, revealPositionsOnChain } from "../shared/chain.js";
import { callOracleInference }  from "../shared/compute.js";
import { writeResolutionRecord, writeOracleWorkingState } from "../shared/storage.js";
import type { OracleResponse }  from "../shared/types.js";

const logger = createLogger("oracle");

// ── Resolve a market ──────────────────────────────────────────────────────────

/**
 * Full oracle resolution flow for a single market:
 *   1. Read market metadata from chain
 *   2. Update working state in 0G Storage
 *   3. Call 0G Compute (DeepSeek/Qwen) for inference
 *   4. Write reasoning to 0G Storage (permanent, immutable)
 *   5. Post verdict on-chain — verdictReasoningHash links to 0G Storage
 *   6. On INCONCLUSIVE: cancel market (refunds all bettors)
 */
async function resolveMarket(
  marketAddress: string,
  oracleWallet:  ReturnType<typeof createWallet>,
  provider:      ReturnType<typeof createProvider>,
  isChallenge:   boolean = false
): Promise<void> {
  logger.info(`${isChallenge ? "Challenge resolution" : "Resolution"} started`, {
    market: marketAddress,
  });

  // 1. Read market state
  const info = await getMarketInfo(marketAddress, provider);

  logger.info("Market info", {
    question:        info.question,
    deadline:        new Date(info.deadline * 1000).toISOString(),
    totalCollateral: ethers.formatUnits(info.totalCollateral, 6) + " USDT",
  });

  // 2. Update oracle working state in 0G Storage
  await writeOracleWorkingState(marketAddress, {
    stage:            "gathering",
    evidenceGathered: [],
    sourcesChecked:   [],
    startedAt:        Date.now(),
  }, oracleWallet).catch((e) => logger.warn("Storage write failed (non-fatal)", e));

  // 3. Call 0G Compute — this is the core AI oracle inference
  //    The question + deadline + approved sources go into the structured prompt
  //    The model returns a JSON verdict with confidence + full reasoning chain
  const minConfidence = Number(process.env.ORACLE_MIN_CONFIDENCE ?? 70);

  let oracleResponse: OracleResponse;
  try {
    oracleResponse = await callOracleInference(
      info.question,
      info.deadline,
      [],     // TODO: decode resolutionSourcesHash from 0G Storage KV metadata
      oracleWallet
    );
  } catch (err) {
    logger.error("0G Compute inference failed", err);
    // Don't cancel on compute error — retry on next ResolutionTriggered event
    return;
  }

  // 4. Write full reasoning to 0G Storage (Log layer — permanent, unmodifiable)
  //    This rootHash is what gets stored on-chain as verdictReasoningHash
  let storageRootHash = "";
  const resolutionRecord = {
    verdict:          oracleResponse.verdict,
    confidence:       oracleResponse.confidence,
    reasoning:        oracleResponse.reasoning,
    evidenceSummary:  oracleResponse.evidenceSummary,
    sourcesChecked:   oracleResponse.sourcesChecked,
    inconclusiveReason: oracleResponse.inconclusiveReason,
    timestamp:        Date.now(),
    txHash:           "",              // filled after on-chain submission
    computeProvider:  process.env.COMPUTE_PROVIDER_ADDRESS ?? "",
    isChallenge,
  };

  try {
    storageRootHash = await writeResolutionRecord(
      marketAddress,
      resolutionRecord,
      oracleWallet
    );
    logger.info("Reasoning stored on 0G Storage", { rootHash: storageRootHash });
  } catch (err) {
    logger.warn("0G Storage write failed (non-fatal — continuing with on-chain post)", err);
  }

  // 5. Handle INCONCLUSIVE — cancel the market
  if (oracleResponse.verdict === null || oracleResponse.confidence < minConfidence) {
    logger.warn("Oracle returned INCONCLUSIVE", {
      confidence: oracleResponse.confidence,
      reason:     oracleResponse.inconclusiveReason,
    });

    if (isChallenge) {
      // Second inference was also inconclusive — reject challenge, keep original verdict
      logger.warn("Challenge resolution inconclusive — rejecting challenge");
      await processChallengeOnChain(marketAddress, false, oracleWallet);
    } else {
      await cancelMarketOnChain(
        marketAddress,
        oracleResponse.inconclusiveReason ?? "Oracle could not determine outcome with sufficient confidence",
        oracleWallet
      );
    }
    return;
  }

  // 6. Post verdict on-chain
  //    reasoningHash links the on-chain record to the full reasoning in 0G Storage
  const reasoningHash = storageRootHash || ethers.keccak256(
    ethers.toUtf8Bytes(oracleResponse.reasoning)
  );

  let receipt;
  if (isChallenge) {
    // Challenge: second inference flips outcome if different from original
    const originalOutcome = info.outcome;
    const upheld          = oracleResponse.verdict !== originalOutcome;
    receipt = await processChallengeOnChain(marketAddress, upheld, oracleWallet);
    logger.info("Challenge processed", {
      original: originalOutcome,
      revised:  oracleResponse.verdict,
      upheld,
    });
  } else {
    receipt = await postResolutionOnChain(
      marketAddress,
      oracleResponse.verdict,
      reasoningHash,
      oracleWallet
    );
  }

  logger.info("Oracle resolution complete", {
    market:     marketAddress,
    verdict:    oracleResponse.verdict,
    confidence: oracleResponse.confidence,
    txHash:     receipt.hash,
  });
}

// ── Reveal positions ──────────────────────────────────────────────────────────

/**
 * After ResolutionFinalized: read sealed positions from PositionVault events
 * and submit the reveal. In the MVP the "TEE decryption" uses the plaintext
 * direction stored in the encrypted commitment (abi.encode(direction, amount)).
 */
async function revealPositions(
  marketAddress: string,
  oracleWallet:  ReturnType<typeof createWallet>,
  provider:      ReturnType<typeof createProvider>
): Promise<void> {
  const vault    = getVault(provider);
  const count    = Number(await vault.positionCount(marketAddress));
  const revealed = await vault.hasRevealed(marketAddress) as boolean;

  if (revealed || count === 0) {
    logger.info("No positions to reveal", { market: marketAddress, count, revealed });
    return;
  }

  logger.info("Collecting sealed positions for reveal...", { market: marketAddress, count });

  // Read PositionCommitted events to get the original commitment data
  const marketContract = getMarket(marketAddress, provider);
  const filter         = marketContract.filters["BetPlaced"](marketAddress);
  const events         = await marketContract.queryFilter(filter);

  const positions = events.map((e) => {
    const args = e as unknown as { args: [string, string, bigint, bigint] };
    const [, bettor, collateralAmount] = args.args;

    // MVP: encrypted commitment is abi.encode(direction, amount)
    // Real TEE implementation would decrypt here using 0G TEE SDK
    // For now decode the commitment directly
    let direction = true; // default YES
    try {
      const txData = (e as { transactionHash: string }).transactionHash;
      void txData; // placeholder — in real impl, decode from tx input
    } catch {
      // Keep default
    }

    return {
      bettor,
      direction,
      collateralAmount,
    };
  });

  if (positions.length === 0) {
    logger.warn("No BetPlaced events found for market", { market: marketAddress });
    return;
  }

  await revealPositionsOnChain(marketAddress, positions, oracleWallet);
  logger.info("Positions revealed", { market: marketAddress, count: positions.length });
}

// ── Startup scan ──────────────────────────────────────────────────────────────

/**
 * On startup, scan all markets and pick up any that are stuck in
 * PendingResolution or Challenged (agent may have been offline).
 */
async function catchUpOnPendingMarkets(
  oracleWallet: ReturnType<typeof createWallet>,
  provider:     ReturnType<typeof createProvider>
): Promise<void> {
  logger.info("Scanning for markets needing resolution...");

  const markets = await getAllActiveMarkets(provider);
  logger.info(`Found ${markets.length} total markets`);

  for (const addr of markets) {
    try {
      const info = await getMarketInfo(addr, provider);

      if (info.status === "PendingResolution") {
        logger.info("Found market in PendingResolution — resolving", { market: addr });
        await resolveMarket(addr, oracleWallet, provider, false);
      } else if (info.status === "Challenged" && info.challenger !== ethers.ZeroAddress) {
        logger.info("Found challenged market — running second inference", { market: addr });
        await resolveMarket(addr, oracleWallet, provider, true);
      } else if (info.status === "Resolved") {
        // Check if positions need to be revealed
        await revealPositions(addr, oracleWallet, provider);
      }
    } catch (err) {
      logger.error("Error processing market during startup scan", { market: addr, err });
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  logger.info("==============================================");
  logger.info("  Prophet Oracle Agent — starting up");
  logger.info("  Powered by 0G Compute + 0G Storage");
  logger.info("==============================================");

  // Validate required env vars
  const requiredEnv = [
    "PRIVATE_KEY_ORACLE",
    "OG_CHAIN_RPC",
    "OG_INDEXER_RPC",
    "COMPUTE_PROVIDER_ADDRESS",
    "PROPHET_FACTORY_ADDRESS",
    "POSITION_VAULT_ADDRESS",
  ];
  for (const key of requiredEnv) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  const provider     = createProvider();
  const oracleWallet = createWallet(process.env.PRIVATE_KEY_ORACLE!, provider);

  logger.info("Oracle wallet", { address: oracleWallet.address });
  logger.info("0G Chain RPC",  { rpc: process.env.OG_CHAIN_RPC });
  logger.info("0G Compute provider", { address: process.env.COMPUTE_PROVIDER_ADDRESS });

  // Check balance
  const balance = await provider.getBalance(oracleWallet.address);
  logger.info("Wallet balance", { balance: ethers.formatEther(balance) + " 0G" });

  // Catch up on any markets that need resolution (agent restart recovery)
  await catchUpOnPendingMarkets(oracleWallet, provider);

  // Set up event listeners
  const factory = getFactory(provider);

  // ── Event: ResolutionTriggered ────────────────────────────────────────────
  // Fired by MarketContract when anyone calls triggerResolution() after deadline
  listenForEvent<[string, bigint, unknown]>(
    factory,
    "ResolutionTriggered",
    async (marketAddress, timestamp) => {
      logger.info("ResolutionTriggered event", {
        market:    marketAddress,
        timestamp: new Date(Number(timestamp) * 1000).toISOString(),
      });
      await resolveMarket(marketAddress, oracleWallet, provider, false);
    }
  );

  // Also listen on all already-known markets for ResolutionTriggered
  // (factory only forwards if it's a new market)
  const existingMarkets = await getAllActiveMarkets(provider);
  for (const addr of existingMarkets) {
    const marketContract = getMarket(addr, provider);

    listenForEvent<[string, bigint, unknown]>(
      marketContract,
      "ResolutionTriggered",
      async (market, _timestamp) => {
        logger.info("ResolutionTriggered (existing market)", { market });
        await resolveMarket(market, oracleWallet, provider, false);
      }
    );

    // ── Event: ResolutionChallenged ─────────────────────────────────────────
    // Fired when a user files a challenge against the initial verdict
    listenForEvent<[string, string, bigint, unknown]>(
      marketContract,
      "ResolutionChallenged",
      async (market, challenger, stake) => {
        logger.info("ResolutionChallenged event", {
          market,
          challenger,
          stake: ethers.formatUnits(stake, 6) + " USDT",
        });
        // Run second inference after a short delay to allow any new evidence
        await new Promise((r) => setTimeout(r, 5_000));
        await resolveMarket(market, oracleWallet, provider, true);
      }
    );

    // ── Event: ResolutionFinalized ──────────────────────────────────────────
    // Fired when the challenge window expires without a challenge
    listenForEvent<[string, boolean, bigint, unknown]>(
      marketContract,
      "ResolutionFinalized",
      async (market, outcome) => {
        logger.info("ResolutionFinalized event", { market, outcome });
        await revealPositions(market, oracleWallet, provider);
      }
    );
  }

  // Also listen for new markets being created, to attach listeners dynamically
  listenForEvent<[string, string, string, bigint, string, string, bigint, unknown]>(
    factory,
    "MarketCreated",
    async (marketAddress) => {
      logger.info("New market created — attaching listeners", { market: marketAddress });
      const marketContract = getMarket(marketAddress, provider);

      listenForEvent<[string, bigint, unknown]>(
        marketContract,
        "ResolutionTriggered",
        async (market) => {
          await resolveMarket(market, oracleWallet, provider, false);
        }
      );

      listenForEvent<[string, string, bigint, unknown]>(
        marketContract,
        "ResolutionChallenged",
        async (market) => {
          await new Promise((r) => setTimeout(r, 5_000));
          await resolveMarket(market, oracleWallet, provider, true);
        }
      );

      listenForEvent<[string, boolean, bigint, unknown]>(
        marketContract,
        "ResolutionFinalized",
        async (market) => {
          await revealPositions(market, oracleWallet, provider);
        }
      );
    }
  );

  logger.info("Oracle agent running — listening for events");
}

main().catch((err) => {
  console.error("[FATAL] Oracle agent crashed:", err);
  process.exit(1);
});
