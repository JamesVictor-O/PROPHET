# Prophet

Autonomous YES/NO share prediction markets on 0G.

Prophet is a prediction market protocol where every market trades two assets:

- `YES` shares
- `NO` shares

Each share is priced between `$0.00` and `$1.00` by an on-chain AMM. When the market resolves, the winning share redeems for `$1.00` and the losing share redeems for `$0.00`.

The goal is not to build a simple betting app. Prophet is market infrastructure: protocol-owned liquidity, autonomous market operations, verifiable AI-assisted resolution, and decentralized storage for market memory.

## Why This Matters

Prediction markets need more than a nice trading UI. They need:

- continuous liquidity from day one
- prices that move with demand and slippage
- deterministic settlement
- permanent resolution evidence
- automated market operations
- infrastructure that can survive adversarial trading behavior

Prophet uses 0G as the infrastructure layer for that system:

- **0G Chain** for market contracts, AMM settlement, and liquidity accounting
- **0G Compute** for AI-assisted question validation, oracle reasoning, and market intelligence
- **0G Storage** for market metadata, oracle reasoning, agent state, and audit trails

## Project Overview

Prophet turns any clear YES/NO question into a tradable AMM market.

Example market:

```text
Will it rain tomorrow?
```

The market has:

```text
YES share
NO share
```

If the AMM shows:

```text
YES = $0.70
NO  = $0.30
```

then the market is pricing the YES outcome at roughly 70 cents and the NO outcome at roughly 30 cents.

Users can:

- create markets
- buy YES shares
- buy NO shares
- sell YES shares back to the AMM
- sell NO shares back to the AMM
- see wallet USDT balances
- see owned YES/NO share balances
- view AMM share prices in dollars
- redeem winning shares after settlement

The protocol can:

- allocate liquidity from a protocol-owned liquidity pool
- seed market AMM reserves
- collect trading fees
- return unused liquidity and fees after settlement
- use agents to monitor markets, pricing, liquidity health, and resolution state

## Current Implementation Status

Implemented:

- YES/NO AMM market contract
- protocol-owned `LiquidityPool`
- market creation via `ProphetFactory`
- AMM buy/sell quotes
- AMM share redemption
- cancelled-market neutral redemption
- trading fee accrual
- liquidity allocation and return flow
- frontend trading modal with balances, slippage protection, loading states, and reverted transaction handling
- autonomous market-maker agent with queued transactions
- oracle agent integration path
- 0G Compute diagnostics
- 0G Storage upload/readback diagnostics

Verified locally:

```text
forge test --offline      -> 232 passing contract tests
npm run typecheck         -> agent TypeScript passes
npm run build             -> frontend production build passes
npm run test:storage      -> 0G Storage upload/readback passes
npm run test:compute      -> 0G Compute live inference passes
```

## Quick Start for Judges

After creating the environment files in the **Environment Setup** section, run:

```bash
# 1. Run contract tests
cd contracts
forge test --offline

# 2. Run 0G diagnostics
cd ../agent
npm install
npm run test:storage
npm run test:compute

# 3. Run the frontend
cd ../frontendV2
npm install
npm run dev
```

Then open:

```text
http://localhost:3000
```

## System Architecture

```text
                              +-----------------------------+
                              |         Frontend            |
                              |  Next.js + wagmi + viem     |
                              |                             |
                              |  - create markets           |
                              |  - trade YES/NO shares      |
                              |  - show AMM prices          |
                              |  - show balances            |
                              +--------------+--------------+
                                             |
                                             v
+-------------------+        +---------------+---------------+        +----------------------+
|   0G Storage      |        |            0G Chain           |        |     0G Compute       |
|                   |        |     EVM contracts on 16602    |        |                      |
| - market metadata |<------>|                               |<------>| - question checks    |
| - oracle records  |        |  ProphetFactory               |        | - oracle inference   |
| - price snapshots |        |  MarketContract               |        | - pricing rationale  |
| - agent state     |        |  LiquidityPool                |        | - TEE attestation    |
| - audit memory    |        |  PositionVault                |        |                      |
|                   |        |  PayoutDistributor            |        |                      |
+-------------------+        +---------------+---------------+        +----------------------+
                                             ^
                                             |
                         +-------------------+-------------------+
                         |                                       |
                         v                                       v
              +---------------------+                 +---------------------+
              | Oracle Agent        |                 | Market Maker Agent  |
              |                     |                 |                     |
              | - monitors deadline |                 | - allocates pool    |
              | - calls 0G Compute  |                 | - monitors AMM      |
              | - writes reasoning  |                 | - queues txs        |
              | - posts verdict     |                 | - returns liquidity |
              +---------------------+                 +---------------------+
```

## Core Protocol Components

### `MarketContract`

One contract per market.

Responsibilities:

- holds market state
- tracks YES/NO AMM reserves
- prices buys and sells
- stores user YES/NO share balances
- accrues trading fees
- settles winning share redemption
- handles cancelled-market redemption
- returns protocol-owned liquidity after settlement

Important functions:

```solidity
seedLiquidity(uint256 collateralAmount)
buyShares(bool isYes, uint256 collateralAmount, uint256 minSharesOut)
sellShares(bool isYes, uint256 sharesIn, uint256 minCollateralOut)
redeemWinningShares()
redeemCancelledShares()
getAmmState(address trader)
getBuyAmount(bool isYes, uint256 collateralAmount)
getSellAmount(bool isYes, uint256 sharesIn)
```

### `LiquidityPool`

Protocol-owned liquidity source.

Responsibilities:

- holds idle USDT
- lets LPs deposit and withdraw
- allows the market-maker agent to allocate liquidity to valid markets
- tracks allocated capital
- records returned principal and fees

### `ProphetFactory`

Market registry and deployment contract.

Responsibilities:

- creates new market contracts
- validates market addresses
- stores market list for frontend and agents
- wires market contracts to oracle, market-maker, vault, and distributor roles

### `PositionVault` and `PayoutDistributor`

These support the legacy sealed-position flow and payout distribution path. The current primary user flow is AMM YES/NO share trading, but these contracts remain part of the architecture for private commitments and future sealed-market extensions.

## AMM Design

Prophet uses a binary YES/NO AMM with complete-set accounting.

When liquidity is seeded:

```text
USDT collateral enters the market
YES reserve increases
NO reserve increases
```

Buying YES:

```text
YES reserve decreases
NO reserve increases
YES price rises
NO price falls
```

Buying NO:

```text
NO reserve decreases
YES reserve increases
NO price rises
YES price falls
```

Selling shares uses the complete-set invariant so the market does not overpay in imbalanced states.

The sell equation is:

```text
(sameReserve + sharesIn - collateralOut) *
(oppositeReserve - collateralOut)
= sameReserve * oppositeReserve
```

This keeps pricing continuous, applies slippage, and protects market solvency under thin liquidity and one-sided trading.

## Autonomous Liquidity System

The market-maker agent is not a simple trading bot. It acts like an autonomous exchange operator.

It:

- scans existing markets on startup
- listens for new market creation
- reads on-chain AMM reserves
- allocates protocol liquidity from `LiquidityPool`
- tracks market liquidity tiers
- listens for buy/sell events
- pushes AMM prices to the frontend cache
- queues transactions to avoid nonce collisions
- listens for resolution/cancellation events
- returns settled liquidity back to the pool
- runs a recovery loop so missed events do not strand funds

The flywheel:

```text
Users trade
-> protocol earns fees
-> liquidity pool grows
-> market-maker agent deploys deeper liquidity
-> markets become smoother to trade
-> more users trade
-> more fees accrue
```

## 0G Component Usage

### 1. 0G Chain

Problem solved:

Prophet needs a fast EVM-compatible settlement layer for market creation, trading, liquidity accounting, and redemption.

Used for:

- `ProphetFactory`
- `MarketContract`
- `LiquidityPool`
- `PositionVault`
- `PayoutDistributor`
- USDT collateral transfers
- AMM reserve updates
- market lifecycle transitions
- challenge and resolution flow

Network used:

```text
0G Galileo Testnet
Chain ID: 16602
RPC: https://evmrpc-testnet.0g.ai
Explorer: https://chainscan-galileo.0g.ai
```

Libraries:

- Solidity `0.8.20`
- Foundry
- OpenZeppelin
- ethers v6
- viem/wagmi

### 2. 0G Compute

Problem solved:

Prediction markets need automated intelligence for question validation, resolution reasoning, and market analysis without relying on a centralized AI backend.

SDK/API used:

```text
@0glabs/0g-serving-broker
OpenAI-compatible provider endpoint returned by 0G Compute
```

Implemented in:

```text
agent/src/shared/compute.ts
agent/src/scripts/test-compute.ts
frontendV2/src/app/api/validate-question/route.ts
```

Prophet uses 0G Compute for:

- validating whether a market question is clear and resolvable
- suggesting resolution sources
- oracle reasoning at market resolution
- market-maker probability/pricing inference when no AMM price exists yet
- TEE provider attestation checks
- billing header generation for provider requests

Reliability hardening:

- broker caching
- account/ledger bootstrap
- compute ledger top-up support
- provider signer acknowledgement
- TEE attestation verification
- configurable strict TEE mode via `COMPUTE_REQUIRE_TEE=1`
- timeout handling
- retry handling
- strict JSON extraction and validation
- confidence threshold enforcement for oracle responses

### 3. 0G Storage

Problem solved:

Prediction markets need permanent, decentralized, auditable memory for market metadata, oracle reasoning, and agent state.

SDK/API used:

```text
@0gfoundation/0g-storage-ts-sdk
Indexer
MemData
```

Implemented in:

```text
agent/src/shared/storage.ts
agent/src/scripts/test-storage.ts
frontendV2/src/lib/server/og-storage.ts
frontendV2/src/app/api/store-metadata/route.ts
frontendV2/src/app/api/og-storage/route.ts
```

Prophet stores:

- market metadata
- resolution source metadata
- AI-generated market overview
- oracle reasoning records
- oracle working state
- market-maker state
- price snapshots

Storage key pattern:

```text
market:{address}:metadata
market:{address}:prices
market:{address}:resolution
market:{address}:payout
agent:oracle:working:{address}
agent:mm:state
```

Reliability hardening:

- upload retries
- download retries
- Merkle tree generation before upload
- read-after-write verification
- checksum comparison after upload
- temporary file cleanup after downloads

Live diagnostic currently verifies:

- upload to 0G Storage
- download from 0G Storage
- round-trip content match
- market metadata download
- `aiOverview` presence in stored metadata

## Repository Structure

```text
.
├── contracts/
│   ├── src/
│   │   ├── ProphetFactory.sol
│   │   ├── MarketContract.sol
│   │   ├── LiquidityPool.sol
│   │   ├── PositionVault.sol
│   │   └── PayoutDistributor.sol
│   ├── script/Deploy.s.sol
│   └── test/
│
├── agent/
│   └── src/
│       ├── market-maker/index.ts
│       ├── oracle/index.ts
│       ├── shared/compute.ts
│       ├── shared/storage.ts
│       └── scripts/
│           ├── test-compute.ts
│           └── test-storage.ts
│
└── frontendV2/
    └── src/
        ├── app/
        ├── app/_components/trade-panel.tsx
        └── lib/
```

## Deployed Demo Contracts

The repo currently defaults to this 0G Galileo deployment:

```text
USDT_ADDRESS               0xc2B0D2A7e858F13B349843fF87dBF4EBF9227F49
PROPHET_FACTORY_ADDRESS    0x069e6203ef2CEB6aB7eC23432f9693eADdE0Af7C
POSITION_VAULT_ADDRESS     0xb941a917B0a345B87f30598589Cc71b5ff9b72b9
PAYOUT_DISTRIBUTOR_ADDRESS 0x33a32264031c6CE010b200227aC8119E5156b405
LIQUIDITY_POOL_ADDRESS     0xda95ad4cA75eC78fE71D5Be970c8c3956E32B018
```

For judging the latest source, redeploy with the steps below and replace these addresses in `contracts/.env`, `agent/.env`, and `frontendV2/.env.local`.

## Local Setup

### Prerequisites

Install:

- Node.js 20+
- npm
- Foundry
- a wallet funded with 0G Galileo testnet tokens

Clone and install:

```bash
git clone <repo-url>
cd PROPHET

cd agent
npm install

cd ../frontendV2
npm install

cd ../contracts
git submodule update --init --recursive
```

## Environment Setup

### `contracts/.env`

Create `contracts/.env`:

```bash
PRIVATE_KEY=<deployer_private_key>
OG_CHAIN_RPC_TESTNET=https://evmrpc-testnet.0g.ai
OG_CHAIN_RPC_MAINNET=https://evmrpc.0g.ai

USDT_ADDRESS=
ORACLE_AGENT_ADDRESS=<oracle_wallet_address>
MARKET_MAKER_ADDRESS=<market_maker_wallet_address>
PROTOCOL_TREASURY=<treasury_wallet_address>
```

If `USDT_ADDRESS` is empty, the deploy script deploys `MockUSDT` and mints test tokens to the deployer.

### `agent/.env`

Create from the example:

```bash
cd agent
cp .env.example .env
```

Required:

```bash
PRIVATE_KEY_ORACLE=<oracle_private_key>
PRIVATE_KEY_MM=<market_maker_private_key>
ORACLE_NACL_SECRET_KEY=<optional_for_legacy_sealed_flow>
```

Optional overrides:

```bash
OG_CHAIN_RPC=https://evmrpc-testnet.0g.ai
OG_INDEXER_RPC=https://indexer-storage-testnet-turbo.0g.ai
COMPUTE_PROVIDER_ADDRESS=0xa48f01287233509FD694a22Bf840225062E67836
COMPUTE_REQUIRE_TEE=0
STORAGE_VERIFY_WRITES=1
```

### `frontendV2/.env.local`

```bash
PRIVATE_KEY_ORACLE=<server_side_oracle_private_key_for_validation_api>
OG_CHAIN_RPC=https://evmrpc-testnet.0g.ai
OG_INDEXER_RPC=https://indexer-storage-testnet-turbo.0g.ai
COMPUTE_PROVIDER_ADDRESS=0xa48f01287233509FD694a22Bf840225062E67836

NEXT_PUBLIC_PROPHET_FACTORY_ADDRESS=<factory_address>
NEXT_PUBLIC_POSITION_VAULT_ADDRESS=<vault_address>
NEXT_PUBLIC_PAYOUT_DISTRIBUTOR_ADDRESS=<distributor_address>
NEXT_PUBLIC_USDT_ADDRESS=<usdt_address>
NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS=<pool_address>
NEXT_PUBLIC_ORACLE_NACL_PUBLIC_KEY=<public_key_for_legacy_sealed_flow>
```

Never commit real private keys.

## Build and Test

### Smart contracts

```bash
cd contracts
forge test --offline
```

Expected:

```text
232 tests passed
```

### Agent

```bash
cd agent
npm run typecheck
```

### Frontend

```bash
cd frontendV2
npm run build
```

## Deploy to 0G Galileo

From `contracts/`:

```bash
forge script script/Deploy.s.sol:DeployProphet \
  --rpc-url og_testnet \
  --broadcast \
  --legacy \
  --gas-price 3000000000 \
  -vvv
```

The deploy script prints:

```text
USDT_ADDRESS
PROPHET_FACTORY_ADDRESS
POSITION_VAULT_ADDRESS
PAYOUT_DISTRIBUTOR_ADDRESS
LIQUIDITY_POOL_ADDRESS
```

Copy those into:

```text
contracts/.env
agent/.env
frontendV2/.env.local
frontendV2/src/lib/contracts.ts, if you want defaults updated
agent/src/shared/config.ts, if you want defaults updated
```

Then regenerate frontend ABIs after contract changes from the repo root:

```bash
cd ..
node -e 'const fs=require("fs"); for (const n of ["MarketContract","LiquidityPool","ProphetFactory","PositionVault","PayoutDistributor"]) { const artifact=JSON.parse(fs.readFileSync("contracts/out/"+n+".sol/"+n+".json","utf8")); fs.writeFileSync("frontendV2/src/lib/abis/"+n+".json", JSON.stringify({abi: artifact.abi})); }'
```

## Run the App Locally

Start the frontend:

```bash
cd frontendV2
npm run dev
```

Open:

```text
http://localhost:3000
```

Start both agents:

```bash
cd agent
npm run start
```

Or run individually:

```bash
npm run oracle
npm run market-maker
```

## 0G Diagnostics

Run these before judging/demoing.

### 0G Storage

```bash
cd agent
npm run test:storage
```

This verifies:

- 0G Chain RPC connection
- wallet balance
- 0G Storage upload
- 0G Storage download
- round-trip data integrity
- market metadata availability

### 0G Compute

```bash
cd agent
npm run test:compute
```

This verifies:

- 0G Chain RPC connection
- broker creation
- compute ledger account
- provider metadata
- TEE attestation
- billing headers
- live inference response
- JSON parsing

## Test Account and Faucet Instructions

### 1. Get native 0G for gas

Use the 0G Galileo testnet faucet:

```text
https://faucet.0g.ai
```

Fund:

- deployer wallet
- oracle wallet
- market-maker wallet
- any wallet used by judges to test the frontend

### 2. Get mock USDT for trading

When using the deployed `MockUSDT`, open the app and go to:

```text
/faucet
```

Connect a wallet and claim:

```text
50 mock USDT
```

The faucet is for testnet only and has no real value.

### 3. Test the main user flow

1. Connect wallet on 0G Galileo.
2. Claim mock USDT from `/faucet`.
3. Create a market.
4. Wait for the market-maker agent to allocate liquidity.
5. Open the market page.
6. Buy YES or NO shares.
7. Observe share price moving between `$0.00` and `$1.00`.
8. Sell a portion of shares back to the AMM.
9. Run the oracle/market-maker agents to process resolution and liquidity return flows.

## Judge Demo Script

Recommended demo order:

1. Show the dashboard and market list.
2. Create a new market question.
3. Show 0G Compute validating the question.
4. Show metadata written to 0G Storage.
5. Show the market-maker agent detecting the market.
6. Show protocol liquidity allocation.
7. Buy YES/NO shares and show AMM price movement.
8. Show user share balances and USDT balances.
9. Run `npm run test:storage` to prove 0G Storage upload/readback.
10. Run `npm run test:compute` to prove 0G Compute provider, TEE attestation, billing headers, and live inference.

## Security and Economic Notes

Prophet is designed around these constraints:

- liquidity is finite
- large trades must create slippage
- YES and NO prices must remain bounded between `$0` and `$1`
- the AMM must not create claims that collateral cannot satisfy
- resolution must be deterministic
- agent failures must be recoverable
- storage and compute integrations must fail loudly and verifiably

Current hardening:

- non-reentrant contract paths
- slippage protection on frontend trades
- conservative AMM rounding
- queued market-maker transactions
- recovery loop for missed settlement events
- 0G Storage read-after-write checksum verification
- 0G Compute timeout/retry/JSON validation
- optional strict TEE enforcement

## What Makes Prophet Different

Most prediction markets depend on human market creation, human liquidity providers, and human resolution committees.

Prophet pushes these responsibilities into autonomous infrastructure:

```text
market creation -> assisted by 0G Compute
market memory   -> stored on 0G Storage
market trading  -> handled by on-chain YES/NO AMM
liquidity       -> managed by autonomous market-maker agent
resolution      -> assisted by oracle agent using 0G Compute
audit trail     -> persisted through 0G Storage
settlement      -> enforced by 0G Chain contracts
```

That is the core hackathon thesis:

**0G is not just a chain Prophet deploys to. 0G is the compute, storage, and settlement substrate that makes autonomous prediction market infrastructure possible.**
