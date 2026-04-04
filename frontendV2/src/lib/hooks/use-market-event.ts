export function useMarketEvent(id: string) {
  return {
    data: {
      event: { description: "Mock event description", conditionId: "0x123" },
      brief: {
        platform: "polymarket",
        eventTitle: "Mock Market " + id,
        category: "Crypto",
        image: "",
        closesAt: "2026-12-31T00:00:00Z",
        volume: 1500000,
        liquidity: 500000,
        marketProbability: 65,
        eventSlug: "mock-market",
        opportunitySummary: "This is a mocked opportunity.",
      },
    },
    isLoading: false,
    isError: false,
  };
}
