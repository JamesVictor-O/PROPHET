# ⚠️ CRITICAL: Third Redeployment Required

## Issue

The MarketFactory was deployed with `paymentToken = address(0)` **again**.

**Root Cause:**
- Celo Sepolia chain ID is `11142220` (EIP-155 format), not `44787`
- Deployment script was checking for `44787`, so it fell into the "local/test network" branch
- This set `cUSD = address(0)`

**Impact:**
- ❌ Factory cannot interact with cUSD token
- ❌ System is non-functional

## Solution

The deployment script has been updated to check for **both** chain ID formats:
- `44787` (legacy)
- `11142220` (EIP-155) ✅ **This is the actual chain ID**

## Redeploy Now

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

## Verify After Deployment

```bash
# Check the paymentToken address
cast call <FACTORY_ADDRESS> "paymentToken()" --rpc-url https://rpc.ankr.com/celo_sepolia

# Should return: 0x000000000000000000000000EF4d55D6dE8e8d73232827Cd1e9b2F2dBb45bC80
# (Not address(0))
```

## What Changed

✅ Updated `Deploy.s.sol` to check for chain ID `11142220`  
✅ Added logging to show detected chain ID  
✅ Frontend contracts.ts ready for new addresses

## After Successful Deployment

1. Verify `paymentToken` is correct (not address(0))
2. Update frontend with new contract addresses
3. Test market creation
4. Test predictions with real cUSD


