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
import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount, useBalance } from "wagmi";
import {
  usePredict,
  useCUSDAllowance,
  useApproveCUSD,
  usePotentialWinnings,
  useCommentAndStake,
  useStakeOnOutcome,
  useMarketOutcomes,
  useUserPrediction,
} from "@/hooks/contracts";
import { toast } from "sonner";
import { parseEther, maxUint256, formatEther } from "viem";
import { defaultChain } from "@/lib/wallet-config";
import { getContractAddress } from "@/lib/contracts";
import { Address } from "viem";
import { MarketType } from "@/lib/types";
import { MessageSquare } from "lucide-react";

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
    marketType?: MarketType; // Binary (0) or CrowdWisdom (1)
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
  // CrowdWisdom specific state
  const [outcomeComment, setOutcomeComment] = useState("");
  const [selectedOutcomeIndex, setSelectedOutcomeIndex] = useState<
    number | null
  >(null);
  const [errors, setErrors] = useState<{
    stake?: string;
    side?: string;
    outcomeComment?: string;
  }>({});
  const [needsApproval, setNeedsApproval] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedApprovalHash, setProcessedApprovalHash] = useState<
    string | null
  >(null);
  const [processedPredictionHash, setProcessedPredictionHash] = useState<
    string | null
  >(null);

  // Use ref to prevent multiple prediction triggers after approval
  const isPlacingPredictionRef = useRef<boolean>(false);

  const { chainId, address } = useAccount();

  // Determine market type (default to Binary for backward compatibility)
  const marketType = market?.marketType ?? MarketType.Binary;
  const isCrowdWisdom = marketType === MarketType.CrowdWisdom;

  // Debug: Log market type to console
  useEffect(() => {
    if (open && market) {
      console.log("🔍 PredictionModal Debug:", {
        marketId: market.id,
        question: market.question,
        marketTypeRaw: market.marketType,
        marketTypeProcessed: marketType,
        isCrowdWisdom,
        MarketTypeEnum: {
          Binary: MarketType.Binary,
          CrowdWisdom: MarketType.CrowdWisdom,
        },
        willShowBinaryUI: !isCrowdWisdom,
        willShowCrowdWisdomUI: isCrowdWisdom,
      });
    }
  }, [open, market, marketType, isCrowdWisdom]);

  // Hooks for Binary market
  const {
    write: writePredict,
    hash: predictHash,
    isPending: isPredictPending,
    isConfirmed: isPredictConfirmed,
    error: predictError,
  } = usePredict();

  // Hooks for CrowdWisdom market
  const {
    write: writeCommentAndStake,
    hash: commentHash,
    isPending: isCommentPending,
    isConfirmed: isCommentConfirmed,
    error: commentError,
  } = useCommentAndStake();
  const {
    write: writeStakeOnOutcome,
    hash: stakeOnOutcomeHash,
    isPending: isStakeOnOutcomePending,
    isConfirmed: isStakeOnOutcomeConfirmed,
    error: stakeOnOutcomeError,
  } = useStakeOnOutcome();

  // Get existing outcomes for CrowdWisdom markets
  const { data: marketOutcomesData } = useMarketOutcomes(
    market?.id && isCrowdWisdom ? BigInt(market.id) : undefined
  );

  // Get user's existing prediction for CrowdWisdom markets
  const { data: userPrediction } = useUserPrediction(
    market?.id && isCrowdWisdom ? BigInt(market.id) : undefined,
    address
  );

  // Check if user has already staked on an outcome
  const hasExistingPrediction =
    userPrediction && userPrediction.amount > BigInt(0);
  const existingOutcomeIndex =
    hasExistingPrediction && userPrediction
      ? Number(userPrediction.outcomeIndex)
      : null;
  const existingOutcomeLabel =
    hasExistingPrediction &&
    existingOutcomeIndex !== null &&
    marketOutcomesData?.[0]
      ? marketOutcomesData[0][existingOutcomeIndex]
      : null;

  // Use appropriate status based on market type and whether user has existing prediction
  // For CrowdWisdom with existing prediction, always use stakeOnOutcome
  const effectiveOutcomeIndex =
    isCrowdWisdom && hasExistingPrediction && existingOutcomeIndex !== null
      ? existingOutcomeIndex
      : selectedOutcomeIndex;

  const isPending = isCrowdWisdom
    ? effectiveOutcomeIndex !== null
      ? isStakeOnOutcomePending
      : isCommentPending
    : isPredictPending;
  const isConfirmed = isCrowdWisdom
    ? effectiveOutcomeIndex !== null
      ? isStakeOnOutcomeConfirmed
      : isCommentConfirmed
    : isPredictConfirmed;
  const writeError = isCrowdWisdom
    ? effectiveOutcomeIndex !== null
      ? stakeOnOutcomeError
      : commentError
    : predictError;

  // Get the current prediction transaction hash
  const currentPredictionHash = isCrowdWisdom
    ? effectiveOutcomeIndex !== null
      ? stakeOnOutcomeHash
      : commentHash
    : predictHash;

  const isCorrectNetwork = chainId === defaultChain.id;
  const predictionMarketAddress = getContractAddress(
    "predictionMarket"
  ) as Address;
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
    hash: approvalHash,
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

  // Handle placing prediction - must be defined before useEffect that uses it
  const handlePlacePrediction = useCallback(() => {
    // Prevent multiple calls - guard against duplicate triggers
    if (isPlacingPredictionRef.current) {
      console.log(
        "⚠️ handlePlacePrediction: Already placing prediction, skipping duplicate call"
      );
      return;
    }

    if (!market) {
      toast.error("Connection error");
      setIsProcessing(false);
      isPlacingPredictionRef.current = false; // Reset flag on early return
      return;
    }

    // Mark that we're placing a prediction
    isPlacingPredictionRef.current = true;

    try {
      const stakeInWei = parseEther(stake);

      if (isCrowdWisdom) {
        // If user has existing prediction, must use existing outcome index
        if (hasExistingPrediction && existingOutcomeIndex !== null) {
          // User already staked - can only add to existing outcome
          // Always use existing outcome index, ignore selectedOutcomeIndex
          if (!writeStakeOnOutcome) {
            toast.error("Staking function not available");
            setIsProcessing(false);
            isPlacingPredictionRef.current = false; // Reset flag on early return
            return;
          }
          writeStakeOnOutcome([
            BigInt(market.id),
            BigInt(existingOutcomeIndex),
            stakeInWei,
          ]);
        } else if (selectedOutcomeIndex !== null) {
          // Stake on existing outcome (user has no previous stake)
          if (!writeStakeOnOutcome) {
            toast.error("Staking function not available");
            setIsProcessing(false);
            isPlacingPredictionRef.current = false; // Reset flag on early return
            return;
          }
          writeStakeOnOutcome([
            BigInt(market.id),
            BigInt(selectedOutcomeIndex),
            stakeInWei,
          ]);
        } else {
          // Comment and stake (creates new outcome or stakes on existing)
          if (!writeCommentAndStake) {
            toast.error("Comment function not available");
            setIsProcessing(false);
            isPlacingPredictionRef.current = false; // Reset flag on early return
            return;
          }
          writeCommentAndStake([
            BigInt(market.id),
            outcomeComment.trim(),
            stakeInWei,
          ]);
        }
      } else {
        // Binary market
        if (!writePredict) {
          toast.error("Prediction function not available");
          setIsProcessing(false);
          isPlacingPredictionRef.current = false; // Reset flag on early return
          return;
        }
        const sideUint8 = side === "yes" ? 0 : 1;
        writePredict([BigInt(market.id), sideUint8, stakeInWei]);
      }

      toast.info("Confirm prediction in your wallet");
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to place prediction");
      setIsProcessing(false);
      setIsStaking(false);
      isPlacingPredictionRef.current = false; // Reset on error
    }
  }, [
    market,
    stake,
    isCrowdWisdom,
    selectedOutcomeIndex,
    outcomeComment,
    side,
    writeStakeOnOutcome,
    writeCommentAndStake,
    writePredict,
    hasExistingPrediction,
    existingOutcomeIndex,
    setIsProcessing,
    setIsStaking,
  ]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open && selectedSide) {
      setSide(selectedSide);
    }
    // Auto-select existing outcome when modal opens for CrowdWisdom
    if (
      open &&
      isCrowdWisdom &&
      hasExistingPrediction &&
      existingOutcomeIndex !== null
    ) {
      setSelectedOutcomeIndex(existingOutcomeIndex);
      setOutcomeComment(""); // Clear comment input
    }
    if (!open) {
      setStake("");
      setOutcomeComment("");
      setSelectedOutcomeIndex(null);
      setErrors({});
      setNeedsApproval(false);
      setIsApproving(false);
      setIsStaking(false);
      setIsProcessing(false);
      setProcessedApprovalHash(null); // Reset approval hash tracking when modal closes
      setProcessedPredictionHash(null); // Reset prediction hash tracking when modal closes
      isPlacingPredictionRef.current = false; // Reset flag when modal closes
    }
  }, [
    open,
    selectedSide,
    isCrowdWisdom,
    hasExistingPrediction,
    existingOutcomeIndex,
  ]);

  // Update needsApproval state when allowance check completes
  useEffect(() => {
    if (checkNeedsApproval !== undefined) {
      setNeedsApproval(checkNeedsApproval);
    }
  }, [checkNeedsApproval]);

  // Handle successful approval - automatically trigger staking
  useEffect(() => {
    // Only process if:
    // 1. Approval is confirmed
    // 2. We have an approval hash
    // 3. We're currently processing
    // 4. We haven't processed this specific approval hash yet
    // 5. We're not already placing a prediction
    if (
      isApprovalConfirmed &&
      approvalHash &&
      isProcessing &&
      processedApprovalHash !== approvalHash &&
      !isPlacingPredictionRef.current
    ) {
      // Mark this approval hash as processed to prevent re-triggering
      setProcessedApprovalHash(approvalHash);
      setIsApproving(false);
      setNeedsApproval(false);

      refetchAllowance().then(() => {
        // After approval is confirmed and allowance refetched, automatically place prediction
        // Double-check we're still processing and haven't started placing yet
        if (market && isProcessing && !isPlacingPredictionRef.current) {
          setIsStaking(true);
          toast.info("Approval confirmed! Placing prediction...");

          // Small delay to ensure allowance is updated, then place prediction
          setTimeout(() => {
            // Final check before calling
            if (!market || !isProcessing || isPlacingPredictionRef.current) {
              if (!market) {
                toast.error("Connection error");
              }
              setIsProcessing(false);
              setIsStaking(false);
              isPlacingPredictionRef.current = false;
              return;
            }

            // Place the prediction
            handlePlacePrediction();
          }, 300); // Reduced delay for faster flow
        } else {
          isPlacingPredictionRef.current = false;
        }
      });
    }
  }, [
    isApprovalConfirmed,
    approvalHash,
    isProcessing,
    market,
    processedApprovalHash,
    refetchAllowance,
    handlePlacePrediction,
  ]);

  // Handle approval errors
  useEffect(() => {
    if (approvalError) {
      console.error("Approval error:", approvalError);
      isPlacingPredictionRef.current = false; // Reset flag on error
      toast.error("Failed to approve cUSD");
      setIsApproving(false);
      setIsProcessing(false);
      setProcessedApprovalHash(null); // Reset on error
    }
  }, [approvalError]);

  useEffect(() => {
    if (isApprovalPending) {
      setIsApproving(true);
    } else if (isApprovalConfirmed || approvalError) {
      setIsApproving(false);
    }
  }, [isApprovalPending, isApprovalConfirmed, approvalError]);

  useEffect(() => {
    if (isPending) {
      setIsStaking(true);
    }
  }, [isPending]);

  // Handle successful prediction
  useEffect(() => {
    if (
      isConfirmed &&
      currentPredictionHash &&
      processedPredictionHash !== currentPredictionHash
    ) {
      setProcessedPredictionHash(currentPredictionHash);
      isPlacingPredictionRef.current = false; // Reset flag on success
      toast.success("Prediction placed successfully!");
      setStake("");
      setErrors({});
      setNeedsApproval(false);
      setIsApproving(false);
      setIsStaking(false);
      setIsProcessing(false);
      setProcessedApprovalHash(null);
      onOpenChange(false);
    }
  }, [
    isConfirmed,
    currentPredictionHash,
    processedPredictionHash,
    onOpenChange,
  ]);

  // Handle errors
  useEffect(() => {
    if (writeError) {
      console.error("Error placing prediction:", writeError);
      isPlacingPredictionRef.current = false; // Reset flag on error
      setIsProcessing(false);
      setIsStaking(false);
      setProcessedApprovalHash(null); // Reset on error
      setProcessedPredictionHash(null); // Reset on error
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
    const newErrors: {
      stake?: string;
      side?: string;
      outcomeComment?: string;
    } = {};

    // Validate stake amount
    const minStake = isCrowdWisdom ? 1.0 : 0.0025;
    if (!stake || parseFloat(stake) < minStake) {
      newErrors.stake = isCrowdWisdom
        ? "Minimum stake is $1.00 cUSD for CrowdWisdom markets"
        : "Minimum stake is $0.0025 cUSD";
    }
    if (parseFloat(stake) > 20) {
      newErrors.stake = "Maximum stake is $20.00 cUSD";
    }
    if (cusdBalance && parseFloat(stake) > Number(cusdBalance.formatted)) {
      newErrors.stake = "Insufficient cUSD balance";
    }

    // Validate Binary market side
    if (!isCrowdWisdom && !side) {
      newErrors.side = "Please select your prediction side";
    }

    // Validate CrowdWisdom outcome
    if (isCrowdWisdom) {
      if (selectedOutcomeIndex === null && !outcomeComment.trim()) {
        newErrors.outcomeComment =
          "Please comment an outcome or select an existing one";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (!isCorrectNetwork) {
      toast.error(`Switch to Celo Mainnet (Chain ID: ${defaultChain.id})`);
      return;
    }

    setIsProcessing(true);
    setProcessedApprovalHash(null); // Reset when starting new submission
    setProcessedPredictionHash(null); // Reset when starting new submission
    isPlacingPredictionRef.current = false; // Reset flag when starting new submission

    // Wait for allowance check to complete if still loading
    if (isLoadingAllowance) {
      toast.info("Checking allowance...");
      // Wait a bit for the check to complete
      setTimeout(() => {
        handleSubmit(e); // Retry after allowance check completes
      }, 500);
      return;
    }
    const allowanceData = await refetchAllowance();
    const currentAllowance = allowanceData.data as bigint | undefined | null;
    const stakeAmount = parseEther(stake);
    const actuallyNeedsApproval =
      currentAllowance === undefined ||
      currentAllowance === null ||
      checkNeedsApproval === true ||
      needsApproval === true ||
      (currentAllowance !== undefined &&
        currentAllowance !== null &&
        currentAllowance < stakeAmount);

    console.log("🔍 Approval Check:", {
      currentAllowance: currentAllowance?.toString(),
      stakeAmount: stakeAmount.toString(),
      needsApproval,
      checkNeedsApproval,
      actuallyNeedsApproval,
      isLoadingAllowance,
      allowanceFromHook: allowanceData,
    });

    if (actuallyNeedsApproval) {
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
        setProcessedApprovalHash(null);
        isPlacingPredictionRef.current = false;
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
      <DialogContent className="bg-[#1E293B] border-dark-700 text-white w-full max-w-[calc(100%-1rem)] sm:max-w-lg md:max-w-xl lg:max-w-2xl p-0 gap-0 rounded-xl sm:rounded-2xl overflow-hidden max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="bg-[#0F172A] border-b border-dark-700 px-3 py-3 sm:px-4 sm:py-4 sticky top-0 z-10 shrink-0">
          <DialogHeader className="space-y-1.5 sm:space-y-2">
            <DialogTitle className="text-base sm:text-lg font-bold">
              Place Prediction
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-gray-400 line-clamp-2">
              {market.question}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 px-3 sm:px-4 md:px-6 min-h-0">
          {/* Balance Info */}
          {cusdBalance && (
            <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-[#0F172A] border border-dark-700 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-gray-400">
                  Your Balance
                </span>
                <span className="text-sm sm:text-base font-semibold">
                  {Number(cusdBalance.formatted).toFixed(2)} cUSD
                </span>
              </div>
            </div>
          )}

          {/* Category Badge and Market Type */}
          <div className="mt-3 sm:mt-4 flex items-center gap-2 flex-wrap">
            <Badge className="bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20 text-xs">
              {market.category}
            </Badge>
            <Badge
              className={
                isCrowdWisdom
                  ? "bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs"
                  : "bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs"
              }
            >
              {isCrowdWisdom ? "CrowdWisdom" : "Binary"}
            </Badge>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-3 sm:space-y-4 py-3 sm:py-4 md:py-6"
          >
            {/* Binary Market: Side Selection */}
            {!isCrowdWisdom && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Your Prediction</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSide("yes")}
                    disabled={isProcessing}
                    className={`p-3 sm:p-4 rounded-xl border-2 transition-all touch-manipulation min-h-[60px] sm:min-h-[80px] ${
                      side === "yes"
                        ? "border-green-500 bg-green-500/10"
                        : "border-dark-700 bg-[#0F172A]"
                    } ${
                      isProcessing
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:border-green-500/50 active:scale-[0.98]"
                    }`}
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
            )}

            {/* CrowdWisdom Market: Existing Outcomes */}
            {isCrowdWisdom && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Existing Outcomes
                  </Label>
                  {hasExistingPrediction && existingOutcomeLabel && (
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">
                      You staked on: {existingOutcomeLabel}
                    </Badge>
                  )}
                </div>
                {hasExistingPrediction && existingOutcomeIndex !== null && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <p className="text-xs text-green-400">
                      You already staked on &quot;
                      <strong>{existingOutcomeLabel}</strong>&quot;. You can
                      only add more stake to this outcome. Selecting a different
                      outcome is not allowed.
                    </p>
                  </div>
                )}
                {marketOutcomesData &&
                marketOutcomesData[0] &&
                marketOutcomesData[0].length > 0 ? (
                  <div className="space-y-2">
                    {marketOutcomesData[0].map((outcomeLabel, index) => {
                      const poolAmount =
                        marketOutcomesData[1]?.[index] || BigInt(0);
                      const totalPool =
                        marketOutcomesData[1]?.reduce(
                          (sum, amt) => sum + amt,
                          BigInt(0)
                        ) || BigInt(1);
                      const odds =
                        totalPool > BigInt(0)
                          ? Number((poolAmount * BigInt(10000)) / totalPool) /
                            100
                          : 0;

                      // Check if this is user's existing outcome
                      const isExistingOutcome =
                        hasExistingPrediction && existingOutcomeIndex === index;
                      // Disable if user has existing prediction on different outcome
                      const isDisabled =
                        hasExistingPrediction && existingOutcomeIndex !== index;

                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            if (!isDisabled) {
                              setSelectedOutcomeIndex(index);
                              setOutcomeComment(""); // Clear comment when selecting existing
                            }
                          }}
                          disabled={isProcessing || isDisabled}
                          className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                            selectedOutcomeIndex === index
                              ? "border-purple-500 bg-purple-500/10"
                              : isExistingOutcome
                              ? "border-green-500/50 bg-green-500/5"
                              : "border-dark-700 bg-[#0F172A] hover:border-purple-500/50"
                          } ${
                            isProcessing || isDisabled
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="font-semibold text-white flex items-center gap-2">
                                  {outcomeLabel}
                                  {isExistingOutcome && (
                                    <Badge className="bg-green-500/20 text-green-300 text-[10px] px-1.5 py-0">
                                      Your stake
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-gray-400 mt-0.5">
                                  Pool: $
                                  {Number(formatEther(poolAmount)).toFixed(2)}{" "}
                                  cUSD
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-purple-400">
                                {odds.toFixed(1)}%
                              </div>
                              <div className="text-xs text-gray-400">Odds</div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 bg-[#0F172A] border border-dark-700 rounded-xl text-center">
                    <p className="text-xs text-gray-400">
                      No outcomes yet. Be the first to comment!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* CrowdWisdom Market: Comment New Outcome */}
            {isCrowdWisdom && (
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Comment New Outcome
                </Label>
                <Input
                  placeholder="e.g., Obi, Atiku, Peter Obi..."
                  value={outcomeComment}
                  onChange={(e) => {
                    setOutcomeComment(e.target.value);
                    setSelectedOutcomeIndex(null); // Clear selection when typing
                    if (errors.outcomeComment) {
                      setErrors((prev) => ({
                        ...prev,
                        outcomeComment: undefined,
                      }));
                    }
                  }}
                  disabled={isProcessing || selectedOutcomeIndex !== null}
                  className="bg-[#0F172A] border-dark-700 text-white h-11 sm:h-12 text-sm sm:text-base disabled:opacity-50 touch-manipulation min-h-[44px]"
                />
                {errors.outcomeComment && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.outcomeComment}
                  </p>
                )}
                <p className="text-xs text-gray-400">
                  {selectedOutcomeIndex !== null
                    ? "Select an existing outcome above, or clear selection to comment new"
                    : "Comment an outcome to create it or stake on it if it already exists"}
                </p>
              </div>
            )}

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
                  placeholder={isCrowdWisdom ? "1.00" : "0.0025"}
                  min={isCrowdWisdom ? "1" : "0.0025"}
                  max="20"
                  step="0.001"
                  value={stake}
                  style={{ fontSize: "16px" }} // Prevent auto-zoom on mobile iOS
                  onChange={(e) => {
                    setStake(e.target.value);
                    if (errors.stake) {
                      setErrors((prev) => ({ ...prev, stake: undefined }));
                    }
                  }}
                  disabled={isProcessing}
                  className="bg-[#0F172A] border-dark-700 text-white h-11 sm:h-12 text-base pr-14 placeholder:text-gray-500 disabled:opacity-50 touch-manipulation min-h-[44px]"
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
                Minimum: ${isCrowdWisdom ? "1.00" : "0.0025"} • Maximum: $20.00
              </p>
            </div>

            {/* Potential Win Preview - Only for Binary markets */}
            {!isCrowdWisdom && stake && parseFloat(stake) > 0 && (
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

            {/* CrowdWisdom Preview */}
            {isCrowdWisdom && stake && parseFloat(stake) > 0 && (
              <div className="bg-[#0F172A] border border-dark-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Your Stake</span>
                  <span className="text-sm font-semibold">${stake} cUSD</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Outcome</span>
                  <span className="text-sm font-semibold text-purple-400">
                    {selectedOutcomeIndex !== null
                      ? marketOutcomesData?.[0]?.[selectedOutcomeIndex] || "N/A"
                      : outcomeComment.trim() || "New outcome"}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-dark-700">
                  <span className="text-xs text-gray-400">Total Pool</span>
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
        <div className="bg-[#0F172A] border-t border-dark-700 p-3 sm:p-4 sticky bottom-0 shrink-0">
          <div className="flex gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-transparent border-dark-700 hover:bg-[#1E293B] h-11 sm:h-12 text-sm rounded-lg touch-manipulation min-h-[44px]"
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
                parseFloat(stake) < (isCrowdWisdom ? 1.0 : 0.0025) ||
                (isCrowdWisdom &&
                  selectedOutcomeIndex === null &&
                  !outcomeComment.trim()) ||
                (!isCrowdWisdom && !side)
              }
              className="flex-1 bg-[#2563EB] hover:bg-blue-600 text-white h-11 sm:h-12 text-sm rounded-lg disabled:opacity-50 touch-manipulation min-h-[44px]"
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
