"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, TrendingUp, TrendingDown, Loader2, Target } from "lucide-react";
import { UserPrediction } from "@/hooks/contracts";
import { ShareButton } from "@/components/social/share-button";
import {
  useOutcomeLabel,
  useMarketOutcomes,
  useClaimPayout,
  useHasClaimed,
} from "@/hooks/contracts";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MarketType } from "@/lib/types";

interface PredictionCardProps {
  prediction: UserPrediction;
}

export function PredictionCard({ prediction }: PredictionCardProps) {
  const { address: userAddress } = useAccount();
  const isWon = prediction.status === "won";
  const isLost = prediction.status === "lost";
  const isActive = prediction.status === "active";
  const isCrowdWisdom = prediction.marketType === MarketType.CrowdWisdom;
  const [isClaiming, setIsClaiming] = useState(false);

  // Convert marketId from string to number for hooks
  const marketIdNum = prediction.marketId
    ? Number(prediction.marketId)
    : undefined;

  // Get outcomes and pool amounts for CrowdWisdom markets
  const { data: marketOutcomesData } = useMarketOutcomes(
    isCrowdWisdom ? marketIdNum : undefined
  );
  const outcomes = marketOutcomesData?.[0] || [];
  const poolAmounts = marketOutcomesData?.[1] || [];
  const totalPoolAmount = poolAmounts.reduce(
    (sum, amount) => sum + amount,
    BigInt(0)
  );

  // Get outcome label for the user's prediction
  const { data: outcomeLabel } = useOutcomeLabel(
    isCrowdWisdom ? marketIdNum : undefined,
    isCrowdWisdom && prediction.outcomeIndex !== undefined
      ? prediction.outcomeIndex
      : undefined
  );

  // Claim payout logic
  const { data: hasClaimed } = useHasClaimed(
    marketIdNum,
    userAddress || undefined
  );
  const {
    write: claimPayout,
    hash: claimTxHash,
    isPending: isClaimPending,
    isConfirmed: isClaimConfirmed,
    isConfirming,
  } = useClaimPayout();

  const canClaim =
    (isWon || (isLost && prediction.actualWin && prediction.actualWin > 0)) &&
    !hasClaimed;

  const handleClaimPayout = async () => {
    if (!userAddress || !marketIdNum) {
      toast.error("Wallet not connected");
      return;
    }

    setIsClaiming(true);
    try {
      claimPayout([BigInt(marketIdNum), userAddress]);
    } catch (error) {
      console.error("Error claiming payout:", error);
      toast.error("Failed to claim payout");
    } finally {
      setIsClaiming(false);
    }
  };

  // Show success toast when claim is confirmed
  useEffect(() => {
    if (isClaimConfirmed && !isConfirming) {
      toast.success("Payout claimed successfully!");
    }
  }, [isClaimConfirmed, isConfirming]);

  return (
    <Card
      className={cn(
        "group relative bg-[#020617]/60 backdrop-blur-xl border-white/5 rounded-[2rem] overflow-hidden transition-all duration-500 hover:border-blue-500/30 shadow-2xl",
        isWon && "border-emerald-500/30 bg-emerald-500/[0.02]",
        isLost && "border-red-500/30 bg-red-500/[0.02]"
      )}
    >
      {/* Status Glow Bar */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-1 opacity-50",
          isActive ? "bg-blue-500" : isWon ? "bg-emerald-500" : "bg-red-500"
        )}
      />

      <CardContent className="p-5 sm:p-7">
        {/* Top Meta Row */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Badge
              className={cn(
                "bg-white/5 text-[9px] font-black uppercase tracking-widest border-white/10 px-2 py-0.5",
                prediction.categoryColor
              )}
            >
              {prediction.category}
            </Badge>
            {isCrowdWisdom && (
              <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[9px] font-black uppercase tracking-widest">
                CrowdWisdom
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isActive ? (
              <div className="flex items-center gap-1.5 bg-blue-500/10 px-2 py-1 rounded-full">
                <Clock className="w-3 h-3 text-blue-400" />
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter italic">
                  {prediction.timeLeft}
                </span>
              </div>
            ) : (
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                {prediction.marketStatus}
              </span>
            )}
          </div>
        </div>

        {/* Question Area */}
        <div className="space-y-4 mb-6">
          <h3 className="text-base sm:text-xl font-black italic tracking-tight text-white leading-snug group-hover:text-blue-400 transition-colors">
            {prediction.marketQuestion}
          </h3>

          {/* Position Summary Pod */}
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                Your Position
              </p>
              <div className="flex items-center gap-2">
                {isCrowdWisdom ? (
                  <span className="text-sm font-bold text-purple-400 italic">
                    {outcomeLabel || `Outcome #${prediction.outcomeIndex}`}
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    {prediction.side === "yes" ? (
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                    <span
                      className={cn(
                        "text-sm font-black uppercase italic",
                        prediction.side === "yes"
                          ? "text-emerald-400"
                          : "text-red-400"
                      )}
                    >
                      {prediction.side}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-right space-y-1">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                Amount At Stake
              </p>
              <p className="text-sm font-black text-white italic">
                ${prediction.stake.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Outcome Intelligence / Analytics */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          {!isCrowdWisdom ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="relative group/bar">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1.5">
                  <span>YES</span>
                  <span>{prediction.yesPercent}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000"
                    style={{ width: `${prediction.yesPercent}%` }}
                  />
                </div>
              </div>
              <div className="relative group/bar">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-red-400 mb-1.5">
                  <span>NO</span>
                  <span>{prediction.noPercent}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-all duration-1000"
                    style={{ width: `${prediction.noPercent}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {outcomes.slice(0, 2).map((label, index) => {
                const poolAmount = poolAmounts[index] || BigInt(0);
                const percentage =
                  totalPoolAmount > BigInt(0)
                    ? Number((poolAmount * BigInt(10000)) / totalPoolAmount) /
                      100
                    : 0;
                const isUserOutcome = prediction.outcomeIndex === index;
                return (
                  <div key={index} className="space-y-1.5">
                    <div className="flex justify-between items-center px-1">
                      <span
                        className={cn(
                          "text-[10px] font-black uppercase tracking-tighter truncate max-w-[70%]",
                          isUserOutcome ? "text-purple-400" : "text-slate-500"
                        )}
                      >
                        {isUserOutcome && "• "} {label}
                      </span>
                      <span className="text-[10px] font-black text-white tracking-tighter">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all duration-1000",
                          isUserOutcome ? "bg-purple-500" : "bg-slate-700"
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Dynamic Footer Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">
                  Contract Liquidity
                </span>
                <span className="text-[10px] font-bold text-slate-300 italic">
                  {prediction.pool}
                </span>
              </div>
              {isActive && (
                <div className="flex flex-col border-l border-white/10 pl-4">
                  <span className="text-[8px] font-black text-emerald-500/60 uppercase tracking-widest">
                    Est. Payout
                  </span>
                  <span className="text-[10px] font-black text-emerald-400 italic">
                    ${prediction.potentialWin.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div
              className={cn(
                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em]",
                isWon
                  ? "bg-emerald-500/10 text-emerald-400"
                  : isLost
                  ? "bg-red-500/10 text-red-400"
                  : "bg-blue-500/10 text-blue-400"
              )}
            >
              {prediction.status}
            </div>
          </div>

          {/* Tactical Action Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {canClaim && (
              <Button
                onClick={handleClaimPayout}
                className="col-span-2 h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20"
              >
                {isClaiming || isClaimPending || isConfirming ? (
                  <Loader2 className="animate-spin w-4 h-4" />
                ) : (
                  `Settle Payout: $${prediction.actualWin?.toFixed(2)}`
                )}
              </Button>
            )}
            <Link
              href={`/dashboard?market=${prediction.marketId}`}
              className={cn(canClaim ? "col-span-1" : "col-span-1")}
            >
              <Button
                variant="outline"
                className="w-full h-11 bg-white/5 border-white/10 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-300"
              >
                <Target className="w-3 h-3 mr-2 text-blue-500" /> Intelligence
              </Button>
            </Link>
            <ShareButton
              marketId={prediction.marketId}
              marketQuestion={prediction.marketQuestion}
              category={prediction.category}
              variant="outline"
              className="w-full h-11 bg-white/5 border-white/10 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-300"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
