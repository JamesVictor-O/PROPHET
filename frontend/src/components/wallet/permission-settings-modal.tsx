"use client";

import { useState, useEffect } from "react";
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
import { AlertCircle, Loader2 } from "lucide-react";
import { useBalance } from "wagmi";
import { getContractAddress } from "@/lib/contracts";
import { defaultChain } from "@/lib/wallet-config";
import { parseUnits } from "viem";

interface PermissionSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (amount: number, durationHours: number) => void;
  isLoading?: boolean;
}

export function PermissionSettingsModal({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: PermissionSettingsModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [durationHours, setDurationHours] = useState<string>("24");
  const [errors, setErrors] = useState<{
    amount?: string;
    duration?: string;
  }>({});

  // Get token info based on chain
  const tokenDecimals =
    defaultChain.id === 84532 || defaultChain.id === 8453 ? 6 : 18;
  const tokenSymbol =
    defaultChain.id === 84532 || defaultChain.id === 8453 ? "USDC" : "cUSD";
  const tokenAddress = getContractAddress("cUSD");

  // Get user's token balance
  const { data: tokenBalance, isLoading: isLoadingBalance } = useBalance({
    token: tokenAddress as `0x${string}`,
    query: {
      enabled: open && !!tokenAddress,
    },
  });

  const userBalance = tokenBalance ? Number(tokenBalance.formatted) : undefined;

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setAmount("");
      setDurationHours("24");
      setErrors({});
    }
  }, [open]);

  const validateForm = (): boolean => {
    const newErrors: { amount?: string; duration?: string } = {};

    // Validate amount
    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = "Please enter a valid amount";
    } else if (userBalance !== undefined && amountNum > userBalance) {
      newErrors.amount = `Amount exceeds your balance of ${userBalance.toFixed(
        2
      )} ${tokenSymbol}`;
    } else if (amountNum < 0.01) {
      newErrors.amount = "Minimum amount is 0.01";
    }

    // Validate duration
    const durationNum = parseFloat(durationHours);
    if (!durationHours || isNaN(durationNum) || durationNum <= 0) {
      newErrors.duration = "Please enter a valid duration";
    } else if (durationNum > 168) {
      newErrors.duration = "Maximum duration is 168 hours (7 days)";
    } else if (durationNum < 1) {
      newErrors.duration = "Minimum duration is 1 hour";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (validateForm()) {
      onConfirm(parseFloat(amount), parseFloat(durationHours));
    }
  };

  const handleQuickSelect = (hours: number) => {
    setDurationHours(hours.toString());
    setErrors((prev) => ({ ...prev, duration: undefined }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[#1E293B] border-dark-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            Configure One-Tap Betting
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Set the spending limit and duration for one-tap betting. You can
            adjust these settings when granting permission.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-white">
              Spending Limit per Period
            </Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setErrors((prev) => ({ ...prev, amount: undefined }));
                }}
                placeholder="Enter amount"
                className="bg-[#0F172A] border-dark-700 text-white pr-20"
                disabled={isLoading}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                {tokenSymbol}
              </span>
            </div>
            {errors.amount && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.amount}
              </p>
            )}
            {userBalance !== undefined && !errors.amount && (
              <p className="text-xs text-gray-400">
                Your balance: {userBalance.toFixed(2)} {tokenSymbol}
              </p>
            )}
            {isLoadingBalance && (
              <p className="text-xs text-gray-400">Loading balance...</p>
            )}
          </div>

          {/* Duration Input */}
          <div className="space-y-2">
            <Label htmlFor="duration" className="text-white">
              Permission Duration
            </Label>
            <div className="relative">
              <Input
                id="duration"
                type="number"
                step="1"
                min="1"
                max="168"
                value={durationHours}
                onChange={(e) => {
                  setDurationHours(e.target.value);
                  setErrors((prev) => ({ ...prev, duration: undefined }));
                }}
                placeholder="Enter hours"
                className="bg-[#0F172A] border-dark-700 text-white pr-20"
                disabled={isLoading}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                hours
              </span>
            </div>
            {errors.duration && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.duration}
              </p>
            )}

            {/* Quick Select Buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(1)}
                className="text-xs border-dark-700 hover:bg-dark-700"
                disabled={isLoading}
              >
                1 hour
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(24)}
                className="text-xs border-dark-700 hover:bg-dark-700"
                disabled={isLoading}
              >
                24 hours
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(72)}
                className="text-xs border-dark-700 hover:bg-dark-700"
                disabled={isLoading}
              >
                3 days
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(168)}
                className="text-xs border-dark-700 hover:bg-dark-700"
                disabled={isLoading}
              >
                7 days
              </Button>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-xs text-gray-400">
              <strong className="text-blue-400">Note:</strong> This permission
              allows Prophet to spend up to {amount || "___"} {tokenSymbol} per
              period (every 24 hours) for{" "}
              {durationHours ? parseFloat(durationHours) / 24 : "___"} day
              {durationHours && parseFloat(durationHours) / 24 !== 1 ? "s" : ""}
              . You can revoke this permission at any time.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-dark-700 hover:bg-dark-700"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              disabled={isLoading || !amount || !durationHours}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Continue to MetaMask"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
