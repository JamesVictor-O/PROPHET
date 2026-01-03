# Rate Limit Solution

## Problem

The RPC endpoint is rate-limiting multiple transactions sent in quick succession. Your account has nonce 50, which means there may be pending transactions.

## Solutions

### Option 1: Wait and Retry (Simplest)

Wait 2-3 minutes for pending transactions to clear, then retry:

```bash
./scripts/deploy-from-env.sh sepolia
```

### Option 2: Use Staged Deployment Script (Recommended)

I've created a staged deployment script that deploys contracts one at a time with 15-second delays:

```bash
./scripts/deploy-staged.sh sepolia
```

This script:

-   Deploys each contract individually
-   Waits 15 seconds between each deployment
-   Shows progress for each step
-   Saves all addresses at the end

### Option 3: Manual Staged Deployment

Deploy contracts manually one at a time:

```bash
# 1. Deploy ReputationSystem
forge script script/DeployBaseStaged.s.sol:DeployBaseStagedScript \
  --sig "deployReputationSystem()" \
  --rpc-url https://sepolia.base.org \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --chain-id 84532

# Wait 15 seconds
sleep 15

# 2. Deploy PredictionMarket (replace REPUTATION_SYSTEM_ADDRESS)
forge script script/DeployBaseStaged.s.sol:DeployBaseStagedScript \
  --sig "deployPredictionMarket(address)" REPUTATION_SYSTEM_ADDRESS \
  --rpc-url https://sepolia.base.org \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --chain-id 84532

# Continue with other contracts...
```

### Option 4: Check and Clear Pending Transactions

Check if there are pending transactions blocking deployment:

```bash
# Check your account's pending transactions on Basescan
# https://sepolia.basescan.org/address/0x2e5d8B56F9B4770a88794a47C32c177542d2f6ea

# If transactions are stuck, you may need to wait for them to clear
# or increase gas price to speed them up
```

## Recommended Approach

**Use the staged deployment script** (`deploy-staged.sh`) - it's the most reliable way to avoid rate limits:

```bash
cd PROPHET/contract
./scripts/deploy-staged.sh sepolia
```

This will take about 2-3 minutes total (15 seconds between each step), but it's much more reliable than trying to send all transactions at once.

## After Successful Deployment

Once deployment succeeds, update:

1. **Frontend**: `frontend/src/lib/contracts.ts`
2. **Deployment addresses**: `DEPLOYMENT_ADDRESSES.md`

The staged script will output all addresses at the end.

