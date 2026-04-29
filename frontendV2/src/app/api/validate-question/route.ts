// POST /api/validate-question
//
// Server-side only — uses @0glabs/0g-serving-broker (Node.js SDK) to run the
// question through 0G Compute before the user signs a wallet transaction.
//
// Returns:
//   { valid: true,  detectedCategory, suggestedSources }
//   { valid: false, error }

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";   // must be Node.js — broker uses native crypto

// ── Lazy imports (Node.js only, not bundled by webpack) ──────────────────────

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

// ── Prompt ───────────────────────────────────────────────────────────────────

const VALIDATION_SYSTEM = `You are a prediction market question validator.
A valid prediction market question must:
1. Have a clear YES or NO outcome that can be verified objectively
2. Resolve by a specific deadline
3. Not be ambiguous or open to interpretation

Respond ONLY in valid JSON. No markdown, no preamble.`;

function buildValidationPrompt(question: string, category: string): string {
  return `Validate this prediction market question: "${question}"
Category hint: ${category}

Respond with this exact JSON:
{
  "valid": true or false,
  "detectedCategory": "crypto" | "sports" | "politics" | "finance" | "custom",
  "error": "Only if valid is false — one sentence explaining why",
  "suggestedSources": ["source1", "source2"]
}

If valid is true, suggestedSources should list 1-3 reputable sources that could verify the outcome.
If valid is false, suggestedSources should be an empty array.`;
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let question: string, category: string;
  try {
    ({ question, category } = await req.json() as { question: string; category: string });
    if (!question?.trim()) throw new Error("question is required");
  } catch {
    return NextResponse.json({ valid: false, error: "Invalid request body" }, { status: 400 });
  }

  const privateKey         = process.env.PRIVATE_KEY_ORACLE;
  const rpc                = process.env.OG_CHAIN_RPC ?? "https://evmrpc-testnet.0g.ai";
  const providerAddress    = process.env.COMPUTE_PROVIDER_ADDRESS;

  if (!privateKey || !providerAddress) {
    // Validation env not configured — skip gracefully so market creation still works
    console.warn("[validate-question] PRIVATE_KEY_ORACLE or COMPUTE_PROVIDER_ADDRESS not set — skipping AI validation");
    return NextResponse.json({ valid: true, detectedCategory: category, suggestedSources: [] });
  }

  try {
    const ethers = await getEthers();
    const { createZGComputeNetworkBroker } = await getBrokerModule();

    const provider = new ethers.JsonRpcProvider(rpc);
    const key      = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
    const wallet   = new ethers.Wallet(key, provider);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const broker   = await createZGComputeNetworkBroker(wallet as any) as any;

    // Ensure ledger exists (non-fatal if it fails)
    try {
      await broker.ledger.getLedger();
    } catch {
      try { await broker.ledger.addLedger(5); } catch { /* no funds */ }
    }

    const { endpoint, model } = await broker.inference.getServiceMetadata(providerAddress);
    const userPrompt          = buildValidationPrompt(question.trim(), category);
    const billingHeaders      = await broker.inference.getRequestHeaders(providerAddress, userPrompt);

    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ baseURL: endpoint, apiKey: "", defaultHeaders: billingHeaders });

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: VALIDATION_SYSTEM },
        { role: "user",   content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens:  300,
    });

    const raw = response.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(raw) as {
      valid: boolean;
      detectedCategory: string;
      error?: string;
      suggestedSources: string[];
    };

    return NextResponse.json(parsed);
  } catch (err) {
    // If 0G Compute is unavailable, let market creation proceed — don't block the user
    console.error("[validate-question] 0G Compute validation failed (non-fatal):", err);
    return NextResponse.json({ valid: true, detectedCategory: category, suggestedSources: [] });
  }
}
