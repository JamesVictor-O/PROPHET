"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, Plus, Award,  TrendingUp, History } from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  type: "prediction" | "achievement";
  action: "Won" | "Lost" | "Placed" | "Unlocked";
  market?: string;
  achievement?: string;
  amount?: number;
  timestamp: string;
}

interface ProfileActivityProps {
  activities: Activity[];
}

export function ProfileActivity({ activities }: ProfileActivityProps) {
  const getStyles = (activity: Activity) => {
    if (activity.type === "achievement") {
      return {
        icon: <Award className="w-4 h-4" />,
        color: "text-yellow-400",
        bg: "bg-yellow-400/10",
        border: "border-yellow-400/20",
      };
    }
    switch (activity.action) {
      case "Won":
        return {
          icon: <TrendingUp className="w-4 h-4" />,
          color: "text-emerald-400",
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/20",
        };
      case "Lost":
        return {
          color: "text-red-400",
          bg: "bg-red-500/10",
          border: "border-red-500/20",
        };
      case "Placed":
        return {
          color: "text-blue-400",
          bg: "bg-blue-500/10",
          border: "border-blue-500/20",
        };
      default:
        return {
          icon: <History className="w-4 h-4" />,
          color: "text-slate-400",
          bg: "bg-slate-400/10",
          border: "border-slate-400/20",
        };
    }
  };

  return (
    <Card className="bg-[#020617]/40 backdrop-blur-xl border-white/5 rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl w-full">
      <CardHeader className="p-4 sm:p-8 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] text-blue-500">
              History
            </p>
            <CardTitle className="text-lg sm:text-2xl font-black italic tracking-tighter uppercase text-white truncate">
              Recent <span className="text-slate-500 italic">Activities</span>
            </CardTitle>
          </div>
          <History className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 shrink-0" />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y divide-white/5">
          {activities.map((activity) => {
            const styles = getStyles(activity);
            return (
              <div
                key={activity.id}
                className="group relative p-4 sm:p-6 transition-all duration-500 hover:bg-white/[0.02] w-full"
              >
                {/* Side accent on hover */}
                <div
                  className={cn(
                    "absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block",
                    styles.bg.replace("/10", "")
                  )}
                />

                <div className="flex items-start gap-3 sm:gap-6 relative z-10 w-full">
                  {/* Icon Box */}
                

                  {/* Main Content Area */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-col min-w-0">
                        <span
                          className={cn(
                            "text-[8px] sm:text-[10px] font-black uppercase tracking-widest",
                            styles.color
                          )}
                        >
                          {activity.type === "achievement"
                            ? "Unlocked"
                            : activity.action}
                        </span>

                        {/* THE FIX: Use line-clamp-2 to prevent overflow while keeping text readable */}
                        <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight mt-1 line-clamp-2 break-words">
                          {activity.type === "prediction"
                            ? activity.market
                            : activity.achievement}
                        </h4>
                      </div>

                      {activity.amount !== undefined && (
                        <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-0 shrink-0">
                          <p
                            className={cn(
                              "text-sm sm:text-lg font-black tracking-tighter",
                              activity.action === "Won"
                                ? "text-emerald-400"
                                : "text-white"
                            )}
                          >
                            {activity.action === "Won" ? "+" : "-"}$
                            {activity.amount.toFixed(2)}
                          </p>
                          <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest hidden sm:block">
                            Asset Settled
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Bottom Metadata */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.03]">
                      <p className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-tight italic">
                        {activity.timestamp}
                      </p>

                      {activity.type === "prediction" && (
                        <div className="flex items-center gap-1 group/btn cursor-pointer">
                          <span className="text-[8px] sm:text-[9px] font-black text-blue-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                            Details
                          </span>
                          <Plus className="w-3 h-3 text-blue-400 rotate-45" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>

      <div className="p-4 sm:p-6 bg-white/[0.01] border-t border-white/5 flex justify-center">
        <button className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-slate-600 hover:text-white transition-colors">
          Load Full Protocol History
        </button>
      </div>
    </Card>
  );
}
