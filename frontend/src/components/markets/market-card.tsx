"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users } from "lucide-react";
import { ShareButton } from "@/components/social/share-button";

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
}

interface MarketCardProps {
  market: Market;
  onPredict: (marketId: string, side?: "yes" | "no") => void;
}

export function MarketCard({ market, onPredict }: MarketCardProps) {
  return (
    <Card className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-3 sm:p-4 w-full">
      <CardContent className="p-0 space-y-3">
        {/* Top Row: Category + Time Left */}
        <div className="flex items-center justify-between">
          <Badge
            className="px-2 py-0.5 text-[10px] sm:text-xs"
            style={{ backgroundColor: market.categoryColor }}
          >
            {market.category}
          </Badge>

          <div className="flex items-center gap-1 text-gray-400 text-[11px] sm:text-xs">
            <Clock size={12} />
            {market.timeLeft}
          </div>
        </div>

        {/* Question */}
        <h2 className="font-semibold text-white text-sm sm:text-base leading-snug">
          {market.question}
        </h2>

        {/* YES / NO BUTTONS */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onPredict(market.id, "yes")}
            className="bg-[#0F172A] border border-[#334155] rounded-lg p-3 text-center 
                   hover:border-green-500 active:scale-95 transition-all"
          >
            <div className="text-white text-lg font-bold">
              {market.yesPercent}%
            </div>
            <div className="text-green-400 text-[11px] font-medium">YES</div>
          </button>

          <button
            onClick={() => onPredict(market.id, "no")}
            className="bg-[#0F172A] border border-[#334155] rounded-lg p-3 text-center 
                   hover:border-red-500 active:scale-95 transition-all"
          >
            <div className="text-white text-lg font-bold">
              {market.noPercent}%
            </div>
            <div className="text-red-400 text-[11px] font-medium">NO</div>
          </button>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between text-gray-400 text-[11px] sm:text-xs">
          <div className="flex items-center gap-1">
            <Users size={12} />
            {market.predictions.toLocaleString()} predictions
          </div>

          <div>Pool: {market.pool}</div>
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
