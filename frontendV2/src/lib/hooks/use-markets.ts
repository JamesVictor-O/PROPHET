"use client";

import { useMemo } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { getAddress, formatUnits, type Abi } from "viem";
import {
  PROPHET_FACTORY_ADDRESS,
  PROPHET_FACTORY_ABI,
  MARKET_CONTRACT_ABI,
} from "@/lib/contracts";
import type { ProphetMarket } from "@/lib/prophet-market";

const STATUS_LABELS = [
  "Pending",
  "Open",
  "Resolving",
  "Challenged",
  "Resolved",
  "Cancelled",
  "Archived",
] as const;

function formatCloseDate(deadlineSec: bigint): string {
  const ms = Number(deadlineSec) * 1000;
  if (!Number.isFinite(ms)) return "—";
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatVolume(collateral: bigint): string {
  const n = Number(formatUnits(collateral, 6));
  if (!Number.isFinite(n) || n <= 0) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export function useMarkets() {
  const { data: totalBn, isLoading: loadingTotal, error: totalError } =
    useReadContract({
      address: PROPHET_FACTORY_ADDRESS as `0x${string}`,
      abi: PROPHET_FACTORY_ABI,
      functionName: "totalMarkets",
    });

  const total = typeof totalBn === "bigint" ? totalBn : BigInt(0);

  const {
    data: addressList,
    isLoading: loadingAddresses,
    error: addressesError,
  } = useReadContract({
    address: PROPHET_FACTORY_ADDRESS as `0x${string}`,
    abi: PROPHET_FACTORY_ABI,
    functionName: "getMarkets",
    args:
      total > BigInt(0)
        ? [
            BigInt(0),
            total > BigInt(100) ? BigInt(100) : total,
          ]
        : undefined,
    query: {
      enabled: total > BigInt(0),
    },
  });

  const rawAddresses = Array.isArray(addressList)
    ? (addressList as `0x${string}`[])
    : [];

  const contracts = useMemo(
    () =>
      rawAddresses.map((address) => ({
        address,
        abi: MARKET_CONTRACT_ABI as Abi,
        functionName: "getMarketInfo" as const,
      })),
    [rawAddresses],
  );

  const {
    data: infoResults,
    isLoading: loadingInfo,
    error: infoError,
    refetch,
  } = useReadContracts({
    contracts,
    query: {
      enabled: contracts.length > 0,
    },
  });

  const markets: ProphetMarket[] = useMemo(() => {
    if (!infoResults?.length || !rawAddresses.length) return [];

    const out: ProphetMarket[] = [];

    for (let i = 0; i < infoResults.length; i++) {
      const row = infoResults[i];
      const addr = rawAddresses[i];
      if (!addr || row.status !== "success" || !row.result) continue;

      const r = row.result as readonly [
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

      const [question, deadline_, statusRaw, , totalCollateral_, , , categoryRaw] =
        r;

      const statusIdx = Number(statusRaw);
      const statusLabel =
        statusIdx >= 0 && statusIdx < STATUS_LABELS.length
          ? STATUS_LABELS[statusIdx]
          : "Unknown";

      let checksummed: string = addr;
      try {
        checksummed = getAddress(addr);
      } catch {
        /* use raw */
      }

      const cat = (categoryRaw || "custom").trim();
      const category =
        cat.length > 0
          ? cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase()
          : "Custom";

      out.push({
        id: checksummed,
        title: question || "Untitled market",
        category,
        price: 50,
        change: 0,
        volume: `${formatVolume(totalCollateral_)} Vol`,
        closeDate: formatCloseDate(deadline_),
        chainStatus: statusLabel,
      });
    }

    return out.reverse();
  }, [infoResults, rawAddresses]);

  const isLoading = loadingTotal || loadingAddresses || loadingInfo;
  const error = totalError ?? addressesError ?? infoError;

  return {
    markets,
    totalCount: Number(total),
    isLoading,
    isError: !!error,
    error,
    refetch,
  };
}
