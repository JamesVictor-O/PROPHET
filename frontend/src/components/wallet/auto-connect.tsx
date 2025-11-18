"use client";

import { useEffect } from "react";
import { useConnect, useAccount } from "wagmi";
import { isMiniPayAvailable } from "@/lib/wallet-config";

/**
 * Auto-connect component for MiniPay
 * Automatically connects to MiniPay on page load
 * IMPORTANT: Never show a connect button in Mini Apps. Connection should happen automatically.
 */
export function AutoConnect() {
  const { connectors, connect } = useConnect();
  const { isConnected } = useAccount();

  useEffect(() => {
    // Only auto-connect if:
    // 1. We're in MiniPay environment
    // 2. Not already connected
    // 3. We have connectors available
    if (isMiniPayAvailable() && !isConnected && connectors.length > 0) {
      // Use the first connector (injected connector for MiniPay)
      connect({ connector: connectors[0] });
    }
  }, [connect, connectors, isConnected]);

  // This component doesn't render anything
  return null;
}
