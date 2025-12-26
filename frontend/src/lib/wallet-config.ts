import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { baseSepolia } from "viem/chains";

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

const celoSepolia = {
  id: 11142220,
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
  chains: [celo, celoSepolia, baseSepolia],
  connectors: [injected()],
  transports: {
    [celo.id]: http(),
    [celoSepolia.id]: http(),
    [baseSepolia.id]: http(),
  },
});

// Default chain (Base Sepolia for Smart Accounts)
export const defaultChain = baseSepolia;

export function isMiniPayAvailable(): boolean {
  if (typeof window === "undefined") return false;

  // Check if we're in Opera browser with MiniPay
  const isOpera = /OPR|OPX|Opera/.test(navigator.userAgent);
  const hasEthereum = typeof window.ethereum !== "undefined";

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
  if (
    typeof window === "undefined" ||
    !(window as { ethereum?: unknown }).ethereum
  ) {
    return false;
  }

  const ethereum = (
    window as {
      ethereum: {
        request: (args: {
          method: string;
          params: unknown[];
        }) => Promise<unknown>;
      };
    }
  ).ethereum;
  const chainIdHex = `0x${celoSepolia.id.toString(16)}`;

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

    if (err?.code === 4902) {
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

/**
 * Add Base Sepolia network to MetaMask and switch to it
 * This is required for smart account functionality
 */
export async function addBaseSepoliaToMetaMask(): Promise<boolean> {
  if (
    typeof window === "undefined" ||
    !(window as { ethereum?: unknown }).ethereum
  ) {
    return false;
  }

  const ethereum = (
    window as {
      ethereum: {
        request: (args: {
          method: string;
          params: unknown[];
        }) => Promise<unknown>;
      };
    }
  ).ethereum;
  const chainIdHex = `0x${baseSepolia.id.toString(16)}`;

  try {
    // Try to switch first (network might already be added)
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
    return true;
  } catch (switchError: unknown) {
    const err = switchError as { code?: number };

    // If network doesn't exist (code 4902), add it
    if (err?.code === 4902) {
      try {
        await ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: chainIdHex,
              chainName: "Base Sepolia",
              nativeCurrency: {
                name: "Ether",
                symbol: "ETH",
                decimals: 18,
              },
              rpcUrls: [
                process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || "https://base-sepolia.g.alchemy.com/v2/demo",
                "https://sepolia.base.org",
                "https://base-sepolia-rpc.publicnode.com",
              ],
              blockExplorerUrls: ["https://sepolia.basescan.org"],
            },
          ],
        });
        return true;
      } catch (addError) {
        console.error("Error adding Base Sepolia to MetaMask:", addError);
        return false;
      }
    }
    console.error("Error switching to Base Sepolia:", switchError);
    return false;
  }
}
