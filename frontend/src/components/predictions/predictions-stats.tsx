"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  TrendingUp,
  DollarSign,
  Target,
  Award,
  Zap,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PredictionsStatsProps {
  stats: {
    total: number;
    active: number;
    won: number;
    lost: number;
    totalEarned: number;
    totalStaked: number;
    winRate: string;
  };
}

export function PredictionsStats({ stats }: PredictionsStatsProps) {
  const profit = stats.totalEarned - stats.totalStaked;
  const isProfitable = profit >= 0;

  const statConfig = [
    {
      label: "Total Earned",
      value: `$${stats.totalEarned.toFixed(2)}`,
      icon: <DollarSign className="w-4 h-4 text-emerald-400" />,
      color: "text-emerald-400",
      glow: "bg-emerald-500/10",
      border: "hover:border-emerald-500/30",
    },
    {
      label: "Active Nodes",
      value: stats.active.toString(),
      icon: <Target className="w-4 h-4 text-blue-400" />,
      color: "text-white",
      glow: "bg-blue-500/10",
      border: "hover:border-blue-500/30",
    },
    {
      label: "Prophet Accuracy",
      value: `${stats.winRate}%`,
      icon: <Award className="w-4 h-4 text-purple-400" />,
      color: "text-purple-400",
      glow: "bg-purple-500/10",
      border: "hover:border-purple-500/30",
    },
    {
      label: "Net Protocol PnL",
      value: `${isProfitable ? "+" : ""}$${profit.toFixed(2)}`,
      icon: (
        <TrendingUp
          className={cn(
            "w-4 h-4",
            isProfitable ? "text-emerald-400" : "text-red-400"
          )}
        />
      ),
      color: isProfitable ? "text-emerald-400" : "text-red-400",
      glow: isProfitable ? "bg-emerald-500/10" : "bg-red-500/10",
      border: isProfitable
        ? "hover:border-emerald-500/30"
        : "hover:border-red-500/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {statConfig.map((item, idx) => (
        <Card
          key={idx}
          className={cn(
            "relative bg-[#020617]/40 backdrop-blur-xl border-white/5 rounded-2xl overflow-hidden transition-all duration-500 group",
            item.border
          )}
        >
          {/* Subtle top-light effect */}
          <div
            className={cn(
              "absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500",
              item.color.replace("text", "bg")
            )}
          />

          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110",
                  item.glow
                )}
              >
                {item.icon}
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 leading-none">
                {item.label}
              </span>
            </div>

            <div className="space-y-1">
              <div
                className={cn(
                  "text-xl sm:text-2xl font-black italic tracking-tighter leading-none",
                  item.color === "text-white" ? "text-white" : item.color
                )}
              >
                {item.value}
              </div>

              {/* Animated HUD line */}
              <div className="flex gap-1 items-center">
                <div
                  className={cn(
                    "h-0.5 w-8 rounded-full opacity-30",
                    item.color.replace("text", "bg")
                  )}
                />
                <div className="h-0.5 w-1 bg-white/10 rounded-full" />
                <div className="h-0.5 w-1 bg-white/10 rounded-full" />
              </div>
            </div>

            {/* Background Icon Watermark */}
            <div className="absolute -bottom-2 -right-2 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-all duration-700">
              {item.icon && <div className="scale-[3]">{item.icon}</div>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
