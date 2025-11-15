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
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

// Mock market data
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

  const filteredMarkets = useMemo(() => {
    return mockMarkets.filter((market) => {
      const matchesSearch =
        market.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        market.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || market.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handlePredict = (marketId: string, side?: "yes" | "no") => {
    const market = mockMarkets.find((m) => m.id === marketId);
    if (market) {
      setSelectedMarket(market);
      setSelectedSide(side);
      setPredictionModalOpen(true);
    }
  };

  const handleCreateMarket = () => {
    setCreateMarketModalOpen(true);
  };

  const handleMarketCreated = (marketData: MarketData) => {
    // In a real app, this would make an API call to create the market
    console.log("Market created:", marketData);
    toast.success(
      "Market created successfully! It will be reviewed and published soon."
    );

    // You could also add the new market to the list here
    // setMarkets([...markets, newMarket]);
  };

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
          {filteredMarkets.length > 0 ? (
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
