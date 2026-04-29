// ─────────────────────────────────────────────────────────────────────────────
// 0G Compute integration — AI inference for oracle resolution + market pricing
//
// Uses @0glabs/0g-serving-broker to:
//   1. Auto-detect testnet/mainnet from the signer's chain ID
//   2. Create/fund a ledger account for paying compute fees
//   3. Verify the TEE attestation of the chosen provider
//   4. Call the AI model through the provider's OpenAI-compatible endpoint
//   5. Return structured JSON parsed into typed response objects
//
// Contract addresses are built into the SDK — no manual config needed:
//   Testnet (16602): ledger 0xE708..., inference 0xa79F...
//   Mainnet (16661): ledger 0x2dE5..., inference 0x4734...
//
// Docs: https://docs.0g.ai/developer-hub/building-on-0g/compute-network/overview
// ─────────────────────────────────────────────────────────────────────────────

import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";
import OpenAI from "openai";
import type { Wallet } from "ethers";
import type { OracleResponse, PricingResponse } from "./types";
import { createLogger } from "./logger";

const logger = createLogger("compute");

// ── Broker singleton — one per wallet, recreated if wallet changes ────────────

let _brokerCache: {
  walletAddress: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  broker: any;
} | null = null;

/**
 * Returns a cached ZGComputeNetworkBroker for the given wallet.
 * Creates a new broker if none exists or the wallet address changed.
 * Auto-detects testnet vs mainnet from the chain ID on the provider.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getBroker(signer: Wallet): Promise<any> {
  const address = await signer.getAddress();

  if (_brokerCache && _brokerCache.walletAddress === address) {
    return _brokerCache.broker;
  }

  logger.info("Initializing 0G Compute broker...", { wallet: address });

  // createZGComputeNetworkBroker auto-detects testnet/mainnet from signer.provider.getNetwork()
  // No contract addresses needed — they are built into the SDK per chain ID
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const broker = await createZGComputeNetworkBroker(signer as any);

  _brokerCache = { walletAddress: address, broker };
  logger.info("0G Compute broker initialized");
  return broker;
}

// ── Account bootstrap ─────────────────────────────────────────────────────────

/**
 * Ensures the signer has a funded ledger account on the 0G Compute network.
 * Safe to call repeatedly — skips each step if already done.
 *
 * Steps:
 *   1. Check if ledger exists → create with MIN_LEDGER_BALANCE if not
 *   2. Check balance → top up if below MIN_BALANCE threshold
 *   3. Acknowledge provider signer (TEE trust) if not already done
 */
async function ensureAccountReady(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  broker: any,
  providerAddress: string
): Promise<void> {
  const MIN_LEDGER_BALANCE = Number(process.env.COMPUTE_MIN_BALANCE ?? 10);    // 0G tokens
  const TOP_UP_AMOUNT      = Number(process.env.COMPUTE_TOPUP_AMOUNT ?? 50);   // 0G tokens

  // ── Step 1: Ensure ledger exists ─────────────────────────────────────────
  let ledgerExists = false;
  try {
    await broker.ledger.getLedger();
    ledgerExists = true;
    logger.info("0G Compute ledger account found");
  } catch {
    ledgerExists = false;
  }

  if (!ledgerExists) {
    logger.info("Creating 0G Compute ledger account...", {
      initialBalance: MIN_LEDGER_BALANCE,
    });
    await broker.ledger.addLedger(MIN_LEDGER_BALANCE);
    logger.info("Ledger account created");
  }

  // ── Step 2: Check balance and top up if needed ────────────────────────────
  try {
    const ledger  = await broker.ledger.getLedger();
    const balance = Number(ledger.balance ?? 0);

    logger.info("0G Compute ledger balance", { balance });

    if (balance < MIN_LEDGER_BALANCE) {
      logger.warn("Ledger balance low — topping up", {
        current: balance,
        topUp:   TOP_UP_AMOUNT,
      });
      await broker.ledger.depositFund(TOP_UP_AMOUNT);
      logger.info("Ledger topped up");
    }
  } catch (err) {
    logger.warn("Could not check/top up balance (non-fatal)", err);
  }

  // ── Step 3: Check provider signer status (TEE acknowledgement) ───────────
  try {
    const status = await broker.inference.checkProviderSignerStatus(providerAddress);
    if (!status.isAcknowledged) {
      logger.info("Acknowledging provider TEE signer...", {
        teeAddress: status.teeSignerAddress,
      });
      await broker.inference.acknowledgeProviderSigner(providerAddress);
      logger.info("Provider TEE signer acknowledged");
    } else {
      logger.info("Provider TEE signer already acknowledged");
    }
  } catch (err) {
    // Non-fatal — some testnet providers skip the acknowledgement requirement
    logger.warn("Provider signer check/acknowledge failed (non-fatal on testnet)", err);
  }
}

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
 * Full flow:
 *   1. Get/cache the ZGComputeNetworkBroker for this signer
 *   2. Ensure the ledger account exists and is funded
 *   3. Get the provider's OpenAI-compatible endpoint + model name
 *   4. Verify TEE attestation
 *   5. Call the model with structured oracle prompt
 *   6. Parse, validate, and return the JSON verdict
 *
 * @param question  - The prediction market question
 * @param deadline  - Unix timestamp of market deadline
 * @param sources   - Approved resolution sources from market metadata
 * @param signer    - Oracle agent wallet (pays for compute in 0G tokens)
 */
export async function callOracleInference(
  question: string,
  deadline: number,
  sources:  string[],
  signer:   Wallet
): Promise<OracleResponse> {
  const providerAddress = process.env.COMPUTE_PROVIDER_ADDRESS;
  if (!providerAddress) {
    throw new Error("COMPUTE_PROVIDER_ADDRESS not set in environment");
  }

  // 1. Get broker (cached after first call)
  const broker = await getBroker(signer);

  // 2. Ensure account is funded and provider is acknowledged
  await ensureAccountReady(broker, providerAddress);

  // 3. Get the provider's inference endpoint and model
  const { endpoint, model } = await broker.inference.getServiceMetadata(providerAddress);
  logger.info("Provider metadata retrieved", { endpoint, model });

  // 4. Verify TEE attestation — proves inference runs in a secure enclave
  logger.info("Verifying TEE attestation...");
  try {
    await broker.inference.verifyService(providerAddress);
    logger.info("TEE attestation verified");
  } catch (err) {
    logger.warn("TEE attestation verification failed (non-fatal on testnet)", err);
  }

  // 5. Build prompt and call the model
  const deadlineDate = new Date(deadline * 1000).toISOString();
  const userPrompt   = buildOraclePrompt(question, deadlineDate, sources);

  // Billing headers — signed token required by the 0G provider proxy
  const billingHeaders = await broker.inference.getRequestHeaders(providerAddress, userPrompt);

  const client = new OpenAI({
    baseURL:        endpoint,
    apiKey:         "",
    defaultHeaders: billingHeaders,
  });

  logger.info("Calling 0G Compute for oracle inference...", { model, question });

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: ORACLE_SYSTEM_PROMPT },
      { role: "user",   content: userPrompt },
    ],
    temperature: 0.1,   // Low temperature = deterministic oracle decisions
    max_tokens:  1500,
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("0G Compute returned empty response");

  logger.info("Received oracle response from 0G Compute");

  // 6. Parse and validate
  let parsed: OracleResponse;
  try {
    parsed = JSON.parse(raw) as OracleResponse;
  } catch {
    throw new Error(`Oracle returned invalid JSON:\n${raw}`);
  }

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
 * @param signer   - Market maker wallet (pays for compute in 0G tokens)
 */
export async function callPricingInference(
  question: string,
  deadline: number,
  signer:   Wallet
): Promise<PricingResponse> {
  const providerAddress = process.env.COMPUTE_PROVIDER_ADDRESS;
  if (!providerAddress) {
    throw new Error("COMPUTE_PROVIDER_ADDRESS not set in environment");
  }

  logger.info("Calling 0G Compute for market pricing...", { question });

  const broker = await getBroker(signer);
  await ensureAccountReady(broker, providerAddress);

  const { endpoint, model } = await broker.inference.getServiceMetadata(providerAddress);

  try {
    await broker.inference.verifyService(providerAddress);
  } catch (err) {
    logger.warn("TEE verification failed for pricing (non-fatal on testnet)", err);
  }

  const deadlineDate = new Date(deadline * 1000).toISOString();
  const userPrompt   = buildPricingPrompt(question, deadlineDate);

  const billingHeaders = await broker.inference.getRequestHeaders(providerAddress, userPrompt);

  const client = new OpenAI({
    baseURL:        endpoint,
    apiKey:         "",
    defaultHeaders: billingHeaders,
  });

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

  parsed.yesProbability = Math.max(1, Math.min(99, Math.round(parsed.yesProbability)));

  logger.info("Pricing inference complete", { yesProbability: parsed.yesProbability });

  return parsed;
}

// ── Question validation ───────────────────────────────────────────────────────

export interface ValidationResponse {
  valid:             boolean;
  detectedCategory:  string;
  error?:            string;
  suggestedSources:  string[];
}

/**
 * Use 0G Compute to validate a question before market creation.
 * Returns valid=true and suggested resolution sources if the question is clear
 * and objectively resolvable. Returns valid=false with an error message if not.
 */
export async function callQuestionValidation(
  question: string,
  category: string,
  signer:   Wallet
): Promise<ValidationResponse> {
  const providerAddress = process.env.COMPUTE_PROVIDER_ADDRESS;
  if (!providerAddress) throw new Error("COMPUTE_PROVIDER_ADDRESS not set");

  const broker = await getBroker(signer);
  await ensureAccountReady(broker, providerAddress);

  const { endpoint, model } = await broker.inference.getServiceMetadata(providerAddress);

  const userPrompt = `Validate this prediction market question: "${question}"
Category hint: ${category}

A valid question must have a clear YES/NO outcome verifiable by a deadline.

Respond with this exact JSON:
{
  "valid": true or false,
  "detectedCategory": "crypto" | "sports" | "politics" | "finance" | "custom",
  "error": "Only if invalid — one sentence why",
  "suggestedSources": ["source1", "source2"]
}`;

  const billingHeaders = await broker.inference.getRequestHeaders(providerAddress, userPrompt);
  const client = new OpenAI({ baseURL: endpoint, apiKey: "", defaultHeaders: billingHeaders });

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: "You are a prediction market question validator. Respond ONLY in valid JSON. No markdown." },
      { role: "user",   content: userPrompt },
    ],
    temperature: 0.1,
    max_tokens:  300,
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty validation response from 0G Compute");

  return JSON.parse(raw) as ValidationResponse;
}

// ── Prompt builders ───────────────────────────────────────────────────────────

function buildOraclePrompt(
  question:    string,
  deadlineIso: string,
  sources:     string[]
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
