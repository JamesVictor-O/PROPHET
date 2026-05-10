"use client";

import { useEffect, useMemo, useState } from "react";
import { useReadContract } from "wagmi";
import { getAddress, isAddress, formatUnits } from "viem";
import {
  PROPHET_FACTORY_ADDRESS,
  PROPHET_FACTORY_ABI,
  MARKET_CONTRACT_ABI,
} from "@/lib/contracts";

const STATUS_LABELS = [
  "Pending",
  "Open",
  "Resolving",
  "Challenged",
  "Resolved",
  "Cancelled",
  "Archived",
] as const;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

/** `MarketStatus.Open` — only status where bets are accepted */
export const MARKET_STATUS_OPEN = 1;

export type MarketDetail = {
  address: `0x${string}`;
  question: string;
  category: string;
  deadline: bigint;
  status: number;
  statusLabel: string;
  outcome: boolean;
  totalCollateral: bigint;
  challengeDeadline: bigint;
  verdictReasoningHash: `0x${string}`;
  resolutionSourcesHash: `0x${string}`;
  creator: `0x${string}`;
};

function parseInfo(
  address: `0x${string}`,
  result: unknown,
): MarketDetail | null {
  if (!result || !Array.isArray(result) || result.length < 9) return null;
  const r = result as unknown as readonly [
    string,
    bigint,
    number | bigint,
    boolean,
    bigint,
    bigint,
    `0x${string}`,
    string,
    `0x${string}`,
  ];
  const statusIdx = Number(r[2]);
  const statusLabel =
    statusIdx >= 0 && statusIdx < STATUS_LABELS.length
      ? STATUS_LABELS[statusIdx]
      : "Unknown";
  const cat = (r[7] || "custom").trim();
  const category =
    cat.length > 0
      ? cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase()
      : "Custom";

  return {
    address,
    question: r[0] || "Untitled market",
    category,
    deadline: r[1],
    status: statusIdx,
    statusLabel,
    outcome: r[3],
    totalCollateral: r[4],
    challengeDeadline: r[5],
    verdictReasoningHash: r[6],
    resolutionSourcesHash: "0x" as `0x${string}`,
    creator: r[8],
  };
}

export function formatUsdtUsd(collateral: bigint): string {
  const n = Number(formatUnits(collateral, 6));
  if (!Number.isFinite(n) || n < 0) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export function formatDeadlineTs(deadlineSec: bigint): string {
  const ms = Number(deadlineSec) * 1000;
  if (!Number.isFinite(ms)) return "—";
  return new Date(ms).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function useMarketDetail(routeId: string | undefined) {
  const address = useMemo(() => {
    if (!routeId) return undefined;
    const raw = decodeURIComponent(routeId.trim());
    if (!isAddress(raw)) return undefined;
    try {
      return getAddress(raw) as `0x${string}`;
    } catch {
      return undefined;
    }
  }, [routeId]);

  const invalidAddress = Boolean(routeId && !address);

  const { data: isValid, isLoading: loadingValid } = useReadContract({
    address: PROPHET_FACTORY_ADDRESS as `0x${string}`,
    abi: PROPHET_FACTORY_ABI,
    functionName: "isValidMarket",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const {
    data: infoRaw,
    isLoading: loadingInfo,
    error: infoError,
    refetch,
  } = useReadContract({
    address: address ?? ZERO_ADDRESS,
    abi: MARKET_CONTRACT_ABI,
    functionName: "getMarketInfo",
    query: { enabled: !!address && isValid === true },
  });

  const { data: sourcesHashRaw } = useReadContract({
    address: address ?? ZERO_ADDRESS,
    abi: MARKET_CONTRACT_ABI,
    functionName: "resolutionSourcesHash",
    query: { enabled: !!address && isValid === true },
  });

  const { data: ammStateRaw } = useReadContract({
    address: address ?? ZERO_ADDRESS,
    abi: MARKET_CONTRACT_ABI,
    functionName: "getAmmState",
    args: address ? [ZERO_ADDRESS] : undefined,
    query: {
      enabled: !!address && isValid === true,
      refetchInterval: 5_000,
    },
  });

  const detail = useMemo(() => {
    if (!address || !infoRaw) return null;
    const d = parseInfo(address, infoRaw);
    if (!d) return null;
    return {
      ...d,
      resolutionSourcesHash: (sourcesHashRaw as `0x${string}` | undefined) ?? ("0x" as `0x${string}`),
    };
  }, [address, infoRaw, sourcesHashRaw]);

  const notRegistered =
    !!address && isValid === false && !loadingValid;

  const canTrade = detail?.status === MARKET_STATUS_OPEN;

  const isLoading =
    !!address &&
    (loadingValid || (isValid === true && loadingInfo));

  // Fallback cache populated by the market-maker agent. The canonical trading
  // price comes from getAmmState() above so the chart matches the TradePanel.
  const [cachedYesPrice, setCachedYesPrice] = useState<number>(50);
  const [isCachePriceLive, setIsCachePriceLive] = useState<boolean>(false);

  useEffect(() => {
    if (!address) return;
    let cancelled = false;

    async function fetchPrice() {
      try {
        const res = await fetch(`/api/prices?market=${address}`);
        if (!res.ok) return;
        const data = await res.json() as { yesPrice: number; fallback?: boolean };
        if (cancelled) return;
        if (!data.fallback && typeof data.yesPrice === "number") {
          setCachedYesPrice(Math.min(99, Math.max(1, Math.round(data.yesPrice))));
          setIsCachePriceLive(true);
        } else {
          setIsCachePriceLive(false);
        }
      } catch { /* non-fatal */ }
    }

    void fetchPrice();
    // Refresh every 30 s so the UI stays in sync with repricing ticks
    const id = setInterval(() => { void fetchPrice(); }, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [address]);

  const ammState = Array.isArray(ammStateRaw)
    ? (ammStateRaw as readonly bigint[])
    : undefined;
  const onchainYesPrice =
    ammState?.[6] !== undefined
      ? Math.min(99, Math.max(1, Math.round(Number(ammState[6]) / 100)))
      : undefined;
  const yesPrice = onchainYesPrice ?? cachedYesPrice;
  const isPriceLive = onchainYesPrice !== undefined || isCachePriceLive;

  return {
    address,
    invalidAddress,
    notRegistered,
    detail,
    canTrade: canTrade ?? false,
    impliedYesPct: yesPrice,
    isPriceLive,
    isLoading,
    error: infoError,
    refetch,
  };
}
