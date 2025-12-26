"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, TrendingUp } from "lucide-react";
import { useMarketOutcomes, usePoolAmounts } from "@/hooks/contracts";
import { MarketType } from "@/lib/types";
import { formatEther } from "viem";
import { useMemo } from "react";
import { BinaryChart } from "./binary-chart";

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

  // Fetch live pool amounts for Binary markets to ensure chart shows current data
  const { yesPool, noPool } = usePoolAmounts(
    !isCrowdWisdom ? BigInt(market.id) : undefined
  );

  // Calculate live percentages for Binary markets
  const livePercentages = useMemo(() => {
    if (isCrowdWisdom) {
      return { yesPercent: market.yesPercent, noPercent: market.noPercent };
    }

    const yesPoolAmount = yesPool || BigInt(0);
    const noPoolAmount = noPool || BigInt(0);
    const totalPool = yesPoolAmount + noPoolAmount;

    if (totalPool === BigInt(0)) {
      return { yesPercent: 50, noPercent: 50 };
    }

    const yesPercent =
      Number((yesPoolAmount * BigInt(10000)) / totalPool) / 100;
    const noPercent = Number((noPoolAmount * BigInt(10000)) / totalPool) / 100;

    return { yesPercent, noPercent };
  }, [isCrowdWisdom, yesPool, noPool, market.yesPercent, market.noPercent]);

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
    <Card className="bg-[#020617] border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <Badge className="bg-slate-800 text-slate-300 hover:bg-slate-800 border-none rounded-md px-2 py-0">
            {market.category}
          </Badge>
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
            <Clock size={13} />
            {market.timeLeft}
          </div>
        </div>

        {/* Question */}
        <h2 className="text-white text-base font-medium leading-tight mb-4 min-h-[3rem]">
          {market.question}
        </h2>

        {/* The New Aesthetic Chart */}
        {!isCrowdWisdom && (
          <BinaryChart
            yesPercent={livePercentages.yesPercent}
            noPercent={livePercentages.noPercent}
          />
        )}

        {/* Prediction Stats Bar */}
        <div className="flex items-center gap-4 py-3 border-y border-slate-800/50 mb-4">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Users size={14} className="text-slate-600" />
            <span className="text-slate-200 font-medium">
              {market.predictions}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <TrendingUp size={14} className="text-slate-600" />
            <span className="text-slate-200 font-medium">{market.pool}</span>
          </div>
        </div>

        {/* Action Buttons: Split UI */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <Button
            variant="secondary"
            className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white border-none h-11 transition-all"
          >
            YES
          </Button>
          <Button
            variant="secondary"
            className="bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border-none h-11 transition-all"
          >
            NO
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
