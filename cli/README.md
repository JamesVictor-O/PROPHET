# PROPHET CLI

A command-line interface for interacting with PROPHET contracts. This CLI replicates all functionality available in the frontend.

## Installation

```bash
cd cli
npm install
npm run build
```

## Setup

1. Copy the environment example file:

```bash
cp .env.example .env
```

2. Edit `.env` or `.env.local` and add your configuration:

```env
# Private key (with or without 0x prefix - CLI will auto-add it if missing)
PRIVATE_KEY=your_private_key_here

# Network RPC URL (Base Mainnet)
RPC_URL=https://mainnet.base.org

# Chain ID
CHAIN_ID=8453

# Contract Addresses (Base Mainnet - Latest Deployment with $0.0001 minimum stake)
MARKET_FACTORY=0x0B51348AB44895539A22832A1E49eD11C648bE35
PREDICTION_MARKET=0xc4b9aA01fF29ee4b0D86Cd68a3B4393Ee30BfAdc
ORACLE=0x2F94149647D5167859131E0f905Efe9E09EAC9C5
REPUTATION_SYSTEM=0xfe155C98757879dD24fF20447bf1E9E7E0e421d1
PAYMENT_TOKEN=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

# Explorer URL (optional)
EXPLORER=https://basescan.org
```

**Note**: The `PRIVATE_KEY` can be provided with or without the `0x` prefix. The CLI will automatically add it if missing.

## Usage

### Option 1: Install globally (Recommended - Already installed)

The CLI is already linked globally via `npm link`, so you can use the `prophet` command directly from anywhere:

```bash
# Create a Binary market
prophet market create-binary \
  --question "Will Bitcoin hit $100k by 2025?" \
  --category "crypto" \
  --end-date "2025-12-31" \
  --stake 0.0001 \
  --side yes

# List markets
prophet market list

# Make a prediction
prophet predict create --market-id 1 --side yes --stake 0.0001
```

### Option 2: Using npm start (Alternative)

If you prefer not to use the global command, you can use npm start from the cli directory:

```bash
cd cli

# Build first (if not already built)
npm run build

# Run commands (DO NOT include "prophet" prefix - npm start already runs it)
npm start market create-binary --question "Will Bitcoin hit $100k by 2025?" --category "crypto" --end-date "2025-12-31" --stake 0.0001 --side yes

# Or using node directly
node dist/index.js market create-binary --question "..." --category "..." --end-date "..." --stake 0.0001 --side yes
```

### Environment Variables

The CLI will automatically look for environment variables in these locations (in order):

1. `cli/.env.local`
2. `cli/.env`
3. Project root `.env.local`
4. Project root `.env`

Make sure you have your `PRIVATE_KEY` and contract addresses configured in one of these files.

## Commands

### Market Commands

**Note**: Replace `prophet` with `npm start` if not installed globally, or use `node dist/index.js`.

```bash
# Create a Binary market (Yes/No) - Minimum stake is now $0.0001
prophet market create-binary \
  --question "Will Bitcoin hit $100k by 2025?" \
  --category "crypto" \
  --end-date "2025-12-31" \
  --stake 0.0001 \
  --side yes

# Create a CrowdWisdom market (Multi-outcome)
prophet market create-crowdwisdom \
  --question "Who will win the next election?" \
  --category "politics" \
  --end-date "2025-12-31" \
  --stake 0.0001 \
  --outcome "Candidate A"

# List all markets
prophet market list

# Get market details
prophet market info --id 1

# Get market odds
prophet market odds --id 1
```

### Prediction Commands

**Note**: Replace `prophet` with `npm start` if not installed globally, or use `node dist/index.js`.

```bash
# Make a prediction on Binary market - Minimum stake is now $0.0001
prophet predict create \
  --market-id 1 \
  --side yes \
  --stake 0.0001

# Stake on a CrowdWisdom outcome
prophet predict create \
  --market-id 2 \
  --outcome "Candidate A" \
  --stake 0.0001

# Comment and stake on CrowdWisdom (creates new outcome)
prophet predict create \
  --market-id 2 \
  --outcome "Candidate B" \
  --stake 0.0001

# View your predictions
prophet predict list

# View a specific prediction
prophet predict info --market-id 1

# Claim payout for resolved market
prophet predict claim --market-id 1
```

### User Commands

```bash
# View user stats
prophet user stats

# View leaderboard
prophet user leaderboard

# Set username
prophet user set-username --name "Prophet123"
```

### Oracle Commands (Oracle only)

```bash
# Resolve a market
prophet oracle resolve \
  --market-id 1 \
  --outcome yes

# Resolve CrowdWisdom market
prophet oracle resolve \
  --market-id 2 \
  --outcome "Candidate A"
```

## Examples

### Complete Flow Example

```bash
# 1. Create a Binary market
prophet market create-binary \
  --question "Will it rain tomorrow?" \
  --category "weather" \
  --end-date "2024-12-31" \
  --stake 1.0 \
  --side yes

# Output: Market created with ID: 1

# 2. Make a prediction
prophet predict \
  --market-id 1 \
  --side no \
  --stake 2.0

# 3. Check market odds
prophet market odds --id 1

# 4. View your predictions
prophet predict list

# 5. (Oracle only) Resolve market
prophet oracle resolve --market-id 1 --outcome yes

# 6. Claim payout
prophet predict claim --market-id 1

# 7. Check your stats
prophet user stats
```

## Features

- ✅ Create Binary markets (Yes/No)
- ✅ Create CrowdWisdom markets (Multi-outcome)
- ✅ Make predictions/stake
- ✅ Comment and stake on CrowdWisdom outcomes
- ✅ View all markets
- ✅ View market details and odds
- ✅ View your predictions
- ✅ Claim payouts
- ✅ View user stats
- ✅ View leaderboard
- ✅ Set username
- ✅ Resolve markets (Oracle only)

## Development

```bash
# Watch mode
npm run watch

# Run directly with tsx (no build needed)
npm run dev [command] [options]
```

## Configuration

All configuration is done via `.env` file. The CLI will automatically:

- Check and approve token allowance if needed
- Handle transaction confirmations
- Display transaction status
- Show helpful error messages

## Troubleshooting

### "Insufficient allowance"

The CLI will automatically request approval. Just confirm the transaction.

### "Transaction failed"

Check:

- You have enough tokens for the stake
- You have enough ETH/gas
- Market hasn't ended
- Market isn't already resolved

### "Network mismatch"

Make sure your `CHAIN_ID` in `.env` matches your wallet network.
