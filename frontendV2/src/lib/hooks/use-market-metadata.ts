import { useState, useEffect } from "react";

export interface AiOverview {
  overview:           string;
  keyFactors:         string[];
  currentOddsContext: string;
}

export interface MarketMetadata {
  question:   string;
  category:   string;
  deadline:   string;
  sources:    string[];
  createdAt:  string;
  aiOverview?: AiOverview;
}

const ZERO_HASH = "0x0000000000000000000000000000000000000000000000000000000000000000";

export function useMarketMetadata(resolutionSourcesHash: `0x${string}` | undefined) {
  const [data,      setData]      = useState<MarketMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!resolutionSourcesHash || resolutionSourcesHash === "0x" || resolutionSourcesHash === ZERO_HASH) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setData(null);

    fetch(`/api/store-metadata?hash=${resolutionSourcesHash}`)
      .then((res) => res.json())
      .then((json: { data?: MarketMetadata; error?: string }) => {
        if (cancelled) return;
        if (json.error) setError(json.error);
        else if (json.data) setData(json.data);
      })
      .catch((err: Error) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [resolutionSourcesHash]);

  return { data, isLoading, error };
}
