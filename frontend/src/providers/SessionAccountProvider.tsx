"use client";

import {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
} from "react";
import {
  Implementation,
  MetaMaskSmartAccount,
  toMetaMaskSmartAccount,
} from "@metamask/smart-accounts-kit";
import {
  generatePrivateKey,
  privateKeyToAccount,
  type PrivateKeyAccount,
} from "viem/accounts";
import { usePublicClient } from "wagmi";
import { type Address } from "viem";

interface SessionAccountContextType {
  sessionSmartAccount: MetaMaskSmartAccount | null;
  sessionKey: PrivateKeyAccount | null;
  sessionKeyAddress: Address | null;
  sessionSmartAccountAddress: Address | null;
  createSessionAccount: () => Promise<void>;
  clearSessionAccount: () => void;
  isLoading: boolean;
  error: string | null;
}

const SESSION_KEY_STORAGE_KEY = "prophet_session_key";

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

  // Load session account from localStorage on mount
  useEffect(() => {
    const loadSessionAccount = async () => {
      try {
        const storedKey = localStorage.getItem(SESSION_KEY_STORAGE_KEY);
        if (storedKey && publicClient) {
          console.log("🔑 Loading existing session account from storage...");
          const account = privateKeyToAccount(storedKey as `0x${string}`);

          // Create smart account from stored private key
          const smartAccount = await toMetaMaskSmartAccount({
            client: publicClient,
            implementation: Implementation.Hybrid,
            deployParams: [account.address, [], [], []],
            deploySalt: "0x",
            signer: { account },
          });

          setSessionSmartAccount(smartAccount);
          setSessionKey(account);
          setSessionKeyAddress(account.address);
          setSessionSmartAccountAddress(smartAccount.address);
          console.log("✅ Session account loaded:", smartAccount.address);
        } else {
          console.log("ℹ️ No existing session account found");
        }
      } catch (err) {
        console.error("Error loading session account:", err);
        // If corrupt, clear it
        localStorage.removeItem(SESSION_KEY_STORAGE_KEY);
      }
    };

    if (publicClient) {
      loadSessionAccount();
    }
  }, [publicClient]);

  /**
   * Creates a session smart account.
   * This is a MetaMask Smart Account that will be used to execute transactions
   * with ERC-7715 permissions. The account is created from a generated private key.
   */
  const createSessionAccount = useCallback(async () => {
    if (!publicClient) {
      throw new Error("Public client not found");
    }

    try {
      setIsLoading(true);
      setError(null);

      // Check if we already have a session key
      const storedKey = localStorage.getItem(SESSION_KEY_STORAGE_KEY);
      let account: PrivateKeyAccount;

      if (storedKey) {
        console.log("🔑 Reusing existing session key from storage");
        account = privateKeyToAccount(storedKey as `0x${string}`);
      } else {
        // Generate new session key
        console.log("🔑 Generating new session key...");
        const sessionPrivateKey = generatePrivateKey();
        account = privateKeyToAccount(sessionPrivateKey);
        // Save to localStorage
        localStorage.setItem(SESSION_KEY_STORAGE_KEY, sessionPrivateKey);
      }

      // Create smart account from the private key
      console.log("🏗️ Creating session smart account...");
      const smartAccount = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [account.address, [], [], []],
        deploySalt: "0x",
        signer: { account },
      });

      setSessionSmartAccount(smartAccount);
      setSessionKey(account);
      setSessionKeyAddress(account.address);
      setSessionSmartAccountAddress(smartAccount.address);

      console.log("✅ Session smart account created:", {
        smartAccountAddress: smartAccount.address,
        signerAddress: account.address,
        note: "This account will be used for ERC-7715 permission execution",
      });
    } catch (err) {
      console.error("Error creating session account:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create session account"
      );
    } finally {
      setIsLoading(false);
    }
  }, [publicClient]);

  /**
   * Clear session account from state and localStorage
   */
  const clearSessionAccount = useCallback(() => {
    console.log("🗑️ Clearing session account");
    localStorage.removeItem(SESSION_KEY_STORAGE_KEY);
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
