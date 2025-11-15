"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Home,
  BarChart3,
  Trophy,
  User,
  Plus,
} from "lucide-react";

interface SidebarProps {
  onCreateMarket?: () => void;
}

export function DashboardSidebar({ onCreateMarket }: SidebarProps) {
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
    <aside className="hidden lg:block w-64 fixed left-0 h-screen border-r border-[#334155] bg-[#0F172A] pt-16 overflow-y-auto">
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || 
            (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.id}
              href={item.href}
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
            onClick={onCreateMarket}
            className="w-full bg-[#2563EB] hover:bg-blue-700 text-white"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Market
          </Button>
        </div>
      </nav>

      {/* Stats Card */}
      <Card className="m-4 bg-[#1E293B] border-[#334155]">
        <CardContent className="p-4">
          <div className="text-xs text-gray-400 mb-3">Your Stats</div>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Win Rate</span>
                <span className="text-sm font-semibold">87%</span>
              </div>
              <div className="w-full bg-[#334155] rounded-full h-1.5">
                <div
                  className="bg-green-400 h-1.5 rounded-full transition-all"
                  style={{ width: "87%" }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Total Earned</span>
                <span className="text-sm font-semibold text-green-400">
                  $1,500
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Active Predictions</span>
                <span className="text-sm font-semibold">12</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}

