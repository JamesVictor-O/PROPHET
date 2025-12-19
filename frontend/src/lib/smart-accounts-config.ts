import { createPublicClient, http, type Chain, type WalletClient } from "viem";
import {
  createBundlerClient,
  entryPoint07Address,
  type GetPaymasterDataParameters,
} from "viem/account-abstraction";
import { baseSepolia } from "viem/chains";
import { config } from "@/lib/wallet-config";

/**
 * Custom wallet client type for smart account initialization
 */
export type CustomWalletClient = WalletClient & {
  account: NonNullable<WalletClient["account"]>;
};

/* ────────────────────────────────────────────────────────────── */
/* ENV CONFIG                                                     */
/* ────────────────────────────────────────────────────────────── */

const BUNDLER_RPC_URL = process.env.NEXT_PUBLIC_BUNDLER_RPC_URL!;
const PIMLICO_API_KEY = process.env.NEXT_PUBLIC_PIMLICO_API_KEY!;
const PIMLICO_SPONSORSHIP_POLICY_ID =
  process.env.NEXT_PUBLIC_PIMLICO_SPONSORSHIP_POLICY_ID;

const BASE_SEPOLIA_USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

/**
 * Deploy salt used for deterministic smart account address derivation
 * This MUST be the same value used in smart-account-context.tsx
 */
export const SMART_ACCOUNT_DEPLOY_SALT =
  "0x0000000000000000000000000000000000000000000000000000000000000001";

/* ────────────────────────────────────────────────────────────── */
/* CHAIN + PUBLIC CLIENT                                          */
/* ────────────────────────────────────────────────────────────── */

export const smartAccountChain: Chain = baseSepolia;

export const publicClient = createPublicClient({
  chain: smartAccountChain,
  transport: http(),
});

/* ────────────────────────────────────────────────────────────── */
/* PIMLICO PAYMASTER (ONLY REAL DATA — NO STUBS)                  */
/* ────────────────────────────────────────────────────────────── */

async function getPimlicoPaymasterData(
  params: GetPaymasterDataParameters
): Promise<{
  paymaster: `0x${string}`;
  paymasterData: `0x${string}`;
  paymasterVerificationGasLimit: bigint;
  paymasterPostOpGasLimit: bigint;
}> {
  if (!PIMLICO_API_KEY) {
    throw new Error("Pimlico API key not configured");
  }

  const pimlicoRpc = `https://api.pimlico.io/v2/base-sepolia/rpc?apikey=${PIMLICO_API_KEY}`;

  // Build userOp for RPC (hex-encoded)
  const userOpForRpc = {
    sender: params.sender,
    nonce: `0x${params.nonce?.toString(16) ?? "0"}`,
    callData: params.callData,
    callGasLimit: `0x${params.callGasLimit?.toString(16) ?? "0"}`,
    verificationGasLimit: `0x${
      params.verificationGasLimit?.toString(16) ?? "0"
    }`,
    preVerificationGas: `0x${params.preVerificationGas?.toString(16) ?? "0"}`,
    maxFeePerGas: `0x${params.maxFeePerGas?.toString(16) ?? "0"}`,
    maxPriorityFeePerGas: `0x${
      params.maxPriorityFeePerGas?.toString(16) ?? "0"
    }`,
    signature:
      "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c",
  };

  // Sponsorship context
  const paymasterContext: {
    sponsorshipPolicyId?: string;
    token?: string;
  } = {};

  if (PIMLICO_SPONSORSHIP_POLICY_ID) {
    paymasterContext.sponsorshipPolicyId = PIMLICO_SPONSORSHIP_POLICY_ID;
  } else {
    paymasterContext.token = BASE_SEPOLIA_USDC;
  }

  const response = await fetch(pimlicoRpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "pm_sponsorUserOperation",
      params: [
        userOpForRpc,
        entryPoint07Address, // ✅ SINGLE SOURCE OF TRUTH
        paymasterContext,
      ],
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(`Pimlico paymaster error: ${data.error.message}`);
  }

  if (!data.result?.paymaster) {
    throw new Error("No paymaster returned from Pimlico");
  }

  return {
    paymaster: data.result.paymaster as `0x${string}`,
    paymasterData: (data.result.paymasterData ?? "0x") as `0x${string}`,
    paymasterVerificationGasLimit: BigInt(
      data.result.paymasterVerificationGasLimit
    ),
    paymasterPostOpGasLimit: BigInt(data.result.paymasterPostOpGasLimit),
  };
}

/* ────────────────────────────────────────────────────────────── */
/* BUNDLER CLIENT                                                 */
/* ────────────────────────────────────────────────────────────── */

export const bundlerClient = createBundlerClient({
  client: publicClient,
  transport: http(BUNDLER_RPC_URL),
  paymaster: {
    getPaymasterData: getPimlicoPaymasterData,
  },
});

/* ────────────────────────────────────────────────────────────── */
/* HELPERS                                                        */
/* ────────────────────────────────────────────────────────────── */

export function getPublicClient(chainId?: number) {
  if (!chainId) return publicClient;

  const chain = config.chains.find((c) => c.id === chainId);
  if (!chain) return publicClient;

  return createPublicClient({
    chain,
    transport: http(),
  });
}

export function getBundlerClient(chainId?: number) {
  if (!chainId) return bundlerClient;

  const client = getPublicClient(chainId);

  return createBundlerClient({
    client,
    transport: http(BUNDLER_RPC_URL),
    paymaster: {
      getPaymasterData: getPimlicoPaymasterData,
    },
  });
}

export function isPaymasterConfigured(): boolean {
  return Boolean(PIMLICO_API_KEY);
}
