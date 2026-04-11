import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain } from "viem";

export const zeroGGalileo = defineChain({
  id: 16602,
  name: "0G Galileo Testnet",
  nativeCurrency: { name: "0G", symbol: "0G", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://evmrpc-testnet.0g.ai"] },
  },
  blockExplorers: {
    default: { name: "Chainscan", url: "https://chainscan-galileo.0g.ai" },
  },
});

export const config = getDefaultConfig({
  appName: "Prophet",
  projectId: "a2b2e8a60965e6d246bf2f72aefd7db9", // Generic placeholder project ID, user can replace if using real WalletConnect
  chains: [zeroGGalileo],
  ssr: true,
});
