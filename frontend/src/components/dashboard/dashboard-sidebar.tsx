"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { Home, BarChart3, Trophy, User, Zap, Globe } from "lucide-react";
import { useUserStatsGraphQL } from "@/hooks/graphql";
import { useUserPredictions } from "@/hooks/contracts";
import { formatTokenAmount } from "@/lib/utils";
import { useMemo } from "react";
import { useChainId } from "wagmi";
import { PermissionButton } from "@/components/wallet/permission-button";
import { cn } from "@/lib/utils";

export function DashboardSidebar() {
  const pathname = usePathname();
  const { address } = useAccount();
  const chainId = useChainId();
  const { data: userStats } = useUserStatsGraphQL(address);
  const { data: userPredictions } = useUserPredictions();

  const stats = useMemo(() => {
    if (!userStats) return { winRate: 0, totalEarned: 0, activePredictions: 0 };

    const totalPredictions = Number(userStats.totalPredictions);
    const wins = Number(userStats.correctPredictions);
    const winRate =
      totalPredictions > 0 ? Math.round((wins / totalPredictions) * 100) : 0;
    const totalEarned = Number(
      formatTokenAmount(userStats.totalWinnings || BigInt(0), chainId)
    );
    const activePredictions = userPredictions
      ? userPredictions.filter((p) => p.status === "active").length
      : 0;

    return { winRate, totalEarned, activePredictions };
  }, [userStats, userPredictions]);

  const navItems = [
    { id: "home", label: "Home", icon: Globe, href: "/dashboard/home" },
    { id: "markets", label: "Markets", icon: Home, href: "/dashboard" },
    {
      id: "predictions",
      label: "Predictions",
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
      <aside className="hidden lg:flex flex-col w-64 fixed left-0 h-screen border-r border-white/5 bg-[#020617] pt-20 transition-all">
        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1.5">
          <p className="px-4 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-4">
            Navigation
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-200 group",
                  isActive
                    ? "bg-blue-500/10 text-blue-400"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.03]"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-transform group-hover:scale-110",
                    isActive ? "text-blue-400" : "text-slate-500"
                  )}
                />
                <span className="text-sm font-medium tracking-tight">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Action & Stats Footer */}
        <div className="p-4 space-y-6 mb-6">
          <div className="px-2">
            <PermissionButton
              variant="outline"
              className="w-full bg-transparent border-white/10 hover:bg-white/5 text-slate-300 text-xs h-10 rounded-xl"
            />
          </div>

          {/* Integrated Stats Section */}
          <div className="px-4 py-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-5">
            <div className="flex items-center gap-2 text-emerald-500">
              <Zap className="w-3 h-3 fill-emerald-500" />
              <span className="text-[10px] uppercase tracking-widest font-bold">
                Live Status
              </span>
            </div>

            <SidebarStat
              label="Win Rate"
              value={`${stats.winRate}%`}
              color="text-white"
            />
            <SidebarStat
              label="Net Profit"
              value={`$${stats.totalEarned.toFixed(2)}`}
              color="text-emerald-400"
            />
            <SidebarStat
              label="Active"
              value={stats.activePredictions}
              color="text-blue-400"
            />
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation - Slick & Minimal */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#020617]/80 backdrop-blur-xl border-t border-white/5 z-50 pb-safe">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full transition-all gap-1",
                  isActive ? "text-blue-400" : "text-slate-500"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] uppercase tracking-widest font-bold">
                  {item.id === "predictions" ? "Predict" : item.id}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

function SidebarStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex justify-between items-end">
      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
        {label}
      </span>
      <span
        className={cn("text-sm font-mono tracking-tighter font-bold", color)}
      >
        {value}
      </span>
    </div>
  );
}
