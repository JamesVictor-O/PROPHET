"use client";

import { useState, useMemo } from "react";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { LeaderboardEntry } from "@/components/leaderboard/leaderboard-entry";
import { LeaderboardFilters } from "@/components/leaderboard/leaderboard-filters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award } from "lucide-react";

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

// Mock leaderboard data
const mockLeaderboard: LeaderboardUser[] = [
  {
    id: "1",
    rank: 1,
    username: "@philip.jr",
    displayName: "Philip Jr",
    initials: "PJ",
    wins: 23,
    losses: 3,
    accuracy: 87,
    totalEarned: 1500,
    winStreak: 8,
  },
  {
    id: "2",
    rank: 2,
    username: "@jessica.lee",
    displayName: "Jessica Lee",
    initials: "JL",
    wins: 19,
    losses: 4,
    accuracy: 82,
    totalEarned: 1200,
    winStreak: 5,
  },
  {
    id: "3",
    rank: 3,
    username: "@thomas.anderson",
    displayName: "Thomas Anderson",
    initials: "TA",
    wins: 15,
    losses: 4,
    accuracy: 79,
    totalEarned: 890,
    winStreak: 3,
  },
  {
    id: "4",
    rank: 4,
    username: "@sarah.music",
    displayName: "Sarah Music",
    initials: "SM",
    wins: 14,
    losses: 5,
    accuracy: 74,
    totalEarned: 750,
    winStreak: 2,
  },
  {
    id: "5",
    rank: 5,
    username: "@david.afro",
    displayName: "David Afro",
    initials: "DA",
    wins: 12,
    losses: 6,
    accuracy: 67,
    totalEarned: 650,
    winStreak: 1,
  },
  {
    id: "6",
    rank: 6,
    username: "@lisa.predicts",
    displayName: "Lisa Predicts",
    initials: "LP",
    wins: 11,
    losses: 7,
    accuracy: 61,
    totalEarned: 580,
    winStreak: 4,
  },
  {
    id: "7",
    rank: 7,
    username: "@mike.ent",
    displayName: "Mike Entertainment",
    initials: "ME",
    wins: 10,
    losses: 8,
    accuracy: 56,
    totalEarned: 520,
    winStreak: 0,
  },
  {
    id: "8",
    rank: 8,
    username: "@anna.culture",
    displayName: "Anna Culture",
    initials: "AC",
    wins: 9,
    losses: 9,
    accuracy: 50,
    totalEarned: 480,
    winStreak: 1,
  },
];

export default function LeaderboardPage() {
  const [timeFilter, setTimeFilter] = useState<"all" | "month" | "week">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filteredLeaderboard = useMemo(() => {
    // In a real app, this would filter based on time and category
    return mockLeaderboard;
  }, [timeFilter, categoryFilter]);

  const topThree = useMemo(() => filteredLeaderboard.slice(0, 3), [filteredLeaderboard]);
  const rest = useMemo(() => filteredLeaderboard.slice(3), [filteredLeaderboard]);

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      <DashboardNav />
      <div className="pt-16 flex">
        <DashboardSidebar />

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
            <p className="text-gray-400">
              Top prophets ranked by accuracy and earnings
            </p>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <LeaderboardFilters
              timeFilter={timeFilter}
              categoryFilter={categoryFilter}
              onTimeFilterChange={setTimeFilter}
              onCategoryFilterChange={setCategoryFilter}
            />
          </div>

          {/* Top 3 Podium */}
          {topThree.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* 2nd Place */}
              {topThree[1] && (
                <Card className="bg-[#1E293B] border-[#334155] order-2 md:order-1">
                  <CardContent className="p-6 text-center">
                    <div className="flex flex-col items-center">
                      <Medal className="w-12 h-12 text-gray-400 mb-4" />
                      <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mb-3">
                        <span className="text-white font-bold text-xl">
                          {topThree[1].initials}
                        </span>
                      </div>
                      <div className="text-3xl font-bold text-gray-400 mb-1">2</div>
                      <div className="font-semibold mb-1">{topThree[1].displayName}</div>
                      <div className="text-sm text-gray-400 mb-3">
                        {topThree[1].username}
                      </div>
                      <div className="text-sm text-gray-400 mb-1">
                        {topThree[1].wins} wins • {topThree[1].accuracy}% accuracy
                      </div>
                      <div className="text-lg font-bold text-green-400">
                        ${topThree[1].totalEarned.toLocaleString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 1st Place */}
              {topThree[0] && (
                <Card className="bg-[#1E293B] border-[#2563EB] order-1 md:order-2">
                  <CardContent className="p-6 text-center">
                    <div className="flex flex-col items-center">
                      <Trophy className="w-16 h-16 text-[#2563EB] mb-4" />
                      <div className="w-20 h-20 bg-[#2563EB] rounded-full flex items-center justify-center mb-3">
                        <span className="text-white font-bold text-2xl">
                          {topThree[0].initials}
                        </span>
                      </div>
                      <div className="text-4xl font-bold text-[#2563EB] mb-1">1</div>
                      <div className="font-semibold text-lg mb-1">
                        {topThree[0].displayName}
                      </div>
                      <div className="text-sm text-gray-400 mb-3">
                        {topThree[0].username}
                      </div>
                      <div className="text-sm text-gray-400 mb-1">
                        {topThree[0].wins} wins • {topThree[0].accuracy}% accuracy
                      </div>
                      <div className="text-xl font-bold text-green-400">
                        ${topThree[0].totalEarned.toLocaleString()}
                      </div>
                      {topThree[0].winStreak > 0 && (
                        <div className="mt-2 px-3 py-1 bg-orange-500/10 text-orange-400 rounded-full text-xs font-semibold">
                          🔥 {topThree[0].winStreak} win streak
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <Card className="bg-[#1E293B] border-[#334155] order-3">
                  <CardContent className="p-6 text-center">
                    <div className="flex flex-col items-center">
                      <Award className="w-12 h-12 text-orange-400 mb-4" />
                      <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mb-3">
                        <span className="text-white font-bold text-xl">
                          {topThree[2].initials}
                        </span>
                      </div>
                      <div className="text-3xl font-bold text-orange-400 mb-1">3</div>
                      <div className="font-semibold mb-1">{topThree[2].displayName}</div>
                      <div className="text-sm text-gray-400 mb-3">
                        {topThree[2].username}
                      </div>
                      <div className="text-sm text-gray-400 mb-1">
                        {topThree[2].wins} wins • {topThree[2].accuracy}% accuracy
                      </div>
                      <div className="text-lg font-bold text-green-400">
                        ${topThree[2].totalEarned.toLocaleString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Rest of Leaderboard */}
          {rest.length > 0 && (
            <Card className="bg-[#1E293B] border-[#334155]">
              <CardHeader>
                <CardTitle>All Rankings</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-[#334155]">
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

