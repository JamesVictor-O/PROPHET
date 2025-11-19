"use client";

import { useState, useMemo, useEffect } from "react";
import { useAccount } from "wagmi";
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
  useSetUsername,
  useIsUsernameAvailable,
} from "@/hooks/contracts/useReputationSystem";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface UsernameModalProps {
  open: boolean;
  onComplete: () => void;
}

export function UsernameModal({ open, onComplete }: UsernameModalProps) {
  const { address } = useAccount();
  const [username, setUsername] = useState("");

  const {
    data: isAvailable,
    isLoading: checkingAvailability,
    isError: availabilityError,
  } = useIsUsernameAvailable(username.length >= 3 ? username : undefined);
  const { write, isPending, isConfirmed, error: writeError } = useSetUsername();

  // Validate username format using useMemo
  const validation = useMemo(() => {
    if (username.length === 0) {
      return { isValid: false, error: "" };
    }

    if (username.length < 3) {
      return {
        isValid: false,
        error: "Username must be at least 3 characters",
      };
    }

    if (username.length > 20) {
      return {
        isValid: false,
        error: "Username must be 20 characters or less",
      };
    }

    // Check if username contains only alphanumeric and underscores
    const validPattern = /^[a-zA-Z0-9_]+$/;
    if (!validPattern.test(username)) {
      return {
        isValid: false,
        error: "Username can only contain letters, numbers, and underscores",
      };
    }

    // If there's an error checking availability, log it but don't block submission
    // The contract will enforce uniqueness anyway
    if (availabilityError) {
      console.warn("Error checking username availability:", availabilityError);
      // Don't return an error - allow user to proceed
      // The contract will reject if username is taken
    }

    // Check availability
    if (isAvailable === false) {
      return { isValid: false, error: "Username is already taken" };
    }

    // If available is true, username is valid
    if (isAvailable === true) {
      return { isValid: true, error: "" };
    }

    // If still checking, undefined, or error - format is valid, allow submission
    // The contract will enforce uniqueness anyway
    // This allows the button to be enabled even if availability check fails
    return { isValid: true, error: "" };
  }, [username, isAvailable, availabilityError]);

  // Allow submission if:
  // 1. Format is valid (length, pattern)
  // 2. Not currently taken (if we know it's taken, block it)
  // 3. Not currently pending or checking
  // Note: If availability check fails or is undefined, we still allow submission
  // The smart contract will enforce uniqueness
  const formatValid =
    username.length >= 3 &&
    username.length <= 20 &&
    /^[a-zA-Z0-9_]+$/.test(username);

  const canSubmit =
    formatValid &&
    isAvailable !== false && // Only block if we know it's taken
    !isPending &&
    !checkingAvailability;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Use the same logic as canSubmit for consistency
    if (!canSubmit || !address) {
      console.log("Cannot submit:", {
        canSubmit,
        address,
        formatValid,
        isAvailable,
        isPending,
        checkingAvailability,
      });
      if (!address) {
        toast.error("Please connect your wallet");
      }
      return;
    }

    try {
      console.log("Attempting to set username:", username);
      if (!write) {
        toast.error(
          "Write function not available. Please check your connection."
        );
        return;
      }
      write([username]);
      toast.info("Transaction submitted. Please confirm in your wallet.");
    } catch (err) {
      console.error("Error setting username:", err);
      toast.error("Failed to set username. Please try again.");
    }
  };

  // Handle write errors
  useEffect(() => {
    if (writeError) {
      console.error("Write error:", writeError);
      toast.error(
        `Transaction failed: ${writeError.message || "Unknown error"}`
      );
    }
  }, [writeError]);

  // Handle successful username set
  useEffect(() => {
    if (isConfirmed) {
      toast.success("Username set successfully!");
      onComplete();
      // Reset form after a brief delay to allow modal to close
      setTimeout(() => {
        setUsername("");
      }, 100);
    }
  }, [isConfirmed, onComplete]);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="w-full max-w-[calc(100%-1rem)] sm:max-w-md md:max-w-lg p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Choose Your Username</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Set a unique username to get started. This will be displayed instead
            of your wallet address.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="Enter username (3-20 characters)"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              disabled={isPending}
              className={validation.error ? "border-red-500" : ""}
            />
            {validation.error && (
              <p className="text-sm text-red-500">{validation.error}</p>
            )}
            {!validation.error &&
              username.length >= 3 &&
              checkingAvailability && (
                <p className="text-sm text-gray-400">
                  Checking availability...
                </p>
              )}
            {!validation.error &&
              username.length >= 3 &&
              !checkingAvailability &&
              isAvailable === true && (
                <p className="text-sm text-green-500">✓ Username available</p>
              )}
            {!validation.error &&
              username.length >= 3 &&
              !checkingAvailability &&
              isAvailable === undefined &&
              !availabilityError && (
                <p className="text-sm text-gray-400">Ready to set username</p>
              )}
            {!validation.error && username.length >= 3 && availabilityError && (
              <p className="text-sm text-yellow-500">
                ⚠ Could not verify availability. You can still try to set it -
                the contract will check.
              </p>
            )}
            <p className="text-xs text-gray-500">
              Only letters, numbers, and underscores allowed (e.g., codex,
              user123, my_username)
            </p>
          </div>

          <Button type="submit" disabled={!canSubmit} className="w-full h-11 sm:h-12 text-sm sm:text-base touch-manipulation min-h-[44px]">
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Setting username...
              </>
            ) : (
              "Set Username"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
