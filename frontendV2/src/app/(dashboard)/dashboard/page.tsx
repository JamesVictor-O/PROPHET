"use client";

import Link from "next/link";
import { formatUnits } from "viem";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Activity01Icon,
  AnalyticsUpIcon,
  SafeIcon,
  ArrowUpRight01Icon,
} from "@hugeicons/core-free-icons";
import { useMarkets } from "@/lib/hooks/use-markets";
import { marketStatusTone } from "@/lib/market-status";

function formatUsdt(raw: bigint): string {
  const n = Number(formatUnits(raw, 6));
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export default function DashboardPage() {
  const { markets, totalCount, isLoading } = useMarkets();

  const openCount     = markets.filter((m) => m.chainStatus === "Open").length;
  const resolvedCount = markets.filter((m) => m.chainStatus === "Resolved").length;
  const totalVolume   = markets.reduce((s, m) => s + m.rawCollateral, BigInt(0));

  const recentMarkets = markets.slice(0, 5);

  const metrics = [
    {
      label: "Total Markets",
      value: isLoading ? "—" : String(totalCount),
      sub:   isLoading ? "Loading…" : `${openCount} open · ${resolvedCount} resolved`,
      icon:  Activity01Icon,
    },
    {
      label: "Live Markets",
      value: isLoading ? "—" : String(openCount),
      sub:   isLoading ? "Loading…" : "Accepting bets now",
      icon:  AnalyticsUpIcon,
    },
    {
      label: "Total Volume",
      value: isLoading ? "—" : formatUsdt(totalVolume),
      sub:   isLoading ? "Loading…" : "Cumulative USDT collateral",
      icon:  SafeIcon,
    },
  ];

  return (
    <div className="p-8 mx-auto flex flex-col gap-8 min-h-screen">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-sm text-white/40">
            Live on-chain overview of the Prophet prediction market protocol.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {metrics.map((stat, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 p-5 rounded-xl border border-white/10 bg-white/5 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <HugeiconsIcon icon={stat.icon} size={64} color="#7B6EF4" />
            </div>
            <span className="text-xs uppercase tracking-widest text-[#7B6EF4] font-medium">
              {stat.label}
            </span>
            <span className="text-3xl font-bold text-white">{stat.value}</span>
            <span className="text-xs text-white/40">{stat.sub}</span>
          </div>
        ))}
      </div>

      {/* Recent Markets Table */}
      <div className="flex flex-col border border-white/10 bg-white/5 rounded-xl overflow-hidden mt-4">
        <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Recent Markets</h2>
          <Link
            href="/markets"
            className="text-xs text-white/40 hover:text-[#7B6EF4] transition-colors flex items-center gap-1"
          >
            View all
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={12} />
          </Link>
        </div>

        {isLoading ? (
          <div className="px-6 py-8 text-center text-white/30 text-sm">
            Loading markets from 0G Chain…
          </div>
        ) : recentMarkets.length === 0 ? (
          <div className="px-6 py-8 text-center text-white/30 text-sm">
            No markets found. Create the first one!
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-xs text-white/40 uppercase tracking-wider">
                <th className="px-6 py-3 font-medium">Market</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Volume</th>
              </tr>
            </thead>
            <tbody>
              {recentMarkets.map((market) => (
                <tr
                  key={market.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors text-sm"
                >
                  <td className="px-6 py-4 text-white font-medium max-w-xs">
                    <Link
                      href={`/market/${market.id}`}
                      className="hover:text-[#7B6EF4] transition-colors line-clamp-1"
                      title={market.title}
                    >
                      {market.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-white/50 text-xs">
                    {market.category}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        color: marketStatusTone(market.chainStatus).color,
                        background: marketStatusTone(market.chainStatus).background,
                      }}
                    >
                      {market.chainStatus ?? "Unknown"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white/50 text-right text-xs">
                    {market.volume}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
