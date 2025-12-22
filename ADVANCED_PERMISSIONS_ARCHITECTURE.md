# Advanced Permissions Implementation Architecture

## Overview

This document explains the complete flow of the ERC-7715 (Execution Permissions) + ERC-4337 (Account Abstraction) implementation that enables one-tap betting without repeated MetaMask popups.

**Key Technologies:**

- **ERC-7715**: Execution permissions standard for delegating transaction execution
- **ERC-4337**: Account abstraction standard for gasless/sponsored transactions
- **MetaMask Smart Accounts Kit**: Provides the infrastructure for both standards

---

## Architecture Overview

### High-Level Flow

```
User EOA (MetaMask)
    ↓
    │ 1. Grant ERC-7715 Permission (once)
    ↓
Session Smart Account (ERC-4337)
    ↓
    │ 2. Execute Transactions (many times, no popups)
    ↓
Bundler + Paymaster (Pimlico)
    ↓
Blockchain
```

### Key Components

1. **User EOA**: The user's MetaMask wallet (Externally Owned Account)
2. **Gator Smart Account**: Automatically created by MetaMask when requesting ERC-7715 permissions. This is the account that delegates authority to the session account.
3. **Session Account**: Can be either an EOA or a smart account. In our implementation, we use a MetaMask Smart Account owned by a session key.
4. **ERC-7715 Permission**: Delegation permission granted from Gator Smart Account (created automatically) to session account
5. **Bundler**: Pimlico bundler service for submitting UserOperations
6. **Paymaster**: Pimlico paymaster for gas sponsorship

**Important**: When a user requests ERC-7715 permissions, MetaMask automatically creates a Gator Smart Account for the user. This Gator account is the delegator, not a manually created smart account.

---

## File Structure & Responsibilities

### 1. Session Account Provider

**File**: `PROPHET/frontend/src/providers/SessionAccountProvider.tsx`

**Purpose**: Creates and manages the session smart account.

**Key Responsibilities:**

- Generates a session key (private key)
- Creates a **separate** MetaMask Smart Account owned by the session key
- Stores session account state in React context
- Provides `useSessionAccount()` hook for accessing session account

**Critical Architecture Decision:**

- The session account is a MetaMask Smart Account owned by a session key
- The user's EOA is automatically upgraded to a Gator Smart Account when requesting permissions (handled by MetaMask)
- The Gator Smart Account (created by MetaMask) delegates to the session account
- Session account can be EOA or smart account - we use smart account for consistency

**Key Exports:**

```typescript
interface SessionAccountContextType {
  sessionSmartAccount: MetaMaskSmartAccount | null;
  sessionKey: PrivateKeyAccount | null;
  sessionKeyAddress: Address | null;
  sessionSmartAccountAddress: Address | null;
  createSessionAccount: () => Promise<void>;
  clearSessionAccount: () => void;
}
```

**Flow:**

1. User clicks "Setup One-Tap Betting"
2. `createSessionAccount()` is called
3. Generates session private key
4. Creates MetaMask Smart Account with session key as owner
5. Stores in context and state

---

### 2. Permission Provider

**File**: `PROPHET/frontend/src/providers/PermissionProvider.tsx`

**Purpose**: Manages ERC-7715 permission state and persistence.

**Key Responsibilities:**

- Stores granted ERC-7715 permissions
- Persists permissions to localStorage
- Validates permission expiry
- Provides `usePermissions()` hook

**Key Exports:**

```typescript
interface PermissionContextType {
  permission: StoredPermission | null;
  savePermission: (permission: Permission, expiry?: number) => void;
  removePermission: () => void;
  isPermissionValid: () => boolean;
}
```

**Permission Structure:**

- `context`: The ERC-7715 permission context (contains delegation info)
- `signerMeta`: Metadata including `delegationManager`
- `storedExpiry`: Expiration timestamp

**Flow:**

1. Permission is granted via MetaMask
2. `savePermission()` stores it in state and localStorage
3. `isPermissionValid()` checks expiry before each transaction
4. `removePermission()` clears permission when revoked

---

### 3. Permissions Manager Component

**File**: `PROPHET/frontend/src/components/wallet/permissions-manager.tsx`

**Purpose**: UI component for granting and managing ERC-7715 permissions.

**Key Responsibilities:**

- Displays permission status
- Handles permission granting flow
- Shows expiry countdown
- Provides revoke functionality

**Grant Permission Flow:**

1. Check if session account exists (create if needed)
2. Extend wallet client with `erc7715ProviderActions()`
3. Call `requestExecutionPermissions()` with:
   - `chainId`: Current chain
   - `expiry`: Duration in seconds
   - `signer.address`: **Session account address** (the account that will execute transactions)
   - `permission`: ERC-20 token periodic transfer permission
4. MetaMask automatically creates a Gator Smart Account for the user (if not already created)
5. Permission is granted from Gator Smart Account to session account
6. Save permission via `savePermission()` - includes `signerMeta.delegationManager` with Gator account info

**Critical Point:**

- Permission is granted **TO** the session account address
- MetaMask automatically creates a Gator Smart Account for the user when requesting permissions
- The Gator Smart Account is the delegator (found in `permission.signerMeta.delegationManager`)
- User's EOA signs the permission request, but delegation originates from Gator account

---

### 4. Session Transaction Hook

**File**: `PROPHET/frontend/src/hooks/useSessionTransaction.ts`

**Purpose**: Executes transactions using ERC-7715 delegation.

**Key Responsibilities:**

- Encodes contract calls
- Executes transactions via `sendUserOperationWithDelegation`
- Handles transaction state (loading, errors)
- Validates permission before execution

**Key Exports:**

```typescript
interface UseSessionTransactionReturn {
  canUseSessionTransaction: boolean;
  executeSessionTransaction: (calls: TransactionCall[]) => Promise<Result>;
  encodeContractCall: (params) => TransactionCall;
  isExecuting: boolean;
}
```

**Execution Flow:**

1. Validate session account and permission exist
2. Get `delegationManager` from `permission.signerMeta.delegationManager` (contains Gator account info)
3. Get gas prices from Pimlico
4. Encode contract calls to transaction format
5. Call `bundlerClient().sendUserOperationWithDelegation()` with:
   - `account`: Session account
   - `calls`: Array of transaction calls, each with:
     - `to`, `value`, `data`: Standard call parameters only
   - `permissionsContext`: From `permission.context` (at TOP level)
   - `delegationManager`: From `permission.signerMeta.delegationManager` (at TOP level)
   - `maxFeePerGas`, `maxPriorityFeePerGas`: From Pimlico gas prices
6. Wait for UserOperation receipt
7. Return transaction hash

**Critical Architecture:**

- Uses `sendUserOperationWithDelegation` from `erc7710BundlerActions()`
- `permissionsContext` and `delegationManager` go at **TOP level**, not inside calls
- `delegationManager` comes from permission response (`permission.signerMeta.delegationManager`), not constructed manually
- `publicClient` is NOT a parameter for `sendUserOperationWithDelegation`
- Session account executes the transaction
- Gator Smart Account (from delegationManager) validates ERC-7715 permission
- No wallet popups after initial permission approval

---

### 5. Bundler Client

**File**: `PROPHET/frontend/src/services/bundlerClient.ts`

**Purpose**: Configures the bundler client for ERC-4337 UserOperations.

**Key Responsibilities:**

- Creates viem bundler client
- Extends with `erc7710BundlerActions()` for delegation support
- Configures paymaster integration (Pimlico)
- Formats UserOperations for Pimlico API

**Key Features:**

- `getPaymasterData()`: Gets paymaster sponsorship data
- `getPaymasterStubData()`: Gets stub data for gas estimation
- `estimateFeesPerGas()`: Estimates gas prices
- Extends with `erc7710BundlerActions()` to add `sendUserOperationWithDelegation()`

**Paymaster Integration:**

- Uses Pimlico's `pm_sponsorUserOperation` RPC method
- Formats UserOperation with proper hex encoding
- Handles EntryPoint v0.7 format
- Includes sponsorship policy ID

**Critical Extension:**

```typescript
.extend(erc7710BundlerActions())
```

This adds the `sendUserOperationWithDelegation()` method that handles ERC-7715 delegation wrapping.

---

### 6. Pimlico Client

**File**: `PROPHET/frontend/src/services/pimlicoClient.ts`

**Purpose**: Provides gas price estimation via Pimlico API.

**Key Responsibilities:**

- Calls Pimlico's `pimlico_getUserOperationGasPrice` RPC method
- Returns gas prices (slow, standard, fast)
- Used for setting `maxFeePerGas` and `maxPriorityFeePerGas`

**Usage:**

```typescript
const { fast: fee } = await pimlicoClient(chainId).getUserOperationGasPrice();
// fee contains: { maxFeePerGas, maxPriorityFeePerGas }
```

---

## Complete Flow Diagram

### Phase 1: Initial Setup (One-Time)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User Clicks "Setup One-Tap Betting"                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. SessionAccountProvider.createSessionAccount()             │
│    - Generates session private key                           │
│    - Creates MetaMask Smart Account owned by session key    │
│    - Stores in context                                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. PermissionsManager.handleGrantPermission()                │
│    - Extends walletClient with erc7715ProviderActions()     │
│    - Calls requestExecutionPermissions()                     │
│    - MetaMask popup appears (ONLY ONCE)                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Permission Granted                                        │
│    - Permission contains:                                   │
│      * context: ERC-7715 permission context                 │
│      * signerMeta.delegationManager: delegation info        │
│    - Saved to PermissionProvider                            │
│    - Persisted to localStorage                              │
└─────────────────────────────────────────────────────────────┘
```

### Phase 2: Transaction Execution (Many Times, No Popups)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User Initiates Transaction (e.g., place bet)             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. useSessionTransaction.executeSessionTransaction()         │
│    - Validates session account and permission exist          │
│    - Encodes contract calls                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. bundlerClient().sendUserOperationWithDelegation()        │
│    - Uses session smart account as sender                    │
│    - Wraps signature with ERC-7715 delegation context      │
│    - Includes permissionsContext and delegationManager       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Bundler Client Processing                                │
│    - Estimates gas (via bundler)                            │
│    - Gets paymaster sponsorship (via Pimlico)              │
│    - Signs UserOperation with delegation context            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. UserOperation Submitted                                  │
│    - Bundler submits to EntryPoint                         │
│    - EntryPoint validates delegation via DelegationManager │
│    - Paymaster sponsors gas                                 │
│    - Transaction executes                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Transaction Confirmed                                    │
│    - Receipt returned                                       │
│    - No wallet popups!                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Concepts

### 1. Separation of Concerns

**ERC-7715 (Permissions):**

- **Who signs**: User's EOA (MetaMask wallet)
- **What**: Permission grant request
- **When**: Once, during setup
- **Purpose**: Authorize session smart account to act on behalf of user

**ERC-4337 (Execution):**

- **Who signs**: Session smart account (via session key)
- **What**: UserOperation for transaction execution
- **When**: Every transaction (but no popups)
- **Purpose**: Execute transactions with gas sponsorship

### 2. Delegation Architecture

```
User EOA (0xUser...)
    │
    │ Requests ERC-7715 Permission
    │ (signed by EOA)
    │
    ▼
MetaMask Creates Gator Smart Account (0xGator...)
    │
    │ Grants Permission via DelegationManager
    │
    ▼
DelegationManager Contract
    │
    │ Validates Permission
    │
    ▼
Session Account (0xSession...)
    │
    │ Executes Transactions
    │ (signed by session key)
    │
    ▼
Blockchain
```

### 3. Account Architecture

**Gator Smart Account (Created by MetaMask):**

- Automatically created when user requests ERC-7715 permissions
- Owned by user's EOA (via MetaMask Smart Account system)
- Acts as the delegator in ERC-7715 permissions
- Found in `permission.signerMeta.delegationManager.delegator`

**Session Account (Created by App):**

- Can be EOA or smart account (we use MetaMask Smart Account)
- Owned by session key (generated by app)
- Executes transactions using ERC-7715 delegation
- Found in `permission.signerMeta.delegationManager.delegate`

### 4. Permission Structure

```typescript
{
  context: "0x...", // ERC-7715 permission context
  signerMeta: {
    delegationManager: {
      delegator: "0xGator...", // Gator Smart Account (created by MetaMask)
      delegate: "0xSession...", // Session account (created by app)
      verifyingContract: "0xDelegationManager..."
    }
  },
  storedExpiry: 1234567890 // Unix timestamp
}
```

---

## Integration Points

### Provider Hierarchy

```typescript
<SmartAccountProvider>
  {" "}
  // User's main smart account
  <SessionAccountProvider>
    {" "}
    // Session smart account
    <PermissionProvider>
      {" "}
      // ERC-7715 permissions
      <App />
    </PermissionProvider>
  </SessionAccountProvider>
</SmartAccountProvider>
```

### Hook Usage Pattern

```typescript
// In a component
const { sessionSmartAccount } = useSessionAccount();
const { permission, isPermissionValid } = usePermissions();
const { executeSessionTransaction } = useSessionTransaction();

// Execute transaction
const result = await executeSessionTransaction([
  {
    to: contractAddress,
    data: encodedCall,
    value: 0n,
  },
]);
```

---

## Critical Implementation Details

### 1. Permission Granting

**MUST use session smart account address:**

```typescript
signer: {
  type: "account",
  data: {
    address: sessionSmartAccountAddress // ✅ Correct
    // NOT: sessionKeyAddress (EOA) ❌
  }
}
```

### 2. Transaction Execution

**MUST use sendUserOperationWithDelegation:**

```typescript
// Get gas prices
const { fast: fee } = await pimlicoClient(chainId).getUserOperationGasPrice();

// Get delegationManager from permission (contains Gator account info)
const { signerMeta } = permission;
const delegationManager = signerMeta?.delegationManager;

if (!delegationManager) {
  throw new Error("Missing delegation manager");
}

// CRITICAL: permissionsContext and delegationManager go at TOP level, not inside calls
bundlerClient().sendUserOperationWithDelegation({
  account: sessionAccount, // ✅ Session account
  calls: [
    {
      to: contractAddress,
      value: 0n,
      data: callData,
      // ✅ NO permissionsContext or delegationManager here
    },
  ],
  permissionsContext: permission.context, // ✅ At TOP level
  delegationManager, // ✅ At TOP level (from permission response)
  ...fee, // ✅ Gas prices from Pimlico
});
```

### 3. Delegation Manager

The `delegationManager` structure (from permission response):

- `delegator`: The Gator Smart Account (created automatically by MetaMask)
- `delegate`: The session account (created by your app)
- `verifyingContract`: The DelegationManager contract address

**DO NOT construct delegationManager manually** - use `permission.signerMeta.delegationManager` from the permission response.

- `verifyingContract`: DelegationManager contract address (set by MetaMask)

---

## Error Handling

### Common Issues

1. **"External signature requests cannot use internal accounts"**

   - **Cause**: Trying to use smart account to sign ERC-7715 permission
   - **Fix**: Always use EOA (walletClient) for permission requests

2. **"Paymaster stub error: 0xb5863604"**

   - **Cause**: Stub UserOperation doesn't have delegation context
   - **Fix**: Stub data is used only for estimation; real signature includes delegation

3. **"Permission expired"**

   - **Cause**: Permission expiry timestamp passed
   - **Fix**: User must grant new permission

4. **"Session account not initialized"**
   - **Cause**: Session smart account not created
   - **Fix**: Call `createSessionAccount()` first

---

## Environment Variables

Required environment variables:

```env
NEXT_PUBLIC_PIMLICO_API_KEY=your_pimlico_api_key
NEXT_PUBLIC_PIMLICO_SPONSORSHIP_POLICY_ID=your_policy_id
```

---

## Testing Checklist

- [ ] Session smart account is created successfully
- [ ] Permission is granted via MetaMask popup
- [ ] Permission is saved to localStorage
- [ ] Permission expiry is validated correctly
- [ ] Transaction executes without wallet popup
- [ ] Gas is sponsored by paymaster
- [ ] Transaction is confirmed on-chain
- [ ] Permission can be revoked
- [ ] Expired permissions are rejected

---

## Future Improvements

1. **Multi-chain Support**: Extend to support multiple chains
2. **Permission Types**: Support different permission types (batch, time-based, etc.)
3. **Permission Renewal**: Auto-renewal before expiry
4. **Session Key Rotation**: Periodic rotation of session keys
5. **Analytics**: Track permission usage and transaction success rates

---

## References

- [ERC-7715 Specification](https://eips.ethereum.org/EIPS/eip-7715)
- [ERC-4337 Specification](https://eips.ethereum.org/EIPS/eip-4337)
- [MetaMask Smart Accounts Kit](https://github.com/MetaMask/smart-accounts-kit)
- [Pimlico Documentation](https://docs.pimlico.io/)

---

## Summary

This implementation enables one-tap betting by:

1. **Creating a session smart account** owned by a generated session key
2. **Granting ERC-7715 permission** from user's EOA to session smart account (once)
3. **Executing transactions** via session smart account with ERC-7715 delegation (many times, no popups)
4. **Sponsoring gas** via Pimlico paymaster

The key insight is the **separation of concerns**:

- **ERC-7715**: Handles permission/authorization (signed by EOA)
- **ERC-4337**: Handles execution (signed by session smart account)
- **Two smart accounts**: Avoids conflicts and enables proper delegation

This architecture ensures no wallet popups after the initial permission grant, while maintaining security through time-limited, scoped permissions.
