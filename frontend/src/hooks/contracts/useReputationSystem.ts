/**
 * Hook for interacting with ReputationSystem contract
 * Handles user stats, usernames, and leaderboard
 */

import { Address } from "viem";
import { useContractRead, useContractWrite } from "./useContract";
import { ReputationSystemABI } from "@/lib/abis";
import { getContractAddress } from "@/lib/contracts";

export function useReputationSystem() {
  const reputationAddress = getContractAddress("reputationSystem") as Address;

  return {
    address: reputationAddress,
    abi: ReputationSystemABI,
  };
}

/**
 * Get username for an address
 */
export function useUsername(address: Address | undefined) {
  const { address: contractAddress, abi } = useReputationSystem();
  return useContractRead<string>({
    address: contractAddress,
    abi,
    functionName: "getUsername",
    args: address ? [address] : undefined,
    enabled: !!address,
  });
}

/**
 * Check if username is available
 */
export function useIsUsernameAvailable(username: string | undefined) {
  const { address, abi } = useReputationSystem();
  return useContractRead<boolean>({
    address,
    abi,
    functionName: "isUsernameAvailable",
    args: username ? [username] : undefined,
    enabled: !!username && username.length >= 3,
  });
}

/**
 * Hook for setting username
 */
export function useSetUsername() {
  const { address, abi } = useReputationSystem();
  return useContractWrite({
    address,
    abi,
    functionName: "setUsername",
  });
}

/**
 * Get user stats
 */
export function useUserStats(address: Address | undefined) {
  const { address: contractAddress, abi } = useReputationSystem();
  return useContractRead<{
    totalPredictions: bigint;
    correctPredictions: bigint;
    totalWinnings: bigint;
    currentStreak: bigint;
    bestStreak: bigint;
    reputationScore: bigint;
  }>({
    address: contractAddress,
    abi,
    functionName: "getUserStats",
    args: address ? [address] : undefined,
    enabled: !!address,
  });
}
