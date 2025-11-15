"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";

interface PredictionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  market: {
    id: string;
    question: string;
    category: string;
    yesPercent: number;
    noPercent: number;
    pool: string;
  } | null;
  selectedSide?: "yes" | "no";
}

export function PredictionModal({
  open,
  onOpenChange,
  market,
  selectedSide,
}: PredictionModalProps) {
  const [stake, setStake] = useState("");
  const [side, setSide] = useState<"yes" | "no">(selectedSide || "yes");

  if (!market) return null;

  const handleSubmit = () => {
    // Handle prediction submission
    console.log("Placing prediction:", { market: market.id, side, stake });
    onOpenChange(false);
    setStake("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1E293B] border-[#334155] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Place Prediction
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {market.question}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Category Badge */}
          <div>
            <Badge className="bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20">
              {market.category}
            </Badge>
          </div>

          {/* Side Selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSide("yes")}
              className={`p-4 rounded-lg border-2 transition-all ${
                side === "yes"
                  ? "border-green-500 bg-green-500/10"
                  : "border-[#334155] bg-[#0F172A] hover:border-green-500/50"
              }`}
            >
              <div className="flex items-center justify-center space-x-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-2xl font-bold text-green-400">
                  {market.yesPercent}%
                </span>
              </div>
              <div className="text-sm text-gray-400">YES</div>
            </button>
            <button
              onClick={() => setSide("no")}
              className={`p-4 rounded-lg border-2 transition-all ${
                side === "no"
                  ? "border-red-500 bg-red-500/10"
                  : "border-[#334155] bg-[#0F172A] hover:border-red-500/50"
              }`}
            >
              <div className="flex items-center justify-center space-x-2 mb-2">
                <TrendingDown className="w-5 h-5 text-red-400" />
                <span className="text-2xl font-bold text-red-400">
                  {market.noPercent}%
                </span>
              </div>
              <div className="text-sm text-gray-400">NO</div>
            </button>
          </div>

          {/* Stake Input */}
          <div className="space-y-2">
            <Label htmlFor="stake" className="text-sm font-medium">
              Stake Amount ($)
            </Label>
            <Input
              id="stake"
              type="number"
              placeholder="0.25"
              min="0.25"
              max="20"
              step="0.25"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              className="bg-[#0F172A] border-[#334155] text-white"
            />
            <p className="text-xs text-gray-400">
              Minimum: $0.25 • Maximum: $20.00
            </p>
          </div>

          {/* Potential Win Preview */}
          {stake && parseFloat(stake) > 0 && (
            <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Your Stake</span>
                <span className="text-sm font-semibold">${stake}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Potential Win</span>
                <span className="text-sm font-semibold text-green-400">
                  $
                  {(
                    (parseFloat(stake) /
                      (side === "yes" ? market.yesPercent : market.noPercent)) *
                    100
                  ).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Pool</span>
                <span className="text-sm font-semibold">{market.pool}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-[#0F172A] border-[#334155] hover:bg-[#334155]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!stake || parseFloat(stake) < 0.25}
              className="flex-1 bg-[#2563EB] hover:bg-blue-700 text-white"
            >
              Confirm Prediction
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
