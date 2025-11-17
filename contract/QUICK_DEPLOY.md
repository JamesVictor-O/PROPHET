# Quick Deployment Guide

## 🚀 Ready to Deploy!

Your contracts are compiled and ready. Here's the fastest path to deployment:

## Step 1: Setup Environment (2 minutes)

```bash
cd contract
cp env.local.example .env.local
```

Edit `.env.local`:
```bash
PRIVATE_KEY=your_deployment_account_private_key
CELO_SEPOLIA_RPC=https://rpc.ankr.com/celo_sepolia
CELO_ETHERSCAN_API_KEY=your_api_key_here  # Optional, for verification
```

## Step 2: Test Locally First (Recommended)

```bash
# Terminal 1: Start local node
anvil

# Terminal 2: Deploy
forge script script/DeployLocal.s.sol:DeployLocalScript \
    --rpc-url http://localhost:8545 \
    --broadcast \
    --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

## Step 3: Deploy to Celo Sepolia

```bash
# Load environment
source .env.local

# Deploy (replace with your actual private key or use --private-key flag)
forge script script/Deploy.s.sol:DeployScript \
    --rpc-url $CELO_SEPOLIA_RPC \
    --broadcast \
    --verify \
    --etherscan-api-key $CELO_ETHERSCAN_API_KEY \
    --private-key $PRIVATE_KEY
```

## What Gets Deployed

1. **ReputationSystem** - Tracks user stats and reputation
2. **MarketFactory** - Creates prediction markets
3. **Oracle** - Resolves markets

The script automatically:
- ✅ Deploys in correct order
- ✅ Sets up roles and permissions
- ✅ Links contracts together
- ✅ Prints deployment summary

## After Deployment

Save the contract addresses from the console output:

```bash
# Add to .env.local
FACTORY_ADDRESS=0x...
ORACLE_ADDRESS=0x...
REPUTATION_SYSTEM_ADDRESS=0x...
```

## Update Frontend

Create/update `frontend/src/lib/contracts.ts`:

```typescript
export const CONTRACTS = {
  celoSepolia: {
    factory: "0x...", // From deployment
    oracle: "0x...", // From deployment
    reputationSystem: "0x...", // From deployment
    cUSD: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
  },
};
```

## Verify Everything Works

1. Create a test market
2. Make a prediction
3. Resolve the market (as oracle)
4. Claim payout

## Need Help?

- Check `DEPLOYMENT.md` for detailed instructions
- Check `DEPLOYMENT_CHECKLIST.md` for full checklist
- Review `script/README.md` for script details

## ⚠️ Important Notes

- **Gas**: Ensure deployer has CELO (not just cUSD) for gas fees (~5.3M gas total)
- **Security**: Never commit `.env.local` with real keys
- **Testing**: Always test on Sepolia before mainnet
- **cUSD Address**: Verify the Sepolia cUSD address is correct

## Next Steps

1. ✅ Deploy to Sepolia
2. ✅ Test all functionality
3. ✅ Update frontend with addresses
4. ✅ Test frontend integration
5. ✅ Plan mainnet deployment

Good luck! 🎉


