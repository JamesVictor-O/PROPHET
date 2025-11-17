"use client";

import { useState, useMemo } from "react";
import { useAccount } from "wagmi";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PredictionCard } from "@/components/predictions/prediction-card";
import { PredictionsStats } from "@/components/predictions/predictions-stats";
import { PredictionsFilter } from "@/components/predictions/predictions-filter";
import { useUserPredictions, UserPrediction } from "@/hooks/contracts";
import { Loader2 } from "lucide-react";

export default function PredictionsPage() {
  const { address, isConnected } = useAccount();
  const { data: userPredictions, isLoading } = useUserPredictions();
  const [filter, setFilter] = useState<"all" | "active" | "won" | "lost">(
    "all"
  );

  const filteredPredictions = useMemo(() => {
    if (!userPredictions) return [];
    if (filter === "all") return userPredictions;
    return userPredictions.filter((pred) => pred.status === filter);
  }, [userPredictions, filter]);

  const activePredictions = useMemo(
    () => filteredPredictions.filter((p) => p.status === "active"),
    [filteredPredictions]
  );

  const resolvedPredictions = useMemo(
    () => filteredPredictions.filter((p) => p.status !== "active"),
    [filteredPredictions]
  );

  const stats = useMemo(() => {
    if (!userPredictions) {
      return {
        total: 0,
        active: 0,
        won: 0,
        lost: 0,
        totalEarned: 0,
        totalStaked: 0,
        winRate: "0",
      };
    }

    const total = userPredictions.length;
    const active = userPredictions.filter((p) => p.status === "active").length;
    const won = userPredictions.filter((p) => p.status === "won").length;
    const lost = userPredictions.filter((p) => p.status === "lost").length;
    const totalEarned = userPredictions
      .filter((p) => p.status === "won" && p.actualWin)
      .reduce((sum, p) => sum + (p.actualWin || 0), 0);
    const totalStaked = userPredictions.reduce((sum, p) => sum + p.stake, 0);
    const winRate =
      won + lost > 0 ? ((won / (won + lost)) * 100).toFixed(0) : "0";

    return {
      total,
      active,
      won,
      lost,
      totalEarned,
      totalStaked,
      winRate,
    };
  }, [userPredictions]);

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      <DashboardNav />
      <div className="pt-16 flex">
        <DashboardSidebar />

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">My Predictions</h1>
            <p className="text-gray-400">
              Track your predictions and earnings
            </p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#2563EB]" />
              <p className="text-gray-400">Loading your predictions...</p>
            </div>
          )}

          {/* Not Connected State */}
          {!isConnected && !isLoading && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg mb-4">
                Please connect your wallet to view your predictions
              </p>
            </div>
          )}

          {/* Stats - Only show if connected and has predictions */}
          {isConnected && !isLoading && userPredictions && (
            <PredictionsStats stats={stats} />
          )}

          {/* Filters - Only show if connected and has predictions */}
          {isConnected && !isLoading && userPredictions && userPredictions.length > 0 && (
            <div className="mb-6">
              <PredictionsFilter filter={filter} onFilterChange={setFilter} />
            </div>
          )}

          {/* Predictions Tabs - Only show if connected and has predictions */}
          {isConnected && !isLoading && userPredictions && userPredictions.length > 0 && (
            <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3 bg-[#1E293B] border-[#334155]">
              <TabsTrigger value="all">All ({filteredPredictions.length})</TabsTrigger>
              <TabsTrigger value="active">
                Active ({activePredictions.length})
              </TabsTrigger>
              <TabsTrigger value="resolved">
                Resolved ({resolvedPredictions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              {filteredPredictions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredPredictions.map((prediction) => (
                    <PredictionCard
                      key={prediction.id}
                      prediction={prediction}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-lg">No predictions found</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="active" className="mt-6">
              {activePredictions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {activePredictions.map((prediction) => (
                    <PredictionCard
                      key={prediction.id}
                      prediction={prediction}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-lg">
                    No active predictions
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="resolved" className="mt-6">
              {resolvedPredictions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {resolvedPredictions.map((prediction) => (
                    <PredictionCard
                      key={prediction.id}
                      prediction={prediction}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-lg">
                    No resolved predictions
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
          )}

          {/* Empty State - Connected but no predictions */}
          {isConnected && !isLoading && (!userPredictions || userPredictions.length === 0) && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg mb-4">
                You haven&apos;t made any predictions yet
              </p>
              <p className="text-gray-500 text-sm">
                Start predicting on markets to see them here
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

