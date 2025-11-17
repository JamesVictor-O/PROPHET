"use client";

import Link from "next/link";
import { WalletConnect } from "@/components/wallet/wallet-connect";

export function Navigation() {
  return (
    <nav className="fixed top-0 w-full bg-[#0F172A]/95 backdrop-blur-sm border-b border-[#334155] z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-xl font-bold">PROPHET</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="#features"
              className="text-gray-300 hover:text-white text-sm font-medium"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-gray-300 hover:text-white text-sm font-medium"
            >
              How It Works
            </Link>
            <Link
              href="#markets"
              className="text-gray-300 hover:text-white text-sm font-medium"
            >
              Markets
            </Link>
            <Link
              href="/dashboard"
              className="text-gray-300 hover:text-white text-sm font-medium"
            >
              Dashboard
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            <WalletConnect showBalance={false} variant="default" />
          </div>
        </div>
      </div>
    </nav>
  );
}
