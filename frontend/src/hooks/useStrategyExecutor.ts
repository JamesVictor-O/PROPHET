"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAccount } from "wagmi";
import { useStrategies } from "./useStrategies";
import { useAllMarkets } from "./contracts/useAllMarkets";
import { useMarketsGraphQL } from "./graphql/useMarketsGraphQL";
import { useRedeemDelegations } from "./useRedeemDelegations";
import { PredictionMarketABI } from "@/lib/abis";
import { getContractAddress } from "@/lib/contracts";
import { Address } from "viem";
import { StrategyExecutor } from "@/services/strategyExecutor";
import type { StrategyExecution } from "@/lib/strategy-types";
import type { MarketInfo } from "@/hooks/contracts/useAllMarkets";
import { toast } from "sonner";
import { defaultChain } from "@/lib/wallet-config";

export function useStrategyExecutor() {
  const { address } = useAccount();
  const { strategies, addExecution, updateStrategy, getStrategyExecutions } =
    useStrategies();

  // Use Envio GraphQL for real-time market data (listens for MarketCreated events)
  const { data: marketsFromEnvio } = useMarketsGraphQL(50);

  // Fallback to contract polling if Envio is not available
  const { data: marketsFromContract } = useAllMarkets();

  const { redeemWithUSDCTransfer, canUseRedeem } = useRedeemDelegations();
  const executorRef = useRef<StrategyExecutor | null>(null);
  const lastStrategyIdsRef = useRef<string>(""); // Track last strategy IDs to prevent unnecessary restarts

  // Get token decimals based on chain
  const tokenDecimals =
    defaultChain.id === 84532 || defaultChain.id === 8453 ? 6 : 18;

  // Get markets function for executor - prefer Envio, fallback to contract
  const getMarkets = useCallback(async (): Promise<MarketInfo[]> => {
    // Use Envio data if available (real-time from MarketCreated events)
    if (marketsFromEnvio && marketsFromEnvio.length > 0) {
      console.log(
        `[useStrategyExecutor] Using ${marketsFromEnvio.length} markets from Envio GraphQL`
      );
      return marketsFromEnvio;
    }

    // Fallback to contract data if Envio is not available
    if (marketsFromContract && marketsFromContract.length > 0) {
      console.log(
        `[useStrategyExecutor] Using ${marketsFromContract.length} markets from contract polling`
      );
      return marketsFromContract as MarketInfo[];
    }

    return [];
  }, [marketsFromEnvio, marketsFromContract]);

  // Execute prediction function
  const executePrediction = useCallback(
    async (marketId: number, side: "yes" | "no", amount: bigint) => {
      if (!canUseRedeem || !address) {
        return { success: false, error: "No session transaction available" };
      }
      try {
        const predictionMarketAddress = getContractAddress(
          "predictionMarket"
        ) as Address;

        // Convert amount from wei to USDC string for redeemWithUSDCTransfer
        const usdcAmount = Number(amount) / Math.pow(10, tokenDecimals);
        const usdcAmountString = usdcAmount.toFixed(
          tokenDecimals === 6 ? 6 : 18
        );

        // Use redeemWithUSDCTransfer to transfer USDC and execute prediction
        const result = await redeemWithUSDCTransfer({
          usdcAmount: usdcAmountString,
          tokenDecimals,
          contractCalls: [
            {
              to: predictionMarketAddress,
              abi: PredictionMarketABI,
              functionName: "predict",
              args: [BigInt(marketId), address, side === "yes" ? 0 : 1, amount],
            },
          ],
        });

        if (result.success) {
          return { success: true, hash: result.hash };
        } else {
          return { success: false, error: result.error };
        }
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    },
    [canUseRedeem, address, redeemWithUSDCTransfer, tokenDecimals]
  );

  // Handle execution callback
  const handleExecution = useCallback(
    (execution: StrategyExecution) => {
      addExecution(execution);

      const strategy = strategies.find((s) => s.id === execution.strategyId);
      if (strategy) {
        const stats = strategy.stats || {
          totalPredictions: 0,
          totalStaked: 0,
          successfulPredictions: 0,
          totalWinnings: 0,
        };

        updateStrategy(execution.strategyId, {
          stats: {
            ...stats,
            totalPredictions: stats.totalPredictions + 1,
            totalStaked: stats.totalStaked + execution.stakeAmount,
            lastExecuted: execution.timestamp,
          },
        });
      }

      if (execution.status === "success") {
        toast.success(
          `Strategy executed: ${execution.side.toUpperCase()} on "${execution.marketQuestion.substring(
            0,
            30
          )}..."`
        );
      } else {
        toast.error(`Strategy execution failed: ${execution.error}`);
      }
    },
    [strategies, addExecution, updateStrategy]
  );

  // Handle error callback
  const handleError = useCallback((error: Error) => {
    console.error("Strategy executor error:", error);
    toast.error(`Strategy executor error: ${error.message}`);
  }, []);

  // Initialize executor - only start if there are active strategies AND user has permissions
  useEffect(() => {
    console.log("[useStrategyExecutor] useEffect triggered", {
      address: !!address,
      canUseRedeem,
      strategiesCount: strategies.length,
    });

    if (!address || !canUseRedeem) {
      console.log("[useStrategyExecutor] Cannot start: missing prerequisites", {
        address: !!address,
        canUseRedeem,
      });
      executorRef.current?.stop();
      executorRef.current = null;
      return;
    }

    // Get all active strategies (test strategies are included if explicitly created)
    const activeStrategies = strategies.filter((s) => s.status === "active");
    console.log(
      `[useStrategyExecutor] Found ${activeStrategies.length} active strategies out of ${strategies.length} total`,
      activeStrategies.map((s) => ({
        id: s.id,
        name: s.name,
        status: s.status,
      }))
    );

    if (activeStrategies.length === 0) {
      console.log(
        "[useStrategyExecutor] No active strategies, stopping executor"
      );
      executorRef.current?.stop();
      executorRef.current = null;
      return;
    }

    // Don't recreate executor if it's already running and strategies haven't changed
    // This prevents unnecessary restarts
    const newStrategyIds = activeStrategies
      .map((s) => s.id)
      .sort()
      .join(",");
    if (executorRef.current && lastStrategyIdsRef.current === newStrategyIds) {
      // Strategies haven't changed, keep running
      return;
    }

    // Strategies changed or executor doesn't exist, stop old one and create new
    if (executorRef.current) {
      executorRef.current.stop();
    }

    // Update the ref with new strategy IDs
    lastStrategyIdsRef.current = newStrategyIds;

    const executor = new StrategyExecutor(
      activeStrategies,
      handleExecution,
      handleError,
      getMarkets,
      executePrediction,
      getStrategyExecutions,
      updateStrategy // Pass updateStrategy so executor can pause strategies on error
    );

    executorRef.current = executor;
    // Start with a longer interval to prevent rapid-fire executions
    console.log(
      `[useStrategyExecutor] Starting executor with ${activeStrategies.length} active strategies:`,
      activeStrategies.map((s) => ({ id: s.id, name: s.name }))
    );
    executor.start(60000); // Check every 60 seconds instead of 30

    return () => {
      executor.stop();
    };
  }, [
    address,
    strategies, // React to strategy changes
    canUseRedeem,
    handleExecution,
    handleError,
    getMarkets,
    executePrediction,
    getStrategyExecutions,
    updateStrategy,
  ]);

  // Get all active strategies for display (test strategies included)
  const activeStrategies = strategies.filter((s) => s.status === "active");
  const isRunning = address && canUseRedeem && activeStrategies.length > 0;

  // Debug: Log whenever isRunning or activeStrategiesCount changes
  useEffect(() => {
    console.log("[useStrategyExecutor] Return values updated:", {
      isRunning,
      activeStrategiesCount: activeStrategies.length,
      totalStrategies: strategies.length,
      activeStrategyIds: activeStrategies.map((s) => s.id),
    });
  }, [isRunning, activeStrategies.length, strategies.length, activeStrategies]);

  return {
    isRunning,
    activeStrategiesCount: activeStrategies.length,
  };
}
