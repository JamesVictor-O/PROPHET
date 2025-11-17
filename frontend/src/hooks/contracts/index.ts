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
} from "./useMarketFactory";

// ReputationSystem hooks
export {
  useReputationSystem,
  useUsername,
  useIsUsernameAvailable,
  useSetUsername,
  useUserStats,
} from "./useReputationSystem";

// PredictionMarket hooks
export {
  usePredictionMarket,
  useMarketDetails,
  useIsResolved,
  usePoolAmounts,
} from "./usePredictionMarket";

// All markets hook
export { useAllMarkets } from "./useAllMarkets";
export type { MarketInfo } from "./useAllMarkets";
