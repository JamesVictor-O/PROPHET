/**
 * Contract ABIs
 * Auto-generated from Foundry compiled contracts
 */

import ReputationSystemABI from "./ReputationSystem.json";
import MarketFactoryABI from "./MarketFactory.json";
import OracleABI from "./Oracle.json";
import PredictionMarketABI from "./PredictionMarket.json";

// Extract the abi array from JSON files (Foundry outputs { abi: [...], ... })
const getABI = (json: any) => (json.abi ? json.abi : json);

export const ReputationSystemABI_export = getABI(ReputationSystemABI);
export const MarketFactoryABI_export = getABI(MarketFactoryABI);
export const OracleABI_export = getABI(OracleABI);
export const PredictionMarketABI_export = getABI(PredictionMarketABI);

export {
  ReputationSystemABI_export as ReputationSystemABI,
  MarketFactoryABI_export as MarketFactoryABI,
  OracleABI_export as OracleABI,
  PredictionMarketABI_export as PredictionMarketABI,
};

export const ABIS = {
  ReputationSystem: ReputationSystemABI_export,
  MarketFactory: MarketFactoryABI_export,
  Oracle: OracleABI_export,
  PredictionMarket: PredictionMarketABI_export,
} as const;
