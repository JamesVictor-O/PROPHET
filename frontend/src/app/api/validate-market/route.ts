import { NextRequest, NextResponse } from "next/server";

// Get API key from environment
function getApiKey(): string {
  const apiKey =
    process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY is not set. Please add it to your .env.local file."
    );
  }

  return apiKey;
}

// Cache for working model name (using v1 API directly)
let cachedModelName: string | null = null;

// Helper to list available models and find one that works
async function getWorkingModelName(apiKey: string): Promise<string> {
  if (cachedModelName) {
    return cachedModelName;
  }

  console.log("🔍 Listing available models from Google AI...");

  // First, try to list available models using the API
  try {
    const listUrl = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
    const listResponse = await fetch(listUrl);

    if (listResponse.ok) {
      const listData = await listResponse.json();
      const availableModels = listData.models || [];

      console.log(`📋 Found ${availableModels.length} available models:`);
      availableModels.forEach((model: { name: string }) => {
        console.log(`   - ${model.name}`);
      });

      // Preferred models in order (without the "models/" prefix)
      const preferred = [
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash",
        "gemini-1.5-pro-latest",
        "gemini-1.5-pro",
        "gemini-pro",
        "models/gemini-1.5-flash",
        "models/gemini-1.5-pro",
        "models/gemini-pro",
      ];

      // Find first available model that matches our preferences
      for (const preferredName of preferred) {
        const found = availableModels.find((model: { name: string }) => {
          const modelName = model.name.split("/").pop() || "";
          const preferredShort = preferredName.replace("models/", "");
          return (
            model.name.includes(preferredShort) ||
            modelName === preferredShort ||
            model.name === preferredName
          );
        });

        if (found) {
          // Extract just the model identifier (last part after /)
          const modelId = found.name.split("/").pop() || preferredName;
          cachedModelName = modelId;
          console.log(`✅ Selected model: ${modelId} (from ${found.name})`);
          return modelId;
        }
      }

      // If no preferred model found, use the first one that supports generateContent
      const generateContentModel = availableModels.find(
        (model: { name: string; supportedGenerationMethods?: string[] }) => {
          return model.supportedGenerationMethods?.includes("generateContent");
        }
      );

      if (generateContentModel) {
        const modelId = generateContentModel.name.split("/").pop() || "";
        cachedModelName = modelId;
        console.log(`✅ Selected first available model: ${modelId}`);
        return modelId;
      }
    } else {
      const errorText = await listResponse.text();
      console.warn(
        `⚠️ Could not list models: ${
          listResponse.status
        } - ${errorText.substring(0, 200)}`
      );
    }
  } catch (err: unknown) {
    const error = err as { message?: string };
    console.warn(`⚠️ Error listing models:`, error?.message);
  }

  // Fallback: Try common model names directly
  console.log("🔄 Falling back to testing common model names...");
  const modelsToTry = [
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro-latest",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-pro",
  ];

  for (const modelName of modelsToTry) {
    try {
      const testUrl = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`;

      const testResponse = await fetch(testUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: "test" }],
            },
          ],
        }),
      });

      if (testResponse.ok) {
        cachedModelName = modelName;
        console.log(`✅ Server using model: ${modelName} (v1 API)`);
        return modelName;
      }

      const errorData = await testResponse.text();
      console.log(
        `   → Model ${modelName} returned ${testResponse.status}:`,
        errorData.substring(0, 200)
      );
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.log(`   → Model ${modelName} error:`, error?.message);
      continue;
    }
  }

  // Last resort fallback
  cachedModelName = "gemini-1.5-flash-latest";
  console.error(`❌ No working model found! Defaulting to: ${cachedModelName}`);
  return cachedModelName;
}

export async function POST(request: NextRequest) {
  console.log("🟢 [Server] API route called: /api/validate-market");
  let question: string | undefined;

  try {
    console.log("🟢 [Server] Parsing request body...");
    const body = await request.json();
    question = body.question;
    console.log("🟢 [Server] Question received:", question);

    if (!question || question.length < 10) {
      return NextResponse.json(
        { error: "Question too short" },
        { status: 400 }
      );
    }

    // Get API key
    const apiKey = getApiKey();
    console.log(`🔑 API Key found (${apiKey.substring(0, 10)}...)`);
    console.log(
      `📝 Validating question: "${question.substring(0, 50)}${
        question.length > 50 ? "..." : ""
      }"`
    );

    // Get working model name using v1 API directly
    const modelName = await getWorkingModelName(apiKey);
    console.log(`🤖 Using model: ${modelName}`);

    // Use REST API v1 directly (not v1beta)
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`;

    const prompt = `You are an expert at analyzing prediction market questions.

Analyze this prediction market question: "${question}"

Return a JSON object with:
{
  "isValid": boolean (can this be verified objectively?),
  "category": string (one of: "music", "movies", "reality-tv", "awards", "sports", "other"),
  "suggestedEndDate": string (ISO date string, estimate when this should resolve, or null if unclear),
  "verificationSource": string (where can we verify the outcome?),
  "confidence": string (one of: "high", "medium", "low"),
  "reasoning": string (brief explanation),
  "improvedQuestion": string (MUST be a complete, reformulated prediction market question starting with a question word like "Will", "Does", "Is", etc. It should be a full question, NOT a suggestion or tip. If the original question is already well-formatted, return the original question unchanged),
  "suggestions": array of strings (optional improvement tips like "Specify exact date" or "Add release date", these are separate from improvedQuestion)
}

Examples:

Question: "Will Burna Boy drop an album in Q4 2024?"
{
  "isValid": true,
  "category": "music",
  "suggestedEndDate": "2024-12-31T23:59:59Z",
  "verificationSource": "Spotify, Apple Music, artist social media",
  "confidence": "high",
  "reasoning": "Album releases are publicly verifiable",
  "improvedQuestion": "Will Burna Boy release an album before December 31, 2024?",
  "suggestions": ["Specify exact date range"]
}

Question: "Will Wizkid's song hit 10M Spotify streams in first week?"
{
  "isValid": true,
  "category": "music",
  "suggestedEndDate": null,
  "verificationSource": "Spotify Charts API / Chartmetric",
  "confidence": "high",
  "reasoning": "Spotify stream counts are publicly available and precisely measurable",
  "improvedQuestion": "Will Wizkid's next single reach 10 million Spotify streams within 7 days of its release date?",
  "suggestions": ["Specify which song", "Define exact date range for 'first week'"]
}

Question: "Will King of Thieves 2 make ₦50M opening weekend?"
{
  "isValid": true,
  "category": "movies",
  "suggestedEndDate": null,
  "verificationSource": "Cinema Pointer Nigeria, FilmOne box office reports",
  "confidence": "medium",
  "reasoning": "Box office numbers are reported but may have delays or estimation",
  "suggestions": ["Specify release date", "Note: Box office reporting may not be real-time"]
}

IMPORTANT:
- "improvedQuestion" MUST be a complete, ready-to-use prediction market question (e.g., "Will Artist Name release an album before December 31, 2024?")
- "improvedQuestion" must NOT be a suggestion, tip, or instruction (e.g., NOT "Correct spelling" or "Specify the date")
- "improvedQuestion" should start with question words like "Will", "Does", "Is", "Are", etc.
- If the original question is already clear and well-formatted, return it unchanged in "improvedQuestion"
- Put improvement tips in the "suggestions" array, NOT in "improvedQuestion"

Now analyze: "${question}"

Return ONLY valid JSON, no markdown.`;

    console.log(`🔵 [Server] Calling Gemini API v1: ${modelName}...`);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [Server] Gemini API error:`, {
        status: response.status,
        statusText: response.statusText,
        body: errorText.substring(0, 500),
      });
      throw new Error(
        `Gemini API error: ${response.status} - ${errorText.substring(0, 200)}`
      );
    }

    const result = await response.json();
    console.log(`✅ [Server] Gemini API response received`);

    // Extract text from response
    const text =
      result.candidates?.[0]?.content?.parts?.[0]?.text ||
      result.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "";

    if (!text) {
      console.error(
        `❌ [Server] No text in response:`,
        JSON.stringify(result).substring(0, 500)
      );
      throw new Error("No text in Gemini response");
    }

    // Clean response
    const cleanedText = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const validation = JSON.parse(cleanedText);
    console.log(`✅ [Server] Validation parsed successfully`);

    return NextResponse.json(validation);
  } catch (error: unknown) {
    // Log detailed error information
    const errorDetails =
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : error;

    // Check for specific error types
    const errorObj = error as {
      status?: number;
      statusText?: string;
      message?: string;
      name?: string;
      stack?: string;
      cause?: unknown;
    };

    console.error("❌ AI Validation Error Details:", {
      errorType: errorObj?.name || typeof error,
      status: errorObj?.status,
      statusText: errorObj?.statusText,
      message: errorObj?.message || "Unknown error",
      stack: errorObj?.stack,
      fullError: errorDetails,
      cause: errorObj?.cause,
    });

    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "message" in error
        ? String(error.message)
        : "Unknown error";

    console.error(`🚨 AI validation unavailable - Returning fallback response`);
    console.error(`   Error: ${errorMessage}`);
    console.error(
      `   Question that failed: "${question?.substring(0, 100) || "N/A"}"`
    );

    return NextResponse.json(
      {
        isValid: true,
        category: "other",
        verificationSource: "Manual verification",
        confidence: "low",
        reasoning: "AI validation unavailable",
        error: errorMessage,
      },
      { status: 200 }
    );
  }
}
