/**
 * Base hook for interacting with smart contracts
 * Provides a clean, reusable pattern for contract interactions
 */

import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { Address } from "viem";
import { useAccount } from "wagmi";

interface UseContractOptions {
  address: Address;
  abi: readonly unknown[];
  enabled?: boolean;
}

/**
 * Hook for reading from a contract
 */
export function useContractRead<T = unknown>(
  options: UseContractOptions & {
    functionName: string;
    args?: readonly unknown[];
  }
) {
  const { address, abi, functionName, args, enabled = true } = options;

  const result = useReadContract({
    address,
    abi,
    functionName,
    args,
    query: {
      enabled: enabled && !!address,
    },
  });

  return {
    data: result.data as T | undefined,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    refetch: result.refetch,
  };
}

/**
 * Hook for writing to a contract
 */
export function useContractWrite(
  options: UseContractOptions & {
    functionName: string;
  }
) {
  const { address, abi, functionName } = options;
  const { isConnected } = useAccount();

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const write = (args?: readonly unknown[]) => {
    if (!isConnected) {
      throw new Error("Wallet not connected");
    }
    writeContract({
      address,
      abi,
      functionName,
      args,
    });
  };

  return {
    write,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}
