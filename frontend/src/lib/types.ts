/**
 * Contract types matching Solidity enums and structs
 */

// MarketType enum - matches IPredictionMarket.MarketType
export enum MarketType {
  Binary = 0, // Yes/No markets
  CrowdWisdom = 1, // User-defined outcome markets
}

// MarketStatus enum - matches IPredictionMarket.MarketStatus
export enum MarketStatus {
  Active = 0,
  Resolved = 1,
  Cancelled = 2,
}

// Outcome enum - matches IPredictionMarket.Outcome (for Binary markets)
export enum Outcome {
  Yes = 0,
  No = 1,
}

// Market struct - matches IPredictionMarket.Market
export interface MarketStruct {
  id: bigint;
  marketType: MarketType;
  question: string;
  category: string;
  creator: string;
  yesPool: bigint; // For Binary markets
  noPool: bigint; // For Binary markets
  totalPool: bigint;
  endTime: bigint;
  status: MarketStatus;
  winningOutcome: Outcome; // For Binary markets (Yes/No)
  winningOutcomeIndex: bigint; // For CrowdWisdom markets (outcome index)
  resolved: boolean;
  outcomeCount: bigint; // For CrowdWisdom markets
}

// Prediction struct - matches IPredictionMarket.Prediction
export interface PredictionStruct {
  user: string;
  side: Outcome; // For Binary markets (Yes/No)
  outcomeIndex: bigint; // For CrowdWisdom markets (0, 1, 2...)
  amount: bigint;
  timestamp: bigint;
}
