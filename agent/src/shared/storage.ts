// ─────────────────────────────────────────────────────────────────────────────
// 0G Storage integration — Log (immutable) layer for oracle reasoning
//
// Key structure (from CLAUDE.md):
//
// Log Layer (permanent, immutable):
//   market:{address}:resolution      ResolutionRecord
//   market:{address}:prices          MarketPrices
//   market:{address}:metadata        MarketMetadata
//   agent:oracle:working:{address}   OracleWorkingState
//   agent:mm:state                   MarketMakerState
//
// Docs: https://docs.0g.ai/developer-hub/building-on-0g/storage/sdk
// ─────────────────────────────────────────────────────────────────────────────

import { promises as fs } from "fs";
import { tmpdir }         from "os";
import { join }           from "path";
import { randomBytes }    from "crypto";
import { Indexer, MemData } from "@0glabs/0g-ts-sdk";
import type { Wallet }    from "ethers";
import type {
  MarketMetadata,
  MarketPrices,
  OracleWorkingState,
  ResolutionRecord,
  MarketMakerState,
} from "./types";
import { createLogger } from "./logger";
import { cfg } from "./config";

const logger = createLogger("storage");

// ── Storage key helpers ───────────────────────────────────────────────────────

export const StorageKeys = {
  marketMetadata:     (addr: string) => `market:${addr.toLowerCase()}:metadata`,
  marketPrices:       (addr: string) => `market:${addr.toLowerCase()}:prices`,
  oracleWorking:      (addr: string) => `agent:oracle:working:${addr.toLowerCase()}`,
  marketResolution:   (addr: string) => `market:${addr.toLowerCase()}:resolution`,
  marketPayout:       (addr: string) => `market:${addr.toLowerCase()}:payout`,
  oracleHistory:      (addr: string) => `oracle:history:${addr.toLowerCase()}`,
  mmState:            ()             => `agent:mm:state`,
} as const;

// ── Core write/read via Log layer ─────────────────────────────────────────────

/**
 * Upload a JSON object to 0G Storage (Log layer — immutable).
 * Returns the root hash that uniquely identifies this data.
 * Store this root hash on-chain for verifiability.
 *
 * @param data   - JSON-serializable object to store
 * @param signer - Wallet that pays the storage fee in 0G tokens
 * @returns root hash string (store this on-chain)
 */
export async function writeToStorage(
  data: unknown,
  signer: Wallet
): Promise<string> {
  const indexerRpc = cfg("OG_INDEXER_RPC");
  const chainRpc   = cfg("OG_CHAIN_RPC");

  const indexer = new Indexer(indexerRpc);
  const buffer  = Buffer.from(JSON.stringify(data, null, 2));

  // MemData wraps a buffer for in-memory upload to 0G Storage
  const memData = new MemData(buffer);

  logger.info("Uploading to 0G Storage...", {
    bytes: buffer.length,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, err] = await indexer.upload(memData, chainRpc, signer as any);
  if (err) throw new Error(`0G Storage upload failed: ${String(err)}`);

  const rootHash = result.rootHash;
  logger.info("0G Storage upload complete", { rootHash, txHash: result.txHash });
  return rootHash;
}

/**
 * Download and parse a JSON object from 0G Storage by its root hash.
 * Downloads to a temp file, reads it, then cleans up.
 *
 * @param rootHash - The root hash returned by writeToStorage()
 * @returns Parsed JSON object
 */
export async function readFromStorage<T = unknown>(rootHash: string): Promise<T> {
  const indexerRpc = cfg("OG_INDEXER_RPC");
  const chainRpc   = cfg("OG_CHAIN_RPC");

  const indexer  = new Indexer(indexerRpc);
  const tmpFile  = join(tmpdir(), `prophet-storage-${randomBytes(8).toString("hex")}.json`);

  logger.info("Downloading from 0G Storage...", { rootHash });

  const err = await indexer.download(rootHash, tmpFile, false);
  if (err) throw new Error(`0G Storage download failed: ${String(err)}`);

  try {
    const content = await fs.readFile(tmpFile, "utf8");
    const parsed  = JSON.parse(content) as T;
    logger.info("0G Storage download complete");
    return parsed;
  } finally {
    // Clean up temp file
    await fs.unlink(tmpFile).catch(() => {/* ignore cleanup error */});
  }
}

// ── Typed write helpers ───────────────────────────────────────────────────────

/** Write market metadata (called when MarketCreated event fires) */
export async function writeMarketMetadata(
  marketAddress: string,
  metadata: MarketMetadata,
  signer: Wallet
): Promise<string> {
  logger.info("Writing market metadata", { market: marketAddress });
  const key  = StorageKeys.marketMetadata(marketAddress);
  const data = { key, ...metadata, storedAt: Date.now() };
  return writeToStorage(data, signer);
}

/** Write oracle resolution record to the immutable Log layer */
export async function writeResolutionRecord(
  marketAddress: string,
  record: ResolutionRecord,
  signer: Wallet
): Promise<string> {
  logger.info("Writing resolution record to 0G Storage", {
    market: marketAddress,
    verdict: record.verdict,
  });
  const key  = StorageKeys.marketResolution(marketAddress);
  const data = { key, ...record };
  return writeToStorage(data, signer);
}

/** Update oracle working state during multi-step resolution */
export async function writeOracleWorkingState(
  marketAddress: string,
  state: OracleWorkingState,
  signer: Wallet
): Promise<string> {
  const key  = StorageKeys.oracleWorking(marketAddress);
  const data = { key, ...state, updatedAt: Date.now() };
  return writeToStorage(data, signer);
}

/** Write market maker live prices */
export async function writeMarketPrices(
  marketAddress: string,
  prices: MarketPrices,
  signer: Wallet
): Promise<string> {
  logger.info("Writing market prices", { market: marketAddress, prices });
  const key  = StorageKeys.marketPrices(marketAddress);
  const data = { key, ...prices };
  return writeToStorage(data, signer);
}

/** Write market maker global state */
export async function writeMMState(
  state: MarketMakerState,
  signer: Wallet
): Promise<string> {
  const key  = StorageKeys.mmState();
  const data = { key, ...state };
  return writeToStorage(data, signer);
}

// ── Typed read helpers ────────────────────────────────────────────────────────

/** Read oracle resolution reasoning by root hash — used by frontend */
export async function readResolutionRecord(rootHash: string): Promise<ResolutionRecord> {
  return readFromStorage<ResolutionRecord>(rootHash);
}

/** Read market prices by root hash */
export async function readMarketPrices(rootHash: string): Promise<MarketPrices> {
  return readFromStorage<MarketPrices>(rootHash);
}
