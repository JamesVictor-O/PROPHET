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

export function useSetUsername() {
  const { address, abi } = useReputationSystem();
  return useContractWrite({
    address,
    abi,
    functionName: "setUsername",
  });
}

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

export function useTopUsers(limit: number = 10) {
  const { address, abi } = useReputationSystem();
  return useContractRead<Address[]>({
    address,
    abi,
    functionName: "getTopUsers",
    args: [BigInt(limit)],
    enabled: limit > 0 && limit <= 100,
  });
}
