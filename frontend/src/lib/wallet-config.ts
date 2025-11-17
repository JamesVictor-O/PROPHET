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
const celoSepolia = {
  id: 44787, // Celo Sepolia chain ID (frontend uses 44787, backend uses 11142220)
  name: "Celo Sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "Celo",
    symbol: "CELO",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.ankr.com/celo_sepolia"],
    },
  },
  blockExplorers: {
    default: {
      name: "Celo Sepolia Explorer",
      url: "https://sepolia.celoscan.io",
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
