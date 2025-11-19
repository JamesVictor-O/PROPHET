export interface MarketValidation {
  isValid: boolean;
  rejectionReason?: string; // Present if isValid is false
  suggestedMarketType?: "Binary" | "CrowdWisdom"; // AI suggestion for market type
  category: string;
  suggestedEndDate?: string;
  verificationSource: string;
  confidence: "high" | "medium" | "low";
  reasoning: string;
  improvedQuestion?: string;
  suggestions?: string[];
}

export async function validateMarketQuestion(
  question: string
): Promise<MarketValidation> {
  console.log("🔵 [Client] Starting AI validation for question:", question);

  try {
    console.log("🔵 [Client] Calling /api/validate-market...");

    const response = await fetch("/api/validate-market", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question }),
    });

    console.log(
      "🔵 [Client] Response status:",
      response.status,
      response.statusText
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [Client] HTTP error response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const validation: MarketValidation = await response.json();
    console.log("✅ [Client] Validation result:", validation);

    // Log if we got a fallback response
    if (
      validation.reasoning === "AI validation unavailable" ||
      validation.confidence === "low"
    ) {
      const validationWithError = validation as MarketValidation & {
        error?: string;
      };
      console.warn("⚠️ [Client] Received fallback validation response:", {
        error: validationWithError.error,
        validation,
      });
    }

    return validation;
  } catch (error) {
    const errorDetails =
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : error;

    console.error("❌ [Client] Error validating market:", {
      error: errorDetails,
      fullError: error,
      question,
    });

    // Fallback
    const fallback = {
      isValid: true,
      category: "other",
      verificationSource: "Manual verification required",
      confidence: "low" as const,
      reasoning: "AI validation unavailable",
    };

    console.warn("⚠️ [Client] Returning fallback validation:", fallback);

    return fallback;
  }
}

export async function quickCategorize(question: string): Promise<string> {
  try {
    const validation = await validateMarketQuestion(question);
    return validation.category;
  } catch (error) {
    console.error("Error categorizing:", error);
    return "other";
  }
}

export async function suggestImprovements(question: string): Promise<string[]> {
  try {
    const validation = await validateMarketQuestion(question);
    return validation.suggestions || [];
  } catch (error) {
    console.error("Error getting suggestions:", error);
    return [];
  }
}
