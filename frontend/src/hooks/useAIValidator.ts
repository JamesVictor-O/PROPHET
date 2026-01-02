import { useState, useEffect, useCallback } from "react";
import {
  validateMarketQuestion,
  quickCategorize,
  suggestImprovements,
  type MarketValidation,
} from "@/lib/ai-validator-client";

interface UseAIValidatorOptions {
  enabled?: boolean;
  debounceMs?: number;
}

export function useAIValidator(
  question: string,
  options: UseAIValidatorOptions = {}
) {
  const { enabled = true, debounceMs = 1000 } = options;

  const [validation, setValidation] = useState<MarketValidation | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !question || question.trim().length < 5) {
      setValidation(null);
      setIsValidating(false);
      return;
    }

    setIsValidating(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const result = await validateMarketQuestion(question);
        setValidation(result);
        setIsValidating(false);
      } catch (err) {
        console.error("❌ [useAIValidator] Error in validation:", err);
        setError(err instanceof Error ? err : new Error("Validation failed"));
        setIsValidating(false);
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      setIsValidating(false);
    };
  }, [question, enabled, debounceMs]);

  const categorize = useCallback(async (questionText: string) => {
    if (!questionText || questionText.trim().length < 5) {
      return "other";
    }

    try {
      return await quickCategorize(questionText);
    } catch (err) {
      console.error("AI categorization error:", err);
      return "other";
    }
  }, []);

  const getSuggestions = useCallback(async (questionText: string) => {
    if (!questionText || questionText.trim().length < 5) {
      return [];
    }

    try {
      return await suggestImprovements(questionText);
    } catch (err) {
      console.error("AI suggestions error:", err);
      return [];
    }
  }, []);

  return {
    validation,
    isValidating,
    error,
    categorize,
    getSuggestions,
  };
}
