"use client";

import dynamic from "next/dynamic";
import MarketCard, { ProphetMarket } from "../_components/markets/market-card";
import { HugeiconsIcon } from "@hugeicons/react";
import { GridViewIcon } from "@hugeicons/core-free-icons";

const PriceChart = dynamic(() => import("../../_components/price-chart"), {
  ssr: false,
});

const MOCK_MARKETS: ProphetMarket[] = [
  {
    id: "will-btc-hit-100k",
    title: "Will Bitcoin hit $100k by Q4 2026?",
    category: "Crypto",
    price: 82,
    change: 4.2,
    volume: "$1.2M",
    closeDate: "Dec 31",
  },
  {
    id: "zero-g-labs-mainnet",
    title: "Will 0G Labs Mainnet launch before 2027?",
    category: "Ecosystem",
    price: 95,
    change: 12.1,
    volume: "$840K",
    closeDate: "Dec 1",
  },
  {
    id: "ai-agent-bill",
    title: "Will the US pass the AI Agent Rights Bill?",
    category: "Politics",
    price: 14,
    change: -2.3,
    volume: "$45K",
    closeDate: "Nov 4",
  },
  {
    id: "eth-flip-sol",
    title: "Will SOL flip ETH in market cap this year?",
    category: "Crypto",
    price: 34,
    change: 8.4,
    volume: "$4.1M",
    closeDate: "Dec 31",
  },
  {
    id: "prophet-tvl",
    title: "Will Prophet TVL exceed $100M?",
    category: "Prophet",
    price: 77,
    change: 1.1,
    volume: "$2M",
    closeDate: "Sep 1",
  },
  {
    id: "gpt-6-release",
    title: "Will GPT-6 be announced in 2026?",
    category: "Tech",
    price: 62,
    change: -5.4,
    volume: "$600K",
    closeDate: "Oct 1",
  },
  {
    id: "fed-rate-cut",
    title: "Will the Fed cut rates by 50bps in June?",
    category: "Finance",
    price: 44,
    change: 18.2,
    volume: "$10M",
    closeDate: "Jun 1",
  },
  {
    id: "spacex-mars",
    title: "Will SpaceX land on Mars by Dec 2026?",
    category: "Space",
    price: 5,
    change: -1.0,
    volume: "$230K",
    closeDate: "Dec 31",
  },
];

export default function MarketsPage() {
  return (
    <div className="p-8  mx-auto flex flex-col gap-8 min-h-screen">
      <div className="flex items-end justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Explore Markets
          </h1>
          <p className="text-sm text-white/40">
            Trade directly on the 0G network with zero front-running.
          </p>
        </div>
      </div>

      {/* Aggregate Volume Graph */}
      <div
        className="flex flex-col rounded-xl overflow-hidden"
        style={{
          border: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.015)",
        }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
          <span className="text-[12px] font-semibold text-[#7B6EF4] uppercase tracking-widest">
            Protocol Volume (30D)
          </span>
        </div>
        <div className="p-4" style={{ height: 280 }}>
          <PriceChart />
        </div>
      </div>

      {/* Grid of Markets */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-white">
            Trending Contracts
          </span>
          <div
            className="flex items-center gap-1 p-1"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <button
              className="flex items-center justify-center w-7 h-7"
              style={{
                background: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.8)",
              }}
            >
              <HugeiconsIcon
                icon={GridViewIcon}
                size={13}
                color="currentColor"
                strokeWidth={1.5}
              />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {MOCK_MARKETS.map((m) => (
            <MarketCard key={m.id} market={m} />
          ))}
        </div>
      </div>
    </div>
  );
}
