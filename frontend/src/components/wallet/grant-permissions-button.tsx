"use client";

import { useState } from "react";
import { parseUnits, encodeFunctionData, type Address } from "viem";
import { erc7715ProviderActions } from "@metamask/smart-accounts-kit/actions";
import { useSessionAccount } from "@/providers/SessionAccountProvider";
import { usePermissions } from "@/providers/PermissionProvider";
import { Loader2, CheckCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChainId, useWalletClient } from "wagmi";
import { toast } from "sonner";
import { getContractAddress } from "@/lib/contracts";
import { defaultChain } from "@/lib/wallet-config";
import { PredictionMarketABI } from "@/lib/abis";

interface GrantPermissionsButtonProps {
  onSuccess?: () => void;
  className?: string;
}

export function GrantPermissionsButton({
  onSuccess,
  className,
}: GrantPermissionsButtonProps) {
  const {
    sessionSmartAccount,
    sessionSmartAccountAddress,
    sessionKeyAddress,
    createSessionAccount,
    isLoading: isCreatingSession,
  } = useSessionAccount();
  const { savePermission, isPermissionValid } = usePermissions();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Get token decimals based on chain
  const tokenDecimals =
    defaultChain.id === 84532 || defaultChain.id === 8453 ? 6 : 18;
  const tokenSymbol =
    defaultChain.id === 84532 || defaultChain.id === 8453 ? "USDC" : "cUSD";
  const tokenAddress = getContractAddress("cUSD");
  const handleGrantPermissions = async () => {
    try {
      setIsLoading(true);
      if (!sessionSmartAccount || !sessionSmartAccountAddress) {
        toast.info("Creating session smart account...");
        await createSessionAccount();
        await new Promise((resolve) => setTimeout(resolve, 500));
        toast.info(
          "Session smart account created. Please click again to grant permissions."
        );
        setIsLoading(false);
        return;
      }

      if (!walletClient) {
        toast.error("Wallet not connected. Please connect your wallet first.");
        return;
      }

      toast.info("Requesting permissions from MetaMask...");

      // Step 2: Extend wallet client with ERC-7715 actions
      const client = walletClient.extend(erc7715ProviderActions());
      const currentTime = Math.floor(Date.now() / 1000);
      const expiry = currentTime + 24 * 60 * 60;
      const maxPeriodAmount = parseUnits("20", tokenDecimals);
      if (!sessionKeyAddress) {
        toast.error("Session key address not available. Please try again.");
        setIsLoading(false);
        return;
      }

      const permissions = await client.requestExecutionPermissions([
        {
          chainId,
          expiry,
          signer: {
            type: "account",
            data: {
              address: sessionKeyAddress,
            },
          },
          isAdjustmentAllowed: true,
          permission: {
            type: "erc20-token-periodic",
            data: {
              tokenAddress: tokenAddress as `0x${string}`,
              periodAmount: maxPeriodAmount,
              periodDuration: 86400,
              justification: `Permission to spend up to 20 ${tokenSymbol} per day for Prophet predictions`,
            },
          },
        },
      ]);

      // Step 5: Save the first permission
      if (permissions && permissions.length > 0) {
        savePermission(permissions[0]);
        if (sessionSmartAccountAddress && walletClient) {
          try {
            const predictionMarketAddress = getContractAddress(
              "predictionMarket"
            ) as Address;

            // Grant delegation on PredictionMarket
            const predictionMarketDelegationData = encodeFunctionData({
              abi: PredictionMarketABI,
              functionName: "grantDelegation",
              args: [sessionSmartAccountAddress],
            });
            const predictionMarketHash = await walletClient.sendTransaction({
              to: predictionMarketAddress,
              data: predictionMarketDelegationData,
            });

            console.log("✅ PredictionMarket delegation granted:", {
              predictionMarket: predictionMarketHash,
            });

            toast.success("Contract delegation granted for session accounts");
          } catch (delegationError) {
            console.warn(
              "⚠️ Failed to grant contract delegation (non-critical):",
              delegationError
            );
            // Don't fail the whole flow if delegation fails - user can grant it manually later
            toast.warning(
              "Permission granted, but contract delegation failed. You may need to grant it manually."
            );
          }
        }

        toast.success(
          "🎉 One-tap betting enabled! No more approval popups for 24 hours."
        );
        onSuccess?.();
      } else {
        toast.error("No permissions were granted.");
      }
    } catch (error) {
      console.error("Error granting permissions:", error);

      // Handle specific errors
      if (error instanceof Error) {
        if (error.message.includes("User rejected")) {
          toast.error("Permission request was rejected.");
        } else if (error.message.includes("not supported")) {
          toast.error(
            "Your wallet doesn't support advanced permissions. Please use MetaMask."
          );
        } else {
          toast.error(`Failed to grant permissions: ${error.message}`);
        }
      } else {
        toast.error("Failed to grant permissions. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // If permission is already valid, show status
  if (isPermissionValid()) {
    return (
      <div className={`flex items-center gap-2 text-green-400 ${className}`}>
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm">One-tap betting enabled</span>
      </div>
    );
  }

  return (
    <Button
      className={className}
      onClick={handleGrantPermissions}
      disabled={isLoading || isCreatingSession}
      variant="outline"
    >
      {isLoading || isCreatingSession ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {isCreatingSession ? "Creating Session..." : "Granting..."}
        </>
      ) : (
        <>
          <Shield className="h-4 w-4 mr-2" />
          Enable One-Tap Betting
        </>
      )}
    </Button>
  );
}
