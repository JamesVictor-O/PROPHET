/**
 * Hook for ERC20 token interactions
 * Handles approvals and allowance checks
 */

import { Address } from "viem";
import { useAccount } from "wagmi";
import { useContractRead, useContractWrite } from "./useContract";
import { getContractAddress } from "@/lib/contracts";

// Standard ERC20 ABI (minimal - just what we need)
const ERC20_ABI = [
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

/**
 * Check the current allowance for cUSD
 * @param spender The address that will be spending tokens (MarketFactory)
 * @param amount The amount to check allowance for
 */
export function useCUSDAllowance(spender: Address | undefined, amount: bigint | undefined) {
  const { address: owner } = useAccount();
  const cusdAddress = getContractAddress("cUSD") as Address;

  const { data: allowance, isLoading, refetch } = useContractRead<bigint>({
    address: cusdAddress,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: owner && spender ? [owner, spender] : undefined,
    enabled: !!owner && !!spender && !!cusdAddress,
  });

  const needsApproval = allowance !== undefined && amount !== undefined 
    ? allowance < amount 
    : undefined;

  return {
    allowance,
    needsApproval,
    isLoading,
    refetch,
  };
}

/**
 * Hook to approve cUSD spending
 */
export function useApproveCUSD() {
  const cusdAddress = getContractAddress("cUSD") as Address;

  return useContractWrite({
    address: cusdAddress,
    abi: ERC20_ABI,
    functionName: "approve",
  });
}

