"use client";

import { createContext, useState, useContext, useCallback } from "react";
import {
  generatePrivateKey,
  privateKeyToAccount,
  type PrivateKeyAccount,
} from "viem/accounts";
import { usePublicClient } from "wagmi";
import { useSmartAccount } from "@/contexts/smart-account-context";
import { type Address } from "viem";
import {
  Implementation,
  toMetaMaskSmartAccount,
  type MetaMaskSmartAccount,
} from "@metamask/smart-accounts-kit";

/**
 * Session Account Context
 *
 * ARCHITECTURE: Delegated Smart Account Pattern
 * - User has a primary Smart Account (owned by EOA) - managed by SmartAccountProvider
 * - Session key owns its OWN Smart Account (session smart account) - managed here
 * - User smart account grants ERC-7715 delegation to the session smart account
 * - Session smart account executes transactions using sendUserOperationWithDelegation
 *
 * This avoids AA24 errors because:
 * - The session smart account is signed by its owner (the session key)
 * - The user's smart account validates the delegation via ERC-7715
 * - No address matching or deploySalt reuse is attempted
 */
interface SessionAccountContextType {
  sessionSmartAccount: MetaMaskSmartAccount | null; // Smart account owned by session key
  sessionKey: PrivateKeyAccount | null; // The session key keypair (owner of sessionSmartAccount)
  sessionKeyAddress: Address | null; // EOA address of the session key
  sessionSmartAccountAddress: Address | null; // Smart account address owned by session key
  createSessionAccount: () => Promise<void>;
  clearSessionAccount: () => void;
  isLoading: boolean;
  error: string | null;
}

export const SessionAccountContext = createContext<SessionAccountContextType>({
  sessionSmartAccount: null,
  sessionKey: null,
  sessionKeyAddress: null,
  sessionSmartAccountAddress: null,
  createSessionAccount: async () => {},
  clearSessionAccount: () => {},
  isLoading: false,
  error: null,
});

export const SessionAccountProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [sessionSmartAccount, setSessionSmartAccount] =
    useState<MetaMaskSmartAccount | null>(null);
  const [sessionKey, setSessionKey] = useState<PrivateKeyAccount | null>(null);
  const [sessionKeyAddress, setSessionKeyAddress] = useState<Address | null>(
    null
  );
  const [sessionSmartAccountAddress, setSessionSmartAccountAddress] =
    useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const publicClient = usePublicClient();
  const { smartAccount: userSmartAccount, smartAccountAddress } =
    useSmartAccount();

  /**
   * Creates a brand-new Smart Account owned by the session key.
   *
   * CRITICAL: This is a SEPARATE smart account from the user's main account.
   * - Uses a random/unique deploySalt (NOT the user's salt)
   * - Owned by the session key (NOT the user's EOA)
   * - Will be authorized via ERC-7715 delegation from the user's smart account
   *
   * This avoids AA24 errors because:
   * - signer == owner of the executing smart account (session key signs its own account)
   * - ERC-7715 delegation handles authorization between accounts
   */
  const createSessionAccount = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!publicClient) {
        throw new Error(
          "Public client not found. Please connect your wallet first."
        );
      }

      if (!userSmartAccount || !smartAccountAddress) {
        throw new Error(
          "User smart account not initialized. Please initialize your smart account first."
        );
      }

      // Step 1: Generate a session key (private key)
      const sessionPrivateKey = generatePrivateKey();
      const sessionKeyAccount = privateKeyToAccount(sessionPrivateKey);

      console.log("🔑 Creating session key and session smart account...", {
        sessionKeyAddress: sessionKeyAccount.address,
        userSmartAccountAddress: smartAccountAddress,
        note: "Session key will own its own smart account",
      });

      // Step 2: Create a NEW Smart Account owned by the session key
      // CRITICAL: Use sessionKeyAccount.address as the owner (NOT user's EOA)
      // CRITICAL: Use a random/unique deploySalt (NOT the user's SMART_ACCOUNT_DEPLOY_SALT)
      // This ensures we get a DIFFERENT smart account address
      // Generate a random salt by using the session key's private key as a seed
      const randomSalt = `0x${sessionPrivateKey.slice(2, 66)}` as `0x${string}`;
      const sessionAccountInstance = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [
          sessionKeyAccount.address, // Session key is the owner
          [], // keyIds
          [], // xValues
          [], // yValues
        ] as [
          owner: `0x${string}`,
          keyIds: string[],
          xValues: bigint[],
          yValues: bigint[]
        ],
        deploySalt: randomSalt, // Random salt ensures a unique address different from user's account
        signer: { account: sessionKeyAccount }, // Session key signs its own account
      });

      const derivedSessionAccountAddress = sessionAccountInstance.address;

      // Verify this is a DIFFERENT address from the user's smart account
      if (
        derivedSessionAccountAddress.toLowerCase() ===
        smartAccountAddress.toLowerCase()
      ) {
        throw new Error(
          "Session account address matches user account! This should never happen. " +
            "The session account must be a separate smart account."
        );
      }

      console.log("✅ Session smart account created successfully:", {
        sessionKeyAddress: sessionKeyAccount.address,
        sessionSmartAccountAddress: derivedSessionAccountAddress,
        userSmartAccountAddress: smartAccountAddress,
        note: "Session account is separate from user account and owned by session key",
      });

      setSessionSmartAccount(sessionAccountInstance);
      setSessionKey(sessionKeyAccount);
      setSessionKeyAddress(sessionKeyAccount.address);
      setSessionSmartAccountAddress(derivedSessionAccountAddress);
    } catch (err) {
      console.error("Error creating session account:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create session account"
      );
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, userSmartAccount, smartAccountAddress]);

  const clearSessionAccount = useCallback(() => {
    setSessionSmartAccount(null);
    setSessionKey(null);
    setSessionKeyAddress(null);
    setSessionSmartAccountAddress(null);
    setError(null);
  }, []);

  return (
    <SessionAccountContext.Provider
      value={{
        sessionSmartAccount,
        sessionKey,
        sessionKeyAddress,
        sessionSmartAccountAddress,
        createSessionAccount,
        clearSessionAccount,
        isLoading,
        error,
      }}
    >
      {children}
    </SessionAccountContext.Provider>
  );
};

export const useSessionAccount = () => {
  return useContext(SessionAccountContext);
};
