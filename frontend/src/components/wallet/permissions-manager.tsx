"use client";

import { useState } from "react";
import { useAccount, useWalletClient, useChainId } from "wagmi";
import { useSessionAccount } from "@/providers/SessionAccountProvider";
import { usePermissions } from "@/providers/PermissionProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, X, CheckCircle2, Clock, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { getContractAddress } from "@/lib/contracts";
import { parseUnits } from "viem";
import { erc7715ProviderActions } from "@metamask/smart-accounts-kit/actions";
import { defaultChain } from "@/lib/wallet-config";
import { PermissionSettingsModal } from "./permission-settings-modal";

// Helper to format time until expiration
function formatTimeUntil(expiresAtSeconds: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = expiresAtSeconds - now;

  if (diff < 0) return "Expired";

  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""} remaining`;
  }
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""} remaining`;
  }
  return `${minutes} minute${minutes > 1 ? "s" : ""} remaining`;
}

export function PermissionsManager() {
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();

  const {
    sessionSmartAccount,
    sessionSmartAccountAddress,
    sessionKeyAddress,
    createSessionAccount,
    clearSessionAccount,
    isLoading: isCreatingSession,
  } = useSessionAccount();

  const { permission, savePermission, removePermission, isPermissionValid } =
    usePermissions();

  const [isGranting, setIsGranting] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  // Get token info based on chain
  const tokenDecimals =
    defaultChain.id === 84532 || defaultChain.id === 8453 ? 6 : 18;
  const tokenSymbol =
    defaultChain.id === 84532 || defaultChain.id === 8453 ? "USDC" : "cUSD";
  const tokenAddress = getContractAddress("cUSD");

  // Supported chain IDs
  const supportedChainIds = [84532, 11142220, 42220, 8453];
  const isOnSupportedChain = chainId && supportedChainIds.includes(chainId);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGrantPermission = async (
    amount: number,
    durationHours: number
  ) => {
    try {
      setIsGranting(true);

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

      // Extend wallet client with ERC-7715 actions
      const client = walletClient.extend(erc7715ProviderActions());

      // Set up permission parameters
      const currentTime = Math.floor(Date.now() / 1000);
      const expiry = currentTime + durationHours * 60 * 60;

      // Convert amount to wei/units
      const maxPeriodAmount = parseUnits(amount.toString(), tokenDecimals);
      const periodDuration = 86400; 
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
              tokenAddress: tokenAddress as `0x${string}`,
              periodAmount: maxPeriodAmount,
              periodDuration,
              justification: `One-tap betting: spend up to ${amount} ${tokenSymbol}/day on Prophet`,
            },
          },
        },
      ]);

      // Save the permission with expiry
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
          errorMessage.includes("unknown method") ||
          errorMessage.includes("wallet_grantpermissions") ||
          errorMessage.includes("requestexecutionpermissions")
        ) {
          toast.error(
            "ERC-7715 not supported. This feature requires MetaMask Flask or a snap-enabled wallet.",
            { duration: 6000 }
          );
          console.info(
            "ℹ️ ERC-7715 Session Keys require MetaMask Flask or the Delegation Snap. " +
              "Standard MetaMask doesn't support this yet. " +
              "See: https://docs.metamask.io/snaps/"
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

  const handleRevokePermission = async () => {
    if (!window.confirm("Revoke one-tap betting permission?")) {
      return;
    }

    setIsRevoking(true);
    try {
      removePermission();
      clearSessionAccount();
      toast.success("Permission revoked");
    } catch (error) {
      console.error("Error revoking permission:", error);
      toast.error("Failed to revoke permission");
    } finally {
      setIsRevoking(false);
    }
  };

  // Not connected state
  if (!isConnected) {
    return (
      <Card className="bg-[#1E293B] border-dark-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5" />
            One-Tap Betting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400">
            Connect your wallet to enable one-tap betting.
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasValidPermission = isPermissionValid();

  return (
    <Card className="bg-[#1E293B] border-dark-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          One-Tap Betting (ERC-7715)
        </CardTitle>
        <p className="text-sm text-gray-400 mt-1">
          Grant permission once, then place bets without MetaMask popups
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasValidPermission ? (
          <div className="space-y-4">
            {/* Explanation */}
            <div className="p-3 bg-[#0F172A] rounded-lg border border-dark-700">
              <p className="text-xs text-gray-400">
                <strong className="text-white">How it works:</strong>
                <br />
                1. Grant permission once (MetaMask popup)
                <br />
                2. Place unlimited bets for 24 hours
                <br />
                3. No more approval popups!
              </p>
            </div>

            {/* Session Smart Account Status */}
            {sessionSmartAccount && (
              <div className="flex items-center gap-2 text-xs text-green-400">
                <CheckCircle2 className="w-3 h-3" />
                Session smart account ready
              </div>
            )}

            {/* Grant Button */}
            <Button
              onClick={() => setIsModalOpen(true)}
              disabled={isGranting || isCreatingSession || !isOnSupportedChain}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold"
            >
              {isGranting || isCreatingSession ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isCreatingSession
                    ? "Creating Session..."
                    : "Granting Permission..."}
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  {sessionSmartAccount
                    ? "Grant One-Tap Permission"
                    : "Setup One-Tap Betting"}
                </>
              )}
            </Button>

            {/* Permission Settings Modal */}
            <PermissionSettingsModal
              open={isModalOpen}
              onOpenChange={setIsModalOpen}
              onConfirm={handleGrantPermission}
              isLoading={isGranting || isCreatingSession}
            />

            {!isOnSupportedChain && (
              <p className="text-xs text-yellow-400 text-center">
                Please switch to a supported network
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Active Permission */}
            <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/30">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-medium text-white">
                    One-Tap Betting Active
                  </span>
                </div>
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {permission?.storedExpiry
                    ? formatTimeUntil(permission.storedExpiry)
                    : "Active"}
                </span>
              </div>

              <div className="text-xs text-gray-400 space-y-1">
                <p>✓ No approval popups when placing bets</p>
                <p>✓ Max 20 {tokenSymbol} per day</p>
                {sessionSmartAccountAddress && (
                  <p className="text-gray-500 truncate">
                    Session Account: {sessionSmartAccountAddress.slice(0, 10)}
                    ...
                  </p>
                )}
              </div>
            </div>

            {/* Revoke Button */}
            <Button
              onClick={handleRevokePermission}
              disabled={isRevoking}
              variant="outline"
              className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <X className="w-4 h-4 mr-2" />
              {isRevoking ? "Revoking..." : "Revoke Permission"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
