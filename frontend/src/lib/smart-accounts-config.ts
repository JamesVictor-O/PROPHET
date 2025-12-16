import { createPublicClient, http, type Chain, type WalletClient } from "viem";
import { createBundlerClient } from "viem/account-abstraction";
import { baseSepolia } from "viem/chains";

/**
 * Custom wallet client type for smart account initialization
 */
export type CustomWalletClient = WalletClient & {
  account: NonNullable<WalletClient["account"]>;
};

const BUNDLER_RPC_URL =
  process.env.NEXT_PUBLIC_BUNDLER_RPC_URL // Base Sepolia bundler

export const smartAccountChain: Chain = baseSepolia;

export const publicClient = createPublicClient({
  chain: smartAccountChain,
  transport: http(),
});

export const bundlerClient = createBundlerClient({
  client: publicClient,
  transport: http(BUNDLER_RPC_URL),
});

export function getBundlerClient() {
  return bundlerClient;
}

export function getPublicClient() {
  return publicClient;
}
