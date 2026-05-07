// GET  /api/faucet?address=0x...  → { claimed: boolean }
// POST /api/faucet                → body { address } → records claim → { ok: true }
//
// Claims are persisted to a JSON file on the server so the one-per-address
// limit survives page refreshes and different devices.

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CLAIMS_FILE = path.join("/tmp", "prophet-faucet-claims.json");

function loadClaims(): Set<string> {
  try {
    const raw = fs.readFileSync(CLAIMS_FILE, "utf8");
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveClaims(claims: Set<string>) {
  fs.writeFileSync(CLAIMS_FILE, JSON.stringify([...claims]), "utf8");
}

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address")?.toLowerCase();
  if (!address) return NextResponse.json({ claimed: false });
  const claimed = loadClaims().has(address);
  return NextResponse.json({ claimed });
}

export async function POST(req: NextRequest) {
  let address: string;
  try {
    ({ address } = (await req.json()) as { address: string });
    if (!address?.startsWith("0x")) throw new Error("bad address");
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const claims = loadClaims();
  if (claims.has(address.toLowerCase())) {
    return NextResponse.json({ ok: false, error: "Already claimed" }, { status: 409 });
  }
  claims.add(address.toLowerCase());
  saveClaims(claims);
  return NextResponse.json({ ok: true });
}
