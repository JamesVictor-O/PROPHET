import { NextRequest, NextResponse } from "next/server";
import {
  downloadOgJson,
  isStorageRootHash,
  isZeroStorageHash,
} from "@/lib/server/og-storage";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const hashParam = request.nextUrl.searchParams.get("hash");
  if (!isStorageRootHash(hashParam) || isZeroStorageHash(hashParam)) {
    return NextResponse.json(
      { error: "Invalid or empty 0G storage hash" },
      { status: 400 },
    );
  }
  const hash = hashParam as string;

  try {
    const data = await downloadOgJson(hash);
    return NextResponse.json({ hash, data });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to read 0G Storage",
      },
      { status: 502 },
    );
  }
}
