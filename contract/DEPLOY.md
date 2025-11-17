# Deployment Guide - Celo Sepolia

## Prerequisites

1. **Private Key**: Your deployer wallet private key
2. **CELO Balance**: Ensure your wallet has CELO for gas (not just cUSD)
3. **API Key** (optional): CeloScan API key for contract verification

## Quick Deployment

### 1. Setup Environment

```bash
cd contract
cp env.local.example .env.local
```

Edit `.env.local` and set:

-   `PRIVATE_KEY=your_private_key_here`
-   `CELO_ETHERSCAN_API_KEY=your_api_key_here` (optional, for verification)

### 2. Deploy to Celo Sepolia

```bash
# Source environment variables
source .env.local

# Deploy contracts
forge script script/Deploy.s.sol:DeployScript \
    --rpc-url $CELO_SEPOLIA_RPC \
    --broadcast \
    --verify \
    --etherscan-api-key $CELO_ETHERSCAN_API_KEY \
    --private-key $PRIVATE_KEY \
    -vvvv
```

Or using the RPC URL directly:

```bash
forge script script/Deploy.s.sol:DeployScript \
    --rpc-url https://rpc.ankr.com/celo_sepolia \
    --broadcast \
    --verify \
    --etherscan-api-key $CELO_ETHERSCAN_API_KEY \
    --private-key $PRIVATE_KEY \
    -vvvv
```

### 3. Save Deployed Addresses

After deployment, the script will output all contract addresses. Save them to:

-   `DEPLOYED_ADDRESSES.md`
-   `frontend/src/lib/contracts.ts`

## Configuration

### cUSD Address

The deployment script automatically uses the correct cUSD address for Celo Sepolia:

-   **cUSD Address**: `0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b`

This is configured in `script/Deploy.s.sol` line 29.

### Network Detection

The script auto-detects the network:

-   **Chain ID 44787** (legacy) → Celo Sepolia
-   **Chain ID 11142220** (EIP-155) → Celo Sepolia
-   **Chain ID 42220** → Celo Mainnet

## Deployment Order

The script deploys contracts in this order:

1. **ReputationSystem** - User reputation tracking
2. **PredictionMarket** - Single contract storing all markets
3. **Oracle** - Market resolution
4. **MarketFactory** - Wrapper for market creation
5. **Role Setup** - Grants necessary permissions

## Gas Costs

Approximate gas usage:

-   ReputationSystem: ~1.5M gas
-   PredictionMarket: ~2.6M gas
-   Oracle: ~1.3M gas
-   MarketFactory: ~1.0M gas
-   Role Setup: ~48K gas
-   **Total: ~6.5M gas**

Ensure your wallet has enough CELO (not cUSD) for gas fees.

## Verification

Contracts are automatically verified if you use `--verify` flag. If verification fails:

1. Wait 5-10 minutes for block explorer indexing
2. Verify manually using `forge verify-contract`

Example manual verification:

```bash
forge verify-contract <CONTRACT_ADDRESS> \
    src/core/PredictionMarket.sol:PredictionMarket \
    --chain celo_sepolia \
    --etherscan-api-key $CELO_ETHERSCAN_API_KEY \
    --constructor-args $(cast abi-encode "constructor(address,address,address,address)" \
        <CUSD_ADDRESS> \
        <ORACLE_ADDRESS> \
        <REPUTATION_SYSTEM_ADDRESS> \
        <OWNER_ADDRESS>)
```

## Post-Deployment

After deployment, update:

1. **Frontend** (`frontend/src/lib/contracts.ts`):

    ```typescript
    export const CONTRACTS = {
        celoSepolia: {
            factory: "<FACTORY_ADDRESS>",
            oracle: "<ORACLE_ADDRESS>",
            reputationSystem: "<REPUTATION_SYSTEM_ADDRESS>",
            predictionMarket: "<PREDICTION_MARKET_ADDRESS>",
            cUSD: "0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b",
            chainId: 44787,
        },
    };
    ```

2. **Documentation** (`DEPLOYED_ADDRESSES.md`)

## Troubleshooting

### "Insufficient funds"

-   Ensure deployer has CELO (not just cUSD)
-   Check balance: `cast balance <YOUR_ADDRESS> --rpc-url https://rpc.ankr.com/celo_sepolia`

### "Contract verification failed"

-   Wait 5-10 minutes for block explorer indexing
-   Verify manually using `forge verify-contract`
-   Check constructor arguments match deployment

### "Wrong cUSD address"

-   The script auto-detects the network and uses the correct address
-   Verify in `script/Deploy.s.sol` line 29: `0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b`

## Testing Deployment

After deployment, test:

1. **Market Creation**: Create a test market via frontend
2. **Predictions**: Make a prediction with cUSD
3. **Resolution**: Resolve a market (requires oracle role)
4. **Claims**: Claim payouts for winning predictions

## Security Notes

-   ⚠️ **Never commit `.env.local`** with real private keys
-   ⚠️ Use a separate deployment account
-   ⚠️ Test thoroughly on testnet before mainnet
-   ⚠️ Verify all addresses before mainnet deployment
