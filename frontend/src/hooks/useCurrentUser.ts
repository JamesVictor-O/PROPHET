/**
 * Hook to get current user's username
 * Convenience hook for getting the connected user's username
 */

import { useAccount } from "wagmi";
import { useUsername } from "./contracts";

export function useCurrentUser() {
  const { address, isConnected } = useAccount();
  const { data: username, isLoading } = useUsername(address || undefined);

  return {
    address,
    username: username && username.trim() !== "" ? username : null,
    hasUsername: !!(username && username.trim() !== ""),
    isLoading,
    isConnected,
  };
}
