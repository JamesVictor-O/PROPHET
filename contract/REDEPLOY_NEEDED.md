# ⚠️ CRITICAL: Redeployment Required

## Issue

The MarketFactory was deployed with an **incorrect cUSD address** (`address(0)` / zero address).

**Impact:**
- ❌ Factory cannot interact with cUSD token
- ❌ Users cannot make predictions
- ❌ Markets cannot collect stakes
- ❌ System is non-functional

**Root Cause:**
- The deployment script had the wrong cUSD address for Celo Sepolia
- `paymentToken` is `immutable` in MarketFactory, so it cannot be changed

## Solution: Redeploy Contracts

Since `paymentToken` is immutable, we must redeploy the MarketFactory (and potentially Oracle) with the correct cUSD address.

### Correct cUSD Address
- **Celo Sepolia:** `0xEF4d55D6dE8e8d73232827Cd1e9b2F2dBb45bC80`

### Redeployment Steps

1. **Update deployment script** (✅ Already done)
   - Updated `script/Deploy.s.sol` with correct cUSD address

2. **Redeploy contracts:**
   ```bash
   cd contract
   source .env.local
   
   forge script script/Deploy.s.sol:DeployScript \
       --rpc-url $CELO_SEPOLIA_RPC \
       --broadcast \
       --verify \
       --etherscan-api-key $CELO_ETHERSCAN_API_KEY \
       --private-key $PRIVATE_KEY
   ```

3. **Update frontend** (✅ Already done)
   - Updated `frontend/src/lib/contracts.ts` with correct cUSD address

4. **Save new addresses**
   - Update `DEPLOYED_ADDRESSES.md` with new contract addresses
   - Note: ReputationSystem address will remain the same (no dependency on cUSD)

## What Gets Redeployed

- ✅ **ReputationSystem** - Can keep existing (no cUSD dependency)
- ❌ **MarketFactory** - Must redeploy (wrong cUSD address)
- ❌ **Oracle** - Must redeploy (depends on Factory)

## Old Deployed Addresses (DO NOT USE)

- MarketFactory: `0x8eA418CF5512899cFBDf95c517A32731D20570f5` ❌
- Oracle: `0x014612007f9194D48E0cDb6f0015D5940D929392` ❌

## After Redeployment

1. Update `DEPLOYED_ADDRESSES.md` with new addresses
2. Update frontend with new Factory and Oracle addresses
3. Test market creation
4. Test predictions
5. Verify cUSD transfers work correctly

## Prevention

- ✅ Updated deployment script with correct cUSD address
- ✅ Added comment with network name for clarity
- ⚠️ Always verify token addresses before deployment


