// src/components/SmartAccountPingTest.tsx
"use client";

import React, { useState } from "react";
import { useAccount } from "wagmi";
import { useSmartAccount } from "@/contexts/smart-account-context"; // Ensure this path is correct
import { getBundlerClient } from "@/lib/smart-accounts-config";
import { Card, CardContent } from "@/components/ui/card"; // Assuming you use shadcn/ui Card

export function SmartAccountPingTest() {
  const { chainId } = useAccount();
  const {
    smartAccount,
    smartAccountAddress,
    isInitializing,
    error: contextError,
    initializeSmartAccount,
  } = useSmartAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePingTest = async () => {
    if (!smartAccount || isInitializing || !smartAccountAddress) {
      setError(
        "Smart Account is not initialized. Please connect wallet and retry."
      );
      return;
    }

    // Ensure we have a chain ID
    if (!chainId) {
      setError("No chain ID found. Please connect your wallet.");
      return;
    }

    setIsLoading(true);
    setStatus("Initiating Smart Account Ping Test...");
    setError(null);

    try {
      // Create a simple call (zero-value transfer to self)
      const call = {
        to: smartAccountAddress,
        value: BigInt(0),
        data: "0x" as const,
      };

      setStatus("Creating User Operation, including deployment logic...");

      console.log("Sending UserOp from derived address:", smartAccountAddress);

      // Get bundler client for the current chain
      const bundlerClient = getBundlerClient(chainId);

      // Send UserOp - The Hybrid implementation automatically includes initCode
      // for deployment if the account is not yet deployed.
      const userOperationHash = await bundlerClient.sendUserOperation({
        account: smartAccount,
        calls: [call],
        // Rely on the bundler to estimate gas, which is necessary for
        // the first transaction that includes the deployment.
      });

      setStatus(
        `UserOp Sent! Hash: ${userOperationHash}. Waiting for confirmation...`
      );
      console.log("UserOp Hash:", userOperationHash);

      // Wait for confirmation
      const receipt = await bundlerClient.waitForUserOperationReceipt({
        hash: userOperationHash,
        timeout: 120000, // 2 minutes
      });

      const txHash = receipt.receipt.transactionHash;
      setStatus(
        `✅ SUCCESS! Hybrid Smart Account deployed and operational! Your EOA is now the owner of contract ${smartAccountAddress}.\n\nTransaction Hash: ${txHash}`
      );
      console.log("Ping Test Successful! Receipt:", receipt);
      console.log("Transaction Hash:", txHash);
    } catch (err) {
      console.error("Ping Test Failed:", err);
      // Detailed error logging is good practice
      console.error("Full error:", err);

      setStatus(null);

      // Provide helpful error messages
      let errorMessage = err instanceof Error ? err.message : String(err);

      if (
        errorMessage.includes("AA20") ||
        errorMessage.includes("invalid signature")
      ) {
        errorMessage =
          "❌ Bundler/Deployment Error\n\n" +
          "This error suggests a failure during the account deployment or signature validation.\n" +
          "Check:\n" +
          "1. **Bundler RPC:** Is your NEXT_PUBLIC_BUNDLER_RPC_URL correct and pointing to a supported network/service (e.g., Pimlico/Base Sepolia)?\n" +
          "2. **Gas Funds:** Ensure the EOA has enough native ETH for the gas fee.\n" +
          "3. **Contract Deployment:** The Bundler might be failing to deploy the contract. Check network status.\n\n" +
          "Original error: " +
          errorMessage;
      } else if (errorMessage.includes("insufficient funds")) {
        errorMessage =
          "❌ Insufficient Funds\n\n" +
          "You need Base Sepolia ETH in your EOA to pay for the initial deployment/gas.\n\n" +
          "Original error: " +
          errorMessage;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-200">
          Smart Account Functionality Test (Hybrid AA)
        </h3>

        <p className="mb-4 text-sm text-gray-400">
          This test sends a zero-value transaction via a UserOp. It will deploy
          the Smart Account contract and confirm its operation.
        </p>

        <div className="mb-4 p-3 bg-dark-800 rounded-lg border border-dark-700">
          <p className="mb-1 text-sm font-medium text-gray-300">
            Derived Smart Account Address:
          </p>
          <p className="text-sm font-mono break-all text-blue-400">
            {smartAccountAddress || "N/A"}
          </p>
          {isInitializing && (
            <p className="mt-2 text-xs text-yellow-400">
              Initializing smart account...
            </p>
          )}
          {!smartAccountAddress && !isInitializing && !contextError && (
            <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
              <p className="text-xs text-yellow-400 font-medium">
                Smart account not initialized yet
              </p>
              <p className="text-xs text-gray-400 mt-1">
                If using MetaMask Flask, try disconnecting and reconnecting your wallet, 
                or click the button below to manually initialize.
              </p>
              <button
                onClick={() => initializeSmartAccount()}
                className="mt-2 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                Initialize Smart Account
              </button>
            </div>
          )}
          {contextError && !isInitializing && (
            <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded">
              <p className="text-xs text-red-400 font-medium">
                Initialization Error:
              </p>
              <p className="text-xs text-red-300 mt-1">
                {contextError.message || String(contextError)}
              </p>
              <button
                onClick={() => initializeSmartAccount()}
                className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline"
              >
                Retry Initialization
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handlePingTest}
          disabled={!smartAccount || isLoading || isInitializing || !chainId}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-150 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading
            ? "Running Test (Deploying & Ping)..."
            : "Run Smart Account Ping Test"}
        </button>

        {status && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-sm text-green-400 font-medium whitespace-pre-line">
              {status}
            </p>
          </div>
        )}
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400 font-medium whitespace-pre-line">
              {error}
            </p>
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-gray-400">
            <strong className="text-blue-400">About Hybrid AA:</strong> The
            first UserOp will automatically deploy a smart contract wallet (at
            the derived address shown above). Your EOA wallet signs the UserOp
            and must have Base Sepolia ETH to cover the gas for this
            deployment/transaction.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
