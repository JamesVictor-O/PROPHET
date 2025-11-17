# Deployment Guide

## Quick Deploy to Celo Sepolia

### Step 1: Set up environment

```bash
cd contract
source .env.local
```

### Step 2: Deploy contracts

```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $CELO_SEPOLIA_RPC \
  --broadcast \
  --private-key $PRIVATE_KEY \
  --verify \
  --etherscan-api-key $CELO_ETHERSCAN_API_KEY
```

### Alternative: Using environment variables inline

```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://rpc.ankr.com/celo_sepolia \
  --broadcast \
  --private-key $PRIVATE_KEY \
  --verify \
  --etherscan-api-key $CELO_ETHERSCAN_API_KEY
```

**Note:** Foundry doesn't support `--env-file` flag. You must `source .env.local` first to load variables.

## Important Notes

-   **Use `--rpc-url`** for deployment (NOT `--fork-url`)
-   `--fork-url` is only for testing with fork mode
-   Make sure `.env.local` has all required variables:
    -   `PRIVATE_KEY` - Your deployer private key
    -   `CELO_SEPOLIA_RPC` - RPC endpoint URL
    -   `CELO_ETHERSCAN_API_KEY` - For contract verification

## After Deployment

1. Save the deployed addresses from the console output
2. Update `frontend/src/lib/contracts.ts` with new addresses
3. Update `contract/DEPLOYED_ADDRESSES.md` with deployment info
