# PROPHET Smart Contracts

Gas-efficient, optimized prediction market contracts built on Celo blockchain.

## 📁 Project Structure

```
contract/
├── src/
│   ├── core/              # Core contracts
│   │   ├── PredictionMarket.sol
│   │   ├── MarketFactory.sol
│   │   └── Oracle.sol
│   ├── interfaces/        # Contract interfaces
│   │   ├── IPredictionMarket.sol
│   │   ├── IOracle.sol
│   │   └── IReputationSystem.sol
│   ├── libraries/         # Reusable libraries
│   │   ├── MarketLib.sol
│   │   └── MathLib.sol
│   └── utils/             # Utility contracts (if needed)
├── test/
│   ├── unit/              # Unit tests
│   └── integration/       # Integration tests
├── script/                # Deployment scripts
└── lib/                   # Dependencies
```

## 🏗️ Architecture

### Core Contracts

1. **MarketFactory.sol**

    - Creates new prediction markets
    - Manages market lifecycle
    - Handles market creation fees

2. **PredictionMarket.sol**

    - Binary outcome markets (YES/NO)
    - Dynamic odds based on pool distribution
    - Automated payouts on resolution
    - Stake management

3. **Oracle.sol**

    - Resolves markets with external data
    - Multi-sig resolution for security
    - 48-hour dispute window

4. **ReputationSystem.sol**
    - Tracks user accuracy & streaks
    - Calculates reputation scores
    - Leaderboard data

### Design Principles

-   **Gas Efficiency**: Optimized storage, minimal external calls
-   **Security**: Reentrancy guards, access controls, input validation
-   **Modularity**: Clean separation of concerns
-   **Upgradeability**: Consider proxy patterns if needed
-   **Auditability**: Clear code, comprehensive comments

## 🚀 Getting Started

### Prerequisites

-   [Foundry](https://book.getfoundry.sh/getting-started/installation)
-   Solidity 0.8.28+

### Installation

```bash
# Install dependencies (if any)
forge install

# Build contracts
forge build

# Run tests
forge test

# Run tests with gas reporting
forge test --gas-report

# Run specific test
forge test --match-path test/unit/PredictionMarket.t.sol
```

### Testing

```bash
# Run all tests
forge test

# Run with verbosity
forge test -vvv

# Run with gas report
forge test --gas-report

# Fuzz testing
forge test --fuzz-runs 10000
```

### Deployment

```bash
# Deploy to Celo Sepolia (testnet)
forge script script/Deploy.s.sol:DeployScript --rpc-url celo_sepolia --broadcast --verify

# Deploy to Celo Mainnet
forge script script/Deploy.s.sol:DeployScript --rpc-url celo_mainnet --broadcast --verify
```

## 📊 Gas Optimization

-   Use `uint256` for storage (packed structs where possible)
-   Minimize external calls
-   Use events for off-chain data
-   Batch operations where possible
-   Use libraries for reusable code

## 🔒 Security

-   All contracts use OpenZeppelin's ReentrancyGuard
-   Access control with OpenZeppelin's Ownable
-   Input validation on all public functions
-   Safe math (built-in Solidity 0.8+)
-   Comprehensive test coverage

## 💰 Token Support

-   **cUSD**: Already deployed on Celo - use the existing contract address
-   **USDC**: Can be added if needed
-   **USDT**: Can be added if needed

### cUSD Contract Addresses

-   **Mainnet**: `0x765DE816845861e75A25fCA122bb6898B8B1282a`
-   **Sepolia**: Check Celo Sepolia documentation for testnet cUSD address

## 📝 License

MIT
