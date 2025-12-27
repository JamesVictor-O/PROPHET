"use client";

import { useState, useMemo } from "react";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { LeaderboardEntry } from "@/components/leaderboard/leaderboard-entry";
import { LeaderboardFilters } from "@/components/leaderboard/leaderboard-filters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Trophy,
  Medal,
  Award,
  Loader2,
  Target,
  Zap,
  TrendingUp,
  Crown,
} from "lucide-react";
import { useLeaderboardGraphQL } from "@/hooks/graphql";
import type { LeaderboardEntryGraphQL } from "@/hooks/graphql";
import { cn } from "@/lib/utils";

export interface LeaderboardUser {
  id: string;
  rank: number;
  username: string;
  displayName: string;
  initials: string;
  wins: number;
  losses: number;
  accuracy: number;
  totalEarned: number;
  winStreak: number;
  avatar?: string;
}

export default function LeaderboardPage() {
  const [timeFilter, setTimeFilter] = useState<"all" | "month" | "week">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const {
    data: leaderboardData,
    isLoading,
    isError,
  } = useLeaderboardGraphQL(100);

  const mappedLeaderboard: LeaderboardUser[] = useMemo(() => {
    if (!leaderboardData) return [];
    return leaderboardData.map((entry: LeaderboardEntryGraphQL) => ({
      id: entry.address,
      rank: entry.rank,
      username: entry.username,
      displayName: entry.displayName,
      initials: entry.initials,
      wins: entry.wins,
      losses: 0,
      accuracy: entry.accuracy,
      totalEarned: entry.totalEarned,
      winStreak: entry.winStreak,
    }));
  }, [leaderboardData]);

  const topThree = useMemo(
    () => mappedLeaderboard.slice(0, 3),
    [mappedLeaderboard]
  );
  const rest = useMemo(() => mappedLeaderboard.slice(3), [mappedLeaderboard]);

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-blue-500/30">
      <DashboardNav />
      <div className="pt-16 flex">
        <DashboardSidebar />

        <main className="flex-1 lg:ml-64 p-4 md:p-8 relative overflow-hidden">
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

          {/* Header Section */}
          <div className="relative z-10 mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1 w-8 bg-blue-500 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">
                  Hall of Fame
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-none">
                Prophet <span className="text-slate-500">Leaderboard</span>
              </h1>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-1.5 rounded-2xl">
              <LeaderboardFilters
                timeFilter={timeFilter}
                categoryFilter={categoryFilter}
                onTimeFilterChange={setTimeFilter}
                onCategoryFilterChange={setCategoryFilter}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                <div className="absolute inset-0 blur-xl bg-blue-500/20 animate-pulse" />
              </div>
              <p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-500">
                Syncing Rankings...
              </p>
            </div>
          ) : (
            <>
              {/* The Podium Arena */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-end">
                {/* 2nd Place */}
                {topThree[1] && (
                  <PodiumCard user={topThree[1]} rank={2} color="silver" />
                )}

                {/* 1st Place */}
                {topThree[0] && (
                  <PodiumCard user={topThree[0]} rank={1} color="gold" />
                )}

                {/* 3rd Place */}
                {topThree[2] && (
                  <PodiumCard user={topThree[2]} rank={3} color="bronze" />
                )}
              </div>

              {/* Main Table */}
              <Card className="bg-[#0F172A]/40 backdrop-blur-xl border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <CardHeader className="p-8 border-b border-white/5 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Global Standing
                  </CardTitle>
                  <div className="flex gap-4 text-[10px] font-bold text-slate-500 uppercase">
                    <span>Accuracy</span>
                    <span>Total PnL</span>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-white/5">
                    {rest.map((user) => (
                      <LeaderboardEntry key={user.id} user={user} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function PodiumCard({
  user,
  rank,
  color,
}: {
  user: LeaderboardUser;
  rank: number;
  color: "gold" | "silver" | "bronze";
}) {
  const styles = {
    gold: {
      border: "border-yellow-500/30",
      bg: "from-yellow-500/10 to-transparent",
      text: "text-yellow-500",
      icon: <Crown className="w-8 h-8 text-yellow-500" />,
      glow: "shadow-yellow-500/10",
      height: "md:h-[420px]",
    },
    silver: {
      border: "border-slate-400/30",
      bg: "from-slate-400/10 to-transparent",
      text: "text-slate-400",
      icon: <Medal className="w-8 h-8 text-slate-400" />,
      glow: "shadow-slate-400/5",
      height: "md:h-[360px]",
    },
    bronze: {
      border: "border-orange-500/30",
      bg: "from-orange-500/10 to-transparent",
      text: "text-orange-500",
      icon: <Award className="w-8 h-8 text-orange-500" />,
      glow: "shadow-orange-500/5",
      height: "md:h-[330px]",
    },
  }[color];

  return (
    <div
      className={cn(
        "relative group transition-all duration-500 hover:-translate-y-2",
        styles.height,
        rank === 1
          ? "order-1 md:order-2"
          : rank === 2
          ? "order-2 md:order-1"
          : "order-3"
      )}
    >
      <Card
        className={cn(
          "h-full bg-gradient-to-b border-t-2 overflow-hidden flex flex-col items-center justify-center p-6 rounded-[2.5rem] shadow-2xl",
          styles.bg,
          styles.border,
          styles.glow
        )}
      >
        {/* Animated Rank Watermark */}
        <span className="absolute -bottom-4 -right-2 text-[120px] font-black italic text-white/[0.03] leading-none pointer-events-none">
          {rank}
        </span>

        <div className="relative mb-6">
          <div
            className={cn(
              "absolute -inset-4 rounded-full blur-2xl opacity-20 animate-pulse",
              styles.text.replace("text", "bg")
            )}
          />
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center relative z-10 shadow-2xl">
            <span className="text-2xl font-black text-white">
              {user.initials}
            </span>
          </div>
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 drop-shadow-2xl">
            {styles.icon}
          </div>
        </div>

        <div className="text-center space-y-1 mb-6 relative z-10">
          <h3 className="text-lg font-black tracking-tight text-white uppercase truncate max-w-[150px]">
            {user.displayName}
          </h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {user.username}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full mb-6 relative z-10">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5 text-center">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">
              Accuracy
            </p>
            <p className="text-sm font-bold text-white">{user.accuracy}%</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5 text-center">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">
              Earned
            </p>
            <p className="text-sm font-bold text-emerald-400">
              ${user.totalEarned.toLocaleString()}
            </p>
          </div>
        </div>

        {user.winStreak > 0 && (
          <div className="bg-orange-500/10 border border-orange-500/20 px-4 py-1.5 rounded-full flex items-center gap-2 animate-bounce">
            <Zap className="w-3 h-3 text-orange-400 fill-orange-400" />
            <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">
              {user.winStreak} STREAK
            </span>
          </div>
        )}
      </Card>
    </div>
  );
}
