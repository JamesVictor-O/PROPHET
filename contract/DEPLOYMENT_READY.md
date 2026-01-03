# Deployment Script Ready ✅

## Summary

The deployment script has been updated to match the new contract structure with:

-   ✅ EOA address support (userAddress, creatorAddress parameters)
-   ✅ Delegation system for session accounts
-   ✅ Proper contract initialization order
-   ✅ Role grants (UPDATER_ROLE for ReputationSystem)

## Deployment Script

**Location**: `script/DeployBase.s.sol`

### What It Does

1. **Deploys ReputationSystem** (with deployer as admin)
2. **Deploys PredictionMarket** (with payment token, reputation system, and deployer as owner)
3. **Deploys Oracle** (with deployer as admin and prediction market address)
4. **Sets Oracle in PredictionMarket** (links them together)
5. **Deploys MarketFactory** (with all contract addresses)
6. **Grants UPDATER_ROLE** to PredictionMarket (so it can update reputation stats)

### Supported Networks

-   **Base Sepolia** (Chain ID: 84532)
    -   Payment Token: `0x036CbD53842c5426634e7929541eC2318f3dCF7e` (USDC)
-   **Base Mainnet** (Chain ID: 8453)
    -   Payment Token: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (USDC)

## How to Deploy

### Option 1: Using deploy-from-env.sh (Recommended)

```bash
cd PROPHET/contract
./scripts/deploy-from-env.sh sepolia
```

This script:

-   Loads `PRIVATE_KEY` from `.env.local`
-   Automatically detects Base Sepolia
-   Optionally verifies contracts if `BASE_ETHERSCAN_API_KEY` is set

### Option 2: Using deploy-base.sh

```bash
cd PROPHET/contract
export PRIVATE_KEY=your_private_key
./scripts/deploy-base.sh --sepolia --verify
```

### Option 3: Direct Forge Command

```bash
cd PROPHET/contract
forge script script/DeployBase.s.sol:DeployBaseScript \
  --rpc-url https://sepolia.base.org \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --chain-id 84532 \
  --verify \
  --etherscan-api-key $BASE_ETHERSCAN_API_KEY \
  -vvvv
```

## After Deployment

### 1. Update Frontend Configuration

Update `frontend/src/lib/contracts.ts`:

```typescript
baseSepolia: {
  factory: "0x...",           // MarketFactory address
  oracle: "0x...",            // Oracle address
  reputationSystem: "0x...", // ReputationSystem address
  predictionMarket: "0x...", // PredictionMarket address
  cUSD: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // USDC on Base Sepolia
  chainId: 84532,
  explorer: "https://sepolia.basescan.org",
},
```

### 2. Update DEPLOYMENT_ADDRESSES.md

Add the new addresses to the deployment addresses file.

### 3. Verify Contracts

Contracts should auto-verify if you used `--verify` flag. Otherwise, verify manually:

```bash
forge verify-contract <ADDRESS> <CONTRACT_NAME> \
  --chain-id 84532 \
  --etherscan-api-key $BASE_ETHERSCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address)" <DEPLOYER>)
```

## Contract Dependencies

```
ReputationSystem (no dependencies)
    ↓
PredictionMarket (depends on: paymentToken, ReputationSystem)
    ↓
Oracle (depends on: PredictionMarket)
    ↓
MarketFactory (depends on: paymentToken, PredictionMarket, Oracle, ReputationSystem)
```

## Key Changes from Previous Version

1. **EOA Address Support**: All user-facing functions now accept `userAddress` or `creatorAddress` parameters
2. **Delegation System**: Both `MarketFactory` and `PredictionMarket` have delegation functions
3. **Permission Checks**: `_hasPermission()` validates either direct calls or explicit delegations
4. **Role Management**: `ReputationSystem` grants `UPDATER_ROLE` to `PredictionMarket` during deployment

## Testing the Deployment

After deployment, test with:

1. **Create a market** (via MarketFactory)
2. **Make a prediction** (via PredictionMarket)
3. **Grant delegation** (for session account testing)
4. **Check reputation stats** (via ReputationSystem)

## Troubleshooting

-   **"Insufficient funds"**: Make sure deployer has ETH for gas
-   **"Contract verification failed"**: Check API key and try manual verification
-   **"Role grant failed"**: Ensure deployer is the admin of ReputationSystem
-   **"Oracle not set"**: Check that `setOracle()` was called after Oracle deployment

## Next Steps

1. ✅ Deploy contracts
2. ✅ Update frontend configuration
3. ✅ Test market creation
4. ✅ Test predictions
5. ✅ Test delegation system
6. ✅ Update frontend to use `createMarketWithCreator()` for session accounts

