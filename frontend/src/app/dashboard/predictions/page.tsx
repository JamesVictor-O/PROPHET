"use client";

import { useState, useMemo } from "react";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PredictionCard } from "@/components/predictions/prediction-card";
import { PredictionsStats } from "@/components/predictions/predictions-stats";
import { PredictionsFilter } from "@/components/predictions/predictions-filter";

export interface Prediction {
  id: string;
  marketId: string;
  marketQuestion: string;
  category: string;
  categoryColor: string;
  side: "yes" | "no";
  stake: number;
  potentialWin: number;
  actualWin?: number;
  status: "active" | "won" | "lost" | "pending";
  marketStatus: "active" | "resolved";
  timeLeft?: string;
  resolvedAt?: string;
  yesPercent: number;
  noPercent: number;
  pool: string;
}

// Mock predictions data
const mockPredictions: Prediction[] = [
  {
    id: "pred-1",
    marketId: "burna-album",
    marketQuestion: "Will Burna Boy drop an album in Q4 2024?",
    category: "MUSIC",
    categoryColor: "bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20",
    side: "yes",
    stake: 5.0,
    potentialWin: 7.35,
    status: "active",
    marketStatus: "active",
    timeLeft: "3d left",
    yesPercent: 68,
    noPercent: 32,
    pool: "$890",
  },
  {
    id: "pred-2",
    marketId: "bbnaija-eviction",
    marketQuestion: "Will Sarah be evicted from BBNaija this week?",
    category: "REALITY TV",
    categoryColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    side: "no",
    stake: 3.5,
    potentialWin: 5.83,
    status: "active",
    marketStatus: "active",
    timeLeft: "2d left",
    yesPercent: 58,
    noPercent: 42,
    pool: "$1,234",
  },
  {
    id: "pred-3",
    marketId: "wizkid-streams",
    marketQuestion: "Will Wizkid's new single hit 5M streams in week 1?",
    category: "MUSIC",
    categoryColor: "bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20",
    side: "yes",
    stake: 2.0,
    actualWin: 2.74,
    status: "won",
    marketStatus: "resolved",
    resolvedAt: "2 days ago",
    yesPercent: 73,
    noPercent: 27,
    pool: "$342",
  },
  {
    id: "pred-4",
    marketId: "kot2-boxoffice",
    marketQuestion: "Will 'King of Thieves 2' make ₦50M opening weekend?",
    category: "MOVIES",
    categoryColor: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    side: "no",
    stake: 4.0,
    status: "lost",
    marketStatus: "resolved",
    resolvedAt: "5 days ago",
    yesPercent: 65,
    noPercent: 35,
    pool: "$523",
  },
  {
    id: "pred-5",
    marketId: "tems-grammy",
    marketQuestion: "Will Tems win Grammy for Best New Artist?",
    category: "AWARDS",
    categoryColor: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    side: "yes",
    stake: 1.5,
    potentialWin: 2.88,
    status: "active",
    marketStatus: "active",
    timeLeft: "7d left",
    yesPercent: 52,
    noPercent: 48,
    pool: "$678",
  },
  {
    id: "pred-6",
    marketId: "davido-collab",
    marketQuestion: "Will Davido collaborate with a major US artist this year?",
    category: "MUSIC",
    categoryColor: "bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20",
    side: "yes",
    stake: 6.0,
    actualWin: 9.23,
    status: "won",
    marketStatus: "resolved",
    resolvedAt: "1 week ago",
    yesPercent: 65,
    noPercent: 35,
    pool: "$1,200",
  },
];

export default function PredictionsPage() {
  const [filter, setFilter] = useState<"all" | "active" | "won" | "lost">(
    "all"
  );

  const filteredPredictions = useMemo(() => {
    if (filter === "all") return mockPredictions;
    return mockPredictions.filter((pred) => pred.status === filter);
  }, [filter]);

  const activePredictions = useMemo(
    () => filteredPredictions.filter((p) => p.status === "active"),
    [filteredPredictions]
  );

  const resolvedPredictions = useMemo(
    () => filteredPredictions.filter((p) => p.status !== "active"),
    [filteredPredictions]
  );

  const stats = useMemo(() => {
    const total = mockPredictions.length;
    const active = mockPredictions.filter((p) => p.status === "active").length;
    const won = mockPredictions.filter((p) => p.status === "won").length;
    const lost = mockPredictions.filter((p) => p.status === "lost").length;
    const totalEarned = mockPredictions
      .filter((p) => p.status === "won" && p.actualWin)
      .reduce((sum, p) => sum + (p.actualWin || 0), 0);
    const totalStaked = mockPredictions.reduce((sum, p) => sum + p.stake, 0);
    const winRate = total > 0 ? ((won / (won + lost)) * 100).toFixed(0) : "0";

    return {
      total,
      active,
      won,
      lost,
      totalEarned,
      totalStaked,
      winRate,
    };
  }, []);

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

          {/* Stats */}
          <PredictionsStats stats={stats} />

          {/* Filters */}
          <div className="mb-6">
            <PredictionsFilter filter={filter} onFilterChange={setFilter} />
          </div>

          {/* Predictions Tabs */}
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
        </main>
      </div>
    </div>
  );
}

