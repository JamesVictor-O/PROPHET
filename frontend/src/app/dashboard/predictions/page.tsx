"use client";

import { useState, useMemo } from "react";
import { useAccount } from "wagmi";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PredictionCard } from "@/components/predictions/prediction-card";
import { PredictionsStats } from "@/components/predictions/predictions-stats";
import { PredictionsFilter } from "@/components/predictions/predictions-filter";
import { useUserPredictions } from "@/hooks/contracts";
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

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      <DashboardNav />

      {/* Layout Wrapper */}
      <div className="pt-16 flex">
        {/* Sidebar - Hidden on Mobile */}
        <div className="hidden lg:block">
          <DashboardSidebar />
        </div>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 p-4 sm:p-5 md:p-6">
          {/* Page Header */}
          <div className="mb-5 sm:mb-7">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
              My Predictions
            </h1>
            <p className="text-gray-400 text-sm sm:text-base mt-1">
              Track your predictions and earnings
            </p>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="text-center py-10 sm:py-12">
              <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 animate-spin mx-auto mb-3 text-[#2563EB]" />
              <p className="text-gray-400 text-sm sm:text-base">
                Loading your predictions...
              </p>
            </div>
          )}

          {/* Not Connected */}
          {!isConnected && !isLoading && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-base sm:text-lg mb-3">
                Connect your wallet to view predictions
              </p>
            </div>
          )}

          {/* Stats */}
          {isConnected && !isLoading && userPredictions && (
            <div className="mb-5 sm:mb-8">
              <PredictionsStats
                stats={{
                  total: userPredictions.length,
                  active: userPredictions.filter((p) => p.status === "active")
                    .length,
                  won: userPredictions.filter((p) => p.status === "won").length,
                  lost: userPredictions.filter((p) => p.status === "lost")
                    .length,
                  totalEarned: userPredictions
                    .filter((p) => p.status === "won" && p.actualWin)
                    .reduce((sum, p) => sum + (p.actualWin || 0), 0),
                  totalStaked: userPredictions.reduce(
                    (sum, p) => sum + p.stake,
                    0
                  ),
                  winRate: "0",
                }}
              />
            </div>
          )}

          {/* Filters */}
          {isConnected && !isLoading && userPredictions?.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <PredictionsFilter filter={filter} onFilterChange={setFilter} />
            </div>
          )}

          {/* Predictions Section */}
          {isConnected && !isLoading && userPredictions?.length > 0 && (
            <Tabs defaultValue="all" className="w-full">
              {/* Mobile Scrollable Tabs */}
              <TabsList
                className="
                w-full overflow-x-auto scrollbar-none
                flex sm:grid sm:grid-cols-3 gap-1
                bg-[#1E293B] border border-[#334155] rounded-lg p-1
              "
              >
                <TabsTrigger value="all" className="flex-1 text-sm">
                  All ({filteredPredictions.length})
                </TabsTrigger>
                <TabsTrigger value="active" className="flex-1 text-sm">
                  Active ({activePredictions.length})
                </TabsTrigger>
                <TabsTrigger value="resolved" className="flex-1 text-sm">
                  Resolved ({resolvedPredictions.length})
                </TabsTrigger>
              </TabsList>

              {/* ALL */}
              <TabsContent value="all" className="mt-5">
                {filteredPredictions.length > 0 ? (
                  <div
                    className="
                    grid 
                    grid-cols-1
                    sm:grid-cols-2 
                    xl:grid-cols-3
                    gap-4 sm:gap-5 lg:gap-6
                  "
                  >
                    {filteredPredictions.map((p) => (
                      <PredictionCard key={p.id} prediction={p} />
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No predictions found" />
                )}
              </TabsContent>

              {/* ACTIVE */}
              <TabsContent value="active" className="mt-5">
                {activePredictions.length > 0 ? (
                  <div
                    className="
                    grid 
                    grid-cols-1
                    sm:grid-cols-2 
                    xl:grid-cols-3
                    gap-4 sm:gap-5 lg:gap-6
                  "
                  >
                    {activePredictions.map((p) => (
                      <PredictionCard key={p.id} prediction={p} />
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No active predictions" />
                )}
              </TabsContent>

              {/* RESOLVED */}
              <TabsContent value="resolved" className="mt-5">
                {resolvedPredictions.length > 0 ? (
                  <div
                    className="
                    grid 
                    grid-cols-1
                    sm:grid-cols-2 
                    xl:grid-cols-3
                    gap-4 sm:gap-5 lg:gap-6
                  "
                  >
                    {resolvedPredictions.map((p) => (
                      <PredictionCard key={p.id} prediction={p} />
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No resolved predictions" />
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* Empty State */}
          {isConnected &&
            !isLoading &&
            (!userPredictions || userPredictions.length === 0) && (
              <EmptyState
                message="You haven't made any predictions yet"
                sub="Start predicting to see results here"
              />
            )}
        </main>
      </div>
    </div>
  );
}

// Reusable Empty State Component
function EmptyState({ message, sub }: { message: string; sub?: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-gray-400 text-base sm:text-lg mb-2">{message}</p>
      {sub && <p className="text-gray-500 text-sm">{sub}</p>}
    </div>
  );
}
