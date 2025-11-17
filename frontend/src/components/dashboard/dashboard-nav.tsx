"use client";

import Link from "next/link";
import { MobileMenu } from "./mobile-menu";
import { WalletConnect } from "@/components/wallet/wallet-connect";

interface DashboardNavProps {
  onCreateMarket?: () => void;
}

export function DashboardNav({ onCreateMarket }: DashboardNavProps) {
  return (
    <nav className="fixed top-0 w-full bg-[#0F172A]/95 backdrop-blur-sm border-b border-[#334155] z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Mobile Menu */}
          <div className="flex items-center space-x-3">
            <MobileMenu onCreateMarket={onCreateMarket} />
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <span className="text-xl font-bold hidden sm:inline">
                PROPHET
              </span>
            </Link>
          </div>

          {/* Wallet Info */}
          <WalletConnect showBalance={true} variant="outline" />
        </div>
      </div>
    </nav>
  );
}
