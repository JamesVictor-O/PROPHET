// ─────────────────────────────────────────────────────────────────────────────
// Shared TypeScript types for Prophet oracle + market-maker agents
// ─────────────────────────────────────────────────────────────────────────────

// ── Oracle ────────────────────────────────────────────────────────────────────

/**
 * Structured response returned by the 0G Compute oracle inference call.
 * The LLM must return valid JSON matching this shape exactly.
 */
export interface OracleResponse {
  /** true = YES outcome, false = NO outcome, null = INCONCLUSIVE */
  verdict: boolean | null;
  /** 0–100 confidence score */
  confidence: number;
  /** Full reasoning chain — stored permanently on 0G Storage Log layer */
  reasoning: string;
  /** One-line evidence summary for frontend display */
  evidenceSummary: string;
  /** Data sources actually checked during inference */
  sourcesChecked: string[];
  /** Only present when verdict is null */
  inconclusiveReason?: string;
}

/**
 * Market metadata stored in 0G Storage KV layer by ProphetFactory event listener.
 * Key: market:{contractAddress}:metadata
 */
export interface MarketMetadata {
  contractAddress: string;
  question:        string;
  deadline:        number;    // unix timestamp
  category:        string;
  sources:         string[];  // approved resolution sources
  status:          MarketStatusString;
  createdAt:       number;    // unix timestamp
  createdByTx:     string;
}

export type MarketStatusString =
  | "Pending"
  | "Open"
  | "PendingResolution"
  | "Challenged"
  | "Resolved"
  | "Cancelled"
  | "Archived";

/**
 * Live price state stored in 0G Storage KV layer by the market maker.
 * Key: market:{contractAddress}:prices
 */
export interface MarketPrices {
  yesPrice:    number;   // 0–100 (cents on the dollar)
  noPrice:     number;   // 0–100
  lastUpdated: number;   // unix timestamp
  volume24h:   string;   // USDT string "1234.56"
}

/**
 * Oracle working memory — written during multi-step inference.
 * Key: agent:oracle:working:{contractAddress}
 */
export interface OracleWorkingState {
  stage:            "started" | "gathering" | "inferring" | "posting" | "done";
  evidenceGathered: string[];
  sourcesChecked:   string[];
  startedAt:        number;
}

/**
 * Permanent resolution record stored in 0G Storage Log layer.
 * Key: market:{contractAddress}:resolution
 */
export interface ResolutionRecord {
  verdict:          boolean | null;
  confidence:       number;
  reasoning:        string;
  evidenceSummary:  string;
  sourcesChecked:   string[];
  inconclusiveReason?: string;
  timestamp:        number;
  txHash:           string;
  computeProvider:  string;
}

/**
 * Market maker state stored in 0G Storage KV.
 * Key: agent:mm:state
 */
export interface MarketMakerState {
  activeMarkets: Array<{
    address:  string;
    yesPrice: number;
    noPrice:  number;
    tier:     LiquidityTierString;
  }>;
  lastRun: number;
}

export type LiquidityTierString = "Seed" | "Low" | "Medium" | "High";

// ── Market Maker pricing ──────────────────────────────────────────────────────

/**
 * Structured response from the market maker 0G Compute pricing call.
 */
export interface PricingResponse {
  /** YES probability estimate, 1–99 (never 0 or 100 — always two-sided) */
  yesProbability: number;
  /** One-line rationale for the pricing */
  rationale: string;
}

// ── Chain events ──────────────────────────────────────────────────────────────

export interface MarketCreatedEvent {
  marketAddress:        string;
  creator:              string;
  question:             string;
  deadline:             bigint;
  category:             string;
  resolutionSourcesHash: string;
  marketIndex:          bigint;
}

export interface ResolutionTriggeredEvent {
  market:    string;
  timestamp: bigint;
}

export interface ResolutionChallengedEvent {
  market:         string;
  challenger:     string;
  challengeStake: bigint;
}

export interface ResolutionFinalizedEvent {
  market:    string;
  outcome:   boolean;
  timestamp: bigint;
}
