export const CONTRACTS = {
  celoSepolia: {
    factory: "0xEe608D11EfEC619Df33ff571c80FAad704037f75",
    oracle: "0xa33bE09908844118B4420387F3DbeCBc86Bf1604",
    reputationSystem: "0xe3C4Ba993d7b07EF7771D6061fC9928C1fAEc89B",
    predictionMarket: "0xe38b7cD2Ac963b89d41bD3e14681252e95ef3eDe", // Single contract for all markets
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
