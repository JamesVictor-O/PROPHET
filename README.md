# 🔮 PROPHET

> **Predict anything. Earn everything.**

Prophet is a mobile-first decentralized prediction market platform built on Celo, designed for MiniPay users to monetize their cultural knowledge and earn rewards for accurate predictions.

---

## 🎯 Problem Statement

Millions of Africans are passionate experts in entertainment, pop culture, and their local communities—but there's no way to monetize this knowledge. Traditional prediction markets are:
- Desktop-focused (not mobile-first)
- Limited to sports/finance (ignoring culture)
- High-barrier entry (complex UX, large stakes)
- Not accessible to everyday users

**Prophet changes this.**

---

## 💡 Solution

Prophet is a **prediction market platform** where users can:
- ✅ Predict outcomes in entertainment, music, movies, and pop culture
- ✅ Stake small amounts (starting at $0.25) using Celo/cUSD
- ✅ Earn rewards for accurate predictions
- ✅ Build reputation as a "top prophet"
- ✅ Share predictions socially and challenge friends

**Built for MiniPay** - Optimized for Opera MiniPay's mobile-first experience.

---

## 🎵 Launch Category: Entertainment Predictions

### Market Examples:
- **Music:** "Will [Artist] release a song this month?"
- **Movies:** "Will [Nollywood Film] hit 1M views in week 1?"
- **Reality TV:** "Who gets evicted from BBNaija this week?"
- **Awards:** "Who wins Best Artist at the Headies?"

### Why Entertainment First?
1. **Massive engaged audience** - Afrobeats, Nollywood, BBNaija fans are extremely active
2. **Clear, verifiable outcomes** - Results are public and indisputable
3. **Viral potential** - Fans love sharing predictions and challenging friends
4. **Underserved market** - No existing prediction platforms for African entertainment

---

## 🏗️ Technical Architecture

### Smart Contracts (Celo)
```
prophet-contracts/
├── MarketFactory.sol      # Creates new prediction markets
├── PredictionMarket.sol   # Handles betting logic & payouts
├── Oracle.sol             # Resolves markets with external data
└── ReputationSystem.sol   # Tracks user accuracy & streaks
```

**Key Features:**
- Binary outcome markets (YES/NO)
- Dynamic odds based on pool distribution
- Automated payouts on resolution
- 48-hour dispute window
- House-funded liquidity for MVP

### Frontend (MiniPay PWA)
```
prophet-app/
├── components/
│   ├── MarketCard.js      # Individual prediction display
│   ├── PredictModal.js    # Staking interface
│   ├── Leaderboard.js     # Top prophets
│   └── ShareCard.js       # Social sharing
├── pages/
│   ├── Home.js            # Active markets feed
│   ├── Market.js          # Single market detail
│   ├── Profile.js         # User stats & history
│   └── Create.js          # Market creation (future)
└── utils/
    ├── wallet.js          # MiniPay SDK integration
    ├── contracts.js       # Web3 interactions
    └── api.js             # Oracle data fetching
```

**Tech Stack:**
- React + Next.js (PWA)
- Tailwind CSS (mobile-first)
- MiniPay SDK (wallet connection)
- Wagmi/Viem (Celo interactions)

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

### Pool Distribution
```
Total Pool: 100%
├── 93% → Winners (proportional to stake)
├── 5%  → Platform fee
└── 2%  → Market creator reward
```

### Stake Ranges
- **Minimum:** $0.25 (accessible to students)
- **Maximum per user:** $20 (keeps it fun, not risky)
- **Pool cap:** $1,000 (prevents whale manipulation)

### Incentive Mechanisms
- **Early bird bonus:** 1.2x odds for first 20% of participants
- **Win streaks:** 5+ correct predictions = 1.5x multiplier
- **Referral rewards:** 5% of referred user's first win
- **Leaderboard prizes:** Weekly/monthly top prophet rewards

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

## 🗓️ Development Roadmap

### Hackathon (2 Weeks)
**Week 1:**
- [x] Smart contract development
- [x] MiniPay integration
- [x] Core prediction flow
- [x] Basic UI/UX

**Week 2:**
- [ ] Oracle integration (manual)
- [ ] Social sharing features
- [ ] Leaderboard system
- [ ] Demo preparation

### Post-Hackathon (Month 1-3)
- [ ] Automated oracle system
- [ ] User-created markets
- [ ] Advanced reputation system
- [ ] Mobile app (native)

### Future (Month 4-6)
- [ ] Street Intel markets (hyperlocal predictions)
- [ ] Sports predictions
- [ ] Crypto market predictions
- [ ] Cross-chain expansion

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

### For Judges:
✅ Novel application (entertainment predictions)  
✅ Strong technical execution  
✅ Clear path to scale  
✅ Addresses real user pain point  
✅ Viral growth potential  

---

## 🏆 Hackathon Deliverables

1. **Live Demo:** Functional prediction markets on Celo testnet
2. **Smart Contracts:** Deployed and verified
3. **Frontend:** Mobile-responsive PWA integrated with MiniPay
4. **Pitch Deck:** Vision, tech, traction, roadmap
5. **Demo Video:** 3-min walkthrough

---

## 👥 Team

[Your team info here]

---

## 📞 Contact

- **Website:** [prophet.app]
- **Twitter:** [@ProphetMarkets]
- **Email:** [team@prophet.app]
- **Demo:** [demo.prophet.app]

---

## 📜 License

MIT License - see [LICENSE.md](LICENSE.md)

---

**Built with ❤️ for the Celo MiniPay Hackathon**

*"Every prophet was once a skeptic. Prove you're a prophet."*