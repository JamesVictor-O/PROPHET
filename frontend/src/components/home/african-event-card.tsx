"use client";

import { Button } from "@/components/ui/button";
import { TrendingUp, Clock, MapPin, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AfricanEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  country: string;
  source: string;
  publishedAt: string;
  url?: string;
  imageUrl?: string;
  tags?: string[];
}

interface AfricanEventCardProps {
  event: AfricanEvent;
  variant?: "trending" | "latest";
  onCreateMarket: () => void;
}

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `${Math.floor(diffInSeconds / 604800)}w ago`;
}

export function AfricanEventCard({
  event,
  variant = "latest",
  onCreateMarket,
}: AfricanEventCardProps) {
  const isTrending = variant === "trending";
  const timeAgo = formatTimeAgo(event.publishedAt);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl",
        isTrending
          ? "bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/20 hover:border-blue-500/30"
          : "bg-gradient-to-br from-slate-800/50 to-slate-900/30 border-white/5 hover:border-white/10"
      )}
    >
      {/* Gradient Overlay */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          isTrending
            ? "bg-gradient-to-br from-blue-500/5 to-transparent"
            : "bg-gradient-to-br from-emerald-500/5 to-transparent"
        )}
      />

      {/* Content */}
      <div className="relative p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {isTrending && (
                <TrendingUp className="w-4 h-4 text-blue-400 flex-shrink-0" />
              )}
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold truncate">
                {event.category}
              </span>
            </div>
            <h3 className="text-base font-bold text-white line-clamp-2 leading-snug mb-2">
              {event.title}
            </h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed">
          {event.description}
        </p>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span className="font-medium">{event.country}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{timeAgo}</span>
          </div>
        </div>

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {event.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-[10px] uppercase tracking-wider bg-white/5 border border-white/10 rounded-lg text-slate-400 font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2 border-t border-white/5">
          <Button
            onClick={onCreateMarket}
            className={cn(
              "flex-1 h-9 text-xs font-bold uppercase tracking-wider rounded-xl transition-all",
              isTrending
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 hover:border-blue-500/50"
                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 hover:border-emerald-500/50"
            )}
          >
            <Sparkles className="w-3.5 h-3.5 mr-2" />
            Create Market
          </Button>
          {event.url && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 border border-white/10 hover:bg-white/5 rounded-xl"
              onClick={() => window.open(event.url, "_blank")}
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Shine Effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
    </div>
  );
}

