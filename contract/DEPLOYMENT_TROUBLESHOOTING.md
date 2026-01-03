# Deployment Troubleshooting

## Issue: RPC Rate Limiting

**Error**: `in-flight transaction limit reached for delegated accounts`

This happens when the RPC endpoint (Ankr in this case) rate-limits too many transactions sent in quick succession.

## Solutions

### Option 1: Wait and Retry (Easiest)

The transactions are already saved in the broadcast file. You can retry:

```bash
# Wait 30-60 seconds, then retry
./scripts/deploy-from-env.sh sepolia
```

Foundry will detect the saved transactions and retry them.

### Option 2: Use a Different RPC Endpoint

Update `.env.local` with a different Base Sepolia RPC:

```bash
# Option A: Public Base Sepolia RPC (no API key needed)
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Option B: Alchemy (requires API key)
BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Option C: Infura (requires API key)
BASE_SEPOLIA_RPC_URL=https://base-sepolia.infura.io/v3/YOUR_API_KEY
```

### Option 3: Deploy Contracts Individually

If rate limiting persists, deploy contracts one at a time with delays:

```bash
# 1. Deploy ReputationSystem
forge script script/DeployBase.s.sol:DeployBaseScript \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --chain-id 84532 \
  --sig "deployReputationSystem()" \
  -vvvv

# Wait 10 seconds
sleep 10

# 2. Deploy PredictionMarket (update script to accept ReputationSystem address)
# ... continue with other contracts
```

### Option 4: Use --slow Flag

Foundry has a `--slow` flag that adds delays between transactions:

```bash
forge script script/DeployBase.s.sol:DeployBaseScript \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --chain-id 84532 \
  --slow \
  -vvvv
```

### Option 5: Manual Deployment via Remix/Hardhat

If all else fails, deploy contracts manually using Remix or Hardhat with manual delays between transactions.

## Current Deployment Status

Based on the simulation, your contracts are ready to deploy:

- ✅ **ReputationSystem**: `0xaf061Cb2549E525d6CBbdc9A19b16AD144C042B1`
- ✅ **PredictionMarket**: `0x541b83Ee93f812eE4468A0A22fd2e79E47fb0EA2`
- ✅ **Oracle**: `0x3f0dcd081FcbaB3D76c01380ef2799d4c4bE8b84`
- ✅ **MarketFactory**: `0x77defEf21848cF1d1f2Ab37710Ec4586dCa225Aa`

**Note**: These are simulated addresses. Actual addresses will be different when deployed on-chain.

## Recommended Next Steps

1. **Wait 1-2 minutes** for rate limit to reset
2. **Retry the deployment**:
   ```bash
   ./scripts/deploy-from-env.sh sepolia
   ```

3. **If still failing**, switch to a different RPC endpoint:
   ```bash
   # Edit .env.local
   BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
   ```

4. **Once deployed**, update frontend configuration with the actual addresses

## Alternative: Use Base's Official RPC

Base Sepolia's official public RPC (no rate limits for reasonable usage):

```bash
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

This is slower but more reliable for deployments.


