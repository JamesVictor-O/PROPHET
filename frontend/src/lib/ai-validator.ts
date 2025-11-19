import { GoogleGenerativeAI } from "@google/generative-ai";

// Get API key from environment (lazy initialization)
function getGenAI() {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "NEXT_PUBLIC_GEMINI_API_KEY is not set. Please add it to your .env.local file. " +
        "Get your free API key from: https://aistudio.google.com/app/apikey"
    );
  }

  return new GoogleGenerativeAI(apiKey);
}

// Cache for working model name (determined at runtime)
let cachedModelName: string | null = null;
async function getWorkingModelName(genAI: GoogleGenerativeAI): Promise<string> {
  // Return cached model name if we've found one
  if (cachedModelName) {
    return cachedModelName;
  }

  const modelsToTry = ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro"];

  // Try each model by testing if it can generate content
  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      // Test with a minimal prompt to see if model works
      await model.generateContent("test");
      // If successful, cache and return this model name
      cachedModelName = modelName;
      console.log(`✅ Using model: ${modelName}`);
      return modelName;
    } catch (err: unknown) {
      // If 404 or model not found, try next model
      const error = err as { status?: number; message?: string };
      if (error?.status === 404 || error?.message?.includes("not found")) {
        console.log(`Model ${modelName} not available, trying next...`);
        continue;
      }
      // For other errors, cache and try this model anyway (might work)
      cachedModelName = modelName;
      return modelName;
    }
  }

  // Fallback: use gemini-1.5-pro as default
  cachedModelName = "gemini-1.5-pro";
  return cachedModelName;
}

export interface MarketValidation {
  isValid: boolean;
  category: string;
  suggestedEndDate?: string;
  verificationSource: string;
  confidence: "high" | "medium" | "low";
  reasoning: string;
  suggestions?: string[];
}

export async function validateMarketQuestion(
  question: string
): Promise<MarketValidation> {
  try {
    const genAI = getGenAI();
    const modelName = await getWorkingModelName(genAI);

    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.3, // Lower = more consistent
        topK: 1,
        topP: 1,
      },
    });

    const prompt = `You are an expert at analyzing prediction market questions. 

Analyze this prediction market question: "${question}"

Return a JSON object with:
{
  "isValid": boolean (can this be verified objectively?),
  "category": string (one of: "music", "movies", "reality-tv", "awards", "sports", "other"),
  "suggestedEndDate": string (ISO date string, estimate when this should resolve, or null if unclear),
  "verificationSource": string (where can we verify the outcome? e.g., "Spotify Charts", "Box Office", "Live TV"),
  "confidence": string (one of: "high", "medium", "low" - how verifiable is this?),
  "reasoning": string (brief explanation of your analysis),
  "suggestions": array of strings (optional improvements to make question more verifiable)
}

Examples:

Question: "Will Burna Boy drop an album in Q4 2024?"
{
  "isValid": true,
  "category": "music",
  "suggestedEndDate": "2024-12-31T23:59:59Z",
  "verificationSource": "Official music platforms (Spotify, Apple Music), artist social media",
  "confidence": "high",
  "reasoning": "Album releases are publicly announced and verifiable on streaming platforms",
  "suggestions": ["Consider specifying the exact release date window", "Add streaming milestone instead?"]
}

Question: "Will Wizkid's song hit 10M Spotify streams in first week?"
{
  "isValid": true,
  "category": "music",
  "suggestedEndDate": null,
  "verificationSource": "Spotify Charts API / Chartmetric",
  "confidence": "high",
  "reasoning": "Spotify stream counts are publicly available and precisely measurable",
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

Now analyze: "${question}"

Return ONLY valid JSON, no markdown or code blocks.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Clean up response (remove markdown if present)
    const cleanedText = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const validation: MarketValidation = JSON.parse(cleanedText);

    return validation;
  } catch (error) {
    console.error("Error validating market:", error);

    // Fallback validation
    return {
      isValid: true,
      category: "other",
      verificationSource: "Manual verification required",
      confidence: "low",
      reasoning: "AI validation failed, defaulting to manual review",
    };
  }
}

// Helper function to categorize without full validation (faster)
export async function quickCategorize(question: string): Promise<string> {
  try {
    const genAI = getGenAI();
    const modelName = await getWorkingModelName(genAI);
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `Categorize this prediction market question into ONE category: music, movies, reality-tv, awards, sports, or other.

Question: "${question}"

Return ONLY the category name, nothing else.`;

    const result = await model.generateContent(prompt);
    const category = result.response.text().trim().toLowerCase();

    // Validate category
    const validCategories = [
      "music",
      "movies",
      "reality-tv",
      "awards",
      "sports",
      "other",
    ];

    if (validCategories.includes(category)) {
      return category;
    }

    return "other";
  } catch (error) {
    console.error("Error categorizing:", error);
    return "other";
  }
}

// Helper to suggest improvements
export async function suggestImprovements(question: string): Promise<string[]> {
  try {
    const genAI = getGenAI();
    const modelName = await getWorkingModelName(genAI);
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `Improve this prediction market question to make it more specific, verifiable, and clear.

Question: "${question}"

Return 2-3 improved versions as a JSON array of strings.

Example:
["Will Burna Boy's next album release before December 31, 2024?", "Will Burna Boy announce an album release date by Q4 2024?"]

Return ONLY the JSON array, no markdown.`;

    const result = await model.generateContent(prompt);
    const text = result.response
      .text()
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const suggestions: string[] = JSON.parse(text);

    return suggestions;
  } catch (error) {
    console.error("Error suggesting improvements:", error);
    return [];
  }
}
