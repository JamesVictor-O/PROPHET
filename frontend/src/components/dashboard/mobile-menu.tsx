"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, BarChart3, Trophy, User, Plus } from "lucide-react";
import { WalletConnect } from "@/components/wallet/wallet-connect";
import { PermissionButton } from "@/components/wallet/permission-button";

interface MobileMenuProps {
  onCreateMarket?: () => void;
}

export function MobileMenu({ onCreateMarket }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { id: "markets", label: "Markets", icon: Home, href: "/dashboard" },
    {
      id: "predictions",
      label: "My Predictions",
      icon: BarChart3,
      href: "/dashboard/predictions",
    },
    {
      id: "leaderboard",
      label: "Leaderboard",
      icon: Trophy,
      href: "/dashboard/leaderboard",
    },
    { id: "profile", label: "Profile", icon: User, href: "/dashboard/profile" },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="lg:hidden bg-[#1E293B] border-dark-700 h-9 w-9 p-0"
        >
          <Menu className="w-4 h-4" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-64 sm:w-80 bg-[#0F172A] border-dark-700 p-0 flex flex-col"
      >
        <SheetHeader className="p-4 pb-2 border-b border-dark-700 shrink-0">
          <SheetTitle className="text-white">Menu</SheetTitle>
          <SheetDescription className="text-gray-400">
            Navigate through the app
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-[#2563EB] text-white"
                      : "hover:bg-[#1E293B] text-gray-400"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}

            <div className="pt-4 border-t border-dark-700 mt-4 space-y-2">
              <Button
                onClick={() => {
                  onCreateMarket?.();
                  setOpen(false);
                }}
                className="w-full bg-[#2563EB] hover:bg-blue-700 text-white"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Market
              </Button>
              <PermissionButton variant="outline" size="default" className="w-full" />
            </div>
          </nav>

          {/* Wallet Connect at Bottom */}
          <div className="p-4 border-t border-dark-700 shrink-0 bg-[#0F172A]">
            <div className="w-full">
              <WalletConnect
                showBalance={true}
                showAddress={true}
                variant="outline"
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
