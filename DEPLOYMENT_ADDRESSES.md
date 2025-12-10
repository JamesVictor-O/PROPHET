# PROPHET Contract Deployment Addresses

## Celo Mainnet (Chain ID: 42220)

**Latest Deployment Date**: 2024-12-XX (Updated with $0.0025 minimum stake)  
**Deployer**: `0x8904fA6Ec30CA11c16898D15f7d1278336824500`

### Contract Addresses (Latest)

| Contract             | Address                                      | Explorer                                                                                              |
| -------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **MarketFactory**    | `0xE47ADCF70C55447998EC4615b952796C3a57f5B0` | [View on Celo Explorer](https://explorer.celo.org/address/0xE47ADCF70C55447998EC4615b952796C3a57f5B0) |
| **PredictionMarket** | `0x1d35D91b4BbF312717e9f9B675351B1b520cb096` | [View on Celo Explorer](https://explorer.celo.org/address/0x1d35D91b4BbF312717e9f9B675351B1b520cb096) |
| **Oracle**           | `0x388fd6555193d80e0b9Cd3752D422b6D02dbA286` | [View on Celo Explorer](https://explorer.celo.org/address/0x388fd6555193d80e0b9Cd3752D422b6D02dbA286) |
| **ReputationSystem** | `0x8F23259B62A37b520E8A87D2cc0e20a1d1873717` | [View on Celo Explorer](https://explorer.celo.org/address/0x8F23259B62A37b520E8A87D2cc0e20a1d1873717) |
| **cUSD Token**       | `0x765DE816845861e75A25fCA122bb6898B8B1282a` | [View on Celo Explorer](https://explorer.celo.org/address/0x765DE816845861e75A25fCA122bb6898B8B1282a) |

### Configuration

- **Network**: Celo Mainnet
- **Chain ID**: 42220
- **RPC URL**: `https://forno.celo.org`
- **Block Explorer**: `https://explorer.celo.org`
- **Payment Token**: cUSD (Celo Dollar)
- **Minimum Stake**: 0.0025 cUSD

### Gas Costs

- **Total Deployment Gas**: ~13,131,562 gas
- **Estimated Cost**: ~0.66 CELO (at 50 gwei)

---

## Base Mainnet (Chain ID: 8453)

**Note**: Previous deployment on Base Mainnet. The project is now primarily on Celo Mainnet.

| Contract             | Address                                      |
| -------------------- | -------------------------------------------- |
| MarketFactory        | `0x0B51348AB44895539A22832A1E49eD11C648bE35` |
| PredictionMarket     | `0xc4b9aA01fF29ee4b0D86Cd68a3B4393Ee30BfAdc` |
| Oracle               | `0x2F94149647D5167859131E0f905Efe9E09EAC9C5` |
| ReputationSystem     | `0xfe155C98757879dD24fF20447bf1E9E7E0e421d1` |
| Payment Token (USDC) | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |

---

## Celo Sepolia Testnet (Chain ID: 11142220)

| Contract         | Address                                      |
| ---------------- | -------------------------------------------- |
| MarketFactory    | `0x8376D1Ba26B481A730c78f3aEe658dEa17595f71` |
| PredictionMarket | `0x684DFe6Dcee60974529A8838D1ce02f8dc3ACD8b` |
| Oracle           | `0x474F99826c16008BB20cF2365aB66ac1b66A9313` |
| ReputationSystem | `0x6C8Dc0D7d9812Da01c38456202E4cee23675D99B` |
| cUSD Token       | `0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b` |

---

## Usage

### Frontend Configuration

The frontend is configured in `frontend/src/lib/contracts.ts`:

```typescript
import { getContracts } from "@/lib/contracts";

const contracts = getContracts("celoMainnet");
// Returns all contract addresses for Celo Mainnet
```

### CLI Configuration

The CLI can use environment variables or defaults:

```bash
# .env file
MARKET_FACTORY=0xE47ADCF70C55447998EC4615b952796C3a57f5B0
PREDICTION_MARKET=0x1d35D91b4BbF312717e9f9B675351B1b520cb096
ORACLE=0x388fd6555193d80e0b9Cd3752D422b6D02dbA286
REPUTATION_SYSTEM=0x8F23259B62A37b520E8A87D2cc0e20a1d1873717
PAYMENT_TOKEN=0x765DE816845861e75A25fCA122bb6898B8B1282a
RPC_URL=https://forno.celo.org
CHAIN_ID=42220
EXPLORER=https://explorer.celo.org
```

Or use defaults (already configured in `cli/src/config/contracts.ts`).
