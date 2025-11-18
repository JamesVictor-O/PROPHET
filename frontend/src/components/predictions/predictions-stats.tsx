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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {/* Total Earned */}
      <Card className="bg-[#1E293B] border-[#334155] rounded-xl">
        <CardContent className="p-3 flex flex-col items-start">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-green-400" />
            </div>
            <span className="text-[0.70rem] tracking-wide text-gray-400">
              Total Earned
            </span>
          </div>

          <div className="text-xl font-bold text-green-400 leading-none">
            ${stats.totalEarned.toFixed(2)}
          </div>
        </CardContent>
      </Card>

      {/* Active Predictions */}
      <Card className="bg-[#1E293B] border-[#334155] rounded-xl">
        <CardContent className="p-3 flex flex-col items-start">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-[0.70rem] tracking-wide text-gray-400">
              Active
            </span>
          </div>

          <div className="text-xl font-bold">{stats.active}</div>
        </CardContent>
      </Card>

      {/* Win Rate */}
      <Card className="bg-[#1E293B] border-[#334155] rounded-xl">
        <CardContent className="p-3 flex flex-col items-start">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Award className="w-4 h-4 text-purple-400" />
            </div>
            <span className="text-[0.70rem] tracking-wide text-gray-400">
              Win Rate
            </span>
          </div>

          <div className="text-xl font-bold">{stats.winRate}%</div>
        </CardContent>
      </Card>

      {/* Profit */}
      <Card className="bg-[#1E293B] border-[#334155] rounded-xl">
        <CardContent className="p-3 flex flex-col items-start">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-[#2563EB]/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[#2563EB]" />
            </div>
            <span className="text-[0.70rem] tracking-wide text-gray-400">
              Profit
            </span>
          </div>

          <div
            className={`text-xl font-bold ${
              profit >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {profit >= 0 ? "+" : ""}${profit.toFixed(2)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

