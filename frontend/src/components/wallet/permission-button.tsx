"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Zap, Shield } from "lucide-react";
import { usePermissions } from "@/providers/PermissionProvider";
import { PermissionSettingsModal } from "./permission-settings-modal";
import { useSessionAccount } from "@/providers/SessionAccountProvider";
import { useWalletClient, useChainId } from "wagmi";
import { toast } from "sonner";
import { getContractAddress } from "@/lib/contracts";
import { parseUnits } from "viem";
import { erc7715ProviderActions } from "@metamask/smart-accounts-kit/actions";
import { defaultChain } from "@/lib/wallet-config";

interface PermissionButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showIcon?: boolean;
}

export function PermissionButton({
  variant = "outline",
  size = "default",
  className = "",
  showIcon = true,
}: PermissionButtonProps) {
  const { isConnected } = useAccount();
  const { permission, isPermissionValid, savePermission } = usePermissions();
  const {
    sessionSmartAccount,
    sessionSmartAccountAddress,
    sessionKeyAddress,
    createSessionAccount,
    isLoading: isCreatingSession,
  } = useSessionAccount();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGranting, setIsGranting] = useState(false);

  const hasValidPermission = isPermissionValid();

  // Get token info based on chain
  const tokenDecimals =
    defaultChain.id === 84532 || defaultChain.id === 8453 ? 6 : 18;
  const tokenSymbol =
    defaultChain.id === 84532 || defaultChain.id === 8453 ? "USDC" : "cUSD";

  const handleGrantPermission = async (
    amount: number,
    durationHours: number
  ) => {
    try {
      setIsGranting(true);

      // Ensure session account exists
      if (!sessionSmartAccount || !sessionSmartAccountAddress) {
        toast.info("Creating session smart account...");
        await createSessionAccount();
        // Wait a bit for state to update
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (!sessionSmartAccount || !sessionSmartAccountAddress) {
          toast.info("Session account created. Please try again.");
          setIsGranting(false);
          return;
        }
      }

      if (!walletClient) {
        toast.error("Wallet not connected");
        setIsGranting(false);
        return;
      }

      toast.info("Requesting permission from MetaMask...");
      const client = walletClient.extend(erc7715ProviderActions());

      // Set up permission parameters
      const currentTime = Math.floor(Date.now() / 1000);
      const expiry = currentTime + durationHours * 60 * 60;

      // Convert amount to wei/units
      const maxPeriodAmount = parseUnits(amount.toString(), tokenDecimals);
      const periodDuration = 86400; // 24 hours in seconds

      // Request the permission using ERC-7715
      // CRITICAL: Use sessionKeyAddress (EOA) to match what we use when redeeming
      if (!sessionKeyAddress) {
        toast.error("Session key address not available. Please try again.");
        setIsGranting(false);
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
          isAdjustmentAllowed: true,
          permission: {
            type: "erc20-token-periodic",
            data: {
              tokenAddress: getContractAddress("cUSD") as `0x${string}`,
              periodAmount: maxPeriodAmount,
              periodDuration,
              justification: `One-tap betting: spend up to ${amount} ${tokenSymbol}/day on Prophet`,
            },
          },
        },
      ]);

      if (permissions && permissions.length > 0) {
        savePermission(permissions[0], expiry);
        toast.success("🎉 One-tap betting enabled! No more approval popups.");
        setIsModalOpen(false);
      } else {
        toast.error("No permissions were granted");
      }
    } catch (error) {
      console.error("Error granting permission:", error);

      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        if (
          errorMessage.includes("user rejected") ||
          errorMessage.includes("user denied")
        ) {
          toast.error("Permission request was rejected");
        } else if (
          errorMessage.includes("not supported") ||
          errorMessage.includes("does not support") ||
          errorMessage.includes("method not found") ||
          errorMessage.includes("unknown method")
        ) {
          toast.error(
            "ERC-7715 not supported. This feature requires MetaMask Flask or a snap-enabled wallet.",
            { duration: 6000 }
          );
        } else {
          toast.error(`Failed: ${error.message}`);
        }
      } else {
        toast.error("Failed to grant permission");
      }
    } finally {
      setIsGranting(false);
    }
  };

  if (!isConnected) {
    return null; // Don't show button if not connected
  }

  if (hasValidPermission) {
    return (
      <Button
        variant={variant}
        size={size}
        className={`${className} border-green-500/50 text-green-400 hover:bg-green-500/10`}
        disabled
      >
        {showIcon && <Shield className="w-4 h-4 mr-2" />}
        One-Tap Active
      </Button>
    );
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsModalOpen(true)}
        className={`${className} bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold`}
        disabled={isGranting || isCreatingSession}
      >
        {showIcon && <Zap className="w-4 h-4 mr-2" />}
        {isGranting || isCreatingSession ? "Setting up..." : "One-Tap Betting"}
      </Button>

      <PermissionSettingsModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onConfirm={handleGrantPermission}
        isLoading={isGranting || isCreatingSession}
      />
    </>
  );
}
