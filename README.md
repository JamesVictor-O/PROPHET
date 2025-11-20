<div align="center">

# 🔮 PROPHET

<img src="frontend/public/Logo2.png" alt="Prophet Logo" width="300" />

> **Predict And Earn.**

**A revolutionary mobile-first prediction market platform on Celo MiniPay for African entertainment culture**

![Celo](https://img.shields.io/badge/Celo-F5F5F5?style=for-the-badge&logo=celo&logoColor=35D07F)
![MiniPay](https://img.shields.io/badge/MiniPay-Enabled-green?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Solidity](https://img.shields.io/badge/Solidity-0.8+-363636?style=for-the-badge&logo=solidity&logoColor=white)

[🚀 Live Demo](#-demo) • [📱 Features](#-key-features) • [🏗️ Architecture](#️-technical-architecture) • [💻 Development](#-getting-started) • [📖 Docs](#-documentation)

---

</div>

---

## 🌟 What is PROPHET?

Prophet is the **first mobile-first decentralized prediction market platform** specifically built for **Celo MiniPay Games**, enabling millions of Africans to monetize their entertainment and cultural knowledge through prediction markets.

### 🎯 The Problem We Solve

Millions of Africans are passionate experts in entertainment and pop culture, but there's **no way to monetize this knowledge**. Traditional prediction markets are:

- ❌ **Desktop-focused** (not mobile-first)
- ❌ **Limited to sports/finance** (ignoring culture)
- ❌ **High-barrier entry** (complex UX, large stakes)
- ❌ **Not accessible** to everyday users

**Prophet changes this by bringing prediction markets to mobile-first African entertainment culture.**

---

## 💡 Our Solution

Prophet is the **first mobile-first prediction market platform** designed for African entertainment culture. Users can:

### 🎵 For Users

- ✅ **Predict & Earn** - Stake on music releases, movie premieres, reality TV outcomes, and awards
- ✅ **Low Entry Barrier** - Start with just $0.25 (Binary) or $1.00 (CrowdWisdom) using cUSD
- ✅ **Two Market Types:**
  - **Binary Markets** - Classic Yes/No predictions (e.g., "Will Burna Boy drop an album in Q4?")
  - **CrowdWisdom Markets** - Multi-outcome predictions (e.g., "Who will win Big Brother Naija 2024?")
- ✅ **AI-Powered Validation** - Smart market validation detects past events, invalid questions, and suggests improvements
- ✅ **Build Reputation** - Leaderboard system tracks accuracy and earnings
- ✅ **Social Sharing** - Share predictions and challenge friends

### 🚀 Built for Celo MiniPay

- 📱 **Mobile-First Design** - Fully responsive, touch-optimized interface
- ⚡ **Instant Transactions** - Seamless wallet integration with MiniPay
- 🌍 **Accessible to Everyone** - Works on any device, anywhere
- 💰 **Low Fees** - Celo's low gas costs make micro-stakes viable

---

## ⚡ Key Features

### 🎯 Dual Market Types

1. **Binary Markets** (Yes/No)

   - Classic predictions: "Will [Artist] release an album this month?"
   - Clear outcomes, easy to understand
   - Minimum stake: $0.25 cUSD

2. **CrowdWisdom Markets** (Multi-Outcome) 🆕
   - Dynamic outcomes: "Who will win Big Brother Naija 2024?"
   - Users can create new outcomes by commenting (e.g., "Obi", "Atiku")
   - Visual outcome charts showing odds and pool distribution
   - Minimum stake: $1.00 cUSD

### 🤖 AI-Powered Market Validation (Powered by Google Gemini)

- **Smart Detection** - Identifies invalid markets:
  - ❌ Past events (already happened)
  - ❌ Already announced outcomes
  - ❌ Fixed results (100% certainty)
  - ❌ Known release dates
  - ❌ Markets created after event determined
- **Auto-Categorization** - Suggests market categories (music, movies, reality-tv, awards, sports)
- **Question Improvement** - AI reformulates unclear questions into proper prediction market questions
- **Market Type Suggestion** - Intelligently recommends Binary vs CrowdWisdom based on question analysis
- **End Date Prediction** - Estimates optimal resolution dates
- **Verification Sources** - Suggests where to verify outcomes

### 📱 Mobile-First Design

- **Fully Responsive** - Works perfectly on mobile, tablet, and desktop
- **Touch-Optimized** - Minimum 44px touch targets, smooth interactions
- **Fast Loading** - Optimized for MiniPay's mobile browser
- **Offline-First** - System font fallbacks ensure it works even offline

### 🏆 Reputation & Leaderboard

- **Accuracy Tracking** - See your prediction success rate
- **Earnings Display** - Track total winnings
- **Top Prophets** - Compete on the leaderboard
- **Username System** - Build your prophet identity

### 💰 Fair Economics

- **Low Minimum Stakes** - Accessible to everyone ($0.25 Binary, $1.00 CrowdWisdom)
- **Transparent Fees** - 5% platform fee, 2% creator reward, 93% to winners
- **Pool Caps** - $1,000 maximum per market (prevents whale manipulation)
- **Dynamic Odds** - Real-time odds based on pool distribution

---

## 🏗️ Technical Architecture

### 📦 Smart Contracts (Solidity + Foundry)

**Deployed on Celo Sepolia Testnet**

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
├── test/
│   ├── unit/
│   │   ├── PredictionMarket.t.sol   # Binary market tests
│   │   ├── CrowdWisdomMarket.t.sol  # CrowdWisdom market tests
│   │   ├── MarketFactory.t.sol      # Factory tests
│   │   └── Oracle.t.sol             # Resolution tests
│   └── helpers/
│       └── TestSetup.sol            # Test utilities
└── script/
    ├── Deploy.s.sol                 # Mainnet/testnet deployment
    ├── DeployLocal.s.sol            # Local deployment
    └── PostDeploy.s.sol             # Post-deployment setup
```

**Key Contract Features:**

- ✅ **Dual Market Types** - Binary (Yes/No) and CrowdWisdom (Multi-Outcome)
- ✅ **Dynamic Outcome Creation** - Users can create outcomes by commenting
- ✅ **Anti-Farming Rules** - Min/max stakes, pool caps, outcome limits
- ✅ **Normalized String Matching** - Case-insensitive outcome matching
- ✅ **Automated Payouts** - Proportional distribution to winners
- ✅ **Gas Optimized** - Efficient storage and computation

**Contract Addresses (Celo Sepolia Testnet):**

| Contract             | Address                                      | Explorer                                                                                |
| -------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------- |
| **MarketFactory**    | `0xEe608D11EfEC619Df33ff571c80FAad704037f75` | [View](https://sepolia.celoscan.xyz/address/0xEe608D11EfEC619Df33ff571c80FAad704037f75) |
| **PredictionMarket** | `0xe38b7cD2Ac963b89d41bD3e14681252e95ef3eDe` | [View](https://sepolia.celoscan.xyz/address/0xe38b7cD2Ac963b89d41bD3e14681252e95ef3eDe) |
| **Oracle**           | `0xa33bE09908844118B4420387F3DbeCBc86Bf1604` | [View](https://sepolia.celoscan.xyz/address/0xa33bE09908844118B4420387F3DbeCBc86Bf1604) |
| **ReputationSystem** | `0xe3C4Ba993d7b07EF7771D6061fC9928C1fAEc89B` | [View](https://sepolia.celoscan.xyz/address/0xe3C4Ba993d7b07EF7771D6061fC9928C1fAEc89B) |
| **cUSD**             | `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1` | [View](https://sepolia.celoscan.xyz/address/0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1) |

### 💻 Frontend (Next.js 16 + React 19)

```
frontend/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── validate-market/     # AI validation API route
│   │   ├── dashboard/               # Main dashboard page
│   │   └── layout.tsx               # Root layout
│   ├── components/
│   │   ├── markets/
│   │   │   ├── create-market-modal.tsx    # Market creation (AI-validated)
│   │   │   └── market-card.tsx            # Market display (Binary/CrowdWisdom)
│   │   ├── dashboard/
│   │   │   └── prediction-modal.tsx       # Prediction interface
│   │   ├── predictions/
│   │   │   └── prediction-card.tsx        # User predictions display
│   │   └── ui/                      # Reusable UI components
│   ├── hooks/
│   │   ├── contracts/               # Contract interaction hooks
│   │   │   ├── useCreateBinaryMarket.ts
│   │   │   ├── useCreateCrowdWisdomMarket.ts
│   │   │   ├── useCommentAndStake.ts
│   │   │   └── useMarketOutcomes.ts
│   │   └── useAIValidator.ts        # AI validation hook
│   └── lib/
│       ├── contracts.ts             # Contract addresses & config
│       ├── types.ts                 # TypeScript types
│       └── ai-validator-client.ts   # AI validation client
```

**Tech Stack:**

- ⚛️ **React 19** - Latest React with compiler optimizations
- 🚀 **Next.js 16** (Turbopack) - Fast builds and hot reload
- 🎨 **Tailwind CSS v4** - Utility-first styling
- 🔗 **Wagmi + Viem** - Type-safe Ethereum/Celo interactions
- 📱 **Radix UI** - Accessible component primitives
- 🎯 **TypeScript** - Full type safety
- 🤖 **Google Gemini API** - AI-powered market validation
- 📦 **Sonner** - Toast notifications

### 🤖 AI Validation System

**Powered by Google Gemini API**

- **Question Analysis** - Validates question clarity and feasibility
- **Category Detection** - Auto-categorizes (music, movies, reality-tv, awards, sports)
- **Invalid Market Detection** - Flags past events, fixed results, announced outcomes
- **Market Type Suggestion** - Recommends Binary vs CrowdWisdom
- **Question Improvement** - Suggests clearer reformulations
- **End Date Prediction** - Estimates optimal resolution dates

### Oracle System

**Phase 1 (MVP):** Manual verification by team

- Monitor official sources (Spotify, YouTube, show announcements)
- Resolve markets within 24 hours of outcome
- Multi-sig resolution for security

**Phase 2 (Post-Hackathon):** Automated oracles

- Spotify/Apple Music API integration
- YouTube Data API for view counts
- Chainlink for decentralized verification
- Community dispute mechanism

---

## 💰 Economic Model

### 📊 Pool Distribution

```
Total Pool: 100%
├── 93% → Winners (proportional to stake)
├── 5%  → Platform fee (sustainability)
└── 2%  → Market creator reward (incentivizes quality markets)
```

### 💵 Stake Ranges

| Market Type     | Minimum Stake | Maximum Stake | Pool Cap |
| --------------- | ------------- | ------------- | -------- |
| **Binary**      | $0.25 cUSD    | $20 cUSD      | $1,000   |
| **CrowdWisdom** | $1.00 cUSD    | $20 cUSD      | $1,000   |

**Why Different Minimums?**

- Binary markets are simpler and lower risk → Lower entry ($0.25)
- CrowdWisdom markets are more complex with multiple outcomes → Higher entry ($1.00)

### 🎁 Incentive Mechanisms

- 🏆 **Leaderboard Rewards** - Weekly/monthly prizes for top prophets
- 🔥 **Win Streaks** - Bonuses for consecutive correct predictions
- 👥 **Referral Program** - Earn from bringing friends
- 🎯 **Market Creator Rewards** - 2% fee for creating quality markets

---

## 🚀 Go-to-Market Strategy

### Phase 1: Seed (Week 1-2)

- Launch with 10 curated markets
- Invite 50 culture influencers
- $5 free credit per user
- Collect feedback, iterate rapidly

### Phase 2: Viral Growth (Week 3-4)

- Partner with micro-influencers (10k-50k followers)
- Twitter campaign: #ProveYoureProphet
- Shareable "Prophet Card" graphics
- WhatsApp group seeding

### Phase 3: Community Markets (Month 2+)

- User-submitted markets (curated approval)
- Reward top market creators
- Campus ambassador program
- Music blog partnerships (NotJustOk, TooXclusive)

### Distribution Channels

1. **Twitter/X** - Primary (culture conversations happen here)
2. **WhatsApp** - Share predictions with friend groups
3. **University campuses** - Student ambassadors
4. **Entertainment blogs** - Content partnerships

---

## 📱 User Experience

### Onboarding (30 seconds)

1. Open Prophet in MiniPay browser
2. Connect wallet (one tap)
3. Browse trending markets
4. Select prediction + stake amount
5. Confirm transaction
6. Get shareable "Prophet Card" for social media

### Market Interface

```
┌─────────────────────────────────────┐
│ 🎵 Will Rema release in December?   │
│                                     │
│     [YES 65%] ←→ [NO 35%]          │
│                                     │
│     Your stake: $1                  │
│     Potential win: $1.54            │
│                                     │
│     Pool: $450 • Ends: Dec 31      │
│     127 Prophets participating      │
│                                     │
│     [PREDICT YES]  [PREDICT NO]     │
└─────────────────────────────────────┘
```

### Social Features

- Auto-generated prediction cards (Twitter/IG stories)
- "Your friend predicted YES" social proof
- Leaderboard with top prophets
- Challenge friends directly
- Win/loss history showcase

---

## 🛡️ Risk Mitigation

### Oracle Manipulation

- Multi-source data verification
- 48-hour dispute period
- Community voting for unclear outcomes
- Refund mechanism if oracle fails

### Regulatory Compliance

- Framed as "skill-based predictions" not gambling
- Age verification (18+)
- Terms: "For entertainment purposes"
- KYC-lite (phone verification)

### Smart Contract Security

- Audited by [TBD]
- Timelock for upgrades
- Emergency pause function
- Bug bounty program

### Liquidity Management

- House-funded initial pools ($50-100 each)
- Reserve fund for guaranteed payouts
- Gradual transition to peer-to-peer pools

---

### ✅ Smart Contracts

- [x] **MarketFactory** - Factory pattern for market creation
- [x] **PredictionMarket** - Binary + CrowdWisdom market logic
- [x] **Oracle** - Market resolution system
- [x] **ReputationSystem** - User stats and leaderboard
- [x] **Comprehensive Tests** - 100% coverage for critical paths
- [x] **Deployed to Celo Sepolia** - All contracts verified

### ✅ Frontend Features

- [x] **Responsive Dashboard** - Mobile-first design
- [x] **Market Creation** - AI-validated, streamlined flow
- [x] **Binary Markets** - Yes/No predictions with dynamic odds
- [x] **CrowdWisdom Markets** - Multi-outcome with visual charts
- [x] **Prediction Interface** - Touch-optimized modals
- [x] **Leaderboard** - Real-time top prophets ranking
- [x] **User Profile** - Stats, predictions, earnings
- [x] **My Predictions** - Different UI for Binary vs CrowdWisdom

### ✅ AI Integration

- [x] **Market Validation** - Detects invalid markets
- [x] **Category Detection** - Auto-categorization
- [x] **Question Improvement** - AI-suggested reformulations
- [x] **Market Type Suggestion** - Binary vs CrowdWisdom recommendation
- [x] **End Date Prediction** - Optimal resolution dates

### ✅ User Experience

- [x] **Mobile-First Design** - Fully responsive across all devices
- [x] **Touch Optimization** - Minimum 44px touch targets
- [x] **Loading States** - Clear feedback during transactions
- [x] **Error Handling** - Graceful error messages
- [x] **Wallet Integration** - Seamless MiniPay connection

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Git
- A Celo MiniPay wallet (for testing)

### Installation

```bash
# Clone the repository
git clone https://github.com/JamesVictor-O/PROPHET.git
cd PROPHET

# Install dependencies
cd frontend
npm install

# Set up environment variables
cp .env.example .env.local
# Add your GEMINI_API_KEY to .env.local

# Run development server
npm run dev
```

### Contract Deployment

```bash
cd contract

# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Run tests
forge test

# Deploy to Celo Sepolia
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $CELO_SEPOLIA_RPC \
  --broadcast \
  --verify
```

### Environment Variables

**Frontend** (`frontend/.env.local`):

```env
NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
```

**Contracts** (for deployment):

```env
PRIVATE_KEY=your_private_key
CELO_ETHERSCAN_API_KEY=your_api_key
```

## 📱 Demo

### 🎯 Live Demo

- **Frontend:** [Coming soon - Add your deployed URL]
- **Testnet:** Celo Sepolia
- **Explorer:** [https://sepolia.celoscan.xyz](https://sepolia.celoscan.xyz)

### 📸 Screenshots

- Add screenshots of key features here

## 🗓️ Future Roadmap

### Phase 2: Enhanced Features

- [ ] **Automated Oracle** - Spotify/YouTube API integration
- [ ] **Social Sharing** - Prophet cards for Twitter/Instagram
- [ ] **Push Notifications** - Market resolution alerts
- [ ] **Advanced Analytics** - Prediction history and trends

### Phase 3: Scale

- [ ] **Mobile App** - Native iOS/Android apps
- [ ] **Community Markets** - User-curated markets
- [ ] **Tournaments** - Competitive prediction events
- [ ] **Multi-Chain** - Expand to other EVM chains

---

## 🎯 Why Prophet Wins

### For Users:

✅ Turn cultural knowledge into income  
✅ Fun, social, low-stakes engagement  
✅ Build reputation as a "prophet"  
✅ Mobile-first, accessible to everyone

### For Celo Ecosystem:

✅ Drives MiniPay adoption  
✅ Real-world use case for stablecoins  
✅ Mobile-first DeFi innovation  
✅ Brings new users to crypto

---

- **Website:** [https://prophet-nine.vercel.app]

---

## 📜 License

MIT License - see [LICENSE.md](LICENSE.md)

---

_"Every prophet was once a skeptic. Prove you're a prophet and earn"_
