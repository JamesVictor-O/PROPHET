import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatUnits, parseUnits } from "viem"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get token decimals based on chain ID
 * Base Sepolia/Mainnet: 6 decimals (USDC)
 * Celo Sepolia/Mainnet: 18 decimals (cUSD)
 */
export function getTokenDecimals(chainId?: number): number {
  // Base Sepolia (84532) or Base Mainnet (8453) use USDC (6 decimals)
  if (chainId === 84532 || chainId === 8453) {
    return 6;
  }
  // Celo networks use cUSD (18 decimals)
  return 18;
}

/**
 * Format token amount based on chain
 * Uses correct decimals: 6 for USDC (Base), 18 for cUSD (Celo)
 */
export function formatTokenAmount(
  amount: bigint | string | number,
  chainId?: number
): string {
  const decimals = getTokenDecimals(chainId);
  const bigIntAmount =
    typeof amount === "bigint"
      ? amount
      : typeof amount === "string"
        ? BigInt(amount)
        : BigInt(Math.floor(Number(amount)));
  return formatUnits(bigIntAmount, decimals);
}

/**
 * Parse token amount to BigInt based on chain
 * Uses correct decimals: 6 for USDC (Base), 18 for cUSD (Celo)
 */
export function parseTokenAmount(
  amount: string | number,
  chainId?: number
): bigint {
  const decimals = getTokenDecimals(chainId);
  return parseUnits(amount.toString(), decimals);
}
