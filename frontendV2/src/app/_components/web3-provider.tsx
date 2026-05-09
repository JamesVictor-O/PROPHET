"use client";

import * as React from "react";
import { RainbowKitProvider, darkTheme, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { WagmiProvider, type Config } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { zeroGGalileo } from "../../lib/web3-config";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = React.useState<Config | null>(null);

  React.useEffect(() => {
    setConfig(getDefaultConfig({
      appName: "Prophet",
      projectId: "a2b2e8a60965e6d246bf2f72aefd7db9",
      chains: [zeroGGalileo],
      ssr: false,
    }));
  }, []);

  if (!config) return null;

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#7B6EF4",
            accentColorForeground: "white",
            borderRadius: "small",
            fontStack: "system",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
