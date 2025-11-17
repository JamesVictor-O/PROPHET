# MiniPay Integration Guide

## Overview

This project integrates with **MiniPay**, Opera's mobile wallet for the Celo blockchain. MiniPay enables users to easily send, receive, and store stablecoins like cUSD, USDC, and USDT with minimal fees.

## What is MiniPay?

MiniPay is a non-custodial stablecoin wallet developed by Opera, built on the Celo blockchain. It's designed for:
- **Mobile-first experience** - Optimized for Opera Mini browser
- **Low-cost transactions** - Transactions complete in under 2 seconds for less than $0.01
- **User-friendly onboarding** - Simplified sign-up using Google/iCloud accounts and phone numbers
- **Real-world usability** - Supports bill payments, mobile data top-ups, and shopping

## Integration Details

### Tech Stack
- **wagmi** - React hooks for Ethereum/Celo
- **viem** - TypeScript interface for Ethereum/Celo
- **@tanstack/react-query** - Data fetching and caching

### Network Configuration
- **Celo Mainnet** (Chain ID: 42220)
- **Celo Alfajores Testnet** (Chain ID: 44787)

### Components

#### 1. Wallet Provider (`components/wallet/wallet-provider.tsx`)
Wraps the app with WagmiProvider and QueryClientProvider to enable wallet functionality throughout the app.

#### 2. Wallet Connect (`components/wallet/wallet-connect.tsx`)
Main component for connecting/disconnecting wallets. Features:
- Detects MiniPay availability
- Shows wallet address and balance when connected
- Handles connection and disconnection
- Displays formatted currency (cUSD)

#### 3. Wallet Button (`components/wallet/wallet-button.tsx`)
Simplified wallet button component for quick integration.

#### 4. Wallet Config (`lib/wallet-config.ts`)
Configuration for:
- Celo network setup
- MiniPay detection
- Address formatting
- Currency formatting

## Usage

### Basic Wallet Connection

```tsx
import { WalletConnect } from "@/components/wallet/wallet-connect";

<WalletConnect showBalance={true} variant="outline" />
```

### Check Wallet Status

```tsx
import { useAccount } from "wagmi";

const { address, isConnected } = useAccount();
```

### Get Balance

```tsx
import { useBalance } from "wagmi";

const { data: balance } = useBalance({
  address: address,
});
```

### MiniPay Detection

```tsx
import { isMiniPayAvailable } from "@/lib/wallet-config";

if (isMiniPayAvailable()) {
  // MiniPay is available
}
```

## Features

✅ **Automatic Detection** - Detects if user is in Opera browser with MiniPay  
✅ **One-Tap Connect** - Simple wallet connection flow  
✅ **Balance Display** - Shows cUSD balance in real-time  
✅ **Address Formatting** - Displays shortened wallet addresses  
✅ **Currency Formatting** - Formats amounts as USD currency  
✅ **Disconnect** - Easy wallet disconnection  

## Testing

### In MiniPay Browser
1. Open Opera Mini browser with MiniPay enabled
2. Navigate to the app
3. Click "Connect MiniPay" button
4. Approve connection in MiniPay
5. Wallet should connect and show balance

### In Regular Browser
1. The app will detect MiniPay is not available
2. Shows "Connect Wallet" button instead
3. Can still connect other injected wallets (MetaMask, etc.)

## Next Steps

To complete the integration, you'll need to:

1. **Smart Contract Integration** - Connect to your prediction market contracts
2. **Transaction Handling** - Implement prediction staking transactions
3. **cUSD Support** - Ensure balance queries use cUSD token address
4. **Error Handling** - Add comprehensive error handling for failed transactions
5. **Transaction Status** - Show pending/confirmed transaction states

## Resources

- [MiniPay Documentation](https://minipay.opera.com)
- [Celo Documentation](https://docs.celo.org)
- [wagmi Documentation](https://wagmi.sh)
- [viem Documentation](https://viem.sh)



