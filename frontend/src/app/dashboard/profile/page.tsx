"use client";

import { useState, useMemo } from "react";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileStats } from "@/components/profile/profile-stats";
import { ProfileActivity } from "@/components/profile/profile-activity";
import { ProfileSettings } from "@/components/profile/profile-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserStats, useUsername, useLeaderboard } from "@/hooks/contracts";
import { useUserPredictions, useAllMarkets } from "@/hooks/contracts";
import { formatAddress } from "@/lib/wallet-config";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { BinaryChart } from "@/components/markets/binary-chart";

// Helper to generate initials from username or address
function generateInitials(
  username: string | undefined,
  address: string
): string {
  if (username && username.length > 0) {
    const cleanUsername = username
      .replace("@", "")
      .replace(/[^a-zA-Z0-9]/g, " ");
    const parts = cleanUsername.split(" ").filter((p) => p.length > 0);

    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length >= 2) {
      return parts[0]
        .substring(0, 2)
        .toUpperCase()
        .replace(/[^A-Z]/g, "");
    }
  }
  return address.slice(2, 6).toUpperCase() || "??";
}

// Helper to format display name
function formatDisplayName(
  username: string | undefined,
  address: string
): string {
  if (username && username.length > 0) {
    const cleanUsername = username.replace("@", "");
    return (
      cleanUsername
        .split(".")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ") || cleanUsername
    );
  }
  return formatAddress(address);
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("overview");
  const { address, isConnected } = useAccount();

  // Fetch contract data
  const { data: userStats, isLoading: isLoadingStats } = useUserStats(address);
  const { data: username, isLoading: isLoadingUsername } = useUsername(address);
  const { data: leaderboardData } = useLeaderboard(100);
  const { data: userPredictions, isLoading: isLoadingPredictions } =
    useUserPredictions();
  const { data: allMarkets, isLoading: isLoadingMarkets } = useAllMarkets();

  // Count markets created by user
  const marketsCreated = useMemo(() => {
    if (!address || !allMarkets) return 0;
    return allMarkets.filter(
      (market) => market.creator.toLowerCase() === address.toLowerCase()
    ).length;
  }, [address, allMarkets]);

  // Calculate user's rank
  const userRank = useMemo(() => {
    if (!address || !leaderboardData) return 0;
    const index = leaderboardData.findIndex(
      (entry) => entry.address.toLowerCase() === address.toLowerCase()
    );
    return index >= 0 ? index + 1 : 0;
  }, [address, leaderboardData]);

  // Calculate derived stats
  const stats = useMemo(() => {
    if (!userStats) {
      return {
        totalPredictions: 0, // Markets created by user
        wins: 0,
        losses: 0,
        winRate: 0,
        totalEarned: 0,
        totalStaked: 0,
        profit: 0,
        currentStreak: 0,
        bestStreak: 0,
        rank: userRank,
      };
    }

    // Use markets created instead of predictions made
    const totalPredictions = marketsCreated;
    const wins = Number(userStats.correctPredictions);
    const totalPredictionsMade = Number(userStats.totalPredictions);
    const losses = totalPredictionsMade - wins;
    const winRate =
      totalPredictionsMade > 0
        ? Math.round((wins / totalPredictionsMade) * 100)
        : 0;
    const totalEarned = Number(
      formatEther(userStats.totalWinnings || BigInt(0))
    );

    // Calculate total staked from user predictions
    const totalStaked = userPredictions
      ? userPredictions.reduce((sum, pred) => sum + pred.stake, 0)
      : 0;

    const profit = totalEarned - totalStaked;
    const currentStreak = Number(userStats.currentStreak || BigInt(0));
    const bestStreak = Number(userStats.bestStreak || BigInt(0));

    return {
      totalPredictions, // Markets created
      wins,
      losses,
      winRate,
      totalEarned,
      totalStaked,
      profit,
      currentStreak,
      bestStreak,
      rank: userRank,
    };
  }, [userStats, userPredictions, userRank, marketsCreated]);

  // Format user data
  const userData = useMemo(() => {
    if (!address) {
      return {
        username: "",
        displayName: "",
        initials: "??",
        email: "",
        joinDate: "",
        bio: "",
        avatar: null,
      };
    }

    const formattedUsername =
      username && username.length > 0
        ? username.startsWith("@")
          ? username
          : `@${username}`
        : formatAddress(address);

    return {
      username: formattedUsername,
      displayName: formatDisplayName(username, address),
      initials: generateInitials(username, address),
      email: "", // Not available from contract
      joinDate: "", // Not available from contract
      bio: "", // Not available from contract
      avatar: null,
    };
  }, [address, username]);

  // Convert predictions to activities
  const activities = useMemo(() => {
    if (!userPredictions || userPredictions.length === 0) return [];

    return userPredictions
      .slice(0, 10) // Show last 10 activities
      .map((pred) => {
        let action: "Won" | "Lost" | "Placed" = "Placed";
        let amount = pred.stake;

        if (pred.status === "won" && pred.actualWin) {
          action = "Won";
          amount = pred.actualWin;
        } else if (pred.status === "lost") {
          action = "Lost";
        }

        return {
          id: pred.id,
          type: "prediction" as const,
          action,
          market: pred.marketQuestion,
          amount,
          timestamp: pred.resolvedAt || pred.timeLeft || "Recently",
        };
      });
  }, [userPredictions]);

  const isLoading =
    isLoadingStats ||
    isLoadingUsername ||
    isLoadingPredictions ||
    isLoadingMarkets;

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white">
        <DashboardNav />
        <div className="pt-16 flex">
          <DashboardSidebar />
          <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8">
            <Card className="bg-[#1E293B] border-dark-700">
              <CardContent className="p-12 text-center">
                <p className="text-gray-400 mb-2">
                  Please connect your wallet to view your profile
                </p>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 selection:bg-blue-500/30">
      <DashboardNav />
      <div className="pt-16 flex">
        <DashboardSidebar />

        <main className="flex-1 lg:ml-64 px-6 py-10 lg:px-12 max-w-7xl mx-auto transition-all">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-4" />
              <p className="text-slate-500 text-sm font-medium tracking-wide">
                SYNCING PROFILE...
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* 1. Integrated Header & Sparkline */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-end">
                <div className="lg:col-span-2">
                  <ProfileHeader user={userData} stats={stats} />
                </div>
                {/* Profile Performance Sparkline */}
                <div className="hidden lg:block h-32 w-full">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-2">
                    Portfolio PNL
                  </p>
                  <BinaryChart
                    yesPercent={stats.winRate}
                    noPercent={100 - stats.winRate}
                    className="h-20"
                  />
                </div>
              </div>

              {/* 2. Professional Tab Navigation */}
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="bg-transparent border-b border-slate-800 w-full justify-start rounded-none h-auto p-0 gap-8">
                  <TabsTrigger
                    value="overview"
                    className="bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent rounded-none px-0 pb-4 text-slate-400 data-[state=active]:text-white transition-all uppercase text-[11px] tracking-widest font-bold"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="activity"
                    className="bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent rounded-none px-0 pb-4 text-slate-400 data-[state=active]:text-white transition-all uppercase text-[11px] tracking-widest font-bold"
                  >
                    Activity
                  </TabsTrigger>
                  <TabsTrigger
                    value="settings"
                    className="bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent rounded-none px-0 pb-4 text-slate-400 data-[state=active]:text-white transition-all uppercase text-[11px] tracking-widest font-bold"
                  >
                    Settings
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-10 outline-none">
                  <ProfileStats stats={stats} />
                </TabsContent>

                <TabsContent value="activity" className="mt-10 outline-none">
                  <ProfileActivity activities={activities} />
                </TabsContent>

                <TabsContent value="settings" className="mt-10 outline-none">
                  <ProfileSettings user={userData} address={address} />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
