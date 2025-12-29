"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStrategies } from "@/hooks/useStrategies";
import { useStrategyExecutor } from "@/hooks/useStrategyExecutor";
import { useRedeemDelegations } from "@/hooks/useRedeemDelegations";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Zap,
  Play,
  Pause,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { PredictionStrategy } from "@/lib/strategy-types";

export function StrategyExecutorTest() {
  const { address, isConnected } = useAccount();
  const {
    strategies,
    createStrategy,
    deleteStrategy,
    executions: allExecutions,
  } = useStrategies();
  const { isRunning, activeStrategiesCount } = useStrategyExecutor();
  const { canUseRedeem } = useRedeemDelegations();

  const [testStrategyId, setTestStrategyId] = useState<string | null>(null);
  const [isCreatingTest, setIsCreatingTest] = useState(false);
  const [isDeletingTest, setIsDeletingTest] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Find existing test strategy on mount and clean it up IMMEDIATELY
  // This must run synchronously before the executor can start
  useEffect(() => {
    // Use a synchronous check to delete test strategies immediately
    const existingTestStrategies = strategies.filter(
      (s) => s.name === "Test Strategy (Auto-Delete)"
    );
    if (existingTestStrategies.length > 0) {
      // Auto-delete all old test strategies immediately
      console.log(
        `🧹 Cleaning up ${existingTestStrategies.length} old test strategy(ies)...`
      );
      existingTestStrategies.forEach((strategy) => {
        deleteStrategy(strategy.id);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount - empty deps ensures it runs before executor starts

  const executionsForTest = testStrategyId
    ? allExecutions.filter((e) => e.strategyId === testStrategyId)
    : [];
  const executionCount = executionsForTest.length;

  const handleCreateTestStrategy = async () => {
    if (!address || !canUseRedeem) {
      setTestError(
        "Please connect wallet and grant One-Tap Betting permission first"
      );
      return;
    }

    setIsCreatingTest(true);
    setTestError(null);
    setTestStatus(null);

    try {
      // Create a test strategy that matches any sports market
      const testStrategy = {
        name: "Test Strategy (Auto-Delete)",
        description:
          "Test strategy for executor - will auto-delete after testing",
        conditions: [
          {
            type: "new_market" as const,
            categories: ["sports"],
          },
        ],
        action: {
          stakeAmount: 0.025,
          side: "auto" as const,
          minConfidence: 40,
        },
        limits: {
          maxTotalStake: 1.0,
          maxPredictionsPerDay: 5,
        },
        aiSettings: {
          useAI: false,
          confidenceThreshold: 50,
        },
      };

      const strategy = createStrategy(
        testStrategy as unknown as Omit<
          PredictionStrategy,
          "id" | "createdAt" | "updatedAt" | "status"
        >
      );
      setTestStrategyId(strategy.id);
      setTestStatus(
        `✅ Test strategy created!\n\nStrategy ID: ${strategy.id}\n\nThis strategy will automatically place predictions on sports markets when conditions are met.\n\nMonitor the execution count below to see when predictions are placed.`
      );
      toast.success("Test strategy created successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create test strategy";
      setTestError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsCreatingTest(false);
    }
  };

  const handleDeleteTestStrategy = async () => {
    if (!testStrategyId) return;

    setIsDeletingTest(true);
    setTestError(null);

    try {
      deleteStrategy(testStrategyId);
      setTestStrategyId(null);
      setTestStatus(null);
      toast.success("Test strategy deleted");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to delete test strategy";
      setTestError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsDeletingTest(false);
    }
  };

  const testStrategy = testStrategyId
    ? strategies.find((s) => s.id === testStrategyId)
    : null;

  return (
    <Card className="bg-[#1E293B] border-white/10">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-white text-lg font-bold">
              Strategy Executor Test
            </CardTitle>
            <p className="text-slate-400 text-xs mt-1">
              Test the Set-and-Forget prediction strategy system
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
              Executor Status
            </p>
            <div className="flex items-center gap-2">
              {isRunning ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-sm font-semibold text-green-400">Active</p>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-slate-500" />
                  <p className="text-sm font-semibold text-slate-400">
                    Inactive
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
              Active Strategies
            </p>
            <p className="text-sm font-semibold text-white">
              {activeStrategiesCount}
            </p>
          </div>

          <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
              Test Executions
            </p>
            <p className="text-sm font-semibold text-white">{executionCount}</p>
          </div>
        </div>

        {/* Prerequisites Check */}
        {!isConnected && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-400">
                Please connect your wallet to run tests
              </p>
            </div>
          </div>
        )}

        {isConnected && !canUseRedeem && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-400">
                Please grant One-Tap Betting permission in Settings to test the
                executor
              </p>
            </div>
          </div>
        )}

        {/* Test Strategy Info */}
        {testStrategy && (
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-white mb-1">
                  Test Strategy Active
                </p>
                <p className="text-xs text-slate-400">
                  ID: {testStrategy.id.slice(0, 8)}...
                </p>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                  testStrategy.status === "active"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-slate-700 text-slate-400"
                }`}
              >
                {testStrategy.status}
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-400">
              <p>• Matches: Sports markets</p>
              <p>• Stake: 0.025 USDC per prediction</p>
              <p>• Limits: $1 total, 5 per day</p>
              <p>• Executions: {executionCount} prediction(s) placed</p>
            </div>

            {executionsForTest.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                  Recent Executions
                </p>
                <div className="space-y-1">
                  {executionsForTest.slice(0, 3).map((exec) => (
                    <div
                      key={exec.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-400">
                        Market #{exec.marketId} - {exec.side.toUpperCase()}
                      </span>
                      <span
                        className={
                          exec.status === "success"
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      >
                        {exec.status === "success" ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {!testStrategyId ? (
            <Button
              onClick={handleCreateTestStrategy}
              disabled={
                !isConnected ||
                !canUseRedeem ||
                isCreatingTest ||
                isDeletingTest
              }
              className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
            >
              {isCreatingTest ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Test Strategy...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Create Test Strategy
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleDeleteTestStrategy}
              disabled={isDeletingTest}
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 flex-1"
            >
              {isDeletingTest ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Delete Test Strategy
                </>
              )}
            </Button>
          )}
        </div>

        {/* Status Messages */}
        {testStatus && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-sm text-green-400 font-medium whitespace-pre-line">
              {testStatus}
            </p>
          </div>
        )}

        {testError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400 font-medium">{testError}</p>
          </div>
        )}

        {/* Info */}
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-400 space-y-1">
              <p className="font-medium text-white">How it works:</p>
              <p>1. Create a test strategy that matches sports markets</p>
              <p>2. The executor checks markets every 30 seconds</p>
              <p>
                3. When a matching market is found, it automatically places a
                prediction
              </p>
              <p>
                4. Monitor the execution count to see predictions being placed
              </p>
              <p className="mt-2 text-slate-500">
                Note: The test strategy will only execute if you have active
                markets matching the criteria. Check the browser console for
                detailed execution logs.
              </p>
              <p className="text-yellow-400/80 mt-2">
                ⚠️ Important: The executor only checks the first 10 markets.
                Make sure your sports market is in the top 10 markets list.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
