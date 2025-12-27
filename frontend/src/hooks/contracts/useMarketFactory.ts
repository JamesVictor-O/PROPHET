import { Address } from "viem";
import { useAccount } from "wagmi";
import { useContractRead, useContractWrite } from "./useContract";
import { MarketFactoryABI, PredictionMarketABI } from "@/lib/abis";
import { getContractAddress, getContracts } from "@/lib/contracts";

export function useMarketFactory() {
  const { chainId } = useAccount();
  // Use baseSepolia as default
  const contracts = getContracts("baseSepolia");
  const factoryAddress = getContractAddress("factory") as Address;
  const isCorrectNetwork = !chainId || chainId === contracts.chainId;

  if (!isCorrectNetwork && chainId) {
    console.warn(
      `Network mismatch: Expected Base Sepolia (${contracts.chainId}), got ${chainId}. Please switch networks.`
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
 * Reads marketCounter[1] from PredictionMarket directly
 */
export function useMarketCount() {
  const { chainId } = useAccount();
  const contracts = getContracts("baseSepolia");
  const predictionMarketAddress = getContractAddress(
    "predictionMarket"
  ) as Address;
  const isCorrectNetwork = !chainId || chainId === contracts.chainId;

  return useContractRead<bigint>({
    address: predictionMarketAddress,
    abi: PredictionMarketABI,
    functionName: "marketCounter",
    args: [BigInt(1)], // marketCounter[1] stores the count
    enabled: isCorrectNetwork && !!predictionMarketAddress,
  });
}

/**
 * Get market address by ID
 * NOTE: With direct PredictionMarket calls, all markets are in the same contract
 * This function returns the PredictionMarket address for any market ID
 */
export function useMarketAddress(marketId: bigint | number | undefined) {
  const predictionMarketAddress = getContractAddress(
    "predictionMarket"
  ) as Address;
  const { data: marketInfo } = useContractRead({
    address: predictionMarketAddress,
    abi: PredictionMarketABI,
    functionName: "getMarketInfo", // Just to validate market exists
    args: marketId !== undefined ? [BigInt(marketId)] : undefined,
    enabled: marketId !== undefined,
  });

  // Always return PredictionMarket address (all markets are in the same contract)
  return {
    data: marketInfo ? predictionMarketAddress : undefined,
    isLoading: marketInfo === undefined && marketId !== undefined,
    isError: false,
  };
}

/**
 * Get market ID by index
 * Since markets are sequential (1, 2, 3...), index + 1 = marketId
 */
export function useMarketIdByIndex(index: number | undefined) {
  return {
    data: index !== undefined ? BigInt(index + 1) : undefined,
    isLoading: false,
    isError: false,
  };
}

/**
 * Get all market IDs
 * Reads marketCounter[1] from PredictionMarket and generates sequential IDs (1, 2, 3...)
 */
export function useAllMarketIds() {
  const { chainId } = useAccount();
  const contracts = getContracts("baseSepolia");
  const predictionMarketAddress = getContractAddress(
    "predictionMarket"
  ) as Address;
  const isCorrectNetwork = !chainId || chainId === contracts.chainId;

  const {
    data: marketCount,
    isLoading: isLoadingCount,
    isError: isErrorCount,
    error: countError,
    refetch: refetchMarketCount,
  } = useContractRead<bigint>({
    address: predictionMarketAddress,
    abi: PredictionMarketABI,
    functionName: "marketCounter",
    args: [BigInt(1)], // marketCounter[1] stores the count
    enabled: isCorrectNetwork && !!predictionMarketAddress,
  });

  // Log detailed error information
  if (isErrorCount && countError) {
    console.error("Error fetching market count:", {
      address: predictionMarketAddress,
      functionName: "marketCounter",
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
    refetch: refetchMarketCount,
  };
}

/**
 * Hook for creating a Binary market (Yes/No)
 * Calls PredictionMarket.createMarket() directly (no MarketFactory middleman)
 *
 * Args: [question, category, endTime, initialStake, initialSide]
 * where initialSide = 0 (Yes) or 1 (No)
 */
export function useCreateBinaryMarket() {
  const predictionMarketAddress = getContractAddress(
    "predictionMarket"
  ) as Address;

  const writeContract = useContractWrite({
    address: predictionMarketAddress,
    abi: PredictionMarketABI,
    functionName: "createMarket",
  });

  const write = (args: {
    question: string;
    category: string;
    endTime: bigint;
    initialStake: bigint;
    initialSide: 0 | 1; // 0 = Yes, 1 = No
    creatorAddress: Address; // EOA address
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
      args.creatorAddress, // EOA address
    ];
    console.log("Creating Binary market with args:", contractArgs);
    writeContract.write(contractArgs);
  };

  return {
    ...writeContract,
    write,
  };
}

export function useCreateCrowdWisdomMarket() {
  const predictionMarketAddress = getContractAddress(
    "predictionMarket"
  ) as Address;

  const writeContract = useContractWrite({
    address: predictionMarketAddress,
    abi: PredictionMarketABI,
    functionName: "createMarket",
  });

  const write = (args: {
    question: string;
    category: string;
    endTime: bigint;
    initialStake: bigint;
    initialOutcomeLabel: string;
    creatorAddress: Address; // EOA address
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
      0, // initialSide (not used for CrowdWisdom)
      args.initialOutcomeLabel,
      args.creatorAddress, // EOA address
    ];
    console.log("Creating CrowdWisdom market with args:", contractArgs);
    writeContract.write(contractArgs);
  };

  return {
    ...writeContract,
    write,
  };
}

export function useCreateMarket() {
  const { address, abi } = useMarketFactory();
  return useContractWrite({
    address,
    abi,
    functionName: "createMarket",
  });
}

/**
 * Hook for granting delegation to a session account
 */
export function useGrantDelegation() {
  const { address, abi } = useMarketFactory();
  return useContractWrite({
    address,
    abi,
    functionName: "grantDelegation",
  });
}

/**
 * Hook for revoking delegation from a session account
 */
export function useRevokeDelegation() {
  const { address, abi } = useMarketFactory();
  return useContractWrite({
    address,
    abi,
    functionName: "revokeDelegation",
  });
}

/**
 * Check if an address has delegation for a user
 */
export function useHasDelegation(
  userAddress: Address | undefined,
  delegateAddress: Address | undefined
) {
  const { address, abi } = useMarketFactory();
  return useContractRead<boolean>({
    address,
    abi,
    functionName: "hasDelegation",
    args:
      userAddress && delegateAddress
        ? [userAddress, delegateAddress]
        : undefined,
    enabled: !!userAddress && !!delegateAddress && !!address,
  });
}
