// Import ABIs from frontend
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to frontend ABIs (relative to cli directory)
const FRONTEND_ABIS_PATH = join(__dirname, "../../../frontend/src/lib/abis");

export function getABI(contractName: string): any[] {
  try {
    const abiPath = join(FRONTEND_ABIS_PATH, `${contractName}.json`);
    const abiFile = readFileSync(abiPath, "utf-8");
    const abiJson = JSON.parse(abiFile);
    return abiJson.abi || abiJson;
  } catch (error) {
    throw new Error(`Failed to load ABI for ${contractName}: ${error}`);
  }
}

export const MarketFactoryABI = () => getABI("MarketFactory");
export const PredictionMarketABI = () => getABI("PredictionMarket");
export const ReputationSystemABI = () => getABI("ReputationSystem");
export const OracleABI = () => getABI("Oracle");
