# Deployment Checklist - Refactored Architecture

## ✅ Contract Architecture Changes

The contracts have been refactored to use a **single PredictionMarket contract** instead of deploying a new contract for each market.

### Key Changes:
- **MarketFactory**: Now a wrapper that delegates to a single `PredictionMarket` contract
- **PredictionMarket**: Stores all markets in mappings (no per-market deployment)
- **Deployment**: Only 4 contracts total (ReputationSystem, Oracle, PredictionMarket, MarketFactory)

## 📋 Deployment Script Verification

The deployment script (`script/Deploy.s.sol`) is ready and correct:

### Deployment Order:
1. ✅ **ReputationSystem** - Deployed first (no dependencies)
2. ✅ **PredictionMarket** - Deployed with temporary oracle address
3. ✅ **Oracle** - Deployed with PredictionMarket address
4. ✅ **PredictionMarket.setOracle()** - Updates oracle address
5. ✅ **MarketFactory** - Deployed with all contract addresses
6. ✅ **Role Grants** - Oracle roles and updater roles set up

### Network Support:
- ✅ Celo Mainnet (chainId: 42220)
- ✅ Celo Sepolia (chainId: 44787 or 11142220)
- ✅ Local/Test networks

### Fixed Issues:
- ✅ `getMarketAddress()` now accepts `marketId` parameter for interface compatibility
- ✅ Chain ID check includes both 44787 and 11142220 for Celo Sepolia

## 🚀 Deployment Steps

1. **Set up environment:**
   ```bash
   cd contract
   source .env.local  # or copy from env.local.example
   ```

2. **Deploy to Celo Sepolia:**
   ```bash
   forge script script/Deploy.s.sol:DeployScript \
     --rpc-url $CELO_SEPOLIA_RPC_URL \
     --broadcast \
     --verify \
     --etherscan-api-key $CELOSCAN_API_KEY
   ```

3. **Update frontend addresses:**
   - Update `frontend/src/lib/contracts.ts` with new deployed addresses
   - The `PredictionMarket` address will be the same for all markets now

## ⚠️ Frontend Updates Needed

After redeployment, the frontend hooks should work, but verify:

1. **Market Address**: All markets now use the same contract address
   - `useMarketAddress(marketId)` will return the same address for all markets
   - Frontend should use this address to call `getMarketInfo(marketId)`

2. **Market Details**: Use `PredictionMarket.getMarketInfo(marketId)` instead of reading from separate contracts

3. **No Changes Needed**: The hooks should work as-is since `getMarketAddress()` still accepts marketId

## 📝 Post-Deployment

1. Verify all contracts deployed successfully
2. Check contract verification on Celoscan
3. Test market creation
4. Test making predictions
5. Update frontend contract addresses
6. Test full flow end-to-end

