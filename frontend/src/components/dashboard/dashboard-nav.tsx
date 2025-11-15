"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MobileMenu } from "./mobile-menu";

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
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 bg-[#1E293B] border border-[#334155] rounded-lg px-4 py-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">$124.50</span>
            </div>
            <Button
              variant="outline"
              className="bg-[#1E293B] border-[#334155] hover:bg-[#334155]"
            >
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-[#2563EB] rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">PJ</span>
                </div>
                <span className="text-sm font-medium hidden sm:inline">
                  @philip.jr
                </span>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
