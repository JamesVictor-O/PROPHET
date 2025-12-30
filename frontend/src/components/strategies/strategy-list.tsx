"use client";

import { useState } from "react";
import { useChainId } from "wagmi";
import { useStrategies } from "@/hooks/useStrategies";
import { CONTRACTS } from "@/lib/contracts";
import { CreateStrategyModal } from "./create-strategy-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type {
  PredictionStrategy,
  StrategyExecution,
} from "@/lib/strategy-types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Play,
  Pause,
  Trash2,
  Settings,
  Plus,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
} from "lucide-react";
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
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [strategyToDelete, setStrategyToDelete] =
    useState<PredictionStrategy | null>(null);

  const handleViewHistory = (strategy: PredictionStrategy) => {
    setSelectedStrategy(strategy);
    setHistoryModalOpen(true);
  };

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
                  "border rounded-xl p-6 space-y-4 transition-all cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/10",
                  strategy.status === "active"
                    ? "border-blue-500/30 bg-blue-500/5"
                    : "border-white/10 bg-slate-800/50"
                )}
                onClick={() => handleViewHistory(strategy)}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewHistory(strategy);
                    }}
                    className="border-slate-600 text-slate-400 hover:bg-slate-700"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(strategy);
                    }}
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

      {/* Execution History Modal */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#020617] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-bold">
              {selectedStrategy?.name} - Execution History
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              View all predictions placed by this strategy
            </DialogDescription>
          </DialogHeader>

          {selectedStrategy && (
            <ExecutionHistoryList
              strategy={selectedStrategy}
              executions={getStrategyExecutions(selectedStrategy.id)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ExecutionHistoryList({
  strategy,
  executions,
}: {
  strategy: PredictionStrategy;
  executions: StrategyExecution[];
}) {
  const stats = strategy.stats || {
    totalPredictions: 0,
    totalStaked: 0,
    successfulPredictions: 0,
    totalWinnings: 0,
  };

  const successfulExecutions = executions.filter((e) => e.status === "success");
  const failedExecutions = executions.filter((e) => e.status === "failed");

  return (
    <div className="space-y-6 mt-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white/5 border border-white/10 rounded-lg">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Total Executions
          </p>
          <p className="text-2xl font-bold text-white">{executions.length}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Successful
          </p>
          <p className="text-2xl font-bold text-green-400">
            {successfulExecutions.length}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Failed
          </p>
          <p className="text-2xl font-bold text-red-400">
            {failedExecutions.length}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Total Staked
          </p>
          <p className="text-2xl font-bold text-white">
            ${stats.totalStaked.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Executions List */}
      {executions.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-white/10 rounded-lg">
          <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No executions yet</p>
          <p className="text-slate-500 text-sm mt-2">
            This strategy hasn&apos;t placed any predictions yet
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {executions.map((execution) => (
            <ExecutionCard key={execution.id} execution={execution} />
          ))}
        </div>
      )}
    </div>
  );
}

function ExecutionCard({ execution }: { execution: StrategyExecution }) {
  const chainId = useChainId();

  // Get explorer URL based on current chain
  const getExplorerUrl = (txHash: string): string => {
    // Find the network that matches the current chain ID
    const network = Object.entries(CONTRACTS).find(
      ([, config]) => config.chainId === chainId
    );

    if (network) {
      const explorer = network[1].explorer;
      return `${explorer}/tx/${txHash}`;
    }

    // Default to Base Sepolia if chain ID not found
    return `https://sepolia.basescan.org/tx/${txHash}`;
  };

  const getStatusIcon = () => {
    switch (execution.status) {
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-400" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-400 animate-pulse" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = () => {
    switch (execution.status) {
      case "success":
        return "border-green-500/30 bg-green-500/5";
      case "failed":
        return "border-red-500/30 bg-red-500/5";
      case "pending":
        return "border-yellow-500/30 bg-yellow-500/5";
      default:
        return "border-white/10 bg-white/5";
    }
  };

  return (
    <div
      className={cn(
        "border rounded-lg p-4 space-y-3 transition-all",
        getStatusColor()
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {getStatusIcon()}
            <span
              className={cn(
                "px-2 py-1 rounded text-xs font-bold uppercase",
                execution.status === "success"
                  ? "bg-green-500/20 text-green-400"
                  : execution.status === "failed"
                  ? "bg-red-500/20 text-red-400"
                  : "bg-yellow-500/20 text-yellow-400"
              )}
            >
              {execution.status}
            </span>
            <span className="text-xs text-slate-500">
              Market #{execution.marketId}
            </span>
          </div>
          <h4 className="text-white font-semibold mb-1 line-clamp-2">
            {execution.marketQuestion}
          </h4>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-slate-500">Side:</span>
              <span
                className={cn(
                  "font-bold uppercase",
                  execution.side === "yes" ? "text-green-400" : "text-red-400"
                )}
              >
                {execution.side}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-500">Stake:</span>
              <span className="text-white font-semibold">
                ${execution.stakeAmount.toFixed(2)}
              </span>
            </div>
            {execution.aiConfidence && (
              <div className="flex items-center gap-1">
                <span className="text-slate-500">Confidence:</span>
                <span className="text-white font-semibold">
                  {execution.aiConfidence}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-white/10">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatTimeAgo(execution.timestamp)}</span>
        </div>
        {execution.txHash && (
          <a
            href={getExplorerUrl(execution.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <span>View on Explorer</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {execution.error && (
        <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
          <strong>Error:</strong> {execution.error}
        </div>
      )}

      {execution.reason && (
        <div className="mt-2 text-xs text-slate-500">
          <strong>Reason:</strong> {execution.reason}
        </div>
      )}
    </div>
  );
}
