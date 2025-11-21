/**
 * Hook for interacting with PredictionMarket contract
 * Handles market data fetching and predictions
 *
 * NOTE: In the refactored architecture, all markets are stored in a single
 * PredictionMarket contract. We use marketId to fetch specific market data.
 */

import { Address } from "viem";
import { useContractRead, useContractWrite } from "./useContract";
import { PredictionMarketABI } from "@/lib/abis";
import { getContractAddress } from "@/lib/contracts";
import { MarketType, MarketStatus, Outcome, MarketStruct } from "@/lib/types";
import { usePublicClient } from "wagmi";
import { useQuery } from "@tanstack/react-query";

/**
 * Get the single PredictionMarket contract address
 */
export function usePredictionMarket() {
  const predictionMarketAddress = getContractAddress(
    "predictionMarket"
  ) as Address;
  return {
    address: predictionMarketAddress,
    abi: PredictionMarketABI,
  };
}

/**
 * Get market details by marketId
 * In the refactored architecture, all markets are in one contract
 */
export function useMarketDetails(marketId: bigint | number | undefined) {
  const { address, abi } = usePredictionMarket();

  // Fetch market info using getMarketInfo(marketId)
  // Returns Market struct with MarketType support
  const {
    data: market,
    isLoading,
    isError,
    error,
  } = useContractRead<MarketStruct>({
    address,
    abi,
    functionName: "getMarketInfo",
    args: marketId !== undefined ? [BigInt(marketId)] : undefined,
    enabled: marketId !== undefined && !!address,
  });

  return {
    data: market,
    isLoading,
    isError,
    error,
  };
}

/**
 * Get resolved status by marketId
 */
export function useIsResolved(marketId: bigint | number | undefined) {
  const { data: market } = useMarketDetails(marketId);

  return {
    data: market?.resolved ?? false,
    isLoading: !market,
  };
}

/**
 * Get pool amounts by marketId
 * In refactored architecture, pools are stored per marketId
 */
export function usePoolAmounts(marketId: bigint | number | undefined) {
  const { address, abi } = usePredictionMarket();

  const yesPool = useContractRead<bigint>({
    address,
    abi,
    functionName: "poolAmounts",
    args: marketId !== undefined ? [BigInt(marketId), 0] : undefined, // [marketId, Outcome.Yes = 0]
    enabled: marketId !== undefined && !!address,
  });

  const noPool = useContractRead<bigint>({
    address,
    abi,
    functionName: "poolAmounts",
    args: marketId !== undefined ? [BigInt(marketId), 1] : undefined, // [marketId, Outcome.No = 1]
    enabled: marketId !== undefined && !!address,
  });

  return {
    yesPool: yesPool.data,
    noPool: noPool.data,
    isLoading: yesPool.isLoading || noPool.isLoading,
  };
}

/**
 * Get user's prediction for a specific market
 */
export function useUserPrediction(
  marketId: bigint | number | undefined,
  userAddress: string | undefined
) {
  const { address, abi } = usePredictionMarket();

  return useContractRead<{
    user: Address;
    side: Outcome; // For Binary markets: 0 = Yes, 1 = No
    outcomeIndex: bigint; // For CrowdWisdom markets: 0, 1, 2...
    amount: bigint;
    timestamp: bigint;
  }>({
    address,
    abi,
    functionName: "getUserPrediction",
    args:
      marketId !== undefined && userAddress
        ? [BigInt(marketId), userAddress as Address]
        : undefined,
    enabled: marketId !== undefined && !!userAddress && !!address,
  });
}

/**
 * Get odds for a side (as percentage)
 */
export function useOdds(
  marketId: bigint | number | undefined,
  side: 0 | 1 | undefined // 0 = Yes, 1 = No
) {
  const { address, abi } = usePredictionMarket();

  return useContractRead<bigint>({
    address,
    abi,
    functionName: "getOdds",
    args:
      marketId !== undefined && side !== undefined
        ? [BigInt(marketId), side]
        : undefined,
    enabled: marketId !== undefined && side !== undefined && !!address,
  });
}

/**
 * Calculate potential winnings for a prediction
 */
export function usePotentialWinnings(
  marketId: bigint | number | undefined,
  side: 0 | 1 | undefined, // 0 = Yes, 1 = No
  amount: bigint | undefined
) {
  const { address, abi } = usePredictionMarket();

  return useContractRead<bigint>({
    address,
    abi,
    functionName: "calculatePotentialWinnings",
    args:
      marketId !== undefined && side !== undefined && amount !== undefined
        ? [BigInt(marketId), side, amount]
        : undefined,
    enabled:
      marketId !== undefined &&
      side !== undefined &&
      amount !== undefined &&
      !!address,
  });
}

/**
 * Get fees for a market
 */
export function useFees(marketId: bigint | number | undefined) {
  const { address, abi } = usePredictionMarket();

  return useContractRead<{
    platformFee: bigint;
    creatorFee: bigint;
  }>({
    address,
    abi,
    functionName: "getFees",
    args: marketId !== undefined ? [BigInt(marketId)] : undefined,
    enabled: marketId !== undefined && !!address,
  });
}

/**
 * Hook for making a prediction (Binary markets only)
 * For CrowdWisdom markets, use useCommentAndStake or useStakeOnOutcome
 */
export function usePredict() {
  const { address, abi } = usePredictionMarket();

  return useContractWrite({
    address,
    abi,
    functionName: "predict",
  });
}

/**
 * Hook for commenting and staking on a CrowdWisdom market
 * Creates a new outcome if it doesn't exist, or stakes on existing one
 * Args: [marketId, outcomeLabel, amount]
 */
export function useCommentAndStake() {
  const { address, abi } = usePredictionMarket();

  return useContractWrite({
    address,
    abi,
    functionName: "commentAndStake",
  });
}

/**
 * Hook for staking on an existing outcome in a CrowdWisdom market
 * Args: [marketId, outcomeIndex, amount]
 */
export function useStakeOnOutcome() {
  const { address, abi } = usePredictionMarket();

  return useContractWrite({
    address,
    abi,
    functionName: "stakeOnOutcome",
  });
}

/**
 * Get all outcomes for a CrowdWisdom market
 * Returns tuple: [outcomeLabels: string[], outcomePools: bigint[]]
 */
export function useMarketOutcomes(marketId: bigint | number | undefined) {
  const { address, abi } = usePredictionMarket();

  return useContractRead<[string[], bigint[]]>({
    address,
    abi,
    functionName: "getMarketOutcomes",
    args: marketId !== undefined ? [BigInt(marketId)] : undefined,
    enabled: marketId !== undefined && !!address,
  });
}

/**
 * Get outcome label for a specific outcome index
 * Args: [marketId, outcomeIndex]
 */
export function useOutcomeLabel(
  marketId: bigint | number | undefined,
  outcomeIndex: bigint | number | undefined
) {
  const { address, abi } = usePredictionMarket();

  return useContractRead<string>({
    address,
    abi,
    functionName: "getOutcomeLabel",
    args:
      marketId !== undefined && outcomeIndex !== undefined
        ? [BigInt(marketId), BigInt(outcomeIndex)]
        : undefined,
    enabled: marketId !== undefined && outcomeIndex !== undefined && !!address,
  });
}

/**
 * Get odds for a CrowdWisdom outcome (as percentage)
 * Args: [marketId, outcomeIndex]
 */
export function useOutcomeOdds(
  marketId: bigint | number | undefined,
  outcomeIndex: bigint | number | undefined
) {
  const { address, abi } = usePredictionMarket();

  return useContractRead<bigint>({
    address,
    abi,
    functionName: "getOutcomeOdds",
    args:
      marketId !== undefined && outcomeIndex !== undefined
        ? [BigInt(marketId), BigInt(outcomeIndex)]
        : undefined,
    enabled: marketId !== undefined && outcomeIndex !== undefined && !!address,
  });
}

/**
 * Get user's stake on a specific outcome in a CrowdWisdom market
 * Args: [marketId, user, outcomeIndex]
 */
export function useUserOutcomeStake(
  marketId: bigint | number | undefined,
  userAddress: string | undefined,
  outcomeIndex: bigint | number | undefined
) {
  const { address, abi } = usePredictionMarket();

  return useContractRead<bigint>({
    address,
    abi,
    functionName: "getUserOutcomeStake",
    args:
      marketId !== undefined && userAddress && outcomeIndex !== undefined
        ? [BigInt(marketId), userAddress as Address, BigInt(outcomeIndex)]
        : undefined,
    enabled:
      marketId !== undefined &&
      !!userAddress &&
      outcomeIndex !== undefined &&
      !!address,
  });
}

/**
 * Get pool amount for a specific outcome in a CrowdWisdom market
 * Args: [marketId, outcomeIndex]
 */
export function useOutcomePoolAmount(
  marketId: bigint | number | undefined,
  outcomeIndex: bigint | number | undefined
) {
  const { address, abi } = usePredictionMarket();

  return useContractRead<bigint>({
    address,
    abi,
    functionName: "getOutcomePoolAmount",
    args:
      marketId !== undefined && outcomeIndex !== undefined
        ? [BigInt(marketId), BigInt(outcomeIndex)]
        : undefined,
    enabled: marketId !== undefined && outcomeIndex !== undefined && !!address,
  });
}

/**
 * Hook for claiming payout
 */
export function useClaimPayout() {
  const { address, abi } = usePredictionMarket();

  return useContractWrite({
    address,
    abi,
    functionName: "claimPayout",
  });
}

/**
 * Check if user has claimed payout for a market
 */
export function useHasClaimed(
  marketId: bigint | number | undefined,
  userAddress: string | undefined
) {
  const { address, abi } = usePredictionMarket();

  return useContractRead<boolean>({
    address,
    abi,
    functionName: "hasClaimed",
    args:
      marketId !== undefined && userAddress
        ? [BigInt(marketId), userAddress as Address]
        : undefined,
    enabled: marketId !== undefined && !!userAddress && !!address,
  });
}

/**
 * Get prediction count (number of unique participants) for a market
 * This queries PredictionMade events to count unique users
 */
export function usePredictionCount(marketId: bigint | number | undefined) {
  const { address } = usePredictionMarket();
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["predictionCount", address, marketId],
    queryFn: async () => {
      if (!marketId || !address || !publicClient) return 0;

      try {
        // Query PredictionMade events for this market using the ABI
        const logs = await publicClient.getLogs({
          address,
          event: {
            type: "event",
            name: "PredictionMade",
            inputs: [
              { type: "uint256", indexed: true, name: "marketId" },
              { type: "address", indexed: true, name: "user" },
              { type: "uint8", indexed: false, name: "side" },
              { type: "uint256", indexed: false, name: "outcomeIndex" },
              { type: "uint256", indexed: false, name: "amount" },
            ],
          },
          args: {
            marketId: BigInt(marketId),
          },
          fromBlock: BigInt(0),
        });

        // Count unique users
        const uniqueUsers = new Set<string>();
        logs.forEach((log: { args?: { user?: Address } }) => {
          if (log.args?.user) {
            uniqueUsers.add(log.args.user.toLowerCase());
          }
        });

        return uniqueUsers.size;
      } catch (error) {
        console.error("Error fetching prediction count:", error);
        return 0;
      }
    },
    enabled: !!marketId && !!address && !!publicClient,
    staleTime: 30000, // Cache for 30 seconds
  });
}
