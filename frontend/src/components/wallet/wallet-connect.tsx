"use client";

import {
  useAccount,
  useConnect,
  useDisconnect,
  useBalance,
  useSwitchChain,
} from "wagmi";
import {
  formatCurrency,
  isMiniPayAvailable,
  defaultChain,
  addCeloSepoliaToMetaMask,
} from "@/lib/wallet-config";
import { formatAddress } from "@/lib/wallet-config";
import { Wallet, LogOut, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface WalletConnectProps {
  variant?: "default" | "outline" | "ghost"; // Kept for backward compatibility
  showBalance?: boolean;
  showAddress?: boolean;
}

export function WalletConnect({
  showBalance = true,
  showAddress = false,
}: WalletConnectProps) {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  // Check if on correct network (Celo Sepolia)
  const isCorrectNetwork = chainId === defaultChain.id;
  const isWrongNetwork = isConnected && !isCorrectNetwork;

  // Use current chain or default to Celo Sepolia
  const currentChainId = chainId || defaultChain.id;

  const { data: balance } = useBalance({
    address: address,
    chainId: isCorrectNetwork ? defaultChain.id : currentChainId,
  });

  // Prevent hydration mismatch - check if we're on client side
  const isClient = typeof window !== "undefined";

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
  if (!isClient) {
    return (
      <button
        disabled
        className="h-9 px-4 text-gray-300 bg-transparent border-none disabled:opacity-50 font-medium text-sm transition-opacity flex items-center"
      >
        <Wallet className="w-4 h-4 mr-2 text-gray-400" />
        Connect Wallet
      </button>
    );
  }

  // In MiniPay, don't show connect button - auto-connect handles it
  const isMiniPay = isMiniPayAvailable();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        {isWrongNetwork && (
          <button
            onClick={handleSwitchNetwork}
            disabled={isSwitching}
            className="h-9 px-4 text-sm font-medium text-amber-400 bg-transparent border-none hover:opacity-80 disabled:opacity-50 transition-opacity flex items-center"
          >
            <AlertTriangle className="w-4 h-4 mr-1.5" />
            {isSwitching ? "Switching..." : "Switch Network"}
          </button>
        )}
        {showBalance && balance && balance.formatted && isCorrectNetwork && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">
              {formatCurrency(parseFloat(balance.formatted))} cUSD
            </span>
          </div>
        )}
        <button
          onClick={handleDisconnect}
          className="h-9 px-4 text-sm font-medium text-gray-300 bg-transparent border-none hover:opacity-80 transition-opacity flex items-center gap-2"
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

  // In MiniPay, don't show connect button - connection happens automatically
  // Show a loading state while connecting
  if (isMiniPay && isPending) {
    return (
      <button
        disabled
        className="h-9 px-4 text-sm font-medium text-gray-400 bg-transparent border-none disabled:opacity-50 flex items-center"
      >
        <Wallet className="w-4 h-4 mr-2" />
        Connecting...
      </button>
    );
  }

  // If in MiniPay and not connected yet, show nothing or a minimal loading state
  // The AutoConnect component will handle the connection
  if (isMiniPay && !isConnected) {
    return null;
  }

  // For non-MiniPay environments, show the connect button
  return (
    <button
      onClick={handleConnect}
      disabled={isPending}
      className="h-9 px-4 text-sm font-medium text-gray-300 bg-transparent border-none hover:opacity-80 disabled:opacity-50 transition-opacity flex items-center"
    >
      <Wallet className="w-4 h-4 mr-2 text-gray-400" />
      {isPending ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}
