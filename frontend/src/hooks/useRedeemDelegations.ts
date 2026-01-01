"use client";

import { useCallback } from "react";
import { useSessionAccount } from "@/providers/SessionAccountProvider";
import { usePermissions } from "@/providers/PermissionProvider";
import {
  useChainId,
  usePublicClient,
  useAccount,
  useWalletClient,
} from "wagmi";
import {
  createWalletClient,
  http,
  type Address,
  parseUnits,
  parseEther,
} from "viem";
import { encodeFunctionData, type Abi } from "viem";
import {
  redeemDelegations,
  createExecution,
  ExecutionMode,
} from "@metamask/smart-accounts-kit";
import { decodePermissionContexts } from "@metamask/smart-accounts-kit/utils";
import { defaultChain } from "@/lib/wallet-config";
import { getContractAddress } from "@/lib/contracts";
import { bundlerClient } from "@/services/bundlerClient";
import { pimlicoClient } from "@/services/pimlicoClient";

// ERC-20 ABI for transfer function
const ERC20_ABI = [
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
    stateMutability: "nonpayable",
  },
] as const;

interface RedeemDelegationsCall {
  to: `0x${string}`;
  value?: bigint;
  data?: `0x${string}`;
  abi?: Abi;
  functionName?: string;
  args?: readonly unknown[];
}

interface UseRedeemDelegationsReturn {
  canUseRedeem: boolean;
  redeemWithUSDCTransfer: (params: {
    usdcAmount: string;
    tokenDecimals: number;
    recipient?: Address; // If not provided, uses session account address
    contractCalls: RedeemDelegationsCall[];
  }) => Promise<{
    success: boolean;
    hash?: string;
    error?: string;
  }>;
}

/**
 * Hook to use redeemDelegations with automatic USDC transfer
 * This allows transferring USDC from EOA to session account (or contract)
 * and executing contract calls in a single transaction
 */
export function useRedeemDelegations(): UseRedeemDelegationsReturn {
  const { sessionKey, sessionSmartAccountAddress, sessionSmartAccount } =
    useSessionAccount();
  const { permission, isPermissionValid } = usePermissions();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { address: userAddress } = useAccount();
  const { data: walletClient } = useWalletClient();

  const canUseRedeem = !!(
    sessionKey &&
    sessionSmartAccountAddress &&
    permission &&
    isPermissionValid() &&
    permission.signerMeta?.delegationManager &&
    chainId &&
    publicClient
  );

  const redeemWithUSDCTransfer = useCallback(
    async (params: {
      usdcAmount: string;
      tokenDecimals: number;
      recipient?: Address;
      contractCalls: RedeemDelegationsCall[];
    }) => {
      if (!canUseRedeem) {
        return {
          success: false,
          error: "Redeem not available or permission expired.",
        };
      }

      if (!sessionKey || !sessionSmartAccountAddress) {
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

      if (!publicClient) {
        return {
          success: false,
          error: "Public client not available",
        };
      }

      try {
        // IMPORTANT: We need to check ETH balance for the session key EOA because:
        // 1. `redeemDelegations()` is a REGULAR transaction (not UserOperation) → needs ETH
        // 2. `sendUserOperationWithDelegation()` is a UserOperation → uses paymaster (no ETH needed)
        //
        // The session key EOA needs ETH to pay for the redeemDelegations transaction.
        // The paymaster only covers the UserOperation that comes after.

        const sessionKeyBalance = await publicClient.getBalance({
          address: sessionKey.address, // Session key EOA (not Smart Account)
        });

        const estimatedGas = BigInt(200000);
        const feeData = await publicClient
          .estimateFeesPerGas()
          .catch(() => null);
        const maxFeePerGas = feeData?.maxFeePerGas ?? BigInt(20000000000);
        const estimatedGasCost = estimatedGas * maxFeePerGas;
        const requiredBalance = estimatedGasCost + estimatedGasCost / BigInt(5);

        if (sessionKeyBalance < requiredBalance) {
          const balanceEth = Number(sessionKeyBalance) / 1e18;
          const requiredEth = Number(requiredBalance) / 1e18;

          if (walletClient && userAddress) {
            try {
              console.log(
                "💰 Auto-funding session key EOA for redeemDelegations transaction..."
              );

              const fundingAmount = parseEther("0.0001"); // 0.0001 ETH

              const fundingTxHash = await walletClient.sendTransaction({
                to: sessionKey.address,
                value: fundingAmount,
              });

              console.log("✅ Funding transaction sent:", fundingTxHash);
              console.log("⏳ Waiting for funding transaction to confirm...");

              await publicClient.waitForTransactionReceipt({
                hash: fundingTxHash,
              });

              console.log(
                "✅ Session key EOA funded successfully! Continuing with redeemDelegations..."
              );
            } catch (fundingError) {
              const fundingMessage =
                fundingError instanceof Error
                  ? fundingError.message
                  : String(fundingError);
              console.error(
                "❌ Failed to auto-fund session key EOA:",
                fundingMessage
              );

              return {
                success: false,
                error: `Session key EOA needs ETH for gas. Please send ~0.0001 ETH to ${sessionKey.address} to pay for the redeemDelegations transaction. Note: The UserOperation step uses paymaster and doesn't need ETH.`,
              };
            }
          } else {
            return {
              success: false,
              error: `Session key EOA needs ETH for gas. Current: ${balanceEth.toFixed(
                6
              )} ETH. Required: ${requiredEth.toFixed(6)} ETH. Send ETH to: ${
                sessionKey.address
              }`,
            };
          }
        }

        // Get token address
        const tokenAddress = getContractAddress("cUSD") as Address;
        const usdcAmountWei = parseUnits(
          params.usdcAmount,
          params.tokenDecimals
        );
        const recipient = params.recipient || sessionSmartAccountAddress;

        // Get RPC URL
        // NOTE: This MUST be a real http(s) URL. If someone accidentally puts a token/string
        // (e.g. a News API token) into NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL, viem will try to POST
        // JSON-RPC to that string and you'll see HTTP 405 errors.
        const isHttpUrl = (value: unknown): value is string => {
          if (typeof value !== "string") return false;
          return value.startsWith("http://") || value.startsWith("https://");
        };

        let rpcUrl = publicClient.chain?.rpcUrls.default.http[0];
        if (chainId === 84532 || chainId === 8453) {
          const baseSepoliaRpcUrls = [
            process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL,
            "https://base-sepolia-rpc.publicnode.com",
            "https://base-sepolia.g.alchemy.com/v2/demo",
            rpcUrl,
          ].filter(isHttpUrl);
          rpcUrl = baseSepoliaRpcUrls[0];
        }

        if (!rpcUrl) {
          throw new Error("RPC URL not found for chain");
        }

        const sessionWalletClient = createWalletClient({
          account: sessionKey,
          chain: defaultChain,
          transport: http(rpcUrl, {
            timeout: 10000,
            retryCount: 2,
            retryDelay: 1000,
          }),
        });

        // Build USDC transfer execution (executes FROM user's account via DelegationManager)
        const transferCallData = encodeFunctionData({
          abi: ERC20_ABI,
          functionName: "transfer",
          args: [recipient, usdcAmountWei],
        });

        const usdcTransferExecution = createExecution({
          target: tokenAddress,
          value: BigInt(0),
          callData: transferCallData,
        });

        // Decode permission context
        const decodedContexts = decodePermissionContexts([
          permission.context as `0x${string}`,
        ]);
        const [permissionContext] = decodedContexts;

        console.log("🔄 Redeeming delegation with USDC transfer...", {
          usdcAmount: params.usdcAmount,
          usdcAmountWei: usdcAmountWei.toString(),
          recipient,
          note: "Transfers from user's account via DelegationManager",
        });

        // Redeem delegation - executes FROM user's account
        const txHash = await redeemDelegations(
          sessionWalletClient,
          publicClient,
          delegationManager as `0x${string}`,
          [
            {
              permissionContext: permissionContext,
              executions: [usdcTransferExecution],
              mode: ExecutionMode.SingleDefault,
            },
          ]
        );

        console.log("✅ Redeem transaction sent:", txHash);

        // Wait for receipt
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        console.log("✅ USDC transfer confirmed:", receipt.transactionHash);

        // Step 7: If contract calls were provided, execute them using session account
        // The session account now has USDC, so we can execute contract calls
        if (params.contractCalls && params.contractCalls.length > 0) {
          console.log("🔄 Executing contract calls after USDC transfer...");

          // Wait for the block to be mined and nonce to update
          // This ensures the blockchain state is fully updated before the next transaction
          console.log("⏳ Waiting for block confirmation and nonce update...");
          await new Promise((resolve) => setTimeout(resolve, 3000));

          // Get fresh block number to ensure state is updated
          const currentBlock = await publicClient.getBlockNumber();
          console.log("✅ Current block:", currentBlock.toString());

          // Additional wait to ensure nonce is propagated
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Execute contract calls using session smart account
          // The session account now has USDC, so it can execute the calls
          if (!sessionSmartAccount) {
            throw new Error(
              "Session smart account not available for contract calls"
            );
          }

          const client = bundlerClient();
          const { fast: fee } = await pimlicoClient(
            chainId!
          ).getUserOperationGasPrice();

          // Build calls for session account execution
          const sessionCalls = params.contractCalls.map((call) => {
            let callData = call.data;
            if (call.abi && call.functionName && call.args) {
              callData = encodeFunctionData({
                abi: call.abi,
                functionName: call.functionName,
                args: call.args,
              });
            }
            const result = {
              to: call.to,
              value: call.value ?? BigInt(0),
              data: callData as `0x${string}`,
            };
            console.log("📋 Contract call:", {
              to: result.to,
              functionName: call.functionName,
              dataPreview: result.data.slice(0, 20) + "...",
            });
            return result;
          });

          console.log(
            `📦 Executing ${sessionCalls.length} contract calls from session account...`
          );

          // Execute using sendUserOperationWithDelegation with retry logic for nonce issues
          let userOpHash: `0x${string}` | undefined;
          let retries = 0;
          const maxRetries = 3;

          while (retries < maxRetries) {
            try {
              // Wait a bit longer on retries to ensure nonce is updated
              if (retries > 0) {
                console.log(
                  `🔄 Retry ${retries}/${maxRetries} - waiting for nonce update...`
                );
                await new Promise((resolve) =>
                  setTimeout(resolve, 3000 * retries)
                );


                const freshBlock = await publicClient.getBlockNumber();
                console.log("✅ Fresh block:", freshBlock.toString());
              }

              userOpHash = await (
                client as unknown as {
                  sendUserOperationWithDelegation: (args: {
                    account: typeof sessionSmartAccount;
                    calls: Array<{
                      to: `0x${string}`;
                      value: bigint;
                      data: `0x${string}`;
                    }>;
                    permissionsContext: string;
                    delegationManager: `0x${string}`;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                  }) => Promise<`0x${string}`>;
                }
              ).sendUserOperationWithDelegation({
                account: sessionSmartAccount,
                calls: sessionCalls,
                permissionsContext: permission.context,
                delegationManager: delegationManager as `0x${string}`,
                ...fee,
              });

              // Success - break out of retry loop
              break;
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : String(error);

              // Check if it's a nonce error
              if (errorMessage.includes("nonce") && retries < maxRetries - 1) {
                retries++;
                console.log(
                  `⚠️ Nonce error detected, retrying... (${retries}/${maxRetries})`
                );
                continue;
              }

              // If it's not a nonce error or we've exhausted retries, throw
              throw error;
            }
          }

          // Ensure userOpHash was assigned
          if (!userOpHash) {
            throw new Error("Failed to get user operation hash after retries");
          }

          // Wait for receipt
          const sessionReceipt = await client.waitForUserOperationReceipt({
            hash: userOpHash,
            timeout: 120_000,
          });

          console.log(
            "✅ Contract calls executed:",
            sessionReceipt.receipt.transactionHash
          );

          return {
            success: true,
            hash: sessionReceipt.receipt.transactionHash,
            transferHash: receipt.transactionHash,
          };
        }

        return { success: true, hash: receipt.transactionHash };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("❌ Redeem delegation failed:", message);

        // Provide helpful error message for insufficient balance
        if (
          message.includes("exceeds the balance") ||
          message.includes("insufficient funds") ||
          message.includes("insufficient ETH")
        ) {
          return {
            success: false,
            error: `Session account (${sessionKey.address}) has insufficient ETH for gas fees. Please send ETH to this address to continue.`,
          };
        }

        // Handle permission amount exceeded error
        if (message.includes("transfer-amount-exceeded")) {
          return {
            success: false,
            error: `Transfer amount (${params.usdcAmount} USDC) exceeds your permission limit. Please grant a new permission with a higher amount, or wait for the current period to reset (24 hours).`,
          };
        }

        return { success: false, error: message };
      }
    },
    [
      canUseRedeem,
      sessionKey,
      sessionSmartAccountAddress,
      sessionSmartAccount,
      permission,
      publicClient,
      chainId,
      userAddress,
      walletClient,
    ]
  );

  return {
    canUseRedeem,
    redeemWithUSDCTransfer,
  };
}
