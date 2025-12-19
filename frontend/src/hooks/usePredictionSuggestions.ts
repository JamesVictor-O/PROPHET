import { useState, useCallback } from "react";

export interface PredictionSuggestion {
  question: string;
  marketType: "Binary" | "CrowdWisdom";
  category: string;
  suggestedEndDate: string;
  verificationSource: string;
  controversyScore: number;
  reasoning: string;
  confidence?: "high" | "medium" | "low";
}

export function usePredictionSuggestions() {
  const [suggestions, setSuggestions] = useState<PredictionSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (category: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ category }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to generate");
      setSuggestions(data.suggestions);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate suggestions"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    generateSuggestions: generate,
    clearSuggestions,
  };
}
