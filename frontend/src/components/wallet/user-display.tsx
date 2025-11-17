"use client";

import { Address } from "viem";
import { formatAddress } from "@/lib/wallet-config";

interface UserDisplayProps {
  address: Address | undefined;
  fallback?: string;
  className?: string;
}

/**
 * Component to display formatted wallet address
 * Used throughout the app to show user addresses
 */
export function UserDisplay({
  address,
  fallback,
  className,
}: UserDisplayProps) {
  return (
    <span className={className}>
      {fallback || (address ? formatAddress(address) : "Unknown")}
    </span>
  );
}
