"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Target,
  TrendingUp,
  DollarSign,
  Award,
  Zap,
  Trophy,
} from "lucide-react";

interface ProfileStatsProps {
  stats: {
    totalPredictions: number;
    wins: number;
    losses: number;
    winRate: number;
    totalEarned: number;
    totalStaked: number;
    profit: number;
    currentStreak: number;
    bestStreak: number;
    rank: number;
  };
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  const profitPercentage =
    stats.totalStaked > 0
      ? ((stats.profit / stats.totalStaked) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#1E293B] border-dark-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-2xl font-bold mb-1">{stats.totalPredictions}</div>
            <div className="text-xs text-gray-400">Total Predictions</div>
          </CardContent>
        </Card>

        <Card className="bg-[#1E293B] border-dark-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-green-400 mb-1">
              {stats.wins}
            </div>
            <div className="text-xs text-gray-400">Wins</div>
          </CardContent>
        </Card>

        <Card className="bg-[#1E293B] border-dark-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-400 mb-1">
              {stats.winRate}%
            </div>
            <div className="text-xs text-gray-400">Win Rate</div>
          </CardContent>
        </Card>

        <Card className="bg-[#1E293B] border-dark-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-green-400 mb-1">
              ${stats.totalEarned.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">Total Earned</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-[#1E293B] border-dark-700">
          <CardHeader>
            <CardTitle>Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total Staked</span>
              <span className="font-semibold">${stats.totalStaked.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Profit</span>
              <span
                className={`font-semibold ${
                  stats.profit >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {stats.profit >= 0 ? "+" : ""}${stats.profit.toFixed(2)} (
                {profitPercentage}%)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Losses</span>
              <span className="font-semibold text-red-400">{stats.losses}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1E293B] border-dark-700">
          <CardHeader>
            <CardTitle>Achievements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-orange-400" />
                <span className="text-gray-400">Current Streak</span>
              </div>
              <span className="font-semibold text-orange-400">
                {stats.currentStreak} wins
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-400">Best Streak</span>
              </div>
              <span className="font-semibold text-yellow-400">
                {stats.bestStreak} wins
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-[#2563EB]" />
                <span className="text-gray-400">Leaderboard Rank</span>
              </div>
              <span className="font-semibold text-[#2563EB]">#{stats.rank}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

