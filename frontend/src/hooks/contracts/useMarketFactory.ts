/**
 * Hook for interacting with MarketFactory contract
 * Handles market creation and factory queries
 */

import { Address } from "viem";
import { useAccount } from "wagmi";
import { useContractRead, useContractWrite } from "./useContract";
import { MarketFactoryABI } from "@/lib/abis";
import { getContractAddress, getContracts } from "@/lib/contracts";

export function useMarketFactory() {
  const { chainId } = useAccount();
  const contracts = getContracts("celoSepolia");
  const factoryAddress = getContractAddress("factory") as Address;

  // Verify we're on the correct network
  const isCorrectNetwork = !chainId || chainId === contracts.chainId;

  // Only log warning if connected (not just initializing)
  if (!isCorrectNetwork && chainId) {
    console.warn(
      `Network mismatch: Expected Celo Sepolia (${contracts.chainId}), got ${chainId}. Please switch networks.`
    );
  }

  return {
    address: factoryAddress,
    abi: MarketFactoryABI,
    isCorrectNetwork,
  };
}

/**
 * Get total number of markets
 */
export function useMarketCount() {
  const { address, abi } = useMarketFactory();
  return useContractRead<bigint>({
    address,
    abi,
    functionName: "getMarketCount",
  });
}

/**
 * Get market address by ID
 */
export function useMarketAddress(marketId: bigint | number | undefined) {
  const { address, abi } = useMarketFactory();
  return useContractRead<Address>({
    address,
    abi,
    functionName: "getMarketAddress",
    args: marketId !== undefined ? [BigInt(marketId)] : undefined,
    enabled: marketId !== undefined,
  });
}

/**
 * Get market ID by index
 */
export function useMarketIdByIndex(index: number | undefined) {
  const { address, abi } = useMarketFactory();
  return useContractRead<bigint>({
    address,
    abi,
    functionName: "getMarketId",
    args: index !== undefined ? [BigInt(index)] : undefined,
    enabled: index !== undefined,
  });
}

/**
 * Get all market IDs
 * Since getAllMarketIds doesn't exist in the deployed contract,
 * we use getMarketCount and generate sequential IDs (1, 2, 3...)
 */
export function useAllMarketIds() {
  const { address, abi, isCorrectNetwork } = useMarketFactory();
  const {
    data: marketCount,
    isLoading: isLoadingCount,
    isError: isErrorCount,
    error: countError,
  } = useContractRead<bigint>({
    address,
    abi,
    functionName: "getMarketCount",
    enabled: isCorrectNetwork && !!address,
  });

  // Log detailed error information
  if (isErrorCount && countError) {
    console.error("Error fetching market count:", {
      address,
      functionName: "getMarketCount",
      error: countError,
      isCorrectNetwork,
      chainId:
        typeof window !== "undefined"
          ? (window as { ethereum?: { chainId?: string | number } }).ethereum
              ?.chainId
          : "unknown",
    });
  }

  // Generate market IDs from count (assuming sequential: 1, 2, 3...)
  // In the contract, marketCount is the total, and market IDs start from 1
  const marketIds =
    marketCount !== undefined && marketCount > BigInt(0)
      ? Array.from({ length: Number(marketCount) }, (_, i) => BigInt(i + 1))
      : undefined;

  return {
    data: marketIds,
    isLoading: isLoadingCount,
    isError: isErrorCount,
    error: countError,
  };
}

/**
 * Hook for creating a new market
 */
export function useCreateMarket() {
  const { address, abi } = useMarketFactory();
  return useContractWrite({
    address,
    abi,
    functionName: "createMarket",
  });
}
