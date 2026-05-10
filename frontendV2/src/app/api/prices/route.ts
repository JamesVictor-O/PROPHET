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
const HISTORY_FILE = path.join("/tmp", "prophet-price-history.json");

interface PriceEntry {
  yesPrice:    number;
  noPrice:     number;
  lastUpdated: number;
}

interface PriceHistoryEntry extends PriceEntry {
  timestamp: number;
}

// Module-level cache — shared across requests on the same warm serverless instance.
// Populated from disk on first load so it survives process restarts within the same
// deployment environment.
const cache = new Map<string, PriceEntry>();
const historyCache = new Map<string, PriceHistoryEntry[]>();

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

  try {
    const raw  = fs.readFileSync(HISTORY_FILE, "utf8");
    const data = JSON.parse(raw) as Record<string, PriceHistoryEntry[]>;
    for (const [addr, entries] of Object.entries(data)) {
      historyCache.set(
        addr.toLowerCase(),
        entries
          .filter((entry) =>
            typeof entry.yesPrice === "number" &&
            typeof entry.noPrice === "number" &&
            typeof entry.timestamp === "number"
          )
          .slice(-500)
      );
    }
  } catch {
    // No history yet.
  }
})();

function persist() {
  try {
    const obj: Record<string, PriceEntry> = {};
    for (const [addr, entry] of cache) obj[addr] = entry;
    fs.writeFileSync(PRICES_FILE, JSON.stringify(obj), "utf8");
  } catch { /* non-fatal */ }
}

function persistHistory() {
  try {
    const obj: Record<string, PriceHistoryEntry[]> = {};
    for (const [addr, entries] of historyCache) obj[addr] = entries.slice(-500);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(obj), "utf8");
  } catch { /* non-fatal */ }
}

function appendHistory(market: string, entry: PriceEntry) {
  const key = market.toLowerCase();
  const timestamp = entry.lastUpdated || Date.now();
  const entries = historyCache.get(key) ?? [];
  const last = entries[entries.length - 1];

  // Avoid duplicate points from repeated agent pushes with unchanged prices.
  if (
    last &&
    last.yesPrice === entry.yesPrice &&
    last.noPrice === entry.noPrice &&
    timestamp - last.timestamp < 60_000
  ) {
    return;
  }

  entries.push({ ...entry, timestamp });
  historyCache.set(key, entries.slice(-500));
  persistHistory();
}

export async function GET(req: NextRequest) {
  const market = req.nextUrl.searchParams.get("market")?.toLowerCase();
  const wantsHistory = req.nextUrl.searchParams.get("history") === "1";

  if (!market) {
    const all: Record<string, PriceEntry> = {};
    for (const [addr, entry] of cache) all[addr] = entry;
    return NextResponse.json(all);
  }

  if (wantsHistory) {
    const entries = historyCache.get(market) ?? [];
    return NextResponse.json({ market, history: entries });
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

  const entry = {
    yesPrice:    Math.round(yesPrice),
    noPrice:     Math.round(noPrice ?? (100 - yesPrice)),
    lastUpdated: lastUpdated ?? Date.now(),
  };

  cache.set(market.toLowerCase(), entry);
  appendHistory(market, entry);
  persist();

  return NextResponse.json({ ok: true });
}
