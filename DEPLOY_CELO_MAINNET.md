# Deploy PROPHET Contracts to Celo Mainnet

## Prerequisites

1. **Private Key**: Ensure you have your deployment private key set in environment variables
2. **CELO for Gas**: Make sure your deployer address has enough CELO to pay for gas fees
3. **Foundry**: Make sure Foundry is installed (`forge --version`)

## Deployment Steps

### 1. Set Environment Variables

Create a `.env` file in the `contract` directory or set environment variables:

```bash
export PRIVATE_KEY=your_private_key_here
export CELO_ETHERSCAN_API_KEY=your_celo_explorer_api_key  # Optional, for verification
```

### 2. Verify Network Configuration

The deployment script (`Deploy.s.sol`) automatically detects Celo Mainnet:

- **Chain ID**: 42220
- **cUSD Token**: `0x765DE816845861e75A25fCA122bb6898B8B1282a`
- **RPC URL**: `https://forno.celo.org` (configured in `foundry.toml`)

### 3. Deploy Contracts

Run the deployment script:

```bash
CELO_MAINNET_RPC = https://rpc.ankr.com/celo/23813b19e787b93a721c98d168bb6917b3a3a4f7730fea1617e1b1bb6a197d32
forge script script/Deploy.s.sol:DeployScript --rpc-url celo_mainnet --broadcast --verify
```

**Note**: Remove `--verify` if you don't have an Etherscan API key set up.

### 4. Save Deployment Addresses

After deployment, the script will output contract addresses. **Save these addresses** - you'll need them to update the frontend and CLI configurations.

Example output:

```
=== Deployment Summary ===
ReputationSystem: 0x...
Oracle: 0x...
PredictionMarket: 0x...
MarketFactory: 0x...
cUSD Token: 0x765DE816845861e75A25fCA122bb6898B8B1282a
Deployer: 0x...
========================
```

### 5. Update Frontend Configuration

Update `frontend/src/lib/contracts.ts` with the deployed addresses:

```typescript
celoMainnet: {
  factory: "0x...",  // From deployment output
  oracle: "0x...",   // From deployment output
  reputationSystem: "0x...",  // From deployment output
  predictionMarket: "0x...",  // From deployment output
  cUSD: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
  chainId: 42220,
  explorer: "https://explorer.celo.org",
},
```

### 6. Update CLI Configuration

Update `cli/src/config/contracts.ts` or set environment variables in your `.env` file:

```bash
MARKET_FACTORY=0x...
PREDICTION_MARKET=0x...
ORACLE=0x...
REPUTATION_SYSTEM=0x...
PAYMENT_TOKEN=0x765DE816845861e75A25fCA122bb6898B8B1282a
RPC_URL=https://forno.celo.org
CHAIN_ID=42220
EXPLORER=https://explorer.celo.org
```

### 7. Verify Deployment

Test the deployment:

**CLI:**

```bash
cd cli
prophet user balance  # Check your cUSD balance
prophet market list   # List markets (should be empty initially)
```

**Frontend:**

- Connect wallet to Celo Mainnet
- Check that the app detects the correct network
- Try creating a test market

## Important Notes

1. **Gas Costs**: Deploying all contracts will cost CELO (not cUSD). Make sure you have CELO in your deployer wallet.

2. **Contract Verification**: After deployment, verify contracts on [Celo Explorer](https://explorer.celo.org) using:

   ```bash
   forge verify-contract <CONTRACT_ADDRESS> <CONTRACT_NAME> --chain-id 42220 --constructor-args $(cast abi-encode "constructor(address)" <CONSTRUCTOR_ARG>)
   ```

3. **Network**: The frontend is now configured to use Celo Mainnet as the default network. Users will need to switch their wallets to Celo Mainnet.

4. **Token**: The payment token is **cUSD** (not CELO). Users need cUSD to create markets and make predictions.

5. **Minimum Stake**: The minimum stake is **0.0001 cUSD** (as configured in the contract).

## Troubleshooting

- **"Insufficient funds"**: Make sure your deployer address has CELO for gas
- **"Network mismatch"**: Ensure you're connected to Celo Mainnet (Chain ID: 42220)
- **"Invalid private key"**: Check that your PRIVATE_KEY is set correctly and starts with `0x`

## Next Steps

After deployment:

1. Test market creation
2. Test predictions
3. Test oracle resolution
4. Monitor gas usage and optimize if needed
5. Consider setting up monitoring/alerting for contract events
