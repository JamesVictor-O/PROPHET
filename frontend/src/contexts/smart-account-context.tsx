// // src/components/SmartAccountProvider.tsx
// "use client";

// import React, {
//   createContext,
//   useContext,
//   useEffect,
//   useState,
//   useCallback,
// } from "react";
// import { useAccount, useWalletClient } from "wagmi";
// import { type Address } from "viem";
// import {
//   Implementation,
//   toMetaMaskSmartAccount,
//   type MetaMaskSmartAccount,
// } from "@metamask/smart-accounts-kit";
// import { publicClient } from "@/lib/smart-accounts-config";

// interface SmartAccountContextType {
//   smartAccount: MetaMaskSmartAccount | null;
//   smartAccountAddress: Address | null;
//   isInitializing: boolean;
//   error: Error | null;
//   initializeSmartAccount: () => Promise<void>;
//   clearSmartAccount: () => void;
// }

// const SmartAccountContext = createContext<SmartAccountContextType | undefined>(
//   undefined
// );

// interface SmartAccountProviderProps {
//   children: React.ReactNode;
// }

// export function SmartAccountProvider({ children }: SmartAccountProviderProps) {
//   const { address: eoaAddress } = useAccount();
//   const { data: walletClient } = useWalletClient();
//   const [smartAccount, setSmartAccount] = useState<MetaMaskSmartAccount | null>(
//     null
//   );
//   const [smartAccountAddress, setSmartAccountAddress] =
//     useState<Address | null>(null);
//   const [isInitializing, setIsInitializing] = useState(false);
//   const [error, setError] = useState<Error | null>(null);

//   const initializeSmartAccount = useCallback(async () => {
//     if (!eoaAddress) {
//       const errorMsg =
//         "No wallet address found. Please connect your wallet first.";
//       console.warn("Cannot initialize smart account:", errorMsg);
//       setError(new Error(errorMsg));
//       return;
//     }

//     if (!walletClient || !walletClient.account) {
//       const errorMsg =
//         "Wallet client not available. Please ensure your wallet is connected.";
//       console.warn("Cannot initialize smart account:", errorMsg);
//       setError(new Error(errorMsg));
//       return;
//     }

//     // Don't reinitialize if already done
//     if (smartAccount && smartAccount.address === eoaAddress) {
//       console.log("Smart account already initialized for this EOA");
//       return;
//     }

//     setIsInitializing(true);
//     setError(null);

//     try {
//       console.log("Starting smart account initialization...", {
//         eoaAddress,
//         chainId: publicClient.chain.id,
//         chainName: publicClient.chain.name,
//         walletClientAccount: walletClient.account.address,
//       });

//       // Verify wallet client account matches EOA address
//       if (
//         walletClient.account.address.toLowerCase() !== eoaAddress.toLowerCase()
//       ) {
//         throw new Error(
//           "Wallet client account address does not match connected EOA address."
//         );
//       }

//       // ✅ CORRECT: Use Stateless7702 for Base Sepolia
//       // Base Sepolia supports EIP-7702, so we can upgrade the EOA directly
//       // This is much simpler than Hybrid and doesn't require deployParams
//       const account = await toMetaMaskSmartAccount({
//         client: publicClient,
//         implementation: Implementation.Stateless7702,
//         // The address is your EOA address
//         address: walletClient.account.address,
//         // The signer is just the walletClient
//         signer: { walletClient },
//       });

//       const accountAddress = account.address;

//       setSmartAccount(account);
//       setSmartAccountAddress(accountAddress);
//       console.log(
//         "✅ Stateless7702 Smart Account created for EOA:",
//         accountAddress
//       );
//       console.log(
//         "Your EOA will be upgraded via EIP-7702 delegation on the first UserOp"
//       );
//     } catch (err) {
//       console.error("Error initializing smart account:", err);
//       setError(
//         err instanceof Error
//           ? err
//           : new Error("Failed to initialize smart account")
//       );
//       setSmartAccount(null);
//       setSmartAccountAddress(null);
//     } finally {
//       setIsInitializing(false);
//     }
//   }, [eoaAddress, walletClient, smartAccount]);

//   const clearSmartAccount = useCallback(() => {
//     setSmartAccount(null);
//     setSmartAccountAddress(null);
//     setError(null);
//   }, []);

//   // Initialize smart account when EOA connects and wallet client is available
//   useEffect(() => {
//     if (eoaAddress && walletClient && walletClient.account) {
//       initializeSmartAccount();
//     } else {
//       clearSmartAccount();
//     }
//   }, [eoaAddress, walletClient, initializeSmartAccount, clearSmartAccount]);

//   const value: SmartAccountContextType = {
//     smartAccount,
//     smartAccountAddress,
//     isInitializing,
//     error,
//     initializeSmartAccount,
//     clearSmartAccount,
//   };

//   return (
//     <SmartAccountContext.Provider value={value}>
//       {children}
//     </SmartAccountContext.Provider>
//   );
// }

// export function useSmartAccount() {
//   const context = useContext(SmartAccountContext);
//   if (context === undefined) {
//     throw new Error(
//       "useSmartAccount must be used within a SmartAccountProvider"
//     );
//   }
//   return context;
// }

// src/components/SmartAccountProvider.tsx
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
import { useAccount, useWalletClient, useSwitchChain } from "wagmi";
import { type Address } from "viem";
import {
  Implementation,
  toMetaMaskSmartAccount,
  type MetaMaskSmartAccount,
} from "@metamask/smart-accounts-kit";
import { publicClient, smartAccountChain } from "@/lib/smart-accounts-config";
import { addBaseSepoliaToMetaMask } from "@/lib/wallet-config";

// --- Context Definitions ---
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
  // Get the Wagmi WalletClient needed for signing
  const { data: walletClient } = useWalletClient();
  const { switchChain } = useSwitchChain();
  const [smartAccount, setSmartAccount] = useState<MetaMaskSmartAccount | null>(
    null
  );
  const [smartAccountAddress, setSmartAccountAddress] =
    useState<Address | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Use refs to track initialization state without causing re-renders
  const isInitializingRef = useRef(false);
  const lastEoaAddressRef = useRef<string | undefined>(undefined);
  const lastChainIdRef = useRef<number | undefined>(undefined);
  const smartAccountRef = useRef<MetaMaskSmartAccount | null>(null);
  const smartAccountAddressRef = useRef<Address | null>(null);

  // Keep refs in sync with state
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

    // Skip if already initialized for this EOA and chain
    if (
      smartAccountRef.current &&
      smartAccountAddressRef.current &&
      lastEoaAddressRef.current === eoaAddress &&
      lastChainIdRef.current === chainId &&
      chainId === smartAccountChain.id
    ) {
      console.log("Smart account already initialized for this EOA and chain");
      return;
    }

    // Check if we're on the correct chain (Base Sepolia)
    if (chainId !== smartAccountChain.id) {
      console.log(
        `Current chain: ${chainId}, required: ${smartAccountChain.id}`
      );
      setIsInitializing(true);
      setError(null);
      isInitializingRef.current = true;

      try {
        // Try using wagmi's switchChain first
        if (switchChain) {
          await switchChain({ chainId: smartAccountChain.id });
        } else {
          // Fallback to direct MetaMask call
          const switched = await addBaseSepoliaToMetaMask();
          if (!switched) {
            throw new Error(
              "Failed to switch to Base Sepolia. Please switch manually in your wallet."
            );
          }
        }

        // Wait a bit for the chain switch to complete
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (err) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : "Failed to switch to Base Sepolia";
        setError(
          new Error(
            `Chain switch required: ${errorMsg}. Please switch to Base Sepolia (Chain ID: ${smartAccountChain.id}) in your wallet.`
          )
        );
        setIsInitializing(false);
        isInitializingRef.current = false;
        return;
      }
    }

    setIsInitializing(true);
    setError(null);
    isInitializingRef.current = true;

    try {
      console.log(
        "Starting smart account initialization with Hybrid implementation...",
        { chainId, requiredChainId: smartAccountChain.id }
      );

      // 1. Create the Smart Account using the Hybrid (Standard AA) Implementation
      const account = await toMetaMaskSmartAccount({
        client: publicClient,
        // *** CRITICAL FIX: Use the standard ERC-4337 Hybrid Implementation ***
        implementation: Implementation.Hybrid,
        // The EOA is the signer and owner of the new Smart Account contract
        signer: { walletClient },

        // Deployment parameters for the standard contract wallet.
        // [owner, signers, delegates, initialOwners]
        deployParams: [eoaAddress, [], [], []],

        // A salt is required to ensure the address is deterministic
        deploySalt:
          "0x0000000000000000000000000000000000000000000000000000000000000001",
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
  }, [eoaAddress, walletClient, chainId, switchChain]);

  const clearSmartAccount = useCallback(() => {
    setSmartAccount(null);
    setSmartAccountAddress(null);
    setError(null);
    lastEoaAddressRef.current = undefined;
    lastChainIdRef.current = undefined;
  }, []);

  useEffect(() => {
    // Only initialize if we have all required data and haven't already initialized
    if (eoaAddress && walletClient && walletClient.account) {
      // Skip if already initialized for this combination (using refs to avoid re-renders)
      if (
        !smartAccountRef.current ||
        lastEoaAddressRef.current !== eoaAddress ||
        lastChainIdRef.current !== chainId
      ) {
        initializeSmartAccount();
      }
    } else {
      clearSmartAccount();
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
