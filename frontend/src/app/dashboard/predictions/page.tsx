"use client";

import { useState, useMemo } from "react";
import { useAccount } from "wagmi";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PredictionCard } from "@/components/predictions/prediction-card";
import { PredictionsStats } from "@/components/predictions/predictions-stats";
import { useUserPredictions } from "@/hooks/contracts";
import { Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function PredictionsPage() {
  const { address, isConnected } = useAccount();
  const { data: userPredictions, isLoading } = useUserPredictions();
  const [activeTab, setActiveTab] = useState("all");

  const { createdMarkets, stakedPredictions } = useMemo(() => {
    if (!userPredictions) return { createdMarkets: [], stakedPredictions: [] };
    const created = userPredictions.filter((p) => p.isCreator && p.stake === 0);
    const staked = userPredictions.filter((p) => p.stake > 0);
    return { createdMarkets: created, stakedPredictions: staked };
  }, [userPredictions]);

  const filteredStaked = useMemo(() => {
    if (activeTab === "all") return stakedPredictions;
    if (activeTab === "active")
      return stakedPredictions.filter((p) => p.status === "active");
    return stakedPredictions.filter((p) => p.status !== "active");
  }, [stakedPredictions, activeTab]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50">
      <DashboardNav />

      <div className="pt-16 flex">
        <DashboardSidebar />

        <main className="flex-1 lg:ml-64 px-6 py-10 lg:px-12 max-w-7xl mx-auto transition-all">
          {/* 1. Page Header - Clean & Elevated */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl font-light tracking-tight text-white">
                My Predictions
              </h1>
              <p className="text-slate-500 font-medium text-sm tracking-wide">
                PORTFOLIO PERFORMANCE & ACTIVE POSITIONS
              </p>
            </div>
            {stakedPredictions.length > 0 && (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-500/10"
              >
                <Plus className="w-4 h-4" /> New Prediction
              </Link>
            )}
          </header>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh]">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-4" />
              <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-bold">
                Syncing Ledger...
              </p>
            </div>
          ) : !isConnected ? (
            <div className="text-center py-20 border border-dashed border-white/5 rounded-3xl">
              <p className="text-slate-400 font-light">
                Connect your wallet to access your prediction history.
              </p>
            </div>
          ) : (
            <div className="space-y-16">
              {/* 2. Stats Section - Using the Minimalist Style */}
              <PredictionsStats
                stats={{
                  total: stakedPredictions.length,
                  active: stakedPredictions.filter((p) => p.status === "active")
                    .length,
                  won: stakedPredictions.filter((p) => p.status === "won")
                    .length,
                  lost: stakedPredictions.filter((p) => p.status === "lost")
                    .length,
                  totalEarned: stakedPredictions
                    .filter((p) => p.status === "won" && p.actualWin)
                    .reduce((sum, p) => sum + (p.actualWin || 0), 0),
                  totalStaked: stakedPredictions.reduce(
                    (sum, p) => sum + p.stake,
                    0
                  ),
                  winRate: "0", // Handled inside component
                }}
              />

              {/* 3. Predictions Section */}
              <div className="space-y-8">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <div className="flex items-center justify-between border-b border-white/5 mb-8">
                    <TabsList className="bg-transparent h-auto p-0 gap-8 rounded-none">
                      <PredictionTabTrigger
                        value="all"
                        label="Portfolio"
                        count={stakedPredictions.length}
                      />
                      <PredictionTabTrigger
                        value="active"
                        label="Active"
                        count={
                          stakedPredictions.filter((p) => p.status === "active")
                            .length
                        }
                      />
                      <PredictionTabTrigger
                        value="resolved"
                        label="Settled"
                        count={
                          stakedPredictions.filter((p) => p.status !== "active")
                            .length
                        }
                      />
                    </TabsList>
                  </div>

                  <TabsContent value={activeTab} className="mt-0 outline-none">
                    {filteredStaked.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
                        {filteredStaked.map((p) => (
                          <PredictionCard key={p.id} prediction={p} />
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        message={`No ${activeTab} predictions found`}
                      />
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              {/* 4. Created Markets Section - Subtle & Secondary */}
              {createdMarkets.length > 0 && (
                <div className="pt-16 border-t border-white/5">
                  <div className="flex items-center gap-4 mb-8">
                    <h2 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">
                      Markets Created by You
                    </h2>
                    <div className="h-px flex-1 bg-white/5" />
                    <span className="text-xs font-mono text-slate-600">
                      {createdMarkets.length} Units
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
                    {createdMarkets.map((p) => (
                      <PredictionCard key={p.id} prediction={p} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

{
  /* --- Reusable Professional Sub-components --- */
}

function PredictionTabTrigger({
  value,
  label,
  count,
}: {
  value: string;
  label: string;
  count: number;
}) {
  return (
    <TabsTrigger
      value={value}
      className="bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent rounded-none px-0 pb-4 text-slate-500 data-[state=active]:text-white transition-all uppercase text-[11px] tracking-widest font-bold flex items-center gap-2"
    >
      {label}
      <span className="text-[9px] font-mono opacity-50 bg-white/5 px-1.5 py-0.5 rounded">
        {count}
      </span>
    </TabsTrigger>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-20 bg-white/[0.01] border border-white/5 rounded-3xl">
      <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">
        {message}
      </p>
    </div>
  );
}
