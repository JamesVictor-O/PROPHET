import { Address } from "viem";
import { useContractRead, useContractWrite } from "./useContract";
import { PredictionMarketABI } from "@/lib/abis";
import { getContractAddress } from "@/lib/contracts";
import { MarketType, MarketStatus, Outcome, MarketStruct } from "@/lib/types";
import { usePublicClient } from "wagmi";
import { useQuery } from "@tanstack/react-query";

export function usePredictionMarket() {
  const predictionMarketAddress = getContractAddress(
    "predictionMarket"
  ) as Address;
  return {
    address: predictionMarketAddress,
    abi: PredictionMarketABI,
  };
}

export function useMarketDetails(marketId: bigint | number | undefined) {
  const { address, abi } = usePredictionMarket();
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

export function useIsResolved(marketId: bigint | number | undefined) {
  const { data: market } = useMarketDetails(marketId);

  return {
    data: market?.resolved ?? false,
    isLoading: !market,
  };
}

export function usePoolAmounts(marketId: bigint | number | undefined) {
  const { address, abi } = usePredictionMarket();

  const { data: market, isLoading } = useContractRead<MarketStruct>({
    address,
    abi,
    functionName: "getMarketInfo",
    args: marketId !== undefined ? [BigInt(marketId)] : undefined,
    enabled: marketId !== undefined && !!address,
  });

  return {
    yesPool: market?.yesPool,
    noPool: market?.noPool,
    isLoading,
  };
}

export function useUserPrediction(
  marketId: bigint | number | undefined,
  userAddress: string | undefined
) {
  const { address, abi } = usePredictionMarket();

  return useContractRead<{
    user: Address;
    side: Outcome;
    outcomeIndex: bigint;
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

export function useOdds(
  marketId: bigint | number | undefined,
  side: 0 | 1 | undefined
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

export function usePotentialWinnings(
  marketId: bigint | number | undefined,
  side: 0 | 1 | undefined,
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

export function usePredict() {
  const { address, abi } = usePredictionMarket();

  return useContractWrite({
    address,
    abi,
    functionName: "predict",
  });
}

export function useCommentAndStake() {
  const { address, abi } = usePredictionMarket();

  return useContractWrite({
    address,
    abi,
    functionName: "commentAndStake",
  });
}

export function useStakeOnOutcome() {
  const { address, abi } = usePredictionMarket();

  return useContractWrite({
    address,
    abi,
    functionName: "stakeOnOutcome",
  });
}

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

export function useClaimPayout() {
  const { address, abi } = usePredictionMarket();

  return useContractWrite({
    address,
    abi,
    functionName: "claimPayout",
  });
}

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

export function usePredictionCount(marketId: bigint | number | undefined) {
  const { address } = usePredictionMarket();
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["predictionCount", address, marketId],
    queryFn: async () => {
      if (!marketId || !address || !publicClient) return 0;

      try {
        const currentBlock = await publicClient.getBlockNumber();
        const maxBlockRange = BigInt(99000);
        const fromBlock =
          currentBlock > maxBlockRange
            ? currentBlock - maxBlockRange
            : BigInt(0);

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
          fromBlock,
        });

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
    staleTime: 30000,
    retry: 1,
  });
}

export function useMaxStakePerUser() {
  const { address, abi } = usePredictionMarket();

  return useContractRead<bigint>({
    address,
    abi,
    functionName: "MAX_STAKE_PER_USER",
    enabled: !!address,
  });
}

export function useGrantDelegation() {
  const { address, abi } = usePredictionMarket();
  return useContractWrite({
    address,
    abi,
    functionName: "grantDelegation",
  });
}

export function useRevokeDelegation() {
  const { address, abi } = usePredictionMarket();
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
  const { address, abi } = usePredictionMarket();
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
