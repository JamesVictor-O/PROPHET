export const CONTRACTS = {
  baseSepolia: {
    factory: "0x1cF71f7e4a5e79B2bEd17655eb22E31422d9A3f1",
    oracle: "0x7b99147Fbcc797713357D29EAeF5e7bB5d8BA018",
    reputationSystem: "0xD763b4dC216B84C378aeAFD007166609F6F1f62C",
    predictionMarket: "0x1d06d3fDb2e9DC1bD870A26198559237640Ce310",
    cUSD: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // USDC on Base Sepolia testnet
    chainId: 84532, // Base Sepolia chain ID
    explorer: "https://sepolia.basescan.org",
  },
  celoSepolia: {
    factory: "0x8376D1Ba26B481A730c78f3aEe658dEa17595f71",
    oracle: "0x474F99826c16008BB20cF2365aB66ac1b66A9313",
    reputationSystem: "0x6C8Dc0D7d9812Da01c38456202E4cee23675D99B",
    predictionMarket: "0x684DFe6Dcee60974529A8838D1ce02f8dc3ACD8b",
    cUSD: "0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b",
    chainId: 11142220,
    explorer: "https://sepolia.celoscan.xyz",
  },
  celoMainnet: {
    factory: "0xE47ADCF70C55447998EC4615b952796C3a57f5B0",
    oracle: "0x388fd6555193d80e0b9Cd3752D422b6D02dbA286",
    reputationSystem: "0x8F23259B62A37b520E8A87D2cc0e20a1d1873717",
    predictionMarket: "0x1d35D91b4BbF312717e9f9B675351B1b520cb096",
    cUSD: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
    chainId: 42220,
    explorer: "https://explorer.celo.org",
  },
  baseMainnet: {
    factory: "0x0B51348AB44895539A22832A1E49eD11C648bE35",
    oracle: "0x2F94149647D5167859131E0f905Efe9E09EAC9C5",
    reputationSystem: "0xfe155C98757879dD24fF20447bf1E9E7E0e421d1",
    predictionMarket: "0xc4b9aA01fF29ee4b0D86Cd68a3B4393Ee30BfAdc", // Single contract for all markets
    cUSD: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    chainId: 8453, // Base Mainnet chain ID
    explorer: "https://basescan.org",
  },
} as const;

export type Network = keyof typeof CONTRACTS;

export function getContracts(network: Network = "baseSepolia") {
  return CONTRACTS[network];
}

export function getContractAddress(
  contractName:
    | "factory"
    | "oracle"
    | "reputationSystem"
    | "predictionMarket"
    | "cUSD",
  network?: Network
): string {
  const targetNetwork = network || "baseSepolia";

  return CONTRACTS[targetNetwork][contractName];
}
