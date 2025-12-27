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
      // Envio doesn't support orderBy, so we fetch more and sort client-side
      const predictionsQuery = `
        query {
          PredictionMarket_PredictionMade(limit: ${limit * 3}) {
            id
            marketId
            user
            side
            amount
          }
        }
      `;

      // Fetch recent PayoutClaimed events (for "won" actions)
      const payoutsQuery = `
        query {
          PredictionMarket_PayoutClaimed(limit: ${limit * 2}) {
            id
            marketId
            user
            amount
          }
        }
      `;

      // Fetch all markets to get question text
      const marketsQuery = `
        query {
          Market(limit: 1000) {
            id
            marketId
            question
          }
        }
      `;

      const [predictionsData, payoutsData, marketsData] = await Promise.all([
        graphqlQuery<{ PredictionMarket_PredictionMade: PredictionMadeEvent[] }>(
          predictionsQuery
        ),
        graphqlQuery<{ PredictionMarket_PayoutClaimed: PayoutClaimedEvent[] }>(
          payoutsQuery
        ),
        graphqlQuery<{ Market: MarketData[] }>(marketsQuery),
      ]);

      // Create a map of marketId -> question
      const marketMap = new Map<string, string>();
      marketsData.Market.forEach((market) => {
        marketMap.set(market.marketId, market.question);
      });

      // Combine and format events
      const events: RecentPredictionEvent[] = [];

      // Add payout claimed events (wins) - these are more interesting
      payoutsData.PredictionMarket_PayoutClaimed.forEach((payout) => {
        const question = marketMap.get(payout.marketId) || "Market";
        const amount = formatTokenAmount(BigInt(payout.amount), chainId);
        events.push({
          id: payout.id,
          user: payout.user,
          marketId: payout.marketId,
          marketQuestion: question,
          action: "won",
          amount: `$${amount}`,
          color: "text-emerald-400",
        });
      });

      // Add prediction made events
      predictionsData.PredictionMarket_PredictionMade.forEach((prediction) => {
        // Skip if we already have a payout event for this user+market (to avoid duplicates)
        const hasPayout = events.some(
          (e) => e.user === prediction.user && e.marketId === prediction.marketId
        );
        if (hasPayout) return;

        const question = marketMap.get(prediction.marketId) || "Market";
        const side = prediction.side === "0" ? "predicted YES" : "predicted NO";
        events.push({
          id: prediction.id,
          user: prediction.user,
          marketId: prediction.marketId,
          marketQuestion: question,
          action: side as "predicted YES" | "predicted NO",
          color: "text-blue-400",
        });
      });

      // Sort by ID (which includes timestamp) descending and take top limit
      return events
        .sort((a, b) => {
          // ID format is typically "blockNumber-transactionIndex-logIndex"
          // Extract block number for sorting
          const blockA = parseInt(a.id.split("-")[0] || "0");
          const blockB = parseInt(b.id.split("-")[0] || "0");
          return blockB - blockA; // Descending order
        })
        .slice(0, limit);
    },
    staleTime: 10000, // 10 seconds
    refetchInterval: 15000, // Refetch every 15 seconds for live updates
  });
}

