import { useQuery } from "@tanstack/react-query";
import { graphqlQuery } from "./useGraphQL";
import { formatTokenAmount } from "@/lib/utils";
import { useChainId } from "wagmi";

export interface RecentPredictionEvent {
  id: string;
  user: string;
  marketId: string;
  marketQuestion: string;
  action: "predicted YES" | "predicted NO" | "won";
  amount?: string; // For "won" actions
  color: string;
}

interface PredictionMadeEvent {
  id: string;
  marketId: string;
  user: string;
  side: string; // "0" = Yes, "1" = No
  amount: string;
}

interface PayoutClaimedEvent {
  id: string;
  marketId: string;
  user: string;
  amount: string;
}

interface MarketData {
  id: string;
  marketId: string;
  question: string;
}

export function useRecentPredictionsGraphQL(limit: number = 10) {
  const chainId = useChainId();

  return useQuery({
    queryKey: ["recentPredictions", limit],
    queryFn: async () => {
      // Fetch recent PredictionMade events
      const predictionsQuery = `
        query GetRecentPredictions($limit: Int!) {
          Prediction(limit: $limit, order_by: {timestamp: desc}) {
            id
            marketId
            user
            side
            amount
            timestamp
          }
          Market(limit: 1000) {
            id
            marketId
            question
          }
        }
      `;

      const data = await graphqlQuery<{
        Prediction: any[];
        Market: MarketData[];
      }>(predictionsQuery, { limit });

      if (!data.Prediction) return [];

      // Create a map of marketId -> question
      const marketMap = new Map<string, string>();
      data.Market.forEach((market) => {
        marketMap.set(market.marketId, market.question);
      });

      // Combine and format events
      const events: RecentPredictionEvent[] = data.Prediction.map(
        (prediction) => {
          const question =
            marketMap.get(prediction.marketId.toString()) || "Market";
          const side =
            prediction.side === "0" ? "predicted YES" : "predicted NO";
          return {
            id: prediction.id,
            user: prediction.user,
            marketId: prediction.marketId.toString(),
            marketQuestion: question,
            action: side as "predicted YES" | "predicted NO",
            color: "text-blue-400",
          };
        }
      );

      return events;
    },
    staleTime: 2000,
    refetchInterval: 5000,
  });
}
