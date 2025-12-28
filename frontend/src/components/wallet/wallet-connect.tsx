"use client";

import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import {
  formatCurrency,
  isMiniPayAvailable,
  defaultChain,
} from "@/lib/wallet-config";
import { formatAddress } from "@/lib/wallet-config";
import { Wallet, LogOut, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface WalletConnectProps {
  variant?: "default" | "outline" | "ghost";
  showBalance?: boolean;
  showAddress?: boolean;
  className?: string;
}

export function WalletConnect({
  showBalance = true,
  showAddress = false,
  className,
}: WalletConnectProps) {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isCorrectNetwork = chainId === defaultChain.id;

  const { data: balance } = useBalance({
    address: address,
    chainId: defaultChain.id,
  });

  const handleConnect = () => {
    const minipayConnector = connectors.find((c) => c.id === "injected");
    if (minipayConnector) {
      connect({ connector: minipayConnector });
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  if (!mounted) {
    return (
      <button
        disabled
        className={cn(
          "h-9 px-4 text-gray-300 bg-transparent border-none disabled:opacity-50 font-medium text-sm transition-opacity flex items-center",
          className
        )}
      >
        <Wallet className="w-4 h-4 mr-2 text-gray-400" />
        Connect Wallet
      </button>
    );
  }

  const isMiniPay = isMiniPayAvailable();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        {showBalance && balance && balance.formatted && isCorrectNetwork && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">
              {formatCurrency(parseFloat(balance.formatted))} ETH
            </span>
          </div>
        )}
        <button
          onClick={handleDisconnect}
          className={cn(
            "h-9 px-4 text-sm font-medium text-gray-300 bg-transparent border-none hover:opacity-80 transition-opacity flex items-center gap-2",
            className
          )}
        >
          <Wallet className="w-4 h-4 text-gray-400" />
          <span className={showAddress ? "" : "hidden sm:inline"}>
            {address ? formatAddress(address) : "..."}
          </span>
          {showAddress && <LogOut className="w-3.5 h-3.5 text-gray-400" />}
        </button>
      </div>
    );
  }

  if (isMiniPay && isPending) {
    return (
      <button
        disabled
        className={cn(
          "h-9 px-4 text-sm font-medium text-gray-400 bg-transparent border-none disabled:opacity-50 flex items-center",
          className
        )}
      >
        <Wallet className="w-4 h-4 mr-2" />
        Connecting...
      </button>
    );
  }

  if (isMiniPay && !isConnected) {
    return null;
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isPending}
      className={cn(
        "h-9 px-4 text-sm font-medium text-gray-300 bg-transparent border-none hover:opacity-80 disabled:opacity-50 transition-opacity flex items-center",
        className
      )}
    >
      <Wallet className="w-4 h-4 mr-2 text-gray-400" />
      {isPending ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}
