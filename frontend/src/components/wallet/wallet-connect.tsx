"use client";

import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { Button } from "@/components/ui/button";
import {
  formatCurrency,
  isMiniPayAvailable,
  defaultChain,
} from "@/lib/wallet-config";
import { formatAddress } from "@/lib/wallet-config";
import { Wallet, LogOut } from "lucide-react";
import { toast } from "sonner";

interface WalletConnectProps {
  variant?: "default" | "outline" | "ghost";
  showBalance?: boolean;
}

export function WalletConnect({
  variant = "outline",
  showBalance = true,
}: WalletConnectProps) {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  // Use current chain or default to Celo Sepolia
  const currentChainId = chainId || defaultChain.id;

  const { data: balance } = useBalance({
    address: address,
    chainId: currentChainId, // Use current chain (should be Celo Sepolia)
  });

  const handleConnect = () => {
    const minipayConnector = connectors.find((c) => c.id === "injected");
    if (minipayConnector) {
      connect({ connector: minipayConnector });
    } else {
      toast.error(
        "MiniPay not detected. Please open in Opera browser with MiniPay enabled."
      );
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast.success("Wallet disconnected");
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center space-x-3">
        {showBalance && balance && balance.formatted && (
          <div className="hidden sm:flex items-center space-x-2 bg-[#1E293B] border border-[#334155] rounded-lg px-4 py-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">
              {formatCurrency(parseFloat(balance.formatted))}
            </span>
          </div>
        )}
        <Button
          variant={variant}
          onClick={handleDisconnect}
          className="bg-[#1E293B] border-[#334155] hover:bg-[#334155]"
        >
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-[#2563EB] rounded-full flex items-center justify-center">
              <Wallet className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium hidden sm:inline">
              {address ? formatAddress(address) : "..."}
            </span>
            <LogOut className="w-4 h-4 hidden sm:inline" />
          </div>
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isPending}
      variant={variant}
      className="bg-[#2563EB] hover:bg-blue-700 text-white"
    >
      <Wallet className="w-4 h-4 mr-2" />
      {isPending
        ? "Connecting..."
        : isMiniPayAvailable()
        ? "Connect MiniPay"
        : "Connect Wallet"}
    </Button>
  );
}
