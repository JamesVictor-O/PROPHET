export const CONTRACTS = {
  celoSepolia: {
    factory: "0x3eCAB9356cf8cD23940d0A59A3c3eE1497Ac4C4f",
    oracle: "0x217129a6a9CA7CD2A0dbB42e4c9B93b7b2809f09",
    reputationSystem: "0x01D9654C521e955A1Ef98B8A5FdAbC5976Dc5B50",
    cUSD: "0xEF4d55D6dE8e8d73232827Cd1e9b2F2dBb45bC80", // Celo Sepolia cUSD
    chainId: 44787,
    explorer: "https://sepolia.celoscan.io",
  },
  celoMainnet: {
    // Update after mainnet deployment
    factory: "",
    oracle: "",
    reputationSystem: "",
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
  contractName: "factory" | "oracle" | "reputationSystem" | "cUSD",
  network: Network = "celoSepolia"
): string {
  return CONTRACTS[network][contractName];
}
