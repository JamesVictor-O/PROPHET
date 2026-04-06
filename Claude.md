# CLAUDE.md — Prophet Developer Bible

> You are working on **Prophet** — an AI-native, privacy-preserving prediction market built on 0G Labs infrastructure.
> This file is your single source of truth. Read it completely before writing a single line of code.
> When in doubt, come back here first.

---

## Who You Are Working For

You are working for a solo builder competing in the **0G APAC Hackathon 2026** on HackQuest.
The submission deadline is **May 9, 2026**.
The prize pool is **$150,000**.
Prophet is entered under **Track 2 — Agentic Trading Arena (Verifiable Finance)**.

This is not a toy project. Every decision you make should be made with the mindset of:
1. Does this work end-to-end for a demo?
2. Does this deeply integrate 0G Labs infrastructure?
3. Would a judge be impressed by this?

---

## The One-Line Pitch

> Prophet is the first prediction market where positions are sealed until resolution, markets are resolved by an AI oracle — not a human committee — and liquidity is provided by an autonomous agent, 24/7.

Keep this in your head at all times. Every feature you build either serves this pitch or it doesn't belong in the MVP.

---

## Project Structure

```
PROPHET/
├── CLAUDE.md                          ← you are here
├── README.md                          ← project overview (public facing)
├── frontend/                          ← Next.js frontend
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── public/
├── contracts/                         ← Foundry smart contracts
│   ├── src/
│   │   ├── ProphetFactory.sol
│   │   ├── MarketContract.sol
│   │   ├── PositionVault.sol
│   │   ├── PayoutDistributor.sol
│   │   ├── interfaces/
│   │   │   ├── IMarketContract.sol
│   │   │   ├── IPositionVault.sol
│   │   │   ├── IPayoutDistributor.sol
│   │   │   └── IProphetFactory.sol
│   │   └── libraries/
│   │       ├── MarketLib.sol
│   │       └── FeeLib.sol
│   ├── test/
│   ├── script/
│   │   └── Deploy.s.sol
│   ├── lib/
│   │   ├── forge-std/
│   │   └── openzeppelin-contracts/
│   └── foundry.toml
└── agent/                             ← Node.js oracle + market maker agents
    ├── oracle/
    ├── market-maker/
    ├── shared/
    └── package.json
```

---

## The Tech Stack — Know It Cold

### Blockchain
- **Network:** 0G Chain (EVM-compatible Layer 1)
- **Testnet:** Galileo — Chain ID `16601`, RPC `https://evmrpc-testnet.0g.ai`
- **Mainnet:** Chain ID `16600`, RPC `https://evmrpc.0g.ai`
- **Explorer:** `https://chainscan-galileo.0g.ai` (testnet)
- **Token:** $0G for gas, USDT for all collateral and payouts

### Smart Contracts
- **Language:** Solidity `^0.8.20`
- **Framework:** Foundry (forge, cast, anvil)
- **Libraries:** OpenZeppelin `^5.0.0`
- **All contracts are in** `contracts/src/`

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Wallet:** wagmi v2 + viem + RainbowKit
- **Styling:** Tailwind CSS
- **State:** React Query (TanStack Query) for contract reads

### Agent (Off-chain)
- **Runtime:** Node.js >= 18
- **Language:** TypeScript
- **0G Compute SDK:** `@0glabs/0g-serving-broker`
- **0G Storage SDK:** `@0glabs/0g-ts-sdk`
- **Blockchain:** ethers.js v6
- **AI Model:** `deepseek-chat-v3-0324` on 0G Compute (testnet: `qwen-2.5-7b-instruct`)

---

## 0G Labs Infrastructure — What We Use and Why

This is critical. Every time you integrate something, it must touch at least one 0G module.
Judges specifically evaluate **depth of 0G integration**.

### 0G Chain
**What it is:** EVM-compatible L1 blockchain. 11,000 TPS, sub-second finality.
**What Prophet uses it for:** All smart contracts live here. Every bet, resolution, and payout is a transaction on 0G Chain.
**Why not Ethereum:** Gas would make the oracle economically unviable. 0G Chain gas is cents.
**Docs:** `https://docs.0g.ai/concepts/chain`

### 0G Storage
**What it is:** Decentralized storage with two layers — Log (immutable) and KV (mutable).
**What Prophet uses it for:**
- **KV Layer:** Market metadata, oracle working memory, market maker state, live price quotes
- **Log Layer:** Oracle reasoning chains (permanent, tamper-proof), payout records, audit logs
**Why it matters:** Without permanent storage of oracle reasoning, there's no accountability. The oracle's track record IS the product.
**SDK:** `@0glabs/0g-ts-sdk`
**Docs:** `https://docs.0g.ai/concepts/storage`

### 0G Compute
**What it is:** Decentralized GPU marketplace. Pay-per-use AI inference. OpenAI-compatible API.
**What Prophet uses it for:**
- Question validation and classification (lightweight)
- Oracle market resolution (primary — DeepSeek V3)
- Market maker repricing (continuous)
**Testnet model:** `qwen-2.5-7b-instruct` at `0xa48f01...`
**Mainnet model:** `deepseek-chat-v3-0324` at `0x1B3AAe...`
**SDK:** `@0glabs/0g-serving-broker`
**Docs:** `https://docs.0g.ai/developer-hub/building-on-0g/compute-network/overview`

### TEE Sealed Inference
**What it is:** Trusted Execution Environment — hardware-level privacy for AI inference.
**What Prophet uses it for:** Encrypting user bet positions. Nobody — not even the chain — can see direction or amount until all positions are revealed simultaneously at resolution.
**Why it matters:** This is the feature that makes Prophet fundamentally different from Polymarket. Positions are hidden → no front-running → sophisticated capital participates → better price discovery.
**Implementation note:** TEE verification functions in contracts are stubs for MVP (`_verifyTeeAttestation`). Mark clearly with `// TODO: integrate 0G TEE SDK`.

### 0G DA (Data Availability)
**What it is:** Proves data is accessible and unmodified in real time.
**What Prophet uses it for:** Indirectly — underpins 0G Chain's security. Every Prophet transaction is backed by DA guarantees. We do not call DA directly.
**Docs:** `https://docs.0g.ai/concepts/da`

---

## Smart Contracts — Complete Reference

> **Full spec lives in:** `contracts/SMART_CONTRACTS.md`
> Read that file before touching any contract code.

### The Four Contracts

| Contract | File | Purpose |
|---|---|---|
| `ProphetFactory` | `src/ProphetFactory.sol` | Deploys markets, maintains registry |
| `MarketContract` | `src/MarketContract.sol` | Per-market lifecycle, holds collateral |
| `PositionVault` | `src/PositionVault.sol` | Sealed position storage and TEE reveal |
| `PayoutDistributor` | `src/PayoutDistributor.sol` | Calculates and distributes winner payouts |

### Deployment Order

```
1. Deploy ProphetFactory    (needs: USDT, oracleAgent, marketMakerAgent, treasury)
2. Deploy PositionVault     (needs: factory, oracleAgent, USDT, payoutDistributor*)
3. Deploy PayoutDistributor (needs: factory, positionVault, oracleAgent, mmAgent, treasury, USDT)
4. Call factory.setVaultAndDistributor(vaultAddress, distributorAddress)
```

*Note: PositionVault needs PayoutDistributor address but PayoutDistributor needs PositionVault address. Solve this by deploying a placeholder or updating after both are deployed. See `script/Deploy.s.sol`.

### Key Contract Rules — Never Violate These

1. **All USDT amounts use 6 decimal places.** `100 USDT = 100_000_000`. Never assume 18 decimals.
2. **Checks-effects-interactions pattern always.** State changes happen BEFORE external calls.
3. **`_verifyTeeAttestation` is a stub.** It returns true for any non-empty bytes. Never remove the TODO comment.
4. **The oracle agent address is immutable per market.** Set at deployment. Cannot change.
5. **`hasDistributed` mapping prevents double distribution.** Never bypass this check.
6. **`SafeERC20` for all token transfers.** Never use raw `transfer()` or `transferFrom()`.

### Build and Test Commands

```bash
# From contracts/ directory

# Build all contracts
forge build

# Run all tests
forge test

# Run tests with verbose output
forge test -vvv

# Run a specific test file
forge test --match-path test/MarketContract.t.sol -vvv

# Deploy to testnet
forge script script/Deploy.s.sol --rpc-url og_testnet --broadcast --verify

# Check contract size (must be under 24KB)
forge build --sizes

# Format code
forge fmt

# Get gas report
forge test --gas-report
```

---

## Agent Architecture — The AI Layer

The agent is a Node.js service that runs off-chain and interacts with both 0G infrastructure and the smart contracts. It has two components:

### Oracle Agent (`agent/oracle/`)

**What it does:**
1. Listens for `ResolutionTriggered` events on 0G Chain
2. Reads market metadata from 0G Storage KV
3. Calls 0G Compute (DeepSeek V3) with a structured oracle prompt
4. Writes full reasoning to 0G Storage Log Layer
5. Posts verdict on-chain via `MarketContract.postResolution()`
6. Listens for `ResolutionChallenged` events — runs second inference if needed
7. Listens for `ResolutionFinalized` events — triggers TEE position reveal
8. Submits `PositionVault.revealPositions()` with decrypted positions

**Key file:** `agent/oracle/index.ts`

**0G Compute call structure:**
```typescript
const systemPrompt = `You are a decentralized prediction market oracle.
Your job is to determine the outcome of prediction markets based on evidence.
You must be objective, cite your sources, and provide a confidence score.
Respond ONLY in valid JSON. No preamble, no markdown, no explanation outside JSON.`;

const userPrompt = `
Market Question: "${question}"
Resolution Deadline: ${deadline}
Resolution Criteria: The question resolves YES if the described event occurred before the deadline.

Approved data sources to check:
${sources.join('\n')}

Today's date: ${new Date().toISOString()}

Respond with this exact JSON structure:
{
  "verdict": true or false,
  "confidence": 0-100,
  "reasoning": "Full explanation of your decision",
  "evidenceSummary": "Brief summary of evidence found",
  "sourcesChecked": ["source1", "source2"],
  "inconclusiveReason": "Only if verdict is INCONCLUSIVE"
}

If you cannot determine the outcome with >70% confidence, set verdict to null and explain in inconclusiveReason.
`;
```

### Market Maker Agent (`agent/market-maker/`)

**What it does:**
1. Listens for `MarketCreated` events
2. Generates initial YES/NO price estimate using 0G Compute
3. Posts opening price quotes on-chain
4. Monitors active markets and reprices periodically
5. Adjusts spreads based on volume signals from 0G Storage KV

**Key file:** `agent/market-maker/index.ts`

### Shared Utilities (`agent/shared/`)

```
agent/shared/
├── storage.ts      ← 0G Storage read/write helpers
├── compute.ts      ← 0G Compute inference helpers  
├── chain.ts        ← ethers.js contract interaction helpers
├── logger.ts       ← structured logging
└── types.ts        ← shared TypeScript types
```

### Agent Setup

```bash
# From agent/ directory

# Install dependencies
npm install

# Copy and fill environment variables
cp .env.example .env

# Run oracle agent
npm run oracle

# Run market maker agent
npm run market-maker

# Run both
npm run start
```

### Agent Environment Variables

```bash
# .env in agent/
PRIVATE_KEY_ORACLE=           # Oracle agent wallet private key
PRIVATE_KEY_MM=               # Market maker agent wallet private key
OG_CHAIN_RPC=https://evmrpc-testnet.0g.ai
OG_INDEXER_RPC=               # 0G Storage indexer RPC (from docs)
PROPHET_FACTORY_ADDRESS=      # Deployed ProphetFactory address
POSITION_VAULT_ADDRESS=       # Deployed PositionVault address

# 0G Compute provider address for DeepSeek V3 (testnet: Qwen)
COMPUTE_PROVIDER_ADDRESS=0x1B3AAe...

# How often market maker reprices (milliseconds)
REPRICE_INTERVAL_MS=60000
```

---

## Frontend Architecture

### Pages

```
app/
├── page.tsx                    ← Home — browse all markets
├── market/[address]/
│   └── page.tsx                ← Individual market view
├── create/
│   └── page.tsx                ← Create new market
└── profile/
    └── page.tsx                ← User's markets and positions
```

### Key Components

```
components/
├── MarketCard.tsx              ← Market preview card (used on home page)
├── MarketDetail.tsx            ← Full market view with bet interface
├── BetModal.tsx                ← Bet placement UI with encryption notice
├── CreateMarketForm.tsx        ← Market creation form
├── OracleReasoning.tsx         ← Displays oracle's reasoning from 0G Storage
├── MarketStatusBadge.tsx       ← Visual status indicator
├── PriceBar.tsx                ← YES/NO price visualization
└── CountdownTimer.tsx          ← Time remaining to deadline
```

### Hooks

```
hooks/
├── useMarkets.ts               ← Read all markets from ProphetFactory
├── useMarket.ts                ← Read single market state
├── usePlaceBet.ts              ← Bet placement with TEE encryption
├── useOracleReasoning.ts       ← Fetch reasoning from 0G Storage
└── useEstimatedPayout.ts       ← Read estimated payout from PayoutDistributor
```

### Wagmi Configuration

```typescript
// lib/wagmi.ts
import { createConfig, http } from 'wagmi'
import { defineChain } from 'viem'

export const ogTestnet = defineChain({
  id: 16601,
  name: '0G Galileo Testnet',
  nativeCurrency: { name: '0G', symbol: '0G', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://evmrpc-testnet.0g.ai'] }
  },
  blockExplorers: {
    default: {
      name: '0G ChainScan',
      url: 'https://chainscan-galileo.0g.ai'
    }
  },
  testnet: true
})

export const config = createConfig({
  chains: [ogTestnet],
  transports: { [ogTestnet.id]: http() }
})
```

### Frontend Commands

```bash
# From frontend/ directory

# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Type check
npm run type-check
```

---

## 0G Storage Key Structure

This is the exact key structure the agent uses. Frontend reads from these same keys.

```
KV Layer (live, mutable)
────────────────────────────────────────────────────────────────
market:{contractAddress}:metadata
  → { question, deadline, category, sources, status, createdAt }

market:{contractAddress}:prices
  → { yesPrice, noPrice, lastUpdated, volume24h }

agent:oracle:working:{contractAddress}
  → { stage, evidenceGathered, sourcesChecked, startedAt }

agent:mm:state
  → { activeMarkets: [{address, yesPrice, noPrice}], lastRun }

Log Layer (permanent, immutable)
────────────────────────────────────────────────────────────────
market:{contractAddress}:resolution
  → { verdict, confidence, reasoning, sourcesChecked, timestamp, txHash }

market:{contractAddress}:payout
  → { outcome, winnerCount, totalDistributed, fees, timestamp, txHash }

oracle:history:{contractAddress}
  → { wasChallengeFiled, challengeOutcome, finalVerdict, resolvedAt }
```

**Root hash pattern:** When you upload to 0G Storage, save the root hash. That hash is what goes on-chain and what users reference to retrieve data.

```typescript
// Writing to 0G Storage
const { ZgFile, Indexer } = require('@0glabs/0g-ts-sdk');

async function writeToStorage(data: object, signer: ethers.Wallet) {
  const indexer = new Indexer(process.env.OG_INDEXER_RPC);
  const buffer  = Buffer.from(JSON.stringify(data));
  const file    = await ZgFile.fromBuffer(buffer, 'application/json');
  const [tx, err] = await indexer.upload(file, process.env.OG_CHAIN_RPC, signer);
  if (err) throw new Error(`Storage upload failed: ${err}`);
  return tx; // This is your root hash — store this on-chain
}

// Reading from 0G Storage
async function readFromStorage(rootHash: string) {
  const indexer = new Indexer(process.env.OG_INDEXER_RPC);
  const [buffer, err] = await indexer.download(rootHash, process.env.OG_CHAIN_RPC);
  if (err) throw new Error(`Storage download failed: ${err}`);
  return JSON.parse(buffer.toString());
}
```

---

## 0G Compute Integration

```typescript
// agent/shared/compute.ts
import { createZGServingNetworkBroker } from '@0glabs/0g-serving-broker';
import OpenAI from 'openai';
import { ethers } from 'ethers';

export async function callOracleInference(
  prompt: string,
  signer: ethers.Wallet
): Promise<OracleResponse> {
  const broker = await createZGServingNetworkBroker(signer);

  // Get provider endpoint
  const providerAddress = process.env.COMPUTE_PROVIDER_ADDRESS;
  const { endpoint, model } = await broker.getServiceMetadata(providerAddress);

  // Verify TEE attestation before trusting provider
  await broker.verifyService(providerAddress);

  // Call inference — OpenAI compatible
  const client = new OpenAI({ baseURL: endpoint, apiKey: '' });

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: ORACLE_SYSTEM_PROMPT },
      { role: 'user',   content: prompt }
    ],
    temperature: 0.1,  // Low temperature for deterministic oracle decisions
    max_tokens: 1000
  });

  const raw = response.choices[0].message.content;

  // Parse JSON response
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`Oracle returned invalid JSON: ${raw}`);
  }
}
```

---

## Event Listening Pattern

The agent listens for on-chain events and reacts. This is the core loop:

```typescript
// agent/shared/chain.ts
import { ethers } from 'ethers';

export function listenForEvents(
  contract: ethers.Contract,
  eventName: string,
  handler: (...args: any[]) => Promise<void>
) {
  contract.on(eventName, async (...args) => {
    const event = args[args.length - 1]; // Last arg is always the event object
    console.log(`[EVENT] ${eventName} at block ${event.blockNumber}`);

    try {
      await handler(...args);
    } catch (err) {
      console.error(`[ERROR] Handler for ${eventName} failed:`, err);
      // Never crash the listener — log and continue
    }
  });

  console.log(`[AGENT] Listening for ${eventName}...`);
}

// Usage in oracle agent
listenForEvents(
  factoryContract,
  'ResolutionTriggered',
  async (marketAddress, timestamp, event) => {
    await oracleAgent.handleResolutionTriggered(marketAddress);
  }
);
```

---

## The MVP Scope — What to Build for the Hackathon

Do not build everything at once. Build in this order and demo at each stage.

### Phase 1 — Contracts (Week 1-2)
- [ ] All four contracts compile with `forge build`
- [ ] Deploy to 0G Galileo testnet
- [ ] Basic test suite passes (`forge test`)
- [ ] `createMarket` works end-to-end on testnet
- [ ] `placeBet` accepts encrypted commitments
- [ ] `postResolution` and `finalizeResolution` flow works
- [ ] `distributePayout` sends USDT to winners

### Phase 2 — Oracle Agent (Week 2-3)
- [ ] Agent connects to 0G Chain and listens for events
- [ ] 0G Compute integration works (test with a simple question)
- [ ] Oracle resolves a market end-to-end on testnet
- [ ] Reasoning written to 0G Storage
- [ ] `verdictReasoningHash` verifiably matches 0G Storage content

### Phase 3 — Frontend (Week 3-4)
- [ ] Wallet connection on 0G testnet
- [ ] Browse all markets
- [ ] Create a market (form → contract)
- [ ] Place a bet (encrypted commitment)
- [ ] View oracle reasoning from 0G Storage
- [ ] See payout after resolution

### Phase 4 — Polish (Week 5-6)
- [ ] Market maker agent providing initial liquidity
- [ ] Challenge flow working end-to-end
- [ ] Clean UI — no broken states
- [ ] Full demo video recorded (3 minutes max)
- [ ] README finalized
- [ ] X post published with #0GHackathon #BuildOn0G
- [ ] Submit on HackQuest before May 9, 2026

---

## Submission Requirements Checklist

These are mandatory per the hackathon rules. Do not forget any of them.

- [ ] **0G mainnet contract address** — deployed and verified
- [ ] **0G Explorer link** — showing real on-chain activity
- [ ] **Public GitHub repo** — with meaningful commit history (not one giant commit)
- [ ] **3-minute demo video** — shows full flow, not just slides
  - Must show: market creation, bet placement, oracle resolution, payout
  - Upload to YouTube or Loom — must be publicly accessible
- [ ] **README in English** — with architecture diagram, 0G module usage, local setup steps
- [ ] **Public X post** with `#0GHackathon` and `#BuildOn0G`
  - Must tag `@0G_labs @0g_CN @0g_Eco @HackQuest_`
  - Must include demo screenshot or clip

---

## Judging Criteria — How to Score Maximum Points

Judges evaluate on five dimensions. Here's how Prophet scores on each:

### 1. 0G Technical Integration Depth & Innovation (Most Important)
**What judges want:** Deep, non-superficial use of 0G modules. Not just deployed on 0G Chain — actually using Storage, Compute, and TEE.
**How Prophet wins this:**
- Oracle runs on 0G Compute → real inference, paid in $0G tokens
- Reasoning stored on 0G Storage Log Layer → permanently verifiable
- Market metadata in 0G Storage KV → fast agent reads
- TEE sealed positions → privacy primitive using 0G's unique stack
- Smart contracts on 0G Chain → sub-second finality on payouts

### 2. Technical Implementation & Completeness
**What judges want:** Working code. Full end-to-end flow. On-chain deployment with Explorer link.
**How Prophet wins this:**
- All four contracts deployed on 0G mainnet
- Full lifecycle works: create → bet → resolve → payout
- Clean Solidity — no obvious vulnerabilities
- Test suite in place

### 3. Product Value & Market Potential
**What judges want:** Real problem, real solution, real users.
**How Prophet wins this:**
- Prediction markets are a proven $1B+ category
- Oracle trust problem is genuinely unsolved
- TEE privacy angle is a real competitive moat
- Clear comparison to Polymarket (known reference)

### 4. User Experience & Demo Quality
**What judges want:** Clean demo, intuitive flow, convincing pitch.
**How Prophet wins this:**
- Simple frontend — create a market in under 30 seconds
- Clear display of oracle reasoning from 0G Storage
- Demo video shows all key flows without bugs
- Mini Demo Day at Hong Kong Web3 Festival (April 22) — prepare for this

### 5. Team Capability & Documentation
**What judges want:** Professional README, clean code, good commit history.
**How Prophet wins this:**
- This CLAUDE.md shows deep system thinking
- SMART_CONTRACTS.md shows contract-level rigor
- README.md is public-facing and polished
- Commit history shows progress over weeks (build in public)

---

## Common Pitfalls — Avoid These

**1. Empty or one-commit repo**
Judges check commit history. Commit small and often from day one. Every day you write code, commit it.

**2. Slides-only demo video**
The rules explicitly say "slide-only videos will not be accepted." Show the actual product running. Screen record everything.

**3. Contracts deployed but no on-chain activity**
The Explorer link must show actual transactions. Create at least one market, place at least one bet, resolve it. Do this on mainnet.

**4. 0G Storage/Compute used superficially**
Don't just mention 0G in the README. The oracle reasoning hash must actually be retrievable from 0G Storage. The inference call must actually go through 0G Compute. Judges will check.

**5. Missing the X post**
This is a mandatory requirement, not optional. Post it early and keep posting build updates. Judges and the 0G team monitor #0GHackathon.

**6. USDT decimal errors**
Always use `ethers.parseUnits("100", 6)` for 100 USDT — not `ethers.parseEther`. One wrong decimal and the whole financial system breaks.

**7. Forgetting `forge build` before deploying**
Always build cleanly before deploying. A failed deployment wastes testnet tokens and time.

---

## Where to Get Help

### Official 0G Documentation
- Main docs: `https://docs.0g.ai`
- Developer hub: `https://docs.0g.ai/developer-hub/getting-started`
- 0G Compute: `https://docs.0g.ai/developer-hub/building-on-0g/compute-network/overview`
- 0G Storage SDK: `https://docs.0g.ai/developer-hub/building-on-0g/storage/sdk`
- Deploy contracts: `https://docs.0g.ai/developer-hub/building-on-0g/contracts-on-0g/deploy-contracts`
- Testnet faucet: `https://faucet.0g.ai`
- Compute marketplace: `https://compute-marketplace.0g.ai/inference`

### 0G Community
- Discord: `https://discord.gg/0glabs`
- Telegram: `https://t.me/zgcommunity`
- X/Twitter: `@0G_labs`

### HackQuest
- Hackathon page: `https://www.hackquest.io/hackathons/0G-APAC-Hackathon`
- HackQuest Discord: Check HackQuest platform for link

### Foundry Documentation
- Book: `https://book.getfoundry.sh`
- Cheatcodes: `https://book.getfoundry.sh/cheatcodes`

### OpenZeppelin
- Contracts v5: `https://docs.openzeppelin.com/contracts/5.x`
- SafeERC20: `https://docs.openzeppelin.com/contracts/5.x/api/token/erc20#SafeERC20`

### wagmi + viem
- wagmi docs: `https://wagmi.sh`
- viem docs: `https://viem.sh`

---

## Environment Setup From Scratch

If you are setting up a fresh machine, do this in order:

```bash
# 1. Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# 2. Verify Foundry
forge --version
cast --version
anvil --version

# 3. Clone / enter project
cd PROPHET

# 4. Install contract dependencies
cd contracts
forge install OpenZeppelin/openzeppelin-contracts
forge build

# 5. Set up frontend
cd ../frontend
npm install
cp .env.example .env.local
# Fill in .env.local

# 6. Set up agent
cd ../agent
npm install
cp .env.example .env
# Fill in .env

# 7. Get testnet tokens
# Go to https://faucet.0g.ai and fund both oracle and market maker wallets

# 8. Deploy contracts
cd ../contracts
forge script script/Deploy.s.sol --rpc-url og_testnet --broadcast

# 9. Update all .env files with deployed addresses

# 10. Start agent
cd ../agent
npm run start

# 11. Start frontend
cd ../frontend
npm run dev
```

---

## Git Workflow

```bash
# Commit often — judges check history
git add .
git commit -m "feat: deploy ProphetFactory to 0G testnet"

# Good commit message prefixes
feat:     new feature
fix:      bug fix
test:     adding tests
docs:     documentation
deploy:   deployment related
chore:    tooling, config

# Branch strategy (solo builder — keep it simple)
main      ← always deployable, demo-ready
dev       ← active development
```

---

## The Demo Flow — Practice This Until It's Smooth

This is the exact sequence to show in the 3-minute demo video:

```
0:00 — Open the Prophet frontend
0:10 — Connect wallet (0G testnet)
0:20 — Show the markets list — at least 2-3 existing markets
0:40 — Click "Create Market" — type a question, set deadline 5 minutes from now
1:00 — Sign transaction — show it confirmed on 0G Chain Explorer
1:15 — Navigate to the new market — show it's Open
1:25 — Place a bet — choose YES, enter amount, sign transaction
1:40 — Show the bet committed but direction hidden (sealed position)
1:55 — Fast-forward or use a pre-resolved market — show oracle verdict
2:10 — Click "View Oracle Reasoning" — show the JSON pulled from 0G Storage
2:25 — Show the payout distribution — winners received USDT
2:40 — Open 0G Chain Explorer — show all transactions on-chain
2:55 — Brief pitch: "This is Prophet — autonomous, private, verifiable"
3:00 — End
```

Prepare a market with a short deadline specifically for the demo. Do a dry run at least 3 times before recording.

---

## Final Reminder

You are building something that needs to win a $150,000 hackathon, deeply integrates a novel blockchain infrastructure, and solves a real problem in prediction markets that nobody has solved before.

The bar is high. The timeline is tight. Build in this order:
1. Contracts first — nothing else matters if the financial logic is broken
2. Oracle agent second — this is Prophet's core differentiator
3. Frontend last — judges want to see the system work, the UI is secondary

When something breaks, check in this order:
1. This file (CLAUDE.md)
2. `contracts/SMART_CONTRACTS.md`
3. `README.md`
4. `https://docs.0g.ai`
5. 0G Discord

Now go build.

---

*Prophet — Making opinions tradable. Privately. Autonomously. Verifiably.*
*0G APAC Hackathon 2026 — Track 2: Agentic Trading Arena*