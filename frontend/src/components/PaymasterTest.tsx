// src/components/PaymasterTest.tsx
"use client";

import React, { useState } from "react";
import { useAccount } from "wagmi";
import { type Address, encodeFunctionData } from "viem";
import { useSmartAccount } from "@/contexts/smart-account-context";
import { useSmartAccountWrite } from "@/hooks/useSmartAccountWrite";
import { getBundlerClient } from "@/lib/smart-accounts-config";
import {
  isPaymasterAvailable,
  getPaymasterConfig,
} from "@/lib/paymaster-config";
import { testPimlicoAPI } from "@/lib/pimlico-api-test";
import { getContracts } from "@/lib/contracts";
import { Card, CardContent } from "@/components/ui/card";

export function PaymasterTest() {
  const { chainId } = useAccount();
  const {
    smartAccount,
    smartAccountAddress,
    isInitializing,
    error: contextError,
    initializeSmartAccount,
  } = useSmartAccount();
  const { sendUserOperation, isPending, error } = useSmartAccountWrite({
    onSuccess: (hash) => {
      console.log("UserOp sent successfully:", hash);
    },
    onError: (err) => {
      console.error("UserOp error:", err);
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTestingAPI, setIsTestingAPI] = useState(false);

  const paymasterConfig = getPaymasterConfig();

  const runGaslessTest = async () => {
    if (!smartAccount || isInitializing || !smartAccountAddress) {
      setErrorMessage(
        "Smart Account is not initialized. Please connect wallet and retry."
      );
      return;
    }

    // Ensure we have a chain ID
    if (!chainId) {
      setErrorMessage("No chain ID found. Please connect your wallet.");
      return;
    }

    // CRITICAL: Check for Paymaster
    if (!isPaymasterAvailable()) {
      setErrorMessage(
        "❌ Paymaster not configured. Please set NEXT_PUBLIC_PIMLICO_API_KEY in your environment variables."
      );
      return;
    }

    setIsLoading(true);
    setStatus("Initiating Paymaster Test (Gasless Transaction)...");
    setErrorMessage(null);

    try {
      console.log("Testing Paymaster sponsorship...");
      console.log("Paymaster Config:", paymasterConfig);
      console.log("Smart Account Address:", smartAccountAddress);

      // Call a view function on a deployed contract to test paymaster
      // Using balanceOf on cUSD contract - a simple, safe view function call
      const contracts = getContracts(
        chainId === 84532 ? "baseSepolia" : "celoSepolia"
      );

      // Encode balanceOf(address) function call
      const callData = encodeFunctionData({
        abi: [
          {
            name: "balanceOf",
            type: "function",
            stateMutability: "view",
            inputs: [{ name: "account", type: "address" }],
            outputs: [{ name: "", type: "uint256" }],
          },
        ],
        functionName: "balanceOf",
        args: [smartAccountAddress as Address],
      });

      const calls = [
        {
          to: contracts.cUSD as Address,
          value: BigInt(0),
          data: callData,
        },
      ];

      setStatus("Sending gasless User Operation with Paymaster sponsorship...");

      const userOperationHash = await sendUserOperation(calls);

      if (!userOperationHash) {
        throw new Error("Failed to send user operation. No hash returned.");
      }

      setStatus(
        `UserOp Sent! Hash: ${userOperationHash}. Waiting for confirmation...`
      );
      console.log("UserOp Hash:", userOperationHash);

      // Get bundler client for the current chain
      const bundlerClient = getBundlerClient(chainId);

      // Wait for confirmation
      const receipt = await bundlerClient.waitForUserOperationReceipt({
        hash: userOperationHash,
        timeout: 120000, // 2 minutes
      });

      const txHash = receipt.receipt.transactionHash;
      setStatus(
        `✅ SUCCESS! Paymaster sponsorship confirmed! Gasless transaction executed successfully.\n\nUserOp Hash: ${userOperationHash}\nTransaction Hash: ${txHash}\n\nThis proves that the Paymaster is working correctly and sponsored the gas fees.`
      );
      console.log("Paymaster Test Successful! Receipt:", receipt);
      console.log("Transaction Hash:", txHash);
    } catch (err) {
      console.error("Paymaster Test Failed:", err);
      console.error("Full error:", err);

      setStatus(null);

      // Provide helpful error messages
      let errorMsg = err instanceof Error ? err.message : String(err);

      if (errorMsg.includes("AA20") || errorMsg.includes("invalid signature")) {
        errorMsg =
          "❌ Bundler/Paymaster Error\n\n" +
          "This error suggests a failure during the user operation or paymaster validation.\n" +
          "Check:\n" +
          "1. **Paymaster API Key:** Is your NEXT_PUBLIC_PIMLICO_API_KEY correct?\n" +
          "2. **Bundler RPC:** Is your NEXT_PUBLIC_BUNDLER_RPC_URL correct and pointing to a supported network/service?\n" +
          "3. **Paymaster Configuration:** Verify the paymaster is properly configured for Base Sepolia.\n" +
          "4. **Account Balance:** The Smart Account should have ZERO native ETH to prove paymaster sponsorship.\n\n" +
          "Original error: " +
          errorMsg;
      } else if (errorMsg.includes("insufficient funds")) {
        errorMsg =
          "❌ Insufficient Funds\n\n" +
          "If you see this error, it means the Paymaster did NOT sponsor the transaction.\n" +
          "The Smart Account should have ZERO native ETH for this test to prove paymaster sponsorship.\n\n" +
          "Check:\n" +
          "1. Paymaster API key is correct\n" +
          "2. Paymaster service is active\n" +
          "3. Smart Account has no native ETH balance\n\n" +
          "Original error: " +
          errorMsg;
      } else if (
        errorMsg.includes("paymaster") ||
        errorMsg.includes("sponsor")
      ) {
        errorMsg =
          "❌ Paymaster Error\n\n" +
          "The Paymaster failed to sponsor this transaction.\n" +
          "Check:\n" +
          "1. **API Key:** Verify NEXT_PUBLIC_PIMLICO_API_KEY is set correctly\n" +
          "2. **Network:** Ensure you're on Base Sepolia testnet\n" +
          "3. **Service Status:** Check if Pimlico paymaster service is operational\n\n" +
          "Original error: " +
          errorMsg;
      }

      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-200">
          Paymaster Test (Gasless Transaction)
        </h3>

        <p className="mb-4 text-sm text-gray-400">
          This test sends a zero-value transaction via a UserOp with Paymaster
          sponsorship. The Smart Account should have{" "}
          <strong>ZERO native ETH</strong> to prove that the Paymaster is
          sponsoring the gas fees.
        </p>

        <div className="mb-4 p-3 bg-dark-800 rounded-lg border border-dark-700">
          <p className="mb-1 text-sm font-medium text-gray-300">
            Smart Account Address:
          </p>
          <p className="text-sm font-mono break-all text-blue-400">
            {smartAccountAddress || "N/A"}
          </p>
          <p className="mt-2 mb-1 text-sm font-medium text-gray-300">
            Paymaster Status:
          </p>
          <p
            className={`text-sm font-mono ${
              isPaymasterAvailable() ? "text-green-400" : "text-red-400"
            }`}
          >
            {isPaymasterAvailable()
              ? `✅ ${paymasterConfig.type.toUpperCase()} Paymaster Available`
              : "❌ Paymaster Not Configured"}
          </p>
          {isPaymasterAvailable() && paymasterConfig.type === "pimlico" && (
            <p className="mt-1 text-xs text-gray-400">
              Using Pimlico Verifying Paymaster (Gasless)
            </p>
          )}
          {isInitializing && (
            <p className="mt-2 text-xs text-yellow-400">
              Initializing smart account...
            </p>
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

        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              onClick={runGaslessTest}
              disabled={
                !smartAccount ||
                isLoading ||
                isPending ||
                isInitializing ||
                !chainId ||
                !isPaymasterAvailable()
              }
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-150 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading || isPending
                ? "Running Paymaster Test..."
                : "Run Paymaster Test (Gasless)"}
            </button>
            <button
              onClick={async () => {
                if (!smartAccountAddress) {
                  setErrorMessage("Smart account address not available");
                  return;
                }
                setIsTestingAPI(true);
                setStatus("Testing Pimlico API directly...");
                setErrorMessage(null);
                try {
                  const results = await testPimlicoAPI(
                    smartAccountAddress,
                    undefined,
                    chainId
                  );
                  if (
                    results.entryPointsTest.success &&
                    results.sponsorTest.success
                  ) {
                    setStatus(
                      "✅ Pimlico API Test Passed!\n\nCheck console for details."
                    );
                  } else {
                    setErrorMessage(
                      `❌ Pimlico API Test Failed\n\nEntryPoints: ${
                        results.entryPointsTest.success ? "✅" : "❌"
                      }\nSponsor: ${
                        results.sponsorTest.success ? "✅" : "❌"
                      }\n\nCheck console for details.`
                    );
                  }
                } catch (error) {
                  setErrorMessage(
                    `❌ API Test Error: ${
                      error instanceof Error ? error.message : String(error)
                    }`
                  );
                } finally {
                  setIsTestingAPI(false);
                }
              }}
              disabled={
                !smartAccountAddress || isTestingAPI || !isPaymasterAvailable()
              }
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-150 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap"
              title={
                !smartAccountAddress
                  ? "Smart account address required"
                  : !isPaymasterAvailable()
                  ? "Paymaster not configured"
                  : "Test Pimlico API directly"
              }
            >
              {isTestingAPI ? "Testing..." : "Test API"}
            </button>
          </div>
          {!smartAccountAddress && isPaymasterAvailable() && (
            <p className="text-xs text-yellow-400">
              ⚠️ Smart account address required to test API. Please connect your
              wallet first.
            </p>
          )}
        </div>

        {status && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-sm text-green-400 font-medium whitespace-pre-line">
              {status}
            </p>
          </div>
        )}
        {(errorMessage || error) && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400 font-medium whitespace-pre-line">
              {errorMessage || error?.message}
            </p>
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-gray-400">
            <strong className="text-blue-400">About Paymaster Test:</strong>{" "}
            This test verifies that the Paymaster (Pimlico) is correctly
            configured and sponsoring gas fees. The transaction should succeed
            even if the Smart Account has zero native ETH balance, proving that
            the Paymaster is paying for the gas. Check the console logs for
            detailed Paymaster integration information.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
