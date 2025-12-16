"use client";

import { useState, useCallback } from "react";
import { type Address } from "viem";
import { useSmartAccount } from "@/contexts/smart-account-context";
import { bundlerClient } from "@/lib/smart-accounts-config";
import { parseUnits } from "viem";

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
  sendUserOperation: (calls: UserOperationCall[]) => Promise<`0x${string}` | null>;
  isPending: boolean;
  error: Error | null;
}

/**
 * Hook for sending user operations through a smart account
 * 
 * This hook provides a clean interface for sending transactions via smart accounts.
 * It handles gas estimation and user operation submission.
 * 
 * @example
 * ```tsx
 * const { sendUserOperation, isPending } = useSmartAccountWrite({
 *   onSuccess: (hash) => console.log("User op hash:", hash),
 *   onError: (error) => console.error("Error:", error),
 * });
 * 
 * // Send a transaction
 * await sendUserOperation([
 *   {
 *     to: "0x...",
 *     value: parseEther("0.1"),
 *     data: "0x..."
 *   }
 * ]);
 * ```
 */
export function useSmartAccountWrite(
  options: UseSmartAccountWriteOptions = {}
): UseSmartAccountWriteReturn {
  const { smartAccount } = useSmartAccount();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendUserOperation = useCallback(
    async (calls: UserOperationCall[]): Promise<`0x${string}` | null> => {
      if (!smartAccount) {
        const err = new Error("Smart account not initialized");
        setError(err);
        options.onError?.(err);
        return null;
      }

      setIsPending(true);
      setError(null);

      try {
        // Estimate appropriate fee per gas
        // Note: These values should be dynamically estimated based on the bundler
        // For now, using minimal values - you should implement proper gas estimation
        const maxFeePerGas = 1n;
        const maxPriorityFeePerGas = 1n;

        // Send user operation through bundler
        const userOperationHash = await bundlerClient.sendUserOperation({
          account: smartAccount,
          calls: calls.map((call) => ({
            to: call.to,
            value: call.value ?? 0n,
            data: call.data ?? "0x",
          })),
          maxFeePerGas,
          maxPriorityFeePerGas,
        });

        options.onSuccess?.(userOperationHash);
        return userOperationHash;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to send user operation");
        setError(error);
        options.onError?.(error);
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [smartAccount, options]
  );

  return {
    sendUserOperation,
    isPending,
    error,
  };
}


