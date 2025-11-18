"use client";

import {
  useAccount,
  useConnect,
  useDisconnect,
  useBalance,
  useSwitchChain,
} from "wagmi";
import { Button } from "@/components/ui/button";
import {
  formatCurrency,
  isMiniPayAvailable,
  defaultChain,
  addCeloSepoliaToMetaMask,
} from "@/lib/wallet-config";
import { formatAddress } from "@/lib/wallet-config";
import { Wallet, LogOut, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface WalletConnectProps {
  variant?: "default" | "outline" | "ghost";
  showBalance?: boolean;
  showAddress?: boolean;
}

export function WalletConnect({
  variant = "outline",
  showBalance = true,
  showAddress = false,
}: WalletConnectProps) {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  // Prevent hydration mismatch by only rendering wallet state after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if on correct network (Celo Sepolia)
  const isCorrectNetwork = chainId === defaultChain.id;
  const isWrongNetwork = isConnected && !isCorrectNetwork;

  // Use current chain or default to Celo Sepolia
  const currentChainId = chainId || defaultChain.id;

  const { data: balance } = useBalance({
    address: address,
    chainId: isCorrectNetwork ? defaultChain.id : currentChainId,
  });

  const handleSwitchNetwork = async () => {
    try {
      // First try to switch using wagmi
      await switchChain({ chainId: defaultChain.id });
      toast.success("Switched to Celo Sepolia");
    } catch (error: unknown) {
      console.error("Error switching network:", error);
      const err = error as { code?: number };

      // If network doesn't exist (4902), try to add it
      if (err?.code === 4902) {
        toast.info("Adding Celo Sepolia network to your wallet...");
        const added = await addCeloSepoliaToMetaMask();
        if (added) {
          toast.success("Network added! Please try again.");
        } else {
          toast.error(
            "Failed to add network. Please add manually in MetaMask."
          );
        }
      } else {
        // For other errors, try direct MetaMask call as fallback
        try {
          const added = await addCeloSepoliaToMetaMask();
          if (added) {
            toast.success("Switched to Celo Sepolia");
          } else {
            toast.error(
              "Failed to switch network. Please switch manually in MetaMask."
            );
          }
        } catch (fallbackError) {
          console.error("Fallback network switch failed:", fallbackError);
          toast.error(
            "Failed to switch network. Please switch manually in MetaMask."
          );
        }
      }
    }
  };

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

  // Prevent hydration mismatch - show connect button during SSR and initial render
  if (!mounted) {
    return (
      <Button
        disabled
        variant={variant}
        className="bg-[#2563EB] hover:bg-blue-700 text-white"
      >
        <Wallet className="w-4 h-4 mr-2" />
        Connect Wallet
      </Button>
    );
  }

  // In MiniPay, don't show connect button - auto-connect handles it
  const isMiniPay = isMiniPayAvailable();

  if (isConnected && address) {
    return (
      <div className="flex items-center space-x-3">
        {isWrongNetwork && (
          <Button
            onClick={handleSwitchNetwork}
            disabled={isSwitching}
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            {isSwitching ? "Switching..." : "Switch to Sepolia"}
          </Button>
        )}
        {showBalance && balance && balance.formatted && isCorrectNetwork && (
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
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                isCorrectNetwork ? "bg-[#2563EB]" : "bg-orange-500"
              }`}
            >
              <Wallet className="w-3 h-3 text-white" />
            </div>
            <span className={`text-sm font-medium ${showAddress ? "" : "hidden sm:inline"}`}>
              {address ? formatAddress(address) : "..."}
            </span>
            <LogOut className={`w-4 h-4 ${showAddress ? "" : "hidden sm:inline"}`} />
          </div>
        </Button>
      </div>
    );
  }

  // In MiniPay, don't show connect button - connection happens automatically
  // Show a loading state while connecting
  if (isMiniPay && isPending) {
    return (
      <Button
        disabled
        variant={variant}
        className="bg-[#2563EB] hover:bg-blue-700 text-white"
      >
        <Wallet className="w-4 h-4 mr-2" />
        Connecting...
      </Button>
    );
  }

  // If in MiniPay and not connected yet, show nothing or a minimal loading state
  // The AutoConnect component will handle the connection
  if (isMiniPay && !isConnected) {
    return null;
  }

  // For non-MiniPay environments, show the connect button
  return (
    <Button
      onClick={handleConnect}
      disabled={isPending}
      variant={variant}
      className="bg-[#2563EB] hover:bg-blue-700 text-white"
    >
      <Wallet className="w-4 h-4 mr-2" />
      {isPending ? "Connecting..." : "Connect Wallet"}
    </Button>
  );
}
