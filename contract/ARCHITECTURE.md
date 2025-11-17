# PROPHET Smart Contract Architecture

## Overview

This document outlines the architecture of the PROPHET prediction market smart contracts, designed for gas efficiency, security, and scalability on the Celo blockchain.

## Design Principles

1. **Gas Efficiency**

    - Minimal storage operations
    - Packed structs where possible
    - Batch operations
    - Library usage for reusable code

2. **Security**

    - OpenZeppelin's ReentrancyGuard on all external functions
    - Access control with role-based permissions
    - Input validation
    - Safe math (Solidity 0.8+ built-in)

3. **Modularity**

    - Clear separation of concerns
    - Interface-based design
    - Reusable libraries
    - Testable components

4. **Scalability**
    - Factory pattern for market creation
    - Event-based indexing
    - Efficient data structures

## Contract Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    MarketFactory                         │
│  - Creates new markets                                   │
│  - Manages market lifecycle                             │
│  - Handles creation fees                                │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ creates
                   ▼
┌─────────────────────────────────────────────────────────┐
│                 PredictionMarket                          │
│  - Binary outcome markets (YES/NO)                       │
│  - Stake management                                      │
│  - Dynamic odds calculation                              │
│  - Payout distribution                                   │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ uses
                   ▼
┌─────────────────────────────────────────────────────────┐
│                      Oracle                              │
│  - Market resolution                                     │
│  - Multi-sig support                                     │
│  - Dispute mechanism                                    │
└──────────────────┬────────────────────────────────────┘
                   │
                   │ updates
                   ▼
┌─────────────────────────────────────────────────────────┐
│                ReputationSystem                           │
│  - User statistics tracking                              │
│  - Streak calculation                                    │
│  - Leaderboard management                                │
└─────────────────────────────────────────────────────────┘
```

## Core Contracts

### 1. MarketFactory

**Purpose**: Factory contract for creating and managing prediction markets.

**Key Functions**:

-   `createMarket()` - Creates a new prediction market
-   `getMarketCount()` - Returns total number of markets
-   `getMarketId()` - Gets market ID by index

**Storage**:

-   Market registry
-   Market counter
-   Creation fee configuration

### 2. PredictionMarket

**Purpose**: Core contract handling individual prediction markets.

**Key Functions**:

-   `predict()` - Make a prediction (stake on YES or NO)
-   `resolve()` - Resolve market (called by Oracle)
-   `claimPayout()` - Claim winnings after resolution
-   `getMarketInfo()` - Get market details

**Storage**:

-   Market data (question, pools, status)
-   User predictions mapping
-   Payout tracking

**Gas Optimizations**:

-   Packed structs for market data
-   Minimal external calls
-   Batch operations for multiple predictions

### 3. Oracle

**Purpose**: Handles market resolution with security measures.

**Key Functions**:

-   `resolveMarket()` - Resolve a market with outcome
-   `disputeResolution()` - Dispute a resolution
-   `canResolve()` - Check if market can be resolved

**Security**:

-   Multi-sig requirement
-   Time-locked resolutions
-   Dispute window (48 hours)

### 4. ReputationSystem

**Purpose**: Tracks user performance and calculates reputation.

**Key Functions**:

-   `updateStats()` - Update user stats after resolution
-   `getUserStats()` - Get user statistics
-   `getReputationScore()` - Calculate reputation score
-   `getTopUsers()` - Get leaderboard

**Storage**:

-   User stats mapping
-   Leaderboard data structure

## Data Structures

### Market Struct

```solidity
struct Market {
    uint256 id;                    // Market ID
    string question;               // Prediction question
    string category;               // Market category
    address creator;               // Market creator
    uint256 yesPool;               // Total YES pool
    uint256 noPool;                 // Total NO pool
    uint256 totalPool;             // Total pool (yes + no)
    uint256 endTime;               // Market end timestamp
    MarketStatus status;           // Market status
    Outcome winningOutcome;        // Winning outcome
    bool resolved;                 // Resolution status
}
```

### Prediction Struct

```solidity
struct Prediction {
    address user;                 // User address
    Outcome side;                 // YES or NO
    uint256 amount;               // Stake amount
    uint256 timestamp;            // Prediction time
}
```

### UserStats Struct

```solidity
struct UserStats {
    uint256 totalPredictions;     // Total predictions made
    uint256 correctPredictions;   // Correct predictions
    uint256 totalWinnings;        // Total winnings
    uint256 currentStreak;        // Current win streak
    uint256 bestStreak;           // Best win streak
    uint256 reputationScore;      // Calculated reputation
}
```

## Gas Optimization Strategies

1. **Storage Optimization**

    - Use `uint256` for storage (packed structs)
    - Minimize storage writes
    - Use events for off-chain data

2. **Computation Optimization**

    - Use libraries for reusable calculations
    - Cache storage reads
    - Minimize loops

3. **External Calls**
    - Batch operations
    - Use `call` instead of `transfer` where appropriate
    - Minimize cross-contract calls

## Security Considerations

1. **Reentrancy Protection**

    - ReentrancyGuard on all external functions
    - Checks-Effects-Interactions pattern

2. **Access Control**

    - Role-based access control
    - Owner functions protected
    - Oracle-only resolution

3. **Input Validation**

    - Validate all inputs
    - Check bounds and limits
    - Validate timestamps

4. **Overflow Protection**
    - Solidity 0.8+ built-in checks
    - Safe math operations

## Testing Strategy

1. **Unit Tests**

    - Individual function testing
    - Edge cases
    - Gas optimization verification

2. **Integration Tests**

    - End-to-end flows
    - Cross-contract interactions
    - Oracle resolution flow

3. **Fuzz Testing**
    - Random input generation
    - Property-based testing
    - Invariant testing

## Deployment Strategy

1. **Testnet (Alfajores)**

    - Deploy all contracts
    - Run integration tests
    - Verify contracts

2. **Mainnet**
    - Deploy with verified source
    - Initialize with proper parameters
    - Monitor for issues

## Future Enhancements

1. **Upgradeability**

    - Consider proxy pattern
    - Upgradeable contracts if needed

2. **Multi-token Support**

    - Support for cUSD, USDC, USDT
    - Token-specific pools

3. **Advanced Features**
    - Multi-outcome markets
    - Conditional markets
    - Market categories
