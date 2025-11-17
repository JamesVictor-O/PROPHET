"use client";

import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { WalletConnect } from "./wallet-connect";
import { formatAddress } from "@/lib/wallet-config";
import { Wallet } from "lucide-react";

interface WalletButtonProps {
  showBalance?: boolean;
  className?: string;
}

export function WalletButton({
  showBalance = true,
  className,
}: WalletButtonProps) {
  const { address, isConnected } = useAccount();

  if (isConnected && address) {
    return (
      <Button
        variant="outline"
        className={`bg-[#1E293B] border-[#334155] hover:bg-[#334155] ${className}`}
      >
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-[#2563EB] rounded-full flex items-center justify-center">
            <Wallet className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-medium hidden sm:inline">
            {formatAddress(address)}
          </span>
        </div>
      </Button>
    );
  }

  return <WalletConnect showBalance={showBalance} variant="outline" />;
}
