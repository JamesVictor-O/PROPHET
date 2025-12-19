/**
 * React hook for MetaMask Advanced Permissions
 */

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import {
  isMetamaskPermissionsSupported,
  getCurrentPermissions,
  requestTokenApprovalPermission,
  requestBatchTransactionPermission,
  hasValidTokenApprovalPermission,
  hasValidBatchTransactionPermission,
  revokeAllPermissions,
  type ProphetPermissions,
} from '@/lib/metamask-permissions';
import { getContractAddress } from '@/lib/contracts';
import { parseUnits } from 'viem';

export interface UseMetamaskPermissionsReturn {
  // State
  isSupported: boolean;
  permissions: ProphetPermissions | null;
  isLoading: boolean;

  // Token Approval Permission
  hasTokenApprovalPermission: (
    token: string,
    spender: string,
    amount: string
  ) => Promise<boolean>;
  requestTokenApproval: (
    token: string,
    spender: string,
    maxAmount: string,
    expiresInHours?: number
  ) => Promise<boolean>;

  // Batch Transaction Permission
  hasBatchTransactionPermission: (
    operations: string[],
    stakeAmount: string
  ) => Promise<boolean>;
  requestBatchTransactions: (
    operations: string[],
    maxStake: string,
    expiresInHours?: number
  ) => Promise<boolean>;

  // Utilities
  refreshPermissions: () => Promise<void>;
  revokePermissions: () => Promise<boolean>;
}

export function useMetamaskPermissions(): UseMetamaskPermissionsReturn {
  const { address } = useAccount();
  const [isSupported, setIsSupported] = useState(false);
  const [permissions, setPermissions] = useState<ProphetPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check support and load permissions
  useEffect(() => {
    const checkSupport = async () => {
      setIsSupported(isMetamaskPermissionsSupported());
      if (isMetamaskPermissionsSupported()) {
        const currentPermissions = await getCurrentPermissions();
        setPermissions(currentPermissions);
      }
      setIsLoading(false);
    };

    checkSupport();
  }, [address]);

  // Refresh permissions
  const refreshPermissions = useCallback(async () => {
    if (isMetamaskPermissionsSupported()) {
      const currentPermissions = await getCurrentPermissions();
      setPermissions(currentPermissions);
    }
  }, []);

  // Request token approval permission
  const requestTokenApproval = useCallback(
    async (
      token: string,
      spender: string,
      maxAmount: string,
      expiresInHours: number = 24
    ): Promise<boolean> => {
      const success = await requestTokenApprovalPermission(
        token,
        spender,
        maxAmount,
        expiresInHours
      );
      if (success) {
        await refreshPermissions();
      }
      return success;
    },
    [refreshPermissions]
  );

  // Request batch transaction permission
  const requestBatchTransactions = useCallback(
    async (
      operations: string[],
      maxStake: string,
      expiresInHours: number = 1
    ): Promise<boolean> => {
      const success = await requestBatchTransactionPermission(
        operations,
        maxStake,
        expiresInHours
      );
      if (success) {
        await refreshPermissions();
      }
      return success;
    },
    [refreshPermissions]
  );

  // Check token approval permission
  const hasTokenApprovalPermission = useCallback(
    async (token: string, spender: string, amount: string): Promise<boolean> => {
      if (!isSupported) {
        return false;
      }
      return hasValidTokenApprovalPermission(token, spender, amount);
    },
    [isSupported]
  );

  // Check batch transaction permission
  const hasBatchTransactionPermission = useCallback(
    async (operations: string[], stakeAmount: string): Promise<boolean> => {
      if (!isSupported) {
        return false;
      }
      return hasValidBatchTransactionPermission(operations, stakeAmount);
    },
    [isSupported]
  );

  // Revoke all permissions
  const revokePermissions = useCallback(async (): Promise<boolean> => {
    const success = await revokeAllPermissions();
    if (success) {
      await refreshPermissions();
    }
    return success;
  }, [refreshPermissions]);

  return {
    isSupported,
    permissions,
    isLoading,
    hasTokenApprovalPermission,
    requestTokenApproval,
    hasBatchTransactionPermission,
    requestBatchTransactions,
    refreshPermissions,
    revokePermissions,
  };
}

/**
 * Helper hook for checking if we can skip approval
 * Returns true if we have valid permission and can skip the approval step
 */
export function useCanSkipApproval(
  tokenAddress: string | undefined,
  spenderAddress: string | undefined,
  amount: bigint | undefined
): {
  canSkip: boolean;
  isLoading: boolean;
} {
  const { isSupported, hasTokenApprovalPermission, isLoading } =
    useMetamaskPermissions();
  const [canSkip, setCanSkip] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (!isSupported || !tokenAddress || !spenderAddress || !amount) {
        setCanSkip(false);
        return;
      }

      setIsChecking(true);
      try {
        const hasPermission = await hasTokenApprovalPermission(
          tokenAddress,
          spenderAddress,
          amount.toString()
        );
        setCanSkip(hasPermission);
      } catch (error) {
        console.error('Error checking permission:', error);
        setCanSkip(false);
      } finally {
        setIsChecking(false);
      }
    };

    check();
  }, [
    isSupported,
    tokenAddress,
    spenderAddress,
    amount,
    hasTokenApprovalPermission,
  ]);

  return {
    canSkip,
    isLoading: isLoading || isChecking,
  };
}

/**
 * Helper hook for checking if we can batch transactions
 */
export function useCanBatchTransactions(
  operations: string[],
  stakeAmount: bigint | undefined
): {
  canBatch: boolean;
  isLoading: boolean;
} {
  const { isSupported, hasBatchTransactionPermission, isLoading } =
    useMetamaskPermissions();
  const [canBatch, setCanBatch] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (!isSupported || !stakeAmount || operations.length === 0) {
        setCanBatch(false);
        return;
      }

      setIsChecking(true);
      try {
        const hasPermission = await hasBatchTransactionPermission(
          operations,
          stakeAmount.toString()
        );
        setCanBatch(hasPermission);
      } catch (error) {
        console.error('Error checking batch permission:', error);
        setCanBatch(false);
      } finally {
        setIsChecking(false);
      }
    };

    check();
  }, [isSupported, operations, stakeAmount, hasBatchTransactionPermission]);

  return {
    canBatch,
    isLoading: isLoading || isChecking,
  };
}


