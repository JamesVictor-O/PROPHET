import { Indexer } from "@0gfoundation/0g-storage-ts-sdk";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

const HEX_32_REGEX = /^0x[0-9a-fA-F]{64}$/;
const ZERO_HASH = `0x${"0".repeat(64)}`;

export function isStorageRootHash(hash: string | undefined | null): boolean {
  return !!hash && HEX_32_REGEX.test(hash);
}

export function isZeroStorageHash(hash: string | undefined | null): boolean {
  return (hash ?? "").toLowerCase() === ZERO_HASH;
}

export async function downloadOgJson(rootHash: string): Promise<unknown> {
  if (!isStorageRootHash(rootHash) || isZeroStorageHash(rootHash)) {
    throw new Error("Invalid 0G root hash");
  }

  const indexerRpc = process.env.OG_INDEXER_RPC;
  const chainRpc = process.env.OG_CHAIN_RPC ?? "https://evmrpc-testnet.0g.ai";

  if (!indexerRpc) {
    throw new Error("Missing OG_INDEXER_RPC environment variable");
  }

  const indexer = new Indexer(indexerRpc);
  const tmpPath = path.join(
    os.tmpdir(),
    `prophet-og-${crypto.randomUUID()}.json`,
  );

  try {
    const err = await indexer.download(rootHash, tmpPath, false);
    if (err) {
      throw new Error(`0G download failed: ${String(err)}`);
    }

    const text = await fs.readFile(tmpPath, "utf8");
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  } finally {
    await fs.rm(tmpPath, { force: true }).catch(() => undefined);
  }
}
