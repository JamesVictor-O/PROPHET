/* TypeScript file generated from Entities.res by genType. */

/* eslint-disable */
/* tslint:disable */

export type id = string;

export type whereOperations<entity,fieldType> = { readonly eq: (_1:fieldType) => Promise<entity[]>; readonly gt: (_1:fieldType) => Promise<entity[]> };

export type GlobalStats_t = {
  readonly id: id; 
  readonly totalMarkets: bigint; 
  readonly totalPredictions: bigint; 
  readonly totalResolved: bigint; 
  readonly totalUsers: bigint; 
  readonly totalVolume: bigint
};

export type GlobalStats_indexedFieldOperations = {};

export type Market_t = {
  readonly category: string; 
  readonly createdAt: bigint; 
  readonly creator: string; 
  readonly endTime: bigint; 
  readonly id: id; 
  readonly marketId: bigint; 
  readonly marketType: bigint; 
  readonly noPool: bigint; 
  readonly predictionCount: bigint; 
  readonly question: string; 
  readonly resolved: boolean; 
  readonly resolvedAt: (undefined | bigint); 
  readonly status: string; 
  readonly totalPool: bigint; 
  readonly winningOutcome: (undefined | bigint); 
  readonly winningOutcomeIndex: (undefined | bigint); 
  readonly yesPool: bigint
};

export type Market_indexedFieldOperations = {};

export type MarketFactory_OwnershipTransferred_t = {
  readonly id: id; 
  readonly newOwner: string; 
  readonly previousOwner: string
};

export type MarketFactory_OwnershipTransferred_indexedFieldOperations = {};

export type Prediction_t = {
  readonly amount: bigint; 
  readonly claimed: boolean; 
  readonly id: id; 
  readonly marketId: bigint; 
  readonly outcomeIndex: bigint; 
  readonly side: bigint; 
  readonly timestamp: bigint; 
  readonly user: string
};

export type Prediction_indexedFieldOperations = {};

export type PredictionMarket_MarketCreated_t = {
  readonly category: string; 
  readonly creator: string; 
  readonly endTime: bigint; 
  readonly id: id; 
  readonly marketId: bigint; 
  readonly question: string
};

export type PredictionMarket_MarketCreated_indexedFieldOperations = {};

export type PredictionMarket_MarketResolved_t = {
  readonly id: id; 
  readonly marketId: bigint; 
  readonly totalPayout: bigint; 
  readonly winningOutcome: bigint; 
  readonly winningOutcomeIndex: bigint
};

export type PredictionMarket_MarketResolved_indexedFieldOperations = {};

export type PredictionMarket_PayoutClaimed_t = {
  readonly amount: bigint; 
  readonly id: id; 
  readonly marketId: bigint; 
  readonly user: string
};

export type PredictionMarket_PayoutClaimed_indexedFieldOperations = {};

export type PredictionMarket_PredictionMade_t = {
  readonly amount: bigint; 
  readonly id: id; 
  readonly marketId: bigint; 
  readonly outcomeIndex: bigint; 
  readonly side: bigint; 
  readonly user: string
};

export type PredictionMarket_PredictionMade_indexedFieldOperations = {};

export type ReputationSystem_ReputationUpdated_t = {
  readonly id: id; 
  readonly newScore: bigint; 
  readonly streak: bigint; 
  readonly user: string
};

export type ReputationSystem_ReputationUpdated_indexedFieldOperations = {};

export type ReputationSystem_UsernameSet_t = {
  readonly id: id; 
  readonly user: string; 
  readonly username: string
};

export type ReputationSystem_UsernameSet_indexedFieldOperations = {};

export type User_t = {
  readonly address: string; 
  readonly bestStreak: bigint; 
  readonly correctPredictions: bigint; 
  readonly currentStreak: bigint; 
  readonly id: id; 
  readonly reputationScore: bigint; 
  readonly totalPredictions: bigint; 
  readonly totalStaked: bigint; 
  readonly totalWinnings: bigint; 
  readonly username: (undefined | string)
};

export type User_indexedFieldOperations = {};
