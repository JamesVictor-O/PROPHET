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

IMPORTANT: Sports events, crypto prices, election results, and financial data are ALL publicly
verifiable from free sources (ESPN, BBC Sport, UEFA, CoinGecko, Reuters, etc.).
Never reject a question on those topics for "no verifiable outcome" — they always have one.

HARD REJECT (valid: false) ONLY for these narrow cases:
- Pure opinion with no factual answer: "Will Arsenal play well?", "Is Bitcoin a good investment?"
- Private events that cannot be verified publicly: "Will my friend get a promotion?"
- Completely undefined scope with no way to determine YES/NO even in principle

ACCEPT and IMPROVE everything else — including any question about:
- Sports: match winners, championship results, tournament outcomes
- Crypto: price targets, protocol events, listings
- Politics: election winners, policy outcomes
- Finance: market levels, company events

For all valid questions, suggest improvements where useful:
- suggestedQuestion: use official names, add season/year, standard market phrasing
- suggestedCategory: correct the category if wrong
- suggestedDeadline: ISO 8601 — the real-world event deadline, MUST be in the future relative to today.
  (Champions League final ≈ late May; World Cup final ≈ mid July; election day = exact date)
  If the most recent occurrence has already passed, use the NEXT upcoming one
  (e.g. if today is 2026, suggest the 2025/26 final, not the 2024/25 one).
  Override the user's deadline if it falls before the event actually concludes.
  Return null only if no specific future event date can be inferred.
- suggestedDeadlineReason: one short sentence

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

Examples of VALID questions (always accept, suggest improvements):
- "Will Arsenal win the champions league?" (asked in 2026) →
  valid: true, detectedCategory: "sports",
  suggestedQuestion: "Will Arsenal win the UEFA Champions League 2025/26?",
  suggestedDeadline: "2026-05-30T22:00:00.000Z",
  suggestedDeadlineReason: "UEFA Champions League 2025/26 final is approximately late May 2026"

- "Will BTC hit 100k?" →
  valid: true, detectedCategory: "crypto",
  suggestedQuestion: "Will Bitcoin (BTC) reach $100,000 before the deadline?",
  suggestedDeadline: null, suggestedDeadlineReason: null

- "Will Man City win the Premier League?" →
  valid: true, detectedCategory: "sports",
  suggestedQuestion: "Will Manchester City win the Premier League 2024/25?",
  suggestedDeadline: "2025-05-25T17:00:00.000Z",
  suggestedDeadlineReason: "Premier League 2024/25 final day is May 25, 2025"

Examples of INVALID questions (reject only these):
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
      max_tokens:  400,
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

    return NextResponse.json(parsed);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[validate-question] 0G Compute validation failed:", err);
    return NextResponse.json(
      { valid: false, error: `0G Compute validation failed: ${msg}` },
      { status: 502 }
    );
  }
}
