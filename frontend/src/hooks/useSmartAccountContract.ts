"use client";

import { useCallback } from "react";
import { type Address, encodeFunctionData, parseUnits } from "viem";
import { useSmartAccount } from "@/contexts/smart-account-context";
import { useSmartAccountWrite } from "./useSmartAccountWrite";
import { useAccount } from "wagmi";

interface ContractCall {
  address: Address;
  abi: readonly unknown[];
  functionName: string;
  args?: readonly unknown[];
  value?: bigint;
}


export function useSmartAccountContract(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const { smartAccount, isInitializing } = useSmartAccount();
  const { isConnected } = useAccount();
  const { sendUserOperation, isPending, error } = useSmartAccountWrite({
    onSuccess: () => {
      options?.onSuccess?.();
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });

  const sendContractCall = useCallback(
    async (call: ContractCall): Promise<`0x${string}` | null> => {
      if (!isConnected) {
        const err = new Error("Wallet not connected");
        options?.onError?.(err);
        return null;
      }

      if (isInitializing) {
        const err = new Error("Smart account is initializing");
        options?.onError?.(err);
        return null;
      }

      if (!smartAccount) {
        const err = new Error(
          "Smart account not available. Please ensure your wallet is connected."
        );
        options?.onError?.(err);
        return null;
      }

      try {
        // Encode the function call
        const data = encodeFunctionData({
          abi: call.abi as readonly unknown[],
          functionName: call.functionName,
          args: call.args,
        });

        // Send as user operation
        const hash = await sendUserOperation([
          {
            to: call.address,
            data: data as `0x${string}`,
            value: call.value ?? BigInt(0),
          },
        ]);

        return hash;
      } catch (err) {
        const error =
          err instanceof Error
            ? err
            : new Error("Failed to send contract call");
        options?.onError?.(error);
        return null;
      }
    },
    [smartAccount, isConnected, isInitializing, sendUserOperation, options]
  );

  return {
    sendContractCall,
    isPending,
    error,
    isInitializing,
    isAvailable: !!smartAccount && !isInitializing,
  };
}
