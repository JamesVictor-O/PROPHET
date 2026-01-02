export { useContractRead, useContractWrite } from "./useContract";

export {
  useMarketFactory,
  useMarketCount,
  useMarketAddress,
  useAllMarketIds,
  useCreateMarket,
  useCreateBinaryMarket,
  useCreateCrowdWisdomMarket,
  useGrantDelegation,
  useRevokeDelegation,
  useHasDelegation,
} from "./useMarketFactory";

export {
  useReputationSystem,
  useUsername,
  useIsUsernameAvailable,
  useSetUsername,
  useUserStats,
  useTopUsers,
} from "./useReputationSystem";

export { useLeaderboard } from "./useLeaderboard";
export type { LeaderboardEntry } from "./useLeaderboard";

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
  useMaxStakePerUser,
} from "./usePredictionMarket";

export { useAllMarkets } from "./useAllMarkets";
export type { MarketInfo } from "./useAllMarkets";

export { useUserPredictions } from "./useUserPredictions";
export type { UserPrediction } from "./useUserPredictions";

export { useCUSDAllowance, useApproveCUSD } from "./useERC20";
