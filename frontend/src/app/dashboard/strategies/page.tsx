"use client";

import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { StrategyList } from "@/components/strategies/strategy-list";
import { useStrategyExecutor } from "@/hooks/useStrategyExecutor";
import { Zap, Info } from "lucide-react";

export default function StrategiesPage() {
  const { isRunning, activeStrategiesCount } = useStrategyExecutor();

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50">
      <DashboardNav />

      <div className="pt-16 flex">
        <DashboardSidebar />

        <main className="flex-1 lg:ml-64 px-4 sm:px-6 py-8 lg:px-12 max-w-[1600px] mx-auto">
          {/* Status Banner */}
          {isRunning && activeStrategiesCount > 0 && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
              <Zap className="w-5 h-5 text-green-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-white">
                  Strategy Executor Active
                </p>
                <p className="text-xs text-slate-400">
                  {activeStrategiesCount} active strateg
                  {activeStrategiesCount !== 1 ? "ies" : "y"} monitoring markets
                </p>
              </div>
            </div>
          )}

          {/* Info Banner */}
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-white mb-1">
                Set-and-Forget Prediction Strategies
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Create automated prediction strategies that execute on your behalf
                using your session account permissions. Strategies monitor markets
                and automatically place predictions when conditions are met.
              </p>
            </div>
          </div>

          <StrategyList />
        </main>
      </div>
    </div>
  );
}

