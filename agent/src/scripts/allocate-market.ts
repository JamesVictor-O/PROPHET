// ─────────────────────────────────────────────────────────────────────────────
// One-shot: allocate LP liquidity to a specific market.
//
// Usage:
//   cd agent
//   npx tsx src/scripts/allocate-market.ts <marketAddress>
//
// Useful for markets that were created while the agent was offline or while
// 0G Compute was hanging (which blocked allocation in handleMarketCreated).
// ─────────────────────────────────────────────────────────────────────────────

import "dotenv/config";
import { ethers } from "ethers";

const GREEN  = "\x1b[32m✓\x1b[0m";
const RED    = "\x1b[31m✗\x1b[0m";
const YELLOW = "\x1b[33m⚠\x1b[0m";
const BOLD   = "\x1b[1m";
const RESET  = "\x1b[0m";

const CHAIN_RPC    = process.env.OG_CHAIN_RPC    || "https://evmrpc-testnet.0g.ai";
const LP_ADDRESS   = process.env.LIQUIDITY_POOL_ADDRESS || "0x1A39bD969870e71d22A10b38F2845baBB56649A4";
const RAW_KEY      = process.env.PRIVATE_KEY_MM;

const LP_ABI = [
  "function availableLiquidity() view returns (uint256)",
  "function totalPoolValue() view returns (uint256)",
  "function marketAllocation(address market) view returns (uint256)",
  "function maxAllocationBps() view returns (uint256)",
  "function minAllocationBps() view returns (uint256)",
  "function allocateToMarket(address market, uint256 amount)",
];

const MARKET_ABI = [
  "function question() view returns (string)",
  "function status() view returns (uint8)",
  "function liquidityTier() view returns (uint8)",
];

const TIER_NAMES = ["Seed", "Low", "Medium", "High"];

function tierToBps(tier: number, minBps: bigint, maxBps: bigint): bigint {
  const range = maxBps - minBps;
  switch (tier) {
    case 0:  return minBps;
    case 1:  return minBps + range / BigInt(3);
    case 2:  return minBps + (range * BigInt(2)) / BigInt(3);
    case 3:  return maxBps;
    default: return minBps;
  }
}

async function main() {
  const marketAddress = process.argv[2];
  if (!marketAddress || !/^0x[0-9a-fA-F]{40}$/.test(marketAddress)) {
    console.error(`\nUsage: npx tsx src/scripts/allocate-market.ts <0xMarketAddress>\n`);
    process.exit(1);
  }

  if (!RAW_KEY) { console.error(`${RED} PRIVATE_KEY_MM not set in .env`); process.exit(1); }

  console.log(`\n${BOLD}═══════════════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}  Prophet — Manual LP Allocation${RESET}`);
  console.log(`${BOLD}═══════════════════════════════════════════════════════${RESET}\n`);

  const provider = new ethers.JsonRpcProvider(CHAIN_RPC);
  const key      = RAW_KEY.startsWith("0x") ? RAW_KEY : `0x${RAW_KEY}`;
  const wallet   = new ethers.Wallet(key, provider);
  console.log(`  ${GREEN} Wallet: ${wallet.address}`);

  const pool   = new ethers.Contract(LP_ADDRESS, LP_ABI, wallet);
  const market = new ethers.Contract(marketAddress, MARKET_ABI, provider);

  // Read market state
  const [question, statusRaw, tierRaw] = await Promise.all([
    market.question() as Promise<string>,
    market.status()   as Promise<bigint>,
    market.liquidityTier() as Promise<bigint>,
  ]);
  const tier   = Number(tierRaw);
  const status = Number(statusRaw);

  console.log(`\n  Market: "${question}"`);
  console.log(`  Status: ${status} (${["Pending","Open","PendingResolution","Challenged","Resolved","Cancelled","Archived"][status] ?? "?"})`);
  console.log(`  Tier:   ${tier} (${TIER_NAMES[tier] ?? "?"})`);

  if (status !== 1) {
    console.log(`\n  ${YELLOW} Market is not Open — skipping allocation\n`);
    process.exit(0);
  }

  // Read pool state
  const [existing, available, poolValue, maxBps, minBps] = await Promise.all([
    pool.marketAllocation(marketAddress) as Promise<bigint>,
    pool.availableLiquidity()            as Promise<bigint>,
    pool.totalPoolValue()                as Promise<bigint>,
    pool.maxAllocationBps()              as Promise<bigint>,
    pool.minAllocationBps()              as Promise<bigint>,
  ]);

  console.log(`\n  Pool value:  ${(Number(poolValue) / 1e6).toFixed(2)} USDT`);
  console.log(`  Available:   ${(Number(available) / 1e6).toFixed(2)} USDT`);
  console.log(`  Existing:    ${(Number(existing) / 1e6).toFixed(2)} USDT`);

  if (existing > BigInt(0)) {
    console.log(`\n  ${GREEN} Market already has ${(Number(existing) / 1e6).toFixed(2)} USDT allocated — nothing to do\n`);
    process.exit(0);
  }

  const targetBps    = tierToBps(tier, minBps, maxBps);
  const targetAmount = (poolValue * targetBps) / BigInt(10_000);
  const finalAmount  = targetAmount > available ? available : targetAmount;

  console.log(`  Target BPS:  ${targetBps.toString()} (${TIER_NAMES[tier] ?? "?"} tier)`);
  console.log(`  Allocating:  ${(Number(finalAmount) / 1e6).toFixed(2)} USDT`);

  if (finalAmount === BigInt(0)) {
    console.log(`\n  ${YELLOW} Nothing to allocate (pool empty or tier=0)\n`);
    process.exit(0);
  }

  console.log(`\n  Sending allocateToMarket tx...`);
  try {
    const tx      = await pool.allocateToMarket(marketAddress, finalAmount);
    console.log(`  Tx hash: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`  ${GREEN} Allocated ${(Number(finalAmount) / 1e6).toFixed(2)} USDT to market`);
    console.log(`  Block: ${receipt.blockNumber}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  ${RED} Allocation failed: ${msg}`);
  }

  console.log(`\n${BOLD}═══════════════════════════════════════════════════════${RESET}\n`);
}

main().catch((err) => { console.error("[FATAL]", err); process.exit(1); });
