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
import { useQueryClient } from "@tanstack/react-query";
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
import { parseUnits, maxUint256, formatUnits } from "viem";
import { defaultChain } from "@/lib/wallet-config";
import { getContractAddress } from "@/lib/contracts";
import { Address } from "viem";
import { MarketType } from "@/lib/types";
import { MessageSquare } from "lucide-react";
import { useRedeemDelegations } from "@/hooks/useRedeemDelegations";
import { usePermissions } from "@/providers/PermissionProvider";
import { PredictionMarketABI } from "@/lib/abis";
import { useContractRead } from "wagmi";

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
  const queryClient = useQueryClient();

  // Token decimals: USDC (6) on Base, cUSD (18) on Celo
  const tokenDecimals =
    defaultChain.id === 84532 || defaultChain.id === 8453 ? 6 : 18;
  const tokenSymbol =
    defaultChain.id === 84532 || defaultChain.id === 8453 ? "USDC" : "cUSD";

  // One-Tap Betting (ERC-7715 Redeem Delegations with Auto Transfer)
  const { canUseRedeem, redeemWithUSDCTransfer } = useRedeemDelegations();

  // Check permission validity separately
  const { isPermissionValid } = usePermissions();

  // Determine market type (default to Binary for backward compatibility)
  const marketType = market?.marketType ?? MarketType.Binary;
  const isCrowdWisdom = marketType === MarketType.CrowdWisdom;

  useEffect(() => {
    if (open && market) {
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

  const isPending = isStaking
    ? true
    : isCrowdWisdom
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

  // Parse stake amount using correct decimals (USDC: 6, cUSD: 18)
  const stakeInWei =
    stake && parseFloat(stake) > 0
      ? parseUnits(stake, tokenDecimals)
      : undefined;

  // Get existing stakes for Binary markets (Yes + No) to validate total stake
  const { data: yesStake } = useContractRead({
    address: predictionMarketAddress,
    abi: PredictionMarketABI,
    functionName: "userStakes",
    args:
      market?.id && !isCrowdWisdom && address
        ? [BigInt(market.id), address as Address, 0] // 0 = Yes
        : undefined,
    query: {
      enabled:
        !!market?.id &&
        !isCrowdWisdom &&
        !!address &&
        !!predictionMarketAddress,
    },
  });

  const { data: noStake } = useContractRead({
    address: predictionMarketAddress,
    abi: PredictionMarketABI,
    functionName: "userStakes",
    args:
      market?.id && !isCrowdWisdom && address
        ? [BigInt(market.id), address as Address, 1] // 1 = No
        : undefined,
    query: {
      enabled:
        !!market?.id &&
        !isCrowdWisdom &&
        !!address &&
        !!predictionMarketAddress,
    },
  });

  // Calculate total existing stake (contract checks: existing + new <= MAX_STAKE_PER_USER)
  // For Binary: Yes + No stakes, For CrowdWisdom: userPrediction.amount
  const existingStake = isCrowdWisdom
    ? userPrediction?.amount || BigInt(0)
    : ((yesStake as bigint) || BigInt(0)) + ((noStake as bigint) || BigInt(0));

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

  const handlePlacePrediction = useCallback(() => {
    if (isPlacingPredictionRef.current) {
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
      const stakeInWei = parseUnits(stake, tokenDecimals);

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
    tokenDecimals,
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

  useEffect(() => {
    if (approvalError) {
      isPlacingPredictionRef.current = false;
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

      // Invalidate queries to refresh pool data and market details
      // Wait a bit for transaction to be confirmed on-chain before refetching
      setTimeout(() => {
        const predictionMarketAddress = getContractAddress("predictionMarket");
        // Invalidate all wagmi readContract queries for prediction market
        queryClient.invalidateQueries({
          predicate: (query) => {
            const queryKey = query.queryKey;
            // Match wagmi readContract queries for prediction market
            if (Array.isArray(queryKey) && queryKey[0] === "readContract") {
              const queryData = queryKey[1] as { address?: string };
              return (
                queryData?.address?.toLowerCase() ===
                predictionMarketAddress?.toLowerCase()
              );
            }
            // Also match custom query keys
            return (
              (Array.isArray(queryKey) && queryKey[0] === "allMarkets") ||
              (Array.isArray(queryKey) && queryKey[0] === "marketDetails") ||
              (Array.isArray(queryKey) && queryKey[0] === "poolAmounts") ||
              (Array.isArray(queryKey) && queryKey[0] === "userPrediction") ||
              (Array.isArray(queryKey) && queryKey[0] === "marketOutcomes") ||
              (Array.isArray(queryKey) && queryKey[0] === "predictionCount")
            );
          },
        });
      }, 2000); // Wait 2 seconds for transaction confirmation

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
    market?.id,
    queryClient,
  ]);

  useEffect(() => {
    if (writeError) {
      isPlacingPredictionRef.current = false;
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
    // Contract MIN_STAKE = 25e3 (0.025 USDC) for Binary, MIN_STAKE_TO_CREATE_OUTCOME = 1e6 (1 USDC) for CrowdWisdom
    const minStake = isCrowdWisdom ? 1.0 : 0.025;
    if (!stake || parseFloat(stake) < minStake) {
      newErrors.stake = isCrowdWisdom
        ? `Minimum stake is $1.00 ${tokenSymbol} for CrowdWisdom markets`
        : `Minimum stake is $0.025 ${tokenSymbol}`;
    }

    // Check total stake (existing + new) <= MAX_STAKE_PER_USER
    // Contract MAX_STAKE_PER_USER = 20e6 (20 USDC) for USDC, 20e18 (20 cUSD) for cUSD
    const newStakeAmount = stake ? parseUnits(stake, tokenDecimals) : BigInt(0);
    const totalStake = existingStake + newStakeAmount;
    const maxStakePerUser = tokenDecimals === 6 ? BigInt(20e6) : BigInt(20e18); // 20 USDC or 20 cUSD

    if (totalStake > maxStakePerUser) {
      const existingStakeFormatted = Number(
        formatUnits(existingStake, tokenDecimals)
      );
      const maxNewStake = 20 - existingStakeFormatted;
      newErrors.stake =
        existingStakeFormatted > 0
          ? `Maximum total stake is $20.00 ${tokenSymbol}. You already have $${existingStakeFormatted.toFixed(
              2
            )} ${tokenSymbol} staked. Maximum new stake: $${maxNewStake.toFixed(
              2
            )} ${tokenSymbol}`
          : `Maximum stake is $20.00 ${tokenSymbol}`;
    }

    if (cusdBalance && parseFloat(stake) > Number(cusdBalance.formatted)) {
      newErrors.stake = `Insufficient ${tokenSymbol} balance`;
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
      toast.error(`Switch to Celo Sepolia (Chain ID: ${defaultChain.id})`);
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
    const stakeAmount = parseUnits(stake, tokenDecimals);
    const actuallyNeedsApproval =
      currentAllowance === undefined ||
      currentAllowance === null ||
      checkNeedsApproval === true ||
      needsApproval === true ||
      (currentAllowance !== undefined &&
        currentAllowance !== null &&
        currentAllowance < stakeAmount);

    if (canUseRedeem && isPermissionValid()) {
      toast.info("Placing prediction with One-Tap Betting...");

      // Ensure market exists
      if (!market) {
        toast.error("Market not found");
        setIsProcessing(false);
        return;
      }

      try {
        const contractCalls: Array<{
          to: `0x${string}`;
          value?: bigint;
          abi: typeof PredictionMarketABI;
          functionName: string;
          args: readonly unknown[];
        }> = [];

        // Add approval call if needed (as first contract call)
        if (actuallyNeedsApproval) {
          const tokenAddress = getContractAddress("cUSD") as `0x${string}`;
          contractCalls.push({
            to: tokenAddress,
            value: BigInt(0),
            abi: [
              {
                inputs: [
                  { name: "spender", type: "address" },
                  { name: "amount", type: "uint256" },
                ],
                name: "approve",
                outputs: [{ name: "", type: "bool" }],
                stateMutability: "nonpayable",
                type: "function",
              },
            ] as const,
            functionName: "approve",
            args: [predictionMarketAddress, maxUint256],
          });
        }

        // Add prediction/stake call based on market type
        if (isCrowdWisdom) {
          // CrowdWisdom market
          if (hasExistingPrediction && existingOutcomeIndex !== null) {
            // User already staked - add to existing outcome
            contractCalls.push({
              abi: PredictionMarketABI,
              functionName: "stakeOnOutcome",
              args: [
                BigInt(Number(market.id)),
                BigInt(Number(existingOutcomeIndex)),
                stakeAmount,
              ],
              to: predictionMarketAddress,
            });
          } else if (selectedOutcomeIndex !== null) {
            // Stake on existing outcome
            contractCalls.push({
              abi: PredictionMarketABI,
              functionName: "stakeOnOutcome",
              args: [
                BigInt(market.id),
                BigInt(selectedOutcomeIndex),
                stakeAmount,
              ],
              to: predictionMarketAddress,
            });
          } else {
            // Comment and stake (creates new outcome or stakes on existing)
            contractCalls.push({
              abi: PredictionMarketABI,
              functionName: "commentAndStake",
              args: [BigInt(market.id), outcomeComment.trim(), stakeAmount],
              to: predictionMarketAddress,
            });
          }
        } else {
          // Binary market
          const sideUint8 = side === "yes" ? 0 : 1;
          contractCalls.push({
            abi: PredictionMarketABI,
            functionName: "predict",
            args: [BigInt(market.id), sideUint8, stakeAmount],
            to: predictionMarketAddress,
          });
        }

        // Execute with automatic USDC transfer (NO METAMASK POPUP!)
        // Step 1: Transfer USDC from user's EOA to session account (via redeemDelegations)
        // Step 2: Execute contract calls using session account (which now has USDC)
        setIsStaking(true);
        const result = await redeemWithUSDCTransfer({
          usdcAmount: stake, // Amount as string (e.g., "10.5")
          tokenDecimals: tokenDecimals, // 6 for USDC, 18 for cUSD
          // recipient defaults to sessionSmartAccountAddress in the hook
          contractCalls: contractCalls, // Contract calls to execute after transfer
        });

        if (result.success) {
          toast.success("🎉 Prediction placed with One-Tap Betting!");
          console.log(
            "✅ Prediction placed via redeemDelegations (auto-transfer):",
            result.hash
          );

          // Reset form and close modal
          setStake("");
          setOutcomeComment("");
          setSelectedOutcomeIndex(null);
          setProcessedPredictionHash(result.hash || null);
          isPlacingPredictionRef.current = false;

          // Invalidate queries to refresh pool data and market details
          // Wait a bit for transaction to be confirmed on-chain before refetching
          setTimeout(() => {
            const predictionMarketAddress =
              getContractAddress("predictionMarket");
            // Invalidate all wagmi readContract queries for prediction market
            queryClient.invalidateQueries({
              predicate: (query) => {
                const queryKey = query.queryKey;
                // Match wagmi readContract queries for prediction market
                if (Array.isArray(queryKey) && queryKey[0] === "readContract") {
                  const queryData = queryKey[1] as { address?: string };
                  return (
                    queryData?.address?.toLowerCase() ===
                    predictionMarketAddress?.toLowerCase()
                  );
                }
                // Also match custom query keys
                return (
                  (Array.isArray(queryKey) && queryKey[0] === "allMarkets") ||
                  (Array.isArray(queryKey) &&
                    queryKey[0] === "marketDetails") ||
                  (Array.isArray(queryKey) && queryKey[0] === "poolAmounts") ||
                  (Array.isArray(queryKey) &&
                    queryKey[0] === "userPrediction") ||
                  (Array.isArray(queryKey) &&
                    queryKey[0] === "marketOutcomes") ||
                  (Array.isArray(queryKey) && queryKey[0] === "predictionCount")
                );
              },
            });
          }, 2000); // Wait 2 seconds for transaction confirmation

          // Close modal after a short delay to show success message
          setTimeout(() => {
            onOpenChange(false);
          }, 1500);
        } else {
          toast.error(`Failed: ${result.error}`);
          console.error("❌ Session transaction failed:", result.error);
          setIsProcessing(false);
          setIsStaking(false);
          isPlacingPredictionRef.current = false;
        }
      } catch (err) {
        console.error("One-Tap Betting error:", err);
        toast.error("One-Tap Betting failed. Falling back to regular flow...");
        // Fall through to regular flow
        setIsProcessing(false);
        setIsStaking(false);
        isPlacingPredictionRef.current = false;
      }
      return;
    }

    // ======== REGULAR WALLET FLOW (with MetaMask popups) ========
    console.log("📱 Using regular wallet flow (MetaMask popups required)");

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
      ? Number(formatUnits(potentialWinnings, tokenDecimals)).toFixed(2)
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
          {/* One-Tap Betting Indicator */}
          {canUseRedeem && isPermissionValid() && (
            <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                <p className="text-xs sm:text-sm text-yellow-400 font-medium">
                  ⚡ One-Tap Betting Active - No wallet popups!
                </p>
              </div>
            </div>
          )}

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
                                  {Number(
                                    formatUnits(poolAmount, tokenDecimals)
                                  ).toFixed(2)}{" "}
                                  {tokenSymbol}
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
                  placeholder={isCrowdWisdom ? "1.00" : "0.25"}
                  min={isCrowdWisdom ? "1" : "0.25"}
                  max="20"
                  step="0.25"
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
                Minimum: ${isCrowdWisdom ? "1.00" : "0.25"} • Maximum: $20.00
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
                        : isStaking
                        ? "Placing prediction with One-Tap Betting (auto-transfer)..."
                        : isPending
                        ? "Placing your prediction..."
                        : "Processing..."}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {isApproving
                        ? "After approval, prediction will start automatically"
                        : isStaking
                        ? "No wallet popup needed! USDC transfers automatically 🎉"
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
                parseFloat(stake) < (isCrowdWisdom ? 1.0 : 0.25) ||
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
                    : isStaking
                    ? "One-Tap..."
                    : isPending
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
