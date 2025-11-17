"use client";

import { useState, useMemo, useCallback } from "react";
import { useAccount, useSwitchChain } from "wagmi";
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
import { Plus, Loader2, AlertTriangle } from "lucide-react";
import { useAllMarkets } from "@/hooks/contracts/useAllMarkets";
import { defaultChain, addCeloSepoliaToMetaMask } from "@/lib/wallet-config";
import { toast } from "sonner";

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

  // Check network
  const { chainId } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const isCorrectNetwork = chainId === defaultChain.id;
  const isWrongNetwork = chainId !== undefined && !isCorrectNetwork;

  const handleSwitchNetwork = async () => {
    try {
      // First try to switch using wagmi
      await switchChain({ chainId: defaultChain.id });
      toast.success("Switched to Celo Sepolia");
    } catch (error: unknown) {
      console.error("Error switching network:", error);
      const err = error as { code?: number };

      // If network doesn't exist (4902), try to add it
      if (err?.code === 4902) {
        toast.info("Adding Celo Sepolia network to your wallet...");
        const added = await addCeloSepoliaToMetaMask();
        if (added) {
          toast.success("Network added! Please try again.");
        } else {
          toast.error(
            "Failed to add network. Please add manually in MetaMask."
          );
        }
      } else {
        // For other errors, try direct MetaMask call as fallback
        try {
          const added = await addCeloSepoliaToMetaMask();
          if (added) {
            toast.success("Switched to Celo Sepolia");
          } else {
            toast.error(
              "Failed to switch network. Please switch manually in MetaMask."
            );
          }
        } catch (fallbackError) {
          console.error("Fallback network switch failed:", fallbackError);
          toast.error(
            "Failed to switch network. Please switch manually in MetaMask."
          );
        }
      }
    }
  };

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
      "2. Wrong network (should be Celo Sepolia - chain ID 11142220)"
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
        predictions: 0, // TODO: Fetch actual prediction count
        pool: market.poolFormatted,
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

          {/* Network Warning Banner */}
          {isWrongNetwork && (
            <div className="mb-6 bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                <div>
                  <p className="text-orange-400 font-semibold">Wrong Network</p>
                  <p className="text-gray-400 text-sm">
                    Please switch to Celo Sepolia (Chain ID: 11142220) to use
                    this app
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSwitchNetwork}
                disabled={isSwitching}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isSwitching ? "Switching..." : "Switch Network"}
              </Button>
            </div>
          )}

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
                    <strong>Celo Sepolia</strong> (Chain ID: 11142220)
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
