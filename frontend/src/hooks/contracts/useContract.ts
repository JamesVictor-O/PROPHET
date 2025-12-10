

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

 
  
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: !!hash, // Only enable when we have a hash
      retry: (failureCount, error) => {
        const errorMessage = error?.message || "";
        const errorCode =
          (error as { code?: number; details?: { code?: number } })?.code ||
          (error as { details?: { code?: number } })?.details?.code;

        const isRpcError =
          errorMessage.includes("400") ||
          errorMessage.includes("Bad Request") ||
          errorMessage.includes("block is out of range") ||
          errorMessage.includes("HttpRequestError") ||
          errorMessage.includes("CallExecutionError") ||
          errorCode === -32019 ||
          errorCode === 400;

        if (isRpcError) {
          return failureCount < 20;
        }
        // Retry up to 3 times for real errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => {
        return Math.min(2000 * (attemptIndex + 1), 10000);
      },
    },
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

  const isRpcReceiptError =
    receiptError &&
    (receiptError.message?.includes("400") ||
      receiptError.message?.includes("Bad Request") ||
      receiptError.message?.includes("block is out of range") ||
      (receiptError as { code?: number })?.code === -32019);

  const combinedError =
    error || (receiptError && !isRpcReceiptError ? receiptError : null);

  return {
    write,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error: combinedError,
  };
}
