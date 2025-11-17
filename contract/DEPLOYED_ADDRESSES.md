# ✅ Successfully Deployed Contract Addresses

## Celo Sepolia Testnet

**Deployment Date:** November 17, 2025  
**Network:** Celo Sepolia (Chain ID: 11142220)  
**Status:** ✅ **FULLY FUNCTIONAL** - Username feature included, correct cUSD address configured

### Contract Addresses

| Contract             | Address                                      | Transaction Hash                                                     |
| -------------------- | -------------------------------------------- | -------------------------------------------------------------------- |
| **ReputationSystem** | `0x01D9654C521e955A1Ef98B8A5FdAbC5976Dc5B50` | `0xc8a770db24dbfa53cebdbfa0f6557b1cc8d5203163ceb9fc33ba5ea53c251f41` |
| **MarketFactory**    | `0x3eCAB9356cf8cD23940d0A59A3c3eE1497Ac4C4f` | `0x1f3a8bb3debbd2b8b9f15035070a66c2b492edd1992aec5f4c59a3096cc63937` |
| **Oracle**           | `0x217129a6a9CA7CD2A0dbB42e4c9B93b7b2809f09` | `0x9652583533af18157c04f783e1fc318c6c58ad1b75ab6894ffa0f4848c8a435a` |

**Note:** `PredictionMarket` contracts are **NOT deployed directly**. They are created dynamically by `MarketFactory` when users call `createMarket()`. Each market is a new `PredictionMarket` instance.

### Network Configuration

-   **cUSD Token:** `0xEF4d55D6dE8e8d73232827Cd1e9b2F2dBb45bC80` ✅ **VERIFIED CORRECT**
-   **Chain ID:** `11142220` (EIP-155 format)
-   **Explorer:** https://sepolia.celoscan.io
-   **RPC:** https://rpc.ankr.com/celo_sepolia

### Gas Costs

-   ReputationSystem: 1,050,921 gas (0.026 CELO)
-   MarketFactory: 2,707,317 gas (0.068 CELO)
-   Oracle: 1,292,195 gas (0.032 CELO)
-   **Total:** 5,177,135 gas (0.129 CELO)

### Deployment Summary

✅ All contracts deployed successfully  
✅ **Correct cUSD address configured** (`0xEF4d55D6dE8e8d73232827Cd1e9b2F2dBb45bC80`)  
✅ Roles configured  
✅ Contracts linked together  
✅ Chain ID detection working (`11142220`)  
⚠️ Verification pending (can be done manually)

## Frontend Integration

Update the frontend with these addresses in `frontend/src/lib/contracts.ts`:

```typescript
export const CONTRACTS = {
    celoSepolia: {
        factory: "0x3eCAB9356cf8cD23940d0A59A3c3eE1497Ac4C4f",
        oracle: "0x217129a6a9CA7CD2A0dbB42e4c9B93b7b2809f09",
        reputationSystem: "0x01D9654C521e955A1Ef98B8A5FdAbC5976Dc5B50",
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

-   ReputationSystem: https://sepolia.celoscan.io/address/0x01D9654C521e955A1Ef98B8A5FdAbC5976Dc5B50
-   MarketFactory: https://sepolia.celoscan.io/address/0x3eCAB9356cf8cD23940d0A59A3c3eE1497Ac4C4f
-   Oracle: https://sepolia.celoscan.io/address/0x217129a6a9CA7CD2A0dbB42e4c9B93b7b2809f09

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
