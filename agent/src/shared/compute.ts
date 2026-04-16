// ─────────────────────────────────────────────────────────────────────────────
// 0G Compute integration — AI inference for oracle resolution + market pricing
//
// Uses @0glabs/0g-serving-broker to:
//   1. Connect to the 0G Compute marketplace
//   2. Verify the TEE attestation of the chosen provider
//   3. Call the AI model through the provider's OpenAI-compatible endpoint
//   4. Return structured JSON parsed into typed response objects
//
// Docs: https://docs.0g.ai/developer-hub/building-on-0g/compute-network/overview
// Marketplace: https://compute-marketplace.0g.ai/inference
// ─────────────────────────────────────────────────────────────────────────────

import { createInferenceBroker } from "@0glabs/0g-serving-broker";
import OpenAI from "openai";
import type { Wallet } from "ethers";
import type { OracleResponse, PricingResponse } from "./types.js";
import { createLogger } from "./logger.js";

const logger = createLogger("compute");

// ── System prompts ────────────────────────────────────────────────────────────

const ORACLE_SYSTEM_PROMPT = `You are a decentralized prediction market oracle running inside a Trusted Execution Environment (TEE) on the 0G Compute network.

Your job is to determine the outcome of prediction market questions based on publicly available evidence.

Rules:
- Be objective and evidence-based. Do not speculate.
- Only use the approved data sources provided. Do not invent sources.
- If you cannot determine the outcome with >${process.env.ORACLE_MIN_CONFIDENCE ?? 70}% confidence, return verdict: null.
- Your reasoning is stored permanently on 0G Storage — it will be publicly auditable forever.
- Respond ONLY in valid JSON. No preamble, no markdown, no explanation outside the JSON object.`;

const MARKET_MAKER_SYSTEM_PROMPT = `You are a quantitative pricing agent for a prediction market platform.
Your job is to estimate the probability of a YES outcome for a given prediction market question.

Rules:
- Return a probability between 1 and 99 (never 0 or 100 — markets always have uncertainty).
- Base your estimate on current publicly known information about the topic.
- Be calibrated: a 70% YES means you believe there is roughly a 70% chance the event occurs.
- Respond ONLY in valid JSON. No preamble, no markdown.`;

// ── Oracle inference ──────────────────────────────────────────────────────────

/**
 * Call 0G Compute to resolve a prediction market question.
 *
 * Flow:
 *   1. Connect to 0G Serving Network broker (handles payment + routing)
 *   2. Get the provider's OpenAI-compatible endpoint + model name
 *   3. Verify TEE attestation (proves the inference is private + unmanipulated)
 *   4. Call the model with structured oracle prompt
 *   5. Parse and return the JSON verdict
 *
 * @param question  - The prediction market question
 * @param deadline  - Unix timestamp of market deadline
 * @param sources   - Approved resolution sources from market metadata
 * @param signer    - Oracle agent wallet (pays for compute)
 */
export async function callOracleInference(
  question: string,
  deadline: number,
  sources: string[],
  signer: Wallet
): Promise<OracleResponse> {
  const providerAddress  = process.env.COMPUTE_PROVIDER_ADDRESS;
  const contractAddress  = process.env.INFERENCE_CONTRACT_ADDRESS;

  if (!providerAddress) {
    throw new Error("COMPUTE_PROVIDER_ADDRESS not set in environment");
  }
  if (!contractAddress) {
    throw new Error("INFERENCE_CONTRACT_ADDRESS not set in environment");
  }

  logger.info("Connecting to 0G Compute broker...", { provider: providerAddress });

  // Step 1: Create the 0G Serving Network broker
  // This handles fee settlement, provider selection, and request routing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const broker = await createInferenceBroker(signer as any, contractAddress, undefined as any);

  // Step 2: Get the provider's inference endpoint and model name
  const { endpoint, model } = await broker.getServiceMetadata(providerAddress);
  logger.info("Retrieved provider metadata", { endpoint, model });

  // Step 3: Verify the TEE attestation of the provider
  // This confirms the inference runs inside a Trusted Execution Environment —
  // the compute provider cannot see the prompt or manipulate the output
  logger.info("Verifying TEE attestation...");
  try {
    await broker.verifyService(providerAddress);
    logger.info("TEE attestation verified");
  } catch (err) {
    // Non-fatal in testnet — log warning and continue
    logger.warn("TEE attestation verification failed (non-fatal on testnet)", err);
  }

  // Step 4: Build the oracle user prompt
  const deadlineDate = new Date(deadline * 1000).toISOString();
  const userPrompt   = buildOraclePrompt(question, deadlineDate, sources);

  // Step 5: Call the model via the OpenAI-compatible endpoint
  const client = new OpenAI({
    baseURL: endpoint,
    apiKey:  "",          // 0G Compute uses the broker for auth, not API keys
  });

  logger.info("Calling 0G Compute for oracle inference...", { model, question });

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: ORACLE_SYSTEM_PROMPT },
      { role: "user",   content: userPrompt },
    ],
    temperature: 0.1,     // Low temperature for deterministic oracle decisions
    max_tokens:  1500,
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("0G Compute returned empty response");

  logger.info("Received oracle response from 0G Compute");

  // Step 6: Parse and validate JSON
  let parsed: OracleResponse;
  try {
    parsed = JSON.parse(raw) as OracleResponse;
  } catch {
    throw new Error(`Oracle returned invalid JSON:\n${raw}`);
  }

  // Validate required fields
  if (
    parsed.confidence === undefined ||
    parsed.reasoning  === undefined ||
    !Array.isArray(parsed.sourcesChecked)
  ) {
    throw new Error(`Oracle response missing required fields:\n${raw}`);
  }

  logger.info("Oracle inference complete", {
    verdict:    parsed.verdict,
    confidence: parsed.confidence,
  });

  return parsed;
}

// ── Market maker pricing ──────────────────────────────────────────────────────

/**
 * Call 0G Compute to get an initial YES probability estimate for a new market.
 * Used by the market maker agent to seed the opening price quote.
 *
 * @param question - The prediction market question
 * @param deadline - Unix timestamp of market deadline
 * @param signer   - Market maker wallet (pays for compute)
 */
export async function callPricingInference(
  question: string,
  deadline: number,
  signer: Wallet
): Promise<PricingResponse> {
  const providerAddress = process.env.COMPUTE_PROVIDER_ADDRESS;
  const contractAddress = process.env.INFERENCE_CONTRACT_ADDRESS;

  if (!providerAddress) {
    throw new Error("COMPUTE_PROVIDER_ADDRESS not set in environment");
  }
  if (!contractAddress) {
    throw new Error("INFERENCE_CONTRACT_ADDRESS not set in environment");
  }

  logger.info("Calling 0G Compute for market pricing...", { question });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const broker           = await createInferenceBroker(signer as any, contractAddress, undefined as any);
  const { endpoint, model } = await broker.getServiceMetadata(providerAddress);

  // Verify TEE for pricing too — prevents provider from manipulating prices
  try {
    await broker.verifyService(providerAddress);
  } catch (err) {
    logger.warn("TEE verification failed for pricing (non-fatal on testnet)", err);
  }

  const deadlineDate = new Date(deadline * 1000).toISOString();
  const userPrompt   = buildPricingPrompt(question, deadlineDate);

  const client = new OpenAI({ baseURL: endpoint, apiKey: "" });

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: MARKET_MAKER_SYSTEM_PROMPT },
      { role: "user",   content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens:  200,
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("0G Compute returned empty pricing response");

  let parsed: PricingResponse;
  try {
    parsed = JSON.parse(raw) as PricingResponse;
  } catch {
    throw new Error(`Pricing returned invalid JSON:\n${raw}`);
  }

  // Clamp to valid range
  parsed.yesProbability = Math.max(1, Math.min(99, Math.round(parsed.yesProbability)));

  logger.info("Pricing inference complete", { yesProbability: parsed.yesProbability });

  return parsed;
}

// ── Prompt builders ───────────────────────────────────────────────────────────

function buildOraclePrompt(
  question: string,
  deadlineIso: string,
  sources: string[]
): string {
  const minConfidence = process.env.ORACLE_MIN_CONFIDENCE ?? "70";
  const sourceList    = sources.length > 0
    ? sources.map((s, i) => `${i + 1}. ${s}`).join("\n")
    : "General web search and knowledge";

  return `Market Question: "${question}"

Resolution Deadline: ${deadlineIso}

Resolution Criteria: The question resolves YES if the described event occurred before or by the deadline. It resolves NO if the event clearly did not occur. It resolves INCONCLUSIVE if insufficient evidence exists.

Approved data sources to check:
${sourceList}

Today's date: ${new Date().toISOString()}

Respond with this exact JSON structure:
{
  "verdict": true,
  "confidence": 85,
  "reasoning": "Full explanation of your decision, citing specific evidence",
  "evidenceSummary": "One-sentence summary of the key evidence",
  "sourcesChecked": ["source1", "source2"],
  "inconclusiveReason": "Only include this field if verdict is null"
}

Rules:
- verdict must be: true (YES), false (NO), or null (INCONCLUSIVE)
- confidence must be 0–100
- If confidence is below ${minConfidence}, set verdict to null and explain in inconclusiveReason
- Do not include any text outside the JSON object`;
}

function buildPricingPrompt(question: string, deadlineIso: string): string {
  return `Prediction Market Question: "${question}"
Market closes: ${deadlineIso}
Today's date: ${new Date().toISOString()}

Based on your current knowledge, estimate the probability (1–99) that this question resolves YES.

Respond with this exact JSON structure:
{
  "yesProbability": 55,
  "rationale": "One sentence explaining the pricing estimate"
}`;
}
