

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
