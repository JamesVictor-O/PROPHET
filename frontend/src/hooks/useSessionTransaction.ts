"use client";

import { useState, useCallback } from "react";
import { useSessionAccount } from "@/providers/SessionAccountProvider";
import { usePermissions } from "@/providers/PermissionProvider";
import { useSmartAccount } from "@/contexts/smart-account-context";
import { bundlerClient } from "@/services/bundlerClient";
import { useChainId } from "wagmi";
import { encodeFunctionData, type Abi } from "viem";

interface TransactionCall {
  to: `0x${string}`;
  value?: bigint;
  data?: `0x${string}`;
}

interface UseSessionTransactionReturn {
  canUseSessionTransaction: boolean;
  isPermissionValid: boolean;
  executeSessionTransaction: (calls: TransactionCall[]) => Promise<{
    success: boolean;
    hash?: string;
    error?: string;
  }>;
  encodeContractCall: (params: {
    abi: Abi;
    functionName: string;
    args: readonly unknown[];
    to: `0x${string}`;
    value?: bigint;
  }) => TransactionCall;
  isExecuting: boolean;
  error: string | null;
}

// Helper to safely log objects with BigInt
const safeStringify = (obj: any): string => {
  return JSON.stringify(
    obj,
    (key, value) => (typeof value === "bigint" ? value.toString() : value),
    2
  );
};

export function useSessionTransaction(): UseSessionTransactionReturn {
  const { sessionSmartAccount, sessionSmartAccountAddress, sessionKeyAddress } =
    useSessionAccount();
  const { permission, isPermissionValid } = usePermissions();
  const { smartAccount: userSmartAccount, smartAccountAddress } =
    useSmartAccount();
  const chainId = useChainId();

  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUseSessionTransaction = !!(
    sessionSmartAccount &&
    sessionSmartAccountAddress &&
    sessionKeyAddress &&
    userSmartAccount &&
    smartAccountAddress &&
    permission &&
    isPermissionValid() &&
    chainId
  );

  const encodeContractCall = useCallback(
    (params: {
      abi: Abi;
      functionName: string;
      args: readonly unknown[];
      to: `0x${string}`;
      value?: bigint;
    }): TransactionCall => ({
      to: params.to,
      value: params.value ?? 0n,
      data: encodeFunctionData(params as any),
    }),
    []
  );

  const executeSessionTransaction = useCallback(
    async (calls: TransactionCall[]) => {
      if (!canUseSessionTransaction) {
        return {
          success: false,
          error: "Session transaction not available or permission expired.",
        };
      }

      if (
        !sessionSmartAccount ||
        !sessionSmartAccountAddress ||
        !sessionKeyAddress
      ) {
        return {
          success: false,
          error: "Session smart account or key not initialized",
        };
      }

      if (!userSmartAccount || !smartAccountAddress) {
        return { success: false, error: "User smart account not initialized" };
      }

      if (!permission?.context) {
        return { success: false, error: "Permission context not found" };
      }

      setIsExecuting(true);
      setError(null);

      try {
        const client = bundlerClient();

        // Safe logging with BigInt values
        console.log("🚀 Executing session transaction...");
        console.log("Session Account:", sessionSmartAccountAddress);
        console.log("Smart Account:", smartAccountAddress);
        console.log("Number of calls:", calls.length);
        console.log("Calls:", safeStringify(calls));

        // Execute transaction using ERC-7715 delegation
        // @ts-expect-error - Type mismatch with extended client
        const userOpHash = await client.sendUserOperationWithDelegation({
          account: sessionSmartAccount,
          calls: calls.map((call) => ({
            to: call.to,
            value: call.value ?? 0n,
            data: call.data ?? "0x",
          })),
          permissionsContext: permission.context,
          delegationManager: {
            delegator: smartAccountAddress,
            delegate: sessionSmartAccountAddress,
          },
        });

        console.log("UserOp Hash:", userOpHash);

        // Wait for receipt
        const receipt = await client.waitForUserOperationReceipt({
          hash: userOpHash,
          timeout: 120_000,
        });

        console.log(
          "✅ Session transaction confirmed:",
          receipt.receipt.transactionHash
        );

        return { success: true, hash: receipt.receipt.transactionHash };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("❌ Session transaction failed:", message);

        // Log full error details safely
        if (err instanceof Error && err.stack) {
          console.error("Stack trace:", err.stack);
        }

        setError(message);
        return { success: false, error: message };
      } finally {
        setIsExecuting(false);
      }
    },
    [
      canUseSessionTransaction,
      sessionSmartAccount,
      sessionSmartAccountAddress,
      sessionKeyAddress,
      userSmartAccount,
      smartAccountAddress,
      permission,
      chainId,
    ]
  );

  return {
    canUseSessionTransaction,
    isPermissionValid: isPermissionValid(),
    executeSessionTransaction,
    encodeContractCall,
    isExecuting,
    error,
  };
}
