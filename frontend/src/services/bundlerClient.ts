import { createBundlerClient } from "viem/account-abstraction";
import { erc7710BundlerActions } from "@metamask/smart-accounts-kit/actions";
import { http } from "viem";
import { baseSepolia } from "viem/chains";

const pimlicoKey = process.env.NEXT_PUBLIC_PIMLICO_API_KEY;
const sponsorshipPolicyId =
  process.env.NEXT_PUBLIC_PIMLICO_SPONSORSHIP_POLICY_ID;

if (!pimlicoKey) {
  throw new Error("Pimlico API key is not set");
}

if (!sponsorshipPolicyId) {
  throw new Error("Pimlico sponsorship policy ID is not set");
}

const pimlicoUrl = `https://api.pimlico.io/v2/84532/rpc?apikey=${pimlicoKey}`;
const ENTRYPOINT_V07 = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";

// Helper to format UserOperation for Pimlico API
const formatUserOperationForPaymaster = (userOp: any) => {
  const formattedOp: any = {
    sender: userOp.sender,
    nonce:
      typeof userOp.nonce === "bigint"
        ? `0x${userOp.nonce.toString(16)}`
        : userOp.nonce,
    callData: userOp.callData,
    callGasLimit: userOp.callGasLimit
      ? typeof userOp.callGasLimit === "bigint"
        ? `0x${userOp.callGasLimit.toString(16)}`
        : userOp.callGasLimit
      : "0x100000",
    verificationGasLimit: userOp.verificationGasLimit
      ? typeof userOp.verificationGasLimit === "bigint"
        ? `0x${userOp.verificationGasLimit.toString(16)}`
        : userOp.verificationGasLimit
      : "0x100000",
    preVerificationGas: userOp.preVerificationGas
      ? typeof userOp.preVerificationGas === "bigint"
        ? `0x${userOp.preVerificationGas.toString(16)}`
        : userOp.preVerificationGas
      : "0x100000",
    maxFeePerGas: userOp.maxFeePerGas
      ? typeof userOp.maxFeePerGas === "bigint"
        ? `0x${userOp.maxFeePerGas.toString(16)}`
        : userOp.maxFeePerGas
      : "0x3b9aca00",
    maxPriorityFeePerGas: userOp.maxPriorityFeePerGas
      ? typeof userOp.maxPriorityFeePerGas === "bigint"
        ? `0x${userOp.maxPriorityFeePerGas.toString(16)}`
        : userOp.maxPriorityFeePerGas
      : "0x3b9aca00",
  };

  if (userOp.factory) formattedOp.factory = userOp.factory;
  if (userOp.factoryData) formattedOp.factoryData = userOp.factoryData;
  if (userOp.paymaster) formattedOp.paymaster = userOp.paymaster;
  if (userOp.paymasterVerificationGasLimit) {
    formattedOp.paymasterVerificationGasLimit =
      typeof userOp.paymasterVerificationGasLimit === "bigint"
        ? `0x${userOp.paymasterVerificationGasLimit.toString(16)}`
        : userOp.paymasterVerificationGasLimit;
  }
  if (userOp.paymasterPostOpGasLimit) {
    formattedOp.paymasterPostOpGasLimit =
      typeof userOp.paymasterPostOpGasLimit === "bigint"
        ? `0x${userOp.paymasterPostOpGasLimit.toString(16)}`
        : userOp.paymasterPostOpGasLimit;
  }
  if (userOp.paymasterData) formattedOp.paymasterData = userOp.paymasterData;
  if (userOp.signature) formattedOp.signature = userOp.signature;

  return formattedOp;
};

export const bundlerClient = () =>
  createBundlerClient({
    chain: baseSepolia,
    transport: http(pimlicoUrl),
    // ✅ Add user operation config to enable proper gas estimation
    userOperation: {
      async estimateFeesPerGas() {
        // Fetch current gas prices from the network
        const response = await fetch(pimlicoUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "eth_gasPrice",
            params: [],
            id: 1,
            jsonrpc: "2.0",
          }),
        });

        const res = await response.json();
        const gasPrice = BigInt(res.result || "0x3b9aca00"); // Fallback to 1 gwei

        return {
          maxFeePerGas: gasPrice,
          maxPriorityFeePerGas: gasPrice,
        };
      },
    },
    paymaster: {
      getPaymasterData: async (userOperation) => {
        console.log("🔍 getPaymasterData - Raw userOperation:", userOperation);

        const formattedUserOp = formatUserOperationForPaymaster(userOperation);
        console.log("📦 getPaymasterData - Formatted userOp:", formattedUserOp);

        const response = await fetch(pimlicoUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "pm_sponsorUserOperation",
            params: [
              formattedUserOp,
              ENTRYPOINT_V07,
              {
                sponsorshipPolicyId,
              },
            ],
            id: 1,
            jsonrpc: "2.0",
          }),
        });

        const res = await response.json();

        if (res.error) {
          console.error("❌ Paymaster error:", res.error);
          throw new Error(`Paymaster error: ${res.error.message}`);
        }

        console.log("✅ Paymaster data received:", res.result);
        return res.result;
      },
      getPaymasterStubData: async (userOperation) => {
        console.log(
          "🔍 getPaymasterStubData - Raw userOperation:",
          userOperation
        );

        const formattedUserOp = formatUserOperationForPaymaster(userOperation);
        console.log(
          "📦 getPaymasterStubData - Formatted userOp:",
          formattedUserOp
        );

        const response = await fetch(pimlicoUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "pm_sponsorUserOperation",
            params: [
              formattedUserOp,
              ENTRYPOINT_V07,
              {
                sponsorshipPolicyId,
              },
            ],
            id: 1,
            jsonrpc: "2.0",
          }),
        });

        const res = await response.json();

        if (res.error) {
          console.error("❌ Paymaster stub error:", res.error);
          throw new Error(`Paymaster stub error: ${res.error.message}`);
        }

        console.log("✅ Paymaster stub data received:", res.result);
        return res.result;
      },
    },
  }).extend(erc7710BundlerActions());
