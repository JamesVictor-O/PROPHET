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
const formatUserOperationForPaymaster = (
  userOp: Record<string, unknown>
): Record<string, string | undefined> => {
  const formatValue = (value: unknown): string | undefined => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === "string") return value;
    if (typeof value === "bigint") return `0x${value.toString(16)}`;
    return String(value);
  };

  const formattedOp: Record<string, string | undefined> = {
    sender: formatValue(userOp.sender),
    nonce: formatValue(userOp.nonce),
    callData: formatValue(userOp.callData),
    callGasLimit: formatValue(userOp.callGasLimit) || "0x100000",
    verificationGasLimit:
      formatValue(userOp.verificationGasLimit) || "0x100000",
    preVerificationGas: formatValue(userOp.preVerificationGas) || "0x100000",
    maxFeePerGas: formatValue(userOp.maxFeePerGas) || "0x3b9aca00",
    maxPriorityFeePerGas:
      formatValue(userOp.maxPriorityFeePerGas) || "0x3b9aca00",
  };

  if (userOp.factory) formattedOp.factory = formatValue(userOp.factory);
  if (userOp.factoryData)
    formattedOp.factoryData = formatValue(userOp.factoryData);
  if (userOp.paymaster) formattedOp.paymaster = formatValue(userOp.paymaster);
  if (userOp.paymasterVerificationGasLimit) {
    formattedOp.paymasterVerificationGasLimit = formatValue(
      userOp.paymasterVerificationGasLimit
    );
  }
  if (userOp.paymasterPostOpGasLimit) {
    formattedOp.paymasterPostOpGasLimit = formatValue(
      userOp.paymasterPostOpGasLimit
    );
  }
  if (userOp.paymasterData)
    formattedOp.paymasterData = formatValue(userOp.paymasterData);
  if (userOp.signature) formattedOp.signature = formatValue(userOp.signature);

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
        return { ...res.result, isFinal: true };
      },
    },
  }).extend(erc7710BundlerActions());
