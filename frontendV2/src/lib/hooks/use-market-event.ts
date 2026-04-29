"use client";

import { useMarketDetail, formatUsdtUsd, formatDeadlineTs } from "./use-market-detail";

/**
 * Thin wrapper over useMarketDetail that shapes on-chain data into the
 * event/brief format consumed by the alpha and market pages.
 * Previously returned hardcoded mocks — now reads real contract state.
 */
export function useMarketEvent(id: string) {
  const { detail, isLoading, error } = useMarketDetail(id);

  if (!detail) {
    return { data: null, isLoading, isError: !!error };
  }

  return {
    data: {
      event: {
        description:  detail.question,
        conditionId:  detail.address,
      },
      brief: {
        platform:           "prophet",
        eventTitle:         detail.question,
        category:           detail.category,
        image:              "",
        closesAt:           new Date(Number(detail.deadline) * 1000).toISOString(),
        closesAtFormatted:  formatDeadlineTs(detail.deadline),
        volume:             Number(detail.totalCollateral),
        volumeFormatted:    formatUsdtUsd(detail.totalCollateral),
        liquidity:          Number(detail.totalCollateral),
        marketProbability:  50,   // TODO: replace with market maker live price from 0G Storage
        eventSlug:          detail.address,
        status:             detail.statusLabel,
        outcome:            detail.outcome,
        opportunitySummary: `${detail.category} market resolving ${formatDeadlineTs(detail.deadline)}`,
      },
    },
    isLoading: false,
    isError:   false,
  };
}
