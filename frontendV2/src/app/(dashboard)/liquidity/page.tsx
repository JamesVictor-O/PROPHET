"use client";

import Link from "next/link";
import { formatUnits } from "viem";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SafeIcon,
  AnalyticsUpIcon,
  ChartLineData01Icon,
  Robot01Icon,
  ArrowUpRight01Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { useMarkets } from "@/lib/hooks/use-markets";

function formatUsdt(raw: bigint): string {
  const n = Number(formatUnits(raw, 6));
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

const STATUS_COLOR: Record<string, string> = {
  Open:       "#34d399",
  Resolved:   "#7B6EF4",
  Resolving:  "#60a5fa",
  Challenged: "#f97316",
  Cancelled:  "#6b7280",
  Pending:    "#fbbf24",
};

export default function LiquidityPage() {
  const { markets, isLoading } = useMarkets();

  // Aggregate metrics
  const totalLiquidity  = markets.reduce((s, m) => s + m.rawCollateral, BigInt(0));
  const activeLiquidity = markets
    .filter((m) => m.chainStatus === "Open")
    .reduce((s, m) => s + m.rawCollateral, BigInt(0));
  const marketsWithLiquidity = markets.filter((m) => m.rawCollateral > BigInt(0));

  // Sort by collateral descending
  const byLiquidity = [...markets].sort((a, b) =>
    a.rawCollateral > b.rawCollateral ? -1 : a.rawCollateral < b.rawCollateral ? 1 : 0
  );

  const metrics = [
    {
      label: "Total Locked",
      value: isLoading ? "—" : formatUsdt(totalLiquidity),
      sub:   "Cumulative USDT across all markets",
      icon:  SafeIcon,
      color: "#7B6EF4",
    },
    {
      label: "Active Pool",
      value: isLoading ? "—" : formatUsdt(activeLiquidity),
      sub:   "USDT in open markets accepting bets",
      icon:  AnalyticsUpIcon,
      color: "#34d399",
    },
    {
      label: "Markets with Liquidity",
      value: isLoading ? "—" : String(marketsWithLiquidity.length),
      sub:   `of ${markets.length} total markets`,
      icon:  ChartLineData01Icon,
      color: "#60a5fa",
    },
  ];

  return (
    <div className="p-8 mx-auto flex flex-col gap-8 min-h-screen">
      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Liquidity</h1>
        <p className="text-sm text-white/40">
          All prediction market pools on Prophet. Liquidity is provided automatically
          by the AI market maker agent running on 0G Compute.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {metrics.map((stat, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 p-5 rounded-xl border border-white/10 bg-white/5 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <HugeiconsIcon icon={stat.icon} size={64} color={stat.color} />
            </div>
            <span className="text-xs uppercase tracking-widest font-medium" style={{ color: stat.color }}>
              {stat.label}
            </span>
            <span className="text-3xl font-bold text-white">{stat.value}</span>
            <span className="text-xs text-white/40">{stat.sub}</span>
          </div>
        ))}
      </div>

      {/* Market Maker Info Banner */}
      <div
        className="flex items-start gap-4 p-5 rounded-xl border"
        style={{ background: "rgba(123,110,244,0.06)", borderColor: "rgba(123,110,244,0.2)" }}
      >
        <HugeiconsIcon icon={Robot01Icon} size={22} color="#7B6EF4" className="shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-white">
            AI Market Maker Agent
          </span>
          <span className="text-xs text-white/50 leading-relaxed">
            Prophet's market maker agent runs continuously on{" "}
            <span className="text-white/70">0G Compute</span> and seeds initial
            liquidity on every new market within seconds of creation. It reprices
            YES/NO odds in real time using AI inference, ensuring there is always a
            two-sided market — no human liquidity providers required.
          </span>
        </div>
      </div>

      {/* Markets by Liquidity Table */}
      <div className="flex flex-col border border-white/10 bg-white/5 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Markets by Liquidity</h2>
          <div className="flex items-center gap-1.5 text-xs text-white/30">
            <HugeiconsIcon icon={InformationCircleIcon} size={13} />
            <span>Sorted by USDT collateral locked</span>
          </div>
        </div>

        {isLoading ? (
          <div className="px-6 py-10 text-center text-white/30 text-sm">
            Loading pools from 0G Chain…
          </div>
        ) : byLiquidity.length === 0 ? (
          <div className="px-6 py-10 text-center text-white/30 text-sm">
            No markets yet. Create one to seed the first pool.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-xs text-white/40 uppercase tracking-wider">
                <th className="px-6 py-3 font-medium">Market</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Pool Size</th>
                <th className="px-6 py-3 font-medium text-right">Share</th>
                <th className="px-6 py-3 font-medium text-right"></th>
              </tr>
            </thead>
            <tbody>
              {byLiquidity.map((market) => {
                const share =
                  totalLiquidity > BigInt(0)
                    ? Number((market.rawCollateral * BigInt(10000)) / totalLiquidity) / 100
                    : 0;
                const color = STATUS_COLOR[market.chainStatus ?? ""] ?? "#6b7280";
                return (
                  <tr
                    key={market.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors text-sm"
                  >
                    <td className="px-6 py-4 text-white font-medium max-w-xs">
                      <span className="line-clamp-1" title={market.title}>
                        {market.title}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white/50 text-xs">{market.category}</td>
                    <td className="px-6 py-4">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ color, background: `${color}18` }}
                      >
                        {market.chainStatus ?? "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white font-mono text-right">
                      {formatUsdt(market.rawCollateral)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${share}%`, background: "#7B6EF4" }}
                          />
                        </div>
                        <span className="text-xs text-white/40 w-10 text-right">
                          {share.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/market/${market.id}`}
                        className="text-xs text-white/30 hover:text-[#7B6EF4] transition-colors flex items-center justify-end gap-1"
                      >
                        View
                        <HugeiconsIcon icon={ArrowUpRight01Icon} size={11} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* How liquidity works */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            step: "01",
            title: "Market Created",
            desc: "A user creates a prediction market. The factory deploys a new MarketContract on 0G Chain.",
          },
          {
            step: "02",
            title: "Agent Seeds Pool",
            desc: "The AI market maker detects the MarketCreated event and posts opening YES/NO odds via 0G Compute inference.",
          },
          {
            step: "03",
            title: "Bettors Add Depth",
            desc: "Users place sealed bets. Collateral is locked in the MarketContract. The pool grows with each position.",
          },
        ].map(({ step, title, desc }) => (
          <div
            key={step}
            className="flex flex-col gap-3 p-5 rounded-xl border border-white/10 bg-white/5"
          >
            <span className="text-xs font-mono text-[#7B6EF4] opacity-60">{step}</span>
            <span className="text-sm font-semibold text-white">{title}</span>
            <span className="text-xs text-white/40 leading-relaxed">{desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
