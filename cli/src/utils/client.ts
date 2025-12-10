import {
  createWalletClient,
  createPublicClient,
  http,
  type Address,
  type WalletClient,
  type PublicClient,
  defineChain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { getContracts } from "../config/contracts.js";

let walletClient: WalletClient | null = null;
let publicClient: PublicClient | null = null;
let chain: ReturnType<typeof defineChain> | null = null;

export function getClients() {
  if (walletClient && publicClient && chain) {
    return { walletClient, publicClient, chain };
  }

  let privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error(
      "PRIVATE_KEY is not set in environment variables. Please check your .env file."
    );
  }

  // Normalize private key: ensure it starts with 0x
  if (!privateKey.startsWith("0x")) {
    privateKey = `0x${privateKey}`;
  }

  // Remove any whitespace
  privateKey = privateKey.trim();

  const contracts = getContracts();

  // Define Celo Mainnet chain
  const celoMainnet = defineChain({
    id: 42220,
    name: "Celo",
    network: "celo",
    nativeCurrency: {
      decimals: 18,
      name: "CELO",
      symbol: "CELO",
    },
    rpcUrls: {
      default: {
        http: [contracts.rpcUrl],
      },
      public: {
        http: [contracts.rpcUrl],
      },
    },
    blockExplorers: {
      default: {
        name: "Celo Explorer",
        url: contracts.explorer,
      },
    },
  });

  // Create custom chain config for Celo Mainnet
  const finalChain = {
    ...celoMainnet,
    id: contracts.chainId,
    rpcUrls: {
      default: {
        http: [contracts.rpcUrl],
      },
      public: {
        http: [contracts.rpcUrl],
      },
    },
  };

  const account = privateKeyToAccount(privateKey as `0x${string}`);

  walletClient = createWalletClient({
    account,
    chain: finalChain,
    transport: http(contracts.rpcUrl),
  });

  publicClient = createPublicClient({
    chain: finalChain,
    transport: http(contracts.rpcUrl),
  });

  chain = finalChain;
  return { walletClient, publicClient, chain };
}

export async function getAccountAddress(): Promise<Address> {
  const { walletClient } = getClients();
  if (!walletClient.account) {
    throw new Error("Wallet client account is not initialized");
  }
  return walletClient.account.address;
}
