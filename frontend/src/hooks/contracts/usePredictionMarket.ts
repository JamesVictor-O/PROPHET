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
  const {
    data: market,
    isLoading,
    isError,
    error,
  } = useContractRead<{
    id: bigint;
    question: string;
    category: string;
    creator: Address;
    yesPool: bigint;
    noPool: bigint;
    totalPool: bigint;
    endTime: bigint;
    status: number; // 0 = Active, 1 = Resolved, 2 = Cancelled
    winningOutcome: number; // 0 = Yes, 1 = No (only meaningful if resolved)
    resolved: boolean;
  }>({
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
    side: number; // 0 = Yes, 1 = No
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
 * Hook for making a prediction
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
