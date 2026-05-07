// POST /api/validate-question
//
// Server-side only — uses @0glabs/0g-serving-broker to run the question through
// 0G Compute before the user signs a wallet transaction.
//
// Returns one of:
//   { valid: true,  detectedCategory, suggestedQuestion?, suggestedSources }
//   { valid: false, error }   ← only for truly unresolvable questions

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

async function getBrokerModule() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("@0glabs/0g-serving-broker") as {
    createZGComputeNetworkBroker: (signer: unknown) => Promise<unknown>;
  };
}

async function getEthers() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("ethers") as typeof import("ethers");
}

// ── Prompts ───────────────────────────────────────────────────────────────────

const VALIDATION_SYSTEM = `You are a prediction market question assistant.
Your job is to help users create well-formed prediction market questions.

CRYPTO PRICE QUESTIONS ARE ALWAYS VALID. Any question asking whether a token price will reach
a specific number (e.g. "Will ETH hit $2500?", "Will BTC surpass $100k?") is ALWAYS valid: true.
Price data is publicly verifiable on CoinGecko, Binance, Coinbase, and all major exchanges.
NEVER return valid: false for a crypto price target question.

HARD REJECT (valid: false) ONLY for these three narrow cases:
1. Pure subjective opinion with no objective YES/NO: "Will Arsenal play well?", "Is Bitcoin a good investment?"
2. Private events impossible to verify publicly: "Will my friend get a promotion?"
3. Completely undefined scope: no asset, no price, no event, no way to determine outcome even in principle

ACCEPT and IMPROVE everything else — including any question about:
- Crypto: price targets, protocol launches, listings, TVL milestones
- Sports: match winners, championship results, tournament outcomes
- Politics: election winners, policy outcomes, referendums
- Finance: index levels, company earnings, IPOs

For all valid questions, suggest improvements where useful:
- suggestedQuestion: use official names, add season/year, use standard market phrasing
- suggestedCategory: correct the category if wrong
- suggestedDeadline: ISO 8601. For open-ended questions return null. For questions with a natural
  deadline (sports finals, election day, end of day/week/month), match the user's intent exactly.
  If user says "end of today", keep their deadline — do not override it.
- suggestedDeadlineReason: one short sentence, or null

Respond ONLY in valid JSON. No markdown, no preamble.`;

function buildValidationPrompt(question: string, category: string, deadlineIso: string): string {
  return `User question: "${question}"
User category: ${category}
User deadline: ${deadlineIso}
Today's date: ${new Date().toISOString().split("T")[0]}

Respond with this exact JSON (all fields required):
{
  "valid": true or false,
  "detectedCategory": "crypto" | "sports" | "politics" | "finance" | "custom",
  "suggestedQuestion": "Improved question, or null if fine as-is",
  "suggestedDeadline": "2025-05-31T22:00:00.000Z or null if unknown",
  "suggestedDeadlineReason": "One sentence, or null",
  "error": "Only if valid is false — one sentence why",
  "suggestedSources": ["source1", "source2"]
}

Examples of VALID questions (always return valid: true):
- "Will ETH surpass $2500 before the end of today?" →
  valid: true, detectedCategory: "crypto",
  suggestedQuestion: "Will Ethereum (ETH) exceed $2,500 before the deadline?",
  suggestedDeadline: null, suggestedDeadlineReason: null,
  suggestedSources: ["CoinGecko", "Binance", "Coinbase"]

- "Will BTC hit $100k?" →
  valid: true, detectedCategory: "crypto",
  suggestedQuestion: "Will Bitcoin (BTC) reach $100,000 before the deadline?",
  suggestedDeadline: null, suggestedDeadlineReason: null,
  suggestedSources: ["CoinGecko", "Binance", "Coinbase"]

- "Will Arsenal win the champions league?" (asked in 2026) →
  valid: true, detectedCategory: "sports",
  suggestedQuestion: "Will Arsenal win the UEFA Champions League 2025/26?",
  suggestedDeadline: "2026-05-30T22:00:00.000Z",
  suggestedDeadlineReason: "UEFA Champions League 2025/26 final is approximately late May 2026"

- "Will Man City win the Premier League?" →
  valid: true, detectedCategory: "sports",
  suggestedQuestion: "Will Manchester City win the Premier League 2025/26?",
  suggestedDeadline: "2026-05-17T17:00:00.000Z",
  suggestedDeadlineReason: "Premier League 2025/26 final day is approximately mid-May 2026"

Examples of INVALID questions (the ONLY cases for valid: false):
- "Will Arsenal play well?" → valid: false, error: "Opinion-based — 'playing well' has no objective YES/NO outcome."
- "Will my friend get a raise?" → valid: false, error: "Private event with no publicly verifiable outcome."`;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let question: string, category: string, deadlineIso: string;
  try {
    ({ question, category, deadlineIso } = await req.json() as {
      question: string;
      category: string;
      deadlineIso: string;
    });
    if (!question?.trim()) throw new Error("question is required");
  } catch {
    return NextResponse.json({ valid: false, error: "Invalid request body" }, { status: 400 });
  }

  const privateKey      = process.env.PRIVATE_KEY_ORACLE;
  const rpc             = process.env.OG_CHAIN_RPC ?? "https://evmrpc-testnet.0g.ai";
  const providerAddress = process.env.COMPUTE_PROVIDER_ADDRESS;

  if (!privateKey) {
    return NextResponse.json(
      { valid: false, error: "PRIVATE_KEY_ORACLE is not set on the server — 0G Compute validation is unavailable" },
      { status: 503 }
    );
  }
  if (!providerAddress) {
    return NextResponse.json(
      { valid: false, error: "COMPUTE_PROVIDER_ADDRESS is not set on the server — 0G Compute validation is unavailable" },
      { status: 503 }
    );
  }

  try {
    const ethers = await getEthers();
    const { createZGComputeNetworkBroker } = await getBrokerModule();

    const provider = new ethers.JsonRpcProvider(rpc);
    const key      = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
    const wallet   = new ethers.Wallet(key, provider);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const broker   = await createZGComputeNetworkBroker(wallet as any) as any;

    try { await broker.ledger.getLedger(); } catch {
      try { await broker.ledger.addLedger(5); } catch { /* no funds */ }
    }

    const { endpoint, model } = await broker.inference.getServiceMetadata(providerAddress);
    const userPrompt          = buildValidationPrompt(question.trim(), category, deadlineIso ?? "not specified");
    const billingHeaders      = await broker.inference.getRequestHeaders(providerAddress, userPrompt);

    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ baseURL: endpoint, apiKey: "", defaultHeaders: billingHeaders });

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: VALIDATION_SYSTEM },
        { role: "user",   content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens:  180,
    });

    const raw = response.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(raw) as {
      valid:                    boolean;
      detectedCategory:         string;
      suggestedQuestion?:       string | null;
      suggestedDeadline?:       string | null;
      suggestedDeadlineReason?: string | null;
      error?:                   string;
      suggestedSources:         string[];
    };

    // Normalize null fields to undefined so the client can use truthiness checks
    if (!parsed.suggestedQuestion)       delete parsed.suggestedQuestion;
    if (!parsed.suggestedDeadline)       delete parsed.suggestedDeadline;
    if (!parsed.suggestedDeadlineReason) delete parsed.suggestedDeadlineReason;

    // If valid, generate AI overview in the same 0G Compute session (reuses broker + client)
    // This is stored in 0G Storage at market creation and read on the detail page — no per-view cost.
    let aiOverview: { overview: string; keyFactors: string[]; currentOddsContext: string } | undefined;
    if (parsed.valid) {
      try {
        const finalQuestion = parsed.suggestedQuestion ?? question.trim();
        const overviewPrompt = `Market question: "${finalQuestion}"
Category: ${parsed.detectedCategory ?? category}
Today's date: ${new Date().toISOString().split("T")[0]}

Respond with this exact JSON (no markdown, no preamble):
{
  "overview": "2-3 sentences explaining what this event is, who the key participants are, and why it matters. Be factual and informative.",
  "keyFactors": ["Factor 1 that will determine the outcome", "Factor 2", "Factor 3"],
  "currentOddsContext": "One sentence on current real-world expectations or recent developments that would inform a trader."
}`;
        const overviewHeaders = await broker.inference.getRequestHeaders(providerAddress, overviewPrompt);
        const overviewClient  = new OpenAI({ baseURL: endpoint, apiKey: "", defaultHeaders: overviewHeaders });
        const overviewResp    = await overviewClient.chat.completions.create({
          model,
          messages: [
            { role: "system", content: "You are a prediction market analyst. Respond ONLY in valid JSON. No markdown, no preamble." },
            { role: "user",   content: overviewPrompt },
          ],
          temperature: 0.3,
          max_tokens:  220,
        });
        aiOverview = JSON.parse(overviewResp.choices[0]?.message?.content ?? "{}") as typeof aiOverview;
      } catch (overviewErr) {
        // Non-fatal — market creation proceeds without an overview
        console.warn("[validate-question] Overview generation failed:", overviewErr instanceof Error ? overviewErr.message : overviewErr);
      }
    }

    return NextResponse.json({ ...parsed, aiOverview });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[validate-question] 0G Compute validation failed:", err);
    return NextResponse.json(
      { valid: false, error: `0G Compute validation failed: ${msg}` },
      { status: 502 }
    );
  }
}
