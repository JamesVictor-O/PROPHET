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
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  DollarSign,
  Loader2,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAccount, useBalance } from "wagmi";
import {
  useCreateBinaryMarket,
  useCreateCrowdWisdomMarket,
  useCUSDAllowance,
  useApproveCUSD,
} from "@/hooks/contracts";
import { toast } from "sonner";
import { parseEther, maxUint256 } from "viem";
import { defaultChain } from "@/lib/wallet-config";
import { getContractAddress } from "@/lib/contracts";
import { Address } from "viem";
import { useAIValidator } from "@/hooks/useAIValidator";
import { MarketType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CreateMarketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateMarket: (market: MarketData) => void;
}

export interface MarketData {
  marketType: MarketType; // Binary (0) or CrowdWisdom (1)
  question: string;
  category: string;
  endDate: string;
  initialStake: number;
  initialSide: "yes" | "no"; // For Binary markets only
  initialOutcomeLabel: string; // For CrowdWisdom markets only
}

const categories = [
  {
    value: "music",
    label: "Music",
    color: "bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20",
  },
  {
    value: "movies",
    label: "Movies",
    color: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
  {
    value: "reality-tv",
    label: "Reality TV",
    color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  {
    value: "awards",
    label: "Awards",
    color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  },
  {
    value: "sports",
    label: "Sports",
    color: "bg-green-500/10 text-green-400 border-green-500/20",
  },
  {
    value: "other",
    label: "Other",
    color: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  },
];

export function CreateMarketModal({
  open,
  onOpenChange,
  onCreateMarket,
}: CreateMarketModalProps) {
  const [formData, setFormData] = useState<MarketData>({
    marketType: MarketType.Binary, // Default to Binary
    question: "",
    category: "",
    endDate: "",
    initialStake: 0.25,
    initialSide: "yes",
    initialOutcomeLabel: "", // For CrowdWisdom markets
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof MarketData, string>>
  >({});
  const [needsApproval, setNeedsApproval] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiCategorySelected, setAiCategorySelected] = useState(false);
  const [aiEndDateSelected, setAiEndDateSelected] = useState(false);
  const [aiQuestionSuggested, setAiQuestionSuggested] = useState(false);
  const [aiMarketTypeSelected, setAiMarketTypeSelected] = useState(false);
  const [suggestedQuestion, setSuggestedQuestion] = useState<string>("");
  const [originalQuestion, setOriginalQuestion] = useState<string>("");

  // AI Validation - only enabled when question is long enough
  const { validation, isValidating } = useAIValidator(formData.question, {
    enabled: formData.question.trim().length >= 10,
    debounceMs: 1000,
  });

  const { chainId, address } = useAccount();

  // Use appropriate hook based on market type
  const binaryMarket = useCreateBinaryMarket();
  const crowdWisdomMarket = useCreateCrowdWisdomMarket();

  const write =
    formData.marketType === MarketType.Binary
      ? binaryMarket.write
      : crowdWisdomMarket.write;
  const isPending =
    formData.marketType === MarketType.Binary
      ? binaryMarket.isPending
      : crowdWisdomMarket.isPending;
  const isConfirmed =
    formData.marketType === MarketType.Binary
      ? binaryMarket.isConfirmed
      : crowdWisdomMarket.isConfirmed;
  const writeError =
    formData.marketType === MarketType.Binary
      ? binaryMarket.error
      : crowdWisdomMarket.error;

  // Check if on correct network
  const isCorrectNetwork = chainId === defaultChain.id;

  // Get MarketFactory address for approval
  const factoryAddress = getContractAddress("factory") as Address;

  // Calculate stake amount in wei
  const stakeInWei =
    formData.initialStake > 0
      ? parseEther(formData.initialStake.toString())
      : undefined;

  // Check if approval is needed
  const {
    needsApproval: checkNeedsApproval,
    isLoading: isLoadingAllowance,
    refetch: refetchAllowance,
  } = useCUSDAllowance(factoryAddress, stakeInWei);

  // Approval hook
  const {
    write: approve,
    isPending: isApprovalPending,
    isConfirmed: isApprovalConfirmed,
    error: approvalError,
  } = useApproveCUSD();

  // Get cUSD balance
  const cusdAddress = getContractAddress("cUSD") as Address;
  const { data: cusdBalance } = useBalance({
    address,
    token: cusdAddress,
    chainId: defaultChain.id,
    query: {
      enabled: !!address && isCorrectNetwork,
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof MarketData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }));
    if (errors.category) {
      setErrors((prev) => ({ ...prev, category: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof MarketData, string>> = {};

    if (!formData.question.trim()) {
      newErrors.question = "Question is required";
    }
    if (!formData.category) {
      newErrors.category = "Category is required";
    }
    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
    } else {
      const endDate = new Date(formData.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (endDate <= today) {
        newErrors.endDate = "End date must be in the future";
      }
    }

    const minStake =
      formData.marketType === MarketType.CrowdWisdom ? 1.0 : 0.25;
    if (!formData.initialStake || formData.initialStake < minStake) {
      newErrors.initialStake =
        formData.marketType === MarketType.CrowdWisdom
          ? "Minimum stake is $1.00 cUSD for CrowdWisdom markets"
          : "Minimum stake is $0.25 cUSD";
    }
    // Validate based on market type
    if (formData.marketType === MarketType.Binary) {
      if (!formData.initialSide) {
        newErrors.initialSide = "Please select your prediction side";
      }
    } else if (formData.marketType === MarketType.CrowdWisdom) {
      if (!formData.initialOutcomeLabel.trim()) {
        newErrors.initialOutcomeLabel =
          "Initial outcome label is required for CrowdWisdom markets";
      }
    }
    if (cusdBalance && formData.initialStake > Number(cusdBalance.formatted)) {
      newErrors.initialStake = "Insufficient cUSD balance";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (checkNeedsApproval !== undefined) {
      setNeedsApproval(checkNeedsApproval);
    }
  }, [checkNeedsApproval]);

  useEffect(() => {
    if (isApprovalConfirmed && isProcessing) {
      setIsApproving(false);
      setNeedsApproval(false);
      refetchAllowance().then(() => {
        // After approval is confirmed and allowance refetched, automatically create market
        const marketWrite =
          formData.marketType === MarketType.Binary
            ? binaryMarket.write
            : crowdWisdomMarket.write;

        if (marketWrite) {
          setIsCreating(true);
          toast.info("Approval confirmed! Creating market...");

          // Small delay to ensure allowance is updated
          setTimeout(() => {
            if (!marketWrite) {
              toast.error("Connection error");
              setIsProcessing(false);
              setIsCreating(false);
              return;
            }

            try {
              if (!address) {
                toast.error("Wallet not connected");
                setIsProcessing(false);
                setIsCreating(false);
                return;
              }

              const endDate = new Date(formData.endDate);
              const endTime = Math.floor(endDate.getTime() / 1000);
              const stakeInWei = parseEther(formData.initialStake.toString());

              // Use appropriate hook based on market type
              if (formData.marketType === MarketType.Binary) {
                const initialSide = formData.initialSide === "yes" ? 0 : 1;
                binaryMarket.write({
                  question: formData.question,
                  category: formData.category,
                  endTime: BigInt(endTime),
                  initialStake: stakeInWei,
                  initialSide: initialSide as 0 | 1,
                });
              } else {
                // CrowdWisdom market
                crowdWisdomMarket.write({
                  question: formData.question,
                  category: formData.category,
                  endTime: BigInt(endTime),
                  initialStake: stakeInWei,
                  initialOutcomeLabel: formData.initialOutcomeLabel,
                });
              }
              toast.info("Confirm market creation in your wallet");
            } catch (err) {
              console.error("Error:", err);
              toast.error("Failed to create market");
              setIsProcessing(false);
              setIsCreating(false);
            }
          }, 500);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApprovalConfirmed, refetchAllowance, isProcessing, write]);

  useEffect(() => {
    if (approvalError) {
      console.error("Approval error:", approvalError);
      toast.error("Failed to approve cUSD");
      setIsApproving(false);
      setIsProcessing(false);
    }
  }, [approvalError]);

  useEffect(() => {
    if (isApprovalPending) {
      setIsApproving(true);
    } else if (isApprovalConfirmed || approvalError) {
      setIsApproving(false);
    }
  }, [isApprovalPending, isApprovalConfirmed, approvalError]);

  useEffect(() => {
    if (isConfirmed) {
      toast.success("Market created successfully!");
      setIsProcessing(false);
      setIsCreating(false);
      setIsApproving(false);
      const createdMarketData = { ...formData };
      setFormData({
        marketType: MarketType.Binary,
        question: "",
        category: "",
        endDate: "",
        initialStake: 0.25,
        initialSide: "yes",
        initialOutcomeLabel: "",
      });
      setErrors({});
      setNeedsApproval(false);
      onOpenChange(false);
      setTimeout(() => {
        onCreateMarket(createdMarketData);
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirmed]);

  useEffect(() => {
    if (writeError) {
      console.error("Error creating market:", writeError);
      setIsProcessing(false);
      setIsCreating(false);
      let errorMessage = "Failed to create market";
      if (writeError.message) {
        if (writeError.message.includes("user rejected")) {
          errorMessage = "Transaction rejected";
        } else if (writeError.message.includes("insufficient funds")) {
          errorMessage = "Insufficient funds";
        } else {
          errorMessage = writeError.message;
        }
      }
      toast.error(errorMessage);
    }
  }, [writeError]);

  // Removed handleCreateMarket - now handled in useEffect with proper market type separation

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (!isCorrectNetwork) {
      toast.error(`Switch to Celo Sepolia (Chain ID: ${defaultChain.id})`);
      return;
    }

    setIsProcessing(true);

    // Check if approval is needed
    if (needsApproval || checkNeedsApproval) {
      // Automatically trigger approval
      if (!approve || !factoryAddress) {
        toast.error("Approval not available");
        setIsProcessing(false);
        return;
      }

      setIsApproving(true);
      toast.info("Please approve cUSD spending in your wallet");
      try {
        approve([factoryAddress, maxUint256]);
        // Approval confirmation will automatically trigger market creation via useEffect
      } catch (err) {
        console.error("Error approving:", err);
        toast.error("Approval failed");
        setIsApproving(false);
        setIsProcessing(false);
      }
    } else {
      // No approval needed, create market directly
      setIsCreating(true);
      const marketWrite =
        formData.marketType === MarketType.Binary
          ? binaryMarket.write
          : crowdWisdomMarket.write;

      if (!marketWrite) {
        toast.error("Connection error");
        setIsProcessing(false);
        setIsCreating(false);
        return;
      }

      try {
        const endDate = new Date(formData.endDate);
        const endTime = Math.floor(endDate.getTime() / 1000);
        const stakeInWei = parseEther(formData.initialStake.toString());

        // Use appropriate hook based on market type
        if (formData.marketType === MarketType.Binary) {
          const initialSide = formData.initialSide === "yes" ? 0 : 1;
          binaryMarket.write({
            question: formData.question,
            category: formData.category,
            endTime: BigInt(endTime),
            initialStake: stakeInWei,
            initialSide: initialSide as 0 | 1,
          });
        } else {
          // CrowdWisdom market
          crowdWisdomMarket.write({
            question: formData.question,
            category: formData.category,
            endTime: BigInt(endTime),
            initialStake: stakeInWei,
            initialOutcomeLabel: formData.initialOutcomeLabel,
          });
        }
        toast.info("Confirm market creation in your wallet");
      } catch (err) {
        console.error("Error:", err);
        toast.error("Failed to create market");
        setIsProcessing(false);
        setIsCreating(false);
      }
    }
  };

  // Auto-suggest market type from AI validation (only if user hasn't manually set it)
  useEffect(() => {
    if (
      validation?.suggestedMarketType &&
      !aiMarketTypeSelected &&
      validation.isValid
    ) {
      const suggestedType =
        validation.suggestedMarketType === "CrowdWisdom"
          ? MarketType.CrowdWisdom
          : MarketType.Binary;

      if (formData.marketType !== suggestedType) {
        setFormData((prev) => {
          const newData = { ...prev, marketType: suggestedType };
          // If switching to CrowdWisdom, update minimum stake
          if (
            suggestedType === MarketType.CrowdWisdom &&
            prev.initialStake < 1.0
          ) {
            newData.initialStake = 1.0;
          }
          return newData;
        });
        setAiMarketTypeSelected(true);
      }
    }
  }, [
    validation?.suggestedMarketType,
    aiMarketTypeSelected,
    validation?.isValid,
    formData.marketType,
  ]);

  // Auto-fill category from AI validation (only if user hasn't manually set it)
  useEffect(() => {
    if (validation?.category && !aiCategorySelected) {
      const categoryExists = categories.some(
        (cat) => cat.value === validation.category
      );
      if (categoryExists && formData.category !== validation.category) {
        setFormData((prev) => ({ ...prev, category: validation.category }));
        setAiCategorySelected(true);
      }
    }
  }, [validation?.category, aiCategorySelected, formData.category]);

  // Auto-fill end date from AI validation (only if user hasn't manually set it)
  useEffect(() => {
    if (validation?.suggestedEndDate && !aiEndDateSelected) {
      try {
        const suggestedDate = new Date(validation.suggestedEndDate);
        if (suggestedDate > new Date()) {
          // Format as datetime-local (YYYY-MM-DDTHH:mm)
          const year = suggestedDate.getFullYear();
          const month = String(suggestedDate.getMonth() + 1).padStart(2, "0");
          const day = String(suggestedDate.getDate()).padStart(2, "0");
          const hours = String(suggestedDate.getHours()).padStart(2, "0");
          const minutes = String(suggestedDate.getMinutes()).padStart(2, "0");
          const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;

          // Only auto-fill if end date is empty or different from suggested
          if (!formData.endDate || formData.endDate !== formattedDate) {
            setFormData((prev) => ({ ...prev, endDate: formattedDate }));
            setAiEndDateSelected(true);
          }
        }
      } catch (err) {
        console.error("Error parsing suggested end date:", err);
      }
    }
  }, [validation?.suggestedEndDate, aiEndDateSelected, formData.endDate]);

  // Generate suggested question when AI validation completes with improved question
  useEffect(() => {
    if (
      validation?.improvedQuestion &&
      validation.improvedQuestion.trim().length > 0 &&
      formData.question.trim().length >= 10 &&
      !aiQuestionSuggested &&
      !isValidating
    ) {
      const improved = validation.improvedQuestion.trim();
      const original = formData.question.trim();

      // Validate that improvedQuestion is actually a question, not a suggestion/tip
      const suggestionKeywords = [
        "correct",
        "specify",
        "add",
        "remove",
        "change",
        "improve",
        "consider",
        "note:",
        "define",
        "explicitly",
      ];

      const isSuggestion =
        suggestionKeywords.some((keyword) =>
          improved.toLowerCase().startsWith(keyword)
        ) || improved.length < 10; // Too short to be a question

      // Check if it's a proper question (starts with question words or is a proper sentence)
      const questionWords = [
        "will",
        "does",
        "do",
        "is",
        "are",
        "was",
        "were",
        "can",
        "could",
        "should",
        "would",
        "has",
        "have",
        "had",
      ];
      const startsWithQuestionWord = questionWords.some((word) =>
        improved.toLowerCase().startsWith(word)
      );
      if (
        improved.toLowerCase() !== original.toLowerCase() &&
        !isSuggestion &&
        improved.length >= 10 &&
        (startsWithQuestionWord || improved.includes("?"))
      ) {
        // Store original question
        if (!originalQuestion) {
          setOriginalQuestion(original);
        }

        // Use the improved question from AI
        setSuggestedQuestion(improved);
        setAiQuestionSuggested(true);
      }
    }
  }, [
    validation?.improvedQuestion,
    formData.question,
    aiQuestionSuggested,
    isValidating,
    originalQuestion,
  ]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setFormData({
        marketType: MarketType.Binary,
        question: "",
        category: "",
        endDate: "",
        initialStake: 0.25,
        initialSide: "yes",
        initialOutcomeLabel: "",
      });
      setErrors({});
      setIsProcessing(false);
      setIsApproving(false);
      setIsCreating(false);
      setNeedsApproval(false);
      setAiCategorySelected(false);
      setAiEndDateSelected(false);
      setAiQuestionSuggested(false);
      setSuggestedQuestion("");
      setOriginalQuestion("");
    }
  }, [open]);

  const selectedCategory = categories.find(
    (cat) => cat.value === formData.category
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-[#1E293B] border-dark-700 text-white 
  w-full max-w-[calc(100%-1rem)] sm:max-w-lg md:max-w-xl lg:max-w-2xl p-0 gap-0 rounded-xl sm:rounded-2xl overflow-hidden max-h-[95vh] sm:max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-[#0F172A] border-b border-dark-700 px-3 py-3 sm:px-4 sm:py-4 sticky top-0 z-10 shrink-0">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-base sm:text-lg font-bold">
              Create Market
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-gray-400 leading-tight">
              Start your own prediction market
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 px-3 sm:px-4 md:px-6 min-h-0">
          {/* Balance Info */}
          {cusdBalance && (
            <div className="mt-3 p-2.5 bg-[#0F172A] border border-dark-700 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Your Balance</span>
                <span className="text-sm font-semibold">
                  {Number(cusdBalance.formatted).toFixed(2)} cUSD
                </span>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-3 sm:space-y-4 py-3 sm:py-4 md:py-6"
          >
            {/* Question */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Market Question</Label>
                {isValidating && formData.question.trim().length >= 10 && (
                  <div className="flex items-center gap-1 text-xs text-blue-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>AI validating...</span>
                  </div>
                )}
                {validation && !isValidating && (
                  <div className="flex items-center gap-1 text-xs">
                    {validation.isValid ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-green-400" />
                        <span className="text-green-400">Valid market</span>
                      </>
                    ) : validation.rejectionReason ? (
                      <>
                        <XCircle className="w-3 h-3 text-red-400" />
                        <span className="text-red-400">
                          Invalid: {validation.rejectionReason}
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-yellow-400" />
                        <span className="text-yellow-400">Needs review</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="relative">
                <Input
                  id="question"
                  name="question"
                  value={formData.question}
                  onChange={(e) => {
                    handleChange(e);
                    // Reset AI selections when question changes significantly
                    if (e.target.value.trim().length < 10) {
                      setAiCategorySelected(false);
                      setAiEndDateSelected(false);
                      setAiQuestionSuggested(false);
                      setAiMarketTypeSelected(false);
                      setSuggestedQuestion("");
                      setOriginalQuestion("");
                    } else if (
                      e.target.value !== suggestedQuestion &&
                      e.target.value !== originalQuestion
                    ) {
                      // User is manually editing, reset suggestion flags
                      setAiQuestionSuggested(false);
                      setOriginalQuestion("");
                    }
                  }}
                  placeholder="Will Burna Boy drop an album in Q4?"
                  disabled={isProcessing}
                  className="bg-[#0F172A] border-dark-700 h-10 text-sm disabled:opacity-50 pr-10"
                />
                {formData.question.trim().length >= 10 &&
                  !isValidating &&
                  validation && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {validation.isValid ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-yellow-400" />
                      )}
                    </div>
                  )}
              </div>
              {errors.question && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.question}
                </p>
              )}

              {/* AI Suggested Question */}
              {suggestedQuestion &&
                suggestedQuestion !== formData.question &&
                aiQuestionSuggested &&
                validation &&
                !isValidating && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-start gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-blue-400 mb-1">
                          AI Improved Question:
                        </p>
                        <p className="text-sm text-gray-200 leading-relaxed mb-2">
                          &ldquo;{suggestedQuestion}&rdquo;
                        </p>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                question: suggestedQuestion,
                              }));
                              setAiQuestionSuggested(false);
                            }}
                            className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                          >
                            Accept
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setAiQuestionSuggested(false);
                              setSuggestedQuestion("");
                            }}
                            className="h-7 text-xs border-dark-700 hover:bg-[#1E293B]"
                          >
                            Edit Original
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* AI Validation Info */}
              {validation && !isValidating && (
                <div
                  className={cn(
                    "p-2.5 border rounded-lg space-y-2",
                    validation.isValid
                      ? "bg-[#0F172A] border-dark-700"
                      : "bg-red-500/10 border-red-500/30"
                  )}
                >
                  {!validation.isValid && validation.rejectionReason && (
                    <div className="flex items-start gap-2">
                      <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-red-300 leading-relaxed">
                          <strong>Market Rejected:</strong>{" "}
                          {validation.rejectionReason}
                        </p>
                        {validation.reasoning && (
                          <p className="text-xs text-red-200/80 leading-relaxed mt-1">
                            {validation.reasoning}
                          </p>
                        )}
                        {validation.improvedQuestion && (
                          <div className="mt-2 pt-2 border-t border-red-500/20">
                            <p className="text-[10px] text-red-300/80 mb-1 font-medium">
                              Suggested Alternative:
                            </p>
                            <p className="text-xs text-red-200 italic">
                              &ldquo;{validation.improvedQuestion}&rdquo;
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {validation.isValid && validation.reasoning && (
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-300 leading-relaxed">
                          {validation.reasoning}
                        </p>
                        {validation.suggestedMarketType && (
                          <p className="text-[10px] text-blue-300 mt-1.5">
                            💡 AI suggests:{" "}
                            <strong>{validation.suggestedMarketType}</strong>{" "}
                            market type
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {validation.verificationSource && (
                    <div className="text-[10px] text-gray-400">
                      <span className="font-medium">Verification:</span>{" "}
                      {validation.verificationSource}
                    </div>
                  )}
                  {validation.confidence && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">
                        Confidence:
                      </span>
                      <Badge
                        className={`text-[10px] ${
                          validation.confidence === "high"
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : validation.confidence === "medium"
                            ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}
                      >
                        {validation.confidence.toUpperCase()}
                      </Badge>
                    </div>
                  )}
                  {validation.suggestions &&
                    validation.suggestions.length > 0 && (
                      <div className="pt-1.5 border-t border-dark-700">
                        <p className="text-[10px] text-gray-400 mb-1.5 font-medium">
                          Suggestions:
                        </p>
                        <ul className="space-y-1">
                          {validation.suggestions.map((suggestion, idx) => (
                            <li
                              key={idx}
                              className="text-[10px] text-gray-400 flex items-start gap-1.5"
                            >
                              <span className="text-blue-400">•</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Category</Label>
                {validation?.category && aiCategorySelected && (
                  <span className="text-[10px] text-blue-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI detected
                  </span>
                )}
              </div>
              <Select
                value={formData.category}
                onValueChange={(value) => {
                  handleCategoryChange(value);
                  // Only mark as manually changed if it's different from AI suggestion
                  if (validation?.category && value !== validation.category) {
                    setAiCategorySelected(false); // User manually changed
                  }
                }}
                disabled={isProcessing}
              >
                <SelectTrigger className="bg-[#0F172A] border-dark-700 h-10 disabled:opacity-50">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-[#1E293B] border-dark-700">
                  {categories.map((cat) => (
                    <SelectItem
                      key={cat.value}
                      value={cat.value}
                      className="text-white focus:bg-[#0F172A]"
                    >
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {errors.category && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.category}
                </p>
              )}

              {selectedCategory && (
                <Badge className={`${selectedCategory.color} text-[10px]`}>
                  {selectedCategory.label}
                </Badge>
              )}
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> End Date
                </Label>
                {validation?.suggestedEndDate && aiEndDateSelected && (
                  <span className="text-[10px] text-blue-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI suggested
                  </span>
                )}
              </div>
              <Input
                id="endDate"
                name="endDate"
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => {
                  // Only mark as manually changed if it's different from AI suggestion
                  if (validation?.suggestedEndDate) {
                    try {
                      const suggestedDate = new Date(
                        validation.suggestedEndDate
                      );
                      const year = suggestedDate.getFullYear();
                      const month = String(
                        suggestedDate.getMonth() + 1
                      ).padStart(2, "0");
                      const day = String(suggestedDate.getDate()).padStart(
                        2,
                        "0"
                      );
                      const hours = String(suggestedDate.getHours()).padStart(
                        2,
                        "0"
                      );
                      const minutes = String(
                        suggestedDate.getMinutes()
                      ).padStart(2, "0");
                      const formattedSuggested = `${year}-${month}-${day}T${hours}:${minutes}`;

                      if (e.target.value !== formattedSuggested) {
                        setAiEndDateSelected(false); // User manually changed
                      }
                    } catch {
                      setAiEndDateSelected(false);
                    }
                  } else {
                    setAiEndDateSelected(false);
                  }
                  handleChange(e);
                }}
                disabled={isProcessing}
                className="bg-[#0F172A] border-dark-700 h-10 text-sm disabled:opacity-50"
              />
              {errors.endDate && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.endDate}
                </p>
              )}
            </div>

            {/* Market Type */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Market Type</Label>
                {validation?.suggestedMarketType && aiMarketTypeSelected && (
                  <span className="text-[10px] text-blue-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI suggested
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      marketType: MarketType.Binary,
                      initialOutcomeLabel: "", // Clear outcome label when switching to Binary
                      initialStake:
                        prev.initialStake < 0.25 ? 0.25 : prev.initialStake, // Ensure minimum $0.25 for Binary
                    }));
                    setAiMarketTypeSelected(false); // User manually changed
                  }}
                  disabled={isProcessing}
                  className={`p-3 rounded-xl border-2 text-center text-sm transition-all ${
                    formData.marketType === MarketType.Binary
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-dark-700 bg-[#0F172A]"
                  } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="text-blue-400 font-semibold">Binary</div>
                  <div className="text-xs text-gray-400 mt-0.5">Yes/No</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      marketType: MarketType.CrowdWisdom,
                      initialSide: "yes", // Reset side when switching to CrowdWisdom
                      initialStake:
                        prev.initialStake < 1.0 ? 1.0 : prev.initialStake, // Ensure minimum $1 for CrowdWisdom
                    }));
                    setAiMarketTypeSelected(false); // User manually changed
                  }}
                  disabled={isProcessing}
                  className={`p-2.5 sm:p-3 rounded-xl border-2 text-center text-xs sm:text-sm transition-all touch-manipulation min-h-[60px] sm:min-h-[70px] ${
                    formData.marketType === MarketType.CrowdWisdom
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-dark-700 bg-[#0F172A]"
                  } ${
                    isProcessing
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:border-purple-500/50 active:scale-[0.98]"
                  }`}
                >
                  <div className="text-purple-400 font-semibold">
                    CrowdWisdom
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Multi-Outcome
                  </div>
                </button>
              </div>
            </div>

            {/* Stake */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <DollarSign className="w-3 h-3" /> Your Stake
              </Label>
              <div className="relative">
                <Input
                  id="initialStake"
                  name="initialStake"
                  type="number"
                  min={
                    formData.marketType === MarketType.CrowdWisdom
                      ? "1"
                      : "0.25"
                  }
                  step="0.25"
                  value={formData.initialStake || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      initialStake: parseFloat(e.target.value) || 0,
                    }))
                  }
                  disabled={isProcessing}
                  className="bg-[#0F172A] border-dark-700 h-11 sm:h-12 text-sm sm:text-base pr-12 disabled:opacity-50 touch-manipulation min-h-[44px]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  cUSD
                </span>
              </div>

              {errors.initialStake && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.initialStake}
                </p>
              )}

              <p className="text-[10px] text-gray-400">
                Min: $
                {formData.marketType === MarketType.CrowdWisdom
                  ? "1.00"
                  : "0.25"}{" "}
                • Max: $20
              </p>
            </div>

            {/* Binary Market: Prediction Buttons */}
            {formData.marketType === MarketType.Binary && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Your Prediction</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, initialSide: "yes" }))
                    }
                    disabled={isProcessing}
                    className={`p-3 rounded-xl border-2 text-center text-sm transition-all ${
                      formData.initialSide === "yes"
                        ? "border-green-500 bg-green-500/10"
                        : "border-dark-700 bg-[#0F172A]"
                    } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="text-green-400 font-semibold">YES</div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, initialSide: "no" }))
                    }
                    disabled={isProcessing}
                    className={`p-2.5 sm:p-3 rounded-xl border-2 text-center text-xs sm:text-sm transition-all touch-manipulation min-h-[60px] sm:min-h-[70px] ${
                      formData.initialSide === "no"
                        ? "border-red-500 bg-red-500/10"
                        : "border-dark-700 bg-[#0F172A]"
                    } ${
                      isProcessing
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:border-red-500/50 active:scale-[0.98]"
                    }`}
                  >
                    <div className="text-red-400 font-semibold">NO</div>
                  </button>
                </div>
              </div>
            )}

            {/* CrowdWisdom Market: Initial Outcome Label */}
            {formData.marketType === MarketType.CrowdWisdom && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Initial Outcome Label
                </Label>
                <Input
                  id="initialOutcomeLabel"
                  name="initialOutcomeLabel"
                  type="text"
                  placeholder="e.g., Obi, Atiku, Tinubu..."
                  value={formData.initialOutcomeLabel}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      initialOutcomeLabel: e.target.value,
                    }))
                  }
                  disabled={isProcessing}
                  className="bg-[#0F172A] border-dark-700 h-10 text-sm disabled:opacity-50"
                />
                {errors.initialOutcomeLabel && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />{" "}
                    {errors.initialOutcomeLabel}
                  </p>
                )}
                <p className="text-[10px] text-gray-400">
                  This will be the first outcome option. Others can add more
                  outcomes by commenting.
                </p>
              </div>
            )}

            {/* Info message when processing */}
            {isProcessing && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <div className="flex items-start gap-2">
                  <Loader2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5 animate-spin" />
                  <div className="flex-1">
                    <p className="text-xs text-blue-400 font-medium">
                      {isApproving
                        ? "Please approve cUSD spending in your wallet..."
                        : isCreating
                        ? "Creating your market..."
                        : "Processing..."}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {isApproving
                        ? "After approval, market creation will start automatically"
                        : "Please confirm the transaction in your wallet"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="bg-[#0F172A] border-t border-dark-700 p-3 sticky bottom-0">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-transparent border-dark-700 hover:bg-[#1E293B] h-10 text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={
                isPending ||
                isProcessing ||
                isLoadingAllowance ||
                !formData.question ||
                !formData.category ||
                !formData.endDate ||
                (formData.marketType === MarketType.CrowdWisdom &&
                  (!formData.initialOutcomeLabel.trim() ||
                    formData.initialStake < 1.0)) ||
                (formData.marketType === MarketType.Binary &&
                  (!formData.initialSide || formData.initialStake < 0.25))
              }
              className="flex-1 bg-[#2563EB] hover:bg-blue-600 h-10 text-sm disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isApproving
                    ? "Approving..."
                    : isCreating || isPending
                    ? "Creating..."
                    : "Processing..."}
                </>
              ) : (
                "Create Market"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
