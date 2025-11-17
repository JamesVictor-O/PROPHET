/**
 * Hook for interacting with PredictionMarket contract
 * Handles market data fetching and predictions
 */

import { Address } from "viem";
import { useContractRead } from "./useContract";
import { PredictionMarketABI } from "@/lib/abis";

export function usePredictionMarket(marketAddress: Address | undefined) {
  return {
    address: marketAddress,
    abi: PredictionMarketABI,
  };
}

/**
 * Get market details
 */
export function useMarketDetails(marketAddress: Address | undefined) {
  const { address, abi } = usePredictionMarket(marketAddress);

  // Fetch market struct
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
    winningOutcome: number; // 0 = Yes, 1 = No
    resolved: boolean;
  }>({
    address,
    abi,
    functionName: "market",
    enabled: !!address,
  });

  return {
    data: market,
    isLoading,
    isError,
    error,
  };
}

/**
 * Get market ID
 */
export function useMarketId(marketAddress: Address | undefined) {
  const { address, abi } = usePredictionMarket(marketAddress);
  return useContractRead<bigint>({
    address,
    abi,
    functionName: "marketId",
    enabled: !!address,
  });
}

/**
 * Get resolved status
 */
export function useIsResolved(marketAddress: Address | undefined) {
  const { address, abi } = usePredictionMarket(marketAddress);
  return useContractRead<boolean>({
    address,
    abi,
    functionName: "resolved",
    enabled: !!address,
  });
}

/**
 * Get pool amounts
 */
export function usePoolAmounts(marketAddress: Address | undefined) {
  const { address, abi } = usePredictionMarket(marketAddress);

  const yesPool = useContractRead<bigint>({
    address,
    abi,
    functionName: "poolAmounts",
    args: [0], // Outcome.Yes = 0
    enabled: !!address,
  });

  const noPool = useContractRead<bigint>({
    address,
    abi,
    functionName: "poolAmounts",
    args: [1], // Outcome.No = 1
    enabled: !!address,
  });

  return {
    yesPool: yesPool.data,
    noPool: noPool.data,
    isLoading: yesPool.isLoading || noPool.isLoading,
  };
}
