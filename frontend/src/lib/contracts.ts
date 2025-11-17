export const CONTRACTS = {
  celoSepolia: {
    factory: "0x51535762f7Fd1886ADaF6f82e5BacAEcf2D22f34",
    oracle: "0x5ca009564018ac4eb6D2B41FC455f9a505118df5",
    reputationSystem: "0xC46b51268B9BD8a8190B2106354415B58CF34787",
    predictionMarket: "0x0E4830E472F90B7C2Fa271206A07B5Cc36f940bF", // Single contract for all markets
    cUSD: "0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b", // Celo Sepolia cUSD
    chainId: 11142220, // Celo Sepolia chain ID (EIP-155 format) - matches deployed contracts
    explorer: "https://celo-sepolia.blockscout.com",
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
