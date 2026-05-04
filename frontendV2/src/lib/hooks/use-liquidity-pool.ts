"use client";

import { useMemo } from "react";
import {
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { parseUnits, formatUnits, erc20Abi, type Abi } from "viem";
import {
  LIQUIDITY_POOL_ADDRESS,
  LIQUIDITY_POOL_ABI,
  MOCK_USDT_ADDRESS,
} from "@/lib/contracts";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PoolStats = {
  available: bigint;      // idle USDT in pool
  allocated: bigint;      // USDT deployed in active markets
  totalValue: bigint;     // available + allocated
  feesEarned: bigint;     // cumulative fees returned from markets
  totalShares: bigint;    // total LP shares in circulation
  sharePrice: bigint;     // 1 share value in USDT (6 decimals)
  utilization: bigint;    // BPS — how much of pool is deployed
  marketsAllocated: bigint; // count of markets that received liquidity
};

export type MarketAllocationRow = {
  market: `0x${string}`;
  amount: bigint;
  returned: boolean;
};

// ─── Pool stats hook ──────────────────────────────────────────────────────────

export function usePoolStats() {
  const poolAddress = LIQUIDITY_POOL_ADDRESS;
  const enabled = !!poolAddress && poolAddress.length > 4;

  const { data, isLoading, error, refetch } = useReadContract({
    address: poolAddress,
    abi: LIQUIDITY_POOL_ABI as Abi,
    functionName: "getPoolStats",
    query: { enabled, refetchInterval: 10_000 },
  });

  const stats = useMemo<PoolStats | null>(() => {
    if (!data) return null;
    const r = data as readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];
    return {
      available:        r[0],
      allocated:        r[1],
      totalValue:       r[2],
      feesEarned:       r[3],
      totalShares:      r[4],
      sharePrice:       r[5],
      utilization:      r[6],
      marketsAllocated: r[7],
    };
  }, [data]);

  return { stats, isLoading, error, refetch };
}

// ─── LP position hook (per-user) ──────────────────────────────────────────────

export function useLpPosition() {
  const { address } = useAccount();
  const poolAddress = LIQUIDITY_POOL_ADDRESS;
  const enabled = !!poolAddress && poolAddress.length > 4 && !!address;

  const contracts = useMemo(() => {
    if (!enabled || !address) return [];
    return [
      {
        address: poolAddress,
        abi: LIQUIDITY_POOL_ABI as Abi,
        functionName: "shares" as const,
        args: [address] as const,
      },
      {
        address: poolAddress,
        abi: LIQUIDITY_POOL_ABI as Abi,
        functionName: "withdrawableAmount" as const,
        args: [address] as const,
      },
    ];
  }, [enabled, address, poolAddress]);

  const { data, isLoading, refetch } = useReadContracts({
    contracts,
    query: { enabled: contracts.length > 0, refetchInterval: 10_000 },
  });

  const myShares = (data?.[0]?.status === "success" ? data[0].result : BigInt(0)) as bigint;
  const withdrawable = (data?.[1]?.status === "success" ? data[1].result : BigInt(0)) as bigint;

  return { myShares, withdrawable, isLoading, refetch };
}

// ─── USDT allowance + balance hook ────────────────────────────────────────────

export function useUsdtForPool() {
  const { address } = useAccount();
  const poolAddress = LIQUIDITY_POOL_ADDRESS;
  const enabled = !!address && !!poolAddress && poolAddress.length > 4;

  const contracts = useMemo(() => {
    if (!enabled || !address) return [];
    return [
      {
        address: MOCK_USDT_ADDRESS,
        abi: erc20Abi,
        functionName: "balanceOf" as const,
        args: [address] as const,
      },
      {
        address: MOCK_USDT_ADDRESS,
        abi: erc20Abi,
        functionName: "allowance" as const,
        args: [address, poolAddress] as const,
      },
    ];
  }, [enabled, address, poolAddress]);

  const { data, isLoading, refetch } = useReadContracts({
    contracts,
    query: { enabled: contracts.length > 0, refetchInterval: 8_000 },
  });

  const balance  = (data?.[0]?.status === "success" ? data[0].result : BigInt(0)) as bigint;
  const allowance = (data?.[1]?.status === "success" ? data[1].result : BigInt(0)) as bigint;

  return { balance, allowance, isLoading, refetch };
}

// ─── Approve USDT for pool ────────────────────────────────────────────────────

export function useApproveUsdt() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function approve(amount: string) {
    const parsed = parseUnits(amount, 6);
    writeContract({
      address: MOCK_USDT_ADDRESS,
      abi: erc20Abi,
      functionName: "approve",
      args: [LIQUIDITY_POOL_ADDRESS, parsed],
    });
  }

  return { approve, isPending, isConfirming, isSuccess, hash, error };
}

// ─── Deposit into pool ────────────────────────────────────────────────────────

export function useDeposit() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function deposit(amount: string) {
    const parsed = parseUnits(amount, 6);
    writeContract({
      address: LIQUIDITY_POOL_ADDRESS,
      abi: LIQUIDITY_POOL_ABI as Abi,
      functionName: "deposit",
      args: [parsed],
    });
  }

  return { deposit, isPending, isConfirming, isSuccess, hash, error };
}

// ─── Withdraw from pool ───────────────────────────────────────────────────────

export function useWithdraw() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function withdraw(shareAmount: bigint) {
    writeContract({
      address: LIQUIDITY_POOL_ADDRESS,
      abi: LIQUIDITY_POOL_ABI as Abi,
      functionName: "withdraw",
      args: [shareAmount],
    });
  }

  return { withdraw, isPending, isConfirming, isSuccess, hash, error };
}

// ─── Market allocations hook ──────────────────────────────────────────────────
// Reads allocation + returned status for a list of market addresses

export function useMarketAllocations(marketAddresses: `0x${string}`[]) {
  const poolAddress = LIQUIDITY_POOL_ADDRESS;
  const enabled = !!poolAddress && poolAddress.length > 4 && marketAddresses.length > 0;

  const allocationContracts = useMemo(() =>
    marketAddresses.map((market) => ({
      address: poolAddress,
      abi: LIQUIDITY_POOL_ABI as Abi,
      functionName: "marketAllocation" as const,
      args: [market] as const,
    })),
    [marketAddresses, poolAddress]
  );

  const returnedContracts = useMemo(() =>
    marketAddresses.map((market) => ({
      address: poolAddress,
      abi: LIQUIDITY_POOL_ABI as Abi,
      functionName: "marketReturned" as const,
      args: [market] as const,
    })),
    [marketAddresses, poolAddress]
  );

  const { data: allocData, isLoading: loadingAlloc } = useReadContracts({
    contracts: allocationContracts,
    query: { enabled, refetchInterval: 12_000 },
  });

  const { data: returnedData, isLoading: loadingReturned } = useReadContracts({
    contracts: returnedContracts,
    query: { enabled, refetchInterval: 12_000 },
  });

  const rows = useMemo<MarketAllocationRow[]>(() => {
    if (!allocData || !returnedData) return [];
    return marketAddresses
      .map((market, i) => {
        const amount = (allocData[i]?.status === "success" ? allocData[i].result : BigInt(0)) as bigint;
        const returned = (returnedData[i]?.status === "success" ? returnedData[i].result : false) as boolean;
        return { market, amount, returned };
      })
      .filter((r) => r.amount > BigInt(0) || r.returned);
  }, [allocData, returnedData, marketAddresses]);

  return { rows, isLoading: loadingAlloc || loadingReturned };
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

export function formatUsdt6(raw: bigint): string {
  const n = Number(formatUnits(raw, 6));
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(2)}K`;
  return n.toFixed(2);
}

export function formatShares(raw: bigint): string {
  // Shares have same precision as USDT (6 decimals at first deposit)
  const n = Number(formatUnits(raw, 6));
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(2)}K`;
  return n.toFixed(4);
}

export function formatBps(bps: bigint): string {
  return `${(Number(bps) / 100).toFixed(2)}%`;
}
