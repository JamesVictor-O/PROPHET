"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { UserPrediction } from "@/hooks/contracts";
import { ShareButton } from "@/components/social/share-button";
import { useContractWrite, useContractRead } from "@/hooks/contracts";
import { PredictionMarketABI } from "@/lib/abis";
import { getContractAddress } from "@/lib/contracts";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import { Address } from "viem";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PredictionCardProps {
  prediction: UserPrediction;
}

export function PredictionCard({ prediction }: PredictionCardProps) {
  const { address: userAddress } = useAccount();
  const isWon = prediction.status === "won";
  const isLost = prediction.status === "lost";
  const isActive = prediction.status === "active";
  const [isClaiming, setIsClaiming] = useState(false);

  const predictionMarketAddress = getContractAddress(
    "predictionMarket"
  ) as Address;

  // Check if user has already claimed payout
  const { data: hasClaimed } = useContractRead<boolean>({
    address: predictionMarketAddress,
    abi: PredictionMarketABI,
    functionName: "hasClaimed",
    args:
      userAddress && prediction.marketId
        ? [BigInt(prediction.marketId), userAddress]
        : undefined,
    enabled:
      !!userAddress && !!prediction.marketId && !!predictionMarketAddress,
  });

  // Claim payout function
  const {
    write: claimPayout,
    hash: claimHash,
    isPending: isClaimPending,
    isConfirmed: isClaimConfirmed,
  } = useContractWrite({
    address: predictionMarketAddress,
    abi: PredictionMarketABI,
    functionName: "claimPayout",
  });

  // Wait for transaction
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: claimHash,
  });

  const handleClaimPayout = async () => {
    if (!claimPayout || !prediction.marketId) {
      toast.error("Unable to claim payout");
      return;
    }

    setIsClaiming(true);
    try {
      claimPayout([BigInt(prediction.marketId)]);
      toast.success("Transaction submitted! Waiting for confirmation...");
    } catch (error) {
      console.error("Error claiming payout:", error);
      toast.error("Failed to claim payout");
      setIsClaiming(false);
    }
  };

  // Handle successful claim
  if (isClaimConfirmed && !hasClaimed) {
    // Transaction confirmed, refetch will update hasClaimed
    setIsClaiming(false);
    toast.success("Payout claimed successfully!");
  }

  const canClaim =
    isWon && !hasClaimed && prediction.actualWin && prediction.actualWin > 0;

  return (
    <Card
      className={cn(
        "bg-[#1E293B] border-[#334155] transition-all duration-200",
        isWon && "border-green-500/50",
        isLost && "border-red-500/50"
      )}
    >
      <CardContent className="p-4 md:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 gap-2 md:items-center md:mb-4">
          <div className="flex items-center gap-2">
            <Badge
              className={cn(
                "text-[10px] md:text-xs font-semibold",
                prediction.categoryColor
              )}
            >
              {prediction.category}
            </Badge>
            {prediction.isCreator && (
              <Badge className="text-[10px] md:text-xs font-semibold bg-purple-500/10 text-purple-400 border-purple-500/20">
                Created
              </Badge>
            )}
          </div>

          {isActive && prediction.timeLeft && (
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3 md:w-4 md:h-4 text-gray-400" />
              <span className="text-[11px] md:text-xs text-gray-400">
                {prediction.timeLeft}
              </span>
            </div>
          )}

          {!isActive && prediction.marketStatus === "resolved" && (
            <span className="text-[11px] md:text-xs text-gray-400">
              Resolved
            </span>
          )}
        </div>

        {/* Question */}
        <h3 className="text-base md:text-lg font-bold mb-3 leading-snug">
          {prediction.marketQuestion}
        </h3>

        {/* Prediction Details */}
        <div className="space-y-2.5 md:space-y-3 mb-4">
          {prediction.stake > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm md:text-sm text-gray-400">
                Your Prediction
              </span>
              <div className="flex items-center space-x-2">
                {prediction.side === "yes" ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
                <span
                  className={cn(
                    "text-sm md:text-sm font-semibold uppercase",
                    prediction.side === "yes"
                      ? "text-green-400"
                      : "text-red-400"
                  )}
                >
                  {prediction.side}
                </span>
              </div>
            </div>
          )}

          {prediction.stake > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Stake</span>
              <span className="text-sm font-semibold">
                ${prediction.stake.toFixed(2)}
              </span>
            </div>
          )}

          {prediction.stake === 0 && prediction.isCreator && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Status</span>
              <span className="text-sm font-semibold text-purple-400">
                Market Creator
              </span>
            </div>
          )}

          {isActive && prediction.stake > 0 ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Potential Win</span>
              <span className="text-sm font-semibold text-green-400">
                ${prediction.potentialWin.toFixed(2)}
              </span>
            </div>
          ) : prediction.stake > 0 ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Result</span>
              <div className="flex items-center space-x-2">
                {isWon ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-semibold text-green-400">
                      {`+$${prediction.actualWin?.toFixed(2)}`}
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-semibold text-red-400">
                      {`-$${prediction.stake.toFixed(2)}`}
                    </span>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Market Stats */}
        <div className="pt-3 border-t border-[#334155]">
          <div className="grid grid-cols-2 gap-2 md:gap-3 mb-3">
            <div className="text-center">
              <div className="text-lg md:text-xl font-bold text-green-400 mb-1">
                {prediction.yesPercent}%
              </div>
              <div className="text-xs text-gray-400">YES</div>
            </div>
            <div className="text-center">
              <div className="text-lg md:text-xl font-bold text-red-400 mb-1">
                {prediction.noPercent}%
              </div>
              <div className="text-xs text-gray-400">NO</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
            <span className="truncate">Pool: {prediction.pool}</span>
            <span
              className={cn(
                "px-2 py-1 rounded-full text-xs font-semibold",
                isActive && "bg-blue-500/10 text-blue-400",
                isWon && "bg-green-500/10 text-green-400",
                isLost && "bg-red-500/10 text-red-400"
              )}
            >
              {prediction.status.toUpperCase()}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-[#334155] space-y-2 md:space-y-3">
            {/* Claim Payout Button - Only show if user won and hasn't claimed */}
            {canClaim && (
              <Button
                onClick={handleClaimPayout}
                disabled={isClaiming || isClaimPending || isConfirming}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isClaiming || isClaimPending || isConfirming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isConfirming ? "Confirming..." : "Claiming..."}
                  </>
                ) : (
                  `Claim $${prediction.actualWin?.toFixed(2)}`
                )}
              </Button>
            )}

            {/* View Market Button */}
            <Link href={`/dashboard?market=${prediction.marketId}`}>
              <Button
                variant="outline"
                className="w-full bg-[#0F172A] border-[#334155] hover:bg-[#334155] text-sm flex items-center justify-center"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Market
              </Button>
            </Link>

            {/* Share Button */}
            <ShareButton
              marketId={prediction.marketId}
              marketQuestion={prediction.marketQuestion}
              category={prediction.category}
              variant="outline"
              className="w-full bg-[#0F172A] border-[#334155] hover:bg-[#334155] text-sm"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
