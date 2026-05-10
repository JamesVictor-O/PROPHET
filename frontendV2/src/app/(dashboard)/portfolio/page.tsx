"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAccount, useBalance, useReadContract, useReadContracts } from "wagmi";
import { formatUnits, type Abi } from "viem";
import { erc20Abi } from "viem";
import {
  MARKET_CONTRACT_ABI,
  MOCK_USDT_ADDRESS,
  POSITION_VAULT_ABI,
  POSITION_VAULT_ADDRESS,
  PROPHET_FACTORY_ABI,
  PROPHET_FACTORY_ADDRESS,
} from "@/lib/contracts";
import { marketStatusTone } from "@/lib/market-status";

type TabType = "Pos" | "Markets";

type PortfolioMarketRow = {
  address: `0x${string}`;
  title: string;
  statusLabel: string;
  closeDate: string;
  volume: string;
  creator: string;
  hasBet: boolean;
};

const STATUS_LABELS = [
  "Pending",
  "Open",
  "Resolving",
  "Challenged",
  "Resolved",
  "Cancelled",
  "Archived",
] as const;

function formatUsdt(value: bigint): string {
  const n = Number(formatUnits(value, 6));
  if (!Number.isFinite(n) || n < 0) return "$0.00";
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function formatCloseDate(deadlineSec: bigint): string {
  const ms = Number(deadlineSec) * 1000;
  if (!Number.isFinite(ms)) return "—";
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState<TabType>("Pos");
  const { address } = useAccount();

  const { data: nativeBalanceData, isLoading: loadingNative } = useBalance({
    address,
  });

  const { data: usdtBalanceData, isLoading: loadingUsdt } = useReadContract({
    address: MOCK_USDT_ADDRESS as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: totalBn, isLoading: loadingTotal, error: totalError } =
    useReadContract({
      address: PROPHET_FACTORY_ADDRESS as `0x${string}`,
      abi: PROPHET_FACTORY_ABI,
      functionName: "totalMarkets",
    });

  const totalMarkets = typeof totalBn === "bigint" ? totalBn : BigInt(0);

  const {
    data: marketAddressList,
    isLoading: loadingAddresses,
    error: addressesError,
  } = useReadContract({
    address: PROPHET_FACTORY_ADDRESS as `0x${string}`,
    abi: PROPHET_FACTORY_ABI,
    functionName: "getMarkets",
    args:
      totalMarkets > BigInt(0)
        ? [BigInt(0), totalMarkets > BigInt(100) ? BigInt(100) : totalMarkets]
        : undefined,
    query: { enabled: totalMarkets > BigInt(0) },
  });

  const marketAddresses = Array.isArray(marketAddressList)
    ? (marketAddressList as `0x${string}`[])
    : [];

  const infoContracts = useMemo(
    () =>
      marketAddresses.map((marketAddress) => ({
        address: marketAddress,
        abi: MARKET_CONTRACT_ABI as Abi,
        functionName: "getMarketInfo" as const,
      })),
    [marketAddresses],
  );

  const betContracts = useMemo(() => {
    if (!address) return [];
    return marketAddresses.map((marketAddress) => ({
      address: POSITION_VAULT_ADDRESS as `0x${string}`,
      abi: POSITION_VAULT_ABI as Abi,
      functionName: "hasBet" as const,
      args: [marketAddress, address] as const,
    }));
  }, [marketAddresses, address]);

  const {
    data: infoResults,
    isLoading: loadingInfos,
    error: infoError,
    refetch,
  } = useReadContracts({
    contracts: infoContracts,
    query: { enabled: infoContracts.length > 0 },
  });

  const { data: betResults, isLoading: loadingBets, error: betsError } =
    useReadContracts({
      contracts: betContracts,
      query: { enabled: betContracts.length > 0 },
    });

  const rows = useMemo<PortfolioMarketRow[]>(() => {
    if (!infoResults?.length) return [];

    return infoResults.flatMap((row, idx) => {
      if (row.status !== "success" || !row.result) return [];

      const parsed = row.result as readonly [
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

      const [question, deadline, statusRaw, , totalCollateral, , , , creator] =
        parsed;
      const statusIndex = Number(statusRaw);
      const statusLabel =
        statusIndex >= 0 && statusIndex < STATUS_LABELS.length
          ? STATUS_LABELS[statusIndex]
          : "Unknown";

      const marketAddress = marketAddresses[idx];
      if (!marketAddress) return [];

      const hasBet =
        !!address &&
        !!betResults &&
        betResults[idx]?.status === "success" &&
        Boolean(betResults[idx].result);

      return [
        {
          address: marketAddress,
          title: question || "Untitled market",
          statusLabel,
          closeDate: formatCloseDate(deadline),
          volume: formatUsdt(totalCollateral),
          creator: creator.toLowerCase(),
          hasBet,
        },
      ];
    });
  }, [address, betResults, infoResults, marketAddresses]);

  const createdMarkets = useMemo(
    () => rows.filter((r) => !!address && r.creator === address.toLowerCase()),
    [rows, address],
  );
  const positionMarkets = useMemo(() => rows.filter((r) => r.hasBet), [rows]);

  const isLoadingMarkets =
    loadingTotal || loadingAddresses || loadingInfos || loadingBets;
  const marketsError = totalError ?? addressesError ?? infoError ?? betsError;

  const nativeBalance = nativeBalanceData?.value
    ? Number(formatUnits(nativeBalanceData.value, nativeBalanceData.decimals))
        .toFixed(4)
    : "0.0000";
  const usdtBalance = usdtBalanceData
    ? Number(formatUnits(usdtBalanceData as bigint, 6)).toFixed(2)
    : "0.00";

  return (
    <div
      className="flex flex-col gap-8 p-8"
      style={{ background: "#161616", minHeight: "100vh" }}
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">Portfolio</h1>
        <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.4)" }}>
          View your wallet balances, markets you created, and sealed positions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className="flex flex-col gap-2 p-5 rounded-xl relative overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#7B6EF4] opacity-10 blur-3xl rounded-full" />
          <span className="text-xs uppercase tracking-widest text-white/40 font-semibold">
            Wallet USDT Value
          </span>
          <span className="text-3xl font-bold text-white">
            {loadingUsdt ? "…" : `$${usdtBalance}`}
          </span>
        </div>

        <div
          className="flex flex-col gap-3 p-5 rounded-xl"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <span className="text-xs uppercase tracking-widest text-white/40 font-semibold">
            Wallet Balances
          </span>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/80 font-medium">USDT</span>
            <span className="text-xl font-mono text-white">
              {loadingUsdt ? "…" : `$${usdtBalance}`}
            </span>
          </div>
          <div
            className="w-full h-px"
            style={{ background: "rgba(255,255,255,0.05)" }}
          />
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/80 font-medium">Native A0GI</span>
            <span className="text-[15px] font-mono text-white/60">
              {loadingNative ? "…" : nativeBalance}
            </span>
          </div>
        </div>

        <div
          className="flex flex-col gap-2 p-5 rounded-xl relative overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#34d399] opacity-10 blur-2xl rounded-full" />
          <span className="text-xs uppercase tracking-widest text-white/40 font-semibold">
            Active Positions
          </span>
          <span className="text-3xl font-bold text-white">
            {address ? positionMarkets.length : 0}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-6 mt-4">
        <div
          className="flex border-b"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("Pos")}
            className={`pb-4 px-6 text-sm font-semibold transition-all relative min-h-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B6EF4] ${activeTab === "Pos" ? "text-white" : "text-white/40 hover:text-white/70"}`}
          >
            My Positions
            {activeTab === "Pos" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7B6EF4]" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("Markets")}
            className={`pb-4 px-6 text-sm font-semibold transition-all relative min-h-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B6EF4] ${activeTab === "Markets" ? "text-white" : "text-white/40 hover:text-white/70"}`}
          >
            Created Markets
            {activeTab === "Markets" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7B6EF4]" />
            )}
          </button>
        </div>

        {!address && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
            Connect your wallet to load your portfolio data.
          </div>
        )}

        {marketsError && (
          <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-300">
            Could not load portfolio markets.{" "}
            <button
              type="button"
              onClick={() => void refetch()}
              className="underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            >
              Retry
            </button>
          </div>
        )}

        {isLoadingMarkets && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`portfolio-skeleton-${i}`}
                className="h-[68px] rounded-xl"
                style={{
                  border: "1px solid rgba(255,255,255,0.04)",
                  background: "rgba(255,255,255,0.03)",
                  animation: "skeleton-pulse 1.5s ease-in-out infinite",
                }}
              />
            ))}
          </div>
        )}

        {activeTab === "Pos" && (
          <div className="flex flex-col gap-3">
            <div
              className="grid grid-cols-6 px-5 py-3 rounded-lg items-center"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <span className="col-span-3 text-xs text-white/40 uppercase tracking-wider font-semibold">
                Market
              </span>
              <span className="col-span-1 text-xs text-white/40 uppercase tracking-wider font-semibold">
                Status
              </span>
              <span className="col-span-1 text-xs text-white/40 uppercase tracking-wider font-semibold">
                Position
              </span>
              <span className="col-span-1 text-xs text-white/40 uppercase tracking-wider font-semibold text-right">
                Closes
              </span>
            </div>

            {!isLoadingMarkets && positionMarkets.length === 0 && (
              <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-6 text-center text-sm text-white/40">
                No sealed positions yet. Open a market and place a bet to see it
                here.
              </div>
            )}

            {!isLoadingMarkets &&
              positionMarkets.map((market) => (
                <Link
                  key={market.address}
                  href={`/market/${market.address}`}
                  className="grid grid-cols-6 px-5 py-4 rounded-xl items-center transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B6EF4]"
                  style={{ border: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <p className="col-span-3 text-sm font-semibold text-white pr-4 leading-snug">
                    {market.title}
                  </p>
                  <span
                    className="col-span-1 text-xs font-semibold"
                    style={{ color: marketStatusTone(market.statusLabel).color }}
                  >
                    {market.statusLabel}
                  </span>
                  <span className="col-span-1 text-xs font-semibold text-[#7B6EF4]">
                    Sealed
                  </span>
                  <span className="col-span-1 text-sm text-white/50 font-mono text-right">
                    {market.closeDate}
                  </span>
                </Link>
              ))}
          </div>
        )}

        {activeTab === "Markets" && (
          <div className="flex flex-col gap-3">
            <div
              className="grid grid-cols-5 px-5 py-3 rounded-lg items-center"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <span className="col-span-2 text-xs text-white/40 uppercase tracking-wider font-semibold">
                Market Info
              </span>
              <span className="col-span-1 text-xs text-white/40 uppercase tracking-wider font-semibold">
                Pool
              </span>
              <span className="col-span-1 text-xs text-white/40 uppercase tracking-wider font-semibold">
                Status
              </span>
              <span className="col-span-1 text-xs text-white/40 uppercase tracking-wider font-semibold text-right">
                Close Date
              </span>
            </div>

            {!isLoadingMarkets && createdMarkets.length === 0 && (
              <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-6 text-center text-sm text-white/40">
                You have not created a market yet.
              </div>
            )}

            {!isLoadingMarkets &&
              createdMarkets.map((market) => (
                <Link
                  key={market.address}
                  href={`/market/${market.address}`}
                  className="grid grid-cols-5 px-5 py-4 rounded-xl items-center transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B6EF4]"
                  style={{ border: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <p className="col-span-2 text-sm font-semibold text-white pr-4 leading-snug">
                    {market.title}
                  </p>
                  <span className="col-span-1 text-sm text-white/80 font-mono">
                    {market.volume}
                  </span>
                  <div className="col-span-1">
                    <span
                      className="px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-widest"
                      style={{
                        background: marketStatusTone(market.statusLabel).background,
                        color: marketStatusTone(market.statusLabel).color,
                        border: `1px solid ${marketStatusTone(market.statusLabel).border}`,
                      }}
                    >
                      {market.statusLabel}
                    </span>
                  </div>
                  <span className="col-span-1 text-sm text-white/50 font-mono text-right">
                    {market.closeDate}
                  </span>
                </Link>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
