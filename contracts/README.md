# Prophet — Smart Contract Architecture & Reference

> This document is the single source of truth for all smart contract development on Prophet.
> Any AI assistant or developer building Prophet's contracts must read this document in full before writing a single line of code.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack & Environment](#2-tech-stack--environment)
3. [Contract Architecture Overview](#3-contract-architecture-overview)
4. [Contract 1 — ProphetFactory](#4-contract-1--prophetfactory)
5. [Contract 2 — MarketContract](#5-contract-2--marketcontract)
6. [Contract 3 — PositionVault](#6-contract-3--positionvault)
7. [Contract 4 — PayoutDistributor](#7-contract-4--payoutdistributor)
8. [Shared Libraries & Interfaces](#8-shared-libraries--interfaces)
9. [Events Reference](#9-events-reference)
10. [Error Reference](#10-error-reference)
11. [Access Control](#11-access-control)
12. [0G Chain Integration Notes](#12-0g-chain-integration-notes)
13. [Security Considerations](#13-security-considerations)
14. [Deployment Order & Scripts](#14-deployment-order--scripts)
15. [Testing Requirements](#15-testing-requirements)
16. [Complete Data Flow](#16-complete-data-flow)

---

## 1. Project Overview

### What is Prophet?

Prophet is a fully autonomous, privacy-preserving, AI-native prediction market built on 0G Labs infrastructure. It allows users to create binary (YES/NO) prediction markets on any resolvable question, place bets with sealed positions (hidden until resolution), and receive automated payouts — all without any human committee or centralized operator.

### What the Smart Contracts Do

The smart contracts are the financial and logical backbone of Prophet. They handle:

- Market creation and lifecycle management
- Collateral custody (holding user funds securely in escrow)
- Sealed position commitments (encrypting bet direction and size)
- Oracle resolution posting and challenge management
- Automated payout distribution to winners

### What the Smart Contracts Do NOT Do

The contracts do not handle:

- AI inference (handled off-chain by 0G Compute)
- Data storage of market metadata or oracle reasoning (handled by 0G Storage)
- TEE encryption/decryption of positions (handled by the TEE layer, contracts only store commitments and receive revealed positions)
- Price quoting by the market maker (handled by the market maker agent off-chain)

### Network

All contracts deploy on **0G Chain** — an EVM-compatible Layer 1 blockchain. Standard Solidity and EVM tooling applies. Chain ID and RPC endpoints are defined in the deployment configuration.

- **Testnet (Galileo):** Use for development and hackathon demo
- **Mainnet:** Post-hackathon production deployment

---

## 2. Tech Stack & Environment

### Language & Framework

```
Solidity:        ^0.8.20
Framework:       Hardhat
Testing:         Hardhat + Chai + Ethers.js v6
OpenZeppelin:    ^5.0.0
Node.js:         >= 18.0.0
```

### Key Dependencies

```json
{
  "devDependencies": {
    "@nomicfoundation/hardhat-toolbox": "^4.0.0",
    "@openzeppelin/contracts": "^5.0.0",
    "hardhat": "^2.20.0",
    "chai": "^4.3.0",
    "ethers": "^6.0.0"
  }
}
```

### Project Structure

```
prophet-contracts/
├── contracts/
│   ├── ProphetFactory.sol
│   ├── MarketContract.sol
│   ├── PositionVault.sol
│   ├── PayoutDistributor.sol
│   ├── interfaces/
│   │   ├── IMarketContract.sol
│   │   ├── IPositionVault.sol
│   │   └── IPayoutDistributor.sol
│   └── libraries/
│       ├── MarketLib.sol
│       └── FeeLib.sol
├── scripts/
│   ├── deploy.js
│   └── verify.js
├── test/
│   ├── ProphetFactory.test.js
│   ├── MarketContract.test.js
│   ├── PositionVault.test.js
│   └── PayoutDistributor.test.js
├── hardhat.config.js
└── .env
```

### Environment Variables

```bash
# .env file — never commit this
PRIVATE_KEY=                    # Deployer wallet private key
OG_CHAIN_RPC_MAINNET=           # 0G Chain mainnet RPC URL
OG_CHAIN_RPC_TESTNET=           # 0G Chain Galileo testnet RPC URL
ORACLE_AGENT_ADDRESS=           # Address of the deployed oracle agent wallet
MARKET_MAKER_ADDRESS=           # Address of the deployed market maker agent wallet
PROTOCOL_TREASURY=              # Address of the Prophet protocol treasury
```

---

## 3. Contract Architecture Overview

### Deployment Relationships

```
                    ┌─────────────────────┐
                    │   ProphetFactory     │
                    │   (deployer +        │
                    │    registry)         │
                    └──────────┬──────────┘
                               │ deploys
                               ▼
                    ┌─────────────────────┐
                    │   MarketContract     │◄──── Oracle Agent (resolves)
                    │   (per market,       │◄──── Market Maker (quotes prices)
                    │    holds collateral) │◄──── Users (place bets)
                    └──────────┬──────────┘
                               │ calls
                    ┌──────────┴──────────┐
                    │                     │
          ┌─────────▼──────┐   ┌──────────▼──────────┐
          │ PositionVault  │   │  PayoutDistributor   │
          │ (seals + holds │   │  (calculates +       │
          │  encrypted     │   │   distributes        │
          │  positions)    │   │   winnings)          │
          └────────────────┘   └─────────────────────-┘
```

### Contract Responsibilities Summary

| Contract | Responsibility | Who Calls It |
|---|---|---|
| `ProphetFactory` | Deploy new markets, maintain market registry | Any user (market creation) |
| `MarketContract` | Lifecycle management, collateral custody, resolution | Users, Oracle Agent, Market Maker |
| `PositionVault` | Store encrypted position commitments, reveal at resolution | Users (commit), MarketContract (reveal trigger) |
| `PayoutDistributor` | Calculate winner shares, distribute USDT payouts | MarketContract (after resolution) |

### Token Used

All collateral and payouts are denominated in **USDT** (ERC-20). No native 0G token is used for bets. The $0G token is only used for gas fees on 0G Chain.

---

## 4. Contract 1 — ProphetFactory

### File: `contracts/ProphetFactory.sol`

### Purpose

ProphetFactory is the entry point for market creation. It deploys a new `MarketContract` for each prediction market, maintains a registry of all markets ever created, and enforces protocol-level parameters like minimum collateral and fee settings.

### Inheritance

```solidity
contract ProphetFactory is Ownable, ReentrancyGuard
```

### State Variables

```solidity
// Protocol configuration
address public immutable USDT;                    // USDT token address on 0G Chain
address public immutable positionVault;           // Deployed PositionVault address
address public immutable payoutDistributor;       // Deployed PayoutDistributor address
address public immutable oracleAgent;             // Oracle agent wallet address
address public immutable marketMakerAgent;        // Market maker agent wallet address
address public protocolTreasury;                  // Prophet treasury address (updatable by owner)

// Market configuration constants
uint256 public constant MIN_COLLATERAL = 10e6;    // Minimum 10 USDT to create a market (6 decimals)
uint256 public constant MIN_DEADLINE_BUFFER = 1 hours; // Market must close at least 1 hour from now
uint256 public constant MAX_QUESTION_LENGTH = 280; // Max characters for market question

// Fee configuration (basis points, 10000 = 100%)
uint256 public constant ORACLE_FEE_BPS = 100;     // 1% to oracle agent
uint256 public constant MM_FEE_BPS = 100;         // 1% to market maker agent  
uint256 public constant PROTOCOL_FEE_BPS = 50;   // 0.5% to protocol treasury

// Market registry
address[] public allMarkets;                      // Array of all deployed market addresses
mapping(address => bool) public isMarket;         // Whitelist — is this address a Prophet market?
mapping(address => address[]) public userMarkets; // Markets created by each user

// Market counter
uint256 public totalMarketsCreated;
```

### Functions

#### `createMarket`

```solidity
function createMarket(
    string calldata question,
    uint256 deadline,
    string calldata category,
    bytes32 resolutionSourcesHash
) external returns (address marketAddress)
```

**Purpose:** Deploy a new MarketContract for a prediction market.

**Parameters:**
- `question` — The prediction market question as a plain string. Maximum 280 characters. Must be a complete sentence ending in "?" Example: `"Will BTC exceed $150,000 by December 31, 2026?"`
- `deadline` — Unix timestamp when the market closes and resolution begins. Must be at least `block.timestamp + MIN_DEADLINE_BUFFER`.
- `category` — Category string assigned by the off-chain LLM classifier. Accepted values: `"crypto"`, `"sports"`, `"politics"`, `"finance"`, `"custom"`. Used for frontend filtering only, not enforced on-chain.
- `resolutionSourcesHash` — A `bytes32` keccak256 hash of the JSON string containing the array of approved resolution sources assigned by the oracle system. This hash is stored in the contract and used to verify the oracle's source list at resolution time. The actual source list lives in 0G Storage — this hash is the on-chain fingerprint.

**Behavior:**
1. Validates `question` length > 0 and <= `MAX_QUESTION_LENGTH`
2. Validates `deadline` >= `block.timestamp + MIN_DEADLINE_BUFFER`
3. Validates `category` is one of the accepted values
4. Deploys a new `MarketContract` with all parameters
5. Registers the new market in `allMarkets`, `isMarket`, and `userMarkets`
6. Increments `totalMarketsCreated`
7. Emits `MarketCreated` event

**Access:** Public — any address can call this.

**Returns:** Address of the newly deployed `MarketContract`.

---

#### `getMarkets`

```solidity
function getMarkets(
    uint256 offset,
    uint256 limit
) external view returns (address[] memory)
```

**Purpose:** Paginated retrieval of all market addresses.

**Parameters:**
- `offset` — Starting index in `allMarkets` array
- `limit` — Maximum number of markets to return (max 100)

---

#### `getMarketsByUser`

```solidity
function getMarketsByUser(address user) external view returns (address[] memory)
```

**Purpose:** Returns all markets created by a specific user address.

---

#### `updateTreasury`

```solidity
function updateTreasury(address newTreasury) external onlyOwner
```

**Purpose:** Update the protocol treasury address. Only callable by contract owner.

---

#### `isValidMarket`

```solidity
function isValidMarket(address market) external view returns (bool)
```

**Purpose:** Returns true if the given address is a Prophet market deployed by this factory. Used by PositionVault and PayoutDistributor to validate calls.

---

## 5. Contract 2 — MarketContract

### File: `contracts/MarketContract.sol`

### Purpose

MarketContract is the core contract for each individual prediction market. One is deployed per market. It manages the full lifecycle from open → pending resolution → challenged/finalized → paying out. It holds all user collateral in escrow and enforces the resolution and challenge rules.

### Inheritance

```solidity
contract MarketContract is ReentrancyGuard
```

### Market Lifecycle (Status Enum)

```solidity
enum MarketStatus {
    Open,               // Accepting bets, market maker quoting prices
    PendingResolution,  // Deadline passed, waiting for oracle verdict
    Challenged,         // Oracle verdict posted but under challenge
    Resolved,           // Final verdict confirmed, ready for payouts
    Cancelled           // Edge case: oracle returned INCONCLUSIVE twice, refunds issued
}
```

### State Variables

```solidity
// Immutable market parameters (set at deployment, never change)
address public immutable factory;               // ProphetFactory that deployed this
address public immutable oracleAgent;           // Address authorized to post resolution
address public immutable marketMakerAgent;      // Address authorized to post price quotes
address public immutable positionVault;         // PositionVault contract address
address public immutable payoutDistributor;     // PayoutDistributor contract address
address public immutable USDT;                  // USDT token address
address public immutable creator;               // User who created this market

// Market parameters
string public question;                         // The prediction question
uint256 public immutable deadline;              // Unix timestamp when market closes
string public category;                         // Market category string
bytes32 public immutable resolutionSourcesHash; // Hash of approved sources

// Market state (mutable)
MarketStatus public status;                     // Current lifecycle status
bool public outcome;                            // true = YES won, false = NO won
bytes32 public verdictReasoningHash;            // keccak256 hash of oracle reasoning stored in 0G Storage
uint256 public totalCollateral;                 // Total USDT deposited in this market
uint256 public challengeDeadline;               // Timestamp when challenge window closes
uint256 public resolutionTimestamp;             // When the oracle posted its verdict

// Challenge state
address public challenger;                      // Address that filed the challenge
uint256 public challengeStake;                  // USDT amount staked by challenger
bool public challengeResolved;                  // Whether challenge has been processed

// Fee configuration (inherited from factory at deployment)
uint256 public immutable ORACLE_FEE_BPS;
uint256 public immutable MM_FEE_BPS;
uint256 public immutable PROTOCOL_FEE_BPS;
address public immutable protocolTreasury;

// Challenge constants
uint256 public constant CHALLENGE_WINDOW = 24 hours;
uint256 public constant CHALLENGE_STAKE_BPS = 500; // 5% of total collateral
uint256 public constant MIN_CHALLENGE_STAKE = 50e6; // Minimum 50 USDT to challenge
```

### Functions

#### `placeBet`

```solidity
function placeBet(
    bytes calldata encryptedCommitment,
    uint256 collateralAmount
) external nonReentrant
```

**Purpose:** Accept a sealed position commitment from a user.

**Parameters:**
- `encryptedCommitment` — The TEE-encrypted bytes blob containing the user's bet direction (YES/NO) and amount. This is opaque to the contract — it stores it without interpreting it. The TEE layer handles encryption/decryption.
- `collateralAmount` — The amount of USDT the user is committing. Must match the amount approved to this contract via `USDT.approve()`.

**Behavior:**
1. Validates `status == MarketStatus.Open`
2. Validates `block.timestamp < deadline`
3. Validates `collateralAmount > 0`
4. Transfers `collateralAmount` USDT from caller to this contract
5. Adds `collateralAmount` to `totalCollateral`
6. Calls `PositionVault.commitPosition(msg.sender, encryptedCommitment, collateralAmount)`
7. Emits `BetPlaced` event

**Access:** Public — any address can call this while market is Open.

**Important:** The contract does NOT know whether the user bet YES or NO. It only knows they committed collateral. Direction is hidden in `encryptedCommitment`.

---

#### `triggerResolution`

```solidity
function triggerResolution() external
```

**Purpose:** Move market from Open to PendingResolution after deadline passes. Anyone can call this — it just checks the timestamp.

**Behavior:**
1. Validates `status == MarketStatus.Open`
2. Validates `block.timestamp >= deadline`
3. Sets `status = MarketStatus.PendingResolution`
4. Emits `ResolutionTriggered` event

**Access:** Public — anyone can call this after deadline.

**Note:** The oracle agent's off-chain listener watches for `ResolutionTriggered` events to know when to begin evidence gathering.

---

#### `postResolution`

```solidity
function postResolution(
    bool verdict,
    bytes32 reasoningHash,
    bytes calldata teeAttestation
) external
```

**Purpose:** Oracle agent posts its verdict after gathering evidence.

**Parameters:**
- `verdict` — `true` = YES outcome, `false` = NO outcome
- `reasoningHash` — keccak256 hash of the full reasoning JSON written to 0G Storage. Anyone can retrieve the reasoning from 0G Storage using this hash.
- `teeAttestation` — Cryptographic attestation from the TEE environment proving the oracle inference was executed correctly. This is verified on-chain.

**Behavior:**
1. Validates `msg.sender == oracleAgent`
2. Validates `status == MarketStatus.PendingResolution`
3. Stores `outcome = verdict`
4. Stores `verdictReasoningHash = reasoningHash`
5. Sets `resolutionTimestamp = block.timestamp`
6. Sets `challengeDeadline = block.timestamp + CHALLENGE_WINDOW`
7. Sets `status = MarketStatus.Challenged` (always enters challenge window first)
8. Emits `ResolutionPosted` event

**Access:** Only `oracleAgent` address.

---

#### `challengeResolution`

```solidity
function challengeResolution() external nonReentrant
```

**Purpose:** Any user can challenge the oracle's verdict within the challenge window by staking USDT.

**Behavior:**
1. Validates `status == MarketStatus.Challenged`
2. Validates `block.timestamp <= challengeDeadline`
3. Validates `challenger == address(0)` (only one challenge allowed)
4. Calculates required stake: `max(totalCollateral * CHALLENGE_STAKE_BPS / 10000, MIN_CHALLENGE_STAKE)`
5. Transfers stake from `msg.sender` to this contract
6. Sets `challenger = msg.sender`
7. Sets `challengeStake = calculatedStake`
8. Emits `ResolutionChallenged` event

**Access:** Public — any address can challenge within the window.

**Note:** When a challenge is filed, the oracle agent's off-chain listener detects the `ResolutionChallenged` event and initiates a second, stricter inference call on 0G Compute. The result of that second call is posted via `postResolution` again (status resets to allow a second post).

---

#### `finalizeResolution`

```solidity
function finalizeResolution() external
```

**Purpose:** Finalize the market outcome after the challenge window expires with no challenge.

**Behavior:**
1. Validates `status == MarketStatus.Challenged`
2. Validates `block.timestamp > challengeDeadline`
3. Validates `challenger == address(0)` (no challenge was filed)
4. Sets `status = MarketStatus.Resolved`
5. Calls `PositionVault.revealPositions(address(this))` to trigger TEE decryption
6. Emits `ResolutionFinalized` event

**Access:** Public — anyone can call this after challenge window expires.

---

#### `processChallengeOutcome`

```solidity
function processChallengeOutcome(
    bool challengeUpheld
) external
```

**Purpose:** Called by oracle agent after the second inference resolves a challenge.

**Parameters:**
- `challengeUpheld` — `true` if the second oracle call overturned the original verdict, `false` if original verdict stands

**Behavior:**

If `challengeUpheld == true`:
1. Flips `outcome` to opposite value
2. Transfers challenger's stake back + 50% of oracle fee as reward to `challenger`
3. Sets `status = MarketStatus.Resolved`
4. Calls `PositionVault.revealPositions(address(this))`
5. Emits `ChallengeUpheld` event

If `challengeUpheld == false`:
1. `outcome` stays unchanged
2. Challenger loses their stake — transferred to `oracleAgent`
3. Sets `status = MarketStatus.Resolved`
4. Calls `PositionVault.revealPositions(address(this))`
5. Emits `ChallengeRejected` event

**Access:** Only `oracleAgent` address.

---

#### `distributePayout`

```solidity
function distributePayout(
    address[] calldata winners,
    uint256[] calldata amounts
) external nonReentrant
```

**Purpose:** Called by PayoutDistributor after positions are revealed and winner shares calculated.

**Parameters:**
- `winners` — Array of winner addresses
- `amounts` — Array of USDT amounts corresponding to each winner

**Behavior:**
1. Validates `status == MarketStatus.Resolved`
2. Validates `msg.sender == payoutDistributor`
3. Validates `winners.length == amounts.length`
4. Deducts protocol fees from total before distribution
5. Transfers fee amounts to `oracleAgent`, `marketMakerAgent`, `protocolTreasury`
6. Transfers each winner's amount from contract to their address
7. Emits `PayoutsDistributed` event

**Access:** Only `payoutDistributor` address.

---

#### `cancelMarket`

```solidity
function cancelMarket() external nonReentrant
```

**Purpose:** Emergency cancellation. Triggered if oracle returns INCONCLUSIVE twice. Issues full refunds to all bettors.

**Behavior:**
1. Validates `msg.sender == oracleAgent`
2. Validates `status == MarketStatus.PendingResolution`
3. Sets `status = MarketStatus.Cancelled`
4. Calls `PositionVault.refundAll(address(this))` to refund all positions
5. Emits `MarketCancelled` event

**Access:** Only `oracleAgent` address.

---

#### View Functions

```solidity
// Returns full market info in one call (used by frontend)
function getMarketInfo() external view returns (
    string memory _question,
    uint256 _deadline,
    MarketStatus _status,
    bool _outcome,
    uint256 _totalCollateral,
    uint256 _challengeDeadline,
    bytes32 _verdictReasoningHash,
    string memory _category
)

// Returns time remaining until deadline (0 if passed)
function timeUntilDeadline() external view returns (uint256)

// Returns whether challenge window is still open
function isChallengeOpen() external view returns (bool)

// Returns required stake amount to challenge
function requiredChallengeStake() external view returns (uint256)
```

---

## 6. Contract 3 — PositionVault

### File: `contracts/PositionVault.sol`

### Purpose

PositionVault is the privacy contract. It receives encrypted position commitments from users (via MarketContract) and holds them sealed until market resolution. At resolution, it triggers the TEE decryption process and returns revealed positions to the PayoutDistributor.

### Inheritance

```solidity
contract PositionVault is ReentrancyGuard
```

### Data Structures

```solidity
struct EncryptedPosition {
    address bettor;                   // User who placed this bet
    bytes encryptedCommitment;        // TEE-encrypted payload (direction + amount)
    uint256 collateralAmount;         // USDT amount committed (plaintext — needed for refunds)
    uint256 timestamp;                // When this commitment was made
    bool revealed;                    // Whether TEE has decrypted this position
}

struct RevealedPosition {
    address bettor;                   // User who placed this bet
    bool direction;                   // true = YES, false = NO
    uint256 collateralAmount;         // USDT amount bet
}
```

### State Variables

```solidity
address public immutable factory;               // ProphetFactory — for market validation

// Market → positions mapping
mapping(address => EncryptedPosition[]) public marketPositions;

// Market → revealed positions (populated after resolution)
mapping(address => RevealedPosition[]) public revealedPositions;

// Market → total position count
mapping(address => uint256) public positionCount;

// Track which bettors have positions in which markets (for refunds)
mapping(address => mapping(address => bool)) public hasBet; // market => bettor => hasBet
```

### Functions

#### `commitPosition`

```solidity
function commitPosition(
    address market,
    address bettor,
    bytes calldata encryptedCommitment,
    uint256 collateralAmount
) external
```

**Purpose:** Store an encrypted position commitment.

**Parameters:**
- `market` — The MarketContract address this position belongs to
- `bettor` — The user placing the bet (msg.sender from MarketContract's perspective)
- `encryptedCommitment` — The encrypted bytes blob from the TEE layer
- `collateralAmount` — USDT amount committed (stored plaintext for accounting)

**Behavior:**
1. Validates `msg.sender` is a valid Prophet market via `factory.isValidMarket(msg.sender)`
2. Validates `market` has `status == Open`
3. Creates `EncryptedPosition` struct and pushes to `marketPositions[market]`
4. Sets `hasBet[market][bettor] = true`
5. Increments `positionCount[market]`
6. Emits `PositionCommitted` event

**Access:** Only valid Prophet markets (validated against factory).

---

#### `revealPositions`

```solidity
function revealPositions(
    address market,
    RevealedPosition[] calldata positions,
    bytes calldata teeDecryptionProof
) external
```

**Purpose:** Accept the TEE-decrypted positions after market resolution. Called by the oracle agent's off-chain service which handles the TEE decryption and submits the results back on-chain.

**Parameters:**
- `market` — The market whose positions are being revealed
- `positions` — Array of `RevealedPosition` structs decrypted by the TEE
- `teeDecryptionProof` — Cryptographic proof from TEE environment validating the decryption was done correctly

**Behavior:**
1. Validates `msg.sender == oracleAgent` (only oracle agent submits decrypted positions)
2. Validates market has `status == Resolved`
3. Validates `teeDecryptionProof` is valid (cryptographic verification)
4. Validates `positions.length == positionCount[market]`
5. Stores all positions in `revealedPositions[market]`
6. Marks all `EncryptedPosition.revealed = true`
7. Calls `PayoutDistributor.calculateAndDistribute(market, positions, outcome)`
8. Emits `PositionsRevealed` event

**Access:** Only `oracleAgent` address.

---

#### `refundAll`

```solidity
function refundAll(address market) external nonReentrant
```

**Purpose:** Issue full collateral refunds to all bettors when a market is cancelled.

**Behavior:**
1. Validates `msg.sender` is the market contract at `market`
2. Validates market `status == Cancelled`
3. Loops through all `marketPositions[market]`
4. For each position, transfers `collateralAmount` USDT back to `bettor`
5. Emits `PositionsRefunded` event

**Access:** Only the specific MarketContract calling for its own market.

---

#### `getPositionCount`

```solidity
function getPositionCount(address market) external view returns (uint256)
```

**Purpose:** Returns total number of sealed positions in a market.

---

#### `hasBettor`

```solidity
function hasBettor(address market, address bettor) external view returns (bool)
```

**Purpose:** Returns whether a specific address has placed a bet in a specific market.

---

## 7. Contract 4 — PayoutDistributor

### File: `contracts/PayoutDistributor.sol`

### Purpose

PayoutDistributor receives revealed positions from PositionVault after TEE decryption, calculates each winner's proportional share of the collateral pool, deducts protocol fees, and distributes USDT to all winning addresses.

### Inheritance

```solidity
contract PayoutDistributor is ReentrancyGuard
```

### Fee Structure

```
Total collateral pool
    └── 2.5% total fees
          ├── 1.0% → Oracle Agent wallet   (ORACLE_FEE_BPS = 100)
          ├── 1.0% → Market Maker wallet   (MM_FEE_BPS = 100)
          └── 0.5% → Protocol Treasury     (PROTOCOL_FEE_BPS = 50)
    └── 97.5% distributed to winners proportionally
```

### Payout Calculation

Winners receive their proportional share of the winning pool, scaled by the total pool size:

```
winnerPayout = (winnerStake / totalWinningStake) * netPool

where:
  netPool = totalCollateral - totalFees
  totalWinningStake = sum of collateral from all winners (correct direction bettors)
  winnerStake = individual winner's collateral amount
```

**Example:**
```
Total pool:         1,000 USDT
Total fees (2.5%):     25 USDT
Net pool:             975 USDT

Outcome: YES wins
YES bettors staked:   600 USDT total
NO bettors staked:    400 USDT total (losers — forfeit their stake)

Winner A staked 300 USDT → payout = (300/600) * 975 = 487.50 USDT
Winner B staked 200 USDT → payout = (200/600) * 975 = 325.00 USDT
Winner C staked 100 USDT → payout = (100/600) * 975 = 162.50 USDT
```

### State Variables

```solidity
address public immutable factory;
address public immutable oracleAgent;
address public immutable marketMakerAgent;
address public immutable protocolTreasury;
address public immutable USDT;

uint256 public constant ORACLE_FEE_BPS = 100;
uint256 public constant MM_FEE_BPS = 100;
uint256 public constant PROTOCOL_FEE_BPS = 50;

// Track distributions (prevent double distribution)
mapping(address => bool) public hasDistributed;
```

### Functions

#### `calculateAndDistribute`

```solidity
function calculateAndDistribute(
    address market,
    PositionVault.RevealedPosition[] calldata positions,
    bool outcome
) external nonReentrant
```

**Purpose:** Main function — calculates payout for each winner and distributes USDT.

**Parameters:**
- `market` — The MarketContract address
- `positions` — All revealed positions from PositionVault
- `outcome` — The final market outcome (true = YES won, false = NO won)

**Behavior:**
1. Validates `msg.sender == positionVault`
2. Validates `hasDistributed[market] == false` (prevent double distribution)
3. Validates `market` has `status == Resolved`
4. Gets `totalCollateral` from `MarketContract(market).totalCollateral()`
5. Calculates fees:
   - `oracleFee = totalCollateral * ORACLE_FEE_BPS / 10000`
   - `mmFee = totalCollateral * MM_FEE_BPS / 10000`
   - `protocolFee = totalCollateral * PROTOCOL_FEE_BPS / 10000`
   - `netPool = totalCollateral - oracleFee - mmFee - protocolFee`
6. Filters positions by `direction == outcome` to get winners
7. Calculates `totalWinningStake` = sum of all winners' `collateralAmount`
8. For each winner, calculates `payout = (position.collateralAmount * netPool) / totalWinningStake`
9. Calls `MarketContract(market).distributePayout(winners[], amounts[])` to execute transfers
10. Sets `hasDistributed[market] = true`
11. Emits `PayoutsCalculated` event

**Edge case — no winners:**
If all bettors bet on the losing side (impossible in theory but defensive programming required):
- All collateral minus fees goes to protocol treasury
- Emits `NoWinnersEdgeCase` event

**Access:** Only `positionVault` address.

---

#### `getEstimatedPayout`

```solidity
function getEstimatedPayout(
    address market,
    uint256 stakeAmount,
    bool direction
) external view returns (uint256 estimatedPayout)
```

**Purpose:** Read-only function for frontend to estimate payout for a given bet. Uses current pool state — not guaranteed final payout.

**Note:** This is an estimate only. Final payout depends on total pool size at market close.

---

## 8. Shared Libraries & Interfaces

### `contracts/libraries/MarketLib.sol`

```solidity
library MarketLib {
    // Validate that a question string is acceptable
    function validateQuestion(string calldata question, uint256 maxLength)
        internal pure returns (bool)

    // Calculate fee amount from basis points
    function calculateFee(uint256 amount, uint256 feeBps)
        internal pure returns (uint256)

    // Calculate proportional payout
    function calculatePayout(
        uint256 winnerStake,
        uint256 totalWinningStake,
        uint256 netPool
    ) internal pure returns (uint256)
}
```

### `contracts/libraries/FeeLib.sol`

```solidity
library FeeLib {
    uint256 constant BPS_DENOMINATOR = 10000;

    function calculateFees(
        uint256 totalAmount,
        uint256 oracleBps,
        uint256 mmBps,
        uint256 protocolBps
    ) internal pure returns (
        uint256 oracleFee,
        uint256 mmFee,
        uint256 protocolFee,
        uint256 netAmount
    )
}
```

### `contracts/interfaces/IMarketContract.sol`

```solidity
interface IMarketContract {
    function status() external view returns (uint8);
    function outcome() external view returns (bool);
    function totalCollateral() external view returns (uint256);
    function deadline() external view returns (uint256);
    function oracleAgent() external view returns (address);
    function distributePayout(address[] calldata winners, uint256[] calldata amounts) external;
    function cancelMarket() external;
}
```

### `contracts/interfaces/IPositionVault.sol`

```solidity
interface IPositionVault {
    function commitPosition(address market, address bettor, bytes calldata commitment, uint256 amount) external;
    function revealPositions(address market, RevealedPosition[] calldata positions, bytes calldata proof) external;
    function refundAll(address market) external;
    function getPositionCount(address market) external view returns (uint256);
}
```

---

## 9. Events Reference

### ProphetFactory Events

```solidity
event MarketCreated(
    address indexed marketAddress,
    address indexed creator,
    string question,
    uint256 deadline,
    string category,
    bytes32 resolutionSourcesHash,
    uint256 indexed marketIndex
);
```

### MarketContract Events

```solidity
event BetPlaced(
    address indexed market,
    address indexed bettor,
    uint256 collateralAmount,
    uint256 positionIndex
);

event ResolutionTriggered(
    address indexed market,
    uint256 timestamp
);

event ResolutionPosted(
    address indexed market,
    bool verdict,
    bytes32 reasoningHash,
    uint256 challengeDeadline
);

event ResolutionChallenged(
    address indexed market,
    address indexed challenger,
    uint256 challengeStake
);

event ChallengeUpheld(
    address indexed market,
    address indexed challenger,
    uint256 reward
);

event ChallengeRejected(
    address indexed market,
    address indexed challenger,
    uint256 slashedStake
);

event ResolutionFinalized(
    address indexed market,
    bool outcome,
    uint256 timestamp
);

event PayoutsDistributed(
    address indexed market,
    uint256 totalDistributed,
    uint256 winnerCount
);

event MarketCancelled(
    address indexed market,
    string reason
);
```

### PositionVault Events

```solidity
event PositionCommitted(
    address indexed market,
    address indexed bettor,
    uint256 collateralAmount,
    uint256 positionIndex
);

event PositionsRevealed(
    address indexed market,
    uint256 totalPositions,
    uint256 timestamp
);

event PositionsRefunded(
    address indexed market,
    uint256 totalRefunded,
    uint256 positionCount
);
```

### PayoutDistributor Events

```solidity
event PayoutsCalculated(
    address indexed market,
    bool outcome,
    uint256 totalWinners,
    uint256 totalDistributed,
    uint256 totalFees
);

event NoWinnersEdgeCase(
    address indexed market,
    uint256 collateralSentToTreasury
);
```

---

## 10. Error Reference

All contracts use custom errors (gas-efficient, Solidity 0.8.4+):

```solidity
// ProphetFactory errors
error InvalidQuestion();                    // Empty or too long
error InvalidDeadline();                    // Too soon or in the past
error InvalidCategory();                    // Not an accepted category string

// MarketContract errors  
error MarketNotOpen();                      // Tried to bet on non-Open market
error DeadlineNotReached();                 // Tried to trigger resolution too early
error DeadlineAlreadyPassed();              // Tried to bet after deadline
error NotOracleAgent();                     // Caller is not the oracle agent
error NotPayoutDistributor();               // Caller is not payout distributor
error ChallengeWindowClosed();              // Challenge window has expired
error ChallengeAlreadyFiled();             // A challenge was already filed
error InsufficientChallengeStake();         // Challenger didn't provide enough USDT
error MarketNotResolved();                  // Tried to get payout before resolution
error MarketAlreadyCancelled();             // Market was cancelled

// PositionVault errors
error NotValidMarket();                     // Caller is not a valid Prophet market
error InvalidTeeProof();                    // TEE decryption proof failed verification
error PositionAlreadyRevealed();            // Position was already revealed
error MarketNotCancelled();                 // refundAll called on non-cancelled market

// PayoutDistributor errors
error NotPositionVault();                   // Caller is not the position vault
error AlreadyDistributed();                 // Payouts already sent for this market
error AmountsMismatch();                    // winners and amounts arrays different length
```

---

## 11. Access Control

### Role Summary

| Role | Address | Permissions |
|---|---|---|
| `owner` | Deployer (multisig in prod) | Update treasury address, pause in emergency |
| `oracleAgent` | 0G Agent ID wallet | Post resolution, process challenge outcome, cancel market, submit revealed positions |
| `marketMakerAgent` | 0G Agent ID wallet | Post price quotes (off-chain, no on-chain permissions beyond receiving fees) |
| `positionVault` | PositionVault contract | Call `distributePayout` on MarketContract via PayoutDistributor |
| `payoutDistributor` | PayoutDistributor contract | Call `distributePayout` on MarketContract |
| Public | Any address | Create markets, place bets, trigger resolution, challenge, finalize |

### No Upgradability

Prophet contracts are **not upgradeable proxies**. Once deployed, contract logic is immutable. This is intentional — it guarantees users that the rules cannot change after they place a bet. If bugs are found, a new version is deployed and the factory updated to point to new implementations.

---

## 12. 0G Chain Integration Notes

### Network Configuration

```javascript
// hardhat.config.js
module.exports = {
  networks: {
    ogTestnet: {
      url: process.env.OG_CHAIN_RPC_TESTNET,
      chainId: 16601,           // 0G Chain Galileo testnet chain ID
      accounts: [process.env.PRIVATE_KEY]
    },
    ogMainnet: {
      url: process.env.OG_CHAIN_RPC_MAINNET,
      chainId: 16600,           // 0G Chain mainnet chain ID
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  }
}
```

### USDT Address on 0G Chain

The USDT token contract address on 0G Chain must be confirmed from official 0G documentation before deployment. Store this in the `.env` file and pass it to `ProphetFactory` constructor — never hardcode it in contracts.

### Gas Considerations

0G Chain gas fees are extremely low compared to Ethereum. However, still follow gas optimization best practices:
- Use `calldata` instead of `memory` for function parameters where possible
- Use custom errors instead of `require` strings
- Pack struct variables efficiently
- Use `unchecked` blocks for arithmetic that cannot overflow

### Event Monitoring

The oracle agent and market maker agent off-chain services monitor the chain for events. The critical events that trigger off-chain actions are:

| Event | Triggers |
|---|---|
| `MarketCreated` | Market maker agent starts providing liquidity quotes |
| `ResolutionTriggered` | Oracle agent begins evidence gathering on 0G Compute |
| `ResolutionChallenged` | Oracle agent initiates second inference call |
| `ResolutionFinalized` | Oracle agent submits TEE decryption to PositionVault |

---

## 13. Security Considerations

### Reentrancy

All functions that transfer tokens use `nonReentrant` modifier from OpenZeppelin. Token transfers always happen LAST in any function (checks-effects-interactions pattern strictly enforced).

### Oracle Trust

The oracle agent address is immutable and set at market creation. There is no way for anyone — including the contract owner — to change the oracle address for an existing market after deployment. A compromised oracle can only affect markets it was assigned to.

### TEE Proof Verification

The `teeAttestation` parameter in `postResolution` and `revealPositions` must be cryptographically verified on-chain. The exact verification logic depends on the 0G TEE implementation. A placeholder `_verifyTeeAttestation(bytes calldata proof)` internal function must be implemented based on 0G's TEE attestation verification SDK.

### Integer Overflow

All contracts use Solidity ^0.8.20 which has built-in overflow protection. `unchecked` blocks are only used where overflow is mathematically impossible.

### Front-Running Protection

User positions are sealed via TEE. The `encryptedCommitment` stored on-chain is opaque — nobody can determine direction or amount from it. This is the core privacy guarantee. The only on-chain-visible information is:
- That a bet was placed (address + timestamp)
- The collateral amount (necessary for accounting)

Direction remains hidden until the TEE reveals all positions simultaneously at resolution.

### Challenge Griefing

The challenge stake requirement (5% of total collateral, minimum 50 USDT) prevents low-cost griefing attacks where bad actors spam challenges to delay payouts. The 24-hour challenge window is a deliberate tradeoff between security (catching wrong verdicts) and user experience (not waiting too long for payouts).

---

## 14. Deployment Order & Scripts

### Deployment Order

Contracts must be deployed in this exact order due to constructor dependencies:

```
1. ProphetFactory      (depends on: USDT address, oracle address, MM address, treasury)
2. PositionVault       (depends on: factory address)
3. PayoutDistributor   (depends on: factory address, oracle address, MM address, treasury, USDT address)

After all three deployed:
4. Call ProphetFactory.setVaultAndDistributor(vaultAddress, distributorAddress)
   to link the addresses (or pass them in constructor — design choice)
```

### Deploy Script Outline

```javascript
// scripts/deploy.js
async function main() {
  const [deployer] = await ethers.getSigners();

  // 1. Deploy ProphetFactory
  const ProphetFactory = await ethers.getContractFactory("ProphetFactory");
  const factory = await ProphetFactory.deploy(
    process.env.USDT_ADDRESS,
    process.env.ORACLE_AGENT_ADDRESS,
    process.env.MARKET_MAKER_ADDRESS,
    process.env.PROTOCOL_TREASURY
  );
  await factory.waitForDeployment();
  console.log("ProphetFactory deployed:", await factory.getAddress());

  // 2. Deploy PositionVault
  const PositionVault = await ethers.getContractFactory("PositionVault");
  const vault = await PositionVault.deploy(
    await factory.getAddress(),
    process.env.ORACLE_AGENT_ADDRESS,
    process.env.USDT_ADDRESS
  );
  await vault.waitForDeployment();
  console.log("PositionVault deployed:", await vault.getAddress());

  // 3. Deploy PayoutDistributor
  const PayoutDistributor = await ethers.getContractFactory("PayoutDistributor");
  const distributor = await PayoutDistributor.deploy(
    await factory.getAddress(),
    await vault.getAddress(),
    process.env.ORACLE_AGENT_ADDRESS,
    process.env.MARKET_MAKER_ADDRESS,
    process.env.PROTOCOL_TREASURY,
    process.env.USDT_ADDRESS
  );
  await distributor.waitForDeployment();
  console.log("PayoutDistributor deployed:", await distributor.getAddress());

  // 4. Link vault and distributor in factory
  await factory.setVaultAndDistributor(
    await vault.getAddress(),
    await distributor.getAddress()
  );

  console.log("Deployment complete.");
}
```

---

## 15. Testing Requirements

Every function must have tests covering:
- Happy path (expected behavior)
- Access control (wrong caller reverts with correct error)
- Edge cases (zero amounts, expired deadlines, double-calls)

### Critical Test Cases

```
ProphetFactory:
  ✓ createMarket deploys new MarketContract
  ✓ createMarket reverts with empty question
  ✓ createMarket reverts with question > 280 chars
  ✓ createMarket reverts with deadline in the past
  ✓ createMarket reverts with invalid category
  ✓ isValidMarket returns true for deployed market
  ✓ isValidMarket returns false for random address

MarketContract:
  ✓ placeBet transfers USDT and calls commitPosition
  ✓ placeBet reverts after deadline
  ✓ placeBet reverts if market not Open
  ✓ triggerResolution changes status to PendingResolution
  ✓ triggerResolution reverts before deadline
  ✓ postResolution stores verdict and opens challenge window
  ✓ postResolution reverts from non-oracle address
  ✓ challengeResolution accepts stake and records challenger
  ✓ challengeResolution reverts after challenge window
  ✓ challengeResolution reverts on second challenge attempt
  ✓ finalizeResolution resolves market after window with no challenge
  ✓ finalizeResolution reverts if challenge was filed
  ✓ processChallengeOutcome flips verdict and pays challenger on upheld
  ✓ processChallengeOutcome keeps verdict and slashes on rejected
  ✓ cancelMarket issues refunds and sets Cancelled status

PositionVault:
  ✓ commitPosition stores encrypted commitment
  ✓ commitPosition reverts from non-market caller
  ✓ revealPositions stores revealed positions and triggers distribution
  ✓ revealPositions reverts with invalid TEE proof
  ✓ refundAll sends USDT back to all bettors
  ✓ refundAll reverts on non-cancelled market

PayoutDistributor:
  ✓ calculateAndDistribute sends correct amounts to winners
  ✓ calculateAndDistribute deducts correct fees to all fee recipients
  ✓ calculateAndDistribute reverts on double distribution
  ✓ calculateAndDistribute handles edge case of no winners
  ✓ proportional payout calculation is mathematically correct
```

---

## 16. Complete Data Flow

This is the end-to-end flow of one complete market lifecycle for reference:

```
1. USER creates market
   → calls ProphetFactory.createMarket(question, deadline, category, sourcesHash)
   → MarketContract deployed at address X
   → 0G Storage KV: market:{X}:metadata written by off-chain agent
   → Market maker agent detects MarketCreated event, starts quoting prices

2. USERS place bets (market is Open, before deadline)
   → User approves MarketContract to spend their USDT
   → User calls MarketContract.placeBet(encryptedCommitment, amount)
   → USDT transferred to MarketContract
   → PositionVault.commitPosition() stores encrypted commitment
   → totalCollateral increases

3. DEADLINE passes
   → Anyone calls MarketContract.triggerResolution()
   → Status → PendingResolution
   → Oracle agent detects ResolutionTriggered event

4. ORACLE AGENT gathers evidence
   → Reads market metadata from 0G Storage (sources list)
   → Calls 0G Compute with oracle prompt
   → Receives verdict + reasoning from DeepSeek V3 with TeeML proof
   → Writes full reasoning to 0G Storage Log Layer
   → Calls MarketContract.postResolution(verdict, reasoningHash, teeAttestation)
   → Status → Challenged (challenge window opens for 24h)

5a. NO CHALLENGE filed within 24 hours
   → Anyone calls MarketContract.finalizeResolution()
   → Status → Resolved
   → MarketContract calls PositionVault.revealPositions()

5b. CHALLENGE filed within 24 hours
   → Challenger calls MarketContract.challengeResolution() with stake
   → Oracle agent detects ResolutionChallenged event
   → Oracle agent runs second stricter inference on 0G Compute
   → Oracle agent calls MarketContract.processChallengeOutcome(upheld)
   → Challenge resolved, status → Resolved
   → MarketContract calls PositionVault.revealPositions()

6. TEE DECRYPTION
   → Oracle agent's TEE service decrypts all encrypted commitments
   → Submits RevealedPosition[] array + teeDecryptionProof
   → PositionVault.revealPositions() validates proof and stores results
   → PositionVault calls PayoutDistributor.calculateAndDistribute()

7. PAYOUT DISTRIBUTION
   → PayoutDistributor calculates winner shares
   → Deducts fees (oracle 1%, MM 1%, protocol 0.5%)
   → Calls MarketContract.distributePayout(winners[], amounts[])
   → USDT transfers to all winners
   → Fees sent to oracle agent, market maker, treasury
   → MarketContract emits PayoutsDistributed
   → 0G Storage Log: payout record written permanently
```

---

## Final Notes for AI Assistants

If you are an AI assistant reading this document to help build Prophet's smart contracts:

1. **Never deviate from the access control rules defined in Section 11.** Every function has an explicit access control requirement — enforce it with the exact modifier or check described.

2. **The TEE attestation verification function is a placeholder.** Implement `_verifyTeeAttestation(bytes calldata proof)` as a stub that returns `true` for the hackathon MVP. Mark it with a `// TODO: integrate 0G TEE verification SDK` comment.

3. **All USDT amounts use 6 decimal places** (USDT standard). Never assume 18 decimals. `10e6 = 10 USDT`.

4. **Follow the checks-effects-interactions pattern strictly** in every function that transfers tokens. State changes first, external calls last.

5. **Use the exact event signatures defined in Section 9.** The off-chain oracle agent and market maker agent listen for these specific events. Wrong event signatures will break the system.

6. **Never use `tx.origin`.** Always use `msg.sender` for authorization.

7. **The deployment order in Section 14 is mandatory.** PositionVault and PayoutDistributor reference the factory — factory must exist first.

8. **All dollar amounts in tests should use USDT's 6 decimal precision.** Example: `ethers.parseUnits("100", 6)` for 100 USDT.

---

*Prophet Smart Contract Reference — Built for the 0G APAC Hackathon 2026*
*Version 1.0 — Last updated: April 2026*