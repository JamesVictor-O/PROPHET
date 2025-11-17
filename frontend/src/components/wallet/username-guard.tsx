"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useUsername } from "@/hooks/contracts/useReputationSystem";
import { UsernameModal } from "./username-modal";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UsernameGuardProps {
  children: React.ReactNode;
}

/**
 * Guard component that ensures users have a username before accessing the app
 * Blocks navigation to dashboard if no username is set
 */
export function UsernameGuard({ children }: UsernameGuardProps) {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const pathname = usePathname();
  const [isSettingUsername, setIsSettingUsername] = useState(false);

  const {
    data: username,
    isLoading,
    refetch,
  } = useUsername(address || undefined);

  // Derive if we should show modal
  const shouldShowModal = useMemo(() => {
    if (!isConnected || !address || isLoading) {
      return false;
    }
    const hasNoUsername = !username || username.trim() === "";
    return hasNoUsername;
  }, [isConnected, address, username, isLoading]);

  // Block dashboard access if no username
  useEffect(() => {
    if (!isConnected || !address || isLoading) {
      return;
    }

    const hasNoUsername = !username || username.trim() === "";
    const isDashboardRoute = pathname?.startsWith("/dashboard");

    if (hasNoUsername && isDashboardRoute && pathname !== "/") {
      router.push("/");
    }
  }, [isConnected, address, username, isLoading, pathname, router]);

  const handleUsernameSet = () => {
    setIsSettingUsername(true);
    // Refetch username after a brief delay to allow transaction to be mined
    setTimeout(() => {
      refetch().then(() => {
        setIsSettingUsername(false);
        // Allow navigation to dashboard after username is set
        if (pathname === "/") {
          router.push("/dashboard");
        }
      });
    }, 1000);
  };


  const showLoadingOverlay =
    isConnected && isLoading && !username && !isSettingUsername;

  return (
    <>
      {children}

      {/* Loading overlay with blur and spinner */}
      {showLoadingOverlay && (
        <div
          className={cn(
            "fixed inset-0 z-[100] flex items-center justify-center",
            "bg-background/80 backdrop-blur-sm",
            "animate-in fade-in-0 duration-200"
          )}
        >
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Checking username status...
            </p>
          </div>
        </div>
      )}

      {/* Username modal */}
      {isConnected && (
        <UsernameModal open={shouldShowModal} onComplete={handleUsernameSet} />
      )}
    </>
  );
}
