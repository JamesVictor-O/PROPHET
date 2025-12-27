"use client";

import { useState, useMemo } from "react";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { LeaderboardEntry } from "@/components/leaderboard/leaderboard-entry";
import { LeaderboardFilters } from "@/components/leaderboard/leaderboard-filters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award, Loader2 } from "lucide-react";
import { useLeaderboardGraphQL } from "@/hooks/graphql";
import type { LeaderboardEntryGraphQL } from "@/hooks/graphql";

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

  // Fetch real leaderboard data from GraphQL (top 100 for full page)
  const { data: leaderboardData, isLoading, isError } = useLeaderboardGraphQL(100);

  // Map GraphQL data to component format
  const mappedLeaderboard: LeaderboardUser[] = useMemo(() => {
    if (!leaderboardData) return [];

    return leaderboardData.map((entry: LeaderboardEntryGraphQL) => {
      return {
        id: entry.address,
        rank: entry.rank,
        username: entry.username,
        displayName: entry.displayName,
        initials: entry.initials,
        wins: entry.wins,
        losses: 0, // Not tracked separately
        accuracy: entry.accuracy,
        totalEarned: entry.totalEarned,
        winStreak: entry.winStreak,
      };
    });
  }, [leaderboardData]);

  const filteredLeaderboard = useMemo(() => {
    // Note: Time and category filters would need contract support
    // For now, just return all data
    return mappedLeaderboard;
  }, [mappedLeaderboard, timeFilter, categoryFilter]);

  const topThree = useMemo(
    () => filteredLeaderboard.slice(0, 3),
    [filteredLeaderboard]
  );
  const rest = useMemo(
    () => filteredLeaderboard.slice(3),
    [filteredLeaderboard]
  );

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      <DashboardNav />
      <div className="pt-16 flex">
        <DashboardSidebar />

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 p-3 sm:p-4 md:p-6 lg:p-8">
          {/* Header Section */}
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
              Leaderboard
            </h1>
            <p className="text-sm sm:text-base text-gray-400">
              Top prophets ranked by accuracy and earnings
            </p>
          </div>

          {/* Filters */}
          <div className="mb-4 sm:mb-6">
            <LeaderboardFilters
              timeFilter={timeFilter}
              categoryFilter={categoryFilter}
              onTimeFilterChange={setTimeFilter}
              onCategoryFilterChange={setCategoryFilter}
            />
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8 sm:py-12">
              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin mx-auto mb-3 sm:mb-4 text-[#2563EB]" />
              <p className="text-sm sm:text-base text-gray-400">
                Loading leaderboard...
              </p>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <Card className="bg-[#1E293B] border-dark-700">
              <CardContent className="p-6 sm:p-8 md:p-12">
                <div className="text-center">
                  <p className="text-sm sm:text-base text-red-400 mb-2">
                    Error loading leaderboard
                  </p>
                  <p className="text-xs sm:text-sm text-gray-400">
                    Please check your connection and try again
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!isLoading && !isError && filteredLeaderboard.length === 0 && (
            <Card className="bg-[#1E293B] border-dark-700">
              <CardContent className="p-6 sm:p-8 md:p-12">
                <div className="text-center">
                  <p className="text-sm sm:text-base text-gray-400 mb-2">
                    No leaderboard data yet
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Start making predictions to see the top prophets!
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top 3 Podium */}
          {!isLoading && !isError && topThree.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
              {/* 2nd Place */}
              {topThree[1] && (
                <Card className="bg-[#1E293B] border-dark-700 order-2 sm:order-1">
                  <CardContent className="p-4 sm:p-5 md:p-6 text-center">
                    <div className="flex flex-col items-center">
                      <Medal className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-gray-400 mb-3 sm:mb-4" />
                      <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gray-600 rounded-full flex items-center justify-center mb-2 sm:mb-3">
                        <span className="text-white font-bold text-base sm:text-lg md:text-xl">
                          {topThree[1].initials}
                        </span>
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold text-gray-400 mb-1">
                        2
                      </div>
                      <div className="font-semibold text-sm sm:text-base mb-1 truncate w-full px-2">
                        {topThree[1].displayName}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-400 mb-2 sm:mb-3 truncate w-full px-2">
                        {topThree[1].username}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-400 mb-1">
                        {topThree[1].wins} wins • {topThree[1].accuracy}%
                        accuracy
                      </div>
                      <div className="text-base sm:text-lg font-bold text-green-400">
                        ${topThree[1].totalEarned.toLocaleString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 1st Place */}
              {topThree[0] && (
                <Card className="bg-[#1E293B] border-[#2563EB] order-1 sm:order-2">
                  <CardContent className="p-4 sm:p-5 md:p-6 text-center">
                    <div className="flex flex-col items-center">
                      <Trophy className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-[#2563EB] mb-3 sm:mb-4" />
                      <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-[#2563EB] rounded-full flex items-center justify-center mb-2 sm:mb-3">
                        <span className="text-white font-bold text-lg sm:text-xl md:text-2xl">
                          {topThree[0].initials}
                        </span>
                      </div>
                      <div className="text-3xl sm:text-4xl font-bold text-[#2563EB] mb-1">
                        1
                      </div>
                      <div className="font-semibold text-base sm:text-lg mb-1 truncate w-full px-2">
                        {topThree[0].displayName}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-400 mb-2 sm:mb-3 truncate w-full px-2">
                        {topThree[0].username}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-400 mb-1">
                        {topThree[0].wins} wins • {topThree[0].accuracy}%
                        accuracy
                      </div>
                      <div className="text-lg sm:text-xl font-bold text-green-400">
                        ${topThree[0].totalEarned.toLocaleString()}
                      </div>
                      {topThree[0].winStreak > 0 && (
                        <div className="mt-2 px-2 sm:px-3 py-1 bg-orange-500/10 text-orange-400 rounded-full text-[10px] sm:text-xs font-semibold">
                          🔥 {topThree[0].winStreak} win streak
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <Card className="bg-[#1E293B] border-dark-700 order-3">
                  <CardContent className="p-4 sm:p-5 md:p-6 text-center">
                    <div className="flex flex-col items-center">
                      <Award className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-orange-400 mb-3 sm:mb-4" />
                      <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-orange-600 rounded-full flex items-center justify-center mb-2 sm:mb-3">
                        <span className="text-white font-bold text-base sm:text-lg md:text-xl">
                          {topThree[2].initials}
                        </span>
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold text-orange-400 mb-1">
                        3
                      </div>
                      <div className="font-semibold text-sm sm:text-base mb-1 truncate w-full px-2">
                        {topThree[2].displayName}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-400 mb-2 sm:mb-3 truncate w-full px-2">
                        {topThree[2].username}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-400 mb-1">
                        {topThree[2].wins} wins • {topThree[2].accuracy}%
                        accuracy
                      </div>
                      <div className="text-base sm:text-lg font-bold text-green-400">
                        ${topThree[2].totalEarned.toLocaleString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Rest of Leaderboard */}
          {!isLoading && !isError && rest.length > 0 && (
            <Card className="bg-[#1E293B] border-dark-700">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">
                  All Rankings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-dark-700">
                  {rest.map((user) => (
                    <LeaderboardEntry key={user.id} user={user} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
