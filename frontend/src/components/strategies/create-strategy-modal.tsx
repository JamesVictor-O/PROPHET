"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useStrategies } from "@/hooks/useStrategies";
import { toast } from "sonner";
import type {
  PredictionStrategy,
  StrategyCondition,
  StrategyAction,
  StrategyLimits,
  MarketCategory,
} from "@/lib/strategy-types";
import { Loader2, Plus, X } from "lucide-react";

interface CreateStrategyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStrategyCreated?: (strategy: PredictionStrategy) => void;
}

export function CreateStrategyModal({
  open,
  onOpenChange,
  onStrategyCreated,
}: CreateStrategyModalProps) {
  const { createStrategy } = useStrategies();
  const [isCreating, setIsCreating] = useState(false);

  // Strategy basic info
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Conditions
  const [triggerType, setTriggerType] =
    useState<StrategyCondition["type"]>("new_market");
  const [categories, setCategories] = useState<MarketCategory[]>(["all"]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [minYesPercent, setMinYesPercent] = useState<number | undefined>();
  const [maxYesPercent, setMaxYesPercent] = useState<number | undefined>();
  const [minPoolSize, setMinPoolSize] = useState<number | undefined>();

  // Action
  const [stakeAmount, setStakeAmount] = useState("");
  const [side, setSide] = useState<"yes" | "no" | "auto">("auto");
  const [minConfidence, setMinConfidence] = useState(50);
  const [useAI, setUseAI] = useState(true);

  // Limits
  const [maxTotalStake, setMaxTotalStake] = useState<number | undefined>();
  const [maxPredictionsPerDay, setMaxPredictionsPerDay] = useState<
    number | undefined
  >();
  const [expiryDate, setExpiryDate] = useState("");

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Please enter a strategy name");
      return;
    }

    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      toast.error("Please enter a valid stake amount");
      return;
    }

    setIsCreating(true);

    try {
      const conditions: StrategyCondition[] = [
        {
          type: triggerType,
          categories: categories.length > 0 ? categories : undefined,
          keywords: keywords.length > 0 ? keywords : undefined,
          minYesPercent,
          maxYesPercent,
          minPoolSize,
        },
      ];

      const action: StrategyAction = {
        stakeAmount: parseFloat(stakeAmount),
        side,
        minConfidence,
      };

      const limits: StrategyLimits | undefined =
        maxTotalStake || maxPredictionsPerDay || expiryDate
          ? {
              maxTotalStake,
              maxPredictionsPerDay,
              expiryDate: expiryDate || undefined,
            }
          : undefined;

      const strategy = createStrategy({
        name: name.trim(),
        description: description.trim() || undefined,
        conditions,
        action,
        limits,
        aiSettings: {
          useAI,
          confidenceThreshold: minConfidence,
        },
      });

      toast.success("Strategy created successfully!");
      onStrategyCreated?.(strategy);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to create strategy");
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setTriggerType("new_market");
    setCategories(["all"]);
    setKeywords([]);
    setKeywordInput("");
    setMinYesPercent(undefined);
    setMaxYesPercent(undefined);
    setMinPoolSize(undefined);
    setStakeAmount("");
    setSide("auto");
    setMinConfidence(50);
    setUseAI(true);
    setMaxTotalStake(undefined);
    setMaxPredictionsPerDay(undefined);
    setExpiryDate("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto bg-[#020617] border-white/10 p-0 sm:p-6">
        <DialogHeader className="px-4 sm:px-0 pt-6 sm:pt-0 pb-4 border-b border-white/5">
          <DialogTitle className="text-white text-2xl sm:text-3xl font-black tracking-tight">
            Create Strategy
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-sm sm:text-base mt-2">
            Set up automated predictions that execute on your behalf using your
            session account permissions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 sm:space-y-8 py-4 sm:py-6 px-4 sm:px-0">
          {/* Basic Info */}
          <div className="space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-white text-sm font-semibold"
              >
                Strategy Name *
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Sports High Confidence"
                className="bg-white/5 border-white/10 text-white h-11 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-white text-sm font-semibold"
              >
                Description
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                className="bg-white/5 border-white/10 text-white h-11 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Conditions */}
          <div className="space-y-5 sm:space-y-6 border-t border-white/10 pt-5 sm:pt-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px w-6 bg-blue-500" />
              <h3 className="text-white font-bold text-base sm:text-lg">
                Trigger Conditions
              </h3>
            </div>

            <div className="space-y-2">
              <Label className="text-white text-sm font-semibold">
                Trigger Type
              </Label>
              <Select
                value={triggerType}
                onValueChange={(value) =>
                  setTriggerType(value as StrategyCondition["type"])
                }
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white h-11 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#020617] border-white/10">
                  <SelectItem
                    value="new_market"
                    className="text-white hover:bg-white/5"
                  >
                    New Market
                  </SelectItem>
                  <SelectItem
                    value="odds_threshold"
                    className="text-white hover:bg-white/5"
                  >
                    Odds Threshold
                  </SelectItem>
                  <SelectItem
                    value="pool_size"
                    className="text-white hover:bg-white/5"
                  >
                    Pool Size
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white text-sm font-semibold">
                Categories
              </Label>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    "all",
                    "sports",
                    "politics",
                    "tech",
                    "entertainment",
                  ] as MarketCategory[]
                ).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      if (cat === "all") {
                        setCategories(["all"]);
                      } else {
                        setCategories(
                          categories.includes("all")
                            ? [cat]
                            : categories.includes(cat)
                            ? categories.filter((c) => c !== cat)
                            : [...categories.filter((c) => c !== "all"), cat]
                        );
                      }
                    }}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                      categories.includes(cat)
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                        : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {triggerType === "odds_threshold" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white text-sm font-semibold">
                    Min Yes %
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={minYesPercent || ""}
                    onChange={(e) =>
                      setMinYesPercent(
                        e.target.value ? parseFloat(e.target.value) : undefined
                      )
                    }
                    className="bg-white/5 border-white/10 text-white h-11 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white text-sm font-semibold">
                    Max Yes %
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={maxYesPercent || ""}
                    onChange={(e) =>
                      setMaxYesPercent(
                        e.target.value ? parseFloat(e.target.value) : undefined
                      )
                    }
                    className="bg-white/5 border-white/10 text-white h-11 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="100"
                  />
                </div>
              </div>
            )}

            {triggerType === "pool_size" && (
              <div className="space-y-2">
                <Label className="text-white text-sm font-semibold">
                  Min Pool Size (USDC)
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={minPoolSize || ""}
                  onChange={(e) =>
                    setMinPoolSize(
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  className="bg-white/5 border-white/10 text-white h-11 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-white text-sm font-semibold">
                Keywords (optional)
              </Label>
              <div className="flex gap-2">
                <Input
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddKeyword();
                    }
                  }}
                  placeholder="Add keyword"
                  className="bg-white/5 border-white/10 text-white h-11 text-sm flex-1 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <Button
                  type="button"
                  onClick={handleAddKeyword}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white h-11 px-4 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 text-slate-300 rounded-lg text-xs sm:text-sm font-medium hover:bg-white/10 transition-colors"
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(keyword)}
                        className="hover:text-white transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action */}
          <div className="space-y-5 sm:space-y-6 border-t border-white/10 pt-5 sm:pt-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px w-6 bg-emerald-500" />
              <h3 className="text-white font-bold text-base sm:text-lg">
                Prediction Action
              </h3>
            </div>

            <div className="space-y-2">
              <Label className="text-white text-sm font-semibold">
                Stake Amount (USDC) *
              </Label>
              <Input
                type="number"
                min="0.025"
                step="0.025"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder="0.025"
                className="bg-white/5 border-white/10 text-white h-11 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500">
                Minimum stake: 0.025 USDC
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-white text-sm font-semibold">Side</Label>
              <Select
                value={side}
                onValueChange={(value) =>
                  setSide(value as "yes" | "no" | "auto")
                }
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white h-11 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#020617] border-white/10">
                  <SelectItem
                    value="auto"
                    className="text-white hover:bg-white/5"
                  >
                    Auto (AI decides)
                  </SelectItem>
                  <SelectItem
                    value="yes"
                    className="text-white hover:bg-white/5"
                  >
                    Always Yes
                  </SelectItem>
                  <SelectItem
                    value="no"
                    className="text-white hover:bg-white/5"
                  >
                    Always No
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {side === "auto" && (
              <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-white text-sm font-semibold">
                      Min Confidence
                    </Label>
                    <span className="text-blue-400 font-bold text-sm">
                      {minConfidence}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={minConfidence}
                    onChange={(e) => setMinConfidence(parseInt(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
                <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                  <input
                    type="checkbox"
                    id="useAI"
                    checked={useAI}
                    onChange={(e) => setUseAI(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-600 focus:ring-blue-500"
                  />
                  <Label
                    htmlFor="useAI"
                    className="text-white text-sm font-medium cursor-pointer"
                  >
                    Use AI for side selection
                  </Label>
                </div>
              </div>
            )}
          </div>

          {/* Limits */}
          <div className="space-y-5 sm:space-y-6 border-t border-white/10 pt-5 sm:pt-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px w-6 bg-purple-500" />
              <h3 className="text-white font-bold text-base sm:text-lg">
                Safety Limits{" "}
                <span className="text-slate-500 font-normal text-sm">
                  (Optional)
                </span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="space-y-2">
                <Label className="text-white text-sm font-semibold">
                  Max Total Stake (USDC)
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={maxTotalStake || ""}
                  onChange={(e) =>
                    setMaxTotalStake(
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  placeholder="Unlimited"
                  className="bg-white/5 border-white/10 text-white h-11 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white text-sm font-semibold">
                  Max Predictions Per Day
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={maxPredictionsPerDay || ""}
                  onChange={(e) =>
                    setMaxPredictionsPerDay(
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  placeholder="Unlimited"
                  className="bg-white/5 border-white/10 text-white h-11 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white text-sm font-semibold">
                Expiry Date
              </Label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="bg-white/5 border-white/10 text-white h-11 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 sm:pt-6 border-t border-white/10 px-4 sm:px-0 pb-4 sm:pb-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
            className="border-white/10 text-slate-300 hover:bg-white/5 h-11 order-2 sm:order-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating || !name.trim() || !stakeAmount}
            className="bg-blue-600 hover:bg-blue-700 text-white h-11 font-semibold order-1 sm:order-2"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Strategy"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
