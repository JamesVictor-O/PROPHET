import { useState, useCallback } from "react";
import { type Address, type Hex } from "viem";
import { useAccount } from "wagmi";
import { useSmartAccount } from "@/contexts/smart-account-context";
import { getBundlerClient, getPublicClient } from "@/lib/smart-accounts-config";
import {
  getPimlicoPaymasterData,
  isPaymasterAvailable,
} from "@/lib/paymaster-config";

export interface UserOperationCall {
  to: Address;
  value?: bigint;
  data?: `0x${string}`;
}

interface UseSmartAccountWriteOptions {
  onSuccess?: (userOpHash: `0x${string}`) => void;
  onError?: (error: Error) => void;
}

interface UseSmartAccountWriteReturn {
  sendUserOperation: (
    calls: UserOperationCall[]
  ) => Promise<`0x${string}` | null>;
  isPending: boolean;
  error: Error | null;
}

// Safe minimums in case gas estimates fail
const SAFE_CALL_GAS_LIMIT = BigInt(30_000);
const SAFE_VERIFICATION_GAS_LIMIT = BigInt(50_000);
const SAFE_PRE_VERIFICATION_GAS = BigInt(21_000);

export function useSmartAccountWrite(
  options: UseSmartAccountWriteOptions = {}
): UseSmartAccountWriteReturn {
  const { chainId } = useAccount();
  const {
    smartAccount,
    isInitializing,
    error: contextError,
  } = useSmartAccount();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendUserOperation = useCallback(
    async (calls: UserOperationCall[]): Promise<`0x${string}` | null> => {
      if (isInitializing || !smartAccount) {
        const err = new Error(
          contextError?.message || "Smart account not ready."
        );
        setError(err);
        options.onError?.(err);
        return null;
      }

      if (!chainId) {
        const err = new Error("No chain ID found. Connect your wallet.");
        setError(err);
        options.onError?.(err);
        return null;
      }

      setIsPending(true);
      setError(null);

      try {
        const bundlerClient = getBundlerClient(chainId);
        const publicClient = getPublicClient(chainId);

        // Normalize calls
        const normalizedCalls = calls.map((c) => ({
          to: c.to,
          value: c.value ?? BigInt(0),
          data: c.data ?? ("0x" as Hex),
        }));

        // Estimate fees
        const feeData = await publicClient.estimateFeesPerGas();
        const maxFeePerGas = feeData.maxFeePerGas || BigInt(0);
        const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || BigInt(0);

        // Estimate gas
        const gasEstimate = await bundlerClient.estimateUserOperationGas({
          account: smartAccount,
          calls: normalizedCalls,
          maxFeePerGas,
          maxPriorityFeePerGas,
        });

        const callGasLimit = gasEstimate.callGasLimit || SAFE_CALL_GAS_LIMIT;
        const verificationGasLimit =
          gasEstimate.verificationGasLimit || SAFE_VERIFICATION_GAS_LIMIT;
        const preVerificationGas =
          gasEstimate.preVerificationGas || SAFE_PRE_VERIFICATION_GAS;

        // Get nonce
        const nonce = await smartAccount.getNonce();

        // Encode calls
        let callData: Hex;
        if (
          "encodeCalls" in smartAccount &&
          typeof smartAccount.encodeCalls === "function"
        ) {
          callData = await smartAccount.encodeCalls(normalizedCalls);
        } else if (normalizedCalls.length === 1) {
          callData = normalizedCalls[0].data;
        } else {
          throw new Error(
            "Multiple calls require encodeCalls function on smart account."
          );
        }

        // Setup paymaster (if available)
        let paymasterConfig:
          | {
              getPaymasterData: (params: {
                sender: Address;
                callData: Hex;
                nonce: bigint;
                callGasLimit: bigint;
                verificationGasLimit: bigint;
                preVerificationGas: bigint;
                maxFeePerGas: bigint;
                maxPriorityFeePerGas: bigint;
              }) => Promise<{
                paymaster: Address;
                paymasterData: Hex;
                paymasterVerificationGasLimit?: bigint;
                paymasterPostOpGasLimit?: bigint;
              }>;
            }
          | undefined = undefined;
        if (isPaymasterAvailable()) {
          paymasterConfig = {
            getPaymasterData: async ({
              sender,
              callData,
              nonce,
              callGasLimit,
              verificationGasLimit,
              preVerificationGas,
              maxFeePerGas,
              maxPriorityFeePerGas,
            }: {
              sender: Address;
              callData: Hex;
              nonce: bigint;
              callGasLimit: bigint;
              verificationGasLimit: bigint;
              preVerificationGas: bigint;
              maxFeePerGas: bigint;
              maxPriorityFeePerGas: bigint;
            }) => {
              const pm = await getPimlicoPaymasterData({
                sender,
                nonce,
                callData,
                callGasLimit,
                verificationGasLimit,
                preVerificationGas,
                maxFeePerGas,
                maxPriorityFeePerGas,
                paymasterAndData: "0x",
              });
              if (!pm) {
                throw new Error("Failed to get paymaster data");
              }
              return {
                paymaster: pm.paymaster,
                paymasterData: pm.paymasterData,
                paymasterVerificationGasLimit: pm.paymasterVerificationGasLimit,
                paymasterPostOpGasLimit: pm.paymasterPostOpGasLimit,
              };
            },
          };
        }

        // Send User Operation
        // ✅ Use account for signing, but pass callData directly (no re-encoding)
        // ❌ DO NOT pass calls (would cause re-encoding)
        const userOpHash = await bundlerClient.sendUserOperation({
          account: smartAccount,
          callData, // Pass callData directly (frozen from paymaster request)
          callGasLimit,
          verificationGasLimit,
          preVerificationGas,
          maxFeePerGas,
          maxPriorityFeePerGas,
          paymaster: paymasterConfig,
        } as Parameters<typeof bundlerClient.sendUserOperation>[0]);

        options.onSuccess?.(userOpHash);
        return userOpHash;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("User operation failed");
        setError(error);
        options.onError?.(error);
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [smartAccount, options, isInitializing, contextError, chainId]
  );

  return { sendUserOperation, isPending, error };
}
