"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useAccount, useWalletClient } from "wagmi";
import { type Address } from "viem";
import {
  Implementation,
  toMetaMaskSmartAccount,
  type MetaMaskSmartAccount,
} from "@metamask/smart-accounts-kit";
import {
  getPublicClient,
  SMART_ACCOUNT_DEPLOY_SALT,
} from "@/lib/smart-accounts-config";
interface SmartAccountContextType {
  smartAccount: MetaMaskSmartAccount | null;
  smartAccountAddress: Address | null;
  isInitializing: boolean;
  error: Error | null;
  initializeSmartAccount: () => Promise<void>;
  clearSmartAccount: () => void;
}

const SmartAccountContext = createContext<SmartAccountContextType | undefined>(
  undefined
);

interface SmartAccountProviderProps {
  children: React.ReactNode;
}
// -------------------------

export function SmartAccountProvider({ children }: SmartAccountProviderProps) {
  const { address: eoaAddress, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [smartAccount, setSmartAccount] = useState<MetaMaskSmartAccount | null>(
    null
  );
  const [smartAccountAddress, setSmartAccountAddress] =
    useState<Address | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isInitializingRef = useRef(false);
  const lastEoaAddressRef = useRef<string | undefined>(undefined);
  const lastChainIdRef = useRef<number | undefined>(undefined);
  const smartAccountRef = useRef<MetaMaskSmartAccount | null>(null);
  const smartAccountAddressRef = useRef<Address | null>(null);
  useEffect(() => {
    smartAccountRef.current = smartAccount;
    smartAccountAddressRef.current = smartAccountAddress;
  }, [smartAccount, smartAccountAddress]);

  const initializeSmartAccount = useCallback(async () => {
    // Prevent concurrent initializations
    if (isInitializingRef.current) {
      console.log("Initialization already in progress, skipping...");
      return;
    }

    if (!eoaAddress) {
      setError(
        new Error("No wallet address found. Please connect your wallet.")
      );
      return;
    }

    if (!walletClient || !walletClient.account) {
      setError(
        new Error("Wallet client not available. Wallet connection error.")
      );
      return;
    }
    if (
      smartAccountRef.current &&
      smartAccountAddressRef.current &&
      lastEoaAddressRef.current === eoaAddress &&
      lastChainIdRef.current === chainId
    ) {
      console.log("Smart account already initialized for this EOA and chain");
      return;
    }

    // Get the public client for the current chain
    if (!chainId) {
      setError(new Error("No chain ID found. Please connect your wallet."));
      return;
    }

    setIsInitializing(true);
    setError(null);
    isInitializingRef.current = true;

    try {
      console.log(
        "Starting smart account initialization with Hybrid implementation...",
        { chainId }
      );

      // Get public client for the current chain
      const publicClientForChain = getPublicClient(chainId);

      // 1. Create the Smart Account using the Hybrid (Standard AA) Implementation
      // Type assertion needed because different chains have different transaction types
      // The client works at runtime despite the type incompatibility
      const account = await toMetaMaskSmartAccount({
        // @ts-expect-error - Different chains have incompatible transaction types, but runtime works
        client: publicClientForChain,
        // *** CRITICAL FIX: Use the standard ERC-4337 Hybrid Implementation ***
        implementation: Implementation.Hybrid,
        // The EOA is the signer and owner of the new Smart Account contract
        signer: { walletClient },

        deployParams: [eoaAddress, [], [], []],

        // A salt is required to ensure the address is deterministic
        deploySalt: SMART_ACCOUNT_DEPLOY_SALT,
      });

      const accountAddress = account.address;

      setSmartAccount(account);
      setSmartAccountAddress(accountAddress);
      lastEoaAddressRef.current = eoaAddress;
      lastChainIdRef.current = chainId;
      console.log(
        "✅ Hybrid Smart Account initialized. Derived Address:",
        accountAddress
      );
      console.log(
        "The contract will be deployed upon the first successful UserOp (Ping Test)."
      );
    } catch (err) {
      console.error("Error initializing Hybrid smart account:", err);
      setError(
        err instanceof Error
          ? err
          : new Error("Failed to initialize smart account")
      );
      setSmartAccount(null);
      setSmartAccountAddress(null);
      lastEoaAddressRef.current = undefined;
      lastChainIdRef.current = undefined;
    } finally {
      setIsInitializing(false);
      isInitializingRef.current = false;
    }
  }, [eoaAddress, walletClient, chainId]);

  const clearSmartAccount = useCallback(() => {
    setSmartAccount(null);
    setSmartAccountAddress(null);
    setError(null);
    lastEoaAddressRef.current = undefined;
    lastChainIdRef.current = undefined;
  }, []);

  useEffect(() => {
    // Debug logging
    console.log("🔍 SmartAccountProvider state:", {
      eoaAddress,
      hasWalletClient: !!walletClient,
      hasWalletAccount: !!walletClient?.account,
      chainId,
      hasSmartAccount: !!smartAccountRef.current,
    });

    // Only initialize if we have all required data and haven't already initialized
    if (eoaAddress && walletClient && walletClient.account) {
      // Skip if already initialized for this combination (using refs to avoid re-renders)
      if (
        !smartAccountRef.current ||
        lastEoaAddressRef.current !== eoaAddress ||
        lastChainIdRef.current !== chainId
      ) {
        console.log("🚀 Initializing smart account for EOA:", eoaAddress);
        initializeSmartAccount();
      }
    } else {
      if (!eoaAddress) console.log("⚠️ No EOA address - wallet not connected");
      if (!walletClient)
        console.log(
          "⚠️ No wallet client yet - this may take a moment with MetaMask Flask"
        );
      if (walletClient && !walletClient.account)
        console.log("⚠️ Wallet client has no account");
      // Don't clear if we're just waiting for wallet client
      if (!eoaAddress) {
        clearSmartAccount();
      }
    }
  }, [
    eoaAddress,
    walletClient,
    chainId,
    initializeSmartAccount,
    clearSmartAccount,
  ]);

  const value: SmartAccountContextType = useMemo(
    () => ({
      smartAccount,
      smartAccountAddress,
      isInitializing,
      error,
      initializeSmartAccount,
      clearSmartAccount,
    }),
    [
      smartAccount,
      smartAccountAddress,
      isInitializing,
      error,
      initializeSmartAccount,
      clearSmartAccount,
    ]
  );

  return (
    <SmartAccountContext.Provider value={value}>
      {children}
    </SmartAccountContext.Provider>
  );
}

export function useSmartAccount() {
  const context = useContext(SmartAccountContext);
  if (context === undefined) {
    throw new Error(
      "useSmartAccount must be used within a SmartAccountProvider"
    );
  }
  return context;
}
