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
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAccount, useBalance } from "wagmi";
import {
  usePredict,
  useCUSDAllowance,
  useApproveCUSD,
  usePotentialWinnings,
} from "@/hooks/contracts";
import { toast } from "sonner";
import { parseEther, maxUint256, formatEther } from "viem";
import { defaultChain } from "@/lib/wallet-config";
import { getContractAddress } from "@/lib/contracts";
import { Address } from "viem";

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
  const [errors, setErrors] = useState<{
    stake?: string;
    side?: string;
  }>({});
  const [needsApproval, setNeedsApproval] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { chainId, address } = useAccount();
  const { write, isPending, isConfirmed, error: writeError } = usePredict();

  // Check if on correct network
  const isCorrectNetwork = chainId === defaultChain.id;

  // Get PredictionMarket address for approval
  const predictionMarketAddress = getContractAddress(
    "predictionMarket"
  ) as Address;

  // Calculate stake amount in wei
  const stakeInWei =
    stake && parseFloat(stake) > 0 ? parseEther(stake) : undefined;

  // Check if approval is needed
  const {
    needsApproval: checkNeedsApproval,
    isLoading: isLoadingAllowance,
    refetch: refetchAllowance,
  } = useCUSDAllowance(predictionMarketAddress, stakeInWei);

  // Approval hook
  const {
    write: approve,
    isPending: isApprovalPending,
    isConfirmed: isApprovalConfirmed,
    error: approvalError,
  } = useApproveCUSD();

  // Get cUSD balance
  const cusdAddress = getContractAddress("cUSD") as Address;
  const { data: cusdBalance } = useBalance({
    address,
    token: cusdAddress,
    chainId: defaultChain.id,
    query: {
      enabled: !!address && isCorrectNetwork,
    },
  });

  // Calculate potential winnings
  const sideUint8 = side === "yes" ? 0 : 1;
  const { data: potentialWinnings } = usePotentialWinnings(
    market?.id ? BigInt(market.id) : undefined,
    sideUint8 as 0 | 1,
    stakeInWei
  );

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open && selectedSide) {
      setSide(selectedSide);
    }
    if (!open) {
      setStake("");
      setErrors({});
      setNeedsApproval(false);
      setIsApproving(false);
      setIsStaking(false);
      setIsProcessing(false);
    }
  }, [open, selectedSide]);

  // Update needsApproval state when allowance check completes
  useEffect(() => {
    if (checkNeedsApproval !== undefined) {
      setNeedsApproval(checkNeedsApproval);
    }
  }, [checkNeedsApproval]);

  // Handle successful approval - automatically trigger staking
  useEffect(() => {
    if (isApprovalConfirmed && isProcessing) {
      setIsApproving(false);
      setNeedsApproval(false);
      refetchAllowance().then(() => {
        // After approval is confirmed and allowance refetched, automatically place prediction
        if (write && market) {
          setIsStaking(true);
          toast.info("Approval confirmed! Placing prediction...");

          // Small delay to ensure allowance is updated
          setTimeout(() => {
            if (!write || !market) {
              toast.error("Connection error");
              setIsProcessing(false);
              setIsStaking(false);
              return;
            }

            try {
              const stakeInWei = parseEther(stake);
              const sideUint8 = side === "yes" ? 0 : 1;

              write([BigInt(market.id), sideUint8, stakeInWei]);
              toast.info("Confirm prediction in your wallet");
            } catch (err) {
              console.error("Error:", err);
              toast.error("Failed to place prediction");
              setIsProcessing(false);
              setIsStaking(false);
            }
          }, 500);
        }
      });
    }
  }, [
    isApprovalConfirmed,
    refetchAllowance,
    isProcessing,
    write,
    market,
    stake,
    side,
  ]);

  // Handle approval errors
  useEffect(() => {
    if (approvalError) {
      console.error("Approval error:", approvalError);
      toast.error("Failed to approve cUSD");
      setIsApproving(false);
      setIsProcessing(false);
    }
  }, [approvalError]);

  // Sync isApproving state with approval transaction status
  useEffect(() => {
    if (isApprovalPending) {
      setIsApproving(true);
    } else if (isApprovalConfirmed || approvalError) {
      setIsApproving(false);
    }
  }, [isApprovalPending, isApprovalConfirmed, approvalError]);

  // Sync isStaking state with prediction transaction status
  useEffect(() => {
    if (isPending) {
      setIsStaking(true);
    }
  }, [isPending]);

  // Handle successful prediction
  useEffect(() => {
    if (isConfirmed) {
      toast.success("Prediction placed successfully!");
      setStake("");
      setErrors({});
      setNeedsApproval(false);
      setIsApproving(false);
      setIsStaking(false);
      setIsProcessing(false);
      onOpenChange(false);
    }
  }, [isConfirmed, onOpenChange]);

  // Handle errors
  useEffect(() => {
    if (writeError) {
      console.error("Error placing prediction:", writeError);
      setIsProcessing(false);
      setIsStaking(false);
      let errorMessage = "Failed to place prediction";
      if (writeError.message) {
        if (writeError.message.includes("user rejected")) {
          errorMessage = "Transaction rejected";
        } else if (writeError.message.includes("insufficient funds")) {
          errorMessage = "Insufficient funds";
        } else if (writeError.message.includes("market not active")) {
          errorMessage = "Market is no longer active";
        } else if (writeError.message.includes("market ended")) {
          errorMessage = "Market has ended";
        } else if (writeError.message.includes("exceeds max stake")) {
          errorMessage = "Stake exceeds maximum per user ($20)";
        } else if (writeError.message.includes("pool cap reached")) {
          errorMessage = "Market pool cap reached";
        } else if (writeError.message.includes("cannot change side")) {
          errorMessage = "You already predicted on the other side";
        } else {
          errorMessage = writeError.message;
        }
      }
      toast.error(errorMessage);
    }
  }, [writeError]);

  const validateForm = (): boolean => {
    const newErrors: { stake?: string; side?: string } = {};

    if (!stake || parseFloat(stake) < 0.25) {
      newErrors.stake = "Minimum stake is $0.25 cUSD";
    }
    if (parseFloat(stake) > 20) {
      newErrors.stake = "Maximum stake is $20.00 cUSD";
    }
    if (cusdBalance && parseFloat(stake) > Number(cusdBalance.formatted)) {
      newErrors.stake = "Insufficient cUSD balance";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlacePrediction = () => {
    if (!write || !market) {
      toast.error("Connection error");
      setIsProcessing(false);
      return;
    }

    try {
      const stakeInWei = parseEther(stake);
      const sideUint8 = side === "yes" ? 0 : 1;

      write([BigInt(market.id), sideUint8, stakeInWei]);
      toast.info("Confirm prediction in your wallet");
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to place prediction");
      setIsProcessing(false);
      setIsStaking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (!isCorrectNetwork) {
      toast.error(`Switch to Celo Sepolia (Chain ID: ${defaultChain.id})`);
      return;
    }

    setIsProcessing(true);

    // Check if approval is needed
    if (needsApproval || checkNeedsApproval) {
      // Automatically trigger approval
      if (!approve || !predictionMarketAddress) {
        toast.error("Approval not available");
        setIsProcessing(false);
        return;
      }

      setIsApproving(true);
      toast.info("Please approve cUSD spending in your wallet");
      try {
        approve([predictionMarketAddress, maxUint256]);
        // Approval confirmation will automatically trigger prediction via useEffect
      } catch (err) {
        console.error("Error approving:", err);
        toast.error("Approval failed");
        setIsApproving(false);
        setIsProcessing(false);
      }
    } else {
      // No approval needed, place prediction directly
      setIsStaking(true);
      handlePlacePrediction();
    }
  };

  if (!market) return null;

  // Calculate potential win display
  const potentialWinFormatted =
    potentialWinnings && stakeInWei
      ? Number(formatEther(potentialWinnings)).toFixed(2)
      : stake && parseFloat(stake) > 0
      ? (
          (parseFloat(stake) /
            (side === "yes" ? market.yesPercent : market.noPercent)) *
          100
        ).toFixed(2)
      : "0.00";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1E293B] border-dark-700 text-white w-full max-w-lg p-0 gap-0 rounded-2xl overflow-hidden">
        {/* Header - Fixed */}
        <div className="bg-[#0F172A] border-b border-dark-700 px-4 py-4 sticky top-0 z-10">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg font-bold">
              Place Prediction
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-400 line-clamp-2">
              {market.question}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(100vh-180px)] px-4">
          {/* Balance Info */}
          {cusdBalance && (
            <div className="mt-4 p-3 bg-[#0F172A] border border-dark-700 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Your Balance</span>
                <span className="text-sm font-semibold">
                  {Number(cusdBalance.formatted).toFixed(2)} cUSD
                </span>
              </div>
            </div>
          )}

          {/* Category Badge */}
          <div className="mt-4">
            <Badge className="bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20 text-xs">
              {market.category}
            </Badge>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {/* Side Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Your Prediction</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSide("yes")}
                  disabled={isProcessing}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    side === "yes"
                      ? "border-green-500 bg-green-500/10"
                      : "border-dark-700 bg-[#0F172A]"
                  } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-xl font-bold text-green-400">
                      {market.yesPercent}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">YES</div>
                </button>
                <button
                  type="button"
                  onClick={() => setSide("no")}
                  disabled={isProcessing}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    side === "no"
                      ? "border-red-500 bg-red-500/10"
                      : "border-dark-700 bg-[#0F172A]"
                  } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <TrendingDown className="w-4 h-4 text-red-400" />
                    <span className="text-xl font-bold text-red-400">
                      {market.noPercent}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">NO</div>
                </button>
              </div>
              {errors.side && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.side}
                </p>
              )}
            </div>

            {/* Stake Input */}
            <div className="space-y-2">
              <Label
                htmlFor="stake"
                className="text-sm font-medium flex items-center gap-1.5"
              >
                <DollarSign className="w-3.5 h-3.5" />
                Stake Amount
              </Label>
              <div className="relative">
                <Input
                  id="stake"
                  name="stake"
                  type="number"
                  placeholder="0.25"
                  min="0.25"
                  max="20"
                  step="0.25"
                  value={stake}
                  onChange={(e) => {
                    setStake(e.target.value);
                    if (errors.stake) {
                      setErrors((prev) => ({ ...prev, stake: undefined }));
                    }
                  }}
                  disabled={isProcessing}
                  className="bg-[#0F172A] border-dark-700 text-white h-11 text-sm pr-14 placeholder:text-gray-500 disabled:opacity-50"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  cUSD
                </span>
              </div>
              {errors.stake && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.stake}
                </p>
              )}
              <p className="text-xs text-gray-400">
                Minimum: $0.25 • Maximum: $20.00
              </p>
            </div>

            {/* Potential Win Preview */}
            {stake && parseFloat(stake) > 0 && (
              <div className="bg-[#0F172A] border border-dark-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Your Stake</span>
                  <span className="text-sm font-semibold">${stake} cUSD</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Potential Win</span>
                  <span className="text-sm font-semibold text-green-400">
                    ${potentialWinFormatted} cUSD
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-dark-700">
                  <span className="text-xs text-gray-400">Current Pool</span>
                  <span className="text-sm font-semibold">{market.pool}</span>
                </div>
              </div>
            )}

            {/* Info message when processing */}
            {isProcessing && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <div className="flex items-start gap-2">
                  <Loader2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5 animate-spin" />
                  <div className="flex-1">
                    <p className="text-xs text-blue-400 font-medium">
                      {isApproving
                        ? "Please approve cUSD spending in your wallet..."
                        : isStaking || isPending
                        ? "Placing your prediction..."
                        : "Processing..."}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {isApproving
                        ? "After approval, prediction will start automatically"
                        : "Please confirm the transaction in your wallet"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer - Fixed */}
        <div className="bg-[#0F172A] border-t border-dark-700 p-4 sticky bottom-0">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-transparent border-dark-700 hover:bg-[#1E293B] h-11 text-sm rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isPending ||
                isProcessing ||
                isLoadingAllowance ||
                !stake ||
                parseFloat(stake) < 0.25
              }
              className="flex-1 bg-[#2563EB] hover:bg-blue-600 text-white h-11 text-sm rounded-lg disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isApproving
                    ? "Approving..."
                    : isStaking || isPending
                    ? "Placing..."
                    : "Processing..."}
                </>
              ) : isLoadingAllowance ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                "Place Prediction"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
