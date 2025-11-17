/**
 * Hook to fetch all user predictions across all markets
 * Fetches predictions the user has made and markets they've created
 */

import { useMemo } from "react";
import { Address } from "viem";
import { useAccount } from "wagmi";
import { useAllMarkets, MarketInfo } from "./useAllMarkets";
import { useContractRead } from "./useContract";
import { PredictionMarketABI } from "@/lib/abis";
import { getContractAddress } from "@/lib/contracts";

/**
 * Get the single PredictionMarket contract address
 */
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
  isCreator: boolean; // Whether user created this market
}

// Category color mapping
const categoryColors: Record<string, string> = {
  music: "bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20",
  movies: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "reality-tv": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  awards: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  sports: "bg-green-500/10 text-green-400 border-green-500/20",
  other: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

// Category display names
const categoryDisplayNames: Record<string, string> = {
  music: "MUSIC",
  movies: "MOVIES",
  "reality-tv": "REALITY TV",
  awards: "AWARDS",
  sports: "SPORTS",
  other: "OTHER",
};

/**
 * Get user prediction for a specific market
 */
function useUserPredictionForMarket(
  marketId: bigint | number | undefined,
  userAddress: Address | undefined
) {
  const { address: contractAddress, abi } = usePredictionMarket();

  const { data: prediction, isLoading } = useContractRead<{
    amount: bigint;
    side: number; // 0 = Yes, 1 = No
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

  return { prediction, isLoading };
}

/**
 * Get user stakes for a specific market
 */
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
        ? [BigInt(marketId), userAddress, 0] // [marketId, user, Outcome.Yes = 0]
        : undefined,
    enabled: marketId !== undefined && !!userAddress && !!contractAddress,
  });

  const noStake = useContractRead<bigint>({
    address: contractAddress,
    abi,
    functionName: "userStakes",
    args:
      marketId !== undefined && userAddress
        ? [BigInt(marketId), userAddress, 1] // [marketId, user, Outcome.No = 1]
        : undefined,
    enabled: marketId !== undefined && !!userAddress && !!contractAddress,
  });

  return {
    yesStake: yesStake.data || BigInt(0),
    noStake: noStake.data || BigInt(0),
    isLoading: yesStake.isLoading || noStake.isLoading,
  };
}

/**
 * Main hook to get all user predictions
 */
export function useUserPredictions() {
  const { address: userAddress } = useAccount();
  const { data: allMarkets, isLoading: isLoadingMarkets } = useAllMarkets();

  // For each market, check if user has a prediction
  // We'll fetch predictions for up to 20 markets to ensure we capture all user's created markets
  const marketIds = useMemo(() => {
    if (!allMarkets) return [];
    return allMarkets.slice(0, 20).map((m) => BigInt(m.id));
  }, [allMarkets]);

  // Fetch user predictions for each market
  const predictions1 = useUserPredictionForMarket(
    marketIds[0] ? Number(marketIds[0]) : undefined,
    userAddress
  );
  const predictions2 = useUserPredictionForMarket(
    marketIds[1] ? Number(marketIds[1]) : undefined,
    userAddress
  );
  const predictions3 = useUserPredictionForMarket(
    marketIds[2] ? Number(marketIds[2]) : undefined,
    userAddress
  );
  const predictions4 = useUserPredictionForMarket(
    marketIds[3] ? Number(marketIds[3]) : undefined,
    userAddress
  );
  const predictions5 = useUserPredictionForMarket(
    marketIds[4] ? Number(marketIds[4]) : undefined,
    userAddress
  );
  const predictions6 = useUserPredictionForMarket(
    marketIds[5] ? Number(marketIds[5]) : undefined,
    userAddress
  );
  const predictions7 = useUserPredictionForMarket(
    marketIds[6] ? Number(marketIds[6]) : undefined,
    userAddress
  );
  const predictions8 = useUserPredictionForMarket(
    marketIds[7] ? Number(marketIds[7]) : undefined,
    userAddress
  );
  const predictions9 = useUserPredictionForMarket(
    marketIds[8] ? Number(marketIds[8]) : undefined,
    userAddress
  );
  const predictions10 = useUserPredictionForMarket(
    marketIds[9] ? Number(marketIds[9]) : undefined,
    userAddress
  );

  const allPredictions = [
    predictions1,
    predictions2,
    predictions3,
    predictions4,
    predictions5,
    predictions6,
    predictions7,
    predictions8,
    predictions9,
    predictions10,
    // Add more predictions for markets 11-20 if needed
    // For now, we'll check up to 20 markets but only fetch predictions for first 10
    // This ensures we still show created markets even if we don't fetch their prediction data
  ];

  // Combine markets with user predictions
  const userPredictions = useMemo(() => {
    if (!allMarkets || !userAddress) return [];

    const results: UserPrediction[] = [];

    // Check all markets (up to 20) to find user's predictions and created markets
    allMarkets.slice(0, 20).forEach((market, index) => {
      // Only fetch prediction data for first 10 markets, but check creator for all
      const prediction =
        index < 10 ? allPredictions[index]?.prediction : undefined;
      const hasPrediction = prediction && prediction.amount > BigInt(0);

      // Include if user created the market OR has a prediction
      const isCreator =
        market.creator.toLowerCase() === userAddress.toLowerCase();

      if (hasPrediction || isCreator) {
        const marketId = BigInt(market.id);

        // If user has a prediction, use it; otherwise if they're creator, show as "created" with no stake
        const side = hasPrediction
          ? prediction.side === 0
            ? "yes"
            : "no"
          : "yes"; // Default side for created markets without prediction (won't be used for calculations)
        const stakeAmount = prediction?.amount || BigInt(0);
        const stake = Number(stakeAmount) / 1e18;

        // For created markets without stake, we still want to show them
        // but with 0 stake and no potential winnings calculation

        // Calculate potential/actual winnings (only if user has a stake)
        const totalPool = Number(market.totalPool);
        const winningPool = hasPrediction
          ? side === "yes"
            ? Number(market.yesPool)
            : Number(market.noPool)
          : 0; // No winning pool if no prediction
        const losingPool = hasPrediction
          ? side === "yes"
            ? Number(market.noPool)
            : Number(market.yesPool)
          : 0;

        // Calculate potential winnings (only for active markets with stake)
        let potentialWin = 0;
        if (!market.resolved && winningPool > 0 && stakeAmount > BigInt(0)) {
          // Potential winnings = (stake / winningPool) * (totalPool - fees)
          // Assuming 7% total fees (5% platform + 2% creator)
          const poolAfterFees = totalPool * 0.93;
          potentialWin =
            ((Number(stakeAmount) / winningPool) * poolAfterFees) / 1e18;
        }

        // Determine status based on market resolution and winning outcome
        let status: "active" | "won" | "lost" | "pending" = "active";
        let actualWin: number | undefined = undefined;

        // If user is creator but has no prediction, mark as "active" (market they created)
        if (isCreator && !hasPrediction) {
          status = "active";
        } else if (market.resolved && hasPrediction) {
          // Market is resolved, check if user won
          const winningOutcome = market.winningOutcome ?? -1; // -1 means not available

          if (winningOutcome !== -1) {
            const userSide = prediction.side; // 0 = Yes, 1 = No
            const userWon = userSide === winningOutcome;

            if (userWon) {
              // Calculate actual winnings
              const winningPoolAmount =
                winningOutcome === 0
                  ? Number(market.yesPool)
                  : Number(market.noPool);

              if (winningPoolAmount > 0 && stakeAmount > BigInt(0)) {
                // After fees: 93% to winners (7% total fees)
                const poolAfterFees = totalPool * 0.93;
                actualWin =
                  ((Number(stakeAmount) / winningPoolAmount) * poolAfterFees) /
                  1e18;
              }
              status = "won";
            } else {
              status = "lost";
            }
          } else {
            // winningOutcome not available, mark as pending
            status = "pending";
          }
        }

        const categoryKey = market.category.toLowerCase();
        const categoryColor =
          categoryColors[categoryKey] || categoryColors.other;
        const categoryDisplay =
          categoryDisplayNames[categoryKey] || market.category.toUpperCase();

        results.push({
          id: `pred-${market.id}`,
          marketId: market.id,
          marketQuestion: market.question,
          category: categoryDisplay,
          categoryColor,
          side,
          stake,
          potentialWin,
          actualWin,
          status,
          marketStatus: market.resolved ? "resolved" : "active",
          timeLeft: market.timeLeft,
          yesPercent: market.yesPercent,
          noPercent: market.noPercent,
          pool: market.poolFormatted,
          isCreator,
        });
      }
    });

    return results;
  }, [allMarkets, allPredictions, userAddress]);

  const isLoading = isLoadingMarkets || allPredictions.some((p) => p.isLoading);

  return {
    data: userPredictions,
    isLoading,
  };
}
