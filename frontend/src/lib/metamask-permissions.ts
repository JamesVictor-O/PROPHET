/**
 * MetaMask Advanced Permissions
 * EIP-2255 implementation for token approvals and batch transactions
 */

export interface TokenApprovalPermission {
  token: string;
  spender: string;
  maxAmount: string;
  expiresAt: number;
}

export interface BatchTransactionPermission {
  operations: string[]; 
  maxStake: string; 
  expiresAt: number; 
}

export interface ProphetPermissions {
  "prophet:tokenApproval"?: TokenApprovalPermission;
  "prophet:batchTransactions"?: BatchTransactionPermission;
}

// Permission namespace
const PERMISSION_NAMESPACE = "prophet";

/**
 * Check if MetaMask is installed and available
 * We use localStorage as fallback, so we just need MetaMask to be present
 */
export function isMetamaskPermissionsSupported(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const ethereum = getEthereumProvider();
  if (!ethereum) {
    return false;
  }
  return typeof ethereum.request === "function";
}
export async function getCurrentPermissions(): Promise<ProphetPermissions | null> {
  const result: ProphetPermissions = {};

  // Get permissions from localStorage only (no MetaMask popups!)
  try {
    // Get all token approval permissions
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`${PERMISSION_NAMESPACE}:tokenApproval:`)) {
        const permission = JSON.parse(
          localStorage.getItem(key) || "{}"
        ) as TokenApprovalPermission;
        if (permission.expiresAt && Date.now() < permission.expiresAt) {
          result["prophet:tokenApproval"] = permission;
        } else {
          // Remove expired permission
          localStorage.removeItem(key);
        }
      }
    }

    // Get batch transaction permissions
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`${PERMISSION_NAMESPACE}:batchTransactions:`)) {
        const permission = JSON.parse(
          localStorage.getItem(key) || "{}"
        ) as BatchTransactionPermission;
        if (permission.expiresAt && Date.now() < permission.expiresAt) {
          result["prophet:batchTransactions"] = permission;
        } else {
          // Remove expired permission
          localStorage.removeItem(key);
        }
      }
    }
  } catch (error) {
    console.error("Error reading localStorage permissions:", error);
  }

  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Request token approval permission
 * Stores in localStorage - no MetaMask popup needed since user is already connected
 */
export async function requestTokenApprovalPermission(
  token: string,
  spender: string,
  maxAmount: string,
  expiresInHours: number = 24
): Promise<boolean> {
  try {
    const expiresAt = Date.now() + expiresInHours * 60 * 60 * 1000;

    const permission: TokenApprovalPermission = {
      token,
      spender,
      maxAmount,
      expiresAt,
    };

    // Store permission in localStorage (user is already connected via wagmi)
    const key = `${PERMISSION_NAMESPACE}:tokenApproval:${token}:${spender}`;
    localStorage.setItem(key, JSON.stringify(permission));
    console.log("✅ Token approval permission saved:", { token, spender, maxAmount, expiresAt });
    return true;
  } catch (error) {
    console.error("Error requesting token approval permission:", error);
    return false;
  }
}

/**
 * Request batch transaction permission
 * Stores in localStorage - no MetaMask popup needed since user is already connected
 */
export async function requestBatchTransactionPermission(
  operations: string[],
  maxStake: string,
  expiresInHours: number = 1
): Promise<boolean> {
  try {
    const expiresAt = Date.now() + expiresInHours * 60 * 60 * 1000;

    const permission: BatchTransactionPermission = {
      operations,
      maxStake,
      expiresAt,
    };

    // Store permission in localStorage (user is already connected via wagmi)
    const key = `${PERMISSION_NAMESPACE}:batchTransactions:${operations.join(",")}`;
    localStorage.setItem(key, JSON.stringify(permission));
    console.log("✅ Batch transaction permission saved:", { operations, maxStake, expiresAt });
    return true;
  } catch (error) {
    console.error("Error requesting batch transaction permission:", error);
    return false;
  }
}

/**
 * Check if token approval permission is valid
 */
export async function hasValidTokenApprovalPermission(
  token: string,
  spender: string,
  amount: string
): Promise<boolean> {
  // Check localStorage first (faster)
  const key = `${PERMISSION_NAMESPACE}:tokenApproval:${token}:${spender}`;
  const stored = localStorage.getItem(key);

  if (stored) {
    try {
      const permission = JSON.parse(stored) as TokenApprovalPermission;

      // Check if expired
      if (Date.now() > permission.expiresAt) {
        localStorage.removeItem(key);
        return false;
      }

      // Check if token and spender match
      if (permission.token.toLowerCase() !== token.toLowerCase()) {
        return false;
      }

      if (permission.spender.toLowerCase() !== spender.toLowerCase()) {
        return false;
      }

      // Check if amount is within limit
      const maxAmount = BigInt(permission.maxAmount);
      const requestedAmount = BigInt(amount);

      return requestedAmount <= maxAmount;
    } catch (error) {
      console.error("Error parsing stored permission:", error);
      localStorage.removeItem(key);
    }
  }

  // Fallback to getCurrentPermissions
  const permissions = await getCurrentPermissions();
  if (!permissions?.[`${PERMISSION_NAMESPACE}:tokenApproval`]) {
    return false;
  }

  const permission = permissions[
    `${PERMISSION_NAMESPACE}:tokenApproval`
  ] as TokenApprovalPermission;

  // Check if permission is expired
  if (Date.now() > permission.expiresAt) {
    return false;
  }

  // Check if token and spender match
  if (permission.token.toLowerCase() !== token.toLowerCase()) {
    return false;
  }

  if (permission.spender.toLowerCase() !== spender.toLowerCase()) {
    return false;
  }

  // Check if amount is within limit
  const maxAmount = BigInt(permission.maxAmount);
  const requestedAmount = BigInt(amount);

  return requestedAmount <= maxAmount;
}

/**
 * Check if batch transaction permission is valid
 */
export async function hasValidBatchTransactionPermission(
  operations: string[],
  stakeAmount: string
): Promise<boolean> {
  // Check localStorage first
  const key = `${PERMISSION_NAMESPACE}:batchTransactions:${operations.join(
    ","
  )}`;
  const stored = localStorage.getItem(key);

  if (stored) {
    try {
      const permission = JSON.parse(stored) as BatchTransactionPermission;

      // Check if expired
      if (Date.now() > permission.expiresAt) {
        localStorage.removeItem(key);
        return false;
      }

      // Check if all operations are allowed
      const hasAllOperations = operations.every((op) =>
        permission.operations.includes(op)
      );

      if (!hasAllOperations) {
        return false;
      }

      // Check if stake amount is within limit
      const maxStake = BigInt(permission.maxStake);
      const requestedStake = BigInt(stakeAmount);

      return requestedStake <= maxStake;
    } catch (error) {
      console.error("Error parsing stored permission:", error);
      localStorage.removeItem(key);
    }
  }

  // Fallback to getCurrentPermissions
  const permissions = await getCurrentPermissions();
  if (!permissions?.[`${PERMISSION_NAMESPACE}:batchTransactions`]) {
    return false;
  }

  const permission = permissions[
    `${PERMISSION_NAMESPACE}:batchTransactions`
  ] as BatchTransactionPermission;

  // Check if permission is expired
  if (Date.now() > permission.expiresAt) {
    return false;
  }

  // Check if all operations are allowed
  const hasAllOperations = operations.every((op) =>
    permission.operations.includes(op)
  );

  if (!hasAllOperations) {
    return false;
  }

  // Check if stake amount is within limit
  const maxStake = BigInt(permission.maxStake);
  const requestedStake = BigInt(stakeAmount);

  return requestedStake <= maxStake;
}

/**
 * Revoke all Prophet permissions
 */
export async function revokeAllPermissions(): Promise<boolean> {
  try {
    // Clear localStorage (no MetaMask popups!)
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`${PERMISSION_NAMESPACE}:`)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    return true;
  } catch (error) {
    console.error("Error revoking permissions:", error);
    return false;
  }
}

// MetaMask provider interface
interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  isMetaMask?: boolean;
}

// Helper to safely access window.ethereum
function getEthereumProvider(): EthereumProvider | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  return (window as { ethereum?: EthereumProvider }).ethereum;
}
