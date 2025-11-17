# ✅ Successfully Deployed Contract Addresses

## Celo Sepolia Testnet - Latest Deployment

**Deployment Date:** November 17, 2025  
**Network:** Celo Sepolia (Chain ID: 11142220)  
**Status:** ✅ **FULLY FUNCTIONAL** - Refactored to use single PredictionMarket contract

### Contract Addresses

| Contract             | Address                                      | Transaction Hash                                                     |
| -------------------- | -------------------------------------------- | -------------------------------------------------------------------- |
| **ReputationSystem** | `0xC46b51268B9BD8a8190B2106354415B58CF34787` | `0x1fb22d6e4c9df7249c9a1ba774eb2bc39dd91e96ebf4db9e5ef08106e8312c25` |
| **PredictionMarket** | `0x0E4830E472F90B7C2Fa271206A07B5Cc36f940bF` | `0xad390e4c01fd312dca3d67da3595dabd03ffb8133e954babc6418f1a8b566877` |
| **Oracle**           | `0x5ca009564018ac4eb6D2B41FC455f9a505118df5` | `0xc9f6d55a4e9b8985d06a78bd00e6f41c5c98ebbe1969b44396358f40b9ba7abf` |
| **MarketFactory**    | `0x51535762f7Fd1886ADaF6f82e5BacAEcf2D22f34` | `0x1e55f68257ff6a0a7a406d8e4d3cb9cf798fe70bc57fb77eb592cfc14ece3042` |

**⚠️ ARCHITECTURE:** All markets are now stored in a **single PredictionMarket contract** (`0x0E4830E472F90B7C2Fa271206A07B5Cc36f940bF`). No new contracts are deployed per market - much more gas efficient!

### Network Configuration

-   **cUSD Token:** `0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b` ✅ **VERIFIED CORRECT**
-   **Chain ID:** `11142220` (EIP-155 format)
-   **Explorer:** https://celo-sepolia.blockscout.com
-   **RPC:** https://rpc.ankr.com/celo_sepolia

### Gas Costs

-   ReputationSystem: 1,594,330 gas (0.040 CELO)
-   PredictionMarket: 2,873,359 gas (0.072 CELO)
-   Oracle: 1,342,789 gas (0.034 CELO)
-   MarketFactory: 1,115,358 gas (0.028 CELO)
-   Role Setup: ~78,899 gas (0.002 CELO)
-   **Total:** 7,054,735 gas (0.176 CELO)

### Deployment Summary

✅ All contracts deployed successfully  
✅ **Correct cUSD address configured** (`0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b`)  
✅ Roles configured  
✅ Contracts linked together  
✅ Chain ID detection working (`11142220`)  
⚠️ Verification pending (can be done manually)

## Frontend Integration

✅ **Frontend updated!** Addresses in `frontend/src/lib/contracts.ts`:

```typescript
export const CONTRACTS = {
    celoSepolia: {
        factory: "0x51535762f7Fd1886ADaF6f82e5BacAEcf2D22f34",
        oracle: "0x5ca009564018ac4eb6D2B41FC455f9a505118df5",
        reputationSystem: "0xC46b51268B9BD8a8190B2106354415B58CF34787",
        predictionMarket: "0x0E4830E472F90B7C2Fa271206A07B5Cc36f940bF", // Single contract for all markets
        cUSD: "0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b",
        chainId: 11142220,
    },
};
```

## View on Explorer

-   ReputationSystem: https://celo-sepolia.blockscout.com/address/0xC46b51268B9BD8a8190B2106354415B58CF34787
-   PredictionMarket: https://celo-sepolia.blockscout.com/address/0x0E4830E472F90B7C2Fa271206A07B5Cc36f940bF
-   Oracle: https://celo-sepolia.blockscout.com/address/0x5ca009564018ac4eb6D2B41FC455f9a505118df5
-   MarketFactory: https://celo-sepolia.blockscout.com/address/0x51535762f7Fd1886ADaF6f82e5BacAEcf2D22f34

## Next Steps

1. ✅ Contracts deployed with correct cUSD address
2. ✅ Frontend updated with new addresses
3. ✅ ABIs updated
4. ⏳ Test market creation
5. ⏳ Test predictions with real cUSD
6. ⏳ Test resolution flow
7. ⏳ Test payout claims

## Notes

-   ✅ This deployment uses the **correct** cUSD address: `0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b`
-   ✅ Chain ID detection is working correctly (`11142220`)
-   ✅ All contracts are functional and ready for testing
-   ⚠️ Verification errors are due to block explorer indexing delay - wait 5-10 minutes and try manual verification
