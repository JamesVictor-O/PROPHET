"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, BarChart3, Trophy, User, Plus } from "lucide-react";

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
          className="lg:hidden bg-[#1E293B] border-[#334155]"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-64 bg-[#0F172A] border-[#334155] p-0"
      >
        <nav className="p-4 space-y-2">
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

          <div className="pt-4 border-t border-[#334155] mt-4">
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
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
