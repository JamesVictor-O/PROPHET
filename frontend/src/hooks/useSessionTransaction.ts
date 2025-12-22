"use client";

import { useState, useCallback } from "react";
import { useSessionAccount } from "@/providers/SessionAccountProvider";
import { usePermissions } from "@/providers/PermissionProvider";
import { bundlerClient } from "@/services/bundlerClient";
import { pimlicoClient } from "@/services/pimlicoClient";
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
const safeStringify = (obj: unknown): string => {
  return JSON.stringify(
    obj,
    (key, value) => (typeof value === "bigint" ? value.toString() : value),
    2
  );
};

export function useSessionTransaction(): UseSessionTransactionReturn {
  const { sessionSmartAccount, sessionSmartAccountAddress } =
    useSessionAccount();
  const { permission, isPermissionValid } = usePermissions();
  const chainId = useChainId();

  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUseSessionTransaction = !!(
    sessionSmartAccount &&
    sessionSmartAccountAddress &&
    permission &&
    isPermissionValid() &&
    permission.signerMeta?.delegationManager &&
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
      value: params.value ?? BigInt(0),
      data: encodeFunctionData({
        abi: params.abi,
        functionName: params.functionName,
        args: params.args,
      }),
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

      if (!sessionSmartAccount || !sessionSmartAccountAddress) {
        return {
          success: false,
          error: "Session account not initialized",
        };
      }

      if (!permission?.context) {
        return { success: false, error: "Permission context not found" };
      }

      const { signerMeta } = permission;
      const delegationManager = signerMeta?.delegationManager;

      if (!delegationManager) {
        return {
          success: false,
          error: "Delegation manager not found in permission",
        };
      }

      setIsExecuting(true);
      setError(null);

      try {
        const client = bundlerClient();

        // Get gas prices from Pimlico
        const { fast: fee } = await pimlicoClient(
          chainId!
        ).getUserOperationGasPrice();

        // Verify sessionSmartAccount is a proper SmartAccount instance
        // It should have: address, version, entryPoint, getNonce, encodeCalls, signUserOperation
        if (!sessionSmartAccount) {
          throw new Error("Session smart account is null");
        }

        // Verify required SmartAccount properties exist
        const hasRequiredProps =
          sessionSmartAccount.address &&
          typeof sessionSmartAccount.getNonce === "function" &&
          typeof sessionSmartAccount.encodeCalls === "function" &&
          typeof sessionSmartAccount.signUserOperation === "function";

        if (!hasRequiredProps) {
          throw new Error(
            "Session account is not a proper SmartAccount instance. Missing required methods."
          );
        }

        // Safe logging with BigInt values
        console.log("🚀 Executing session transaction...");
        console.log("Session Account:", sessionSmartAccountAddress);
        console.log("Account Type:", sessionSmartAccount.constructor.name);
        console.log(
          "Has getNonce:",
          typeof sessionSmartAccount.getNonce === "function"
        );
        console.log(
          "Has encodeCalls:",
          typeof sessionSmartAccount.encodeCalls === "function"
        );
        console.log(
          "Has signUserOperation:",
          typeof sessionSmartAccount.signUserOperation === "function"
        );
        console.log("Number of calls:", calls.length);
        console.log("Calls:", safeStringify(calls));

        // Execute transaction using ERC-7715 delegation
        //
        // CRITICAL ARCHITECTURE NOTES:
        // 1. We use the REAL sessionSmartAccount (MetaMaskSmartAccount) - NOT a virtual/fake account
        //    - sessionSmartAccount is created via toMetaMaskSmartAccount() in SessionAccountProvider
        //    - It has all required metadata: version, entryPoint, factoryArgs, etc.
        //    - viem can call account.version, account.entryPoint.version, etc. safely
        // 2. We NEVER override signUserOperation - sendUserOperationWithDelegation handles it internally
        // 3. permissionsContext and delegationManager go at TOP level, not inside calls
        // 4. delegationManager comes from permission.signerMeta.delegationManager (Gator account info)
        // 5. The session account is a REAL smart account, so it passes validateUserOp (no AA23 errors)
        //
        // Type assertion needed - delegation properties are added by erc7710BundlerActions
        const userOpHash = await (
          client as unknown as {
            sendUserOperationWithDelegation: (args: {
              account: typeof sessionSmartAccount;
              calls: Array<{
                to: `0x${string}`;
                value: bigint;
                data: `0x${string}`;
              }>;
              permissionsContext: string;
              delegationManager: typeof delegationManager;
              maxFeePerGas: bigint;
              maxPriorityFeePerGas: bigint;
            }) => Promise<`0x${string}`>;
          }
        ).sendUserOperationWithDelegation({
          account: sessionSmartAccount, // ✅ REAL MetaMaskSmartAccount - has version, entryPoint, etc.
          calls: calls.map((call) => ({
            to: call.to,
            value: call.value ?? BigInt(0),
            data: call.data ?? "0x",
          })),
          permissionsContext: permission.context, // ✅ At TOP level
          delegationManager, // ✅ At TOP level (from permission response)
          ...fee,
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
