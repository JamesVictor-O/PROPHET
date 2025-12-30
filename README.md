<div align="center">

# 🔮 PROPHET

<img src="frontend/public/Logo2.png" alt="Prophet Logo" width="300" />

> **Predict And Earn.** > **The most advanced ERC-7715 + Envio-powered prediction market platform**

**A revolutionary mobile-first prediction market platform featuring Set-and-Forget AI strategies, One-Tap Betting, and real-time Envio-indexed activity feeds**

![Celo](https://img.shields.io/badge/Celo-F5F5F5?style=for-the-badge&logo=celo&logoColor=35D07F)
![ERC-7715](https://img.shields.io/badge/ERC--7715-Advanced%20Permissions-blue?style=for-the-badge)
![Envio](https://img.shields.io/badge/Envio-Indexer-green?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Solidity](https://img.shields.io/badge/Solidity-0.8+-363636?style=for-the-badge&logo=solidity&logoColor=white)

[🚀 Live Demo](#-demo) • [🔐 ERC-7715 Features](#-erc-7715-advanced-permissions) • [📊 Envio Integration](#-envio-indexer-integration) • [💻 Development](#-getting-started) • [📖 Docs](#-documentation)

---

</div>

---

## 🌟 What is PROPHET?

Prophet is the **first prediction market platform** to fully leverage **ERC-7715 Execution Permissions** and **Envio Indexer** to deliver:

- 🤖 **Set-and-Forget AI Prediction Strategies** - Automatically place predictions using delegated permissions
- ⚡ **One-Tap Betting** - Zero wallet popups after initial permission grant
- 📊 **Real-Time Activity Feeds** - Live market updates powered by Envio GraphQL
- 🎯 **Session Account Architecture** - Advanced permission delegation with auto-transfer

### 🎯 The Problem We Solve

Traditional prediction markets require:

- ❌ **Repeated wallet confirmations** for every transaction
- ❌ **Manual monitoring** of markets and opportunities
- ❌ **Slow data queries** from blockchain RPC calls
- ❌ **No automation** for active trading strategies

**Prophet solves this by combining ERC-7715 permissions with Envio indexing to create the most seamless prediction market experience.**

---

## 🔐 ERC-7715 Advanced Permissions

Prophet showcases the **most creative and advanced use of ERC-7715** in production:

### 🚀 Key Features

#### 1. **Set-and-Forget Prediction Strategies** 🤖

**The Killer Feature**: Users can create AI-powered prediction strategies that automatically execute predictions without any manual intervention.

**How It Works**:

```typescript
const strategy = {
  name: "Sports Market Auto-Bet",
  conditions: [
    {
      type: "new_market",
      categories: ["sports"],
      minConfidence: 60,
    },
  ],
  action: {
    stakeAmount: 0.025,
    side: "auto",
    minConfidence: 50,
  },
  limits: {
    maxTotalStake: 10.0,
    maxPredictionsPerDay: 5,
  },
};
```

**Architecture**:

1. **Permission Grant** (One-Time):

   - User grants ERC-7715 permission to session account
   - Permission includes spending limits and time windows
   - Stored in `PermissionProvider` with localStorage persistence

2. **Session Account Creation**:

   - App generates session key (private key)
   - Creates MetaMask Smart Account owned by session key
   - Session account acts as delegate in ERC-7715 permission

3. **Strategy Execution**:
   - `StrategyExecutor` service monitors markets every 60 seconds
   - When conditions match, calls `redeemWithUSDCTransfer()`
   - Automatically transfers USDC from user's EOA to session account
   - Executes prediction transaction via session account
   - **All without wallet popups!**

**Files**:

- `frontend/src/services/strategyExecutor.ts` - Core executor logic
- `frontend/src/hooks/useStrategyExecutor.ts` - React integration
- `frontend/src/hooks/useRedeemDelegations.ts` - ERC-7715 execution with auto-transfer
- `frontend/src/components/strategies/` - Strategy management UI

#### 2. **One-Tap Betting** ⚡

**Traditional Flow** (Every Prediction):

```
User clicks "Predict" → MetaMask popup → Sign transaction → Wait for confirmation
```

**Prophet Flow** (After Permission Grant):

```
User clicks "Predict" → Transaction executes instantly → Done!
```

**Implementation**:

- Uses `redeemDelegations()` from MetaMask Smart Accounts Kit
- Session account executes transactions via ERC-7715 delegation
- Gas sponsored by Pimlico Paymaster
- USDC automatically transferred from EOA to session account when needed

**Files**:

- `frontend/src/hooks/useRedeemDelegations.ts` - Redeem delegation with USDC transfer
- `frontend/src/components/wallet/permissions-manager.tsx` - Permission UI
- `frontend/src/providers/SessionAccountProvider.tsx` - Session account management

#### 3. **Redeem Delegations with Auto Transfer** 💰

**Innovation**: Prophet implements a unique pattern where USDC is automatically transferred from the user's EOA to the session account **within the same permission context**, then executes contract calls.

```typescript
// Step 1: Transfer USDC from EOA to session account (via DelegationManager)
const transferExecution = createExecution({
  target: usdcAddress,
  callData: encodeFunctionData({
    abi: ERC20_ABI,
    functionName: "transfer",
    args: [sessionAccountAddress, usdcAmount],
  }),
});

// Step 2: Redeem delegation (executes FROM user's account)
await redeemDelegations(sessionWalletClient, publicClient, delegationManager, [
  {
    permissionContext: permission.context,
    executions: [transferExecution],
    mode: ExecutionMode.SingleDefault,
  },
]);

// Step 3: Execute prediction from session account (now has USDC)
await sendUserOperationWithDelegation({
  account: sessionSmartAccount,
  calls: [predictionCall],
  permissionsContext: permission.context,
  delegationManager,
});
```

**Why This Matters**:

- Session account doesn't need pre-funding
- USDC transfer and execution happen atomically
- Permission limits are enforced by `ERC20PeriodTransferEnforcer`
- Automatic retry logic handles nonce mismatches

**Files**:

- `frontend/src/hooks/useRedeemDelegations.ts` - Complete implementation

#### 4. **Permission Management** 🔒

- **Persistent Storage**: Permissions stored in localStorage with expiry validation
- **Auto-Validation**: Checks permission expiry before execution
- **Revocation**: Users can revoke permissions anytime
- **Limit Enforcement**: Daily and total spending limits enforced by smart contracts

**Files**:

- `frontend/src/providers/PermissionProvider.tsx` - Permission state management
- `frontend/src/components/wallet/permissions-manager.tsx` - Permission UI

### 🏗️ Architecture Overview

```
User EOA (MetaMask)
    ↓
    │ 1. Grant ERC-7715 Permission (once)
    ↓
MetaMask Creates Gator Smart Account (auto)
    ↓
    │ 2. Delegates to Session Account
    ↓
Session Smart Account (ERC-4337)
    ↓
    │ 3. Execute Transactions (many times, no popups)
    ↓
Bundler + Paymaster (Pimlico)
    ↓
Blockchain
```

**Key Components**:

1. **SessionAccountProvider**: Creates and manages session smart account
2. **PermissionProvider**: Stores and validates ERC-7715 permissions
3. **useRedeemDelegations**: Executes transactions via delegation
4. **StrategyExecutor**: Monitors markets and auto-executes strategies

**Documentation**: See `ADVANCED_PERMISSIONS_ARCHITECTURE.md` for complete technical details.

---

## 📊 Envio Indexer Integration

Prophet leverages **Envio Indexer** for the **best-in-class real-time data experience**:

### 🚀 Key Features

#### 1. **Real-Time Market Data** 📈

**Traditional Approach**:

- Query blockchain RPC for each market (slow, expensive)
- No historical data aggregation
- Manual state management

**Prophet Approach**:

- Envio indexes all contract events in real-time
- GraphQL API provides instant queries
- Aggregated entities (Market, Prediction, User) pre-computed
- Sub-second query times

**Example Query**:

```graphql
query GetMarkets {
  Market(limit: 10, order_by: { createdAt: desc }) {
    id
    marketId
    question
    category
    totalPool
    yesPool
    noPool
    predictionCount
    status
    resolved
  }
}
```

**Files**:

- `indexer/src/EventHandlers.ts` - Event indexing logic
- `indexer/schema.graphql` - GraphQL schema
- `frontend/src/hooks/contracts/useAllMarkets.ts` - Frontend integration

#### 2. **Activity Feeds** 🎯

**Home Page Activity Feed**:

- Real-time trending events from Envio
- Latest market updates
- User prediction history
- Market resolution notifications

**Implementation**:

```typescript
const { data: marketsData } = useAllMarkets();
```

**Files**:

- `frontend/src/app/dashboard/home/page.tsx` - Home page with activity feed
- `frontend/src/hooks/useAfricanEvents.ts` - Event data hook

#### 3. **Aggregated Entities** 📊

Envio automatically aggregates raw events into useful entities:

**Market Entity**:

- Combines `MarketCreated`, `PredictionMade`, `MarketResolved` events
- Pre-computes `totalPool`, `yesPool`, `noPool`, `predictionCount`
- Tracks `status` and `resolved` state

**User Entity**:

- Aggregates all user predictions
- Calculates `totalPredictions`, `correctPredictions`, `totalWinnings`
- Tracks `currentStreak`, `bestStreak`, `reputationScore`

**GlobalStats Entity**:

- Platform-wide metrics
- `totalMarkets`, `totalPredictions`, `totalVolume`, `totalUsers`

**Files**:

- `indexer/src/EventHandlers.ts` - Entity aggregation logic
- `indexer/schema.graphql` - Entity definitions

#### 4. **Event Indexing** 🔄

Envio indexes all contract events:

- `MarketCreated` → Creates Market entity
- `PredictionMade` → Updates Market pools, creates Prediction entity
- `MarketResolved` → Updates Market status
- `PayoutClaimed` → Updates Prediction and User entities
- `ReputationUpdated` → Updates User reputation
- `UsernameSet` → Updates User username

**Files**:

- `indexer/src/EventHandlers.ts` - Complete event handlers
- `indexer/config.yaml` - Indexer configuration

### 🏗️ Architecture

```
Contract Events
    ↓
Envio Indexer (Real-time)
    ↓
PostgreSQL Database
    ↓
GraphQL API (Hasura)
    ↓
Frontend (React/Next.js)
```

**Benefits**:

- ⚡ **Sub-second queries** vs. multi-second RPC calls
- 📊 **Pre-aggregated data** (pools, counts, stats)
- 🔄 **Real-time updates** via GraphQL subscriptions
- 💰 **Cost efficient** (no RPC rate limits)
- 📈 **Scalable** (handles thousands of markets)

**Documentation**: See `indexer/README.md` for setup and GraphQL examples.

---

## ⚡ Key Features

### 🎯 Dual Market Types

1. **Binary Markets** (Yes/No)

   - Classic predictions: "Will [Artist] release an album this month?"
   - Minimum stake: $0.25 cUSD

2. **CrowdWisdom Markets** (Multi-Outcome) 🆕
   - Dynamic outcomes: "Who will win Big Brother Naija 2024?"
   - Users can create new outcomes by commenting
   - Minimum stake: $1.00 cUSD

### 🤖 AI-Powered Market Validation

- **Smart Detection** - Identifies invalid markets (past events, fixed results)
- **Auto-Categorization** - Suggests market categories
- **Question Improvement** - AI reformulates unclear questions
- **Market Type Suggestion** - Recommends Binary vs CrowdWisdom

### 📱 Mobile-First Design

- Fully responsive, touch-optimized interface
- Fast loading optimized for mobile browsers
- Offline-first with system font fallbacks

### 🏆 Reputation & Leaderboard

- Accuracy tracking and earnings display
- Top Prophets leaderboard
- Username system for prophet identity

---

## 🏗️ Technical Architecture

### 📦 Smart Contracts (Solidity + Foundry)

**Deployed on Base Sepolia Testnet**

```
contract/
├── src/
│   ├── core/
│   │   ├── MarketFactory.sol        # Factory for creating markets
│   │   ├── PredictionMarket.sol     # Core prediction logic (Binary + CrowdWisdom)
│   │   ├── Oracle.sol               # Market resolution system
│   │   └── ReputationSystem.sol     # User stats & leaderboard
│   └── interfaces/
│       ├── IPredictionMarket.sol    # Market interface
│       └── IMarketFactory.sol       # Factory interface
```

**Key Contract Features**:

- ✅ Dual Market Types (Binary + CrowdWisdom)
- ✅ Dynamic Outcome Creation
- ✅ Anti-Farming Rules
- ✅ Automated Payouts
- ✅ Gas Optimized

### 💻 Frontend (Next.js 16 + React 19)

```
frontend/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── validate-market/     # AI validation API route
│   │   ├── dashboard/
│   │   │   ├── home/                # Home page with activity feed
│   │   │   ├── strategies/         # Set-and-Forget strategies
│   │   │   └── profile/             # User profile
│   │   └── layout.tsx
│   ├── components/
│   │   ├── strategies/              # Strategy management
│   │   ├── markets/
│   │   ├── dashboard/
│   │   └── wallet/                  # Permission management
│   ├── hooks/
│   │   ├── useStrategyExecutor.ts  # Strategy executor hook
│   │   ├── useRedeemDelegations.ts # ERC-7715 execution
│   │   └── contracts/
│   ├── providers/
│   │   ├── SessionAccountProvider.tsx
│   │   └── PermissionProvider.tsx
│   ├── services/
│   │   ├── strategyExecutor.ts      # Core executor service
│   │   └── bundlerClient.ts         # Pimlico bundler
│   └── lib/
```

**Tech Stack**:

- ⚛️ React 19 with compiler optimizations
- 🚀 Next.js 16 (Turbopack)
- 🎨 Tailwind CSS v4
- 🔗 Wagmi + Viem
- 📱 Radix UI
- 🎯 TypeScript
- 🤖 Google Gemini API
- 📦 Sonner

### 📊 Envio Indexer

```
indexer/
├── src/
│   └── EventHandlers.ts            # Event indexing logic
├── schema.graphql                  # GraphQL schema
├── config.yaml                     # Indexer configuration
└── generated/                      # Auto-generated types
```

**Indexed Contracts**:

- MarketFactory - Market creation events
- PredictionMarket - Prediction and resolution events
- Oracle - Market resolution events
- ReputationSystem - User reputation events

**GraphQL Endpoints**:

- `/v1/graphql` - Main GraphQL API
- Real-time subscriptions supported
- Pre-aggregated entities (Market, Prediction, User, GlobalStats)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Git
- Docker Desktop (for Envio indexer)
- MetaMask wallet with Base Sepolia testnet

### Installation

```bash
# Clone the repository
git clone https://github.com/JamesVictor-O/PROPHET.git
cd PROPHET

# Install frontend dependencies
cd frontend
npm install

# Set up environment variables
cp .env.example .env.local
# Add your GEMINI_API_KEY and PIMLICO_API_KEY to .env.local

# Run development server
npm run dev
```

### Envio Indexer Setup

```bash
cd indexer

# Install dependencies
npm install

# Generate types from schema
npm run codegen

# Start the indexer (requires Docker)
npm run dev
```

Visit `http://localhost:8080` for GraphQL Playground (password: `testing`).

### Contract Deployment

```bash
cd contract

# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Run tests
forge test

# Deploy to Base Sepolia
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $BASE_SEPOLIA_RPC \
  --broadcast \
  --verify
```

### Environment Variables

**Frontend** (`frontend/.env.local`):

```env
NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
NEXT_PUBLIC_PIMLICO_API_KEY=your_pimlico_key
NEXT_PUBLIC_ENVIO_GRAPHQL_URL=http://localhost:8080/v1/graphql
```

**Indexer** (`indexer/.env`):

```env
RPC_URL=your_base_sepolia_rpc_url
```

---

## 📖 Documentation

### ERC-7715 Implementation

- **Architecture**: `ADVANCED_PERMISSIONS_ARCHITECTURE.md`
- **Session Accounts**: `SMART_ACCOUNT_ARCHITECTURE_EXPLAINED.md`
- **Code Examples**: See `frontend/src/hooks/useRedeemDelegations.ts`

### Envio Indexer

- **Setup Guide**: `indexer/README.md`
- **GraphQL Queries**: See `indexer/README.md#graphql-queries`
- **Event Handlers**: `indexer/src/EventHandlers.ts`

### Strategy Executor

- **How It Works**: `frontend/src/services/strategyExecutor.ts`
- **React Integration**: `frontend/src/hooks/useStrategyExecutor.ts`
- **UI Components**: `frontend/src/components/strategies/`

---

## 🎯 Why Prophet Wins

### For Users:

✅ **Set-and-Forget Strategies** - Automate predictions with AI  
✅ **One-Tap Betting** - Zero wallet popups after permission grant  
✅ **Real-Time Data** - Instant market updates via Envio  
✅ **Mobile-First** - Works perfectly on any device

### For Developers:

✅ **Most Advanced ERC-7715 Implementation** - Session accounts, auto-transfer, strategy execution  
✅ **Best Envio Usage** - Real-time indexing, GraphQL queries, aggregated entities  
✅ **Production-Ready** - Complete error handling, retry logic, permission limits  
✅ **Well-Documented** - Comprehensive architecture docs and code comments

---

## 🗓️ Roadmap

### Phase 2: Enhanced Features

- [ ] **GraphQL Subscriptions** - Real-time market updates via WebSocket
- [ ] **Advanced Strategy Conditions** - Time-based triggers, odds thresholds
- [ ] **Multi-Chain Support** - Expand to other EVM chains
- [ ] **Mobile App** - Native iOS/Android apps

### Phase 3: Scale

- [ ] **Community Markets** - User-curated markets
- [ ] **Tournaments** - Competitive prediction events
- [ ] **API Access** - Public GraphQL API for third-party integrations

---

## 📜 License

MIT License - see [LICENSE.md](LICENSE.md)

---

_"Every prophet was once a skeptic. Prove you're a prophet and earn"_

**Built with ❤️ using ERC-7715 and Envio**
