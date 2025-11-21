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
    // Update after mainnet deployment
    factory: "",
    oracle: "",
    reputationSystem: "",
    predictionMarket: "",
    cUSD: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
    chainId: 42220,
    explorer: "https://explorer.celo.org",
  },
} as const;

export type Network = keyof typeof CONTRACTS;

/**
 * Get contract addresses for a specific network
 */
export function getContracts(network: Network = "celoSepolia") {
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
  network: Network = "celoSepolia"
): string {
  return CONTRACTS[network][contractName];
}
