#!/bin/bash
# Script to check delegation status using cast

# Contract addresses (Base Sepolia)
FACTORY="0xC00D00798f40a83c6e4245F4b69e2f2B45c33065"
RPC_URL="https://sepolia.base.org"

# Usage: ./check_delegation.sh <EOA_ADDRESS> <SESSION_ACCOUNT_ADDRESS>
if [ $# -ne 2 ]; then
  echo "Usage: $0 <EOA_ADDRESS> <SESSION_ACCOUNT_ADDRESS>"
  exit 1
fi

EOA=$1
SESSION=$2

echo "Checking delegation status..."
echo "EOA: $EOA"
echo "Session Account: $SESSION"
echo ""

# Check MarketFactory delegation
echo "MarketFactory delegation:"
cast call $FACTORY "hasDelegation(address,address)(bool)" $EOA $SESSION --rpc-url $RPC_URL

# Check PredictionMarket delegation
PREDICTION_MARKET="0x5fDdB7b0061A263f37Db55570694A22026830ce4"
echo ""
echo "PredictionMarket delegation:"
cast call $PREDICTION_MARKET "hasDelegation(address,address)(bool)" $EOA $SESSION --rpc-url $RPC_URL
