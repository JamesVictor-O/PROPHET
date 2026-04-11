"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowUpRight01Icon,
  Activity01Icon,
  AnalyticsUpIcon,
  SafeIcon,
} from "@hugeicons/core-free-icons";
import CreateMarketModal from "../_components/create-market-modal";

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-8  mx-auto flex flex-col gap-8 min-h-screen">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-sm text-white/40">
            Your automated positions and overview of the Prophet ecosystem.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all hover:opacity-90"
          style={{ background: "#7B6EF4", color: "#0a0a0a" }}
        >
          Create Market
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          {
            label: "Active Positions",
            value: "$4,250",
            sub: "+$320 (this week)",
            icon: Activity01Icon,
          },
          {
            label: "Win Rate",
            value: "72.4%",
            sub: "Last 50 automated trades",
            icon: AnalyticsUpIcon,
          },
          {
            label: "Liquidity Staked",
            value: "$12,000",
            sub: "Earning 11.2% APR",
            icon: SafeIcon,
          },
        ].map((stat, i) => (
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

      {/* Recent Activity Table */}
      <div className="flex flex-col border border-white/10 bg-white/5 rounded-xl overflow-hidden mt-4">
        <div className="px-6 py-4 border-b border-white/10 bg-white/5">
          <h2 className="text-sm font-semibold text-white">
            Recent Agent Executions
          </h2>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-xs text-white/40 uppercase tracking-wider">
              <th className="px-6 py-3 font-medium">Market</th>
              <th className="px-6 py-3 font-medium">Agent Log</th>
              <th className="px-6 py-3 font-medium">Outcome</th>
            </tr>
          </thead>
          <tbody>
            {[
              {
                market: "Will 0G Labs reach 1B TVL by Q3?",
                log: "TEE Decryption complete - Placed YES",
                outcome: "+$450",
              },
              {
                market: "Polymarket regulatory action in 2026?",
                log: "Market Maker Agent seeded $2000 liquidity",
                outcome: "--",
              },
              {
                market: "Are agents trading over 50% volume?",
                log: "Oracle Resolution verified via 0G Compute",
                outcome: "Resolved YES",
              },
            ].map((row, i) => (
              <tr
                key={i}
                className="border-b border-white/5 hover:bg-white/5 transition-colors text-sm"
              >
                <td className="px-6 py-4 text-white font-medium">
                  {row.market}
                </td>
                <td className="px-6 py-4 text-white/50">{row.log}</td>
                <td className="px-6 py-4 text-[#34d399] font-medium">
                  {row.outcome}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CreateMarketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
