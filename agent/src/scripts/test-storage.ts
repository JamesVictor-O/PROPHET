// ─────────────────────────────────────────────────────────────────────────────
// 0G Storage diagnostic script
//
// Checks:
//   1. Can we write to 0G Storage? (test round-trip)
//   2. Can we read existing market metadata hashes from the chain?
//   3. Does each market's 0G Storage blob contain an aiOverview?
//
// Usage:
//   cd agent
//   npx tsx src/scripts/test-storage.ts
// ─────────────────────────────────────────────────────────────────────────────

import "dotenv/config";
import { ethers }              from "ethers";
import { Indexer, MemData }    from "@0gfoundation/0g-storage-ts-sdk";
import { promises as fs }      from "fs";
import { tmpdir }              from "os";
import { join }                from "path";
import { randomBytes }         from "crypto";

// ── Helpers ───────────────────────────────────────────────────────────────────

const GREEN  = "\x1b[32m✓\x1b[0m";
const RED    = "\x1b[31m✗\x1b[0m";
const YELLOW = "\x1b[33m⚠\x1b[0m";
const BOLD   = "\x1b[1m";
const RESET  = "\x1b[0m";
const DIM    = "\x1b[2m";

function pass(label: string, detail?: string) {
  console.log(`  ${GREEN} ${label}${detail ? `  ${DIM}→  ${detail}${RESET}` : ""}`);
}
function fail(label: string, err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  console.log(`  ${RED} ${label}`);
  console.log(`       ${msg}`);
}
function warn(label: string, detail?: string) {
  console.log(`  ${YELLOW} ${label}${detail ? `  ${DIM}→  ${detail}${RESET}` : ""}`);
}
function section(title: string) {
  console.log(`\n${BOLD}${title}${RESET}`);
}
function info(msg: string) {
  console.log(`  ${DIM}${msg}${RESET}`);
}

// ── Minimal ABIs ──────────────────────────────────────────────────────────────

const FACTORY_ABI = [
  "function getMarkets(uint256 offset, uint256 limit) external view returns (address[])",
  "function totalMarkets() external view returns (uint256)",
];

const MARKET_ABI = [
  "function question() external view returns (string)",
  "function resolutionSourcesHash() external view returns (bytes32)",
  "function status() external view returns (uint8)",
];

// ── Storage helpers ───────────────────────────────────────────────────────────

async function upload(
  data: unknown,
  signer: ethers.Wallet,
  indexerRpc: string,
  chainRpc: string
): Promise<string> {
  const indexer  = new Indexer(indexerRpc);
  const buffer   = Buffer.from(JSON.stringify(data, null, 2));
  const memData  = new MemData(buffer);

  const [, treeErr] = await memData.merkleTree();
  if (treeErr) throw new Error(`Merkle tree error: ${treeErr}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, err] = await indexer.upload(memData, chainRpc, signer as any);
  if (err) throw new Error(`Upload error: ${err}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = result as any;
  return (r.rootHash ?? r.rootHashes?.[0]) as string;
}

async function download<T = unknown>(rootHash: string, indexerRpc: string): Promise<T> {
  const indexer = new Indexer(indexerRpc);
  const tmpFile = join(tmpdir(), `prophet-diag-${randomBytes(6).toString("hex")}.json`);

  const err = await indexer.download(rootHash, tmpFile, false);
  if (err) throw new Error(`Download error: ${err}`);

  try {
    const content = await fs.readFile(tmpFile, "utf8");
    return JSON.parse(content) as T;
  } finally {
    await fs.unlink(tmpFile).catch(() => {});
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${BOLD}═══════════════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}  Prophet × 0G Storage — Diagnostic${RESET}`);
  console.log(`${BOLD}═══════════════════════════════════════════════════════${RESET}`);

  // ── Step 1: Environment ───────────────────────────────────────────────────
  section("1. Environment");

  const CHAIN_RPC    = process.env.OG_CHAIN_RPC    || "https://evmrpc-testnet.0g.ai";
  const INDEXER_RPC  = process.env.OG_INDEXER_RPC  || "https://indexer-storage-testnet-turbo.0g.ai";
  const FACTORY_ADDR = process.env.PROPHET_FACTORY_ADDRESS || "0xCEd9B4405b9B7d09f6b7d44e6bA113EcF2627333";
  const RAW_KEY      = process.env.PRIVATE_KEY_ORACLE;

  pass("OG_CHAIN_RPC",    CHAIN_RPC);
  pass("OG_INDEXER_RPC",  INDEXER_RPC);
  pass("FACTORY_ADDRESS", FACTORY_ADDR);

  if (!RAW_KEY) {
    fail("PRIVATE_KEY_ORACLE", "not set — needed for write test");
    console.log("\n  Set PRIVATE_KEY_ORACLE in .env and re-run.\n");
    process.exit(1);
  }
  pass("PRIVATE_KEY_ORACLE", "***set***");

  // ── Step 2: Connect ───────────────────────────────────────────────────────
  section("2. 0G Chain connection");

  let provider: ethers.JsonRpcProvider;
  let wallet: ethers.Wallet;

  try {
    provider = new ethers.JsonRpcProvider(CHAIN_RPC);
    const network = await provider.getNetwork();
    pass("RPC connected", `chain ID ${network.chainId}`);
  } catch (err) {
    fail("RPC connection failed", err);
    process.exit(1);
  }

  try {
    const key = RAW_KEY.startsWith("0x") ? RAW_KEY : `0x${RAW_KEY}`;
    wallet = new ethers.Wallet(key, provider);
    const balance = await provider.getBalance(wallet.address);
    pass("Wallet", wallet.address);
    pass("Balance", `${parseFloat(ethers.formatEther(balance)).toFixed(4)} 0G`);
    if (balance === 0n) warn("Balance is zero — upload will fail (get 0G from https://faucet.0g.ai)");
  } catch (err) {
    fail("Wallet setup failed", err);
    process.exit(1);
  }

  // ── Step 3: Write test ────────────────────────────────────────────────────
  section("3. 0G Storage — write test");

  const testPayload = {
    source:    "prophet-storage-diagnostic",
    timestamp: Date.now(),
    message:   "Hello from 0G Storage!",
    random:    randomBytes(4).toString("hex"),
  };

  info(`Uploading: ${JSON.stringify(testPayload)}`);

  let writeRootHash: string | null = null;
  try {
    writeRootHash = await upload(testPayload, wallet, INDEXER_RPC, CHAIN_RPC);
    pass("Upload succeeded", writeRootHash);
  } catch (err) {
    fail("Upload failed", err);
    console.log("\n  The write test failed — reads of existing data may still work.\n");
  }

  // ── Step 4: Read test (same blob) ────────────────────────────────────────
  section("4. 0G Storage — read-back test");

  if (writeRootHash) {
    info(`Downloading root hash: ${writeRootHash}`);
    try {
      const result = await download<typeof testPayload>(writeRootHash, INDEXER_RPC);
      pass("Download succeeded");
      if (result.message === testPayload.message && result.random === testPayload.random) {
        pass("Round-trip verified — data matches perfectly");
      } else {
        warn("Data downloaded but content doesn't match — unexpected");
        console.log("  Got:", result);
      }
    } catch (err) {
      fail("Download failed", err);
    }
  } else {
    warn("Skipping read-back test (upload failed)");
  }

  // ── Step 5: Read markets from chain ──────────────────────────────────────
  section("5. Reading markets from ProphetFactory");

  const factory = new ethers.Contract(FACTORY_ADDR, FACTORY_ABI, provider);

  let marketAddresses: string[] = [];
  try {
    const count = await factory.totalMarkets();
    info(`Total markets on-chain: ${count}`);

    if (count === 0n) {
      warn("No markets deployed yet — skipping market metadata checks");
    } else {
      marketAddresses = await factory.getMarkets(0, count);
      pass(`Fetched ${marketAddresses.length} market address(es)`);
    }
  } catch (err) {
    fail("Could not read markets from factory", err);
  }

  // ── Step 6: Check each market's metadata blob ─────────────────────────────
  if (marketAddresses.length > 0) {
    section("6. Checking market metadata in 0G Storage");

    for (const addr of marketAddresses) {
      const market = new ethers.Contract(addr, MARKET_ABI, provider);

      let question = addr;
      let rawHash: string;
      let rootHash: string;

      try {
        question = await market.question();
        rawHash  = await market.resolutionSourcesHash();

        // bytes32 zero means no hash stored
        if (rawHash === "0x" + "00".repeat(32) || rawHash === ethers.ZeroHash) {
          warn(`Market ${addr.slice(0, 10)}…`, "resolutionSourcesHash is zero (not set)");
          info(`  Question: "${question.slice(0, 60)}"`);
          continue;
        }

        // The hash is stored as bytes32; convert to hex string for download
        rootHash = rawHash;
        info(`\n  Market: "${question.slice(0, 60)}"`);
        info(`  Address: ${addr}`);
        info(`  Hash:    ${rootHash}`);
      } catch (err) {
        fail(`Market ${addr.slice(0, 10)}… — could not read on-chain state`, err);
        continue;
      }

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const blob = await download<any>(rootHash, INDEXER_RPC);
        pass(`  Downloaded metadata blob`);

        if (blob.aiOverview) {
          pass(`  aiOverview present`, `"${String(blob.aiOverview).slice(0, 80)}..."`);
        } else {
          warn(`  aiOverview missing`, "market was created before overview generation was added");
          info(`  Available fields: ${Object.keys(blob).join(", ")}`);
        }
      } catch (err) {
        fail(`  0G Storage download failed`, err);
        info(`  Hash: ${rootHash}`);
      }
    }
  } else {
    info("No markets to check.");
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n${BOLD}═══════════════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}  Diagnostic complete${RESET}`);
  console.log(`\n  If write test passed: 0G Storage is healthy.`);
  console.log(`  If markets show "aiOverview missing": those markets were created`);
  console.log(`  before the feature was added — create a new market to test the`);
  console.log(`  full pipeline end-to-end.`);
  console.log(`${BOLD}═══════════════════════════════════════════════════════${RESET}\n`);
}

main().catch((err) => {
  console.error("\n[FATAL]", err);
  process.exit(1);
});
