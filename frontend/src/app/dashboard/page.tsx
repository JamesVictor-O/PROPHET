"use client";

import { useState, useMemo, useCallback } from "react";
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
import { Plus, Loader2 } from "lucide-react";
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

// Category display names
const categoryDisplayNames: Record<string, string> = {
  music: "MUSIC",
  movies: "MOVIES",
  "reality-tv": "REALITY TV",
  awards: "AWARDS",
  sports: "SPORTS",
  other: "OTHER",
};

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [predictionModalOpen, setPredictionModalOpen] = useState(false);
  const [createMarketModalOpen, setCreateMarketModalOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [selectedSide, setSelectedSide] = useState<"yes" | "no" | undefined>();

  // Fetch real markets from contract
  const {
    data: marketsData,
    isLoading: isLoadingMarkets,
    isError,
  } = useAllMarkets();

  // Debug: Log error details
  if (isError) {
    console.error("Error loading markets - check browser console for details");
    console.error("Possible issues:");
    console.error("1. Contract not deployed at the configured address");
    console.error(
      "2. Wrong network (should be Base Sepolia - chain ID " +
        defaultChain.id +
        ")"
    );
    console.error("3. RPC endpoint issues");
    console.error("4. Contract address mismatch");
  }

  // Convert contract data to Market format
  const markets: Market[] = useMemo(() => {
    if (!marketsData || marketsData.length === 0) {
      return [];
    }

    return marketsData.map((market) => {
      const categoryKey = market.category.toLowerCase();
      const categoryColor = categoryColors[categoryKey] || categoryColors.other;
      const categoryDisplay =
        categoryDisplayNames[categoryKey] || market.category.toUpperCase();

      return {
        id: market.id,
        category: categoryDisplay,
        categoryColor,
        timeLeft: market.timeLeft,
        question: market.question,
        yesPercent: Math.round(market.yesPercent),
        noPercent: Math.round(market.noPercent),
        predictions: market.predictionCount || 0,
        pool: market.poolFormatted,
        marketType: market.marketType,
      };
    });
  }, [marketsData]);

  const filteredMarkets = useMemo(() => {
    return markets.filter((market) => {
      const matchesSearch =
        market.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        market.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || market.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [markets, searchQuery, selectedCategory]);

  const handlePredict = (marketId: string, side?: "yes" | "no") => {
    const market = markets.find((m) => m.id === marketId);
    if (market) {
      setSelectedMarket(market);
      setSelectedSide(side);
      setPredictionModalOpen(true);
    }
  };

  const handleCreateMarket = () => {
    setCreateMarketModalOpen(true);
  };

  const handleMarketCreated = useCallback((marketData: MarketData) => {
    // Market creation is handled by the modal via smart contract
    // This callback is just for any additional UI updates if needed
    console.log("Market created:", marketData);
    // Optionally refetch markets here if needed
  }, []);

  return (
    <div className="min-h-screen bg-[#0F172A] text-white pb-20 lg:pb-0">
      <DashboardNav onCreateMarket={handleCreateMarket} />
      <div className="pt-14 sm:pt-16 flex">
        <DashboardSidebar onCreateMarket={handleCreateMarket} />

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 p-3 sm:p-4 md:p-6 lg:p-8 w-full">
          {/* Header Section */}
          <div className="mb-4 sm:mb-6 md:mb-8 flex flex-col gap-3 sm:gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
                  Markets
                </h1>
                <p className="text-sm sm:text-base text-gray-400">
                  Predict entertainment outcomes and earn rewards
                </p>
              </div>
              <Button
                onClick={handleCreateMarket}
                size="sm"
                className="bg-[#2563EB] hover:bg-blue-700 text-white shrink-0 h-9 sm:h-10 px-3 sm:px-4"
              >
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Create Prediction</span>
              </Button>
            </div>
          </div>

          {/* Filters & Search */}
          <SearchFilters
            onSearchChange={setSearchQuery}
            onCategoryChange={setSelectedCategory}
          />

          {/* Markets Grid */}
          {isLoadingMarkets ? (
            <div className="text-center py-8 sm:py-12">
              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin mx-auto mb-3 sm:mb-4 text-[#2563EB]" />
              <p className="text-gray-400 text-sm sm:text-base md:text-lg">
                Loading markets...
              </p>
            </div>
          ) : isError ? (
            <div className="text-center py-8 sm:py-12">
              <p className="text-red-400 text-base sm:text-lg mb-2">
                Error loading markets
              </p>
              <p className="text-gray-400 text-xs sm:text-sm mb-4 px-4">
                The contract may not be deployed or you&apos;re on the wrong
                network.
              </p>
              <div className="text-left max-w-md mx-auto bg-[#1E293B] border border-[#334155] rounded-lg p-3 sm:p-4 space-y-2">
                <p className="text-xs text-gray-300 font-semibold mb-2">
                  Troubleshooting:
                </p>
                <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                  <li>
                    Ensure you&apos;re connected to{" "}
                    <strong>Base Sepolia</strong> (Chain ID: {defaultChain.id})
                  </li>
                  <li>
                    Check that contracts are deployed at the configured
                    addresses
                  </li>
                  <li>Verify your RPC endpoint is working</li>
                  <li>
                    Check browser console (F12) for detailed error messages
                  </li>
                </ul>
              </div>
            </div>
          ) : filteredMarkets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-8">
              {filteredMarkets.map((market) => (
                <MarketCard
                  key={market.id}
                  market={market}
                  onPredict={handlePredict}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <p className="text-gray-400 text-base sm:text-lg">
                No markets found matching your criteria
              </p>
              {markets.length === 0 && (
                <p className="text-gray-500 text-xs sm:text-sm mt-2">
                  Create the first market to get started!
                </p>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Prediction Modal */}
      <PredictionModal
        open={predictionModalOpen}
        onOpenChange={setPredictionModalOpen}
        market={
          selectedMarket
            ? {
                id: selectedMarket.id,
                question: selectedMarket.question,
                category: selectedMarket.category,
                yesPercent: selectedMarket.yesPercent,
                noPercent: selectedMarket.noPercent,
                pool: selectedMarket.pool,
                marketType: selectedMarket.marketType, // Include marketType to differentiate Binary vs CrowdWisdom
              }
            : null
        }
        selectedSide={selectedSide}
      />

      {/* Create Market Modal */}
      <CreateMarketModal
        open={createMarketModalOpen}
        onOpenChange={setCreateMarketModalOpen}
        onCreateMarket={handleMarketCreated}
      />
    </div>
  );
}
