"use client";

import { useState } from "react";
import { useStrategies } from "@/hooks/useStrategies";
import { CreateStrategyModal } from "./create-strategy-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { PredictionStrategy } from "@/lib/strategy-types";
import { Button } from "@/components/ui/button";
import { Play, Pause, Trash2, Settings, Plus, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
// Simple time ago formatter (avoiding date-fns dependency)
function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `${Math.floor(diffInSeconds / 604800)}w ago`;
}

export function StrategyList() {
  const { strategies, deleteStrategy, updateStrategy, getStrategyExecutions } =
    useStrategies();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] =
    useState<PredictionStrategy | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [strategyToDelete, setStrategyToDelete] =
    useState<PredictionStrategy | null>(null);

  const handleToggleStatus = (strategy: PredictionStrategy) => {
    const newStatus = strategy.status === "active" ? "paused" : "active";
    updateStrategy(strategy.id, { status: newStatus });
  };

  const handleDeleteClick = (strategy: PredictionStrategy) => {
    setStrategyToDelete(strategy);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (strategyToDelete) {
      deleteStrategy(strategyToDelete.id);
      setStrategyToDelete(null);
    }
  };

  const activeCount = strategies.filter((s) => s.status === "active").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Prediction Strategies
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {activeCount} active strategy{activeCount !== 1 ? "ies" : ""}
          </p>
        </div>
        <Button
          onClick={() => setCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Strategy
        </Button>
      </div>

      {/* Strategies Grid */}
      {strategies.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
          <Zap className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">No strategies yet</p>
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Create Your First Strategy
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {strategies.map((strategy) => {
            const executions = getStrategyExecutions(strategy.id);
            const stats = strategy.stats || {
              totalPredictions: 0,
              totalStaked: 0,
              successfulPredictions: 0,
              totalWinnings: 0,
            };

            return (
              <div
                key={strategy.id}
                className={cn(
                  "border rounded-xl p-6 space-y-4 transition-all",
                  strategy.status === "active"
                    ? "border-blue-500/30 bg-blue-500/5"
                    : "border-white/10 bg-slate-800/50"
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">
                      {strategy.name}
                    </h3>
                    {strategy.description && (
                      <p className="text-sm text-slate-400 line-clamp-2">
                        {strategy.description}
                      </p>
                    )}
                  </div>
                  <span
                    className={cn(
                      "px-2 py-1 rounded text-xs font-bold uppercase",
                      strategy.status === "active"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-slate-700 text-slate-400"
                    )}
                  >
                    {strategy.status}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">
                      Predictions
                    </p>
                    <p className="text-lg font-bold text-white">
                      {stats.totalPredictions}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">
                      Total Staked
                    </p>
                    <p className="text-lg font-bold text-white">
                      ${stats.totalStaked.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Action */}
                <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleStatus(strategy)}
                    className={cn(
                      "flex-1",
                      strategy.status === "active"
                        ? "border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                        : "border-green-500/30 text-green-400 hover:bg-green-500/10"
                    )}
                  >
                    {strategy.status === "active" ? (
                      <>
                        <Pause className="w-3.5 h-3.5 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 mr-2" />
                        Activate
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedStrategy(strategy)}
                    className="border-slate-600 text-slate-400 hover:bg-slate-700"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteClick(strategy)}
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Last executed */}
                {strategy.stats?.lastExecuted && (
                  <p className="text-xs text-slate-500">
                    Last executed {formatTimeAgo(strategy.stats.lastExecuted)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <CreateStrategyModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Strategy"
        description={`Are you sure you want to delete "${strategyToDelete?.name}"? This action cannot be undone and all strategy data will be permanently removed.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
