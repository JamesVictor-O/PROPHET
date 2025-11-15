"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Prediction } from "@/app/dashboard/predictions/page";
import { ShareButton } from "@/components/social/share-button";
import { cn } from "@/lib/utils";

interface PredictionCardProps {
  prediction: Prediction;
}

export function PredictionCard({ prediction }: PredictionCardProps) {
  const isWon = prediction.status === "won";
  const isLost = prediction.status === "lost";
  const isActive = prediction.status === "active";

  return (
    <Card
      className={cn(
        "bg-[#1E293B] border-[#334155] transition-all duration-200",
        isWon && "border-green-500/50",
        isLost && "border-red-500/50"
      )}
    >
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Badge
            className={cn("text-xs font-semibold", prediction.categoryColor)}
          >
            {prediction.category}
          </Badge>
          {isActive && prediction.timeLeft && (
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">
                {prediction.timeLeft}
              </span>
            </div>
          )}
          {!isActive && prediction.resolvedAt && (
            <span className="text-xs text-gray-400">
              {prediction.resolvedAt}
            </span>
          )}
        </div>

        {/* Question */}
        <h3 className="text-lg font-bold mb-4 leading-snug">
          {prediction.marketQuestion}
        </h3>

        {/* Prediction Details */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Your Prediction</span>
            <div className="flex items-center space-x-2">
              {prediction.side === "yes" ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
              <span
                className={cn(
                  "text-sm font-semibold uppercase",
                  prediction.side === "yes" ? "text-green-400" : "text-red-400"
                )}
              >
                {prediction.side}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Stake</span>
            <span className="text-sm font-semibold">
              ${prediction.stake.toFixed(2)}
            </span>
          </div>

          {isActive ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Potential Win</span>
              <span className="text-sm font-semibold text-green-400">
                ${prediction.potentialWin.toFixed(2)}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Result</span>
              <div className="flex items-center space-x-2">
                {isWon ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-semibold text-green-400">
                      +${prediction.actualWin?.toFixed(2)}
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-semibold text-red-400">
                      -${prediction.stake.toFixed(2)}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Market Stats */}
        <div className="pt-4 border-t border-[#334155]">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="text-center">
              <div className="text-lg font-bold text-green-400 mb-1">
                {prediction.yesPercent}%
              </div>
              <div className="text-xs text-gray-400">YES</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-400 mb-1">
                {prediction.noPercent}%
              </div>
              <div className="text-xs text-gray-400">NO</div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
            <span>Pool: {prediction.pool}</span>
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

          {/* Share Button */}
          <div className="pt-3 border-t border-[#334155]">
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
