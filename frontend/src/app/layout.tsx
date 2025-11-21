import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { WalletProvider } from "@/components/wallet/wallet-provider";
import "./globals.css";

// Suppress known RPC errors in console (these are handled gracefully)
if (typeof window !== "undefined") {
  // Suppress console.error for RPC errors
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    // Check all arguments, not just the first one
    const allArgsString = args.map((arg) => String(arg || "")).join(" ");
    // Suppress known Celo Sepolia RPC errors that are handled gracefully
    const isRpcError =
      (allArgsString.includes("400") ||
        allArgsString.includes("Bad Request") ||
        allArgsString.includes("block is out of range") ||
        allArgsString.includes("-32019") ||
        allArgsString.includes("CallExecutionError") ||
        allArgsString.includes("HttpRequestError") ||
        allArgsString.includes("HTTP request failed")) &&
      (allArgsString.includes("forno.celo-sepolia") ||
        allArgsString.includes("eth_call") ||
        allArgsString.includes("waitForTransactionReceipt") ||
        allArgsString.includes("Status: 400") ||
        allArgsString.includes('"method":"eth_call"'));

    if (isRpcError) {
      // These errors are expected and handled - transaction will still succeed
      // Silently suppress to avoid cluttering console
      return;
    }
    originalError.apply(console, args);
  };

  // Suppress console.warn for RPC errors
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    const warnString = String(args[0] || "");
    // Suppress known Celo Sepolia RPC error warnings
    if (
      (warnString.includes("RPC error") ||
        warnString.includes("block is out of range") ||
        warnString.includes("transaction may still succeed") ||
        warnString.includes("-32019") ||
        warnString.includes("forno.celo-sepolia")) &&
      (warnString.includes("receipt polling") ||
        args.some((arg) => {
          const argStr = String(arg || "");
          return argStr.includes("hash:") || argStr.includes("0x");
        }))
    ) {
      // Silently suppress RPC polling warnings
      return;
    }
    originalWarn.apply(console, args);
  };
}

// Configure Inter font with comprehensive fallbacks
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  fallback: [
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Oxygen",
    "Ubuntu",
    "Cantarell",
    "Fira Sans",
    "Droid Sans",
    "Helvetica Neue",
    "sans-serif",
  ],
  adjustFontFallback: true,
  preload: false, // Disable preload to avoid build-time fetching
});

export const metadata: Metadata = {
  title: "PROPHET - Predict. Earn. Win.",
  description:
    "Turn your entertainment knowledge into earnings. Predict music drops, movie success, and pop culture moments.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <WalletProvider>
          {children}
          <Toaster />
        </WalletProvider>
      </body>
    </html>
  );
}
