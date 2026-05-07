# Prophet — AI-Native Prediction Market on 0G Labs

> *Making opinions tradable. Privately. Autonomously. Verifiably.*

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Solution — What is Prophet?](#2-solution--what-is-prophet)
3. [Why 0G Labs?](#3-why-0g-labs)
4. [System Architecture](#4-system-architecture)
5. [0G Labs Integration — Layer by Layer](#5-0g-labs-integration--layer-by-layer)
6. [Core Flows](#6-core-flows)
   - [Market Creation](#61-market-creation)
   - [Placing a Bet (Sealed Position)](#62-placing-a-bet-sealed-position)
   - [Market Resolution](#63-market-resolution)
   - [Fund Disbursement](#64-fund-disbursement)
   - [Liquidity Management](#65-liquidity-management)
7. [Smart Contract Architecture](#7-smart-contract-architecture)
8. [AI Oracle — How It Works](#8-ai-oracle--how-it-works)
9. [Privacy Layer — TEE Sealed Inference](#9-privacy-layer--tee-sealed-inference)
10. [Tech Stack](#10-tech-stack)
11. [Hackathon Track](#11-hackathon-track)
12. [Roadmap](#12-roadmap)

---

## 1. Problem Statement

Prediction markets are one of the most powerful tools humanity has for aggregating collective intelligence and making opinions tradable. The idea is simple — if you believe something will happen, you should be able to put money on it and be rewarded for being right.

But in practice, every major prediction market platform is broken in at least one critical way:

### Polymarket
- **Centralized market creation** — only the Polymarket team decides which markets exist
- **Fully public positions** — every bet you place is visible on-chain the moment you make it, meaning large players can see your position and trade against you (front-running)
- **Human resolution committee** — outcomes are decided by UMA's human oracle committee, which has been disputed and manipulated before
- **No persistent liquidity** — new markets start with zero liquidity and often die before gaining traction

### Augur
- **Token holder voting for resolution** — takes days, is gameable by large token holders, and has no accountability
- **No liquidity bootstrapping** — anyone can create a market but nobody provides liquidity, so most markets are effectively dead
- **High gas fees on Ethereum** — makes small bets economically unviable

### The Core Problem
Every existing prediction market forces you to choose between **decentralization** and **functionality**. You either get a centralized platform that works  or a decentralized one that doesn't .

The root cause is not product design — it is **infrastructure**. Prediction markets need:
- Fast, cheap settlement for high-frequency betting
- Decentralized storage for oracle evidence and market history
- Verifiable AI compute for autonomous resolution
- Privacy-preserving execution to prevent front-running
- Autonomous agents for always-on liquidity

None of the existing blockchains provided all of these together — until 0G Labs.

---

## 2. Solution — What is Prophet?

Prophet is a fully autonomous, privacy-preserving, AI-native prediction market built on 0G Labs infrastructure.

It is the first prediction market where:

| Feature | How Prophet Does It |
|---|---|
| **Market resolution** | AI oracle agent running on 0G Compute — autonomous, auditable, no human committee |
| **Position privacy** | TEE sealed inference — your bet is encrypted until market closes, zero front-running |
| **Liquidity** | Agent ID-powered market maker — seeds and maintains liquidity 24/7 automatically |
| **Market creation** | Any user, any question — LLM validates and assigns resolution sources automatically |
| **Oracle accountability** | Full reasoning chain stored permanently on 0G Storage — anyone can verify |
| **Settlement** | Sub-second finality on 0G Chain — instant payouts to winners |

Prophet does not replace Polymarket's UX — its create a new infrastructure with something that is decentralized, verifiable, and actually works leveraging OG labs infastructure.

---

## 3. Why 0G Labs?

Prophet could not exist on any other chain. Here is exactly why each 0G module is necessary:

| 0G Module | Why Prophet Needs It |
|---|---|
| **0G Chain** | EVM-compatible, 11,000 TPS, sub-second finality — makes real-time betting and instant payouts viable |
| **0G Storage** | Stores oracle reasoning, market metadata, agent memory, and historical resolution data — permanently and cheaply |
| **0G Compute** | Runs the AI oracle and market maker inference — decentralized GPU, pay-per-use, no vendor lock-in |
| **TEE Sealed Inference** | Encrypts user positions until resolution — the only way to prevent front-running without a centralized server |
| **Agent ID** | Gives the oracle agent and market maker agent persistent on-chain identities — they can own wallets, sign transactions, and be held accountable |

No other infrastructure stack provides all five of these together. Ethereum is too slow and expensive. Solana has no decentralized compute or storage. Traditional prediction markets bolt on centralized infrastructure to compensate — Prophet doesn't need to.

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        PROPHET SYSTEM                           │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │   Frontend   │    │  Oracle      │    │  Market Maker    │  │
│  │   (Next.js)  │    │  Agent       │    │  Agent           │  │
│  │              │    │  (Agent ID)  │    │  (Agent ID)      │  │
│  └──────┬───────┘    └──────┬───────┘    └────────┬─────────┘  │
│         │                  │                      │            │
│         ▼                  ▼                      ▼            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    0G CHAIN (EVM)                       │   │
│  │                                                         │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │   │
│  │  │  Prophet    │  │  Position    │  │  Payout       │  │   │
│  │  │  Factory    │  │  Vault (TEE) │  │  Distributor  │  │   │
│  │  └─────────────┘  └──────────────┘  └───────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│         │                  │                      │            │
│         ▼                  ▼                      ▼            │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────┐    │
│  │  0G Storage  │  │  0G Compute   │  │  TEE Sealed      │    │
│  │              │  │               │  │  Inference       │    │
│  │ - Market     │  │ - LLM oracle  │  │                  │    │
│  │   metadata   │  │ - Market      │  │ - Encrypt bets   │    │
│  │ - Oracle     │  │   maker model │  │ - Decrypt at     │    │
│  │   reasoning  │  │ - Question    │  │   resolution     │    │
│  │ - Agent      │  │   classifier  │  │                  │    │
│  │   memory     │  │               │  │                  │    │
│  └──────────────┘  └───────────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Key Architectural Principles

**1. Separation of concerns**
The oracle agent, market maker agent, and smart contracts are fully independent. Each has its own Agent ID, its own wallet, and its own responsibilities. A failure in one does not cascade to the others.

**2. Immutability of resolution rules**
When a market is created, its resolution sources, deadline, and criteria are locked into the smart contract on 0G Chain. Nobody — not even the creator — can change them after deployment.

**3. Permanent accountability**
Every oracle decision, with full reasoning, is written to 0G Storage permanently. The oracle's track record is public and queryable by anyone.

**4. Privacy by default**
User positions are never stored in plaintext anywhere. They enter the TEE sealed vault encrypted and are only decrypted at the moment of resolution — simultaneously for all participants.

---

## 5. 0G Labs Integration — Layer by Layer

### 5.1 0G Chain — The Settlement Layer

0G Chain is the backbone of Prophet. It is where all financial logic lives.

**What runs on 0G Chain:**
- `ProphetFactory.sol` — deploys new market contracts when users create markets
- `MarketContract.sol` — holds collateral, manages YES/NO token state, enforces deadlines
- `PositionVault.sol` — receives and stores encrypted position commitments
- `PayoutDistributor.sol` — releases collateral to winning token holders after resolution

**Why 0G Chain specifically:**
- 11,000 TPS means bets settle in real time even during high-traffic events (e.g. election night)
- Sub-second finality means payouts reach winners within seconds of resolution
- Full EVM compatibility means standard Solidity smart contracts work without modification
- Low gas fees make small bets (under $1) economically viable for the first time

---

### 5.2 0G Storage — The Memory Layer

0G Storage serves as Prophet's permanent, decentralized memory. It has two sub-layers that Prophet uses for different purposes:

**Log Layer (immutable, append-only):**
Used for data that should never be modified after writing.
- Oracle reasoning chains — every piece of evidence the oracle read and every conclusion it drew when resolving a market
- Historical market outcomes — the full archive of every market ever resolved on Prophet
- Agent audit logs — a timestamped record of every action both agents have ever taken

**KV Layer (mutable, fast key-value access):**
Used for data that needs to be read and updated frequently.
- Market metadata — question text, deadline, assigned resolution sources, current status
- Agent working memory — the oracle agent's intermediate state while gathering evidence for an active resolution
- Market maker state — current YES/NO price quotes, liquidity depth, position inventory

**Storage key structure:**
```
market:{marketId}:metadata         → Market details (question, deadline, sources, status)
market:{marketId}:resolution       → Oracle verdict + reasoning (written at resolution)
oracle:track-record:{marketId}     → Whether this resolution was challenged + outcome
agent:market-maker:state           → Current pricing model state
```

**Why 0G Storage specifically:**
- 95% cheaper than AWS S3 — makes storing full oracle reasoning chains for every market economically viable
- Instant KV retrieval — the oracle agent can pull market context in milliseconds when waking up
- Decentralized — no single point of failure or censorship for historical data
- The Log layer's immutability is a core accountability guarantee — oracle reasoning cannot be edited after the fact

---

### 5.3 0G Compute — The Intelligence Layer

0G Compute is the decentralized GPU network that powers Prophet's AI capabilities. Prophet makes three distinct calls to 0G Compute:

**Call 1 — Question Classifier (at market creation)**
When a user submits a market question, a lightweight LLM call classifies it:
- What category does this question belong to? (Sports / Crypto / Politics / Finance / Custom)
- Is the question unambiguous — can it have exactly one correct answer?
- Is the question resolvable — does real-world verifiable data exist to answer it?
- What is a reasonable resolution deadline for this type of question?

The output maps the question to a category, which then pulls the correct set of pre-approved resolution sources from 0G Storage.

**Call 2 — Oracle Resolution (at market deadline)**
The most critical compute call. When a market's deadline is reached, the oracle agent sends a structured prompt to 0G Compute containing:
- The market question and resolution criteria
- The list of approved data sources to check
- The current date and any relevant context

The LLM reads from each source, synthesizes the evidence, and produces:
- A binary verdict (YES or NO)
- A confidence score (0–100%)
- A full written reasoning chain citing specific sources and evidence

**Call 3 — Market Maker Pricing (continuous)**
The market maker agent periodically calls 0G Compute to update its probability estimate for each active market. The model takes as input:
- Current trading volume and price history (from 0G Storage KV)
- Time remaining until deadline
- Any significant news signals related to the market topic

The output is an updated YES/NO price quote that the agent posts on-chain.

**Why 0G Compute specifically:**
- Pay-per-use pricing — Prophet only pays for inference when it is actually needed, no monthly subscriptions
- 90% cheaper than AWS/GCP GPU instances — makes frequent market maker repricing economically viable
- Decentralized — no vendor can censor or throttle Prophet's oracle calls
- Supports TEEML — compute results can be verified cryptographically, which feeds directly into the TEE privacy layer

---

### 5.4 TEE Sealed Inference — The Privacy Layer

TEE (Trusted Execution Environment) sealed inference is the feature that makes Prophet fundamentally different from every existing prediction market.

**The problem it solves:**
On Polymarket, every bet is a public on-chain transaction. The moment you place a large YES position on a market, every other participant can see it. Sophisticated players monitor the mempool and front-run large bets, degrading market quality and discouraging serious capital from participating.

**How sealed inference works in Prophet:**

1. When a user places a bet, their position (direction + size) is encrypted inside the TEE before it ever touches the public chain
2. The encrypted commitment is stored in `PositionVault.sol` on 0G Chain — the chain records that a position exists, but not what it is
3. The TEE holds the decryption key, which is only released when the market's deadline timestamp is verified on-chain
4. At resolution, all positions are decrypted simultaneously — nobody's position is revealed before anyone else's
5. The smart contract reads the decrypted positions and distributes payouts accordingly

**What this enables:**
- Large capital participants can take meaningful positions without being front-run
- Deeper liquidity across all markets as sophisticated players engage more freely
- Fairer price discovery since position information cannot be exploited
- MEV resistance — there is nothing to extract from encrypted position data

---

### 5.5 Agent ID — The Identity Layer

Agent ID gives Prophet's two autonomous agents persistent, verifiable on-chain identities. This is what separates them from simple bots.

**Oracle Agent (Agent ID: `prophet-oracle.0g`)**
- Has its own wallet and can pay for 0G Compute calls independently
- Signs every resolution it posts on-chain with its cryptographic identity
- Builds a permanent, publicly queryable reputation score based on resolution history
- Can be slashed (penalized) if it loses a dispute — creating a real economic incentive to be accurate

**Market Maker Agent (Agent ID: `prophet-mm.0g`)**
- Has its own liquidity wallet funded from market creation fees
- Signs every price quote it posts on-chain
- Operates 24/7 without any human intervention
- Its pricing history is permanently stored in 0G Storage for transparency

---

## 6. Core Flows

### 6.1 Market Creation

```
User submits question
        │
        ▼
0G Compute: LLM validates question
  ├── Is it unambiguous? ──── NO ──→ Return error to user
  └── Is it resolvable? ──── NO ──→ Return error to user
        │ YES
        ▼
0G Compute: Classify question category
  └── Sports / Crypto / Politics / Finance / Custom
        │
        ▼
0G Storage: Pull trusted source registry for category
  └── Returns list of pre-approved data sources
        │
        ▼
0G Chain: ProphetFactory deploys MarketContract
  └── Locks in: question, deadline, sources, collateral requirements
        │
        ▼
0G Storage (KV): Write market metadata
  └── market:{id}:metadata = { question, deadline, sources, status: "open" }
        │
        ▼
Agent ID (Market Maker): Wakes up, reads new market
        │
        ▼
0G Compute: Market maker generates opening price
  └── Initial YES probability estimate based on question context
        │
        ▼
0G Chain: Market maker posts opening YES/NO quotes
  └── Market is now live and tradeable
```

**User experience:** The user types one question and sets a deadline. Everything else — validation, source assignment, contract deployment, and initial liquidity — happens automatically within seconds.

---

### 6.2 Placing a Bet (Sealed Position)

```
User selects YES or NO + amount
        │
        ▼
Frontend: Encrypt position inside TEE
  └── Encrypted payload = TEE(direction, amount, userAddress, marketId)
        │
        ▼
0G Chain: Submit encrypted commitment to PositionVault.sol
  └── Contract records: commitment hash + collateral (USDT locked)
  └── Public chain only sees: "a position exists" — not what it is
        │
        ▼
0G Storage (KV): Update market liquidity depth
  └── Total volume tracked without revealing individual positions
        │
        ▼
Agent ID (Market Maker): Detects volume change, reprices
  └── Adjusts YES/NO spread based on aggregate activity
```

**Privacy guarantee:** At no point is the user's direction or size visible to any other market participant, the market maker agent, or the public chain.

---

### 6.3 Market Resolution

```
0G Chain: Deadline block reached
  └── MarketContract emits ResolutionRequested event
        │
        ▼
Agent ID (Oracle): Wakes up, reads event
        │
        ▼
0G Storage (KV): Pull market metadata
  └── Question, resolution criteria, approved sources
        │
        ▼
0G Compute: Oracle LLM gathers evidence
  └── Reads each approved source
  └── Synthesizes verdict + confidence score + reasoning chain
        │
        ▼
0G Storage (Log): Write full reasoning chain permanently
  └── oracle:{marketId}:resolution = { verdict, confidence, reasoning, sources, timestamp }
        │
        ▼
0G Chain: Oracle agent posts verdict (signed with Agent ID)
  └── MarketContract enters 24-hour challenge window
        │
        ├── No challenge filed ──────────────────────────→ Resolution finalized
        │
        └── Challenge filed (with stake)
                  │
                  ▼
            0G Compute: Second oracle call (stricter evidence requirements)
                  │
                  ├── Challenge upheld ──→ Challenger earns stake, resolution overturned
                  └── Challenge rejected ──→ Oracle verdict stands, challenger loses stake
```

---

### 6.4 Fund Disbursement

```
Resolution finalized on 0G Chain
        │
        ▼
TEE: Deadline timestamp verified → Decryption keys released
        │
        ▼
PositionVault.sol: All positions decrypted simultaneously
  └── No position is revealed before any other
        │
        ▼
PayoutDistributor.sol: Reads verdict + decrypted positions
  └── Calculates each winner's share of the collateral pool
        │
        ▼
0G Chain: USDT transferred to winning addresses
  └── Sub-second finality — winners receive funds within seconds
        │
        ▼
0G Storage (Log): Disbursement record written
  └── market:{id}:payouts = { winners[], amounts[], txHash, timestamp }
```

**Fee structure:**
- 1% of winning pool → Oracle agent wallet (incentive to resolve accurately)
- 1% of winning pool → Market maker agent wallet (incentive to maintain liquidity)
- 0.5% → Prophet protocol treasury (for governance and development)

---

### 6.5 Liquidity Management

The market maker agent is Prophet's solution to the liquidity cold-start problem that kills most permissionless prediction markets.

```
Market created
        │
        ▼
Market Maker Agent: Seeds initial liquidity
  └── Posts opening YES/NO prices from its own liquidity wallet
        │
        ▼
[Continuous loop while market is open]
        │
        ▼
0G Compute: Reprice based on:
  ├── Current aggregate trading volume
  ├── Time remaining to deadline
  └── External signals (news sentiment, on-chain data)
        │
        ▼
0G Chain: Post updated YES/NO quotes
        │
        ▼
0G Storage (KV): Update agent state
  └── agent:market-maker:state = { prices, inventory, lastUpdated }
        │
        ▼
[Wait for next pricing interval or significant volume event]
        │
        └──────────────────────────────────────────────────┐
                                                           │
                                                    [Repeat loop]
```

**Liquidity sources:**
1. Market maker agent (primary — always present from day one)
2. Human liquidity providers (secondary — can deposit into liquidity pools and earn fees)
3. Market creation bond (the user who creates a market deposits a small bond that seeds initial liquidity)

---

## 7. Smart Contract Architecture

Prophet deploys four smart contracts on 0G Chain:

### `ProphetFactory.sol`
Responsible for deploying new market contracts. Acts as the registry of all Prophet markets.

```solidity
function createMarket(
    string calldata question,
    uint256 deadline,
    string[] calldata resolutionSources,
    address oracleAgent,
    address marketMakerAgent
) external returns (address marketContract);
```

### `MarketContract.sol`
The core contract for each individual prediction market. Manages the full lifecycle.

```solidity
// Key state
enum MarketStatus { Open, PendingResolution, Challenged, Resolved }
address public oracleAgent;
address public marketMakerAgent;
uint256 public deadline;
MarketStatus public status;
bool public outcome; // true = YES, false = NO

// Key functions
function placeBet(bytes calldata encryptedPosition) external payable;
function postResolution(bool verdict, bytes32 reasoningHash) external onlyOracle;
function challengeResolution() external payable;
function finalizeResolution() external;
```

### `PositionVault.sol`
Stores encrypted position commitments. Integrates with TEE for decryption at resolution.

```solidity
function commitPosition(
    address market,
    bytes calldata encryptedCommitment
) external payable;

function revealPositions(
    address market,
    bytes calldata teeDecryptionProof
) external onlyAtResolution returns (Position[] memory);
```

### `PayoutDistributor.sol`
Calculates and distributes winnings after positions are revealed.

```solidity
function distributePayout(
    address market,
    Position[] calldata revealedPositions,
    bool outcome
) external onlyAfterResolution;
```

---

## 8. AI Oracle — How It Works

The oracle is the most critical component of Prophet. Here is exactly what happens when it resolves a market.

### Source Registry
Prophet maintains a curated registry of trusted data sources per category, stored in 0G Storage. This registry is governed by Prophet token holders and updated through on-chain proposals.

| Category | Trusted Sources |
|---|---|
| Crypto prices | CoinGecko API, Binance, on-chain Chainlink feeds |
| Sports | ESPN, BBC Sport, official league/federation APIs |
| Politics | Reuters, AP News, official government websites |
| Finance | Yahoo Finance, Bloomberg public feeds, SEC EDGAR |
| Custom | LLM selects best available sources from registry |

### Oracle Prompt Structure
When the oracle agent calls 0G Compute at resolution time, it sends a structured prompt:

```
You are a prediction market oracle. Your task is to resolve the following market.

Market question: {question}
Resolution deadline: {deadline}
Resolution criteria: {criteria}

You must read the following approved sources and determine the outcome:
{source_1}, {source_2}, {source_3}

Provide:
1. Your verdict: YES or NO
2. Your confidence: 0-100%
3. Your full reasoning, citing specific evidence from each source
4. Any ambiguities you encountered and how you resolved them

If you cannot determine the outcome with >70% confidence, return INCONCLUSIVE.
```

### Dispute Mechanism
Any user can challenge a resolution within 24 hours by staking 5% of the market's total pool. A challenge triggers a second oracle call with stricter evidence requirements and a longer evidence-gathering window. If the challenge is upheld, the challenger receives their stake back plus 50% of the oracle agent's fee. If rejected, the challenger loses their stake to the oracle agent.

This creates a robust incentive structure: the oracle is financially motivated to be accurate, and challengers are financially motivated to only dispute genuine errors.

---

## 9. Privacy Layer — TEE Sealed Inference

### What is a TEE?
A Trusted Execution Environment (TEE) is a secure area of a processor that guarantees code executes privately — even the hardware operator cannot see what is happening inside. 0G Labs provides TEE-based sealed inference as part of its compute stack.

### How Prophet Uses It

**At bet placement:**
```
User input: { direction: "YES", amount: 100 USDT }
                    │
                    ▼
              TEE encryption
                    │
                    ▼
On-chain storage: 0xA3F9...2B1C  ← meaningless to any observer
```

**At resolution:**
```
0G Chain: Deadline block confirmed
                    │
                    ▼
TEE verifies deadline → releases decryption keys
                    │
                    ▼
All positions decrypted simultaneously
                    │
                    ▼
Smart contract processes revealed positions → payouts
```

### What This Prevents
- **Front-running** — nobody can see your position and copy or trade against it
- **Informed manipulation** — the market maker agent prices based on aggregate volume signals only, not individual positions
- **MEV extraction** — encrypted data has no extractable value for block producers

---

## 10. Tech Stack

| Layer | Technology |
|---|---|
| Smart contracts | Solidity, Hardhat, OpenZeppelin |
| Blockchain | 0G Chain (EVM-compatible) |
| Decentralized storage | 0G Storage SDK (TypeScript) |
| AI inference | 0G Compute (LLM inference API) |
| Privacy | 0G TEE Sealed Inference |
| Agent identity | 0G Agent ID |
| Frontend | Next.js, TypeScript, wagmi, viem |
| Wallet integration | MetaMask, WalletConnect |
| Backend (agent runner) | Node.js |
| Testing | Hardhat test suite, Chai |

---

## 11. Hackathon Track

**Primary: Track 2 — Agentic Trading Arena (Verifiable Finance)**

Prophet is a direct response to Track 2's core mandate: transitioning from manual DeFi to fully autonomous, verifiable financial logic. Every key feature maps to the track's stated priorities:

| Track 2 Requirement | Prophet Implementation |
|---|---|
| Autonomous financial logic | AI oracle + AI market maker — zero human intervention |
| Sealed inference for privacy | TEE-encrypted positions until resolution |
| Front-running mitigation | Positions invisible until simultaneous reveal at close |
| Verifiable execution | Oracle reasoning stored permanently on 0G Storage |
| AI-driven strategy agents | Market maker agent continuously reprices based on 0G Compute |

**Secondary: Track 5 — Privacy & Sovereign Infrastructure**

The TEE sealed position system is a privacy-preserving protocol that could be extracted and used by any DeFi application that needs to hide user intent until execution — making it a reusable piece of privacy infrastructure, not just a feature of Prophet.

---

## 12. Roadmap

### Hackathon MVP (Weeks 1–6)
- [ ] Core smart contracts deployed on 0G testnet (Galileo)
- [ ] 0G Storage integration for market metadata and oracle reasoning
- [ ] 0G Compute integration for oracle resolution (single market category: Crypto)
- [ ] TEE sealed position vault (encrypt + decrypt flow)
- [ ] Agent ID oracle agent with basic resolution capability
- [ ] Agent ID market maker with basic pricing model
- [ ] Minimal frontend — create market, place bet, view resolution
- [ ] End-to-end demo: one full market lifecycle

### Post-Hackathon V1
- [ ] Multi-category markets (Sports, Politics, Finance)
- [ ] Full challenge and dispute system
- [ ] Human liquidity provider pools
- [ ] Oracle reputation scoring dashboard
- [ ] Mobile-responsive frontend
- [ ] Mainnet deployment on 0G Chain

### V2
- [ ] Cross-chain market creation (create on Ethereum, settle on 0G)
- [ ] Conditional markets ("If X happens, then will Y happen?")
- [ ] Prophet governance token for source registry management
- [ ] SDK for third-party integrations

---

## Contributing

Prophet is being built in public as part of the 0G APAC Hackathon 2026. Follow the build journey on X: `#0GHackathon #BuildOn0G`

---

## License

MIT

---

*Built with 0G Labs infrastructure. Powered by the belief that opinions should be tradable — privately, fairly, and autonomously.*