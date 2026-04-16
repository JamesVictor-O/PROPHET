"use client";

import { useEffect, useState } from "react";

const HEX_32_REGEX = /^0x[0-9a-fA-F]{64}$/;
const ZERO_HASH = `0x${"0".repeat(64)}`;

export type OracleReasoning = {
  verdict?: boolean | null;
  confidence?: number;
  reasoning?: string;
  evidenceSummary?: string;
  sourcesChecked?: string[];
  timestamp?: string;
  txHash?: string;
  raw?: string;
};

export function useOracleReasoning(hash?: string) {
  const [data, setData] = useState<OracleReasoning | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const h = (hash ?? "").trim();
    if (!HEX_32_REGEX.test(h) || h.toLowerCase() === ZERO_HASH) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let ignore = false;
    const controller = new AbortController();

    async function run() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/og-storage?hash=${encodeURIComponent(h)}`,
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );
        const body = (await response.json()) as {
          error?: string;
          data?: OracleReasoning;
        };
        if (!response.ok) {
          throw new Error(body.error || "Failed to load oracle reasoning");
        }
        if (!ignore) {
          setData(body.data ?? null);
        }
      } catch (err) {
        if (!ignore && !controller.signal.aborted) {
          setData(null);
          setError(
            err instanceof Error ? err.message : "Failed to load reasoning",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void run();
    return () => {
      ignore = true;
      controller.abort();
    };
  }, [hash]);

  return {
    data,
    isLoading,
    error,
    hasHash: !!hash && HEX_32_REGEX.test(hash) && hash.toLowerCase() !== ZERO_HASH,
  };
}
