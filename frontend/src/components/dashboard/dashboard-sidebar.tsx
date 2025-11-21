"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { Card, CardContent } from "@/components/ui/card";
import { Home, BarChart3, Trophy, User } from "lucide-react";
import { useUserStats, useUserPredictions } from "@/hooks/contracts";
import { formatEther } from "viem";
import { useMemo } from "react";

interface SidebarProps {
  onCreateMarket?: () => void;
}

export function DashboardSidebar({ onCreateMarket }: SidebarProps) {
  const pathname = usePathname();
  const { address } = useAccount();
  const { data: userStats } = useUserStats(address);
  const { data: userPredictions } = useUserPredictions();

  // Calculate stats
  const stats = useMemo(() => {
    if (!userStats) {
      return {
        winRate: 0,
        totalEarned: 0,
        activePredictions: 0,
      };
    }

    const totalPredictions = Number(userStats.totalPredictions);
    const wins = Number(userStats.correctPredictions);
    const winRate =
      totalPredictions > 0 ? Math.round((wins / totalPredictions) * 100) : 0;
    const totalEarned = Number(formatEther(userStats.totalWinnings || BigInt(0)));
    
    // Count active predictions
    const activePredictions = userPredictions
      ? userPredictions.filter((p) => p.status === "active").length
      : 0;

    return {
      winRate,
      totalEarned,
      activePredictions,
    };
  }, [userStats, userPredictions]);

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
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 fixed left-0 h-screen border-r border-dark-700 bg-[#0F172A] pt-16 overflow-y-auto">
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

        </nav>

        {/* Stats Card */}
        <Card className="m-4 bg-[#1E293B] border-dark-700">
          <CardContent className="p-4">
            <div className="text-xs text-gray-400 mb-3">Your Stats</div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">Win Rate</span>
                  <span className="text-sm font-semibold">
                    {stats.winRate}%
                  </span>
                </div>
                <div className="w-full bg-dark-700 rounded-full h-1.5">
                  <div
                    className="bg-green-400 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(stats.winRate, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Total Earned</span>
                  <span className="text-sm font-semibold text-green-400">
                    ${stats.totalEarned.toFixed(2)}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    Active Predictions
                  </span>
                  <span className="text-sm font-semibold">
                    {stats.activePredictions}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0F172A]/95 backdrop-blur-sm border-t border-dark-700 z-50 safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-1 sm:px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname?.startsWith(item.href));
            const shortLabels: Record<string, string> = {
              Markets: "Markets",
              "My Predictions": "Predictions",
              Leaderboard: "Leaderboard",
              Profile: "Profile",
            };
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors min-w-0 px-1 ${
                  isActive ? "text-[#2563EB]" : "text-gray-400"
                }`}
              >
                <Icon className="w-5 h-5 mb-0.5 sm:mb-1 shrink-0" />
                <span className="text-[10px] sm:text-xs font-medium truncate w-full text-center">
                  {shortLabels[item.label] || item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
