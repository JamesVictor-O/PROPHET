/**
 * Pimlico API Test Utility
 *
 * This utility tests the Pimlico paymaster API directly to diagnose issues.
 * Can be called from browser console or used in components.
 */

import { type Address } from "viem";
import { getPaymasterConfig } from "./paymaster-config";
import { getPublicClient } from "./smart-accounts-config";

export interface PimlicoTestResult {
  entryPointsTest: {
    success: boolean;
    data?: unknown;
    error?: string;
  };
  sponsorTest: {
    success: boolean;
    data?: unknown;
    error?: string;
  };
}

/**
 * Check if a smart account is deployed on-chain
 */
async function isAccountDeployed(
  address: Address,
  chainId?: number
): Promise<boolean> {
  try {
    const publicClient = getPublicClient(chainId);
    const code = await publicClient.getBytecode({ address });
    return code !== undefined && code !== "0x";
  } catch {
    return false;
  }
}

/**
 * Test Pimlico API directly
 * @param smartAccountAddress - The smart account address to test with
 * @param entryPoint - The entry point address (default: v0.7)
 * @param chainId - Optional chain ID to check account deployment
 */
export async function testPimlicoAPI(
  smartAccountAddress: Address,
  entryPoint: Address = "0x0000000071727De22E5E9d8BAf0edAc6f37da032", // EntryPoint v0.7
  chainId?: number
): Promise<PimlicoTestResult> {
  const config = getPaymasterConfig();

  if (!config.enabled || config.type !== "pimlico" || !config.apiKey) {
    throw new Error(
      "Pimlico paymaster not configured. Please set NEXT_PUBLIC_PIMLICO_API_KEY"
    );
  }

  const apiKey = config.apiKey;
  const rpcUrl = `https://api.pimlico.io/v2/base-sepolia/rpc?apikey=${apiKey}`;

  const results: PimlicoTestResult = {
    entryPointsTest: { success: false },
    sponsorTest: { success: false },
  };

  // Test 1: Check supported EntryPoints
  console.log("════════════════════════════════════════");
  console.log("TEST 1: Checking supported EntryPoints");
  console.log("════════════════════════════════════════");

  try {
    const entryPointsResponse = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "pm_supportedEntryPoints",
        params: [],
      }),
    });

    const entryPointsData = await entryPointsResponse.json();
    console.log("Supported EntryPoints:", entryPointsData);

    if (entryPointsData.error) {
      results.entryPointsTest = {
        success: false,
        error: entryPointsData.error.message || String(entryPointsData.error),
      };
      console.error("❌ EntryPoints Test Error:", entryPointsData.error);
    } else {
      results.entryPointsTest = {
        success: true,
        data: entryPointsData.result,
      };
      console.log("✅ EntryPoints Test Passed");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.entryPointsTest = {
      success: false,
      error: errorMessage,
    };
    console.error("❌ EntryPoints Test Failed:", error);
  }

  // Check if account is deployed before testing sponsorship
  console.log("\n════════════════════════════════════════");
  console.log("Checking if Smart Account is deployed...");
  console.log("════════════════════════════════════════");

  const isDeployed = await isAccountDeployed(smartAccountAddress, chainId);
  console.log(`Account deployed: ${isDeployed ? "✅ Yes" : "❌ No"}`);

  if (!isDeployed) {
    console.warn(
      "\n⚠️ WARNING: Smart Account is not deployed yet!\n" +
        "The paymaster cannot sponsor transactions for undeployed accounts.\n" +
        "Please run the 'Smart Account Ping Test' first to deploy the account.\n" +
        "After deployment, you can test the paymaster API again."
    );

    results.sponsorTest = {
      success: false,
      error:
        "AA20 account not deployed. Please deploy the smart account first using the Ping Test.",
    };
    return results;
  }

  // Test 2: Try to sponsor a simple user operation
  console.log("\n════════════════════════════════════════");
  console.log("TEST 2: Requesting paymaster sponsorship");
  console.log("════════════════════════════════════════");

  const testUserOp = {
    sender: smartAccountAddress,
    nonce: "0x0",
    callData: "0x",
    callGasLimit: "0x30000", // 196608
    verificationGasLimit: "0x50000", // 327680
    preVerificationGas: "0x10000", // 65536
    maxFeePerGas: "0x59682f00", // 1.5 gwei
    maxPriorityFeePerGas: "0x59682f00", // 1.5 gwei
    signature:
      "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c",
  };

  console.log("Requesting sponsorship for:", testUserOp);

  try {
    const sponsorResponse = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "pm_sponsorUserOperation",
        params: [testUserOp, entryPoint],
      }),
    });

    const sponsorData = await sponsorResponse.json();

    if (sponsorData.error) {
      results.sponsorTest = {
        success: false,
        error: sponsorData.error.message || String(sponsorData.error),
        data: sponsorData.error,
      };
      console.error("❌ Pimlico API Error:", sponsorData.error);
    } else {
      results.sponsorTest = {
        success: true,
        data: sponsorData.result,
      };
      console.log("✅ Paymaster Response:", sponsorData.result);
      console.log(
        "\npaymasterAndData length:",
        sponsorData.result.paymasterAndData?.length
      );
      console.log("paymasterAndData:", sponsorData.result.paymasterAndData);
      console.log("✅ Sponsor Test Passed");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.sponsorTest = {
      success: false,
      error: errorMessage,
    };
    console.error("❌ Sponsor Test Failed:", error);
  }

  return results;
}

/**
 * Make test function available globally for browser console access
 */
if (typeof window !== "undefined") {
  const windowWithTest = window as unknown as {
    testPimlicoAPI?: (
      smartAccountAddress: Address
    ) => Promise<PimlicoTestResult>;
  };

  windowWithTest.testPimlicoAPI = async (
    smartAccountAddress: Address,
    chainId?: number
  ): Promise<PimlicoTestResult> => {
    console.log("\n🧪 Starting Pimlico API Test...");
    console.log("Smart Account:", smartAccountAddress);
    if (chainId) {
      console.log("Chain ID:", chainId);
    }
    console.log("════════════════════════════════════════\n");

    const results = await testPimlicoAPI(
      smartAccountAddress,
      undefined,
      chainId
    );
    console.log("\n════════════════════════════════════════");
    console.log("✅ Test Complete");
    console.log("════════════════════════════════════════");
    console.log("\nResults:", results);
    return results;
  };

  console.log(
    "💡 Pimlico API Test function available!\n" +
      "   Run: testPimlicoAPI('0xYourSmartAccountAddress')"
  );
}
