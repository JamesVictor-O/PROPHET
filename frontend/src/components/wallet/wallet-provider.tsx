"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { config } from "@/lib/wallet-config";
import { ReactNode } from "react";
import { AutoConnect } from "./auto-connect";
import { SmartAccountProvider } from "@/contexts/smart-account-context";

const queryClient = new QueryClient();

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <SmartAccountProvider>
          <AutoConnect />
          {children}
        </SmartAccountProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
