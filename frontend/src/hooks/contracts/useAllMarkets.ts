/**
 * Hook to fetch all markets with their details
 * Simplified version that works with React hooks rules
 */

import { useMemo } from "react";
import { Address } from "viem";
import { useAllMarketIds } from "./useMarketFactory";
import {
  useMarketDetails,
  usePredictionMarket,
  usePredictionCount,
} from "./usePredictionMarket";
import { MarketType, MarketStatus, Outcome, MarketStruct } from "@/lib/types";

export interface MarketInfo {
  id: string;
  address: Address | undefined;
  marketType: MarketType; // Binary (0) or CrowdWisdom (1)
  question: string;
  category: string;
  creator: Address;
  yesPool: bigint; // For Binary markets
  noPool: bigint; // For Binary markets
  totalPool: bigint;
  endTime: bigint;
  status: MarketStatus;
  resolved: boolean;
  winningOutcome?: Outcome; // For Binary markets: 0 = Yes, 1 = No (only present if resolved)
  winningOutcomeIndex?: bigint; // For CrowdWisdom markets: outcome index (only present if resolved)
  outcomeCount?: bigint; // For CrowdWisdom markets: number of outcomes
  yesPercent: number; // For Binary markets
  noPercent: number; // For Binary markets
  timeLeft: string;
  poolFormatted: string;
  predictionCount: number; // Number of unique participants
  isLoading: boolean;
}

/**
 * Helper function to format market data
 */
function formatMarketData(
  marketId: bigint,
  address: Address | undefined,
  marketDetails: MarketStruct | undefined,
  isLoading: boolean
): MarketInfo | null {
  if (!address || !marketDetails) {
    return {
      id: marketId.toString(),
      address: undefined,
      marketType: MarketType.Binary,
      question: "",
      category: "",
      creator: "0x" as Address,
      yesPool: BigInt(0),
      noPool: BigInt(0),
      totalPool: BigInt(0),
      endTime: BigInt(0),
      status: MarketStatus.Active,
      resolved: false,
      yesPercent: 50,
      noPercent: 50,
      timeLeft: "Loading...",
      poolFormatted: "$0.00",
      predictionCount: 0,
      isLoading,
    };
  }

  const totalPool = marketDetails.totalPool || BigInt(0);
  const yesPool = marketDetails.yesPool || BigInt(0);
  const noPool = marketDetails.noPool || BigInt(0);
  const marketType = marketDetails.marketType ?? MarketType.Binary;

  // Calculate percentages (only for Binary markets)
  let yesPercent = 50;
  let noPercent = 50;
  if (marketType === MarketType.Binary && totalPool > BigInt(0)) {
    yesPercent = Number((yesPool * BigInt(10000)) / totalPool) / 100;
    noPercent = Number((noPool * BigInt(10000)) / totalPool) / 100;
  }

  // Calculate time left
  const endTime = Number(marketDetails.endTime);
  const now = Math.floor(Date.now() / 1000);
  const secondsLeft = endTime - now;

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

  // Format pool amount
  const poolFormatted =
    totalPool > BigInt(0)
      ? `$${(Number(totalPool) / 1e18).toFixed(2)}`
      : "$0.00";

  return {
    id: marketId.toString(),
    address,
    marketType,
    question: marketDetails.question || "",
    category: marketDetails.category || "",
    creator: (marketDetails.creator || "0x") as Address,
    yesPool,
    noPool,
    totalPool,
    endTime: BigInt(endTime),
    status: marketDetails.status ?? MarketStatus.Active,
    resolved: marketDetails.resolved || false,
    winningOutcome: marketDetails.winningOutcome,
    winningOutcomeIndex: marketDetails.winningOutcomeIndex,
    outcomeCount: marketDetails.outcomeCount,
    yesPercent,
    noPercent,
    timeLeft,
    poolFormatted,
    predictionCount: 0, // Will be set in useAllMarkets hook
    isLoading: false,
  };
}

/**
 * Hook to fetch all markets with their details
 * Fetches up to 10 markets for now (can be extended)
 */
export function useAllMarkets() {
  const {
    data: marketIds,
    isLoading: isLoadingIds,
    isError: isErrorIds,
    error: marketIdsError,
  } = useAllMarketIds();

  // Log error details for debugging
  if (isErrorIds && marketIdsError) {
    console.error("Error in useAllMarketIds:", marketIdsError);
  }

  // Limit to first 50 markets (newest first) - increased to show more markets
  // Note: marketIds might be generated from count, so they're sequential (1, 2, 3...)
  const limitedIds = useMemo(() => {
    if (!marketIds || marketIds.length === 0) return [];
    // Convert to array and reverse to show newest first, then limit to 50
    const idsArray = Array.from(marketIds);
    // Reverse to show newest first (highest ID = newest)
    return idsArray.reverse().slice(0, 50);
  }, [marketIds]);

  // In refactored architecture, all markets are in one contract
  // We get the contract address once and use marketIds directly
  const { address: predictionMarketAddress } = usePredictionMarket();

  // Fetch details for each market using marketId directly
  const details1 = useMarketDetails(
    limitedIds[0] ? Number(limitedIds[0]) : undefined
  );
  const details2 = useMarketDetails(
    limitedIds[1] ? Number(limitedIds[1]) : undefined
  );
  const details3 = useMarketDetails(
    limitedIds[2] ? Number(limitedIds[2]) : undefined
  );
  const details4 = useMarketDetails(
    limitedIds[3] ? Number(limitedIds[3]) : undefined
  );
  const details5 = useMarketDetails(
    limitedIds[4] ? Number(limitedIds[4]) : undefined
  );
  const details6 = useMarketDetails(
    limitedIds[5] ? Number(limitedIds[5]) : undefined
  );
  const details7 = useMarketDetails(
    limitedIds[6] ? Number(limitedIds[6]) : undefined
  );
  const details8 = useMarketDetails(
    limitedIds[7] ? Number(limitedIds[7]) : undefined
  );
  const details9 = useMarketDetails(
    limitedIds[8] ? Number(limitedIds[8]) : undefined
  );
  const details10 = useMarketDetails(
    limitedIds[9] ? Number(limitedIds[9]) : undefined
  );

  // Fetch prediction counts for each market
  const predictionCount1 = usePredictionCount(
    limitedIds[0] ? Number(limitedIds[0]) : undefined
  );
  const predictionCount2 = usePredictionCount(
    limitedIds[1] ? Number(limitedIds[1]) : undefined
  );
  const predictionCount3 = usePredictionCount(
    limitedIds[2] ? Number(limitedIds[2]) : undefined
  );
  const predictionCount4 = usePredictionCount(
    limitedIds[3] ? Number(limitedIds[3]) : undefined
  );
  const predictionCount5 = usePredictionCount(
    limitedIds[4] ? Number(limitedIds[4]) : undefined
  );
  const predictionCount6 = usePredictionCount(
    limitedIds[5] ? Number(limitedIds[5]) : undefined
  );
  const predictionCount7 = usePredictionCount(
    limitedIds[6] ? Number(limitedIds[6]) : undefined
  );
  const predictionCount8 = usePredictionCount(
    limitedIds[7] ? Number(limitedIds[7]) : undefined
  );
  const predictionCount9 = usePredictionCount(
    limitedIds[8] ? Number(limitedIds[8]) : undefined
  );
  const predictionCount10 = usePredictionCount(
    limitedIds[9] ? Number(limitedIds[9]) : undefined
  );

  const markets = useMemo(() => {
    // All markets use the same contract address in refactored architecture
    const marketAddress = predictionMarketAddress as Address | undefined;

    const results = [
      {
        ...formatMarketData(
          limitedIds[0] || BigInt(0),
          marketAddress,
          details1.data,
          details1.isLoading
        ),
        predictionCount: predictionCount1.data ?? 0,
      },
      {
        ...formatMarketData(
          limitedIds[1] || BigInt(0),
          marketAddress,
          details2.data,
          details2.isLoading
        ),
        predictionCount: predictionCount2.data ?? 0,
      },
      {
        ...formatMarketData(
          limitedIds[2] || BigInt(0),
          marketAddress,
          details3.data,
          details3.isLoading
        ),
        predictionCount: predictionCount3.data ?? 0,
      },
      {
        ...formatMarketData(
          limitedIds[3] || BigInt(0),
          marketAddress,
          details4.data,
          details4.isLoading
        ),
        predictionCount: predictionCount4.data ?? 0,
      },
      {
        ...formatMarketData(
          limitedIds[4] || BigInt(0),
          marketAddress,
          details5.data,
          details5.isLoading
        ),
        predictionCount: predictionCount5.data ?? 0,
      },
      {
        ...formatMarketData(
          limitedIds[5] || BigInt(0),
          marketAddress,
          details6.data,
          details6.isLoading
        ),
        predictionCount: predictionCount6.data ?? 0,
      },
      {
        ...formatMarketData(
          limitedIds[6] || BigInt(0),
          marketAddress,
          details7.data,
          details7.isLoading
        ),
        predictionCount: predictionCount7.data ?? 0,
      },
      {
        ...formatMarketData(
          limitedIds[7] || BigInt(0),
          marketAddress,
          details8.data,
          details8.isLoading
        ),
        predictionCount: predictionCount8.data ?? 0,
      },
      {
        ...formatMarketData(
          limitedIds[8] || BigInt(0),
          marketAddress,
          details9.data,
          details9.isLoading
        ),
        predictionCount: predictionCount9.data ?? 0,
      },
      {
        ...formatMarketData(
          limitedIds[9] || BigInt(0),
          marketAddress,
          details10.data,
          details10.isLoading
        ),
        predictionCount: predictionCount10.data ?? 0,
      },
    ];

    return results.filter(
      (m): m is MarketInfo =>
        m !== null && m.address !== undefined && m.question !== ""
    );
  }, [
    limitedIds,
    predictionMarketAddress,
    details1,
    details2,
    details3,
    details4,
    details5,
    details6,
    details7,
    details8,
    details9,
    details10,
    predictionCount1.data,
    predictionCount2.data,
    predictionCount3.data,
    predictionCount4.data,
    predictionCount5.data,
    predictionCount6.data,
    predictionCount7.data,
    predictionCount8.data,
    predictionCount9.data,
    predictionCount10.data,
  ]);

  const isLoading = isLoadingIds || markets.some((m) => m.isLoading);

  // If no markets exist yet (empty array), don't treat it as an error
  // Only treat as error if there's an actual error AND we have data (meaning it failed after loading)
  const hasError = isErrorIds && marketIdsError !== null;

  return {
    data: markets,
    isLoading,
    isError: hasError,
  };
}
