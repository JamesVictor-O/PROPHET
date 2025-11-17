import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";

// Celo Mainnet
const celo = {
  id: 42220,
  name: "Celo",
  nativeCurrency: {
    decimals: 18,
    name: "Celo",
    symbol: "CELO",
  },
  rpcUrls: {
    default: {
      http: ["https://forno.celo.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Celo Explorer",
      url: "https://explorer.celo.org",
    },
  },
} as const;

// Celo Sepolia Testnet
// NOTE: Contracts are deployed on chain ID 11142220 (EIP-155 format)
// This is the correct chain ID where the contracts exist
const celoSepolia = {
  id: 11142220, // Celo Sepolia chain ID (EIP-155 format) - matches deployed contracts
  name: "Celo Sepolia Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Celo",
    symbol: "CELO",
  },
  rpcUrls: {
    default: {
      http: ["https://forno.celo-sepolia.celo-testnet.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Celo Sepolia Explorer",
      url: "https://celo-sepolia.blockscout.com",
    },
  },
} as const;

// Celo network configuration
export const config = createConfig({
  chains: [celoSepolia, celo], // Sepolia first as default
  connectors: [
    injected(), // MiniPay will be detected automatically
  ],
  transports: {
    [celoSepolia.id]: http(),
    [celo.id]: http(),
  },
});

// Default chain (Celo Sepolia for testing)
export const defaultChain = celoSepolia;

// MiniPay detection
export function isMiniPayAvailable(): boolean {
  if (typeof window === "undefined") return false;

  // Check if we're in Opera browser with MiniPay
  const isOpera = /OPR|OPX|Opera/.test(navigator.userAgent);
  const hasEthereum = typeof window.ethereum !== "undefined";

  // MiniPay typically exposes itself via window.ethereum
  return isOpera && hasEthereum;
}

// Get formatted address
export function formatAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Format cUSD amount
export function formatCurrency(
  amount: string | number,
  decimals: number = 2
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Add Celo Sepolia network to MetaMask
 * This function programmatically adds the network if it doesn't exist
 * Uses chain ID 11142220 (EIP-155 format) to match deployed contracts
 */
export async function addCeloSepoliaToMetaMask(): Promise<boolean> {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    return false;
  }

  const ethereum = (window as any).ethereum;
  const chainIdHex = `0x${celoSepolia.id.toString(16)}`; // Convert to hex (0xAA147C = 11142220)

  try {
    await ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: chainIdHex,
          chainName: "Celo Sepolia Testnet",
          nativeCurrency: {
            name: "CELO",
            symbol: "CELO",
            decimals: 18,
          },
          rpcUrls: ["https://forno.celo-sepolia.celo-testnet.org"],
          blockExplorerUrls: ["https://celo-sepolia.blockscout.com"],
        },
      ],
    });
    return true;
  } catch (error: unknown) {
    console.error("Error adding network to MetaMask:", error);
    const err = error as { code?: number };
    // Error code 4902 means the network already exists
    if (err?.code === 4902) {
      // Try to switch to it instead
      try {
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: chainIdHex }],
        });
        return true;
      } catch (switchError) {
        console.error("Error switching network:", switchError);
        return false;
      }
    }
    return false;
  }
}
