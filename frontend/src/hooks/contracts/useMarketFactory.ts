import { Address } from "viem";
import { useAccount } from "wagmi";
import { useContractRead, useContractWrite } from "./useContract";
import { MarketFactoryABI, PredictionMarketABI } from "@/lib/abis";
import { getContractAddress, getContracts } from "@/lib/contracts";

export function useMarketFactory() {
  const { chainId } = useAccount();
  const contracts = getContracts("baseSepolia");
  const factoryAddress = getContractAddress("factory") as Address;
  const isCorrectNetwork = !chainId || chainId === contracts.chainId;

  if (!isCorrectNetwork && chainId) {
    console.warn(
      `Network mismatch: Expected Base Sepolia (${contracts.chainId}), got ${chainId}.`
    );
  }

  return {
    address: factoryAddress,
    abi: MarketFactoryABI,
    isCorrectNetwork,
  };
}

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
    args: [BigInt(1)],
    enabled: isCorrectNetwork && !!predictionMarketAddress,
  });
}

export function useMarketAddress(marketId: bigint | number | undefined) {
  const predictionMarketAddress = getContractAddress(
    "predictionMarket"
  ) as Address;
  const { data: marketInfo } = useContractRead({
    address: predictionMarketAddress,
    abi: PredictionMarketABI,
    functionName: "getMarketInfo",
    args: marketId !== undefined ? [BigInt(marketId)] : undefined,
    enabled: marketId !== undefined,
  });

  return {
    data: marketInfo ? predictionMarketAddress : undefined,
    isLoading: marketInfo === undefined && marketId !== undefined,
    isError: false,
  };
}

export function useMarketIdByIndex(index: number | undefined) {
  return {
    data: index !== undefined ? BigInt(index + 1) : undefined,
    isLoading: false,
    isError: false,
  };
}

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
    args: [BigInt(1)],
    enabled: isCorrectNetwork && !!predictionMarketAddress,
  });

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
    initialSide: 0 | 1;
    creatorAddress: Address;
  }) => {
    if (!writeContract.write) {
      throw new Error("Write function not available");
    }
    const contractArgs: readonly unknown[] = [
      0,
      args.question,
      args.category,
      args.endTime,
      args.initialStake,
      args.initialSide,
      "",
      args.creatorAddress,
    ];
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
    creatorAddress: Address;
  }) => {
    if (!writeContract.write) {
      throw new Error("Write function not available");
    }
    const contractArgs: readonly unknown[] = [
      1,
      args.question,
      args.category,
      args.endTime,
      args.initialStake,
      0,
      args.initialOutcomeLabel,
      args.creatorAddress,
    ];
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

export function useGrantDelegation() {
  const { address, abi } = useMarketFactory();
  return useContractWrite({
    address,
    abi,
    functionName: "grantDelegation",
  });
}

export function useRevokeDelegation() {
  const { address, abi } = useMarketFactory();
  return useContractWrite({
    address,
    abi,
    functionName: "revokeDelegation",
  });
}

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
