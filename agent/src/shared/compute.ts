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
import type { AllocationScoreResponse, OracleResponse, PricingResponse } from "./types";
import { createLogger } from "./logger";
import { cfg, cfgNum } from "./config";

const logger = createLogger("compute");

// ── Timeout helper ────────────────────────────────────────────────────────────

/** Rejects after `ms` milliseconds with a timeout error. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`0G Compute timed out after ${ms / 1000}s (${label})`)),
      ms
    );
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err as Error); }
    );
  });
}

const COMPUTE_TIMEOUT_MS = cfgNum("COMPUTE_TIMEOUT_MS"); // generous for testnet latency

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  label: string,
  fn: () => Promise<T>,
  retries = cfgNum("COMPUTE_RETRIES")
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === retries) break;
      const delayMs = 1_000 * attempt;
      logger.warn(`${label} failed — retrying`, {
        attempt,
        retries,
        delayMs,
        error: err instanceof Error ? err.message : String(err),
      });
      await sleep(delayMs);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

function extractJsonObject(raw: string, label: string): string {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  if (cleaned.startsWith("{") && cleaned.endsWith("}")) return cleaned;

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) return cleaned.slice(start, end + 1);

  throw new Error(`${label} returned no JSON object:\n${raw}`);
}

function assertValidConfidence(confidence: unknown, label: string): number {
  if (typeof confidence !== "number" || !Number.isFinite(confidence)) {
    throw new Error(`${label} confidence must be a finite number`);
  }
  return Math.max(0, Math.min(100, Math.round(confidence)));
}

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
  const MIN_LEDGER_BALANCE = cfgNum("COMPUTE_MIN_BALANCE");
  const TOP_UP_AMOUNT      = cfgNum("COMPUTE_TOPUP_AMOUNT");

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
- If you cannot determine the outcome with >${cfgNum("ORACLE_MIN_CONFIDENCE")}% confidence, return verdict: null.
- Your reasoning is stored permanently on 0G Storage — it will be publicly auditable forever.
- Respond ONLY in valid JSON. No preamble, no markdown, no explanation outside the JSON object.`;

const MARKET_MAKER_SYSTEM_PROMPT = `You are a quantitative pricing agent for a prediction market platform.
Your job is to estimate the probability of a YES outcome for a given prediction market question.

Rules:
- Return a probability between 1 and 99 (never 0 or 100 — markets always have uncertainty).
- Base your estimate on current publicly known information about the topic.
- Be calibrated: a 70% YES means you believe there is roughly a 70% chance the event occurs.
- Respond ONLY in valid JSON. No preamble, no markdown.`;

const LIQUIDITY_ALLOCATOR_SYSTEM_PROMPT = `You are a risk-aware autonomous liquidity allocator for a YES/NO prediction market AMM.

Your job is to decide how much protocol-owned liquidity a new market deserves.

Score higher when:
- the question is objectively resolvable
- the market likely has organic demand
- the deadline is reasonable
- the topic is understandable and not easy to manipulate

Score lower when:
- the wording is vague, subjective, or depends on private information
- the deadline is too soon or too far away
- the market can be manipulated by one person or a small group
- the question is unlikely to attract traders

Respond ONLY in valid JSON. No markdown.`;

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
  const providerAddress = cfg("COMPUTE_PROVIDER_ADDRESS");

  // 1. Get broker (cached after first call)
  const broker = await withTimeout(getBroker(signer), COMPUTE_TIMEOUT_MS, "broker-init");

  // 2. Ensure account is funded and provider is acknowledged
  await withTimeout(ensureAccountReady(broker, providerAddress), COMPUTE_TIMEOUT_MS, "account-ready");

  // 3. Get the provider's inference endpoint and model
  const { endpoint, model } = await withTimeout(
    broker.inference.getServiceMetadata(providerAddress) as Promise<{ endpoint: string; model: string }>,
    COMPUTE_TIMEOUT_MS,
    "service-metadata"
  );
  logger.info("Provider metadata retrieved", { endpoint, model });

  // 4. Verify TEE attestation — proves inference runs in a secure enclave
  logger.info("Verifying TEE attestation...");
  try {
    await withTimeout(broker.inference.verifyService(providerAddress), COMPUTE_TIMEOUT_MS, "tee-verify");
    logger.info("TEE attestation verified");
  } catch (err) {
    if (cfgNum("COMPUTE_REQUIRE_TEE") > 0) {
      throw new Error(`TEE attestation verification failed for provider ${providerAddress}: ${
        err instanceof Error ? err.message : String(err)
      }`);
    }
    logger.warn("TEE attestation verification failed (non-fatal on testnet)", err);
  }

  // 5. Build prompt and call the model
  const deadlineDate = new Date(deadline * 1000).toISOString();
  const userPrompt   = buildOraclePrompt(question, deadlineDate, sources);

  // Billing headers — signed token required by the 0G provider proxy
  const billingHeaders = await withTimeout(
    broker.inference.getRequestHeaders(providerAddress, userPrompt) as Promise<Record<string, string>>,
    COMPUTE_TIMEOUT_MS,
    "billing-headers"
  );

  const client = new OpenAI({
    baseURL:        endpoint,
    apiKey:         "",
    defaultHeaders: billingHeaders,
  });

  logger.info("Calling 0G Compute for oracle inference...", { model, question });

  const response = await withRetry("0G oracle inference", () =>
    withTimeout(
      client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: ORACLE_SYSTEM_PROMPT },
          { role: "user",   content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens:  1500,
      }),
      COMPUTE_TIMEOUT_MS,
      "oracle-inference"
    )
  );

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("0G Compute returned empty response");

  logger.info("Received oracle response from 0G Compute");

  // 6. Parse and validate — strip markdown code fences if the model wrapped the JSON
  const cleaned = extractJsonObject(raw, "Oracle");

  let parsed: OracleResponse;
  try {
    parsed = JSON.parse(cleaned) as OracleResponse;
  } catch {
    throw new Error(`Oracle returned invalid JSON:\n${cleaned}`);
  }

  if (parsed.verdict !== true && parsed.verdict !== false && parsed.verdict !== null) {
    throw new Error(`Oracle verdict must be true, false, or null:\n${cleaned}`);
  }

  parsed.confidence = assertValidConfidence(parsed.confidence, "Oracle");

  if (parsed.reasoning === undefined || typeof parsed.reasoning !== "string") {
    throw new Error(`Oracle response missing required fields:\n${cleaned}`);
  }
  if (parsed.evidenceSummary === undefined || typeof parsed.evidenceSummary !== "string") {
    parsed.evidenceSummary = parsed.reasoning.slice(0, 240);
  }

  if (!Array.isArray(parsed.sourcesChecked)) {
    parsed.sourcesChecked = [];
  }
  parsed.sourcesChecked = parsed.sourcesChecked.map(String).slice(0, 20);

  if (parsed.confidence < cfgNum("ORACLE_MIN_CONFIDENCE")) {
    parsed.verdict = null;
    parsed.inconclusiveReason =
      parsed.inconclusiveReason ??
      `Confidence ${parsed.confidence}% is below required threshold ${cfgNum("ORACLE_MIN_CONFIDENCE")}%.`;
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
  const providerAddress = cfg("COMPUTE_PROVIDER_ADDRESS");

  logger.info("Calling 0G Compute for market pricing...", { question });

  const broker = await withTimeout(getBroker(signer), COMPUTE_TIMEOUT_MS, "broker-init");
  await withTimeout(ensureAccountReady(broker, providerAddress), COMPUTE_TIMEOUT_MS, "account-ready");

  const { endpoint, model } = await withTimeout(
    broker.inference.getServiceMetadata(providerAddress) as Promise<{ endpoint: string; model: string }>,
    COMPUTE_TIMEOUT_MS,
    "service-metadata"
  );

  try {
    await withTimeout(broker.inference.verifyService(providerAddress), COMPUTE_TIMEOUT_MS, "tee-verify");
  } catch (err) {
    if (cfgNum("COMPUTE_REQUIRE_TEE") > 0) {
      throw new Error(`TEE verification failed for pricing provider ${providerAddress}: ${
        err instanceof Error ? err.message : String(err)
      }`);
    }
    logger.warn("TEE verification failed for pricing (non-fatal on testnet)", err);
  }

  const deadlineDate = new Date(deadline * 1000).toISOString();
  const userPrompt   = buildPricingPrompt(question, deadlineDate);

  const billingHeaders = await withTimeout(
    broker.inference.getRequestHeaders(providerAddress, userPrompt) as Promise<Record<string, string>>,
    COMPUTE_TIMEOUT_MS,
    "billing-headers"
  );

  const client = new OpenAI({
    baseURL:        endpoint,
    apiKey:         "",
    defaultHeaders: billingHeaders,
  });

  const response = await withRetry("0G pricing inference", () =>
    withTimeout(
      client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: MARKET_MAKER_SYSTEM_PROMPT },
          { role: "user",   content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens:  200,
      }),
      COMPUTE_TIMEOUT_MS,
      "pricing-inference"
    )
  );

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("0G Compute returned empty pricing response");

  const cleaned = extractJsonObject(raw, "Pricing");

  let parsed: PricingResponse;
  try {
    parsed = JSON.parse(cleaned) as PricingResponse;
  } catch {
    throw new Error(`Pricing returned invalid JSON:\n${cleaned}`);
  }

  if (typeof parsed.yesProbability !== "number" || !Number.isFinite(parsed.yesProbability)) {
    throw new Error(`Pricing yesProbability must be a finite number:\n${cleaned}`);
  }
  parsed.yesProbability = Math.max(1, Math.min(99, Math.round(parsed.yesProbability)));
  if (!parsed.rationale || typeof parsed.rationale !== "string") {
    parsed.rationale = "0G Compute returned a probability without rationale.";
  }

  logger.info("Pricing inference complete", { yesProbability: parsed.yesProbability });

  return parsed;
}

// ── Market maker liquidity allocation scoring ────────────────────────────────

/**
 * Call 0G Compute to score a market for autonomous liquidity allocation.
 * The market-maker agent maps this score to a pool allocation BPS.
 */
export async function callAllocationScoring(
  question: string,
  category: string,
  deadline: number,
  signer:   Wallet
): Promise<AllocationScoreResponse> {
  const providerAddress = cfg("COMPUTE_PROVIDER_ADDRESS");

  logger.info("Calling 0G Compute for liquidity allocation score...", { question, category });

  const broker = await withTimeout(getBroker(signer), COMPUTE_TIMEOUT_MS, "broker-init");
  await withTimeout(ensureAccountReady(broker, providerAddress), COMPUTE_TIMEOUT_MS, "account-ready");

  const { endpoint, model } = await withTimeout(
    broker.inference.getServiceMetadata(providerAddress) as Promise<{ endpoint: string; model: string }>,
    COMPUTE_TIMEOUT_MS,
    "service-metadata"
  );

  try {
    await withTimeout(broker.inference.verifyService(providerAddress), COMPUTE_TIMEOUT_MS, "tee-verify");
  } catch (err) {
    if (cfgNum("COMPUTE_REQUIRE_TEE") > 0) {
      throw new Error(`TEE verification failed for allocation provider ${providerAddress}: ${
        err instanceof Error ? err.message : String(err)
      }`);
    }
    logger.warn("TEE verification failed for allocation scoring (non-fatal on testnet)", err);
  }

  const deadlineDate = new Date(deadline * 1000).toISOString();
  const userPrompt   = buildAllocationPrompt(question, category, deadlineDate);

  const billingHeaders = await withTimeout(
    broker.inference.getRequestHeaders(providerAddress, userPrompt) as Promise<Record<string, string>>,
    COMPUTE_TIMEOUT_MS,
    "billing-headers"
  );

  const client = new OpenAI({
    baseURL:        endpoint,
    apiKey:         "",
    defaultHeaders: billingHeaders,
  });

  const response = await withRetry("0G allocation scoring", () =>
    withTimeout(
      client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: LIQUIDITY_ALLOCATOR_SYSTEM_PROMPT },
          { role: "user",   content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens:  350,
      }),
      COMPUTE_TIMEOUT_MS,
      "allocation-scoring"
    )
  );

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("0G Compute returned empty allocation scoring response");

  const cleaned = extractJsonObject(raw, "Allocation scoring");

  let parsed: AllocationScoreResponse;
  try {
    parsed = JSON.parse(cleaned) as AllocationScoreResponse;
  } catch {
    throw new Error(`Allocation scoring returned invalid JSON:\n${cleaned}`);
  }

  parsed.score            = assertValidConfidence(parsed.score, "Allocation score");
  parsed.resolvability    = assertValidConfidence(parsed.resolvability, "Allocation resolvability");
  parsed.demand           = assertValidConfidence(parsed.demand, "Allocation demand");
  parsed.manipulationRisk = assertValidConfidence(parsed.manipulationRisk, "Allocation manipulationRisk");

  if (!parsed.rationale || typeof parsed.rationale !== "string") {
    parsed.rationale = "0G Compute returned allocation factors without rationale.";
  }

  logger.info("Allocation scoring complete", {
    score: parsed.score,
    resolvability: parsed.resolvability,
    demand: parsed.demand,
    manipulationRisk: parsed.manipulationRisk,
  });

  return parsed;
}

// ── Question validation ───────────────────────────────────────────────────────

export interface ValidationResponse {
  valid:                    boolean;
  detectedCategory:         string;
  suggestedQuestion?:       string;
  suggestedDeadline?:       string;   // ISO 8601 — real-world deadline for the event
  suggestedDeadlineReason?: string;
  error?:                   string;
  suggestedSources:         string[];
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
  const providerAddress = cfg("COMPUTE_PROVIDER_ADDRESS");

  const broker = await withTimeout(getBroker(signer), COMPUTE_TIMEOUT_MS, "broker-init");
  await withTimeout(ensureAccountReady(broker, providerAddress), COMPUTE_TIMEOUT_MS, "account-ready");

  const { endpoint, model } = await withTimeout(
    broker.inference.getServiceMetadata(providerAddress) as Promise<{ endpoint: string; model: string }>,
    COMPUTE_TIMEOUT_MS,
    "service-metadata"
  );

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

  const billingHeaders = await withTimeout(
    broker.inference.getRequestHeaders(providerAddress, userPrompt) as Promise<Record<string, string>>,
    COMPUTE_TIMEOUT_MS,
    "billing-headers"
  );
  const client = new OpenAI({ baseURL: endpoint, apiKey: "", defaultHeaders: billingHeaders });

  const response = await withRetry("0G question validation", () =>
    withTimeout(
      client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: "You are a prediction market question validator. Respond ONLY in valid JSON. No markdown." },
          { role: "user",   content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens:  300,
      }),
      COMPUTE_TIMEOUT_MS,
      "question-validation"
    )
  );

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty validation response from 0G Compute");

  const parsed = JSON.parse(extractJsonObject(raw, "Question validation")) as ValidationResponse;
  parsed.valid = Boolean(parsed.valid);
  parsed.detectedCategory = String(parsed.detectedCategory || category || "custom");
  parsed.suggestedSources = Array.isArray(parsed.suggestedSources)
    ? parsed.suggestedSources.map(String).slice(0, 10)
    : [];
  return parsed;
}

// ── Prompt builders ───────────────────────────────────────────────────────────

function buildOraclePrompt(
  question:    string,
  deadlineIso: string,
  sources:     string[]
): string {
  const minConfidence = cfgNum("ORACLE_MIN_CONFIDENCE");
  const sourceList    = sources.length > 0
    ? sources.map((s, i) => `${i + 1}. ${s}`).join("\n")
    : "No approved evidence package was available. Use only widely known public facts and return INCONCLUSIVE if the outcome cannot be established safely.";

  return `Market Question: "${question}"

Resolution Deadline: ${deadlineIso}

Resolution Criteria: The question resolves YES if the described event occurred before or by the deadline. It resolves NO if the event clearly did not occur. It resolves INCONCLUSIVE if insufficient evidence exists.

Approved evidence package:
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
- The approved evidence package above was fetched by Prophet's oracle source collector before this inference call.
- Treat the provided excerpts as checked evidence; do not return INCONCLUSIVE merely because you personally did not browse the web.
- Do not claim to have checked a source unless it appears in the approved evidence package.
- If the excerpts are inaccessible, contradictory, or do not answer the question, then return INCONCLUSIVE.
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

function buildAllocationPrompt(
  question: string,
  category: string,
  deadlineIso: string
): string {
  return `Prediction Market Question: "${question}"
Category: ${category || "custom"}
Market closes: ${deadlineIso}
Today's date: ${new Date().toISOString()}

Evaluate this market for protocol-owned liquidity allocation.

Respond with this exact JSON structure:
{
  "score": 62,
  "resolvability": 75,
  "demand": 55,
  "manipulationRisk": 30,
  "rationale": "One sentence explaining the allocation decision"
}

Rules:
- score, resolvability, demand, and manipulationRisk must be numbers from 0 to 100
- High manipulationRisk should reduce the final score
- Do not include text outside the JSON object`;
}
