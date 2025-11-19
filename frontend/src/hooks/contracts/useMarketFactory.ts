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
 * Hook for creating a Binary market (Yes/No)
 * Simplified wrapper that sets marketType = 0 and initialOutcomeLabel = ""
 *
 * Args: [question, category, endTime, initialStake, initialSide]
 * where initialSide = 0 (Yes) or 1 (No)
 */
export function useCreateBinaryMarket() {
  const { address, abi } = useMarketFactory();
  const writeContract = useContractWrite({
    address,
    abi,
    functionName: "createMarket",
  });

  const write = (args: {
    question: string;
    category: string;
    endTime: bigint;
    initialStake: bigint;
    initialSide: 0 | 1; // 0 = Yes, 1 = No
  }) => {
    if (!writeContract.write) {
      throw new Error("Write function not available");
    }
    const contractArgs: readonly unknown[] = [
      0, // MarketType.Binary
      args.question,
      args.category,
      args.endTime,
      args.initialStake,
      args.initialSide,
      "", // initialOutcomeLabel (empty for Binary)
    ];
    console.log("Creating Binary market with args:", contractArgs);
    writeContract.write(contractArgs);
  };

  return {
    ...writeContract,
    write,
  };
}

/**
 * Hook for creating a CrowdWisdom market (Multi-outcome)
 * Simplified wrapper that sets marketType = 1 and initialSide = 0 (ignored)
 *
 * Args: [question, category, endTime, initialStake, initialOutcomeLabel]
 */
export function useCreateCrowdWisdomMarket() {
  const { address, abi } = useMarketFactory();
  const writeContract = useContractWrite({
    address,
    abi,
    functionName: "createMarket",
  });

  const write = (args: {
    question: string;
    category: string;
    endTime: bigint;
    initialStake: bigint;
    initialOutcomeLabel: string;
  }) => {
    if (!writeContract.write) {
      throw new Error("Write function not available");
    }
    const contractArgs: readonly unknown[] = [
      1, // MarketType.CrowdWisdom
      args.question,
      args.category,
      args.endTime,
      args.initialStake,
      0, // initialSide (ignored for CrowdWisdom, but required by contract)
      args.initialOutcomeLabel,
    ];
    console.log("Creating CrowdWisdom market with args:", contractArgs);
    writeContract.write(contractArgs);
  };

  return {
    ...writeContract,
    write,
  };
}

/**
 * @deprecated Use useCreateBinaryMarket or useCreateCrowdWisdomMarket instead
 * Generic hook for creating a market (supports both types)
 *
 * Args: [marketType, question, category, endTime, initialStake, initialSide, initialOutcomeLabel]
 */
export function useCreateMarket() {
  const { address, abi } = useMarketFactory();
  return useContractWrite({
    address,
    abi,
    functionName: "createMarket",
  });
}
