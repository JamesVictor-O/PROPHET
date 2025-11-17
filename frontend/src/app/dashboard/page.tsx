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

// Mock market data (fallback)
const mockMarkets: Market[] = [
  {
    id: "burna-album",
    category: "MUSIC",
    categoryColor: "bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20",
    timeLeft: "3d left",
    question: "Will Burna Boy drop an album in Q4 2024?",
    yesPercent: 68,
    noPercent: 32,
    predictions: 1234,
    pool: "$890",
  },
  {
    id: "bbnaija-eviction",
    category: "REALITY TV",
    categoryColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    timeLeft: "2d left",
    question: "Will Sarah be evicted from BBNaija this week?",
    yesPercent: 58,
    noPercent: 42,
    predictions: 2045,
    pool: "$1,234",
  },
  {
    id: "kot2-boxoffice",
    category: "MOVIES",
    categoryColor: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    timeLeft: "5d left",
    question: "Will 'King of Thieves 2' make ₦50M opening weekend?",
    yesPercent: 65,
    noPercent: 35,
    predictions: 789,
    pool: "$523",
  },
  {
    id: "wizkid-streams",
    category: "MUSIC",
    categoryColor: "bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20",
    timeLeft: "1d left",
    question: "Will Wizkid's new single hit 5M streams in week 1?",
    yesPercent: 73,
    noPercent: 27,
    predictions: 456,
    pool: "$342",
  },
  {
    id: "tems-grammy",
    category: "AWARDS",
    categoryColor: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    timeLeft: "7d left",
    question: "Will Tems win Grammy for Best New Artist?",
    yesPercent: 52,
    noPercent: 48,
    predictions: 892,
    pool: "$678",
  },
];

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
    console.error("2. Wrong network (should be Celo Sepolia - chain ID 44787)");
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
        predictions: 0, // TODO: Fetch actual prediction count
        pool: market.poolFormatted,
      };
    });
  }, [marketsData]);

  const filteredMarkets = useMemo(() => {
    const marketsToFilter = markets.length > 0 ? markets : mockMarkets;
    return marketsToFilter.filter((market) => {
      const matchesSearch =
        market.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        market.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || market.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [markets, searchQuery, selectedCategory]);

  const handlePredict = (marketId: string, side?: "yes" | "no") => {
    const allMarkets = markets.length > 0 ? markets : mockMarkets;
    const market = allMarkets.find((m) => m.id === marketId);
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
    <div className="min-h-screen bg-[#0F172A] text-white">
      <DashboardNav onCreateMarket={handleCreateMarket} />
      <div className="pt-16 flex">
        <DashboardSidebar onCreateMarket={handleCreateMarket} />

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8">
          {/* Header Section */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Markets</h1>
              <p className="text-gray-400">
                Predict entertainment outcomes and earn rewards
              </p>
            </div>
            <Button
              onClick={handleCreateMarket}
              className="bg-[#2563EB] hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Market
            </Button>
          </div>

          {/* Filters & Search */}
          <SearchFilters
            onSearchChange={setSearchQuery}
            onCategoryChange={setSelectedCategory}
          />

          {/* Markets Grid */}
          {isLoadingMarkets ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#2563EB]" />
              <p className="text-gray-400 text-lg">Loading markets...</p>
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <p className="text-red-400 text-lg mb-2">Error loading markets</p>
              <p className="text-gray-400 text-sm mb-4">
                The contract may not be deployed or you&apos;re on the wrong
                network.
              </p>
              <div className="text-left max-w-md mx-auto bg-[#1E293B] border border-[#334155] rounded-lg p-4 space-y-2">
                <p className="text-xs text-gray-300 font-semibold mb-2">
                  Troubleshooting:
                </p>
                <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                  <li>
                    Ensure you&apos;re connected to{" "}
                    <strong>Celo Sepolia</strong> (Chain ID: 44787)
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
              <p className="text-gray-500 text-xs mt-4">
                Showing mock data below for development purposes
              </p>
            </div>
          ) : filteredMarkets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
              {filteredMarkets.map((market) => (
                <MarketCard
                  key={market.id}
                  market={market}
                  onPredict={handlePredict}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">
                No markets found matching your criteria
              </p>
              {markets.length === 0 && (
                <p className="text-gray-500 text-sm mt-2">
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
