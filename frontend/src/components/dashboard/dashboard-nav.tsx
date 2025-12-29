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
    <nav className="fixed top-0 w-full bg-[#020617]/80 backdrop-blur-xl border-b border-white/[0.05] z-[100]">
      {/* Top Protocol Status Line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Section: Logo & Status */}
          <div className="flex items-center rounded-full">
            <Link
              href="/"
              className="flex items-center transition-opacity hover:opacity-80"
            >
              <Image
                src="/Logo3.png"
                alt="PROPHET"
                width={140}
                height={40}
                className="h-8 w-auto sm:h-9 bg-blue-500 object-cover rounded-full"
                priority
              />
            </Link>

           
          </div>

          {/* Right Section: Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
        

            {/* Wallet Integration */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:block">
                <WalletConnect
                  showBalance={false}
                  variant="outline"
                  className="bg-white/5 border-white/10 hover:bg-white hover:text-black transition-all duration-300 rounded-xl text-[10px] font-black uppercase tracking-widest px-6 h-10"
                />
              </div>

              {/* Mobile Menu (Hamburger) */}
              <div className="lg:hidden">
                <MobileMenu onCreateMarket={onCreateMarket} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
