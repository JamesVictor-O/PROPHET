"use client";

import {
  Target,
  DollarSign,
  Award,
  Zap,
  Trophy,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

interface ProfileStatsProps {
  stats: {
    totalPredictions: number;
    wins: number;
    losses: number;
    winRate: number;
    totalEarned: number;
    totalStaked: number;
    profit: number;
    currentStreak: number;
    bestStreak: number;
    rank: number;
  };
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  const isProfitable = stats.profit >= 0;
  const profitPercentage =
    stats.totalStaked > 0
      ? ((stats.profit / stats.totalStaked) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-8">
        <StatItem
          label="Total Predictions"
          value={stats.totalPredictions}
          icon={<Target className="w-4 h-4" />}
        />
        <StatItem
          label="Net Earnings"
          value={`$${stats.totalEarned.toLocaleString()}`}
          icon={<DollarSign className="w-4 h-4" />}
          trend={
            isProfitable ? `+${profitPercentage}%` : `${profitPercentage}%`
          }
          trendPositive={isProfitable}
        />
        <StatItem
          label="Win Rate"
          value={`${stats.winRate}%`}
          icon={<Award className="w-4 h-4" />}
          color="text-purple-400"
        />
        <StatItem
          label="Global Rank"
          value={`#${stats.rank}`}
          icon={<Trophy className="w-4 h-4" />}
          color="text-blue-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 pt-8 border-t border-white/5">
        <section className="space-y-6">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">
            Performance Analysis
          </h3>
          <div className="space-y-4">
            <DetailRow
              label="Total Staked"
              value={`$${stats.totalStaked.toFixed(2)}`}
            />
            <DetailRow
              label="Net Profit"
              value={`${isProfitable ? "+" : ""}$${stats.profit.toFixed(2)}`}
              valueClass={isProfitable ? "text-emerald-400" : "text-rose-400"}
            />
            <DetailRow
              label="Total Losses"
              value={stats.losses}
              valueClass="text-slate-400"
            />
          </div>
        </section>
        <section className="space-y-6">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">
            Activity Streaks
          </h3>
          <div className="grid grid-cols-2 gap-8">
            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
              <Zap className="w-5 h-5 text-orange-400 mb-3" />
              <p className="text-2xl font-light text-white">
                {stats.currentStreak}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">
                Current Streak
              </p>
            </div>
            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
              <Trophy className="w-5 h-5 text-yellow-400 mb-3" />
              <p className="text-2xl font-light text-white">
                {stats.bestStreak}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">
                Best Ever
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

{
  /* --- Reusable Professional Sub-components --- */
}

interface StatItemProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  trend?: string;
  trendPositive?: boolean;
}

function StatItem({
  label,
  value,
  icon,
  color = "text-white",
  trend,
  trendPositive,
}: StatItemProps) {
  return (
    <div className="group cursor-default">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-lg bg-slate-800/40 text-slate-400 group-hover:text-blue-400 transition-colors">
          {icon}
        </div>
        <span className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-semibold">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-3">
        <span
          className={cn(
            "text-4xl font-light tracking-tight transition-all",
            color
          )}
        >
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium flex items-center",
              trendPositive ? "text-emerald-500" : "text-rose-500"
            )}
          >
            <ArrowUpRight className="w-3 h-3 mr-0.5" />
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

interface DetailRowProps {
  label: string;
  value: string | number;
  valueClass?: string;
}

function DetailRow({
  label,
  value,
  valueClass = "text-white",
}: DetailRowProps) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-white/[0.03] last:border-0">
      <span className="text-sm text-slate-400 font-medium">{label}</span>
      <span
        className={cn(
          "text-sm font-mono tracking-tighter font-semibold",
          valueClass
        )}
      >
        {value}
      </span>
    </div>
  );
}
