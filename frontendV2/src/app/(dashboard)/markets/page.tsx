"use client";

import dynamic from "next/dynamic";
import MarketCard from "../_components/markets/market-card";
import { HugeiconsIcon } from "@hugeicons/react";
import { GridViewIcon } from "@hugeicons/core-free-icons";
import { useMarkets } from "@/lib/hooks/use-markets";

const PriceChart = dynamic(() => import("../../_components/price-chart"), {
  ssr: false,
});

export default function MarketsPage() {
  const { markets, totalCount, isLoading, isError, error, refetch } =
    useMarkets();

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
        <button
          type="button"
          onClick={() => void refetch()}
          className="text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          Refresh
        </button>
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
          <PriceChart markets={markets} />
        </div>
      </div>

      {/* Grid of Markets */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-white">
            On-chain markets
            {totalCount > 0 && (
              <span className="text-sm font-normal text-white/35 ml-2">
                ({totalCount})
              </span>
            )}
          </span>
          <div
            className="flex items-center gap-1 p-1"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <button
              type="button"
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

        {isError && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-300">
            Could not load markets:{" "}
            {error instanceof Error ? error.message : "unknown error"}
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((k) => (
              <div
                key={k}
                className="h-56 rounded-xl animate-pulse bg-white/[0.06] border border-white/[0.07]"
              />
            ))}
          </div>
        )}

        {!isLoading && !isError && markets.length === 0 && (
          <p className="text-sm text-white/35 py-8 text-center border border-dashed border-white/10 rounded-xl">
            No markets yet. Create one from the dashboard.
          </p>
        )}

        {!isLoading && markets.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {markets.map((m) => (
              <MarketCard key={m.id} market={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
