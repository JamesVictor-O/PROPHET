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
import { Calendar, DollarSign, Info, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAccount, useBalance } from "wagmi";
import {
  useCreateMarket,
  useCUSDAllowance,
  useApproveCUSD,
} from "@/hooks/contracts";
import { toast } from "sonner";
import { parseEther, maxUint256 } from "viem";
import { defaultChain } from "@/lib/wallet-config";
import { getContractAddress } from "@/lib/contracts";
import { Address } from "viem";

interface CreateMarketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateMarket: (market: MarketData) => void;
}

export interface MarketData {
  question: string;
  category: string;
  endDate: string;
  initialStake: number;
  initialSide: "yes" | "no";
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
    question: "",
    category: "",
    endDate: "",
    initialStake: 0.25,
    initialSide: "yes",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof MarketData, string>>
  >({});
  const [needsApproval, setNeedsApproval] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const { chainId, address } = useAccount();
  const {
    write,
    isPending,
    isConfirmed,
    error: writeError,
  } = useCreateMarket();

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

  // Get cUSD balance (for informational purposes - creation is currently free)
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
    // Clear error when user starts typing
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
    if (!formData.initialStake || formData.initialStake < 0.25) {
      newErrors.initialStake = "Minimum stake is $0.25 cUSD";
    }
    if (!formData.initialSide) {
      newErrors.initialSide = "Please select your prediction side";
    }
    // Check balance if available
    if (cusdBalance && formData.initialStake > Number(cusdBalance.formatted)) {
      newErrors.initialStake = "Insufficient cUSD balance";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Update needsApproval state when allowance check completes
  useEffect(() => {
    if (checkNeedsApproval !== undefined) {
      setNeedsApproval(checkNeedsApproval);
    }
  }, [checkNeedsApproval]);

  // Handle successful approval
  useEffect(() => {
    if (isApprovalConfirmed) {
      toast.success("Approval confirmed! You can now create the market.");
      setIsApproving(false);
      setNeedsApproval(false);
      // Refetch allowance to update state
      refetchAllowance();
    }
  }, [isApprovalConfirmed, refetchAllowance]);

  // Handle approval errors
  useEffect(() => {
    if (approvalError) {
      console.error("Approval error:", approvalError);
      toast.error("Failed to approve cUSD. Please try again.");
      setIsApproving(false);
    }
  }, [approvalError]);

  // Sync isApproving state with approval transaction status
  useEffect(() => {
    if (isApprovalPending) {
      setIsApproving(true);
    } else if (isApprovalConfirmed || approvalError) {
      setIsApproving(false);
    }
  }, [isApprovalPending, isApprovalConfirmed, approvalError]);

  // Handle successful market creation
  useEffect(() => {
    if (isConfirmed) {
      toast.success("Market created successfully!");

      // Store form data before resetting
      const createdMarketData = { ...formData };

      // Reset form
      setFormData({
        question: "",
        category: "",
        endDate: "",
        initialStake: 0.25,
        initialSide: "yes",
      });
      setErrors({});
      setNeedsApproval(false);
      onOpenChange(false);

      // Call callback after state updates
      setTimeout(() => {
        onCreateMarket(createdMarketData);
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirmed]);

  // Handle errors
  useEffect(() => {
    if (writeError) {
      console.error("Error creating market:", writeError);

      // Provide more helpful error messages
      let errorMessage = "Failed to create market";
      if (writeError.message) {
        if (writeError.message.includes("Internal JSON-RPC error")) {
          errorMessage =
            "RPC error: Please check your network connection and try again";
        } else if (writeError.message.includes("user rejected")) {
          errorMessage = "Transaction was rejected";
        } else if (writeError.message.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for transaction";
        } else {
          errorMessage = writeError.message;
        }
      }

      toast.error(errorMessage);
    }
  }, [writeError]);

  const handleApprove = async () => {
    if (!approve || !factoryAddress) {
      toast.error(
        "Approval function not available. Please check your connection."
      );
      return;
    }

    setIsApproving(true);
    try {
      // Approve max amount to avoid repeated approvals
      // This is a common pattern for better UX
      approve([factoryAddress, maxUint256]);
      toast.info("Please approve the cUSD spending in your wallet.");
    } catch (err) {
      console.error("Error approving cUSD:", err);
      toast.error("Failed to approve cUSD. Please try again.");
      setIsApproving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    // Check network before submitting
    if (!isCorrectNetwork) {
      toast.error(
        `Please switch to Celo Sepolia (Chain ID: ${defaultChain.id}) to create markets`
      );
      return;
    }

    // Check if approval is needed first
    if (needsApproval || checkNeedsApproval) {
      toast.error("Please approve cUSD spending first.");
      return;
    }

    if (!write) {
      toast.error(
        "Write function not available. Please check your connection."
      );
      return;
    }

    try {
      // Convert endDate to Unix timestamp
      const endDate = new Date(formData.endDate);
      const endTime = Math.floor(endDate.getTime() / 1000);

      // Convert stake to wei (cUSD has 18 decimals)
      const stakeInWei = parseEther(formData.initialStake.toString());

      // Convert side to uint8 (0 = Yes, 1 = No)
      const initialSide = formData.initialSide === "yes" ? 0 : 1;

      // Call the contract with stake and side
      write([
        formData.question,
        formData.category,
        BigInt(endTime),
        stakeInWei,
        initialSide,
      ]);
      toast.info("Transaction submitted. Please confirm in your wallet.");
    } catch (err) {
      console.error("Error submitting market creation:", err);
      toast.error("Failed to create market. Please try again.");
    }
  };

  const selectedCategory = categories.find(
    (cat) => cat.value === formData.category
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1E293B] border-[#334155] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Create New Market
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Create a prediction market for others to participate in
          </DialogDescription>
          {/* Info about creation fee */}
          <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-400">
              <Info className="w-4 h-4 inline mr-1" />
              <strong>Market creation is currently free</strong> (no cUSD
              required). However, making predictions requires cUSD tokens.
              {cusdBalance && (
                <span className="block mt-1 text-xs">
                  Your cUSD balance: {Number(cusdBalance.formatted).toFixed(2)}{" "}
                  cUSD
                </span>
              )}
            </p>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Question */}
          <div className="space-y-2">
            <Label htmlFor="question" className="text-sm font-medium">
              Market Question *
            </Label>
            <Input
              id="question"
              name="question"
              value={formData.question}
              onChange={handleChange}
              placeholder="e.g., Will Burna Boy drop an album in Q4 2024?"
              className="bg-[#0F172A] border-[#334155] text-white"
            />
            {errors.question && (
              <p className="text-xs text-red-400">{errors.question}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">
              Category *
            </Label>
            <Select
              value={formData.category}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className="bg-[#0F172A] border-[#334155] text-white">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-[#1E293B] border-[#334155]">
                {categories.map((category) => (
                  <SelectItem
                    key={category.value}
                    value={category.value}
                    className="text-white focus:bg-[#0F172A]"
                  >
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-xs text-red-400">{errors.category}</p>
            )}
            {selectedCategory && (
              <Badge className={selectedCategory.color}>
                {selectedCategory.label}
              </Badge>
            )}
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label
              htmlFor="endDate"
              className="text-sm font-medium flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              End Date *
            </Label>
            <Input
              id="endDate"
              name="endDate"
              type="datetime-local"
              value={formData.endDate}
              onChange={handleChange}
              className="bg-[#0F172A] border-[#334155] text-white"
            />
            {errors.endDate && (
              <p className="text-xs text-red-400">{errors.endDate}</p>
            )}
          </div>

          {/* Required Initial Stake */}
          <div className="space-y-2">
            <Label
              htmlFor="initialStake"
              className="text-sm font-medium flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4" />
              Your Initial Stake (Required) *
            </Label>
            <Input
              id="initialStake"
              name="initialStake"
              type="number"
              min="0.25"
              step="0.25"
              value={formData.initialStake || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  initialStake: parseFloat(e.target.value) || 0,
                }))
              }
              placeholder="0.25"
              required
              className="bg-[#0F172A] border-[#334155] text-white"
            />
            {errors.initialStake && (
              <p className="text-xs text-red-400">{errors.initialStake}</p>
            )}
            <p className="text-xs text-gray-400">
              Put your money where your mouth is! Minimum $0.25 cUSD required to
              create a market.
              {cusdBalance && (
                <span className="block mt-1">
                  Available: {Number(cusdBalance.formatted).toFixed(2)} cUSD
                </span>
              )}
            </p>
          </div>

          {/* Initial Side Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Your Prediction Side *
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, initialSide: "yes" }))
                }
                className={`p-4 rounded-lg border-2 transition-colors ${
                  formData.initialSide === "yes"
                    ? "border-green-500 bg-green-500/10"
                    : "border-[#334155] bg-[#0F172A] hover:border-green-500/50"
                }`}
              >
                <div className="text-lg font-bold text-green-400 mb-1">YES</div>
                <div className="text-xs text-gray-400">I predict Yes</div>
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, initialSide: "no" }))
                }
                className={`p-4 rounded-lg border-2 transition-colors ${
                  formData.initialSide === "no"
                    ? "border-red-500 bg-red-500/10"
                    : "border-[#334155] bg-[#0F172A] hover:border-red-500/50"
                }`}
              >
                <div className="text-lg font-bold text-red-400 mb-1">NO</div>
                <div className="text-xs text-gray-400">I predict No</div>
              </button>
            </div>
            {errors.initialSide && (
              <p className="text-xs text-red-400">{errors.initialSide}</p>
            )}
            <p className="text-xs text-gray-400">
              Which side are you betting on when creating this market?
            </p>
          </div>

          {/* Approval Notice */}
          {(needsApproval || checkNeedsApproval) && !isApprovalConfirmed && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-yellow-400 mb-3">
                <Info className="w-4 h-4 inline mr-1" />
                <strong>Approval Required:</strong> You need to approve the
                MarketFactory contract to spend your cUSD tokens before creating
                a market.
              </p>
              <Button
                type="button"
                onClick={handleApprove}
                disabled={isApproving || isApprovalPending}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                {isApproving || isApprovalPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Approving...
                  </>
                ) : (
                  "Approve cUSD Spending"
                )}
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-[#0F172A] border-[#334155] hover:bg-[#334155]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isPending ||
                needsApproval ||
                checkNeedsApproval ||
                isLoadingAllowance
              }
              className="flex-1 bg-[#2563EB] hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : isLoadingAllowance ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : needsApproval || checkNeedsApproval ? (
                "Approve First"
              ) : (
                "Create Market"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
