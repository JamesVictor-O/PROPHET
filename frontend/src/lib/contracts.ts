export const CONTRACTS = {
  celoSepolia: {
    factory: "0x8376D1Ba26B481A730c78f3aEe658dEa17595f71",
    oracle: "0x474F99826c16008BB20cF2365aB66ac1b66A9313",
    reputationSystem: "0x6C8Dc0D7d9812Da01c38456202E4cee23675D99B",
    predictionMarket: "0x684DFe6Dcee60974529A8838D1ce02f8dc3ACD8b", // Single contract for all markets
    cUSD: "0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b", // Celo Sepolia cUSD
    chainId: 11142220, // Celo Sepolia chain ID (EIP-155 format) - matches deployed contracts
    explorer: "https://sepolia.celoscan.xyz",
  },
  celoMainnet: {
    factory: "0xE47ADCF70C55447998EC4615b952796C3a57f5B0",
    oracle: "0x388fd6555193d80e0b9Cd3752D422b6D02dbA286",
    reputationSystem: "0x8F23259B62A37b520E8A87D2cc0e20a1d1873717",
    predictionMarket: "0x1d35D91b4BbF312717e9f9B675351B1b520cb096", // Single contract for all markets
    cUSD: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
    chainId: 42220,
    explorer: "https://explorer.celo.org",
  },
  baseMainnet: {
    factory: "0x0B51348AB44895539A22832A1E49eD11C648bE35",
    oracle: "0x2F94149647D5167859131E0f905Efe9E09EAC9C5",
    reputationSystem: "0xfe155C98757879dD24fF20447bf1E9E7E0e421d1",
    predictionMarket: "0xc4b9aA01fF29ee4b0D86Cd68a3B4393Ee30BfAdc", // Single contract for all markets
    cUSD: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base Mainnet
    chainId: 8453, // Base Mainnet chain ID
    explorer: "https://basescan.org",
  },
} as const;

export type Network = keyof typeof CONTRACTS;

/**
 * Get contract addresses for a specific network
 */
export function getContracts(network: Network = "celoMainnet") {
  return CONTRACTS[network];
}

/**
 * Get contract address by name
 */
export function getContractAddress(
  contractName:
    | "factory"
    | "oracle"
    | "reputationSystem"
    | "predictionMarket"
    | "cUSD",
  network: Network = "celoMainnet"
): string {
  return CONTRACTS[network][contractName];
}
