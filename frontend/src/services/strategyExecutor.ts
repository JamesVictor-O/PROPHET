/**
 * Strategy Executor Service
 *
 * Monitors markets and automatically executes predictions based on active strategies
 * Uses ERC-7715 permissions to execute via session account
 */

import type {
  PredictionStrategy,
  StrategyExecution,
  StrategyCondition,
} from "@/lib/strategy-types";
import type { MarketInfo } from "@/hooks/contracts/useAllMarkets";
import { parseUnits } from "viem";
import { MarketStatus } from "@/lib/types";

interface MarketMatch {
  market: MarketInfo;
  matchedCondition: StrategyCondition;
  confidence: number;
  recommendedSide: "yes" | "no";
}

export class StrategyExecutor {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private pendingExecutions = new Set<string>(); // Track pending executions by strategyId-marketId
  private stoppedDueToError = false; // Flag to prevent restart after critical error
  private updateStrategy?: (
    id: string,
    updates: Partial<PredictionStrategy>
  ) => void; // Callback to update strategy status

  constructor(
    private strategies: PredictionStrategy[],
    private onExecution: (execution: StrategyExecution) => void,
    private onError: (error: Error) => void,
    private getMarkets: () => Promise<MarketInfo[]>,
    private executePrediction: (
      marketId: number,
      side: "yes" | "no",
      amount: bigint
    ) => Promise<{ success: boolean; hash?: string; error?: string }>,
    private getExecutions: (strategyId: string) => StrategyExecution[],
    updateStrategy?: (id: string, updates: Partial<PredictionStrategy>) => void
  ) {
    this.updateStrategy = updateStrategy;
  }

  start(intervalMs: number = 30000) {
    if (this.isRunning) {
      console.log("[StrategyExecutor] Already running, skipping start");
      return;
    }
    // Don't start if stopped due to error
    if (this.stoppedDueToError) {
      console.log(
        "[StrategyExecutor] Cannot start: stopped due to critical error"
      );
      return;
    }
    console.log(
      `[StrategyExecutor] Starting executor with ${this.strategies.length} strategies, checking every ${intervalMs}ms`
    );
    this.isRunning = true;

    setTimeout(() => {
      this.executeStrategies();
    }, 2000);

    this.intervalId = setInterval(() => this.executeStrategies(), intervalMs);
  }

  /**
   * Run one evaluation cycle immediately.
   * Useful for "event-driven" triggers when fresh Envio data arrives.
   */
  runOnce() {
    if (this.stoppedDueToError) return;
    // If not running, don't flip isRunning — this is just a one-off tick.
    void this.executeStrategies();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    // Clear pending executions when stopped
    this.pendingExecutions.clear();
  }

  stopDueToError() {
    this.stoppedDueToError = true;
    this.stop();
    console.log(
      "[StrategyExecutor] Stopped due to critical error - will not restart automatically"
    );
  }

  private async executeStrategies() {
    const activeStrategies = this.strategies.filter(
      (s) => s.status === "active"
    );
    if (activeStrategies.length === 0) return;

    try {
      const markets = await this.getMarkets();
      const now = Date.now();

      for (const strategy of activeStrategies) {
        console.log(
          `[StrategyExecutor] Processing strategy: ${strategy.id} (${strategy.name})`
        );
        // Check limits
        if (this.shouldSkipStrategy(strategy, now)) {
          console.log(
            `[StrategyExecutor] Skipping strategy ${strategy.id} due to limits`
          );
          continue;
        }

        // Find matching markets
        const matches = this.findMatchingMarkets(markets, strategy);

        for (const match of matches) {
          const marketId = parseInt(match.market.id);
          const executionKey = `${strategy.id}-${marketId}`;

          // Check if we've already predicted on this market (checks both execution history and pending)
          // This is the primary check - it checks both successful executions and pending executions
          const hasPredicted = await this.hasPredictedOnMarket(
            strategy.id,
            marketId
          );
          if (hasPredicted) {
            console.log(
              `[StrategyExecutor] Skipping market ${marketId} for strategy ${strategy.id} - already predicted or pending`
            );
            continue;
          }

          // Mark as pending before execution
          this.pendingExecutions.add(executionKey);

          // Determine side
          const side = await this.determineSide(
            match,
            strategy,
            match.recommendedSide
          );

          if (!side) {
            // Remove from pending if we're not executing
            this.pendingExecutions.delete(executionKey);
            continue;
          }

          console.log(
            `[StrategyExecutor] Executing prediction: market ${match.market.id}, side ${side}, confidence ${match.confidence}`
          );

          // Execute prediction
          const executionResult = await this.executePredictionForStrategy(
            strategy,
            match.market,
            side,
            match.confidence
          );

          // All strategies share the same permission limit, so if one hits it, all must stop
          if (executionResult === "permission_limit_exceeded") {
            console.log(
              `[StrategyExecutor] Permission limit exceeded for strategy ${strategy.id}. Pausing all active strategies and stopping executor permanently.`
            );
            // Remove from pending
            this.pendingExecutions.delete(executionKey);
            // Pause ALL active strategies since they share the same permission limit
            if (this.updateStrategy) {
              const activeStrategies = this.strategies.filter(
                (s) => s.status === "active"
              );
              activeStrategies.forEach((s) => {
                console.log(
                  `[StrategyExecutor] Pausing strategy ${s.id} due to permission limit`
                );
                this.updateStrategy!(s.id, { status: "paused" });
              });
            }
            // Stop the executor permanently to prevent infinite retries
            this.stopDueToError();
            // Exit both loops
            return;
          }
        }
      }
    } catch (error) {
      console.error("[StrategyExecutor] Error in executeStrategies:", error);
      this.onError(error as Error);
    }
  }

  private shouldSkipStrategy(
    strategy: PredictionStrategy,
    now: number
  ): boolean {
    // Check expiry
    if (strategy.limits?.expiryDate) {
      if (new Date(strategy.limits.expiryDate).getTime() < now) {
        console.log(`[StrategyExecutor] Strategy ${strategy.id} expired`);
        return true;
      }
    }

    // Check daily limit
    if (strategy.limits?.maxPredictionsPerDay) {
      const today = new Date().toDateString();
      const todayExecutions = this.getTodayExecutions(strategy.id, today);
      if (todayExecutions >= strategy.limits.maxPredictionsPerDay) {
        return true;
      }
    }

    // Check total stake limit
    if (strategy.limits?.maxTotalStake) {
      const totalStaked = strategy.stats?.totalStaked || 0;
      if (totalStaked >= strategy.limits.maxTotalStake) {
        return true;
      }
    }

    return false;
  }

  private findMatchingMarkets(
    markets: MarketInfo[],
    strategy: PredictionStrategy
  ): MarketMatch[] {
    const matches: MarketMatch[] = [];

    // Check if any condition requires trending markets
    const needsTrending = strategy.conditions.some(
      (c) => c.topTrending !== undefined && c.topTrending > 0
    );

    // If trending is required, sort markets by pool size (trending = most active)
    let marketsToCheck = markets;
    if (needsTrending) {
      marketsToCheck = [...markets].sort((a, b) => {
        const poolA = parseFloat(a.poolFormatted.replace(/[^0-9.]/g, "")) || 0;
        const poolB = parseFloat(b.poolFormatted.replace(/[^0-9.]/g, "")) || 0;
        return poolB - poolA; // Descending order (largest first)
      });
    }

    const nowSec = BigInt(Math.floor(Date.now() / 1000));

    for (const market of marketsToCheck) {
      // Skip closed markets (resolved/cancelled/expired)
      // This prevents paymaster simulation failures like: "PredictionMarket: market closed"
      const isExpired = market.endTime > BigInt(0) && market.endTime <= nowSec;
      const isNotActive =
        market.status !== undefined && market.status !== MarketStatus.Active;
      if (market.resolved || isExpired || isNotActive) {
        continue;
      }

      for (const condition of strategy.conditions) {
        if (
          this.matchesCondition(market, condition, strategy, marketsToCheck)
        ) {
          const confidence = this.calculateConfidence(
            market,
            condition,
            strategy
          );
          const recommendedSide = this.recommendSide(
            market,
            condition,
            strategy
          );

          matches.push({
            market,
            matchedCondition: condition,
            confidence,
            recommendedSide,
          });
          break; // Only match once per market
        }
      }
    }

    return matches;
  }

  private matchesCondition(
    market: MarketInfo,
    condition: StrategyCondition,
    strategy: PredictionStrategy,
    sortedMarkets?: MarketInfo[]
  ): boolean {
    if (condition.type === "new_market") {
      const marketCreatedAt = market.createdAt;
      if (typeof marketCreatedAt !== "number") {
        return false;
      }
      const strategyCreatedAtSec = Math.floor(
        new Date(strategy.createdAt).getTime() / 1000
      );
      if (
        Number.isFinite(strategyCreatedAtSec) &&
        marketCreatedAt < strategyCreatedAtSec
      ) {
        return false;
      }
    }

    // Category match
    if (condition.categories && condition.categories.length > 0) {
      if (!condition.categories.includes("all")) {
        const marketCategory = market.category.toLowerCase().trim();
        const categoryMatch = condition.categories.some(
          (cat) => cat.toLowerCase().trim() === marketCategory
        );
        if (!categoryMatch) {
          return false;
        }
      }
    }

    // Keyword match
    if (condition.keywords && condition.keywords.length > 0) {
      const questionLower = market.question.toLowerCase();
      const hasKeyword = condition.keywords.some((keyword) =>
        questionLower.includes(keyword.toLowerCase())
      );
      if (!hasKeyword) return false;
    }

    // Odds threshold
    if (condition.type === "odds_threshold") {
      if (condition.minYesPercent !== undefined) {
        if (market.yesPercent < condition.minYesPercent) return false;
      }
      if (condition.maxYesPercent !== undefined) {
        if (market.yesPercent > condition.maxYesPercent) return false;
      }
    }

    // Pool size
    if (condition.type === "pool_size" && condition.minPoolSize) {
      const poolSize =
        parseFloat(market.poolFormatted.replace(/[^0-9.]/g, "")) || 0;
      if (poolSize < condition.minPoolSize) return false;
    }

    // Trending markets: only match if market is in top N
    if (condition.topTrending && condition.topTrending > 0 && sortedMarkets) {
      const marketIndex = sortedMarkets.findIndex((m) => m.id === market.id);
      if (marketIndex === -1 || marketIndex >= condition.topTrending) {
        return false;
      }
    }

    return true;
  }

  private calculateConfidence(
    market: MarketInfo,
    condition: StrategyCondition,
    strategy: PredictionStrategy
  ): number {
    void strategy; // reserved for future AI / strategy-specific confidence adjustments
    let confidence = 60; // Base confidence (increased from 50)

    // Higher confidence for markets with more activity
    const poolSize =
      parseFloat(market.poolFormatted.replace(/[^0-9.]/g, "")) || 0;
    if (poolSize > 100) confidence += 10;
    if (poolSize > 500) confidence += 10;

    const yesPercent = market.yesPercent; // For contrarian strategies, higher confidence when odds are extreme
    if (condition.contrarian) {
      const threshold = condition.contrarianThreshold || 80;
      if (yesPercent > threshold || yesPercent < 100 - threshold) {
        confidence += 20;
      } else {
        confidence -= 30;
      }
    } else {
      if (yesPercent >= 45 && yesPercent <= 55) confidence += 15;
      if (poolSize === 0 || poolSize < 0.1) {
        confidence = 70;
      } else {
        if (yesPercent < 20 || yesPercent > 80) confidence -= 10;
      }
    }

    return Math.min(100, Math.max(0, confidence));
  }

  private recommendSide(
    market: MarketInfo,
    condition: StrategyCondition,
    strategy: PredictionStrategy
  ): "yes" | "no" {
    // If strategy has specific side preference
    if (strategy.action.side !== "auto") {
      return strategy.action.side;
    }
    if (condition.contrarian) {
      const threshold = condition.contrarianThreshold || 80;
      if (market.yesPercent > threshold) {
        return "no";
      }
      if (market.yesPercent < 100 - threshold) {
        return "yes";
      }

      return market.yesPercent < 50 ? "yes" : "no";
    }

    return market.yesPercent < 50 ? "yes" : "no";
  }

  private async determineSide(
    match: MarketMatch,
    strategy: PredictionStrategy,
    defaultSide: "yes" | "no"
  ): Promise<"yes" | "no" | null> {
    if (strategy.action.side !== "auto") {
      return strategy.action.side;
    }

    // Use AI if enabled
    if (strategy.aiSettings?.useAI) {
      const aiSide = await this.getAIPrediction(match.market, strategy);
      if (
        aiSide &&
        match.confidence >= (strategy.aiSettings.confidenceThreshold || 50)
      ) {
        return aiSide;
      }
    }

    // Fallback to default
    if (match.confidence >= (strategy.action.minConfidence || 50)) {
      return defaultSide;
    }

    return null;
  }

  private async getAIPrediction(
    _market: MarketInfo,
    _strategy: PredictionStrategy
  ): Promise<"yes" | "no" | null> {
    void _market;
    void _strategy;
    // TODO: Integrate with AI service (Gemini API)
    // For now, return null to use default heuristic
    return null;
  }

  private async hasPredictedOnMarket(
    strategyId: string,
    marketId: number
  ): Promise<boolean> {
    const executions = this.getExecutions(strategyId);
    // Only check successful executions - if we successfully predicted on a market, never predict again
    // Pending executions might have failed, so we don't count them
    const hasSuccessfulExecution = executions.some(
      (e) => e.marketId === marketId && e.status === "success"
    );

    if (hasSuccessfulExecution) {
      return true;
    }

    const hasTerminalFailure = executions.some((e) => {
      if (e.marketId !== marketId) return false;
      if (e.status !== "failed") return false;
      const msg = (e.error || "").toLowerCase();
      return (
        msg.includes("market closed") ||
        msg.includes("market resolved") ||
        msg.includes("market cancelled") ||
        msg.includes("market canceled") ||
        msg.includes("ended")
      );
    });
    if (hasTerminalFailure) {
      return true;
    }

    // Also check if there's a pending execution (in case one is currently in progress)
    const executionKey = `${strategyId}-${marketId}`;
    if (this.pendingExecutions.has(executionKey)) {
      return true;
    }

    return false;
  }

  private getTodayExecutions(strategyId: string, today: string): number {
    const executions = this.getExecutions(strategyId);
    // Only count successful executions towards the daily limit
    const todayExecutions = executions.filter((e) => {
      const execDate = new Date(e.timestamp).toDateString();
      return execDate === today && e.status === "success";
    });
    return todayExecutions.length;
  }

  private async executePredictionForStrategy(
    strategy: PredictionStrategy,
    market: MarketInfo,
    side: "yes" | "no",
    confidence: number
  ): Promise<"permission_limit_exceeded" | "success" | "failed"> {
    const stakeAmount = parseUnits(
      strategy.action.stakeAmount.toString(),
      6 // USDC decimals
    );

    const executionKey = `${strategy.id}-${parseInt(market.id)}`;

    try {
      const result = await this.executePrediction(
        parseInt(market.id),
        side,
        stakeAmount
      );

      // Check if error is permission limit exceeded
      if (!result.success && result.error) {
        const errorMessage = result.error.toLowerCase();
        if (
          errorMessage.includes("transfer-amount-exceeded") ||
          errorMessage.includes("erc20periodtransferenforcer") ||
          errorMessage.includes("permission limit")
        ) {
          console.error(
            `[StrategyExecutor] Permission limit exceeded: ${result.error}`
          );
          // Remove from pending
          this.pendingExecutions.delete(executionKey);

          const execution: StrategyExecution = {
            id: `exec_${Date.now()}`,
            strategyId: strategy.id,
            marketId: parseInt(market.id),
            marketQuestion: market.question,
            side,
            stakeAmount: strategy.action.stakeAmount,
            timestamp: new Date().toISOString(),
            status: "failed",
            error: result.error,
            aiConfidence: confidence,
            reason: "Permission limit exceeded",
          };

          this.onExecution(execution);
          return "permission_limit_exceeded";
        }
      }

      const execution: StrategyExecution = {
        id: `exec_${Date.now()}`,
        strategyId: strategy.id,
        marketId: parseInt(market.id),
        marketQuestion: market.question,
        side,
        stakeAmount: strategy.action.stakeAmount,
        timestamp: new Date().toISOString(),
        status: result.success ? "success" : "failed",
        txHash: result.hash,
        error: result.error,
        aiConfidence: confidence,
        reason: `Matched condition: ${strategy.conditions[0].type}`,
      };

      // Add execution to state first
      this.onExecution(execution);

      // If it failed, clear pending so we can retry on transient failures.
      // Terminal failures are handled by hasPredictedOnMarket() (we skip those forever).
      if (execution.status === "failed") {
        this.pendingExecutions.delete(executionKey);
      }

      return result.success ? "success" : "failed";
    } catch (error) {
      const errorMessage = (error as Error).message.toLowerCase();
      if (
        errorMessage.includes("transfer-amount-exceeded") ||
        errorMessage.includes("erc20periodtransferenforcer") ||
        errorMessage.includes("permission limit")
      ) {
        console.error(
          `[StrategyExecutor] Permission limit exceeded: ${
            (error as Error).message
          }`
        );
        this.pendingExecutions.delete(executionKey);

        const execution: StrategyExecution = {
          id: `exec_${Date.now()}`,
          strategyId: strategy.id,
          marketId: parseInt(market.id),
          marketQuestion: market.question,
          side,
          stakeAmount: strategy.action.stakeAmount,
          timestamp: new Date().toISOString(),
          status: "failed",
          error: (error as Error).message,
          reason: "Permission limit exceeded",
        };

        this.onExecution(execution);
        return "permission_limit_exceeded";
      }

      const execution: StrategyExecution = {
        id: `exec_${Date.now()}`,
        strategyId: strategy.id,
        marketId: parseInt(market.id),
        marketQuestion: market.question,
        side,
        stakeAmount: strategy.action.stakeAmount,
        timestamp: new Date().toISOString(),
        status: "failed",
        error: (error as Error).message,
      };

      this.pendingExecutions.delete(executionKey);

      this.onExecution(execution);
      return "failed";
    }
  }
}
