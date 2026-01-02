import { NextRequest, NextResponse } from "next/server";

// Get API key from environment
// Prefer GEMINI_API_KEY (server-side only) over NEXT_PUBLIC_GEMINI_API_KEY (exposed to client)
function getApiKey(): string {
  // Try server-side key first (more secure)
  const rawApiKey =
    process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!rawApiKey || rawApiKey.trim() === "") {
    throw new Error(
      "GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY is not set or is empty. Please add a valid API key to your .env.local file in the frontend directory."
    );
  }

  // Trim whitespace (common issue)
  const apiKey = rawApiKey.trim();

  // Basic validation - API keys usually start with AIza
  if (!apiKey.startsWith("AIza")) {
    throw new Error(
      `Invalid API key format. API key should start with "AIza". Current key starts with "${apiKey.substring(
        0,
        4
      )}". Please get a valid API key from https://makersuite.google.com/app/apikey`
    );
  }

  // Check minimum length (API keys are usually 39 characters)
  if (apiKey.length < 30) {
    console.warn(
      `⚠️ [Server] API key seems too short (${apiKey.length} chars). Expected ~39 characters.`
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

  // First, try to list available models using the API
  try {
    const listUrl = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
    const listResponse = await fetch(listUrl);

    if (listResponse.ok) {
      const listData = await listResponse.json();
      const availableModels = listData.models || [];

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
        return modelName;
      }

      const errorData = await testResponse.text();
    } catch (err: unknown) {
      const error = err as { message?: string };
      continue;
    }
  }

  // Last resort fallback
  cachedModelName = "gemini-1.5-flash-latest";
  console.error(`❌ No working model found! Defaulting to: ${cachedModelName}`);
  return cachedModelName;
}

export async function POST(request: NextRequest) {
  let question: string | undefined;

  try {
    const body = await request.json();
    question = body.question;

    if (!question || question.length < 10) {
      return NextResponse.json(
        { error: "Question too short" },
        { status: 400 }
      );
    }

    // Get API key
    let apiKey: string;
    try {
      apiKey = getApiKey();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      console.error("❌ [Server] Failed to get API key:", errorMsg);
      throw error; // Re-throw to be caught by outer catch
    }

    // Get working model name using v1 API directly
    const modelName = await getWorkingModelName(apiKey);

    // Use REST API v1 directly (not v1beta)
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`;

    const prompt = `You are an expert at analyzing prediction market questions. Your job is to:
1. Validate questions and detect invalid market types that should be REJECTED
2. Determine the appropriate market type: Binary (yes/no) or CrowdWisdom (multiple outcomes)

Analyze this prediction market question: "${question}"

CRITICAL: The question is INVALID and should be REJECTED (isValid: false) if it describes:

1. **Past Events**: Events that have already happened or been determined
   - Binary Example: "Will Rema release an album in October 2023?" (if it's now November 2023 or later)
   - CrowdWisdom Example: "Who won the Grammy for Best African Album in 2023?" (if 2023 Grammy has already happened)
   - Example: "Did Wizkid win the Grammy in 2023?" (past event)
   - Example: "Will King of Thieves movie release on January 26, 2024?" (if that date has passed)

2. **Already Announced**: Events that have been officially announced or confirmed
   - Binary Example: "Will Burna Boy release an album in Q4 2024?" (if it's already officially announced)
   - CrowdWisdom Example: "Who will win the Best Actor award?" (if the winner is already announced)
   - Example: "Will there be a Big Brother Nigeria 2025?" (if it's already confirmed)

3. **Fixed Results**: Events with predetermined or guaranteed outcomes
   - Binary Example: "Will the sun rise tomorrow?" (100% certain)
   - CrowdWisdom Example: "What day of the week will tomorrow be?" (known calendar fact)
   - Example: "Will a clock tick after 1 second?" (guaranteed)
   - Example: "Will Nigeria have a president in 2025?" (constitutional requirement)

4. **100% Certainty Outcomes**: Outcomes that are already determined or impossible to change
   - Binary Example: "Will a movie that already premiered have a sequel?" (if sequel is confirmed)
   - CrowdWisdom Example: "Which candidate won the 2023 election?" (if election results are already declared)
   - Example: "Will an artist who already released an album release it?" (past event)

5. **Known Release Dates**: Events where the release date/outcome is already publicly known
   - Binary Example: "Will a movie release on January 1, 2024?" (if it's already known to release then)
   - CrowdWisdom Example: "What date will the movie premiere?" (if premiere date is already announced)
   - Example: "Will an album release in December?" (if December date is already announced)

6. **Markets After Event**: Markets that go live after the real-life event has already been determined
   - Binary Example: Creating a market in January 2025 asking "Will X win in December 2024 awards?" (event already happened)
   - CrowdWisdom Example: "Who will be the next president?" (if election has already occurred and results are known)

7. **CrowdWisdom-Specific Invalid Cases**:
   - Questions about past events with known outcomes: "Who won Big Brother Naija 2023?" (already determined)
   - Questions about already-announced winners: "Who will host the 2024 event?" (if host already announced)
   - Questions with fixed, known answers: "What is 2+2?" (mathematical certainty)
   - Historical facts: "Who was Nigeria's first president?" (historical fact)
   - Questions about events that already concluded: "Which team won the World Cup 2022?" (already happened)

8. **Valid Question Types** (These should be ACCEPTED):
   - Future events: "Will [Artist] release a song in [future date]?"
   - Social media trends: "What hashtag will be trending on X tomorrow?" (CrowdWisdom - multiple hashtags possible)
   - Entertainment predictions: "Who will win [award show]?" (CrowdWisdom)
   - Market predictions: "Which movie will have the highest box office in Q4?" (CrowdWisdom)
   - Any question about uncertain future events that can be verified

MARKET TYPE DETECTION:
Determine if this question is better suited for:
- **Binary** (yes/no questions): Questions with two clear outcomes (Yes/No, Will/Won't, etc.)
  - Example: "Will Burna Boy release an album in 2024?"
  - Example: "Will Wizkid's song hit 10M streams?"
  
- **CrowdWisdom** (multiple outcomes): Questions where multiple different outcomes are possible
  - Example: "Who will win Big Brother Naija 2024?" (multiple contestants)
  - Example: "Which artist will have the biggest hit in Q4 2024?" (multiple artists possible)
  - Example: "What will be the highest-grossing Nollywood movie in 2024?" (multiple movies)
  - Example: "Which country will win the next AFCON?" (multiple countries)
  - Example: "What hashtag will be trending on X tomorrow?" (multiple hashtags possible)
  - Example: "What will be the top trending topic on Twitter this week?" (multiple topics possible)

IMPORTANT RULES:
- If the question describes ANY of the above invalid types, set isValid: false
- Check the current date context: If the question refers to events that should have happened by now (based on the question's timeframe), it may be invalid
- If an event is already officially announced or confirmed, set isValid: false
- If the outcome is 100% certain or predetermined, set isValid: false
- For CrowdWisdom questions, ensure the question asks about FUTURE outcomes with multiple possibilities, not past events with known results
- For Binary questions, ensure there are two clear opposing outcomes

Return a JSON object with:
{
  "isValid": boolean (false if it's a past event, already announced, fixed result, or has 100% certainty. true only if it's a valid future prediction),
  "rejectionReason": string (only present if isValid is false, explain why it was rejected - e.g., "Past event", "Already announced", "Fixed result", "100% certainty", "CrowdWisdom: Past event with known outcome", etc.),
  "suggestedMarketType": string (either "Binary" or "CrowdWisdom" - suggest the most appropriate market type for this question),
  "category": string (one of: "music", "movies", "reality-tv", "awards", "sports", "other"),
  "suggestedEndDate": string (ISO date string, estimate when this should resolve, or null if unclear),
  "verificationSource": string (where can we verify the outcome?),
  "confidence": string (one of: "high", "medium", "low"),
  "reasoning": string (brief explanation, include date context if relevant, and explain why Binary or CrowdWisdom is suggested),
  "improvedQuestion": string (MUST be a complete, reformulated prediction market question starting with a question word like "Will", "Does", "Is", "Who", "Which", etc. It should be a full question, NOT a suggestion or tip. If the original question is invalid, suggest a valid alternative question. If the original question is already well-formatted, return it unchanged),
  "suggestions": array of strings (optional improvement tips like "Specify exact date" or "Add release date", these are separate from improvedQuestion)
}

Examples of VALID Binary questions:

Question: "Will Burna Boy drop an album in Q4 2024?" (assuming we're in early 2024)
{
  "isValid": true,
  "suggestedMarketType": "Binary",
  "category": "music",
  "suggestedEndDate": "2024-12-31T23:59:59Z",
  "verificationSource": "Spotify, Apple Music, artist social media",
  "confidence": "high",
  "reasoning": "Album releases are publicly verifiable and future event. Binary market type because there are two clear outcomes: Yes (album released) or No (album not released)",
  "improvedQuestion": "Will Burna Boy release an album before December 31, 2024?",
  "suggestions": ["Specify exact date range"]
}

Question: "Will Wizkid's next song hit 10M Spotify streams in first week?"
{
  "isValid": true,
  "suggestedMarketType": "Binary",
  "category": "music",
  "suggestedEndDate": null,
  "verificationSource": "Spotify Charts API / Chartmetric",
  "confidence": "high",
  "reasoning": "Spotify stream counts are publicly available and precisely measurable, future event. Binary market because outcome is Yes (reaches 10M) or No (doesn't reach 10M)",
  "improvedQuestion": "Will Wizkid's next single reach 10 million Spotify streams within 7 days of its release date?",
  "suggestions": ["Specify which song", "Define exact date range for 'first week'"]
}

Examples of VALID CrowdWisdom questions:

Question: "Who will win Big Brother Naija 2024?"
{
  "isValid": true,
  "suggestedMarketType": "CrowdWisdom",
  "category": "reality-tv",
  "suggestedEndDate": "2024-12-31T23:59:59Z",
  "verificationSource": "Official BBNaija announcement, verified social media accounts",
  "confidence": "high",
  "reasoning": "Multiple contestants can win, making this a CrowdWisdom market. Outcome is verifiable from official sources",
  "improvedQuestion": "Who will win Big Brother Naija 2024?",
  "suggestions": []
}

Question: "Which Nollywood movie will have the highest box office in 2024?"
{
  "isValid": true,
  "suggestedMarketType": "CrowdWisdom",
  "category": "movies",
  "suggestedEndDate": "2025-01-31T23:59:59Z",
  "verificationSource": "Cinema Pointer Nigeria, FilmOne box office reports",
  "confidence": "medium",
  "reasoning": "Multiple movies can be the highest-grossing, making this suitable for CrowdWisdom where users can stake on different movie titles",
  "improvedQuestion": "Which Nollywood movie will have the highest box office revenue in 2024?",
  "suggestions": ["Consider extending end date to allow for late-year releases"]
}

Question: "What hashtag will be trending on X tomorrow?"
{
  "isValid": true,
  "suggestedMarketType": "CrowdWisdom",
  "category": "other",
  "suggestedEndDate": null,
  "verificationSource": "X (Twitter) trending topics, Twitter API, social media analytics",
  "confidence": "high",
  "reasoning": "Multiple hashtags can trend, making this a CrowdWisdom market where users can stake on different hashtag options. This is a valid future prediction about social media trends",
  "improvedQuestion": "What hashtag will be trending on X (Twitter) tomorrow?",
  "suggestions": ["Specify timezone for 'tomorrow'", "Consider extending to 'this week' for better prediction window"]
}

Question: "What will be the top trending topic on Twitter this week?"
{
  "isValid": true,
  "suggestedMarketType": "CrowdWisdom",
  "category": "other",
  "suggestedEndDate": null,
  "verificationSource": "Twitter trending topics, Twitter API, social media analytics platforms",
  "confidence": "medium",
  "reasoning": "Multiple topics can trend, making this suitable for CrowdWisdom where users can stake on different trending topics",
  "improvedQuestion": "What will be the top trending topic on X (Twitter) this week?",
  "suggestions": ["Specify exact date range for 'this week'"]
}

Examples of INVALID Binary questions (should be rejected):

Question: "Will Rema release an album in October 2023?" (if it's now December 2023 or later)
{
  "isValid": false,
  "rejectionReason": "Past event - October 2023 has already passed",
  "suggestedMarketType": "Binary",
  "category": "music",
  "reasoning": "This refers to an event in October 2023, which is in the past",
  "improvedQuestion": "Will Rema release an album in Q1 2024?",
  "suggestions": ["Use a future date"]
}

Question: "Will the sun rise tomorrow?"
{
  "isValid": false,
  "rejectionReason": "Fixed result - 100% certainty",
  "suggestedMarketType": "Binary",
  "category": "other",
  "reasoning": "The sun rising is a guaranteed natural event with 100% certainty",
  "improvedQuestion": null,
  "suggestions": ["Predictions must have uncertainty"]
}

Examples of INVALID CrowdWisdom questions (should be rejected):

Question: "Who won Big Brother Naija 2023?" (if 2023 season already ended)
{
  "isValid": false,
  "rejectionReason": "CrowdWisdom: Past event with known outcome - The 2023 winner has already been announced",
  "suggestedMarketType": "CrowdWisdom",
  "category": "reality-tv",
  "reasoning": "This asks about a past event where the winner is already known. CrowdWisdom markets need future, uncertain outcomes",
  "improvedQuestion": "Who will win Big Brother Naija 2024?",
  "suggestions": ["Use future events only"]
}

Question: "Which artist won the Grammy for Best African Album in 2023?" (if 2023 Grammy already happened)
{
  "isValid": false,
  "rejectionReason": "CrowdWisdom: Past event with known outcome - The 2023 Grammy winners have been announced",
  "suggestedMarketType": "CrowdWisdom",
  "category": "awards",
  "reasoning": "Grammy winners for 2023 have already been determined and announced publicly",
  "improvedQuestion": "Which artist will win the Grammy for Best African Album in 2024?",
  "suggestions": ["Use future award shows"]
}

Question: "Who will host the 2024 Oscars?" (if host already announced)
{
  "isValid": false,
  "rejectionReason": "Already announced - The host has been officially confirmed",
  "suggestedMarketType": "CrowdWisdom",
  "category": "awards",
  "reasoning": "The show's host has been officially announced, removing uncertainty",
  "improvedQuestion": "Who will host the 2025 Oscars?",
  "suggestions": ["Predict future events that haven't been announced"]
}

IMPORTANT:
- "improvedQuestion" MUST be a complete, ready-to-use prediction market question (e.g., "Will Artist Name release an album before December 31, 2024?")
- "improvedQuestion" must NOT be a suggestion, tip, or instruction (e.g., NOT "Correct spelling" or "Specify the date")
- "improvedQuestion" should start with question words like "Will", "Does", "Is", "Are", etc.
- If the original question is already clear and well-formatted, return it unchanged in "improvedQuestion"
- Put improvement tips in the "suggestions" array, NOT in "improvedQuestion"

Now analyze: "${question}"

Return ONLY valid JSON, no markdown.`;

    const requestBody = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048, // Increased from 1024
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_ONLY_HIGH",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_ONLY_HIGH",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_ONLY_HIGH",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_ONLY_HIGH",
        },
      ],
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Gemini API error: ${response.status}`;

      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorMessage = `Gemini API error: ${response.status} - ${errorJson.error.message}`;

          // Check for specific API key errors
          if (
            errorJson.error.message.includes("API key not valid") ||
            errorJson.error.message.includes("INVALID_ARGUMENT")
          ) {
            console.error("❌ [Server] INVALID API KEY ERROR:");
            console.error(
              "   1. Check that GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY is set in .env.local"
            );
            console.error("   2. Verify the API key starts with 'AIza'");
            console.error(
              "   3. Get a new API key from: https://makersuite.google.com/app/apikey"
            );
            console.error("   4. Make sure the API key has proper permissions");
            errorMessage = `Invalid API key. Please check your GEMINI_API_KEY in .env.local file. Error: ${errorJson.error.message}`;
          }
        }
      } catch {
        // If parsing fails, use the raw error text
        errorMessage = `Gemini API error: ${
          response.status
        } - ${errorText.substring(0, 200)}`;
      }

      console.error(`❌ [Server] Gemini API error:`, {
        status: response.status,
        statusText: response.statusText,
        body: errorText.substring(0, 500),
        errorMessage,
      });

      throw new Error(errorMessage);
    }

    const result = await response.json();

    // Check if candidates array exists and has items
    if (!result.candidates || result.candidates.length === 0) {
      console.error(`❌ [Server] CRITICAL: No candidates in response!`);
      console.error(
        `❌ [Server] Full response:`,
        JSON.stringify(result, null, 2)
      );
      throw new Error(
        "Gemini API returned empty candidates array - check API key permissions or model availability"
      );
    }

    // Extract text from response - check multiple possible response structures
    let text = "";

    // Try different response structures
    if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
      text = result.candidates[0].content.parts[0].text;
    }

    // Check if response was blocked by safety filters
    if (result.candidates?.[0]?.finishReason) {
      const finishReason = result.candidates[0].finishReason;

      if (
        finishReason === "SAFETY" ||
        finishReason === "RECITATION" ||
        finishReason === "OTHER"
      ) {
        console.warn(
          `⚠️ [Server] Response blocked by safety filters: ${finishReason}`
        );
        if (result.candidates[0].safetyRatings) {
          console.warn(
            `⚠️ [Server] Safety ratings:`,
            JSON.stringify(result.candidates[0].safetyRatings, null, 2)
          );
        }
        // Even if blocked, sometimes there's still partial text
        if (!text && result.candidates[0].content?.parts) {
          console.warn(
            `⚠️ [Server] Trying to extract text despite finishReason: ${finishReason}`
          );
          for (let i = 0; i < result.candidates[0].content.parts.length; i++) {
            const part = result.candidates[0].content.parts[i];
            if (part?.text) {
              text = part.text;
              console.warn(
                `⚠️ [Server] Found text despite finishReason: ${finishReason}`
              );
              break;
            }
          }
        }
      }
    }

    // Check prompt feedback for issues
    if (result.promptFeedback) {
      if (result.promptFeedback.blockReason) {
        console.warn(
          `⚠️ [Server] Prompt was blocked: ${result.promptFeedback.blockReason}`
        );
      }
    }

    if (!text || text.trim() === "") {
      console.error(`❌ [Server] ========== TEXT EXTRACTION FAILED ==========`);
      console.error(`❌ [Server] Question that failed: "${question}"`);
      console.error(
        `❌ [Server] Full response:`,
        JSON.stringify(result, null, 2)
      );
      console.error(`❌ [Server] Response keys:`, Object.keys(result || {}));

      // Check if it's a safety filter issue
      const finishReason = result.candidates?.[0]?.finishReason;
      const safetyRatings = result.candidates?.[0]?.safetyRatings;
      const promptFeedback = result.promptFeedback;

      if (finishReason === "SAFETY" || finishReason === "RECITATION") {
        console.error(
          `❌ [Server] Response blocked by safety filters. Finish reason: ${finishReason}`
        );
        if (safetyRatings) {
          console.error(
            `❌ [Server] Safety ratings:`,
            JSON.stringify(safetyRatings, null, 2)
          );
        }
        // Return a more helpful error message
        throw new Error(
          `Question may have triggered safety filters. Try rephrasing: "${question.substring(
            0,
            100
          )}"`
        );
      }

      if (promptFeedback?.blockReason) {
        console.error(
          `❌ [Server] Prompt was blocked: ${promptFeedback.blockReason}`
        );
        throw new Error(
          `Question was blocked by content filters. Try rephrasing your question.`
        );
      }

      if (result.candidates) {
        console.error(
          `❌ [Server] Candidates array length: ${result.candidates.length}`
        );
        if (result.candidates[0]) {
          console.error(
            `❌ [Server] First candidate:`,
            JSON.stringify(result.candidates[0], null, 2)
          );
          if (result.candidates[0].finishReason) {
            console.error(
              `❌ [Server] Finish reason: ${result.candidates[0].finishReason}`
            );
          }
          if (result.candidates[0].safetyRatings) {
            console.error(
              `❌ [Server] Safety ratings:`,
              JSON.stringify(result.candidates[0].safetyRatings, null, 2)
            );
          }
          if (result.candidates[0].content) {
            console.error(
              `❌ [Server] Content:`,
              JSON.stringify(result.candidates[0].content, null, 2)
            );
          }
        }
      }

      if (result.promptFeedback) {
        console.error(
          `❌ [Server] Prompt feedback:`,
          JSON.stringify(result.promptFeedback, null, 2)
        );
      }

      throw new Error(
        "No text in Gemini response - check server logs for full response structure"
      );
    }

    // Clean response
    const cleanedText = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    console.log(
      `📝 [Server] Extracted text (first 500 chars):`,
      cleanedText.substring(0, 500)
    );

    let validation;
    try {
      validation = JSON.parse(cleanedText);
      console.log(
        `✅ [Server] Validation parsed successfully:`,
        JSON.stringify(validation, null, 2).substring(0, 500)
      );
    } catch (parseError) {
      console.error(`❌ [Server] Failed to parse JSON:`, parseError);
      console.error(
        `❌ [Server] Text that failed to parse:`,
        cleanedText.substring(0, 1000)
      );
      throw new Error(
        `Failed to parse Gemini response as JSON: ${
          parseError instanceof Error ? parseError.message : String(parseError)
        }`
      );
    }

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
