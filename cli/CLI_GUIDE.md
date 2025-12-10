# PROPHET CLI Guide

A comprehensive command-line interface for interacting with PROPHET contracts. This CLI replicates all functionality available in the frontend.

## Quick Start

1. **Install dependencies:**

```bash
cd cli
npm install
```

2. **Setup environment:**

```bash
cp env.example .env
# Edit .env and add your configuration
```

3. **Build:**

```bash
npm run build
```

4. **Run commands:**

```bash
# Using npm script
npm start market list

# Or directly
node dist/index.js market list
```

## Configuration

Edit `.env` file with your configuration:

```env
PRIVATE_KEY=your_private_key_here
RPC_URL=https://rpc.ankr.com/celo_sepolia
CHAIN_ID=11142220
MARKET_FACTORY=0x8376D1Ba26B481A730c78f3aEe658dEa17595f71
PREDICTION_MARKET=0x684DFe6Dcee60974529A8838D1ce02f8dc3ACD8b
ORACLE=0x474F99826c16008BB20cF2365aB66ac1b66A9313
REPUTATION_SYSTEM=0x6C8Dc0D7d9812Da01c38456202E4cee23675D99B
PAYMENT_TOKEN=0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b
```

## Available Commands

### Market Commands

#### Create Binary Market

```bash
prophet market create-binary \
  --question "Will Bitcoin hit $100k by 2025?" \
  --category "crypto" \
  --end-date "2025-12-31" \
  --stake 1.0 \
  --side yes
```

#### Create CrowdWisdom Market

```bash
prophet market create-crowdwisdom \
  --question "Who will win the next election?" \
  --category "politics" \
  --end-date "2025-12-31" \
  --stake 5.0 \
  --outcome "Candidate A"
```

#### List All Markets

```bash
prophet market list
prophet market list --limit 10
```

#### Get Market Info

```bash
prophet market info --id 1
```

### Prediction Commands

#### Make a Prediction (Binary Market)

```bash
prophet predict create \
  --market-id 1 \
  --side yes \
  --stake 2.5
```

#### Make a Prediction (CrowdWisdom Market)

```bash
prophet predict create \
  --market-id 2 \
  --outcome "Candidate A" \
  --stake 10.0
```

#### Stake on Existing Outcome (CrowdWisdom)

```bash
prophet predict stake \
  --market-id 2 \
  --outcome "Candidate B" \
  --stake 5.0
```

#### List Your Predictions

```bash
prophet predict list
```

#### Claim Payout

```bash
prophet predict claim --market-id 1
```

### User Commands

#### View Your Stats

```bash
prophet user stats
prophet user stats --address 0x...
```

#### Set Username

```bash
prophet user set-username --name "Prophet123"
```

#### View Leaderboard

```bash
prophet user leaderboard
prophet user leaderboard --limit 20
```

### Oracle Commands (Oracle Only)

#### Resolve Binary Market

```bash
prophet oracle resolve \
  --market-id 1 \
  --outcome yes
```

#### Resolve CrowdWisdom Market

```bash
prophet oracle resolve \
  --market-id 2 \
  --outcome "Candidate A"
```

## Complete Example Workflow

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
prophet predict create \
  --market-id 1 \
  --side no \
  --stake 2.0

# 3. Check market info
prophet market info --id 1

# 4. View your predictions
prophet predict list

# 5. (Oracle only) Resolve market
prophet oracle resolve --market-id 1 --outcome yes

# 6. Claim payout
prophet predict claim --market-id 1

# 7. Check your stats
prophet user stats
```

## Development

### Watch Mode

```bash
npm run watch
```

### Direct Execution (without build)

```bash
npm run dev market list
```

## Features

✅ Create Binary markets (Yes/No)
✅ Create CrowdWisdom markets (Multi-outcome)
✅ Make predictions/stake
✅ Comment and stake on CrowdWisdom outcomes
✅ View all markets
✅ View market details and odds
✅ View your predictions
✅ Claim payouts
✅ View user stats
✅ View leaderboard
✅ Set username
✅ Resolve markets (Oracle only)

## Troubleshooting

### "Insufficient allowance"

The CLI automatically requests approval. Just wait for the approval transaction to confirm.

### "Transaction failed"

Check:

- You have enough tokens for the stake
- You have enough ETH/gas
- Market hasn't ended
- Market isn't already resolved

### "Network mismatch"

Make sure your `CHAIN_ID` in `.env` matches your network.

### "Missing contract addresses"

Ensure all contract addresses are set in your `.env` file.
