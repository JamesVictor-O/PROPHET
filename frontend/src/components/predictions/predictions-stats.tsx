"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, DollarSign, Target, Award } from "lucide-react";

interface PredictionsStatsProps {
  stats: {
    total: number;
    active: number;
    won: number;
    lost: number;
    totalEarned: number;
    totalStaked: number;
    winRate: string;
  };
}

export function PredictionsStats({ stats }: PredictionsStatsProps) {
  const profit = stats.totalEarned - stats.totalStaked;
  const profitPercentage = stats.totalStaked > 0 
    ? ((profit / stats.totalStaked) * 100).toFixed(1)
    : "0";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card className="bg-[#1E293B] border-[#334155]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-green-400 mb-1">
            ${stats.totalEarned.toFixed(2)}
          </div>
          <div className="text-xs text-gray-400">Total Earned</div>
        </CardContent>
      </Card>

      <Card className="bg-[#1E293B] border-[#334155]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">{stats.active}</div>
          <div className="text-xs text-gray-400">Active Predictions</div>
        </CardContent>
      </Card>

      <Card className="bg-[#1E293B] border-[#334155]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">{stats.winRate}%</div>
          <div className="text-xs text-gray-400">Win Rate</div>
        </CardContent>
      </Card>

      <Card className="bg-[#1E293B] border-[#334155]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-[#2563EB]/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#2563EB]" />
            </div>
          </div>
          <div className={`text-2xl font-bold mb-1 ${
            profit >= 0 ? "text-green-400" : "text-red-400"
          }`}>
            {profit >= 0 ? "+" : ""}${profit.toFixed(2)}
          </div>
          <div className="text-xs text-gray-400">
            Profit ({profitPercentage}%)
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

