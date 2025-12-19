import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

const suggestionCache = new Map<
  string,
  {
    suggestions: PredictionSuggestion[];
    timestamp: number;
  }
>();

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

// Helper function for delays
async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractJsonArray(text: string): PredictionSuggestion[] {
  try {
    return JSON.parse(text);
  } catch {
    const cleaned = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch {
      const start = cleaned.indexOf("[");
      const end = cleaned.lastIndexOf("]");
      if (start !== -1 && end !== -1) {
        const potentialJson = cleaned.substring(start, end + 1);
        return JSON.parse(potentialJson);
      }
      throw new Error("Could not locate JSON array in AI response");
    }
  }
}

export async function POST(request: NextRequest) {
  console.log("🟢 [Server] /api/generate-predictions route called");
  try {
    const body = await request.json();
    const { category } = body;
    console.log("🟢 [Server] Category received:", category);

    if (!category) {
      return NextResponse.json(
        { error: "Category is required", suggestions: [] },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = category.toLowerCase();
    const cached = suggestionCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`✅ [Server] Returning cached suggestions for: ${category}`);
      return NextResponse.json({ suggestions: cached.suggestions });
    }

    const apiKey =
      process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      console.error(
        "CRITICAL: GEMINI_API_KEY is missing from environment variables!"
      );
      return NextResponse.json(
        {
          error:
            "Server configuration error: GEMINI_API_KEY is not set. Please add it to your .env.local file.",
          suggestions: [],
        },
        { status: 500 }
      );
    }

    const currentDate = new Date().toISOString().split("T")[0];
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    const prompt = `You are an expert at creating engaging prediction market questions for African entertainment culture. Generate 5-8 high-quality, controversial, and current prediction market questions for the "${category}" category.

CRITICAL REQUIREMENTS:

1. **Current & Timely**: All predictions must be about FUTURE events that haven't happened yet. Use the current date context: ${currentDate} (Year: ${currentYear}). Predictions should be relevant to ${currentYear} or ${nextYear}.

2. **Controversial**: Questions should spark debate and have divided opinions. Higher controversy = more engagement.

3. **Verifiable**: Each question must have clear, objective sources for verification (Spotify Charts, official announcements, box office reports, etc.).

4. **Market Type Appropriate**:
   - **Binary**: Clear Yes/No questions with two opposing outcomes
   - **CrowdWisdom**: Questions with multiple possible outcomes (3+ options)

5. **Controversy Score (1-10)**: 1-3 = Low, 4-6 = Medium, 7-10 = High controversy

6. **Quality Standards**:
   - Questions must be specific (include dates, numbers, or clear criteria)
   - Must be answerable within a reasonable timeframe (max 365 days)
   - Must avoid past events or 100% certainties
   - Must be culturally relevant to African entertainment

Return a JSON array of prediction suggestions. Each suggestion must have:
{
  "question": string (complete, ready-to-use prediction market question),
  "marketType": "Binary" | "CrowdWisdom",
  "category": "${category}",
  "suggestedEndDate": string (ISO date string, when this should resolve),
  "verificationSource": string (where to verify the outcome),
  "controversyScore": number (1-10, higher = more controversial),
  "reasoning": string (why this is a good prediction market question, why it's controversial),
  "confidence": "high" | "medium" | "low"
}

IMPORTANT:
- Generate 5-8 suggestions (aim for variety in market types and controversy levels)
- All questions must be about FUTURE events (use ${currentDate} as reference)
- Mix Binary and CrowdWisdom questions
- Include a range of controversy scores (some 4-6, some 7-10)
- All questions must be specific and verifiable
- Focus on African entertainment culture relevance

Return ONLY valid JSON array, no markdown, no code blocks.`;

    const modelsToTry = [
      "gemini-flash-latest",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-2.0-flash-exp",
    ];

    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`🤖 [Server] Trying model: ${modelName}`);

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        console.log(`📡 [Server] Making request to Gemini API...`);

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 4096,
            },
          }),
        });

        console.log(`📊 [Server] Response status: ${response.status}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            errorData.error?.message || `API error: ${response.status}`;

          // Handle rate limiting (429)
          if (response.status === 429) {
            console.warn(
              `⚠️ [Server] Rate limited on ${modelName}, waiting 2s before trying next model...`
            );
            await delay(2000); // Wait 2 seconds before trying next model
            lastError = errorMessage;
            continue;
          }

          console.warn(
            `⚠️ [Server] Model ${modelName} failed: ${errorMessage}`
          );
          lastError = errorMessage;
          continue;
        }

        const data = await response.json();
        console.log(`✅ [Server] Success with model: ${modelName}`);

        let text = "";
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          text = data.candidates[0].content.parts[0].text;
        } else if (data.candidates?.[0]?.content?.parts) {
          for (const part of data.candidates[0].content.parts) {
            if (part?.text) {
              text = part.text;
              break;
            }
          }
        }

        if (!text || text.trim() === "") {
          console.warn(`⚠️ [Server] Model ${modelName} returned empty text`);
          lastError = "Empty response from AI";
          continue;
        }
        let suggestions: PredictionSuggestion[];
        try {
          suggestions = extractJsonArray(text);
          if (!Array.isArray(suggestions)) {
            throw new Error("Response is not an array");
          }
        } catch (parseError) {
          console.error("❌ [Server] Failed to parse JSON:", parseError);
          console.error(
            "❌ [Server] Text that failed to parse:",
            text.substring(0, 1000)
          );
          lastError = "Failed to parse AI response";
          continue; // Try next model
        }

        // Validate and filter suggestions
        const validSuggestions = suggestions.filter((s) => {
          return (
            s.question &&
            s.marketType &&
            (s.marketType === "Binary" || s.marketType === "CrowdWisdom") &&
            s.category &&
            s.verificationSource &&
            typeof s.controversyScore === "number" &&
            s.controversyScore >= 1 &&
            s.controversyScore <= 10
          );
        });

        if (validSuggestions.length === 0) {
          console.warn(
            `⚠️ [Server] Model ${modelName} generated no valid suggestions`
          );
          lastError = "No valid suggestions generated";
          continue;
        }

        validSuggestions.sort(
          (a, b) => b.controversyScore - a.controversyScore
        );

        console.log(
          `✅ [Server] Generated ${validSuggestions.length} valid prediction suggestions for category: ${category}`
        );

        // Cache the results
        suggestionCache.set(cacheKey, {
          suggestions: validSuggestions,
          timestamp: Date.now(),
        });

        return NextResponse.json({ suggestions: validSuggestions });
      } catch (err) {
        console.error(`❌ [Server] Error with model ${modelName}:`, err);
        lastError = err instanceof Error ? err.message : "Unknown error";
        continue;
      }
    }

    console.error("❌ [Server] All models failed. Last error:", lastError);
    return NextResponse.json(
      {
        error: `All AI models are currently unavailable. Last error: ${lastError}. Please try again in a few moments.`,
        suggestions: [],
      },
      { status: 503 }
    );
  } catch (err) {
    const errorMessage =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null && "message" in err
        ? String(err.message)
        : "Unknown error";

    console.error("❌ [Server] Error generating predictions:", errorMessage);
    console.error("❌ [Server] Full error:", err);

    return NextResponse.json(
      {
        error: errorMessage,
        suggestions: [],
      },
      { status: 500 }
    );
  }
}
