/**
 * Set-and-Forget Prediction Strategy Types
 *
 * This module defines the types for automated prediction strategies
 * that leverage ERC-7715 permissions to automatically place predictions.
 */

export type StrategyStatus = "active" | "paused" | "completed" | "cancelled";

export type StrategyTrigger =
  | "new_market" // Trigger on new markets matching criteria
  | "odds_threshold" // Trigger when odds reach threshold
  | "pool_size" // Trigger when pool reaches size
  | "time_based"; // Trigger at specific time

export type MarketCategory =
  | "all"
  | "sports"
  | "politics"
  | "tech"
  | "entertainment"
  | "music"
  | "movies"
  | "reality-tv"
  | "awards"
  | "other";

export type PredictionSide = "yes" | "no" | "auto"; // auto = AI decides

export interface StrategyCondition {
  type: StrategyTrigger;
  // For odds_threshold
  minYesPercent?: number;
  maxYesPercent?: number;
  // Contrarian strategy: if YES > threshold, stake NO (and vice versa)
  contrarian?: boolean;
  contrarianThreshold?: number; // Default: 80% for YES, 20% for NO
  // For pool_size
  minPoolSize?: number; // in USDC/cUSD
  // For time_based
  triggerTime?: string; // ISO timestamp
  // For new_market
  categories?: MarketCategory[];
  keywords?: string[]; // Keywords to match in market question
  // For trending markets
  topTrending?: number;
}

export interface StrategyAction {
  stakeAmount: number; // Amount in USDC/cUSD
  side: PredictionSide;
  maxStakePerMarket?: number; // Max total stake across all predictions on same market
  minConfidence?: number; // AI confidence threshold (0-100)
}

export interface StrategyLimits {
  maxTotalStake?: number; // Total budget for this strategy
  maxPredictionsPerDay?: number;
  maxPredictionsPerMarket?: number;
  expiryDate?: string; // ISO timestamp - strategy expires
}

export interface PredictionStrategy {
  id: string;
  name: string;
  description?: string;
  status: StrategyStatus;
  createdAt: string;
  updatedAt: string;

  // Conditions that trigger the strategy
  conditions: StrategyCondition[];

  // Actions to take when triggered
  action: StrategyAction;

  // Limits and safety constraints
  limits?: StrategyLimits;

  // Statistics
  stats?: {
    totalPredictions: number;
    totalStaked: number;
    successfulPredictions: number;
    totalWinnings: number;
    lastExecuted?: string;
  };

  // AI-specific settings
  aiSettings?: {
    useAI: boolean; // Use AI to decide yes/no when side is "auto"
    confidenceThreshold: number; // Minimum AI confidence (0-100)
    model?: string; // AI model to use
  };
}

export interface StrategyExecution {
  id: string;
  strategyId: string;
  marketId: number;
  marketQuestion: string;
  side: "yes" | "no";
  stakeAmount: number;
  timestamp: string;
  status: "pending" | "success" | "failed";
  txHash?: string;
  error?: string;
  aiConfidence?: number;
  reason?: string; // Why this prediction was made
}
