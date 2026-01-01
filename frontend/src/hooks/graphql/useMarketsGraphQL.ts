import { useQuery } from "@tanstack/react-query";
import { useChainId } from "wagmi";
import { graphqlQuery } from "./useGraphQL";
import type { MarketInfo } from "@/hooks/contracts/useAllMarkets";
import { Address } from "viem";
import { formatTokenAmount } from "@/lib/utils";
import { MarketType, MarketStatus } from "@/lib/types";

interface MarketGraphQL {
  id: string;
  marketId: string;
  creator: string;
  question: string;
  category: string;
  marketType: string;
  endTime: string;
  status: string;
  resolved: boolean;
  winningOutcome?: string;
  winningOutcomeIndex?: string;
  yesPool: string;
  noPool: string;
  totalPool: string;
  createdAt: string;
  resolvedAt?: string;
  predictionCount: string;
}

export function useMarketsGraphQL(limit: number = 50) {
  const chainId = useChainId();

  return useQuery({
    queryKey: ["marketsGraphQL", limit, chainId],
    queryFn: async (): Promise<MarketInfo[]> => {
      const query = `
        query {
          Market(limit: ${limit}, order_by: {createdAt: desc}) {
            id
            marketId
            creator
            question
            category
            marketType
            endTime
            status
            resolved
            winningOutcome
            winningOutcomeIndex
            yesPool
            noPool
            totalPool
            createdAt
            resolvedAt
            predictionCount
          }
        }
      `;

      const data = await graphqlQuery<{ Market: MarketGraphQL[] }>(query);

      if (!data.Market) {
        return [];
      }

      return data.Market.map((market): MarketInfo => {
        const endTime = BigInt(market.endTime);
        const yesPool = BigInt(market.yesPool || "0");
        const noPool = BigInt(market.noPool || "0");
        const totalPool = yesPool + noPool;
        const now = BigInt(Math.floor(Date.now() / 1000));
        const timeLeft = endTime > now ? endTime - now : BigInt(0);

        // Calculate percentages
        const yesPercent =
          totalPool > 0
            ? Number((yesPool * BigInt(10000)) / totalPool) / 100
            : 50;
        const noPercent = 100 - yesPercent;

        const hours = Number(timeLeft) / 3600;
        const days = Math.floor(hours / 24);
        const hoursLeft = Math.floor(hours % 24);
        const timeLeftFormatted =
          days > 0
            ? `${days}d ${hoursLeft}h`
            : hours > 1
            ? `${Math.floor(hours)}h`
            : `${Math.floor(Number(timeLeft) / 60)}m`;
        let status: MarketStatus = MarketStatus.Active;
        if (market.resolved) {
          status = MarketStatus.Resolved;
        } else if (timeLeft === BigInt(0)) {
          status = MarketStatus.Cancelled; // Use Cancelled for expired markets
        }

        return {
          id: market.marketId,
          address: undefined,
          marketType: Number(market.marketType) as MarketType,
          question: market.question,
          category: market.category,
          creator: market.creator as Address,
          yesPool,
          noPool,
          totalPool,
          endTime,
          status,
          resolved: market.resolved,
          winningOutcome: market.winningOutcome
            ? (Number(market.winningOutcome) as 0 | 1)
            : undefined,
          winningOutcomeIndex: market.winningOutcomeIndex
            ? BigInt(market.winningOutcomeIndex)
            : undefined,
          yesPercent,
          noPercent,
          timeLeft: timeLeftFormatted,
          poolFormatted: formatTokenAmount(totalPool),
          predictionCount: Number(market.predictionCount || "0"),
          isLoading: false,
        };
      });
    },
    enabled: true,
    staleTime: 2000,
    refetchInterval: 5000,
  });
}
