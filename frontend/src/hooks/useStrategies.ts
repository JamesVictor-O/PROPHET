import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import type {
  PredictionStrategy,
  StrategyExecution,
} from "@/lib/strategy-types";

const STORAGE_KEY_PREFIX = "prophet_strategies_";
const EXECUTIONS_KEY_PREFIX = "prophet_strategy_executions_";

function getStorageKey(address: string): string {
  return `${STORAGE_KEY_PREFIX}${address.toLowerCase()}`;
}

function getExecutionsKey(address: string): string {
  return `${EXECUTIONS_KEY_PREFIX}${address.toLowerCase()}`;
}

export function useStrategies() {
  const { address } = useAccount();
  const [strategies, setStrategies] = useState<PredictionStrategy[]>([]);
  const [executions, setExecutions] = useState<StrategyExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load strategies from localStorage
  useEffect(() => {
    if (!address) {
      setStrategies([]);
      setExecutions([]);
      setIsLoading(false);
      return;
    }

    try {
      const strategiesKey = getStorageKey(address);
      const executionsKey = getExecutionsKey(address);

      const storedStrategies = localStorage.getItem(strategiesKey);
      const storedExecutions = localStorage.getItem(executionsKey);

      if (storedStrategies) {
        setStrategies(JSON.parse(storedStrategies));
      }
      if (storedExecutions) {
        setExecutions(JSON.parse(storedExecutions));
      }
    } catch (error) {
      console.error("Error loading strategies:", error);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  // Save strategies to localStorage
  const saveStrategies = useCallback(
    (newStrategies: PredictionStrategy[]) => {
      if (!address) return;
      try {
        const key = getStorageKey(address);
        localStorage.setItem(key, JSON.stringify(newStrategies));
        setStrategies(newStrategies);
      } catch (error) {
        console.error("Error saving strategies:", error);
      }
    },
    [address]
  );

  // Save executions to localStorage
  const saveExecutions = useCallback(
    (newExecutions: StrategyExecution[]) => {
      if (!address) return;
      try {
        const key = getExecutionsKey(address);
        localStorage.setItem(key, JSON.stringify(newExecutions));
        setExecutions(newExecutions);
      } catch (error) {
        console.error("Error saving executions:", error);
      }
    },
    [address]
  );

  const createStrategy = useCallback(
    (
      strategy: Omit<
        PredictionStrategy,
        "id" | "createdAt" | "updatedAt" | "status"
      >
    ) => {
      const newStrategy: PredictionStrategy = {
        ...strategy,
        id: `strategy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "active",
        stats: {
          totalPredictions: 0,
          totalStaked: 0,
          successfulPredictions: 0,
          totalWinnings: 0,
        },
      };
      const updated = [...strategies, newStrategy];
      saveStrategies(updated);
      return newStrategy;
    },
    [strategies, saveStrategies]
  );

  const updateStrategy = useCallback(
    (id: string, updates: Partial<PredictionStrategy>) => {
      const updated = strategies.map((s) =>
        s.id === id
          ? { ...s, ...updates, updatedAt: new Date().toISOString() }
          : s
      );
      saveStrategies(updated);
    },
    [strategies, saveStrategies]
  );

  const deleteStrategy = useCallback(
    (id: string) => {
      const updated = strategies.filter((s) => s.id !== id);
      saveStrategies(updated);
    },
    [strategies, saveStrategies]
  );

  const addExecution = useCallback(
    (execution: Omit<StrategyExecution, "id" | "timestamp">) => {
      const newExecution: StrategyExecution = {
        ...execution,
        id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
      };
      const updated = [newExecution, ...executions];
      saveExecutions(updated);
      return newExecution;
    },
    [executions, saveExecutions]
  );

  const updateExecution = useCallback(
    (id: string, updates: Partial<StrategyExecution>) => {
      const updated = executions.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      );
      saveExecutions(updated);
    },
    [executions, saveExecutions]
  );

  const getActiveStrategies = useCallback(() => {
    return strategies.filter((s) => s.status === "active");
  }, [strategies]);

  const getStrategyExecutions = useCallback(
    (strategyId: string) => {
      return executions.filter((e) => e.strategyId === strategyId);
    },
    [executions]
  );

  return {
    strategies,
    executions,
    isLoading,
    createStrategy,
    updateStrategy,
    deleteStrategy,
    addExecution,
    updateExecution,
    getActiveStrategies,
    getStrategyExecutions,
  };
}
