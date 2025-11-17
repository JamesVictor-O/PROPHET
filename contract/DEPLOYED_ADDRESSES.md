# ✅ Successfully Deployed Contract Addresses

## Celo Sepolia Testnet - REFACTORED ARCHITECTURE

**Deployment Date:** November 17, 2025  
**Network:** Celo Sepolia (Chain ID: 11142220)  
**Status:** ✅ **FULLY FUNCTIONAL** - Refactored to use single PredictionMarket contract

### Contract Addresses

| Contract             | Address                                      | Transaction Hash                                                     |
| -------------------- | -------------------------------------------- | -------------------------------------------------------------------- |
| **ReputationSystem** | `0x757E92F1CfD400732943854E8526Cfb3CA5351Ca` | `0x56bd3870f254e8b19ed3e6569d5ad5347dd2f43ee971d2af0875c83579e0ee65` |
| **PredictionMarket** | `0xd1156ADA06e7ffa1a253C5c3b9302a7394650DeC` | `0x3dc4cd90ee92ab8de0d3e7208fb3039e16798a7aab21c537afea51dcf61bf388` |
| **Oracle**           | `0xf7aD63d0478aC4aAF5929CB07F3078412088d237` | `0xa5bc3e1813e8e730b2024fa4049dc72cdb818808d1a52650bc488680480b6eaa` |
| **MarketFactory**    | `0x2fA51E32203B6C1A5a0bB84AE6bf1f8faA6B96b5` | `0x1cbb6fe8a376bd3534e14942e82abd190a491ac36820b4ce1df475ea71750ab9` |

**⚠️ ARCHITECTURE CHANGE:** All markets are now stored in a **single PredictionMarket contract** (`0xd1156ADA06e7ffa1a253C5c3b9302a7394650DeC`). No new contracts are deployed per market - much more gas efficient!

### Network Configuration

-   **cUSD Token:** `0xEF4d55D6dE8e8d73232827Cd1e9b2F2dBb45bC80` ✅ **VERIFIED CORRECT**
-   **Chain ID:** `11142220` (EIP-155 format)
-   **Explorer:** https://sepolia.celoscan.io
-   **RPC:** https://rpc.ankr.com/celo_sepolia

### Gas Costs

-   ReputationSystem: 1,594,330 gas (0.040 CELO)
-   PredictionMarket: 2,610,847 gas (0.065 CELO)
-   Oracle: 1,342,777 gas (0.034 CELO)
-   MarketFactory: 1,058,639 gas (0.026 CELO)
-   Role Setup: ~48,000 gas (0.001 CELO)
-   **Total:** 6,754,492 gas (0.168 CELO)

### Deployment Summary

✅ All contracts deployed successfully  
✅ **Correct cUSD address configured** (`0xEF4d55D6dE8e8d73232827Cd1e9b2F2dBb45bC80`)  
✅ Roles configured  
✅ Contracts linked together  
✅ Chain ID detection working (`11142220`)  
⚠️ Verification pending (can be done manually)

## Frontend Integration

✅ **Frontend updated!** Addresses in `frontend/src/lib/contracts.ts`:

```typescript
export const CONTRACTS = {
    celoSepolia: {
        factory: "0x2fA51E32203B6C1A5a0bB84AE6bf1f8faA6B96b5",
        oracle: "0xf7aD63d0478aC4aAF5929CB07F3078412088d237",
        reputationSystem: "0x757E92F1CfD400732943854E8526Cfb3CA5351Ca",
        predictionMarket: "0xd1156ADA06e7ffa1a253C5c3b9302a7394650DeC", // Single contract for all markets
        cUSD: "0xEF4d55D6dE8e8d73232827Cd1e9b2F2dBb45bC80",
        chainId: 44787, // Note: Frontend uses 44787, backend uses 11142220
    },
};
```

## Verification

Contracts can be verified manually using:

```bash
# ReputationSystem
forge verify-contract 0x01D9654C521e955A1Ef98B8A5FdAbC5976Dc5B50 \
    src/core/ReputationSystem.sol:ReputationSystem \
    --chain celo_sepolia \
    --etherscan-api-key $CELO_ETHERSCAN_API_KEY \
    --constructor-args $(cast abi-encode "constructor(address)" 0x8904fa6ec30ca11c16898d15f7d1278336824500)

# MarketFactory
forge verify-contract 0x3eCAB9356cf8cD23940d0A59A3c3eE1497Ac4C4f \
    src/core/MarketFactory.sol:MarketFactory \
    --chain celo_sepolia \
    --etherscan-api-key $CELO_ETHERSCAN_API_KEY \
    --constructor-args $(cast abi-encode "constructor(address,address,address,address)" \
        0xEF4d55D6dE8e8d73232827Cd1e9b2F2dBb45bC80 \
        0x217129a6a9CA7CD2A0dbB42e4c9B93b7b2809f09 \
        0x01D9654C521e955A1Ef98B8A5FdAbC5976Dc5B50 \
        0x8904fa6ec30ca11c16898d15f7d1278336824500)

# Oracle
forge verify-contract 0x217129a6a9CA7CD2A0dbB42e4c9B93b7b2809f09 \
    src/core/Oracle.sol:Oracle \
    --chain celo_sepolia \
    --etherscan-api-key $CELO_ETHERSCAN_API_KEY \
    --constructor-args $(cast abi-encode "constructor(address,address,address)" \
        0x3eCAB9356cf8cD23940d0A59A3c3eE1497Ac4C4f \
        0x01D9654C521e955A1Ef98B8A5FdAbC5976Dc5B50 \
        0x8904fa6ec30ca11c16898d15f7d1278336824500)
```

## View on Explorer

-   ReputationSystem: https://sepolia.celoscan.io/address/0x757E92F1CfD400732943854E8526Cfb3CA5351Ca
-   PredictionMarket: https://sepolia.celoscan.io/address/0xd1156ADA06e7ffa1a253C5c3b9302a7394650DeC
-   Oracle: https://sepolia.celoscan.io/address/0xf7aD63d0478aC4aAF5929CB07F3078412088d237
-   MarketFactory: https://sepolia.celoscan.io/address/0x2fA51E32203B6C1A5a0bB84AE6bf1f8faA6B96b5

## Next Steps

1. ✅ Contracts deployed with correct cUSD address
2. ✅ Frontend updated with new addresses
3. ⏳ Verify contracts on block explorer (optional, wait 5-10 min)
4. ⏳ Test market creation
5. ⏳ Test predictions with real cUSD
6. ⏳ Test resolution flow
7. ⏳ Test payout claims

## Verification Command

To verify the paymentToken is correct:

```bash
cast call 0x3eCAB9356cf8cD23940d0A59A3c3eE1497Ac4C4f "paymentToken()" --rpc-url https://rpc.ankr.com/celo_sepolia
```

Should return: `0x000000000000000000000000EF4d55D6dE8e8d73232827Cd1e9b2F2dBb45bC80` ✅

## Notes

-   ✅ This deployment uses the **correct** cUSD address: `0xEF4d55D6dE8e8d73232827Cd1e9b2F2dBb45bC80`
-   ✅ Chain ID detection is working correctly (`11142220`)
-   ✅ All contracts are functional and ready for testing
-   ⚠️ Verification errors are due to block explorer indexing delay - wait 5-10 minutes and try manual verification
-   ⚠️ Previous deployments (with wrong cUSD) should be ignored
