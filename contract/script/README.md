# Deployment Scripts

## Scripts Overview

### 1. Deploy.s.sol

Main deployment script for testnet and mainnet.

**Usage:**

```bash
forge script script/Deploy.s.sol:DeployScript \
    --rpc-url $CELO_SEPOLIA_RPC \
    --broadcast \
    --verify \
    --private-key $PRIVATE_KEY
```

**Features:**

-   Auto-detects network (Mainnet vs Sepolia)
-   Deploys contracts in correct order
-   Sets up roles and permissions
-   Supports custom oracle addresses

### 2. DeployLocal.s.sol

Deployment script for local testing with Anvil.

**Usage:**

```bash
# Terminal 1: Start Anvil
anvil

# Terminal 2: Deploy
forge script script/DeployLocal.s.sol:DeployLocalScript \
    --rpc-url http://localhost:8545 \
    --broadcast \
    --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

**Features:**

-   Deploys mock cUSD token
-   Mints tokens to deployer
-   Full local testing setup

### 3. PostDeploy.s.sol

Post-deployment configuration script.

**Usage:**

```bash
# Set environment variables first
export FACTORY_ADDRESS=0x...
export ORACLE_ADDRESS=0x...
export REPUTATION_SYSTEM_ADDRESS=0x...

forge script script/PostDeploy.s.sol:PostDeployScript \
    --rpc-url $CELO_SEPOLIA_RPC \
    --broadcast \
    --private-key $PRIVATE_KEY
```

**Use Cases:**

-   Grant additional oracle roles
-   Set creation fees
-   Create initial markets
-   Configure additional settings

### 4. DeployBase.s.sol

Deployment script for Base networks (Mainnet and Sepolia).

**Usage:**

```bash
# Deploy to Base Sepolia
forge script script/DeployBase.s.sol:DeployBaseScript \
    --rpc-url $BASE_SEPOLIA_RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast \
    --verify \
    --etherscan-api-key $BASE_ETHERSCAN_API_KEY \
    --chain-id 84532

# Deploy to Base Mainnet
forge script script/DeployBase.s.sol:DeployBaseScript \
    --rpc-url $BASE_MAINNET_RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast \
    --verify \
    --etherscan-api-key $BASE_ETHERSCAN_API_KEY \
    --chain-id 8453
```

**Or use the helper script:**

```bash
# Deploy to Base Sepolia
./scripts/deploy-base.sh --sepolia

# Deploy to Base Mainnet (with verification)
./scripts/deploy-base.sh --mainnet --verify
```

**Features:**

-   Auto-detects Base network (Mainnet vs Sepolia)
-   Uses USDC as the stablecoin token
-   Deploys contracts in correct order
-   Sets up roles and permissions
-   Supports custom oracle addresses

**For detailed Base deployment instructions, see:** `DEPLOY_BASE.md`

### 5. Verify.s.sol

Contract verification helper (reference only).

**Note:** Contract verification is typically done via `forge verify-contract` command.

## Quick Start

### 1. Setup Environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 2. Deploy to Testnet

```bash
forge script script/Deploy.s.sol:DeployScript \
    --rpc-url $CELO_SEPOLIA_RPC \
    --broadcast \
    --verify \
    --etherscan-api-key $CELO_ETHERSCAN_API_KEY \
    --private-key $PRIVATE_KEY
```

### 3. Save Addresses

After deployment, save the addresses to `.env`:

```bash
FACTORY_ADDRESS=0x...
ORACLE_ADDRESS=0x...
REPUTATION_SYSTEM_ADDRESS=0x...
```

### 4. Post-Deployment Setup

```bash
forge script script/PostDeploy.s.sol:PostDeployScript \
    --rpc-url $CELO_SEPOLIA_RPC \
    --broadcast \
    --private-key $PRIVATE_KEY
```

## Deployment Flow

```
1. Deploy ReputationSystem
   ↓
2. Deploy MarketFactory (with temp oracle)
   ↓
3. Deploy Oracle (with factory address)
   ↓
4. Update Factory (set oracle address)
   ↓
5. Grant Roles (oracle, updater)
   ↓
6. Verify Contracts (optional)
```

## Security Notes

-   ⚠️ **Never commit `.env` file** with real private keys
-   ⚠️ Use a separate deployment account
-   ⚠️ Consider using a hardware wallet or multi-sig
-   ⚠️ Verify all addresses before mainnet deployment
-   ⚠️ Test thoroughly on testnet first

## Troubleshooting

### "Insufficient funds"

-   Ensure deployer has CELO for gas (not just cUSD)

### "Contract already deployed"

-   Check if contracts are already deployed
-   Use existing addresses or deploy to new network

### "Verification failed"

-   Check constructor arguments
-   Ensure source code matches
-   Verify network and API key

## Gas Costs

Approximate gas usage:

-   ReputationSystem: ~1.5M gas
-   MarketFactory: ~2.0M gas
-   Oracle: ~1.8M gas
-   **Total: ~5.3M gas**

Ensure deployer has enough CELO for gas fees.
