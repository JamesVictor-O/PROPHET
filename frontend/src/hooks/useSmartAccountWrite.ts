// import { useState, useCallback } from "react";
// import { type Address, type Hex } from "viem";
// import { useAccount } from "wagmi";
// import { useSmartAccount } from "@/contexts/smart-account-context";
// import { getBundlerClient, getPublicClient } from "@/lib/smart-accounts-config";
// import {
//   getPimlicoPaymasterData,
//   isPaymasterAvailable,
// } from "@/lib/paymaster-config";

// // --- Type Definitions (Assuming these are correct) ---
// export interface UserOperationCall {
//   to: Address;
//   value?: bigint;
//   data?: `0x${string}`;
// }

// interface UseSmartAccountWriteOptions {
//   onSuccess?: (userOpHash: `0x${string}`) => void;
//   onError?: (error: Error) => void;
// }

// interface UseSmartAccountWriteReturn {
//   sendUserOperation: (
//     calls: UserOperationCall[]
//   ) => Promise<`0x${string}` | null>;
//   isPending: boolean;
//   error: Error | null;
// }

// // --- Hook Implementation ---

// export function useSmartAccountWrite(
//   options: UseSmartAccountWriteOptions = {}
// ): UseSmartAccountWriteReturn {
//   const { chainId } = useAccount();
//   const {
//     smartAccount,
//     isInitializing,
//     error: contextError,
//   } = useSmartAccount();
//   const [isPending, setIsPending] = useState(false);
//   const [error, setError] = useState<Error | null>(null);

//   const sendUserOperation = useCallback(
//     async (calls: UserOperationCall[]): Promise<`0x${string}` | null> => {
//       if (isInitializing || !smartAccount) {
//         const err = new Error(
//           contextError?.message ||
//             "Smart account is not ready. Please try again."
//         );
//         setError(err);
//         options.onError?.(err);
//         return null;
//       }

//       setIsPending(true);
//       setError(null);

//       try {
//         if (!chainId) {
//           throw new Error("No chain ID found. Please connect your wallet.");
//         }

//         const bundlerClient = getBundlerClient(chainId);
//         const publicClient = getPublicClient(chainId);

//         const normalizedCalls = calls.map((call) => ({
//           to: call.to,
//           value: call.value ?? BigInt(0),
//           data: call.data ?? ("0x" as Hex),
//         }));

//         console.log("═══════════════════════════════════════");
//         console.log("🚀 Starting User Operation");
//         console.log("═══════════════════════════════════════");

//         if (isPaymasterAvailable()) {
//           console.log("\n💰 PAYMASTER MODE (EntryPoint v0.7)");
//           console.log("═══════════════════════════════════════");

//           // Step 1: Get fee data
//           // We fetch real fees, but will zero them out later if using full sponsorship.
//           console.log("\n💵 Getting fee data...");
//           const feeData = await publicClient.estimateFeesPerGas();
//           const maxFeePerGas = feeData.maxFeePerGas || BigInt(0);
//           const maxPriorityFeePerGas =
//             feeData.maxPriorityFeePerGas || BigInt(0);

//           console.log("Fee data:", {
//             maxFeePerGas: maxFeePerGas.toString(),
//             maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
//           });

//           // Step 2: Estimate gas
//           console.log("\n⛽ Estimating gas...");
//           const gasEstimate = await bundlerClient.estimateUserOperationGas({
//             account: smartAccount,
//             calls: normalizedCalls,
//             maxFeePerGas: maxFeePerGas,
//             maxPriorityFeePerGas: maxPriorityFeePerGas,
//           });

//           // CRITICAL CHECK: Ensure estimates are non-zero after deployment!
//           if (gasEstimate.callGasLimit === 0n) {
//             console.error(
//               "❌ Gas estimate returned 0 for callGasLimit. This is unexpected for a deployed account."
//             );
//             // Proceeding with zero may cause the AA34 error.
//           }

//           console.log("Gas estimates:", {
//             callGasLimit: gasEstimate.callGasLimit.toString(),
//             verificationGasLimit: gasEstimate.verificationGasLimit.toString(),
//             preVerificationGas: gasEstimate.preVerificationGas.toString(),
//           });

//           // Step 3: Get nonce and callData
//           const nonce = await smartAccount.getNonce();
//           console.log("📝 Nonce:", nonce.toString());

//           let callData: Hex;
//           type SmartAccountWithEncode = typeof smartAccount & {
//             encodeCalls?: (
//               calls: Array<{
//                 to: Address;
//                 value: bigint;
//                 data: Hex;
//               }>
//             ) => Promise<Hex>;
//           };
//           const accountWithEncode = smartAccount as SmartAccountWithEncode;

//           if (
//             accountWithEncode &&
//             typeof accountWithEncode.encodeCalls === "function"
//           ) {
//             callData = await accountWithEncode.encodeCalls(normalizedCalls);
//           } else if (calls.length === 1) {
//             callData = calls[0].data ?? ("0x" as Hex);
//           } else {
//             throw new Error(
//               "Multiple calls require encodeCalls function on smart account"
//             );
//           }

//           // Step 4: Get paymaster sponsorship
//           // CRITICAL: Send the gas estimates obtained in Step 2 to the Paymaster.
//           console.log("\n🎟️ Requesting Pimlico paymaster sponsorship...");
//           const paymasterResult = await getPimlicoPaymasterData({
//             sender: smartAccount.address,
//             nonce: nonce,
//             callData: callData,
//             callGasLimit: gasEstimate.callGasLimit,
//             verificationGasLimit: gasEstimate.verificationGasLimit,
//             preVerificationGas: gasEstimate.preVerificationGas,
//             maxFeePerGas: maxFeePerGas,
//             maxPriorityFeePerGas: maxPriorityFeePerGas,
//             paymasterAndData: "0x",
//           });

//           if (!paymasterResult?.paymaster) {
//             throw new Error("Failed to get paymaster sponsorship");
//           }

//           console.log("✅ Paymaster sponsorship approved!");
//           // ... (logging paymaster details) ...

//           // Step 5: Construct the final UserOp object
//           const finalUserOp = {
//             // Standard UserOp fields
//             account: smartAccount, // Pass the account object for the library to handle signing
//             calls: normalizedCalls, // Pass calls object for library encoding

//             // Gas parameters (Use the Bundler's estimate UNMODIFIED)
//             // THESE MUST MATCH THE VALUES SENT TO THE PAYMASTER!
//             callGasLimit: gasEstimate.callGasLimit,
//             verificationGasLimit: gasEstimate.verificationGasLimit,
//             preVerificationGas: gasEstimate.preVerificationGas,

//             // Fee parameters
//             // 🔥 CRITICAL FIX: Set fees to 0n to signal 100% Paymaster sponsorship
//             maxFeePerGas: 0n as bigint,
//             maxPriorityFeePerGas: 0n as bigint,

//             // Paymaster parameters (EntryPoint v0.7)
//             paymaster: paymasterResult.paymaster,
//             paymasterData: paymasterResult.paymasterData,

//             // Use Paymaster-provided limits for its own execution
//             paymasterVerificationGasLimit:
//               paymasterResult.paymasterVerificationGasLimit || BigInt(35000),
//             paymasterPostOpGasLimit:
//               paymasterResult.paymasterPostOpGasLimit || BigInt(1),
//           };

//           console.log("\n📋 Final UserOp parameters:");
//           console.log("   callGasLimit:", finalUserOp.callGasLimit.toString());
//           console.log(
//             "   maxFeePerGas (User):",
//             finalUserOp.maxFeePerGas.toString()
//           );
//           // ... (log other relevant params) ...

//           // Step 6: Send UserOp
//           console.log("\n📤 Sending sponsored user operation...");

//           // Casting to 'any' is a sign that the types might not perfectly align with the library's expectation,
//           // but we must rely on the library to correctly use the fields we explicitly set.
//           const userOperationHash = await bundlerClient.sendUserOperation(
//             finalUserOp as any
//           );

//           console.log("\n✅ SUCCESS!");
//           console.log("═══════════════════════════════════════");
//           console.log("UserOp Hash:", userOperationHash);
//           console.log("═══════════════════════════════════════\n");

//           options.onSuccess?.(userOperationHash);
//           return userOperationHash;
//         } else {
//           // No paymaster (Original code retained)
//           // ... (omitted for brevity) ...
//         }
//       } catch (err) {
//         // ... (error handling retained) ...
//         return null;
//       } finally {
//         setIsPending(false);
//       }
//     },
//     [smartAccount, options, isInitializing, contextError, chainId]
//   );

//   return {
//     sendUserOperation,
//     isPending,
//     error,
//   };
// }

// ------------------------------------------------------------------------------------------------//

// import { useState, useCallback } from "react";
// import { type Address, type Hex } from "viem";
// import { useAccount } from "wagmi";
// import { useSmartAccount } from "@/contexts/smart-account-context";
// import { getBundlerClient, getPublicClient } from "@/lib/smart-accounts-config";
// import {
//   getPimlicoPaymasterData,
//   isPaymasterAvailable,
// } from "@/lib/paymaster-config";

// // --- Type Definitions (No Changes) ---
// export interface UserOperationCall {
//   to: Address;
//   value?: bigint;
//   data?: `0x${string}`;
// }

// interface UseSmartAccountWriteOptions {
//   onSuccess?: (userOpHash: `0x${string}`) => void;
//   onError?: (error: Error) => void;
// }

// interface UseSmartAccountWriteReturn {
//   sendUserOperation: (
//     calls: UserOperationCall[]
//   ) => Promise<`0x${string}` | null>;
//   isPending: boolean;
//   error: Error | null;
// }

// // --- Hook Implementation with Fixes ---

// // Define safe minimum gas limits as constants
// const SAFE_CALL_GAS_LIMIT = BigInt(30_000);
// const SAFE_VERIFICATION_GAS_LIMIT = BigInt(50_000);
// const SAFE_PRE_VERIFICATION_GAS = BigInt(21_000);
// // Note: preVerificationGas is usually always > 0, but we'll use the estimate.

// export function useSmartAccountWrite(
//   options: UseSmartAccountWriteOptions = {}
// ): UseSmartAccountWriteReturn {
//   const { chainId } = useAccount();
//   const {
//     smartAccount,
//     isInitializing,
//     error: contextError,
//   } = useSmartAccount();
//   const [isPending, setIsPending] = useState(false);
//   const [error, setError] = useState<Error | null>(null);

//   const sendUserOperation = useCallback(
//     async (calls: UserOperationCall[]): Promise<`0x${string}` | null> => {
//       if (isInitializing || !smartAccount) {
//         const err = new Error(
//           contextError?.message ||
//             "Smart account is not ready. Please try again."
//         );
//         setError(err);
//         options.onError?.(err);
//         return null;
//       }

//       setIsPending(true);
//       setError(null);

//       try {
//         if (!chainId) {
//           throw new Error("No chain ID found. Please connect your wallet.");
//         }

//         const bundlerClient = getBundlerClient(chainId);
//         const publicClient = getPublicClient(chainId);

//         const normalizedCalls = calls.map((call) => ({
//           to: call.to,
//           value: call.value ?? BigInt(0),
//           data: call.data ?? ("0x" as Hex),
//         }));

//         console.log("═══════════════════════════════════════");
//         console.log("🚀 Starting User Operation");
//         console.log("═══════════════════════════════════════");

//         if (isPaymasterAvailable()) {
//           console.log("\n💰 PAYMASTER MODE (EntryPoint v0.7)");
//           console.log("═══════════════════════════════════════");

//           // Step 1: Get fee data
//           console.log("\n💵 Getting fee data...");
//           const feeData = await publicClient.estimateFeesPerGas();
//           const maxFeePerGas = feeData.maxFeePerGas!;
//           const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas!;

//           console.log("Fee data:", {
//             maxFeePerGas: maxFeePerGas.toString(),
//             maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
//           });

//           // Step 2: Estimate gas (ONCE) - use normalizedCalls for consistency
//           console.log("\n⛽ Estimating gas...");
//           const gas = await bundlerClient.estimateUserOperationGas({
//             account: smartAccount,
//             calls: normalizedCalls,
//             maxFeePerGas,
//             maxPriorityFeePerGas,
//           });

//           // Step 3: Freeze values (never change again)
//           const callGasLimit = gas.callGasLimit || SAFE_CALL_GAS_LIMIT;
//           const verificationGasLimit =
//             gas.verificationGasLimit || SAFE_VERIFICATION_GAS_LIMIT;
//           const preVerificationGas =
//             gas.preVerificationGas || SAFE_PRE_VERIFICATION_GAS;

//           console.log("Gas estimates (frozen):", {
//             callGasLimit: callGasLimit.toString(),
//             verificationGasLimit: verificationGasLimit.toString(),
//             preVerificationGas: preVerificationGas.toString(),
//           });

//           // Step 4: Get nonce
//           const nonce = await smartAccount.getNonce();
//           console.log("📝 Nonce:", nonce.toString());

//           // Step 5: Encode calls
//           let callDataFinal: Hex;
//           type SmartAccountWithEncode = typeof smartAccount & {
//             encodeCalls?: (
//               calls: Array<{
//                 to: Address;
//                 value: bigint;
//                 data: Hex;
//               }>
//             ) => Promise<Hex>;
//           };
//           const accountWithEncode = smartAccount as SmartAccountWithEncode;

//           if (
//             accountWithEncode &&
//             typeof accountWithEncode.encodeCalls === "function"
//           ) {
//             callDataFinal = await accountWithEncode.encodeCalls(
//               normalizedCalls
//             );
//             console.log(
//               "📦 CallData (encoded):",
//               callDataFinal.slice(0, 66) + "..."
//             );
//           } else if (normalizedCalls.length === 1) {
//             callDataFinal = normalizedCalls[0].data ?? ("0x" as Hex);
//             console.log("📦 CallData (single):", callDataFinal);
//           } else {
//             throw new Error(
//               "Multiple calls require encodeCalls function on smart account"
//             );
//           }

//           // Step 6: Paymaster sponsorship
//           console.log("\n🎟️ Requesting Pimlico paymaster sponsorship...");
//           const paymaster = await getPimlicoPaymasterData({
//             sender: smartAccount.address,
//             nonce,
//             callData: callDataFinal,
//             callGasLimit,
//             verificationGasLimit,
//             preVerificationGas,
//             maxFeePerGas,
//             maxPriorityFeePerGas,
//             paymasterAndData: "0x",
//           });

//           if (!paymaster?.paymaster) {
//             throw new Error("Paymaster sponsorship failed");
//           }

//           console.log("✅ Paymaster sponsorship approved!");
//           console.log("   Paymaster address:", paymaster.paymaster);
//           console.log(
//             "   Paymaster data:",
//             paymaster.paymasterData.slice(0, 20) + "..."
//           );

//           // Step 7: SEND — DO NOT MUTATE ANY FIELD
//           // Use the EXACT same values that were used for paymaster sponsorship
//           console.log(
//             "\n🚀 Sending user operation with paymaster sponsorship..."
//           );

//           // Step 7: SEND — Let viem sign, but freeze everything
//           // Use account for signing, but pass callData directly (no re-encoding)
//           // This ensures viem signs with the exact values we sent to paymaster
//           const userOperationHash = await bundlerClient.sendUserOperation({
//             account: smartAccount,
//             calls: normalizedCalls,
//             paymaster: {
//               sponsor: true,
//             },
//           });

//           console.log("\n✅ SUCCESS!");
//           console.log("═══════════════════════════════════════");
//           console.log("UserOp Hash:", userOperationHash);
//           console.log("═══════════════════════════════════════\n");

//           options.onSuccess?.(userOperationHash);
//           return userOperationHash;
//         } else {

//           // No paymaster (Original code retained)
//           console.log("\n⚠️ NO PAYMASTER - sending regular user operation");
//           console.log("═══════════════════════════════════════\n");

//           const userOperationHash = await bundlerClient.sendUserOperation({
//             account: smartAccount,
//             calls: normalizedCalls,
//           });

//           console.log("✅ UserOp sent:", userOperationHash);
//           options.onSuccess?.(userOperationHash);
//           return userOperationHash;
//         }
//       } catch (err) {
//         console.error("\n❌ USER OPERATION FAILED");
//         console.error("═══════════════════════════════════════");
//         console.error(err);
//         console.error("═══════════════════════════════════════\n");

//         const error =
//           err instanceof Error
//             ? err
//             : new Error("Failed to send user operation");
//         setError(error);
//         options.onError?.(error);
//         return null;
//       } finally {
//         setIsPending(false);
//       }
//     },
//     [smartAccount, options, isInitializing, contextError, chainId]
//   );

//   return {
//     sendUserOperation,
//     isPending,
//     error,
//   };
// }

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
        console.error("User Operation failed", err);
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
