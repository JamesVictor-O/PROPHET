# Prophet — AI-Native Prediction Market on 0G Labs

> *Making opinions tradable. Privately. Autonomously. Verifiably.*

[![0G Chain](https://img.shields.io/badge/0G%20Chain-Galileo%20Testnet-blue)](https://chainscan-galileo.0g.ai)
[![Track](https://img.shields.io/badge/Track-2%20Agentic%20Trading%20Arena-purple)](https://www.hackquest.io/hackathons/0G-APAC-Hackathon)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [0G Component Integration](#3-0g-component-integration)
   - [0G Chain — Settlement Layer](#31-0g-chain--settlement-layer)
   - [0G Storage — Memory Layer](#32-0g-storage--memory-layer)
   - [0G Compute — Intelligence Layer](#33-0g-compute--intelligence-layer)
   - [TEE Sealed Inference — Privacy Layer](#34-tee-sealed-inference--privacy-layer)
4. [Smart Contract Architecture](#4-smart-contract-architecture)
5. [AI Oracle — How Resolution Works](#5-ai-oracle--how-resolution-works)
6. [Core Flows](#6-core-flows)
7. [Deployed Contracts](#7-deployed-contracts)
8. [Local Setup & Deployment](#8-local-setup--deployment)
   - [Prerequisites](#81-prerequisites)
   - [1. Smart Contracts](#82-1-smart-contracts)
   - [2. Agent (Oracle + Market Maker)](#83-2-agent-oracle--market-maker)
   - [3. Frontend](#84-3-frontend)
9. [Testnet Setup & Faucet](#9-testnet-setup--faucet)
10. [Tech Stack](#10-tech-stack)
11. [Hackathon Track](#11-hackathon-track)
12. [Roadmap](#12-roadmap)

---

## 1. Project Overview

### The Problem

Prediction markets are one of the most powerful tools for aggregating collective intelligence — but every major platform is broken:

| Platform | Critical Failure |
|---|---|
| **Polymarket** | Public on-chain positions → front-running; human resolution committee → gameable |
| **Augur** | Token holder voting takes days, is gameable by large holders; no liquidity bootstrapping |
| **All of them** | Resolution disputes have no cryptographic accountability — just social consensus |

The root cause is **infrastructure**, not product design. Prediction markets need fast cheap settlement, decentralized storage for oracle evidence, verifiable AI compute for autonomous resolution, privacy-preserving execution to prevent front-running, and autonomous agents for always-on liquidity. No single infrastructure stack provided all of these — until 0G Labs.

### What Prophet Does

Prophet is a fully autonomous, privacy-preserving, AI-native prediction market built on 0G Labs infrastructure.

| Feature | How Prophet Does It |
|---|---|
| **Market resolution** | AI oracle agent on 0G Compute — autonomous, auditable, no human committee |
| **Position privacy** | TEE sealed inference — your bet is encrypted until market closes, zero front-running |
| **Liquidity** | Autonomous market maker agent — seeds and maintains liquidity 24/7 |
| **Market creation** | Any user, any question — LLM validates and assigns resolution sources automatically |
| **Oracle accountability** | Full reasoning chain stored permanently on 0G Storage — anyone can verify |
| **Settlement** | Sub-second finality on 0G Chain — instant payouts to winners |

**One-line pitch:** Prophet is the first prediction market where positions are sealed until resolution, markets are resolved by an AI oracle — not a human committee — and liquidity is provided by an autonomous agent, 24/7.

---

## 2. System Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            PROPHET SYSTEM                                │
│                                                                          │
│  ┌───────────────┐      ┌──────────────────┐      ┌──────────────────┐  │
│  │   Frontend    │      │  Oracle Agent     │      │  Market Maker    │  │
│  │  (Next.js)    │      │  [agent/oracle]   │      │  Agent [agent/   │  │
│  │  frontendV2/  │      │                  │      │  market-maker]   │  │
│  └──────┬────────┘      └────────┬─────────┘      └────────┬─────────┘  │
│         │                       │                          │            │
│         │          ┌────────────┴──────────────────────────┤            │
│         ▼          ▼                                       ▼            │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                       0G CHAIN (EVM L1)                           │  │
│  │                                                                   │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  ┌────────┐  │  │
│  │  │ ProphetFactory│  │MarketContract│  │PositionVault│  │Payout │  │  │
│  │  │   [Factory]  │  │  [per mkt]   │  │  (TEE)     │  │Distrib.│  │  │
│  │  └──────────────┘  └──────────────┘  └────────────┘  └────────┘  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│         │                       │                          │            │
│         ▼                       ▼                          ▼            │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────────┐   │
│  │   0G Storage    │  │   0G Compute     │  │  TEE Sealed          │   │
│  │  [storage.ts]   │  │  [compute.ts]    │  │  Inference           │   │
│  │                 │  │                  │  │  [bet-encryption.ts] │   │
│  │ KV: metadata,   │  │ • LLM oracle     │  │                      │   │
│  │     prices,     │  │ • Market maker   │  │ • Encrypt bets       │   │
│  │     agent state │  │   repricing      │  │ • Decrypt at         │   │
│  │ Log: oracle     │  │ • Question       │  │   resolution         │   │
│  │      reasoning  │  │   validation     │  │                      │   │
│  └─────────────────┘  └──────────────────┘  └──────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

### Key Architectural Principles

**Separation of concerns** — Oracle agent, market maker agent, and smart contracts are fully independent. Each has its own wallet and responsibilities. A failure in one does not cascade.

**Immutability of resolution rules** — When a market is created, its resolution sources, deadline, and criteria are locked into [`MarketContract.sol`](contracts/src/MarketContract.sol) on-chain. Nobody can change them after deployment.

**Permanent accountability** — Every oracle decision with full reasoning is written to 0G Storage Log Layer permanently. The oracle's track record is public and queryable by anyone via [`useOracleReasoning`](frontendV2/src/lib/hooks/use-oracle-reasoning.ts).

**Privacy by default** — User positions are never stored in plaintext. They enter [`PositionVault.sol`](contracts/src/PositionVault.sol) encrypted and are only decrypted at the moment of resolution — simultaneously for all participants.

---

## 3. 0G Component Integration

This section documents exactly which 0G API/SDK is used, where in the codebase it is integrated, and what problem it solves.

### 3.1 0G Chain — Settlement Layer

**SDK/API used:** Standard EVM JSON-RPC (`ethers.js v6`, `viem`, `wagmi v2`)
**Network:** Galileo Testnet — Chain ID `16602`, RPC `https://evmrpc-testnet.0g.ai`

**What runs on 0G Chain:**

| Contract | File | Role |
|---|---|---|
| `ProphetFactory` | [`contracts/src/ProphetFactory.sol`](contracts/src/ProphetFactory.sol) | Deploys market contracts, maintains registry |
| `MarketContract` | [`contracts/src/MarketContract.sol`](contracts/src/MarketContract.sol) | Per-market lifecycle, holds USDT collateral |
| `PositionVault` | [`contracts/src/PositionVault.sol`](contracts/src/PositionVault.sol) | Stores encrypted bet commitments (TEE-sealed) |
| `PayoutDistributor` | (integrated in MarketContract) | Releases collateral to winning positions |
| `LiquidityPool` | [`contracts/src/LiquidityPool.sol`](contracts/src/LiquidityPool.sol) | Market maker's on-chain liquidity reserve |

**Chain interaction helpers:**
- Agent: [`agent/src/shared/chain.ts`](agent/src/shared/chain.ts)
- Frontend config: [`frontendV2/src/lib/web3-config.ts`](frontendV2/src/lib/web3-config.ts)
- Contract ABIs/addresses: [`frontendV2/src/lib/contracts.ts`](frontendV2/src/lib/contracts.ts)

**Problem it solves:** 11,000 TPS and sub-second finality make real-time betting and instant payouts viable. Low gas makes sub-$1 bets economically feasible — something impossible on Ethereum mainnet.

---

### 3.2 0G Storage — Memory Layer

**SDK used:** `@0gfoundation/0g-storage-ts-sdk`
**Implementation:** [`agent/src/shared/storage.ts`](agent/src/shared/storage.ts) — all read/write helpers
**Frontend proxy:** [`frontendV2/src/lib/server/og-storage.ts`](frontendV2/src/lib/server/og-storage.ts)
**Frontend API route:** [`frontendV2/src/app/api/og-storage/route.ts`](frontendV2/src/app/api/og-storage/route.ts)

**Two layers, two purposes:**

| Layer | Used For | Key Structure |
|---|---|---|
| **Log** (immutable) | Oracle reasoning chains, payout records | `market:{address}:resolution` |
| **KV** (mutable) | Market metadata, live prices, agent state | `market:{address}:metadata`, `market:{address}:prices` |

**Full key structure:**
```
KV (live, mutable)
  market:{address}:metadata    → { question, deadline, category, sources, status }
  market:{address}:prices      → { yesPrice, noPrice, lastUpdated, volume24h }
  agent:mm:state               → { activeMarkets: [{address, yesPrice, noPrice}] }

Log (permanent, immutable)
  market:{address}:resolution  → { verdict, confidence, reasoning, sourcesChecked, timestamp, txHash }
  market:{address}:payout      → { outcome, winnerCount, totalDistributed, fees, txHash }
```

**Indexer used:** Turbo indexer (standard returns 503 on testnet)
**Config:** [`agent/src/shared/config.ts`](agent/src/shared/config.ts)

**Problem it solves:** Oracle reasoning is stored permanently and immutably — it cannot be edited after the fact, giving the oracle a verifiable, tamper-proof track record. 95% cheaper than AWS S3, making it viable to store full JSON reasoning chains for every market.

---

### 3.3 0G Compute — Intelligence Layer

**SDK used:** `@0glabs/0g-serving-broker` + OpenAI-compatible REST API
**Implementation:** [`agent/src/shared/compute.ts`](agent/src/shared/compute.ts)
**Test script:** [`agent/src/scripts/test-compute.ts`](agent/src/scripts/test-compute.ts)

**Three distinct inference calls:**

| Call | When | Model | File |
|---|---|---|---|
| **Question Validation** | At market creation | `qwen-2.5-7b-instruct` (testnet) | [`frontendV2/src/app/api/validate-question/route.ts`](frontendV2/src/app/api/validate-question/route.ts) |
| **Oracle Resolution** | At market deadline | `qwen-2.5-7b-instruct` (testnet) / `deepseek-chat-v3-0324` (mainnet) | [`agent/src/oracle/index.ts`](agent/src/oracle/index.ts) |
| **Market Maker Repricing** | Continuous (every 60s) | `qwen-2.5-7b-instruct` (testnet) | [`agent/src/market-maker/index.ts`](agent/src/market-maker/index.ts) |

**How the oracle call works (at resolution):**
```typescript
// agent/src/shared/compute.ts
const broker = await createZGServingNetworkBroker(signer);
const { endpoint, model } = await broker.getServiceMetadata(providerAddress);
await broker.verifyService(providerAddress); // Verify TEE attestation

const client = new OpenAI({ baseURL: endpoint, apiKey: '' });
const response = await client.chat.completions.create({
  model,
  messages: [
    { role: 'system', content: ORACLE_SYSTEM_PROMPT },
    { role: 'user',   content: oraclePrompt }
  ],
  temperature: 0.1,  // Low temp for deterministic oracle decisions
});
// Returns: { verdict, confidence, reasoning, evidenceSummary, sourcesChecked }
```

**Testnet provider:** `0xa48f01...` (Qwen 2.5 7B Instruct)
**Mainnet provider:** `0x1B3AAe...` (DeepSeek Chat V3)

**Problem it solves:** Decentralized pay-per-use GPU — Prophet only pays for inference when actually needed. No vendor can censor or throttle oracle calls. Compute results can be cryptographically verified via TEEML.

---

### 3.4 TEE Sealed Inference — Privacy Layer

**Implementation (frontend):** [`frontendV2/src/lib/bet-encryption.ts`](frontendV2/src/lib/bet-encryption.ts)
**Implementation (contract):** [`contracts/src/PositionVault.sol`](contracts/src/PositionVault.sol) — `commitPosition()` and `revealPositions()`

**How it works:**

```
User input: { direction: "YES", amount: 100 USDT }
                    │
                    ▼
         TEE encryption (bet-encryption.ts)
                    │
                    ▼
On-chain: 0xA3F9...2B1C  ← meaningless to any observer
                    │
         [market deadline reached]
                    │
                    ▼
TEE verifies deadline → releases decryption keys
                    │
                    ▼
All positions decrypted simultaneously → payouts distributed
```

> **MVP Note:** `_verifyTeeAttestation` in [`PositionVault.sol`](contracts/src/PositionVault.sol) is a functional stub returning `true` for any non-empty bytes — marked with `// TODO: integrate 0G TEE SDK`. The encryption/decryption flow is fully implemented; the on-chain attestation verification is the integration point for production.

**Problem it solves:** On Polymarket, every bet is a public on-chain transaction. Large players monitor the mempool and front-run large bets. Sealed positions mean the direction and size of every bet are invisible to all participants — including the market maker — until the moment of simultaneous reveal at resolution.

---

## 4. Smart Contract Architecture

Five contracts deployed on 0G Chain:

### [`ProphetFactory.sol`](contracts/src/ProphetFactory.sol)
Deploys new `MarketContract` instances and maintains the global market registry. Emits `MarketCreated` events that the oracle and market maker agents listen for.

```solidity
function createMarket(
    string calldata question,
    uint256 deadline,
    string[] calldata resolutionSources,
    address oracleAgent,
    address marketMakerAgent
) external returns (address marketContract);
```

### [`MarketContract.sol`](contracts/src/MarketContract.sol)
Core contract for each individual prediction market. Manages the full lifecycle from `Open` → `PendingResolution` → `Challenged` → `Resolved`. Holds USDT collateral. All amounts use **6 decimal places** (`100 USDT = 100_000_000`).

```solidity
function placeBet(bytes calldata encryptedPosition) external;
function postResolution(bool verdict, bytes32 reasoningHash) external onlyOracle;
function challengeResolution() external;
function finalizeResolution() external;
```

### [`PositionVault.sol`](contracts/src/PositionVault.sol)
Stores encrypted position commitments. Integrates with TEE for decryption at resolution. Prevents any position from being read before the market deadline is verified on-chain.

### [`LiquidityPool.sol`](contracts/src/LiquidityPool.sol)
The market maker agent's on-chain liquidity reserve. Allocates USDT to new markets using a tier-based system (Seed/Low/Medium/High allocation tiers). The agent wallet address is [`0x2e5d8B56F9B4770a88794a47C32c177542d2f6ea`](https://chainscan-galileo.0g.ai/address/0x2e5d8B56F9B4770a88794a47C32c177542d2f6ea).

### Interfaces
All contract interfaces are in [`contracts/src/interfaces/`](contracts/src/interfaces/) — useful for external integrations.

### Tests
Full test suites in [`contracts/test/`](contracts/test/):
- [`ProphetFactory.t.sol`](contracts/test/ProphetFactory.t.sol)
- [`MarketContract.t.sol`](contracts/test/MarketContract.t.sol)
- [`PositionVault.t.sol`](contracts/test/PositionVault.t.sol)
- [`LiquidityPool.t.sol`](contracts/test/LiquidityPool.t.sol)

---

## 5. AI Oracle — How Resolution Works

The oracle is Prophet's core differentiator. It runs fully autonomously on 0G Compute.

**Entry point:** [`agent/src/oracle/index.ts`](agent/src/oracle/index.ts)

**Resolution sequence:**

1. Oracle listens for `ResolutionTriggered` events via [`agent/src/shared/chain.ts`](agent/src/shared/chain.ts)
2. Pulls market metadata from 0G Storage KV (`market:{address}:metadata`)
3. Calls 0G Compute with a structured prompt (see [`agent/src/shared/compute.ts`](agent/src/shared/compute.ts)):
   ```
   Market Question: "{question}"
   Resolution Criteria: resolves YES if described event occurred before deadline.
   Approved sources: {sources}
   → Returns: { verdict, confidence, reasoning, evidenceSummary, sourcesChecked }
   ```
4. Writes full reasoning to 0G Storage **Log Layer** (`market:{address}:resolution`) — permanent, tamper-proof
5. Posts verdict on-chain via `MarketContract.postResolution(verdict, reasoningHash)`
6. The `reasoningHash` on-chain is verifiably linked to the 0G Storage content — anyone can retrieve and check it

**Confidence threshold:** If confidence < 70%, oracle returns `INCONCLUSIVE` and the market enters a dispute window.

**Challenge mechanism:** Any user can challenge a resolution within 24 hours by staking 5% of the market pool. A challenge triggers a second, stricter oracle call. If upheld, the challenger earns the oracle agent's fee. If rejected, the challenger loses their stake. This creates economic incentives for oracle accuracy without a human committee.

**Frontend display:** Oracle reasoning is surfaced in the UI via [`frontendV2/src/lib/hooks/use-oracle-reasoning.ts`](frontendV2/src/lib/hooks/use-oracle-reasoning.ts) and rendered on the Oracle page at [`frontendV2/src/app/(dashboard)/oracle/page.tsx`](frontendV2/src/app/(dashboard)/oracle/page.tsx).

---

## 6. Core Flows

### Market Creation
```
User submits question
→ 0G Compute: LLM validates (unambiguous? resolvable?) [validate-question/route.ts]
→ 0G Chain: ProphetFactory.createMarket() [ProphetFactory.sol]
→ 0G Storage (KV): Write market metadata [storage.ts]
→ Market Maker Agent wakes up, reads new market [market-maker/index.ts]
→ 0G Compute: Generate opening YES/NO probability [compute.ts]
→ 0G Chain: Post opening price quotes — market is now live
```

### Placing a Bet (Sealed Position)
```
User selects YES/NO + amount
→ TEE encrypt position [bet-encryption.ts]
→ 0G Chain: PositionVault.commitPosition(encryptedPayload) [PositionVault.sol]
→ Public chain sees: commitment hash + USDT locked — direction/size invisible
→ Market maker adjusts spread based on aggregate volume (not individual positions)
```

### Oracle Resolution
```
0G Chain: deadline block → MarketContract emits ResolutionTriggered
→ Oracle Agent: pulls metadata from 0G Storage KV [oracle/index.ts]
→ 0G Compute: LLM reads approved sources, synthesizes verdict [compute.ts]
→ 0G Storage (Log): Write full reasoning permanently [storage.ts]
→ 0G Chain: postResolution(verdict, reasoningHash) → 24h challenge window
→ [No challenge] → finalizeResolution() → TEE releases decryption keys
→ All positions decrypted simultaneously → USDT distributed to winners
```

**Fee structure:**
- 1% → Oracle agent (incentive to resolve accurately)
- 1% → Market maker agent (incentive to maintain liquidity)
- 0.5% → Protocol treasury

---

## 7. Deployed Contracts

**Network:** 0G Galileo Testnet — Chain ID `16602`
**RPC:** `https://evmrpc-testnet.0g.ai`
**Explorer:** `https://chainscan-galileo.0g.ai`

| Contract | Address | Explorer |
|---|---|---|
| `ProphetFactory` | `0xCEd9B4405b9B7d09f6b7d44e6bA113EcF2627333` | [View](https://chainscan-galileo.0g.ai/address/0xCEd9B4405b9B7d09f6b7d44e6bA113EcF2627333) |
| `PositionVault` | `0x3f831E170f828DB2711403c6C3AD80e6fB02da75` | [View](https://chainscan-galileo.0g.ai/address/0x3f831E170f828DB2711403c6C3AD80e6fB02da75) |
| `LiquidityPool` | `0x1A39bD969870e71d22A10b38F2845baBB56649A4` | [View](https://chainscan-galileo.0g.ai/address/0x1A39bD969870e71d22A10b38F2845baBB56649A4) |
| `PayoutDistributor` | `0x0d979Db2cDda3D2f35FDFAb5883F97De40760054` | [View](https://chainscan-galileo.0g.ai/address/0x0d979Db2cDda3D2f35FDFAb5883F97De40760054) |
| `Mock USDT` | `0xc2B0D2A7e858F13B349843fF87dBF4EBF9227F49` | [View](https://chainscan-galileo.0g.ai/address/0xc2B0D2A7e858F13B349843fF87dBF4EBF9227F49) |

**Deployment script:** [`contracts/script/Deploy.s.sol`](contracts/script/Deploy.s.sol)

**Live on-chain activity:** The factory has deployed multiple markets. You can verify oracle resolutions by looking up the `reasoningHash` emitted in `ResolutionPosted` events and retrieving the corresponding JSON from 0G Storage.

---

## 8. Local Setup & Deployment

### 8.1 Prerequisites

```bash
# Foundry (for smart contracts)
curl -L https://foundry.paradigm.xyz | bash
foundryup
forge --version   # should print forge 0.x.x

# Node.js >= 18
node --version

# Clone the repo
git clone https://github.com/JamesVictor-O/Prophet
cd Prophet
```

---

### 8.2 1. Smart Contracts

```bash
cd contracts

# Install OpenZeppelin and other dependencies
forge install

# Compile all contracts (must complete with 0 errors)
forge build

# Run the full test suite
forge test -vvv

# Check contract sizes (all must be under 24KB)
forge build --sizes
```

**Deploy to 0G Galileo testnet:**

```bash
# Set environment variables
export PRIVATE_KEY=<your_deployer_wallet_private_key>

# Deploy all contracts in one script
forge script script/Deploy.s.sol \
  --rpc-url https://evmrpc-testnet.0g.ai \
  --broadcast \
  --chain-id 16602

# The script prints all deployed addresses — copy them for the next steps
```

> **Gas token:** You need 0G tokens for gas. See [Section 9](#9-testnet-setup--faucet) for the faucet.

---

### 8.3 2. Agent (Oracle + Market Maker)

```bash
cd agent

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
```

Edit `.env`:
```bash
# Wallets
PRIVATE_KEY_ORACLE=<oracle_agent_private_key>
PRIVATE_KEY_MM=<market_maker_private_key>

# 0G Network
OG_CHAIN_RPC=https://evmrpc-testnet.0g.ai
OG_INDEXER_RPC=https://indexer-storage-testnet-turbo.0g.ai   # use turbo, not standard

# Deployed contract addresses (from step 1)
PROPHET_FACTORY_ADDRESS=0xCEd9B4405b9B7d09f6b7d44e6bA113EcF2627333
POSITION_VAULT_ADDRESS=0x3f831E170f828DB2711403c6C3AD80e6fB02da75
LIQUIDITY_POOL_ADDRESS=0x1A39bD969870e71d22A10b38F2845baBB56649A4

# 0G Compute provider (Qwen 2.5 7B on testnet)
COMPUTE_PROVIDER_ADDRESS=0xa48f01...

# Market maker repricing interval (milliseconds)
REPRICE_INTERVAL_MS=60000
```

```bash
# Test 0G Compute connection
npm run ts-node src/scripts/test-compute.ts

# Test 0G Storage connection
npm run ts-node src/scripts/test-storage.ts

# Run oracle agent
npm run oracle

# Run market maker agent (separate terminal)
npm run market-maker
```

**Agent source files:**
- Oracle: [`agent/src/oracle/index.ts`](agent/src/oracle/index.ts)
- Market Maker: [`agent/src/market-maker/index.ts`](agent/src/market-maker/index.ts)
- 0G Storage helpers: [`agent/src/shared/storage.ts`](agent/src/shared/storage.ts)
- 0G Compute helpers: [`agent/src/shared/compute.ts`](agent/src/shared/compute.ts)
- Chain helpers: [`agent/src/shared/chain.ts`](agent/src/shared/chain.ts)

---

### 8.4 3. Frontend

```bash
cd frontendV2

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env.local
```

Edit `.env.local`:
```bash
# 0G Network
NEXT_PUBLIC_CHAIN_ID=16602
NEXT_PUBLIC_RPC_URL=https://evmrpc-testnet.0g.ai

# Deployed contracts (from step 1)
NEXT_PUBLIC_FACTORY_ADDRESS=0xCEd9B4405b9B7d09f6b7d44e6bA113EcF2627333
NEXT_PUBLIC_POSITION_VAULT_ADDRESS=0x3f831E170f828DB2711403c6C3AD80e6fB02da75
NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS=0x1A39bD969870e71d22A10b38F2845baBB56649A4
NEXT_PUBLIC_USDT_ADDRESS=0xc2B0D2A7e858F13B349843fF87dBF4EBF9227F49

# 0G Storage (server-side, for API routes)
OG_INDEXER_RPC=https://indexer-storage-testnet-turbo.0g.ai
OG_CHAIN_RPC=https://evmrpc-testnet.0g.ai

# Oracle agent address (for displaying oracle data)
NEXT_PUBLIC_ORACLE_AGENT_ADDRESS=<oracle_agent_wallet_address>
```

```bash
# Start dev server
npm run dev
# → http://localhost:3000

# Type check
npm run type-check

# Production build
npm run build
```

**Key frontend pages:**
- Markets list: [`frontendV2/src/app/(dashboard)/markets/page.tsx`](frontendV2/src/app/(dashboard)/markets/page.tsx)
- Individual market + trading: [`frontendV2/src/app/market/[id]/page.tsx`](frontendV2/src/app/market/[id]/page.tsx)
- Oracle reasoning viewer: [`frontendV2/src/app/(dashboard)/oracle/page.tsx`](frontendV2/src/app/(dashboard)/oracle/page.tsx)
- Create market: [`frontendV2/src/app/(dashboard)/_components/create-market-modal.tsx`](frontendV2/src/app/(dashboard)/_components/create-market-modal.tsx)
- Liquidity pool: [`frontendV2/src/app/(dashboard)/liquidity/page.tsx`](frontendV2/src/app/(dashboard)/liquidity/page.tsx)
- Built-in faucet: [`frontendV2/src/app/(dashboard)/faucet/page.tsx`](frontendV2/src/app/(dashboard)/faucet/page.tsx)

---

## 9. Testnet Setup & Faucet

### Step 1 — Add 0G Galileo to MetaMask

| Field | Value |
|---|---|
| Network Name | 0G Galileo Testnet |
| RPC URL | `https://evmrpc-testnet.0g.ai` |
| Chain ID | `16602` |
| Currency Symbol | `0G` |
| Block Explorer | `https://chainscan-galileo.0g.ai` |

Or add it automatically at [https://chainlist.org/?search=0g](https://chainlist.org/?search=0g).

### Step 2 — Get 0G Gas Tokens

Go to the 0G faucet: **[https://faucet.0g.ai](https://faucet.0g.ai)**

- Connect your wallet or paste your address
- Request testnet 0G tokens (used for gas)
- You need at least two funded wallets: one for the oracle agent and one for the market maker agent

### Step 3 — Get Mock USDT

Prophet uses USDT as collateral. The mock USDT contract is deployed at `0xc2B0D2A7e858F13B349843fF87dBF4EBF9227F49`.

**Option A — Use the built-in faucet in the app:**
Navigate to the Faucet page in the frontend (`/faucet`) — it calls [`frontendV2/src/app/api/faucet/route.ts`](frontendV2/src/app/api/faucet/route.ts) to mint 1,000 USDT to your address.

**Option B — Mint directly via cast:**
```bash
cast send 0xc2B0D2A7e858F13B349843fF87dBF4EBF9227F49 \
  "mint(address,uint256)" \
  <your_address> 1000000000 \
  --rpc-url https://evmrpc-testnet.0g.ai \
  --private-key <your_private_key>
# 1000000000 = 1,000 USDT (6 decimals)
```

### Step 4 — Verify Setup

```bash
# Check your 0G balance
cast balance <your_address> --rpc-url https://evmrpc-testnet.0g.ai

# Check your USDT balance
cast call 0xc2B0D2A7e858F13B349843fF87dBF4EBF9227F49 \
  "balanceOf(address)" <your_address> \
  --rpc-url https://evmrpc-testnet.0g.ai
```

---

## 10. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Smart contracts | Solidity + Foundry | `^0.8.20` / `forge 0.x` |
| Contract libraries | OpenZeppelin | `^5.0.0` |
| Blockchain | 0G Chain (EVM L1) | Chain ID 16602 |
| Decentralized storage | `@0gfoundation/0g-storage-ts-sdk` | latest |
| AI inference | `@0glabs/0g-serving-broker` + OpenAI API | latest |
| Privacy | 0G TEE Sealed Inference | (stub for MVP) |
| Agent runtime | Node.js + TypeScript | >= 18 |
| Agent blockchain lib | ethers.js | v6 |
| Frontend framework | Next.js (App Router) | 14 |
| Frontend language | TypeScript | 5 |
| Wallet integration | wagmi v2 + viem + RainbowKit | v2 |
| Frontend styling | Tailwind CSS | v3 |
| Contract interaction | wagmi hooks + viem | v2 |

---

## 11. Hackathon Track

**Primary: Track 2 — Agentic Trading Arena (Verifiable Finance)**
**Event:** 0G APAC Hackathon 2026 on HackQuest | **Deadline:** May 9, 2026

| Track 2 Requirement | Prophet Implementation | Code |
|---|---|---|
| Autonomous financial logic | AI oracle + AI market maker — zero human intervention | [`oracle/index.ts`](agent/src/oracle/index.ts), [`market-maker/index.ts`](agent/src/market-maker/index.ts) |
| Sealed inference for privacy | TEE-encrypted positions until resolution | [`PositionVault.sol`](contracts/src/PositionVault.sol), [`bet-encryption.ts`](frontendV2/src/lib/bet-encryption.ts) |
| Front-running mitigation | Positions invisible until simultaneous reveal at close | [`PositionVault.sol`](contracts/src/PositionVault.sol) |
| Verifiable execution | Oracle reasoning stored permanently on 0G Storage | [`storage.ts`](agent/src/shared/storage.ts), [`use-oracle-reasoning.ts`](frontendV2/src/lib/hooks/use-oracle-reasoning.ts) |
| AI-driven strategy agents | Market maker reprices continuously via 0G Compute | [`compute.ts`](agent/src/shared/compute.ts), [`market-maker/index.ts`](agent/src/market-maker/index.ts) |

---

## 12. Roadmap

### Hackathon MVP (Weeks 1–6) ✓
- [x] Core smart contracts deployed on 0G Galileo testnet
- [x] 0G Storage integration for market metadata and oracle reasoning
- [x] 0G Compute integration for oracle resolution and market maker repricing
- [x] TEE sealed position vault (encrypt + commit flow)
- [x] Oracle agent with autonomous market resolution
- [x] Market maker agent with tier-based liquidity allocation
- [x] Full frontend — browse markets, place bets, view oracle reasoning

### Post-Hackathon V1
- [ ] Multi-category markets (Sports, Politics, Finance)
- [ ] Full challenge and dispute system with staking
- [ ] Human liquidity provider pools
- [ ] Oracle reputation scoring dashboard
- [ ] 0G mainnet deployment

### V2
- [ ] Cross-chain market creation (create on Ethereum, settle on 0G)
- [ ] Conditional markets
- [ ] Prophet governance token for source registry management
- [ ] SDK for third-party integrations

---

## Contributing

Prophet is being built in public as part of the 0G APAC Hackathon 2026.

Follow the build journey: `#0GHackathon` `#BuildOn0G` `@0G_labs` `@0g_CN` `@0g_Eco` `@HackQuest_`

---

## License

MIT

---

*Built with 0G Labs infrastructure. Powered by the belief that opinions should be tradable — privately, fairly, and autonomously.*

*0G APAC Hackathon 2026 — Track 2: Agentic Trading Arena (Verifiable Finance)*
