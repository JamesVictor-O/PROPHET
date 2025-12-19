// //

// import { type Address, type Hex } from "viem";

// export interface PaymasterConfig {
//   enabled: boolean;
//   type: "pimlico" | "alchemy" | "custom" | "none";
//   address?: Address;
//   apiKey?: string;
// }

// export interface PimlicoPaymasterData {
//   paymasterData: Hex;
//   callGasLimit?: bigint;
//   verificationGasLimit?: bigint;
//   preVerificationGas?: bigint;
//   paymasterVerificationGasLimit?: bigint;
//   paymasterPostOpGasLimit?: bigint;
// }

// export function getPaymasterConfig(): PaymasterConfig {
//   const pimlicoApiKey = process.env.NEXT_PUBLIC_PIMLICO_API_KEY;
//   if (pimlicoApiKey) {
//     return {
//       enabled: true,
//       type: "pimlico",
//       apiKey: pimlicoApiKey,
//     };
//   }

//   // Check for Alchemy
//   const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
//   if (alchemyApiKey) {
//     return {
//       enabled: true,
//       type: "alchemy",
//       apiKey: alchemyApiKey,
//     };
//   }

//   // Check for custom paymaster address
//   const customPaymasterAddress = process.env.NEXT_PUBLIC_PAYMASTER_ADDRESS;
//   if (customPaymasterAddress) {
//     return {
//       enabled: true,
//       type: "custom",
//       address: customPaymasterAddress as Address,
//     };
//   }

//   // No paymaster configured
//   return {
//     enabled: false,
//     type: "none",
//   };
// }

// /**
//  * Get paymaster RPC URL based on type
//  */
// export function getPaymasterRpcUrl(
//   config: PaymasterConfig
// ): string | undefined {
//   if (!config.enabled || config.type === "none") {
//     return undefined;
//   }

//   switch (config.type) {
//     case "pimlico":
//       // Pimlico paymaster RPC for Base Sepolia
//       return `https://api.pimlico.io/v2/base-sepolia/rpc?apikey=${config.apiKey}`;

//     case "alchemy":
//       // Alchemy paymaster RPC (if they support Base Sepolia)
//       return `https://base-sepolia.g.alchemy.com/v2/${config.apiKey}`;

//     case "custom":
//       // Custom paymaster - user needs to provide RPC URL
//       return process.env.NEXT_PUBLIC_PAYMASTER_RPC_URL;

//     default:
//       return undefined;
//   }
// }

// export function isPaymasterAvailable(): boolean {
//   const config = getPaymasterConfig();
//   return config.enabled && config.type !== "none";
// }

// /**
//  * Get Pimlico paymaster data for a user operation
//  * This calls Pimlico's pm_sponsorUserOperation RPC method to get sponsorship data
//  *
//  * @param userOperation - The user operation to get paymaster data for
//  */
// export async function getPimlicoPaymasterData(userOperation: {
//   sender: Address;
//   nonce: bigint;
//   callData: Hex;
//   callGasLimit: bigint;
//   verificationGasLimit: bigint;
//   preVerificationGas: bigint;
//   maxFeePerGas: bigint;
//   maxPriorityFeePerGas: bigint;
//   paymasterAndData?: Hex;
// }): Promise<PimlicoPaymasterData | null> {
//   const config = getPaymasterConfig();

//   if (!config.enabled || config.type !== "pimlico" || !config.apiKey) {
//     console.warn("Pimlico paymaster not configured");
//     return null;
//   }

//   try {
//     const apiKey = config.apiKey;
//     // CRITICAL: Use the RPC endpoint, not the REST API endpoint
//     const rpcUrl = `https://api.pimlico.io/v2/base-sepolia/rpc?apikey=${apiKey}`;

//     console.log("🎟️ Calling Pimlico pm_sponsorUserOperation...");
//     console.log("User Operation:", {
//       sender: userOperation.sender,
//       nonce: userOperation.nonce.toString(),
//       callGasLimit: userOperation.callGasLimit.toString(),
//       verificationGasLimit: userOperation.verificationGasLimit.toString(),
//       preVerificationGas: userOperation.preVerificationGas.toString(),
//       maxFeePerGas: userOperation.maxFeePerGas.toString(),
//       maxPriorityFeePerGas: userOperation.maxPriorityFeePerGas.toString(),
//     });

//     // Prepare user operation for RPC (convert bigint to hex string)
//     const userOpForRpc = {
//       sender: userOperation.sender,
//       nonce: `0x${userOperation.nonce.toString(16)}`,
//       callData: userOperation.callData,
//       callGasLimit: `0x${userOperation.callGasLimit.toString(16)}`,
//       verificationGasLimit: `0x${userOperation.verificationGasLimit.toString(
//         16
//       )}`,
//       preVerificationGas: `0x${userOperation.preVerificationGas.toString(16)}`,
//       maxFeePerGas: `0x${userOperation.maxFeePerGas.toString(16)}`,
//       maxPriorityFeePerGas: `0x${userOperation.maxPriorityFeePerGas.toString(
//         16
//       )}`,
//       // Dummy signature for gas estimation
//       signature:
//         "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c",
//     };

//     // CRITICAL: Call pm_sponsorUserOperation with EntryPoint v0.7 address
//     const response = await fetch(rpcUrl, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         jsonrpc: "2.0",
//         id: 1,
//         method: "pm_sponsorUserOperation",
//         params: [
//           userOpForRpc,
//           "0x0000000071727De22E5E9d8BAf0edAc6f37da032", // EntryPoint v0.7
//         ],
//       }),
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error("❌ Pimlico API HTTP error:", errorText);
//       throw new Error(
//         `Pimlico API request failed: ${response.status} ${response.statusText}`
//       );
//     }

//     const data = await response.json();

//     // Log the full response for debugging
//     console.log("🔍 Full Pimlico API response:", JSON.stringify(data, null, 2));

//     if (data.error) {
//       console.error("❌ Pimlico API returned error:", data.error);
//       throw new Error(
//         `Pimlico error: ${data.error.message || JSON.stringify(data.error)}`
//       );
//     }

//     if (!data.result) {
//       console.error("❌ No result in Pimlico response:", data);
//       throw new Error("No result from Pimlico paymaster");
//     }

//     const result = data.result;

//     // Log the result structure
//     console.log("🔍 Pimlico result structure:", {
//       keys: Object.keys(result),
//       paymasterAndData: result.paymasterAndData,
//       paymasterAndDataType: typeof result.paymasterAndData,
//       fullResult: result,
//     });

//     // CRITICAL: The paymasterAndData field contains both the paymaster address
//     // and the paymaster-specific data concatenated together
//     // Try different possible field names
//     let paymasterAndData: Hex | undefined =
//       result.paymasterAndData ||
//       result.paymaster ||
//       result.paymasterData ||
//       result.paymaster_and_data;

//     // If still undefined, check if it's nested
//     if (!paymasterAndData && result.paymaster) {
//       paymasterAndData =
//         result.paymaster.paymasterAndData || result.paymaster.paymaster;
//     }

//     if (
//       !paymasterAndData ||
//       paymasterAndData === "0x" ||
//       (typeof paymasterAndData === "string" && paymasterAndData.length < 42)
//     ) {
//       console.error("❌ Invalid paymasterAndData:", {
//         paymasterAndData,
//         type: typeof paymasterAndData,
//         resultKeys: Object.keys(result),
//         fullResult: JSON.stringify(result, null, 2),
//       });
//       throw new Error(
//         `Invalid paymasterAndData received from Pimlico. Expected paymasterAndData field but got: ${JSON.stringify(
//           result,
//           null,
//           2
//         )}`
//       );
//     }

//     console.log("✅ Pimlico paymaster response received:", {
//       paymasterAndData: paymasterAndData.slice(0, 42) + "...",
//       paymasterAndDataLength: paymasterAndData.length,
//       hasPaymasterVerificationGasLimit: !!result.paymasterVerificationGasLimit,
//       hasPaymasterPostOpGasLimit: !!result.paymasterPostOpGasLimit,
//     });

//     // Return the complete paymaster data
//     return {
//       paymasterData: paymasterAndData,
//       // Parse optional gas limits from response (if Pimlico provides updated estimates)
//       callGasLimit: result.callGasLimit
//         ? BigInt(result.callGasLimit)
//         : undefined,
//       verificationGasLimit: result.verificationGasLimit
//         ? BigInt(result.verificationGasLimit)
//         : undefined,
//       preVerificationGas: result.preVerificationGas
//         ? BigInt(result.preVerificationGas)
//         : undefined,
//       paymasterVerificationGasLimit: result.paymasterVerificationGasLimit
//         ? BigInt(result.paymasterVerificationGasLimit)
//         : undefined,
//       paymasterPostOpGasLimit: result.paymasterPostOpGasLimit
//         ? BigInt(result.paymasterPostOpGasLimit)
//         : undefined,
//     };
//   } catch (error) {
//     console.error("❌ Error getting Pimlico paymaster data:", error);
//     // Re-throw to let the calling code handle it
//     throw error;
//   }
// }

// /**
//  * Legacy function - kept for backward compatibility
//  * For ERC-20 paymaster functionality, you'd need to implement token quotes separately
//  */
// export async function getPimlicoPaymasterAddress(
//   tokenAddress: Address
// ): Promise<Address | null> {
//   const config = getPaymasterConfig();

//   if (!config.enabled || config.type !== "pimlico" || !config.apiKey) {
//     return null;
//   }

//   try {
//     const apiKey = config.apiKey;
//     const baseUrl = `https://api.pimlico.io/v2/base-sepolia`;

//     const quotesResponse = await fetch(
//       `${baseUrl}/token-quotes?token=${tokenAddress}&apikey=${apiKey}`
//     );

//     if (!quotesResponse.ok) {
//       console.error("Failed to get token quotes:", await quotesResponse.text());
//       return null;
//     }

//     const quotes = await quotesResponse.json();
//     if (!quotes.quotes || quotes.quotes.length === 0) {
//       console.error("No paymaster quotes available");
//       return null;
//     }

//     return quotes.quotes[0].paymaster as Address;
//   } catch (error) {
//     console.error("Error getting Pimlico paymaster address:", error);
//     return null;
//   }
// }


import { type Address, type Hex } from "viem";

export interface PaymasterConfig {
  enabled: boolean;
  type: "pimlico" | "alchemy" | "custom" | "none";
  address?: Address;
  apiKey?: string;
}

export interface PimlicoPaymasterData {
  // For EntryPoint v0.7, Pimlico returns these separately:
  paymaster: Address;
  paymasterData: Hex;
  callGasLimit?: bigint;
  verificationGasLimit?: bigint;
  preVerificationGas?: bigint;
  paymasterVerificationGasLimit?: bigint;
  paymasterPostOpGasLimit?: bigint;
}

export function getPaymasterConfig(): PaymasterConfig {
  const pimlicoApiKey = process.env.NEXT_PUBLIC_PIMLICO_API_KEY;
  if (pimlicoApiKey) {
    return {
      enabled: true,
      type: "pimlico",
      apiKey: pimlicoApiKey,
    };
  }

  // Check for Alchemy
  const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
  if (alchemyApiKey) {
    return {
      enabled: true,
      type: "alchemy",
      apiKey: alchemyApiKey,
    };
  }

  // Check for custom paymaster address
  const customPaymasterAddress = process.env.NEXT_PUBLIC_PAYMASTER_ADDRESS;
  if (customPaymasterAddress) {
    return {
      enabled: true,
      type: "custom",
      address: customPaymasterAddress as Address,
    };
  }

  // No paymaster configured
  return {
    enabled: false,
    type: "none",
  };
}

export function getPaymasterRpcUrl(
  config: PaymasterConfig
): string | undefined {
  if (!config.enabled || config.type === "none") {
    return undefined;
  }

  switch (config.type) {
    case "pimlico":
      return `https://api.pimlico.io/v2/base-sepolia/rpc?apikey=${config.apiKey}`;
    case "alchemy":
      return `https://base-sepolia.g.alchemy.com/v2/${config.apiKey}`;
    case "custom":
      return process.env.NEXT_PUBLIC_PAYMASTER_RPC_URL;
    default:
      return undefined;
  }
}

export function isPaymasterAvailable(): boolean {
  const config = getPaymasterConfig();
  return config.enabled && config.type !== "none";
}

export async function getPimlicoPaymasterData(userOperation: {
  sender: Address;
  nonce: bigint;
  callData: Hex;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymasterAndData?: Hex;
}): Promise<PimlicoPaymasterData | null> {
  const config = getPaymasterConfig();

  if (!config.enabled || config.type !== "pimlico" || !config.apiKey) {
    console.warn("Pimlico paymaster not configured");
    return null;
  }

  try {
    const apiKey = config.apiKey;
    const rpcUrl = `https://api.pimlico.io/v2/base-sepolia/rpc?apikey=${apiKey}`;

    console.log("🎟️ Calling Pimlico pm_sponsorUserOperation...");
    console.log("User Operation:", {
      sender: userOperation.sender,
      nonce: userOperation.nonce.toString(),
      callGasLimit: userOperation.callGasLimit.toString(),
      verificationGasLimit: userOperation.verificationGasLimit.toString(),
      preVerificationGas: userOperation.preVerificationGas.toString(),
      maxFeePerGas: userOperation.maxFeePerGas.toString(),
      maxPriorityFeePerGas: userOperation.maxPriorityFeePerGas.toString(),
    });

    const userOpForRpc = {
      sender: userOperation.sender,
      nonce: `0x${userOperation.nonce.toString(16)}`,
      callData: userOperation.callData,
      callGasLimit: `0x${userOperation.callGasLimit.toString(16)}`,
      verificationGasLimit: `0x${userOperation.verificationGasLimit.toString(
        16
      )}`,
      preVerificationGas: `0x${userOperation.preVerificationGas.toString(16)}`,
      maxFeePerGas: `0x${userOperation.maxFeePerGas.toString(16)}`,
      maxPriorityFeePerGas: `0x${userOperation.maxPriorityFeePerGas.toString(
        16
      )}`,
      signature:
        "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c",
    };

    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "pm_sponsorUserOperation",
        params: [
          userOpForRpc,
          "0x0000000071727De22E5E9d8BAf0edAc6f37da032", // EntryPoint v0.7
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Pimlico API HTTP error:", errorText);
      throw new Error(
        `Pimlico API request failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (data.error) {
      console.error("❌ Pimlico API returned error:", data.error);
      throw new Error(
        `Pimlico error: ${data.error.message || JSON.stringify(data.error)}`
      );
    }

    if (!data.result) {
      console.error("❌ No result in Pimlico response:", data.error);
      throw new Error("No result from Pimlico paymaster");
    }

    console.log("🔍 Full Pimlico API response:", JSON.stringify(data, null, 2));

    const result = data.result;

    // CRITICAL: For EntryPoint v0.7, Pimlico returns these fields separately:
    // - paymaster (address)
    // - paymasterData (hex string)
    // - paymasterVerificationGasLimit
    // - paymasterPostOpGasLimit

    const paymaster: Address = result.paymaster;
    const paymasterData: Hex = result.paymasterData || "0x";

    if (
      !paymaster ||
      paymaster === "0x0000000000000000000000000000000000000000"
    ) {
      throw new Error("Invalid paymaster address received from Pimlico");
    }

    console.log("✅ Pimlico paymaster response parsed:", {
      paymaster,
      paymasterData:
        paymasterData.slice(0, 20) + "..." + paymasterData.slice(-20),
      paymasterDataLength: paymasterData.length,
      hasPaymasterVerificationGasLimit: !!result.paymasterVerificationGasLimit,
      hasPaymasterPostOpGasLimit: !!result.paymasterPostOpGasLimit,
    });

    return {
      paymaster,
      paymasterData,
      // Parse optional gas limits from response
      callGasLimit: result.callGasLimit
        ? BigInt(result.callGasLimit)
        : undefined,
      verificationGasLimit: result.verificationGasLimit
        ? BigInt(result.verificationGasLimit)
        : undefined,
      preVerificationGas: result.preVerificationGas
        ? BigInt(result.preVerificationGas)
        : undefined,
      paymasterVerificationGasLimit: result.paymasterVerificationGasLimit
        ? BigInt(result.paymasterVerificationGasLimit)
        : undefined,
      paymasterPostOpGasLimit: result.paymasterPostOpGasLimit
        ? BigInt(result.paymasterPostOpGasLimit)
        : undefined,
    };
  } catch (error) {
    console.error("❌ Error getting Pimlico paymaster data:", error);
    throw error;
  }
}

export async function getPimlicoPaymasterAddress(
  tokenAddress: Address
): Promise<Address | null> {
  const config = getPaymasterConfig();

  if (!config.enabled || config.type !== "pimlico" || !config.apiKey) {
    return null;
  }

  try {
    const apiKey = config.apiKey;
    const baseUrl = `https://api.pimlico.io/v2/base-sepolia`;

    const quotesResponse = await fetch(
      `${baseUrl}/token-quotes?token=${tokenAddress}&apikey=${apiKey}`
    );

    if (!quotesResponse.ok) {
      console.error("Failed to get token quotes:", await quotesResponse.text());
      return null;
    }

    const quotes = await quotesResponse.json();
    if (!quotes.quotes || quotes.quotes.length === 0) {
      console.error("No paymaster quotes available");
      return null;
    }

    return quotes.quotes[0].paymaster as Address;
  } catch (error) {
    console.error("Error getting Pimlico paymaster address:", error);
    return null;
  }
}