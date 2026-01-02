import { useMemo } from "react";
import { Address } from "viem";
import { useAccount, useChainId } from "wagmi";
import { formatTokenAmount } from "@/lib/utils";
import { useContractRead } from "./useContract";
import { PredictionMarketABI } from "@/lib/abis";
import { getContractAddress } from "@/lib/contracts";
import { MarketType } from "@/lib/types";
import { useMarketDetails } from "./usePredictionMarket";
import { useAllMarketIds } from "./useMarketFactory";

function usePredictionMarket() {
  const predictionMarketAddress = getContractAddress(
    "predictionMarket"
  ) as Address;
  return {
    address: predictionMarketAddress,
    abi: PredictionMarketABI,
  };
}

export interface UserPrediction {
  id: string;
  marketId: string;
  marketQuestion: string;
  category: string;
  categoryColor: string;
  side: "yes" | "no";
  outcomeIndex?: number;
  outcomeLabel?: string;
  stake: number;
  potentialWin: number;
  actualWin?: number;
  status: "active" | "won" | "lost" | "pending";
  marketStatus: "active" | "resolved";
  timeLeft?: string;
  resolvedAt?: string;
  yesPercent: number;
  noPercent: number;
  pool: string;
  isCreator: boolean;
  marketType?: MarketType;
}

const categoryColors: Record<string, string> = {
  music: "bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20",
  movies: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "reality-tv": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  awards: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  sports: "bg-green-500/10 text-green-400 border-green-500/20",
  other: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const categoryDisplayNames: Record<string, string> = {
  music: "MUSIC",
  movies: "MOVIES",
  "reality-tv": "REALITY TV",
  awards: "AWARDS",
  sports: "SPORTS",
  other: "OTHER",
};

function useUserPredictionForMarket(
  marketId: bigint | number | undefined,
  userAddress: Address | undefined
) {
  const { address: contractAddress, abi } = usePredictionMarket();

  const { data: prediction, isLoading } = useContractRead<{
    user: Address;
    side: number;
    outcomeIndex: bigint;
    amount: bigint;
    timestamp: bigint;
  }>({
    address: contractAddress,
    abi,
    functionName: "getUserPrediction",
    args:
      marketId !== undefined && userAddress
        ? [BigInt(marketId), userAddress]
        : undefined,
    enabled: marketId !== undefined && !!userAddress && !!contractAddress,
  });

  return { prediction, isLoading, isInitialLoading: isLoading && !prediction };
}

function useUserStakesForMarket(
  marketId: bigint | number | undefined,
  userAddress: Address | undefined
) {
  const { address: contractAddress, abi } = usePredictionMarket();

  const yesStake = useContractRead<bigint>({
    address: contractAddress,
    abi,
    functionName: "userStakes",
    args:
      marketId !== undefined && userAddress
        ? [BigInt(marketId), userAddress, 0]
        : undefined,
    enabled: marketId !== undefined && !!userAddress && !!contractAddress,
  });

  const noStake = useContractRead<bigint>({
    address: contractAddress,
    abi,
    functionName: "userStakes",
    args:
      marketId !== undefined && userAddress
        ? [BigInt(marketId), userAddress, 1]
        : undefined,
    enabled: marketId !== undefined && !!userAddress && !!contractAddress,
  });

  return {
    yesStake: yesStake.data || BigInt(0),
    noStake: noStake.data || BigInt(0),
    isLoading: yesStake.isLoading || noStake.isLoading,
  };
}

export function useUserPredictions() {
  const { address: userAddress } = useAccount();
  const chainId = useChainId();

  const { data: allMarketIds, isLoading: isLoadingMarketIds } =
    useAllMarketIds();

  const marketIds = useMemo(() => {
    if (!allMarketIds) return [];
    const idsArray = Array.from(allMarketIds);
    return idsArray
      .reverse()
      .slice(0, 50)
      .map((id) => Number(id));
  }, [allMarketIds]);

  const predictions = [
    useUserPredictionForMarket(marketIds[0], userAddress),
    useUserPredictionForMarket(marketIds[1], userAddress),
    useUserPredictionForMarket(marketIds[2], userAddress),
    useUserPredictionForMarket(marketIds[3], userAddress),
    useUserPredictionForMarket(marketIds[4], userAddress),
    useUserPredictionForMarket(marketIds[5], userAddress),
    useUserPredictionForMarket(marketIds[6], userAddress),
    useUserPredictionForMarket(marketIds[7], userAddress),
    useUserPredictionForMarket(marketIds[8], userAddress),
    useUserPredictionForMarket(marketIds[9], userAddress),
    useUserPredictionForMarket(marketIds[10], userAddress),
    useUserPredictionForMarket(marketIds[11], userAddress),
    useUserPredictionForMarket(marketIds[12], userAddress),
    useUserPredictionForMarket(marketIds[13], userAddress),
    useUserPredictionForMarket(marketIds[14], userAddress),
    useUserPredictionForMarket(marketIds[15], userAddress),
    useUserPredictionForMarket(marketIds[16], userAddress),
    useUserPredictionForMarket(marketIds[17], userAddress),
    useUserPredictionForMarket(marketIds[18], userAddress),
    useUserPredictionForMarket(marketIds[19], userAddress),
    useUserPredictionForMarket(marketIds[20], userAddress),
    useUserPredictionForMarket(marketIds[21], userAddress),
    useUserPredictionForMarket(marketIds[22], userAddress),
    useUserPredictionForMarket(marketIds[23], userAddress),
    useUserPredictionForMarket(marketIds[24], userAddress),
    useUserPredictionForMarket(marketIds[25], userAddress),
    useUserPredictionForMarket(marketIds[26], userAddress),
    useUserPredictionForMarket(marketIds[27], userAddress),
    useUserPredictionForMarket(marketIds[28], userAddress),
    useUserPredictionForMarket(marketIds[29], userAddress),
    useUserPredictionForMarket(marketIds[30], userAddress),
    useUserPredictionForMarket(marketIds[31], userAddress),
    useUserPredictionForMarket(marketIds[32], userAddress),
    useUserPredictionForMarket(marketIds[33], userAddress),
    useUserPredictionForMarket(marketIds[34], userAddress),
    useUserPredictionForMarket(marketIds[35], userAddress),
    useUserPredictionForMarket(marketIds[36], userAddress),
    useUserPredictionForMarket(marketIds[37], userAddress),
    useUserPredictionForMarket(marketIds[38], userAddress),
    useUserPredictionForMarket(marketIds[39], userAddress),
    useUserPredictionForMarket(marketIds[40], userAddress),
    useUserPredictionForMarket(marketIds[41], userAddress),
    useUserPredictionForMarket(marketIds[42], userAddress),
    useUserPredictionForMarket(marketIds[43], userAddress),
    useUserPredictionForMarket(marketIds[44], userAddress),
    useUserPredictionForMarket(marketIds[45], userAddress),
    useUserPredictionForMarket(marketIds[46], userAddress),
    useUserPredictionForMarket(marketIds[47], userAddress),
    useUserPredictionForMarket(marketIds[48], userAddress),
    useUserPredictionForMarket(marketIds[49], userAddress),
  ];

  const allPredictions = predictions;

  const marketDetails = [
    useMarketDetails(marketIds[0]),
    useMarketDetails(marketIds[1]),
    useMarketDetails(marketIds[2]),
    useMarketDetails(marketIds[3]),
    useMarketDetails(marketIds[4]),
    useMarketDetails(marketIds[5]),
    useMarketDetails(marketIds[6]),
    useMarketDetails(marketIds[7]),
    useMarketDetails(marketIds[8]),
    useMarketDetails(marketIds[9]),
    useMarketDetails(marketIds[10]),
    useMarketDetails(marketIds[11]),
    useMarketDetails(marketIds[12]),
    useMarketDetails(marketIds[13]),
    useMarketDetails(marketIds[14]),
    useMarketDetails(marketIds[15]),
    useMarketDetails(marketIds[16]),
    useMarketDetails(marketIds[17]),
    useMarketDetails(marketIds[18]),
    useMarketDetails(marketIds[19]),
    useMarketDetails(marketIds[20]),
    useMarketDetails(marketIds[21]),
    useMarketDetails(marketIds[22]),
    useMarketDetails(marketIds[23]),
    useMarketDetails(marketIds[24]),
    useMarketDetails(marketIds[25]),
    useMarketDetails(marketIds[26]),
    useMarketDetails(marketIds[27]),
    useMarketDetails(marketIds[28]),
    useMarketDetails(marketIds[29]),
    useMarketDetails(marketIds[30]),
    useMarketDetails(marketIds[31]),
    useMarketDetails(marketIds[32]),
    useMarketDetails(marketIds[33]),
    useMarketDetails(marketIds[34]),
    useMarketDetails(marketIds[35]),
    useMarketDetails(marketIds[36]),
    useMarketDetails(marketIds[37]),
    useMarketDetails(marketIds[38]),
    useMarketDetails(marketIds[39]),
    useMarketDetails(marketIds[40]),
    useMarketDetails(marketIds[41]),
    useMarketDetails(marketIds[42]),
    useMarketDetails(marketIds[43]),
    useMarketDetails(marketIds[44]),
    useMarketDetails(marketIds[45]),
    useMarketDetails(marketIds[46]),
    useMarketDetails(marketIds[47]),
    useMarketDetails(marketIds[48]),
    useMarketDetails(marketIds[49]),
  ];

  const marketDataArray = useMemo(
    () => marketDetails.map((m) => m.data),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [marketDetails.length, ...marketDetails.map((m) => m.data)]
  );

  const userPredictions = useMemo(() => {
    if (!marketIds || !userAddress || marketIds.length === 0) return [];

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const results: UserPrediction[] = [];

    marketIds.forEach((marketId, index) => {
      const prediction = allPredictions[index]?.prediction;
      const market = marketDetails[index]?.data;

      if (!market) return;

      const hasPrediction = prediction && prediction.amount > BigInt(0);
      const isCreator =
        market.creator.toLowerCase() === userAddress.toLowerCase();

      if (hasPrediction || isCreator) {
        const side = hasPrediction
          ? prediction.side === 0
            ? "yes"
            : "no"
          : "yes";
        const stakeAmount = prediction?.amount || BigInt(0);
        const stake = Number(formatTokenAmount(stakeAmount, chainId));

        const totalPoolNum = Number(market.totalPool);
        const yesPoolNum = Number(market.yesPool);
        const noPoolNum = Number(market.noPool);
        const marketType = market.marketType ?? MarketType.Binary;

        let yesPercent = 50;
        let noPercent = 50;
        if (marketType === MarketType.Binary && totalPoolNum > 0) {
          yesPercent =
            Number(
              (BigInt(Math.floor(yesPoolNum)) * BigInt(10000)) /
                BigInt(Math.floor(totalPoolNum))
            ) / 100;
          noPercent =
            Number(
              (BigInt(Math.floor(noPoolNum)) * BigInt(10000)) /
                BigInt(Math.floor(totalPoolNum))
            ) / 100;
        }

        const endTime = Number(market.endTime);
        const secondsLeft = endTime - currentTimestamp;

        let timeLeft = "Ended";
        if (secondsLeft > 0) {
          const days = Math.floor(secondsLeft / 86400);
          const hours = Math.floor((secondsLeft % 86400) / 3600);
          if (days > 0) {
            timeLeft = `${days}d left`;
          } else if (hours > 0) {
            timeLeft = `${hours}h left`;
          } else {
            timeLeft = `${Math.floor(secondsLeft / 60)}m left`;
          }
        }

        const poolFormatted =
          totalPoolNum > 0
            ? `$${Number(
                formatTokenAmount(BigInt(totalPoolNum), chainId)
              ).toFixed(2)}`
            : "$0.00";

        const winningPool = hasPrediction
          ? side === "yes"
            ? yesPoolNum
            : noPoolNum
          : 0;

        let potentialWin = 0;
        if (!market.resolved && winningPool > 0 && stakeAmount > BigInt(0)) {
          const poolAfterFees = totalPoolNum * 0.93;
          const potentialWinBigInt = BigInt(
            Math.floor((Number(stakeAmount) / winningPool) * poolAfterFees)
          );
          potentialWin = Number(formatTokenAmount(potentialWinBigInt, chainId));
        }

        let status: "active" | "won" | "lost" | "pending" = "active";
        let actualWin: number | undefined = undefined;

        if (isCreator && !hasPrediction) {
          status = "active";
        } else if (market.resolved && hasPrediction) {
          const winningOutcome = market.winningOutcome;
          const hasWinningOutcome =
            winningOutcome !== undefined && winningOutcome !== null;

          if (hasWinningOutcome) {
            const userSide = prediction.side;
            const userWon = userSide === winningOutcome;

            if (userWon) {
              const winningPoolAmount =
                winningOutcome === 0 ? yesPoolNum : noPoolNum;

              if (winningPoolAmount > 0 && stakeAmount > BigInt(0)) {
                const poolAfterFees = totalPoolNum * 0.93;
                const actualWinBigInt = BigInt(
                  Math.floor(
                    (Number(stakeAmount) / winningPoolAmount) * poolAfterFees
                  )
                );
                actualWin = Number(formatTokenAmount(actualWinBigInt, chainId));
              }
              status = "won";
            } else {
              status = "lost";
            }
          } else {
            status = "pending";
          }
        }

        const categoryKey = market.category.toLowerCase();
        const categoryColor =
          categoryColors[categoryKey] || categoryColors.other;
        const categoryDisplay =
          categoryDisplayNames[categoryKey] || market.category.toUpperCase();

        const outcomeIndex =
          prediction?.outcomeIndex !== undefined
            ? Number(prediction.outcomeIndex)
            : undefined;

        results.push({
          id: `pred-${marketId}`,
          marketId: marketId.toString(),
          marketQuestion: market.question || "",
          category: categoryDisplay,
          categoryColor,
          side,
          outcomeIndex,
          stake,
          potentialWin,
          actualWin,
          status,
          marketStatus: market.resolved ? "resolved" : "active",
          timeLeft,
          yesPercent,
          noPercent,
          pool: poolFormatted,
          isCreator,
          marketType: marketType,
        });
      }
    });

    return results;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketIds, allPredictions, marketDataArray, userAddress, marketDetails]);

  const isLoading =
    isLoadingMarketIds ||
    allPredictions.some((p) => p?.isLoading) ||
    marketDetails.some((m) => m?.isLoading);

  const isInitialLoading =
    isLoadingMarketIds ||
    allPredictions.some((p) => p?.isInitialLoading) ||
    marketDetails.some((m) => m?.isLoading);

  return {
    data: userPredictions,
    isLoading,
    isInitialLoading,
  };
}
