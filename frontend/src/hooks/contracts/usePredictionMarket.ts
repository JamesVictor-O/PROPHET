/**
 * Hook for interacting with PredictionMarket contract
 * Handles market data fetching and predictions
 *
 * NOTE: In the refactored architecture, all markets are stored in a single
 * PredictionMarket contract. We use marketId to fetch specific market data.
 */

import { Address } from "viem";
import { useContractRead } from "./useContract";
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
    winningOutcome: number; // 0 = Yes, 1 = No
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
