# PROPHET Contract Deployment Addresses

## Celo Sepolia Testnet

**Deployment Date:** $(date +"%Y-%m-%d %H:%M:%S")
**Chain ID:** 11142220
**Explorer:** https://sepolia.celoscan.xyz

### Contracts

| Contract | Address | Explorer |
|----------|---------|----------|
| MarketFactory | [0x8376D1Ba26B481A730c78f3aEe658dEa17595f71](https://sepolia.celoscan.xyz/address/0x8376D1Ba26B481A730c78f3aEe658dEa17595f71) | [View](https://sepolia.celoscan.xyz/address/0x8376D1Ba26B481A730c78f3aEe658dEa17595f71) |
| PredictionMarket | [0x684DFe6Dcee60974529A8838D1ce02f8dc3ACD8b](https://sepolia.celoscan.xyz/address/0x684DFe6Dcee60974529A8838D1ce02f8dc3ACD8b) | [View](https://sepolia.celoscan.xyz/address/0x684DFe6Dcee60974529A8838D1ce02f8dc3ACD8b) |
| Oracle | [0x474F99826c16008BB20cF2365aB66ac1b66A9313](https://sepolia.celoscan.xyz/address/0x474F99826c16008BB20cF2365aB66ac1b66A9313) | [View](https://sepolia.celoscan.xyz/address/0x474F99826c16008BB20cF2365aB66ac1b66A9313) |
| ReputationSystem | [0x6C8Dc0D7d9812Da01c38456202E4cee23675D99B](https://sepolia.celoscan.xyz/address/0x6C8Dc0D7d9812Da01c38456202E4cee23675D99B) | [View](https://sepolia.celoscan.xyz/address/0x6C8Dc0D7d9812Da01c38456202E4cee23675D99B) |
| cUSD Token | [0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b](https://sepolia.celoscan.xyz/address/0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b) | [View](https://sepolia.celoscan.xyz/address/0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b) |

### Deployer
**Address:** 0x8904fA6Ec30CA11c16898D15f7d1278336824500

### Notes
- All markets are stored in the single PredictionMarket contract
- MarketFactory is a wrapper that delegates to PredictionMarket
- Contracts support both Binary and CrowdWisdom market types
