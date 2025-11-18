"use client";

import { useEffect } from "react";
import { useConnect, useAccount } from "wagmi";
import { isMiniPayAvailable } from "@/lib/wallet-config";

export function AutoConnect() {
  const { connectors, connect } = useConnect();
  const { isConnected } = useAccount();

  useEffect(() => {
    if (isMiniPayAvailable() && !isConnected && connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
  }, [connect, connectors, isConnected]);
  return null;
}
