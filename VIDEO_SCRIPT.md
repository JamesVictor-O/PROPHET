# 🎬 PROPHET - MetaMask Cook-Off Video Script
## EIP-7715 + Envio Showcase

**Target Length**: 3-5 minutes  
**Style**: Fast-paced, technical, exciting  
**Audience**: MetaMask & Envio judges, developers, crypto enthusiasts

---

## 🎯 Opening Hook (0:00 - 0:15)

**[SCREEN: PROPHET logo animation, then dashboard home page]**

> "What if you could automate your prediction market strategies and never see another wallet popup? What if your dApp had real-time data that updates faster than any RPC call?"

**[SCREEN: Split screen showing traditional dApp vs PROPHET]**

> "Meet PROPHET - the first prediction market platform that combines EIP-7715 Execution Permissions with Envio Indexer to create something truly revolutionary."

---

## 🔥 The Problem (0:15 - 0:45)

**[SCREEN: Show traditional prediction market flow with multiple wallet popups]**

> "Traditional prediction markets are broken. Every single prediction requires a wallet confirmation. Want to automate your strategies? Forget it. Need real-time data? You're stuck with slow, expensive RPC calls."

**[SCREEN: Show code snippet of multiple transaction confirmations]**

> "Users are frustrated. Developers are limited. And the Web3 experience feels clunky compared to Web2."

**[SCREEN: Transition to PROPHET dashboard]**

> "But what if we could change all of that?"

---

## 💡 The Solution: EIP-7715 Magic (0:45 - 2:00)

**[SCREEN: Show permission grant flow]**

> "PROPHET uses EIP-7715 Execution Permissions in the most creative way possible. Here's how it works:"

### **1. One-Time Permission Grant**

**[SCREEN: Show user clicking "Grant Permission" button]**

> "Users grant permission once - that's it. We set spending limits, time windows, and token restrictions. All enforced on-chain by the EIP-7715 standard."

**[SCREEN: Show permission details modal]**

> "They can set a daily limit, say $10 USDC, and the permission expires in 7 days. Completely transparent and secure."

### **2. Session Account Architecture**

**[SCREEN: Show architecture diagram]**

> "Here's where it gets creative. We create a session smart account - a MetaMask Smart Account owned by a session key. This session account acts as the delegate in the EIP-7715 permission."

**[SCREEN: Show code snippet of session account creation]**

> "The session account can execute transactions on behalf of the user, but only within the permission limits. No wallet popups. No confirmations. Just seamless execution."

### **3. Set-and-Forget AI Strategies** 🤖

**[SCREEN: Show strategy creation modal]**

> "This is our killer feature. Users can create AI-powered prediction strategies that automatically execute predictions."

**[SCREEN: Show strategy configuration]**

> "Let me create a strategy: 'Auto-bet on sports markets with high confidence.' I set the conditions, the stake amount, and the limits."

**[SCREEN: Show strategy executor running]**

> "The strategy executor monitors markets every 60 seconds using Envio's real-time data. When conditions match, it automatically places a prediction - all without any user interaction."

**[SCREEN: Show strategy execution in real-time]**

> "Watch this. A new sports market appears. The strategy detects it, calculates confidence, and automatically places a prediction. No wallet popup. No confirmation. Just pure automation powered by EIP-7715."

### **4. Auto-Transfer Pattern** 💰

**[SCREEN: Show code snippet of redeemDelegations]**

> "Here's another innovation. We've implemented an auto-transfer pattern where USDC is automatically moved from the user's wallet to the session account - all within the same permission context."

**[SCREEN: Show transaction flow diagram]**

> "The session account doesn't need pre-funding. When a strategy needs to execute, we transfer USDC from the user's account to the session account, then immediately execute the prediction - all atomically, all within the permission limits."

**[SCREEN: Show transaction hash on explorer]**

> "This is a real transaction on Base Sepolia. Notice how the USDC transfer and prediction execution happen in a single permission redemption. This is EIP-7715 at its finest."

---

## ⚡ Envio Integration (2:00 - 3:00)

**[SCREEN: Show Envio GraphQL playground]**

> "But automation is only half the story. PROPHET leverages Envio Indexer for the best-in-class real-time data experience."

### **1. Real-Time Market Data**

**[SCREEN: Show GraphQL query]**

> "Instead of slow RPC calls, we query Envio's GraphQL API. Sub-second queries. Pre-aggregated data. Real-time updates."

**[SCREEN: Show market list updating in real-time]**

> "Watch this. New markets appear instantly. Pool sizes update in real-time. Prediction counts are always accurate. All powered by Envio's event indexing."

### **2. Aggregated Entities**

**[SCREEN: Show GraphQL schema]**

> "Envio automatically aggregates raw blockchain events into useful entities. Markets, Predictions, Users, Global Stats - all pre-computed and ready to query."

**[SCREEN: Show leaderboard query]**

> "Want the top 10 users by accuracy? One GraphQL query. Want all sports markets created today? One query. Want a user's prediction history? One query."

### **3. Strategy Executor Integration**

**[SCREEN: Show strategy executor using Envio data]**

> "Our strategy executor uses Envio's real-time data to make decisions. It queries markets, checks conditions, and executes predictions - all powered by Envio's lightning-fast GraphQL API."

**[SCREEN: Show code snippet]**

> "This is the hook that fetches market data. It prioritizes Envio's GraphQL endpoint, falling back to contract calls only if needed. The result? Strategies execute faster and more reliably."

---

## 🎯 The Perfect Combination (3:00 - 3:30)

**[SCREEN: Show architecture diagram]**

> "EIP-7715 and Envio work together perfectly. Envio provides the real-time data that strategies need. EIP-7715 provides the execution permissions that make automation possible."

**[SCREEN: Show live demo of strategy executing]**

> "Watch this live demo. A new market appears. Envio indexes it instantly. Our strategy detects it. EIP-7715 executes the prediction automatically. All in under 5 seconds. No user interaction required."

**[SCREEN: Show activity feed]**

> "And users see everything in real-time. Activity feeds powered by Envio. Strategy executions powered by EIP-7715. It's the perfect combination."

---

## 🏆 Why PROPHET Wins (3:30 - 4:00)

**[SCREEN: Show feature comparison]**

> "PROPHET showcases the most creative and advanced use of EIP-7715 in production:"

**[SCREEN: Show bullet points]**

> "✅ Set-and-Forget AI Strategies - The first automated prediction system using EIP-7715  
> ✅ One-Tap Betting - Zero wallet popups after permission grant  
> ✅ Auto-Transfer Pattern - USDC moves automatically within permission context  
> ✅ Session Account Architecture - Advanced delegation with MetaMask Smart Accounts"

**[SCREEN: Show Envio features]**

> "And we leverage Envio Indexer like no other dApp:"

**[SCREEN: Show bullet points]**

> "✅ Real-Time GraphQL Queries - Sub-second data access  
> ✅ Pre-Aggregated Entities - Markets, Users, Stats ready to use  
> ✅ Strategy Executor Integration - Real-time data powers automation  
> ✅ Activity Feeds - Live updates without polling"

**[SCREEN: Show code quality metrics]**

> "✅ Production-Ready - Complete error handling, retry logic, permission limits  
> ✅ Well-Documented - Comprehensive architecture docs and code comments  
> ✅ Mobile-First - Works perfectly on any device"

---

## 🚀 Technical Deep Dive (4:00 - 4:30)

**[SCREEN: Show code snippet of useRedeemDelegations]**

> "Let me show you the technical implementation. This is our `useRedeemDelegations` hook - the heart of our EIP-7715 integration."

**[SCREEN: Highlight key parts]**

> "It handles permission validation, USDC auto-transfer, delegation redemption, and UserOperation execution. All with automatic retry logic and comprehensive error handling."

**[SCREEN: Show strategy executor code]**

> "And this is our strategy executor. It uses Envio's GraphQL API to fetch markets, evaluates conditions, calculates confidence, and executes predictions via EIP-7715."

**[SCREEN: Show Envio event handlers]**

> "On the Envio side, we index all contract events - MarketCreated, PredictionMade, MarketResolved. We aggregate them into entities and expose them via GraphQL."

---

## 🎬 Closing (4:30 - 5:00)

**[SCREEN: Show PROPHET dashboard with live activity]**

> "PROPHET is more than just a prediction market. It's a showcase of what's possible when you combine EIP-7715 Execution Permissions with Envio Indexer."

**[SCREEN: Show GitHub repo stats]**

> "We've built something truly innovative. Production-ready code. Comprehensive documentation. Real-world use cases."

**[SCREEN: Show final call-to-action]**

> "Try it yourself. Deploy it. Fork it. Learn from it. PROPHET demonstrates the future of Web3 UX - seamless, automated, and powered by the best standards and tools."

**[SCREEN: Show logo and tagline]**

> "PROPHET - Predict And Earn. Built with ❤️ using EIP-7715 and Envio."

---

## 📝 Production Notes

### **Visual Elements Needed:**

1. **Screen Recordings:**
   - Permission grant flow
   - Strategy creation and execution
   - Real-time market updates
   - GraphQL queries in action
   - Code snippets with syntax highlighting

2. **Diagrams:**
   - Architecture diagram (User EOA → Session Account → Blockchain)
   - EIP-7715 permission flow
   - Envio indexing flow
   - Strategy executor flow

3. **Animations:**
   - Logo animation
   - Transaction flow animations
   - Data flow animations

4. **Code Snippets:**
   - `useRedeemDelegations.ts` - EIP-7715 execution
   - `strategyExecutor.ts` - Strategy logic
   - `useMarketsGraphQL.ts` - Envio integration
   - `EventHandlers.ts` - Envio indexing

### **Voiceover Tips:**

- **Energy**: High energy, excited about the technology
- **Pace**: Fast but clear - don't rush technical explanations
- **Tone**: Technical but accessible - explain complex concepts simply
- **Emphasis**: Emphasize "first", "creative", "innovative", "automated"

### **Music Suggestions:**

- **Opening**: Upbeat, tech-focused (think Apple keynote)
- **Technical Sections**: Subtle background, focus on voice
- **Demo Sections**: Slightly more energetic
- **Closing**: Inspirational, forward-looking

### **Key Moments to Highlight:**

1. **0:45** - "One-Time Permission Grant" - Show the simplicity
2. **1:30** - "Set-and-Forget Strategies" - The killer feature
3. **2:00** - "Envio Integration" - Real-time data showcase
4. **3:00** - "Perfect Combination" - How they work together
5. **4:30** - "Why PROPHET Wins" - Competitive advantages

### **Call-to-Action:**

- GitHub repo link
- Live demo URL (if available)
- Documentation links
- "Star the repo if you like it!"

---

## 🎯 Winning Points to Emphasize

1. **Most Creative EIP-7715 Use**: Set-and-Forget strategies, auto-transfer pattern
2. **Best Envio Integration**: Real-time data powers automation
3. **Production-Ready**: Not a demo, but a real working application
4. **User Experience**: Solves real problems (wallet fatigue, slow data)
5. **Technical Excellence**: Clean code, comprehensive docs, error handling
6. **Innovation**: First prediction market with automated strategies

---

**Good luck with the Cook-Off! 🚀**


