"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, TrendingUp } from "lucide-react";
import { useMarketOutcomes } from "@/hooks/contracts";
import { MarketType } from "@/lib/types";
import { formatEther } from "viem";

export interface Market {
  id: string;
  category: string;
  categoryColor: string;
  timeLeft: string;
  question: string;
  yesPercent: number;
  noPercent: number;
  predictions: number;
  pool: string;
  marketType?: MarketType;
}

interface MarketCardProps {
  market: Market;
  onPredict: (marketId: string, side?: "yes" | "no") => void;
}

export function MarketCard({ market, onPredict }: MarketCardProps) {
  const isCrowdWisdom = market.marketType === MarketType.CrowdWisdom;

  // Fetch outcomes for CrowdWisdom markets
  const { data: marketOutcomesData, isLoading: isLoadingOutcomes } =
    useMarketOutcomes(isCrowdWisdom ? BigInt(market.id) : undefined);

  // Calculate outcome data for CrowdWisdom
  const outcomes = marketOutcomesData?.[0] || [];
  const poolAmounts = marketOutcomesData?.[1] || [];
  const totalPoolAmount = poolAmounts.reduce(
    (sum, amt) => sum + amt,
    BigInt(0)
  );

  // Sort outcomes by pool amount (descending) and take top 3
  const sortedOutcomes = outcomes
    .map((label, index) => ({
      label,
      poolAmount: poolAmounts[index] || BigInt(0),
      percentage:
        totalPoolAmount > BigInt(0)
          ? Number((poolAmounts[index] || BigInt(0)) * BigInt(10000)) /
            Number(totalPoolAmount) /
            100
          : 0,
      index,
    }))
    .sort((a, b) => Number(b.poolAmount - a.poolAmount))
    .slice(0, 3);

  return (
    <Card className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-3 sm:p-4 w-full">
      <CardContent className="p-0 space-y-3">
        {/* Top Row: Category + Time Left + Market Type */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Badge
              className="px-2 py-0.5 text-[10px] sm:text-xs"
              style={{ backgroundColor: market.categoryColor }}
            >
              {market.category}
            </Badge>
            {isCrowdWisdom && (
              <Badge className="px-2 py-0.5 text-[10px] sm:text-xs bg-purple-500/10 text-purple-400 border-purple-500/20">
                CrowdWisdom
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1 text-gray-400 text-[11px] sm:text-xs">
            <Clock size={12} />
            {market.timeLeft}
          </div>
        </div>

        {/* Question */}
        <h2 className="font-semibold text-white text-sm sm:text-base leading-snug">
          {market.question}
        </h2>

        {/* Binary Market: YES / NO BUTTONS */}
        {!isCrowdWisdom && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onPredict(market.id, "yes")}
              className="bg-[#0F172A] border border-dark-700 rounded-lg p-3 text-center 
                     hover:border-green-500 active:scale-95 transition-all"
            >
              <div className="text-white text-lg font-bold">
                {market.yesPercent}%
              </div>
              <div className="text-green-400 text-[11px] font-medium">YES</div>
            </button>

            <button
              onClick={() => onPredict(market.id, "no")}
              className="bg-[#0F172A] border border-dark-700 rounded-lg p-3 text-center 
                     hover:border-red-500 active:scale-95 transition-all"
            >
              <div className="text-white text-lg font-bold">
                {market.noPercent}%
              </div>
              <div className="text-red-400 text-[11px] font-medium">NO</div>
            </button>
          </div>
        )}

        {/* CrowdWisdom Market: Outcomes Chart */}
        {isCrowdWisdom && (
          <div className="space-y-2">
            {isLoadingOutcomes ? (
              <div className="p-4 bg-[#1E293B] border border-dark-700 rounded-lg text-center">
                <div className="text-xs text-gray-400">Loading outcomes...</div>
              </div>
            ) : sortedOutcomes.length > 0 ? (
              <>
                <div className="space-y-2">
                  {sortedOutcomes.map((outcome, idx) => (
                    <div
                      key={idx}
                      className="bg-[#1E293B] border border-dark-700 rounded-lg p-2.5 sm:p-3"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-white font-semibold text-xs sm:text-sm truncate flex-1 mr-2">
                          {outcome.label}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-purple-400 font-bold text-xs sm:text-sm">
                            {outcome.percentage.toFixed(1)}%
                          </span>
                          <span className="text-gray-400 text-[10px] sm:text-xs">
                            $
                            {Number(formatEther(outcome.poolAmount)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full bg-[#0F172A] rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-300"
                          style={{ width: `${outcome.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {outcomes.length > 3 && (
                  <div className="text-center">
                    <span className="text-xs text-gray-400">
                      +{outcomes.length - 3} more outcomes
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 bg-[#1E293B] border border-dark-700 rounded-lg text-center">
                <div className="text-xs text-gray-400">
                  No outcomes yet. Be the first to comment!
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stats Row */}
        <div className="flex items-center justify-between text-gray-400 text-[11px] sm:text-xs">
          <div className="flex items-center gap-1">
            <Users size={12} />
            {market.predictions.toLocaleString()} participant
            {market.predictions !== 1 ? "s" : ""}
          </div>

          <div className="flex items-center gap-1">
            <TrendingUp size={12} />
            Pool: {market.pool}
          </div>
        </div>

        {/* Main Button */}
        <Button
          onClick={() => onPredict(market.id)}
          size="sm"
          className="w-full bg-[#2563EB] text-white hover:bg-blue-700 
                 text-xs sm:text-sm h-10"
        >
          Place Prediction
        </Button>
      </CardContent>
    </Card>
  );
}
