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
    if (this.isRunning) return;
    // Don't start if stopped due to error
    if (this.stoppedDueToError) {
      console.log(
        "[StrategyExecutor] Cannot start: stopped due to critical error"
      );
      return;
    }
    this.isRunning = true;
    this.intervalId = setInterval(() => this.executeStrategies(), intervalMs);
    // Execute immediately
    this.executeStrategies();
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

      console.log(
        `[StrategyExecutor] Checking ${markets.length} markets against ${activeStrategies.length} active strategies`
      );

      for (const strategy of activeStrategies) {
        // Check limits
        if (this.shouldSkipStrategy(strategy, now)) {
          console.log(
            `[StrategyExecutor] Skipping strategy ${strategy.id} due to limits`
          );
          continue;
        }

        // Find matching markets
        const matches = this.findMatchingMarkets(markets, strategy);
        console.log(
          `[StrategyExecutor] Strategy ${strategy.id} matched ${matches.length} markets`
        );

        for (const match of matches) {
          const marketId = parseInt(match.market.id);
          const executionKey = `${strategy.id}-${marketId}`;

          // Check if we have a pending execution for this market
          if (this.pendingExecutions.has(executionKey)) {
            console.log(
              `[StrategyExecutor] Execution already pending for market ${marketId} and strategy ${strategy.id}`
            );
            continue;
          }

          // Check if we've already predicted on this market
          const hasPredicted = await this.hasPredictedOnMarket(
            strategy.id,
            marketId
          );
          if (hasPredicted) {
            console.log(
              `[StrategyExecutor] Already predicted on market ${marketId} for strategy ${strategy.id}`
            );
            // Make sure it's not in pending set either
            this.pendingExecutions.delete(executionKey);
            continue;
          }

          // Double-check: if executionKey is in pending, skip
          if (this.pendingExecutions.has(executionKey)) {
            console.log(
              `[StrategyExecutor] Execution already pending for market ${marketId} and strategy ${strategy.id} (double-check)`
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
            console.log(
              `[StrategyExecutor] No side determined for market ${match.market.id} (confidence: ${match.confidence})`
            );
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

          // If execution failed due to permission limit, stop ALL strategies and executor
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
      console.log(
        `[StrategyExecutor] Strategy ${strategy.id} daily check: ${todayExecutions}/${strategy.limits.maxPredictionsPerDay} predictions today`
      );
      if (todayExecutions >= strategy.limits.maxPredictionsPerDay) {
        console.log(
          `[StrategyExecutor] Strategy ${strategy.id} hit daily limit: ${todayExecutions}/${strategy.limits.maxPredictionsPerDay}`
        );
        return true;
      }
    }

    // Check total stake limit
    if (strategy.limits?.maxTotalStake) {
      const totalStaked = strategy.stats?.totalStaked || 0;
      console.log(
        `[StrategyExecutor] Strategy ${
          strategy.id
        } stake check: $${totalStaked.toFixed(2)} / $${
          strategy.limits.maxTotalStake
        } limit`
      );
      if (totalStaked >= strategy.limits.maxTotalStake) {
        console.log(
          `[StrategyExecutor] Strategy ${
            strategy.id
          } hit total stake limit: $${totalStaked.toFixed(2)}/$${
            strategy.limits.maxTotalStake
          }`
        );
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

    for (const market of markets) {
      // Skip resolved markets
      if (market.resolved || market.status === 1) continue; // MarketStatus.Resolved = 1

      for (const condition of strategy.conditions) {
        if (this.matchesCondition(market, condition)) {
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
    condition: StrategyCondition
  ): boolean {
    // Category match
    if (condition.categories && condition.categories.length > 0) {
      if (!condition.categories.includes("all")) {
        const marketCategory = market.category.toLowerCase().trim();
        const categoryMatch = condition.categories.some(
          (cat) => cat.toLowerCase().trim() === marketCategory
        );
        if (!categoryMatch) {
          console.log(
            `[StrategyExecutor] Category mismatch: market="${marketCategory}", strategy=${condition.categories.join(
              ", "
            )}`
          );
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

    return true;
  }

  private calculateConfidence(
    market: MarketInfo,
    _condition: StrategyCondition,
    _strategy: PredictionStrategy
  ): number {
    let confidence = 60; // Base confidence (increased from 50)

    // Higher confidence for markets with more activity
    const poolSize =
      parseFloat(market.poolFormatted.replace(/[^0-9.]/g, "")) || 0;
    if (poolSize > 100) confidence += 10;
    if (poolSize > 500) confidence += 10;

    // Higher confidence for markets closer to 50/50 (more uncertainty = more opportunity)
    const yesPercent = market.yesPercent;
    if (yesPercent >= 45 && yesPercent <= 55) confidence += 15;

    // For new markets with no pool yet, give higher confidence
    if (poolSize === 0 || poolSize < 0.1) {
      confidence = 70; // New markets get higher confidence
    }

    // Lower confidence for extreme odds
    if (yesPercent < 20 || yesPercent > 80) confidence -= 10;

    return Math.min(100, Math.max(0, confidence));
  }

  private recommendSide(
    market: MarketInfo,
    _condition: StrategyCondition,
    strategy: PredictionStrategy
  ): "yes" | "no" {
    // If strategy has specific side preference
    if (strategy.action.side !== "auto") {
      return strategy.action.side;
    }

    // Simple heuristic: bet on the side with better odds (lower percentage = better odds)
    // If yes is < 50%, bet yes (odds favor yes)
    // If yes is > 50%, bet no (odds favor no)
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
    // TODO: Integrate with AI service (Gemini API)
    // For now, return null to use default heuristic
    return null;
  }

  private async hasPredictedOnMarket(
    strategyId: string,
    marketId: number
  ): Promise<boolean> {
    const executions = this.getExecutions(strategyId);
    // Check both successful and pending executions to prevent duplicates
    return executions.some(
      (e) =>
        e.marketId === marketId &&
        (e.status === "success" || e.status === "pending")
    );
  }

  private getTodayExecutions(strategyId: string, today: string): number {
    const executions = this.getExecutions(strategyId);
    // Only count successful executions towards the daily limit
    const todayExecutions = executions.filter((e) => {
      const execDate = new Date(e.timestamp).toDateString();
      return execDate === today && e.status === "success";
    });
    console.log(
      `[StrategyExecutor] Today's executions for ${strategyId}: ${
        todayExecutions.length
      } successful (total: ${
        executions.filter((e) => {
          const execDate = new Date(e.timestamp).toDateString();
          return execDate === today;
        }).length
      } total)`
    );
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

      // Remove from pending set after execution completes
      this.pendingExecutions.delete(executionKey);

      this.onExecution(execution);
      return result.success ? "success" : "failed";
    } catch (error) {
      const errorMessage = (error as Error).message.toLowerCase();

      // Check if error is permission limit exceeded
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

      // Remove from pending set after execution fails
      this.pendingExecutions.delete(executionKey);

      this.onExecution(execution);
      return "failed";
    }
  }
}
