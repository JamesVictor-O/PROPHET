// POST /api/store-metadata
//
// Writes market metadata to 0G Storage (Log layer) before the user signs the
// createMarket() wallet transaction. Returns the root hash, which is passed
// as resolutionSourcesHash to ProphetFactory.createMarket().
//
// The oracle agent later downloads this same object by its root hash to get
// the question, category, and approved resolution sources.

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

export const runtime = "nodejs";

async function getStorageModules() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const sdk = require("@0glabs/0g-ts-sdk") as {
    Indexer: new (rpc: string) => {
      upload: (data: unknown, chainRpc: string, signer: unknown) => Promise<[{ rootHash: string; txHash: string }, unknown]>;
    };
    MemData: new (buf: Buffer) => unknown;
  };
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ethers = require("ethers") as typeof import("ethers");
  return { sdk, ethers };
}

export async function POST(req: NextRequest) {
  let question: string, category: string, deadline: string, sources: string[];
  try {
    ({ question, category, deadline, sources } = await req.json() as {
      question: string;
      category: string;
      deadline: string;
      sources:  string[];
    });
    if (!question?.trim()) throw new Error("question required");
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const privateKey   = process.env.PRIVATE_KEY_ORACLE;
  const indexerRpc   = process.env.OG_INDEXER_RPC;
  const chainRpc     = process.env.OG_CHAIN_RPC ?? "https://evmrpc-testnet.0g.ai";

  if (!privateKey) {
    return NextResponse.json({ error: "PRIVATE_KEY_ORACLE not set" }, { status: 503 });
  }
  if (!indexerRpc) {
    return NextResponse.json({ error: "OG_INDEXER_RPC not set" }, { status: 503 });
  }

  try {
    const { sdk, ethers } = await getStorageModules();

    const key    = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
    const provider = new ethers.JsonRpcProvider(chainRpc);
    const wallet   = new ethers.Wallet(key, provider);

    const metadata = {
      question:  question.trim(),
      category,
      deadline,
      sources:   sources ?? [],
      status:    "pending",
      createdAt: new Date().toISOString(),
    };

    const buffer  = Buffer.from(JSON.stringify(metadata, null, 2));
    const memData = new sdk.MemData(buffer);
    const indexer = new sdk.Indexer(indexerRpc);

    const [result, err] = await indexer.upload(memData, chainRpc, wallet);
    if (err) throw new Error(`0G Storage upload failed: ${String(err)}`);

    return NextResponse.json({ rootHash: result.rootHash, txHash: result.txHash });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[store-metadata] Failed:", err);
    return NextResponse.json({ error: `0G Storage write failed: ${msg}` }, { status: 502 });
  }
}

// GET /api/store-metadata?hash=0x... — download metadata by root hash (used by oracle page)
export async function GET(req: NextRequest) {
  const rootHash = req.nextUrl.searchParams.get("hash");
  if (!rootHash || !/^0x[0-9a-fA-F]{64}$/.test(rootHash)) {
    return NextResponse.json({ error: "Invalid hash" }, { status: 400 });
  }

  const indexerRpc = process.env.OG_INDEXER_RPC;
  const chainRpc   = process.env.OG_CHAIN_RPC ?? "https://evmrpc-testnet.0g.ai";
  if (!indexerRpc) {
    return NextResponse.json({ error: "OG_INDEXER_RPC not set" }, { status: 503 });
  }

  const tmpPath = path.join(os.tmpdir(), `prophet-meta-${crypto.randomUUID()}.json`);
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Indexer } = require("@0glabs/0g-ts-sdk") as { Indexer: new (rpc: string) => { download: (hash: string, path: string, verify: boolean) => Promise<unknown> } };
    const indexer = new Indexer(indexerRpc);
    const err = await indexer.download(rootHash, tmpPath, false);
    if (err) throw new Error(`Download failed: ${String(err)}`);
    const text = await fs.readFile(tmpPath, "utf8");
    return NextResponse.json({ rootHash, data: JSON.parse(text) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 502 });
  } finally {
    await fs.rm(tmpPath, { force: true }).catch(() => undefined);
  }
}
