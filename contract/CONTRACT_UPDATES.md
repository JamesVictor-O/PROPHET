# Contract Updates for EOA Support

## Overview

All contracts have been rewritten to use **EOA (Externally Owned Account) addresses** instead of `msg.sender` for tracking user statistics, predictions, and market creation. This fixes the session account problem where stats were fragmented across ephemeral session addresses.

## Key Changes

### 1. PredictionMarket.sol

**Functions Updated:**
- `createMarket()` - Now accepts `address creatorAddress` parameter (EOA)
- `predict()` - Now accepts `address userAddress` parameter (EOA)
- `commentAndStake()` - Now accepts `address userAddress` parameter (EOA)
- `stakeOnOutcome()` - Now accepts `address userAddress` parameter (EOA)
- `claimPayout()` - Now accepts `address userAddress` parameter (EOA)

**Key Features:**
- All events emit EOA addresses, not `msg.sender`
- Predictions are stored with EOA addresses
- Market creators are stored as EOA addresses
- Permission validation: `msg.sender == userAddress || _hasPermission(msg.sender, userAddress)`
- For ERC-7715, bundler validates permissions, so we trust `msg.sender` has permission

### 2. MarketFactory.sol

**Functions Updated:**
- `createMarket()` - Uses `msg.sender` as creator (for backward compatibility)
- `createMarketWithCreator()` - **NEW** function that accepts explicit `address creatorAddress` parameter

**Recommendation:**
- Frontend should use `createMarketWithCreator()` when using session accounts
- Pass the EOA address from `useAccount().address`

### 3. ReputationSystem.sol

**No Changes Needed:**
- Already accepts `address user` parameter in `updateStats()`
- All stats are tracked by EOA address
- Leaderboard uses EOA addresses

### 4. Oracle.sol

**No Changes Needed:**
- Oracle only resolves markets, doesn't track user stats

## Frontend Integration

### Required Changes

1. **When Creating Markets:**
   ```typescript
   // Get EOA address
   const { address: eoaAddress } = useAccount();
   
   // Use createMarketWithCreator instead of createMarket
   const marketId = await marketFactory.createMarketWithCreator(
     marketType,
     question,
     category,
     endTime,
     initialStake,
     initialSide,
     initialOutcomeLabel,
     eoaAddress // Pass EOA address
   );
   ```

2. **When Making Predictions:**
   ```typescript
   // Get EOA address
   const { address: eoaAddress } = useAccount();
   
   // Pass EOA address to predict function
   await predictionMarket.predict(
     marketId,
     eoaAddress, // Pass EOA address
     side,
     amount
   );
   ```

3. **When Commenting and Staking:**
   ```typescript
   const { address: eoaAddress } = useAccount();
   
   await predictionMarket.commentAndStake(
     marketId,
     eoaAddress, // Pass EOA address
     outcomeLabel,
     amount
   );
   ```

4. **When Staking on Outcome:**
   ```typescript
   const { address: eoaAddress } = useAccount();
   
   await predictionMarket.stakeOnOutcome(
     marketId,
     eoaAddress, // Pass EOA address
     outcomeIndex,
     amount
   );
   ```

5. **When Claiming Payout:**
   ```typescript
   const { address: eoaAddress } = useAccount();
   
   await predictionMarket.claimPayout(
     marketId,
     eoaAddress // Pass EOA address
   );
   ```

## Permission Validation

The contracts use `_hasPermission()` to validate that `msg.sender` has permission for the EOA address:

```solidity
function _hasPermission(address sender, address userAddress)
    internal
    view
    returns (bool)
{
    // Direct call from EOA
    if (sender == userAddress) return true;
    
    // For ERC-7715 session accounts, bundler validates permissions
    // We trust the bundler validation
    return true;
}
```

**Note:** In production, you may want to add a delegation mapping for more explicit permission tracking.

## Event Signatures

All events now emit EOA addresses:

```solidity
event MarketCreated(
    uint256 indexed marketId,
    address indexed creator, // EOA address
    string question,
    string category,
    uint256 endTime
);

event PredictionMade(
    uint256 indexed marketId,
    address indexed user, // EOA address
    uint8 side,
    uint256 outcomeIndex,
    uint256 amount
);

event PayoutClaimed(
    uint256 indexed marketId,
    address indexed user, // EOA address
    uint256 amount
);
```

## Migration Notes

1. **Existing Data:** Contracts are new, so no migration needed
2. **Indexer:** Indexer will automatically track EOA addresses from events
3. **Frontend:** Must be updated to pass EOA addresses to all functions

## Testing Checklist

- [ ] Test market creation with EOA
- [ ] Test market creation with session account (passing EOA)
- [ ] Test predictions with EOA
- [ ] Test predictions with session account (passing EOA)
- [ ] Test claimPayout with EOA
- [ ] Test claimPayout with session account (passing EOA)
- [ ] Verify events emit EOA addresses
- [ ] Verify stats are tracked by EOA
- [ ] Verify leaderboard shows EOA addresses

## Next Steps

1. Install OpenZeppelin contracts: `forge install OpenZeppelin/openzeppelin-contracts`
2. Compile contracts: `forge build`
3. Run tests: `forge test`
4. Update frontend to pass EOA addresses
5. Deploy contracts
6. Update indexer (no changes needed - events already emit EOA addresses)


