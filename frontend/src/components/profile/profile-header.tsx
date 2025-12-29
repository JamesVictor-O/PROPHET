"use client";

import { Badge } from "@/components/ui/badge";
import { Trophy, ShieldCheck, MapPin, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileHeaderProps {
  user: {
    username: string;
    displayName: string;
    initials: string;
    email: string;
    joinDate: string;
    bio: string;
    avatar?: string | null;
  };
  stats: {
    rank: number;
    winRate: number;
    currentStreak: number;
  };
}

export function ProfileHeader({ user, stats }: ProfileHeaderProps) {
  return (
    <div className="relative w-full animate-in fade-in duration-1000">
      <div className="flex flex-col lg:flex-row items-start lg:items-end gap-8 lg:gap-12">
        {/* 1. Ultra-Clean Avatar Area */}
        <div className="relative group">
          <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-2xl shadow-blue-500/10 transition-transform group-hover:scale-[1.02] duration-500">
            <span className="text-white font-light text-5xl tracking-tighter italic">
              {user.initials}
            </span>
          </div>
          {/* Subtle Verified Badge */}
          <div className="absolute -bottom-2 -right-2 bg-[#020617] p-1.5 rounded-full border border-white/10">
            <ShieldCheck className="w-5 h-5 text-blue-400 fill-blue-400/10" />
          </div>
        </div>

        {/* 2. User Info & Typography */}
        <div className="flex-1 space-y-4">
          <div className="space-y-1">
            <div className="flex flex-col gap-3 flex-wrap">
              <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white leading-tight">
                {user.displayName}
              </h1>
              <div className="flex gap-2">
                {stats.currentStreak >= 3 && (
                  <Badge className="bg-orange-500/10 text-orange-400 border-none px-3 py-1 text-[10px] uppercase tracking-widest font-bold">
                    🔥 {stats.currentStreak} Day Streak
                  </Badge>
                )}
                <Badge className="bg-blue-500/10 text-blue-400 border-none px-3 py-1 text-[10px] uppercase tracking-widest font-bold">
                  Pro Trader
                </Badge>
              </div>
            </div>
            <p className="text-lg font-mono text-slate-500 tracking-tighter">
              {user.username}
            </p>
          </div>

        
        </div>

        {/* 4. Strategic Secondary Stats (Desktop Only) */}
        <div className="hidden xl:flex gap-12 border-l border-white/5 pl-12 h-20 items-center">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">
              Global Standing
            </p>
            <p className="text-3xl font-light text-emerald-400 tracking-tighter">
              Top {((stats.rank / 1000) * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-500">
      <span className="opacity-70">{icon}</span>
      <span className="text-[11px] font-bold uppercase tracking-wider">
        {text}
      </span>
    </div>
  );
}
