# Deployment Success Guide

## Current Status

✅ **Simulation Successful** - All contracts are ready to deploy
❌ **Broadcast Failed** - RPC rate limiting issue

## Deployed Contract Addresses (Simulated)

Based on the simulation, these are the addresses that will be deployed:

- **ReputationSystem**: `0x541b83Ee93f812eE4468A0A22fd2e79E47fb0EA2`
- **PredictionMarket**: `0x3f0dcd081FcbaB3D76c01380ef2799d4c4bE8b84`
- **Oracle**: `0x53E008a896620A4b7383110Ce3D88bdDeA79C819`
- **MarketFactory**: `0xd25247C61Fa36A22399C65D48dE146e03F76AE86`

**Note**: Actual on-chain addresses may differ slightly due to nonce differences.

## Solution: Switch to Base Official RPC

I've updated your `.env.local` to use Base's official public RPC endpoint which is more reliable for deployments:

```bash
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

## Retry Deployment

Now retry the deployment:

```bash
./scripts/deploy-from-env.sh sepolia
```

The official Base RPC should handle the multiple transactions better than the Ankr endpoint.

## Alternative: Manual Deployment with Delays

If you still hit rate limits, you can deploy contracts one at a time. The transactions are saved in:

```
broadcast/DeployBase.s.sol/84532/run-latest.json
```

You can manually send them using `cast send` with delays between each:

```bash
# Wait between each transaction
cast send <contract_address> <function_call> --rpc-url $BASE_SEPOLIA_RPC_URL --private-key $PRIVATE_KEY
sleep 5
```

## After Successful Deployment

Once deployment succeeds, update these files:

### 1. Frontend Configuration

Update `frontend/src/lib/contracts.ts`:

```typescript
baseSepolia: {
  factory: "0xd25247C61Fa36A22399C65D48dE146e03F76AE86",      // MarketFactory
  oracle: "0x53E008a896620A4b7383110Ce3D88bdDeA79C819",       // Oracle
  reputationSystem: "0x541b83Ee93f812eE4468A0A22fd2e79E47fb0EA2", // ReputationSystem
  predictionMarket: "0x3f0dcd081FcbaB3D76c01380ef2799d4c4bE8b84", // PredictionMarket
  cUSD: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",         // USDC
  chainId: 84532,
  explorer: "https://sepolia.basescan.org",
},
```

### 2. Update DEPLOYMENT_ADDRESSES.md

Add the new Base Sepolia addresses to the deployment addresses file.

### 3. Verify Contracts

Contracts should auto-verify if `BASE_ETHERSCAN_API_KEY` is set. Otherwise verify manually on Basescan.

## Testing After Deployment

1. **Test Market Creation**:
   ```bash
   # Via frontend or CLI
   ```

2. **Test Predictions**:
   ```bash
   # Make a prediction on a market
   ```

3. **Test Delegation**:
   ```bash
   # Grant delegation to session account
   ```

## Troubleshooting

- **Still getting rate limits?** Wait 2-3 minutes between retries
- **Transactions failing?** Check you have enough ETH for gas
- **Verification failing?** Check your Basescan API key is correct


