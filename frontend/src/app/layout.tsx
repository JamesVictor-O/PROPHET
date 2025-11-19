import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { WalletProvider } from "@/components/wallet/wallet-provider";
import "./globals.css";

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
