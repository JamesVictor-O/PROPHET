"use client";

import { Button } from "@/components/ui/button";
import { Plus, MapPin } from "lucide-react";

interface HomeHeaderProps {
  onCreateMarket: () => void;
}

export function HomeHeader({ onCreateMarket }: HomeHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-5 h-5 text-emerald-400" />
          <span className="text-emerald-400 text-xs uppercase tracking-widest font-bold">
            Africa Focus
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white leading-tight">
          Discover{" "}
          <span className="text-slate-500 italic font-serif">Trending</span>{" "}
          Events
        </h1>
        <p className="text-slate-500 font-medium text-sm md:text-base max-w-2xl">
          Stay up to date with the latest happenings across Africa. Use these
          events as inspiration to create prediction markets and engage with the
          community.
        </p>
      </div>

      <Button
        onClick={onCreateMarket}
        className="bg-white text-black hover:bg-slate-200 rounded-full px-6 py-6 text-xs font-bold uppercase tracking-widest transition-all shadow-xl shadow-white/5"
      >
        <Plus className="w-4 h-4 mr-2 stroke-[3px]" />
        Create Market
      </Button>
    </div>
  );
}

