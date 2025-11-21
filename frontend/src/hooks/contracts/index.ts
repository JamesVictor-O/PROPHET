/**
 * Contract hooks
 * Clean, reusable hooks for smart contract interactions
 */

// Base hooks
export { useContractRead, useContractWrite } from "./useContract";

// Factory hooks
export {
  useMarketFactory,
  useMarketCount,
  useMarketAddress,
  useAllMarketIds,
  useCreateMarket,
  useCreateBinaryMarket,
  useCreateCrowdWisdomMarket,
} from "./useMarketFactory";

// ReputationSystem hooks
export {
  useReputationSystem,
  useUsername,
  useIsUsernameAvailable,
  useSetUsername,
  useUserStats,
  useTopUsers,
} from "./useReputationSystem";

// Leaderboard hooks
export { useLeaderboard } from "./useLeaderboard";
export type { LeaderboardEntry } from "./useLeaderboard";

// PredictionMarket hooks
export {
  usePredictionMarket,
  useMarketDetails,
  useIsResolved,
  usePoolAmounts,
  useUserPrediction,
  useOdds,
  usePotentialWinnings,
  useFees,
  usePredict,
  useCommentAndStake,
  useStakeOnOutcome,
  useMarketOutcomes,
  useOutcomeLabel,
  useOutcomeOdds,
  useUserOutcomeStake,
  useOutcomePoolAmount,
  useClaimPayout,
  useHasClaimed,
  usePredictionCount,
} from "./usePredictionMarket";

// All markets hook
export { useAllMarkets } from "./useAllMarkets";
export type { MarketInfo } from "./useAllMarkets";

// User predictions hook
export { useUserPredictions } from "./useUserPredictions";
export type { UserPrediction } from "./useUserPredictions";

// ERC20 hooks
export { useCUSDAllowance, useApproveCUSD } from "./useERC20";
