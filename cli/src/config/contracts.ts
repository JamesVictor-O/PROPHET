import { getAddress } from "viem";

export interface ContractConfig {
  factory: `0x${string}`;
  predictionMarket: `0x${string}`;
  oracle: `0x${string}`;
  reputationSystem: `0x${string}`;
  paymentToken: `0x${string}`;
  rpcUrl: string;
  chainId: number;
  explorer: string;
}

export function getContracts(): ContractConfig {
  // Celo Mainnet default addresses (Latest deployment with $0.0025 minimum stake)
  const factory =
    process.env.MARKET_FACTORY || "0xE47ADCF70C55447998EC4615b952796C3a57f5B0";
  const predictionMarket =
    process.env.PREDICTION_MARKET ||
    "0x1d35D91b4BbF312717e9f9B675351B1b520cb096";
  const oracle =
    process.env.ORACLE || "0x388fd6555193d80e0b9Cd3752D422b6D02dbA286";
  const reputationSystem =
    process.env.REPUTATION_SYSTEM ||
    "0x8F23259B62A37b520E8A87D2cc0e20a1d1873717";
  const paymentToken =
    process.env.PAYMENT_TOKEN || "0x765DE816845861e75A25fCA122bb6898B8B1282a"; // cUSD on Celo Mainnet
  const rpcUrl = process.env.RPC_URL || "https://forno.celo.org";
  const chainId = parseInt(process.env.CHAIN_ID || "42220", 10);
  const explorer = process.env.EXPLORER || "https://explorer.celo.org";

  if (
    !factory ||
    !predictionMarket ||
    !oracle ||
    !reputationSystem ||
    !paymentToken
  ) {
    throw new Error(
      "Missing contract addresses in environment variables. Please check your .env file."
    );
  }

  return {
    factory: getAddress(factory),
    predictionMarket: getAddress(predictionMarket),
    oracle: getAddress(oracle),
    reputationSystem: getAddress(reputationSystem),
    paymentToken: getAddress(paymentToken),
    rpcUrl,
    chainId,
    explorer,
  };
}
