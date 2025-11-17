export const CONTRACTS = {
  celoSepolia: {
    factory: "0x2fA51E32203B6C1A5a0bB84AE6bf1f8faA6B96b5",
    oracle: "0xf7aD63d0478aC4aAF5929CB07F3078412088d237",
    reputationSystem: "0x757E92F1CfD400732943854E8526Cfb3CA5351Ca",
    predictionMarket: "0xd1156ADA06e7ffa1a253C5c3b9302a7394650DeC", // Single contract for all markets
    cUSD: "0xEF4d55D6dE8e8d73232827Cd1e9b2F2dBb45bC80", // Celo Sepolia cUSD
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
