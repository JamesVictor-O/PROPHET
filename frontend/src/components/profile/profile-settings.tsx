"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useSetUsername, useIsUsernameAvailable } from "@/hooks/contracts";
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Address } from "viem";

interface ProfileSettingsProps {
  user: {
    username: string;
    displayName: string;
    email: string;
    bio: string;
  };
  address: Address | undefined;
}

export function ProfileSettings({ user, address }: ProfileSettingsProps) {
  const [username, setUsername] = useState(
    user.username.replace("@", "") || ""
  );

  const {
    write,
    isLoading: isSettingUsername,
    isPending,
    isSuccess,
    error: writeError,
  } = useSetUsername();

  const { data: isAvailable, isLoading: isCheckingAvailability } =
    useIsUsernameAvailable(
      username.length >= 3 ? username : undefined
    );

  useEffect(() => {
    if (isSuccess) {
      toast.success("Username updated successfully!");
    }
  }, [isSuccess]);

  useEffect(() => {
    if (writeError) {
      let errorMessage = "Failed to set username";
      if (writeError.message) {
        if (writeError.message.includes("user rejected")) {
          errorMessage = "Transaction rejected";
        } else if (writeError.message.includes("Username already taken")) {
          errorMessage = "Username is already taken";
        } else {
          errorMessage = writeError.message;
        }
      }
      toast.error(errorMessage);
    }
  }, [writeError]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^a-zA-Z0-9._]/g, ""); // Only allow alphanumeric, dot, underscore
    setUsername(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }

    if (username === user.username.replace("@", "")) {
      toast.info("No changes to save");
      return;
    }

    if (!write) {
      toast.error("Connection error");
      return;
    }

    // Check availability first
    if (isAvailable === false) {
      toast.error("Username is already taken");
      return;
    }

    try {
      write([username]);
      toast.info("Confirm username update in your wallet");
    } catch (err) {
      console.error("Error setting username:", err);
      toast.error("Failed to set username");
    }
  };

  const isUsernameValid = username.length >= 3;
  const hasChanges = username !== user.username.replace("@", "");

  return (
    <div className="space-y-6">
      {/* Username Settings */}
      <Card className="bg-[#1E293B] border-dark-700">
        <CardHeader>
          <CardTitle>Username</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <Input
                  id="username"
                  name="username"
                  value={username}
                  onChange={handleUsernameChange}
                  disabled={isSettingUsername || isPending}
                  placeholder="your.username"
                  className="bg-[#0F172A] border-dark-700 pr-10 disabled:opacity-50"
                  minLength={3}
                  maxLength={20}
                />
                {username.length >= 3 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isCheckingAvailability ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    ) : isAvailable === true ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : isAvailable === false ? (
                      <XCircle className="w-4 h-4 text-red-400" />
                    ) : null}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400">
                Only letters, numbers, dots, and underscores allowed (3-20
                characters)
              </p>
              {username.length >= 3 && isAvailable === false && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Username is already taken
                </p>
              )}
              {username.length >= 3 && isAvailable === true && (
                <p className="text-xs text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Username is available
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={
                !isUsernameValid ||
                !hasChanges ||
                isSettingUsername ||
                isPending ||
                isCheckingAvailability ||
                isAvailable === false
              }
              className="bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50"
            >
              {isSettingUsername || isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting username...
                </>
              ) : (
                "Update Username"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-[#1E293B] border-dark-700">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-sm text-gray-400">
              <p className="font-medium text-white mb-1">
                About usernames on PROPHET
              </p>
              <p>
                Your username is stored on-chain and cannot be changed once set.
                Choose wisely! Your username will be visible on the leaderboard
                and in all your predictions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

