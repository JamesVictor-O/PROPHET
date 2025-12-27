"use client";

import { useState, useMemo } from "react";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { SearchFilters } from "@/components/dashboard/search-filters";
import { MarketCard, Market } from "@/components/markets/market-card";
import { PredictionModal } from "@/components/dashboard/prediction-modal";
import {
  CreateMarketModal,
  MarketData,
} from "@/components/markets/create-market-modal";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Info } from "lucide-react";
import { useAllMarkets } from "@/hooks/contracts/useAllMarkets";
import { defaultChain } from "@/lib/wallet-config";

// Category color mapping
const categoryColors: Record<string, string> = {
  music: "bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20",
  movies: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "reality-tv": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  awards: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  sports: "bg-green-500/10 text-green-400 border-green-500/20",
  other: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [predictionModalOpen, setPredictionModalOpen] = useState(false);
  const [createMarketModalOpen, setCreateMarketModalOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [selectedSide, setSelectedSide] = useState<"yes" | "no" | undefined>();

  const {
    data: marketsData,
    isLoading: isLoadingMarkets,
    isError,
    refetch: refetchMarkets,
  } = useAllMarkets();

  // Unified formatting for a professional look
  const markets: Market[] = useMemo(() => {
    if (!marketsData) return [];
    return marketsData.map((market) => ({
      id: market.id,
      category: market.category.toUpperCase(),
      categoryColor:
        categoryColors[market.category.toLowerCase()] || categoryColors.other,
      timeLeft: market.timeLeft,
      question: market.question,
      yesPercent: Math.round(market.yesPercent),
      noPercent: Math.round(market.noPercent),
      predictions: market.predictionCount || 0,
      pool: market.poolFormatted,
      marketType: market.marketType,
    }));
  }, [marketsData]);

  const filteredMarkets = useMemo(() => {
    return markets.filter((market) => {
      const matchesSearch = market.question
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" ||
        market.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [markets, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 selection:bg-blue-500/30">
      <DashboardNav onCreateMarket={() => setCreateMarketModalOpen(true)} />

      <div className="pt-16 flex">
        <DashboardSidebar />

        <main className="flex-1 lg:ml-64 px-6 py-10 lg:px-12 max-w-[1600px] mx-auto transition-all">
          {/* 1. High-End Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
            <div className="space-y-2">
              <h1 className="text-4xl font-light tracking-tight text-white leading-tight">
                Market{" "}
                <span className="text-slate-500 italic font-serif">
                  Discovery
                </span>
              </h1>
              <p className="text-slate-500 font-medium text-xs tracking-[0.15em] uppercase">
                Global Prediction Ledger • {markets.length} Active Events
              </p>
            </div>

            <Button
              onClick={() => setCreateMarketModalOpen(true)}
              className="bg-white text-black hover:bg-slate-200 rounded-full px-6 py-6 text-xs font-bold uppercase tracking-widest transition-all shadow-xl shadow-white/5"
            >
              <Plus className="w-4 h-4 mr-2 stroke-[3px]" />
              Initialize Market
            </Button>
          </div>

          {/* 2. Filters Wrapper - Ensuring it sits clean on the background */}
          <div className="mb-10">
            <SearchFilters
              onSearchChange={setSearchQuery}
              onCategoryChange={setSelectedCategory}
            />
          </div>

          {/* 3. Main Markets Content */}
          {isLoadingMarkets ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh]">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-4 opacity-50" />
              <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                Syncing Protocol...
              </p>
            </div>
          ) : isError ? (
            <ErrorState chainId={defaultChain.id} />
          ) : filteredMarkets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {filteredMarkets.map((market) => (
                <MarketCard
                  key={market.id}
                  market={market}
                  onPredict={(id, side) => {
                    setSelectedMarket(market);
                    setSelectedSide(side);
                    setPredictionModalOpen(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-32 border border-dashed border-white/5 rounded-[2rem]">
              <p className="text-slate-500 font-light italic">
                No results found in current sector.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Modals remain functional */}
      <PredictionModal
        open={predictionModalOpen}
        onOpenChange={setPredictionModalOpen}
        market={selectedMarket}
        selectedSide={selectedSide}
      />
      <CreateMarketModal
        open={createMarketModalOpen}
        onOpenChange={setCreateMarketModalOpen}
        onCreateMarket={async (market) => {
          // Market created callback - refetch markets to show the new one
          console.log("Market created:", market);
          // Wait a moment for the transaction to be indexed, then refetch
          setTimeout(() => {
            refetchMarkets();
          }, 2000);
        }}
      />
    </div>
  );
}

{
  /* --- Reusable Professional Error State --- */
}
function ErrorState({ chainId }: { chainId: number }) {
  return (
    <div className="max-w-xl mx-auto mt-20 p-8 rounded-[2rem] bg-rose-500/5 border border-rose-500/10 text-center">
      <Info className="w-8 h-8 text-rose-500 mx-auto mb-4" />
      <h3 className="text-white font-bold mb-2 uppercase text-[10px] tracking-widest">
        Protocol Sync Error
      </h3>
      <p className="text-slate-400 text-sm mb-6 font-medium">
        Ensure your wallet is connected to{" "}
        <span className="text-white">Base Sepolia (Chain ID: {chainId})</span>{" "}
        and refresh the page.
      </p>
      <div className="text-left bg-black/40 p-4 rounded-xl space-y-2 border border-white/5">
        <p className="text-[9px] text-slate-500 uppercase tracking-widest">
          Troubleshooting Terminal
        </p>
        <ul className="text-[11px] text-slate-400 font-mono space-y-1">
          <li>check_rpc_connection... FAILED</li>
          <li> verify_contract_address... PENDING</li>
        </ul>
      </div>
    </div>
  );
}
