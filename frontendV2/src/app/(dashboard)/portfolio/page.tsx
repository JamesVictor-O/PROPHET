"use client";

import { useState } from "react";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { erc20Abi } from "viem";
import { MOCK_USDT_ADDRESS } from "@/lib/contracts";

// Dummy data structurally mapping to our expected future active market position events
const MOCK_POSITIONS = [
  {
    id: "pos-1",
    marketTitle: "Will BTC reach $100k by end of 2024?",
    side: "YES",
    shares: 500,
    avgPrice: 65,
    currentPrice: 72,
    pnlStr: "+$35.00",
    pnlColor: "#34d399",
  },
  {
    id: "pos-2",
    marketTitle: "Is AI going to consume 20% of global electricity by 2030?",
    side: "NO",
    shares: 1200,
    avgPrice: 30,
    currentPrice: 22,
    pnlStr: "-$96.00",
    pnlColor: "#f87171",
  },
];

// Dummy data corresponding to markets deployed by the user (simulating Subgraph Factory output)
const MOCK_CREATED_MARKETS = [
  {
    id: "mar-1",
    title: "Will the 0G network process 10M transactions in Q3?",
    liquidity: "$12,450",
    status: "Active",
    closesAt: "Nov 15, 2024",
  },
  {
    id: "mar-2",
    title: "Is AGI achievable before 2027?",
    liquidity: "$85,000",
    status: "Resolved",
    closesAt: "Jan 1, 2027",
  },
];

type TabType = "Pos" | "Markets";

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState<TabType>("Pos");
  const { address } = useAccount();

  // Read native 0G Balance
  const { data: nativeBalanceData } = useBalance({
    address: address,
  });

  // Read MockUSDT Balance via our mapped contract constants
  const { data: usdtAllowanceData } = useReadContract({
    address: MOCK_USDT_ADDRESS as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const nativeBalance = nativeBalanceData?.value
    ? Number(
        formatUnits(nativeBalanceData.value, nativeBalanceData.decimals),
      ).toFixed(4)
    : "0.0000";

  const usdtBalance = usdtAllowanceData
    ? Number(formatUnits(usdtAllowanceData as bigint, 18)).toFixed(2)
    : "0.00";

  // Calculate generic mock portfolio totals
  const totalValue = (Number(usdtBalance) + 537.45).toFixed(2); // Adding arbitrary dummy stake value
  const activeStake = "537.45";

  return (
    <div
      className="flex flex-col gap-8 p-8"
      style={{ background: "#161616", minHeight: "100vh" }}
    >
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">Portfolio</h1>
        <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.4)" }}>
          Manage your positions, track liquidity, and view your linked wallet
          balances.
        </p>
      </div>

      {/* Global Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Value */}
        <div
          className="flex flex-col gap-2 p-5 rounded-xl relative overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#7B6EF4] opacity-10 blur-3xl rounded-full" />
          <span className="text-xs uppercase tracking-widest text-white/40 font-semibold">
            Total Value
          </span>
          <span className="text-3xl font-bold text-white">${totalValue}</span>
        </div>

        {/* Wallet Balance */}
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
            <span className="text-xl font-mono text-white">${usdtBalance}</span>
          </div>
          <div
            className="w-full h-px"
            style={{ background: "rgba(255,255,255,0.05)" }}
          />
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/80 font-medium">
              Native A0GI
            </span>
            <span className="text-[15px] font-mono text-white/60">
              {nativeBalance}
            </span>
          </div>
        </div>

        {/* Active Stakes */}
        <div
          className="flex flex-col gap-2 p-5 rounded-xl relative overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#34d399] opacity-10 blur-2xl rounded-full" />
          <span className="text-xs uppercase tracking-widest text-white/40 font-semibold">
            Active Stakes
          </span>
          <span className="text-3xl font-bold text-white">${activeStake}</span>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex flex-col gap-6 mt-4">
        {/* Segments */}
        <div
          className="flex border-b"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          <button
            onClick={() => setActiveTab("Pos")}
            className={`pb-4 px-6 text-sm font-semibold transition-all relative ${activeTab === "Pos" ? "text-white" : "text-white/40 hover:text-white/70"}`}
          >
            My Positions
            {activeTab === "Pos" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7B6EF4]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("Markets")}
            className={`pb-4 px-6 text-sm font-semibold transition-all relative ${activeTab === "Markets" ? "text-white" : "text-white/40 hover:text-white/70"}`}
          >
            Created Markets
            {activeTab === "Markets" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7B6EF4]" />
            )}
          </button>
        </div>

        {/* Tab Content Display */}
        {activeTab === "Pos" && (
          <div className="flex flex-col gap-3">
            <div
              className="grid grid-cols-6 px-5 py-3 rounded-lg flex items-center"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <span className="col-span-2 text-xs text-white/40 uppercase tracking-wider font-semibold">
                Market
              </span>
              <span className="col-span-1 text-xs text-white/40 uppercase tracking-wider font-semibold">
                Position
              </span>
              <span className="col-span-1 text-xs text-white/40 uppercase tracking-wider font-semibold">
                Shares
              </span>
              <span className="col-span-1 text-xs text-white/40 uppercase tracking-wider font-semibold">
                Avg / Cur
              </span>
              <span className="col-span-1 text-xs text-white/40 uppercase tracking-wider font-semibold text-right">
                Est PNL
              </span>
            </div>

            {MOCK_POSITIONS.map((pos) => (
              <div
                key={pos.id}
                className="grid grid-cols-6 px-5 py-4 rounded-xl flex items-center transition-colors hover:bg-white/5"
                style={{ border: "1px solid rgba(255,255,255,0.04)" }}
              >
                <p className="col-span-2 text-sm font-semibold text-white pr-4 leading-snug">
                  {pos.marketTitle}
                </p>
                <div className="col-span-1">
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-bold ${pos.side === "YES" ? "bg-[#34d399]/10 text-[#34d399]" : "bg-[#f87171]/10 text-[#f87171]"}`}
                  >
                    {pos.side}
                  </span>
                </div>
                <span className="col-span-1 text-sm text-white/80 font-mono">
                  {pos.shares}
                </span>
                <span className="col-span-1 text-sm text-white/60 font-mono">
                  {pos.avgPrice}¢ /{" "}
                  <span className="text-white">{pos.currentPrice}¢</span>
                </span>
                <span
                  className="col-span-1 text-sm font-bold font-mono text-right"
                  style={{ color: pos.pnlColor }}
                >
                  {pos.pnlStr}
                </span>
              </div>
            ))}
            {/* Note for reviewers */}
            <div className="mt-4 p-4 rounded-xl border border-dashed border-white/20 bg-white/5 flex items-center justify-center">
              <span className="text-sm text-white/40 font-medium tracking-wide">
                Dynamic Contract Indexing System (Subgraph) Not Connected
                Globally Yet — Showing Preview
              </span>
            </div>
          </div>
        )}

        {activeTab === "Markets" && (
          <div className="flex flex-col gap-3">
            <div
              className="grid grid-cols-5 px-5 py-3 rounded-lg flex items-center"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <span className="col-span-2 text-xs text-white/40 uppercase tracking-wider font-semibold">
                Market Info
              </span>
              <span className="col-span-1 text-xs text-white/40 uppercase tracking-wider font-semibold">
                Liquidity
              </span>
              <span className="col-span-1 text-xs text-white/40 uppercase tracking-wider font-semibold">
                Status
              </span>
              <span className="col-span-1 text-xs text-white/40 uppercase tracking-wider font-semibold text-right">
                Close Date
              </span>
            </div>

            {MOCK_CREATED_MARKETS.map((market) => (
              <div
                key={market.id}
                className="grid grid-cols-5 px-5 py-4 rounded-xl flex items-center transition-colors hover:bg-white/5"
                style={{ border: "1px solid rgba(255,255,255,0.04)" }}
              >
                <p className="col-span-2 text-sm font-semibold text-white pr-4 leading-snug">
                  {market.title}
                </p>
                <span className="col-span-1 text-sm text-white/80 font-mono">
                  {market.liquidity}
                </span>
                <div className="col-span-1">
                  <span
                    className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-widest ${market.status === "Active" ? "bg-[#7B6EF4]/10 text-[#7B6EF4]" : "bg-white/10 text-white/50"}`}
                  >
                    {market.status}
                  </span>
                </div>
                <span className="col-span-1 text-sm text-white/50 font-mono text-right">
                  {market.closesAt}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
