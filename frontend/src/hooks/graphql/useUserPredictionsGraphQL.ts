import { useQuery } from "@tanstack/react-query";
import { useAccount, useChainId } from "wagmi";
import { graphqlQuery } from "./useGraphQL";
import { formatTokenAmount } from "@/lib/utils";

export interface PredictionEventGraphQL {
  id: string;
  marketId: string;
  user: string;
  amount: string;
  side: string;
  outcomeIndex: string;
}

export interface MarketGraphQL {
  id: string;
  marketId: string;
  question: string;
  category: string;
  creator: string;
  totalPool: string;
  yesPool: string;
  noPool: string;
  endTime: string;
  status: string;
  resolved: boolean;
  winningOutcome: string | null;
  winningOutcomeIndex: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface UserPredictionGraphQL {
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
  marketType?: number; // 0 = Binary, 1 = CrowdWisdom
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

export function useUserPredictionsGraphQL() {
  const { address } = useAccount();
  const chainId = useChainId();

  return useQuery({
    queryKey: ["userPredictionsGraphQL", address],
    queryFn: async (): Promise<UserPredictionGraphQL[]> => {
      if (!address) return [];

      // Fetch user's predictions and market details in one go (if possible, but Envio schema might be flat)
      // For Envio, we usually have separate tables. Let's use a join-like query if Hasura supports it,
      // or just fetch what we need.
      const query = `
        query GetUserPredictions($user: String!) {
          Prediction(where: {user: {_eq: $user}}, order_by: {timestamp: desc}) {
            id
            marketId
            amount
            side
            timestamp
          }
          Market(limit: 1000) {
            id
            marketId
            question
            category
            creator
            totalPool
            yesPool
            noPool
            endTime
            status
            resolved
            winningOutcome
            winningOutcomeIndex
            createdAt
            resolvedAt
          }
        }
      `;

      const data = await graphqlQuery<{
        Prediction: any[];
        Market: MarketGraphQL[];
      }>(query, { user: address.toLowerCase() });

      if (!data.Prediction) return [];

      // Create a map of marketId -> market
      const marketMap = new Map(data.Market.map((m) => [m.marketId, m]));

      // Transform predictions
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const results: UserPredictionGraphQL[] = [];

      data.Prediction.forEach((prediction) => {
        const market = marketMap.get(prediction.marketId.toString());
        if (!market) return;

        const isCreator =
          market.creator.toLowerCase() === address.toLowerCase();
        const stakeAmount = BigInt(prediction.amount);
        const stake = Number(formatTokenAmount(stakeAmount, chainId));
        const side = prediction.side === "0" ? "yes" : "no";

        const totalPoolNum = Number(BigInt(market.totalPool));
        const yesPoolNum = Number(BigInt(market.yesPool));
        const noPoolNum = Number(BigInt(market.noPool));

        // Calculate percentages
        let yesPercent = 50;
        let noPercent = 50;
        if (totalPoolNum > 0) {
          yesPercent = Math.round((yesPoolNum / totalPoolNum) * 100);
          noPercent = Math.round((noPoolNum / totalPoolNum) * 100);
        }

        // Calculate time left
        const endTime = Number(BigInt(market.endTime));
        const secondsLeft = endTime - currentTimestamp;
        let timeLeft = "Ended";
        if (secondsLeft > 0) {
          const days = Math.floor(secondsLeft / 86400);
          const hours = Math.floor((secondsLeft % 86400) / 3600);
          timeLeft =
            days > 0
              ? `${days}d left`
              : hours > 0
              ? `${hours}h left`
              : `${Math.floor(secondsLeft / 60)}m left`;
        }

        // Format pool
        const poolFormatted =
          totalPoolNum > 0
            ? `$${Number(
                formatTokenAmount(BigInt(market.totalPool), chainId)
              ).toFixed(2)}`
            : "$0.00";

        // Calculate potential winnings
        const winningPool = side === "yes" ? yesPoolNum : noPoolNum;
        let potentialWin = 0;
        if (!market.resolved && winningPool > 0 && stakeAmount > BigInt(0)) {
          const poolAfterFees = totalPoolNum * 0.93;
          potentialWin = (Number(stakeAmount) / winningPool) * poolAfterFees;
          potentialWin = Number(
            formatTokenAmount(BigInt(Math.floor(potentialWin)), chainId)
          );
        }

        // Determine status
        let status: "active" | "won" | "lost" | "pending" = "active";
        let actualWin: number | undefined = undefined;

        if (market.resolved) {
          const winningOutcome = market.winningOutcome;
          if (winningOutcome !== null) {
            const userSide = Number(prediction.side);
            const userWon = userSide === Number(winningOutcome);

            if (userWon) {
              const winningPoolAmount =
                Number(winningOutcome) === 0 ? yesPoolNum : noPoolNum;
              if (winningPoolAmount > 0 && stakeAmount > BigInt(0)) {
                const poolAfterFees = totalPoolNum * 0.93;
                actualWin =
                  (Number(stakeAmount) / winningPoolAmount) * poolAfterFees;
                actualWin = Number(
                  formatTokenAmount(BigInt(Math.floor(actualWin)), chainId)
                );
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

        results.push({
          id: `pred-${prediction.marketId}-${prediction.timestamp}`,
          marketId: prediction.marketId.toString(),
          marketQuestion: market.question,
          category: categoryDisplay,
          categoryColor,
          side,
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
        });
      });

      return results;
    },
    enabled: !!address,
    staleTime: 15000,
    refetchInterval: 30000,
  });
}
