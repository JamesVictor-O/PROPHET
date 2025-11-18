"use client";

import Link from "next/link";
import Image from "next/image";
import { MobileMenu } from "./mobile-menu";
import { WalletConnect } from "@/components/wallet/wallet-connect";

interface DashboardNavProps {
  onCreateMarket?: () => void;
}

export function DashboardNav({ onCreateMarket }: DashboardNavProps) {
  return (
    <nav className="fixed top-0 w-full bg-[#0F172A]/95 backdrop-blur-sm border-b border-dark-700 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            {/* Mobile Logo */}
            <Image
              src="/Logo1.png"
              alt="PROPHET"
              width={120}
              height={32}
              className="h-7 w-auto sm:h-8 md:hidden"
              priority
            />
            {/* Desktop Logo */}
            <Image
              src="/Logo2.png"
              alt="PROPHET"
              width={140}
              height={40}
              className="h-10 w-auto hidden md:block"
              priority
            />
          </Link>

          {/* Right Side - Wallet Connect (Desktop) + Mobile Menu */}
          <div className="flex items-center gap-3">
            {/* Desktop Wallet Connect */}
            <div className="hidden lg:block">
              <WalletConnect showBalance={false} variant="outline" />
            </div>

            {/* Mobile Menu (Hamburger) */}
            <MobileMenu onCreateMarket={onCreateMarket} />
          </div>
        </div>
      </div>
    </nav>
  );
}
