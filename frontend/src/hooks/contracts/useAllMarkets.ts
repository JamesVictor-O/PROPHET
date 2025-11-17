/**
 * Hook to fetch all markets with their details
 * Simplified version that works with React hooks rules
 */

import { useMemo } from "react";
import { Address } from "viem";
import { useAllMarketIds, useMarketAddress } from "./useMarketFactory";
import { useMarketDetails } from "./usePredictionMarket";

export interface MarketInfo {
  id: string;
  address: Address | undefined;
  question: string;
  category: string;
  creator: Address;
  yesPool: bigint;
  noPool: bigint;
  totalPool: bigint;
  endTime: bigint;
  status: number;
  resolved: boolean;
  yesPercent: number;
  noPercent: number;
  timeLeft: string;
  poolFormatted: string;
  isLoading: boolean;
}

/**
 * Helper function to format market data
 */
function formatMarketData(
  marketId: bigint,
  address: Address | undefined,
  marketDetails:
    | {
        totalPool?: bigint;
        yesPool?: bigint;
        noPool?: bigint;
        endTime?: bigint;
        question?: string;
        category?: string;
        creator?: Address;
        status?: number;
        resolved?: boolean;
      }
    | undefined,
  isLoading: boolean
): MarketInfo | null {
  if (!address || !marketDetails) {
    return {
      id: marketId.toString(),
      address: undefined,
      question: "",
      category: "",
      creator: "0x" as Address,
      yesPool: BigInt(0),
      noPool: BigInt(0),
      totalPool: BigInt(0),
      endTime: BigInt(0),
      status: 0,
      resolved: false,
      yesPercent: 50,
      noPercent: 50,
      timeLeft: "Loading...",
      poolFormatted: "$0.00",
      isLoading,
    };
  }

  const totalPool = marketDetails.totalPool || BigInt(0);
  const yesPool = marketDetails.yesPool || BigInt(0);
  const noPool = marketDetails.noPool || BigInt(0);

  // Calculate percentages
  const yesPercent =
    totalPool > BigInt(0)
      ? Number((yesPool * BigInt(10000)) / totalPool) / 100
      : 50;
  const noPercent =
    totalPool > BigInt(0)
      ? Number((noPool * BigInt(10000)) / totalPool) / 100
      : 50;

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
    question: marketDetails.question || "",
    category: marketDetails.category || "",
    creator: marketDetails.creator || ("0x" as Address),
    yesPool,
    noPool,
    totalPool,
    endTime: BigInt(endTime),
    status: marketDetails.status || 0,
    resolved: marketDetails.resolved || false,
    yesPercent,
    noPercent,
    timeLeft,
    poolFormatted,
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

  // Limit to first 10 markets (newest first)
  // Note: marketIds might be generated from count, so they're sequential (1, 2, 3...)
  const limitedIds = useMemo(() => {
    if (!marketIds || marketIds.length === 0) return [];
    // Convert to array and reverse to show newest first, then limit to 10
    const idsArray = Array.from(marketIds);
    // Reverse to show newest first (highest ID = newest)
    return idsArray.reverse().slice(0, 10);
  }, [marketIds]);

  // Fetch addresses for each market (up to 10)
  const address1 = useMarketAddress(
    limitedIds[0] ? Number(limitedIds[0]) : undefined
  );
  const address2 = useMarketAddress(
    limitedIds[1] ? Number(limitedIds[1]) : undefined
  );
  const address3 = useMarketAddress(
    limitedIds[2] ? Number(limitedIds[2]) : undefined
  );
  const address4 = useMarketAddress(
    limitedIds[3] ? Number(limitedIds[3]) : undefined
  );
  const address5 = useMarketAddress(
    limitedIds[4] ? Number(limitedIds[4]) : undefined
  );
  const address6 = useMarketAddress(
    limitedIds[5] ? Number(limitedIds[5]) : undefined
  );
  const address7 = useMarketAddress(
    limitedIds[6] ? Number(limitedIds[6]) : undefined
  );
  const address8 = useMarketAddress(
    limitedIds[7] ? Number(limitedIds[7]) : undefined
  );
  const address9 = useMarketAddress(
    limitedIds[8] ? Number(limitedIds[8]) : undefined
  );
  const address10 = useMarketAddress(
    limitedIds[9] ? Number(limitedIds[9]) : undefined
  );

  // Fetch details for each market
  const details1 = useMarketDetails(address1.data);
  const details2 = useMarketDetails(address2.data);
  const details3 = useMarketDetails(address3.data);
  const details4 = useMarketDetails(address4.data);
  const details5 = useMarketDetails(address5.data);
  const details6 = useMarketDetails(address6.data);
  const details7 = useMarketDetails(address7.data);
  const details8 = useMarketDetails(address8.data);
  const details9 = useMarketDetails(address9.data);
  const details10 = useMarketDetails(address10.data);

  const markets = useMemo(() => {
    const results = [
      formatMarketData(
        limitedIds[0] || BigInt(0),
        address1.data,
        details1.data,
        address1.isLoading || details1.isLoading
      ),
      formatMarketData(
        limitedIds[1] || BigInt(0),
        address2.data,
        details2.data,
        address2.isLoading || details2.isLoading
      ),
      formatMarketData(
        limitedIds[2] || BigInt(0),
        address3.data,
        details3.data,
        address3.isLoading || details3.isLoading
      ),
      formatMarketData(
        limitedIds[3] || BigInt(0),
        address4.data,
        details4.data,
        address4.isLoading || details4.isLoading
      ),
      formatMarketData(
        limitedIds[4] || BigInt(0),
        address5.data,
        details5.data,
        address5.isLoading || details5.isLoading
      ),
      formatMarketData(
        limitedIds[5] || BigInt(0),
        address6.data,
        details6.data,
        address6.isLoading || details6.isLoading
      ),
      formatMarketData(
        limitedIds[6] || BigInt(0),
        address7.data,
        details7.data,
        address7.isLoading || details7.isLoading
      ),
      formatMarketData(
        limitedIds[7] || BigInt(0),
        address8.data,
        details8.data,
        address8.isLoading || details8.isLoading
      ),
      formatMarketData(
        limitedIds[8] || BigInt(0),
        address9.data,
        details9.data,
        address9.isLoading || details9.isLoading
      ),
      formatMarketData(
        limitedIds[9] || BigInt(0),
        address10.data,
        details10.data,
        address10.isLoading || details10.isLoading
      ),
    ];

    return results.filter(
      (m): m is MarketInfo =>
        m !== null && m.address !== undefined && m.question !== ""
    );
  }, [
    limitedIds,
    address1,
    address2,
    address3,
    address4,
    address5,
    address6,
    address7,
    address8,
    address9,
    address10,
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
