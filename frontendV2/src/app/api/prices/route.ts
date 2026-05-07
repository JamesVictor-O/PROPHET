// GET  /api/prices?market=0x...  → { yesPrice, noPrice, lastUpdated, fallback? }
// GET  /api/prices               → { [address]: { yesPrice, noPrice, lastUpdated } }
// POST /api/prices               → { market, yesPrice, noPrice, lastUpdated } from agent
//
// The market-maker agent POSTs prices here after every 0G Compute inference.
// The frontend hook reads from here so it never shows a hardcoded 50/50.

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const PRICES_FILE = path.join("/tmp", "prophet-prices.json");

interface PriceEntry {
  yesPrice:    number;
  noPrice:     number;
  lastUpdated: number;
}

// Module-level cache — shared across requests on the same warm serverless instance.
// Populated from disk on first load so it survives process restarts within the same
// deployment environment.
const cache = new Map<string, PriceEntry>();

(function hydrateFromDisk() {
  try {
    const raw  = fs.readFileSync(PRICES_FILE, "utf8");
    const data = JSON.parse(raw) as Record<string, PriceEntry>;
    for (const [addr, entry] of Object.entries(data)) {
      cache.set(addr.toLowerCase(), entry);
    }
  } catch {
    // File doesn't exist yet — fine on first run
  }
})();

function persist() {
  try {
    const obj: Record<string, PriceEntry> = {};
    for (const [addr, entry] of cache) obj[addr] = entry;
    fs.writeFileSync(PRICES_FILE, JSON.stringify(obj), "utf8");
  } catch { /* non-fatal */ }
}

export async function GET(req: NextRequest) {
  const market = req.nextUrl.searchParams.get("market")?.toLowerCase();

  if (!market) {
    const all: Record<string, PriceEntry> = {};
    for (const [addr, entry] of cache) all[addr] = entry;
    return NextResponse.json(all);
  }

  const entry = cache.get(market);
  if (!entry) {
    return NextResponse.json({ yesPrice: 50, noPrice: 50, lastUpdated: 0, fallback: true });
  }
  return NextResponse.json(entry);
}

export async function POST(req: NextRequest) {
  let market: string, yesPrice: number, noPrice: number, lastUpdated: number;
  try {
    ({ market, yesPrice, noPrice, lastUpdated } = (await req.json()) as {
      market: string; yesPrice: number; noPrice: number; lastUpdated: number;
    });
    if (!market?.startsWith("0x")) throw new Error("bad market");
    if (typeof yesPrice !== "number" || yesPrice < 1 || yesPrice > 99) throw new Error("bad yesPrice");
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 });
  }

  cache.set(market.toLowerCase(), {
    yesPrice:    Math.round(yesPrice),
    noPrice:     Math.round(noPrice ?? (100 - yesPrice)),
    lastUpdated: lastUpdated ?? Date.now(),
  });
  persist();

  return NextResponse.json({ ok: true });
}
