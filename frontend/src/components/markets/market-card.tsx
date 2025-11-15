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
    <Card className="market-card bg-[#1E293B] border-[#334155] hover:border-[#2563EB] transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Badge className={`text-xs font-semibold ${market.categoryColor}`}>
            {market.category}
          </Badge>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400">{market.timeLeft}</span>
          </div>
        </div>

        <h3 className="text-lg font-bold mb-3 leading-snug">
          {market.question}
        </h3>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => onPredict(market.id, "yes")}
            className="bg-[#0F172A] border border-[#334155] rounded-lg p-3 text-center hover:border-green-500 transition-colors"
          >
            <div className="text-2xl font-bold text-green-400 mb-1">
              {market.yesPercent}%
            </div>
            <div className="text-xs text-gray-400">YES</div>
          </button>
          <button
            onClick={() => onPredict(market.id, "no")}
            className="bg-[#0F172A] border border-[#334155] rounded-lg p-3 text-center hover:border-red-500 transition-colors"
          >
            <div className="text-2xl font-bold text-red-400 mb-1">
              {market.noPercent}%
            </div>
            <div className="text-xs text-gray-400">NO</div>
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{market.predictions.toLocaleString()} predictions</span>
          </div>
          <span>Pool: {market.pool}</span>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => onPredict(market.id)}
            className="flex-1 bg-[#2563EB] text-white hover:bg-blue-700"
          >
            Place Prediction
          </Button>
          <ShareButton
            marketId={market.id}
            marketQuestion={market.question}
            category={market.category}
            variant="outline"
            className="bg-[#1E293B] border-[#334155] hover:bg-[#334155]"
          />
        </div>
      </CardContent>
    </Card>
  );
}
