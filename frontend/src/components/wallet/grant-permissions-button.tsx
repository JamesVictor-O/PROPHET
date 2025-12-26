"use client";

import { useState } from "react";
import { parseUnits } from "viem";
import { erc7715ProviderActions } from "@metamask/smart-accounts-kit/actions";
import { useSessionAccount } from "@/providers/SessionAccountProvider";
import { usePermissions } from "@/providers/PermissionProvider";
import { Loader2, CheckCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChainId, useWalletClient } from "wagmi";
import { toast } from "sonner";
import { getContractAddress } from "@/lib/contracts";
import { defaultChain } from "@/lib/wallet-config";

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

  /**
   * Handles the permission granting process for ERC20 token periodic allowance.
   *
   * This function:
   * 1. Creates a session account if not exists
   * 2. Extends wallet client with ERC-7715 actions
   * 3. Requests execution permissions for token spending
   * 4. Stores the granted permission
   */
  const handleGrantPermissions = async () => {
    try {
      setIsLoading(true);

      // Step 1: Create session smart account if needed
      // The session smart account is a separate smart account owned by the session key
      if (!sessionSmartAccount || !sessionSmartAccountAddress) {
        toast.info("Creating session smart account...");
        await createSessionAccount();
        // Wait a bit for the state to update
        await new Promise((resolve) => setTimeout(resolve, 500));
        // Note: We need to get the session account from context after creation
        // For now, we'll prompt the user to try again
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

      // Step 3: Set up permission parameters
      const currentTime = Math.floor(Date.now() / 1000);
      // Permission valid for 24 hours
      const expiry = currentTime + 24 * 60 * 60;

      // Maximum amount per period (e.g., 20 USDC/cUSD per day)
      const maxPeriodAmount = parseUnits("20", tokenDecimals);

      // Step 4: Request the permission
      // CRITICAL: Use sessionKeyAddress (the EOA) to match what we use when redeeming
      // The permission grants the user's smart account the ability to delegate to this session EOA
      // When redeeming, we use sessionKey (EOA) to sign, so permission must be granted to EOA address
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
              address: sessionKeyAddress, // Session EOA address (matches what we use when redeeming)
            },
          },
          isAdjustmentAllowed: true, // Allow MetaMask to suggest adjustments
          permission: {
            type: "erc20-token-periodic",
            data: {
              tokenAddress: tokenAddress as `0x${string}`,
              periodAmount: maxPeriodAmount,
              periodDuration: 86400, // 24 hours in seconds
              justification: `Permission to spend up to 20 ${tokenSymbol} per day for Prophet predictions`,
            },
          },
        },
      ]);

      // Step 5: Save the first permission
      if (permissions && permissions.length > 0) {
        savePermission(permissions[0]);
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
