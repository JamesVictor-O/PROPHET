#!/bin/bash

# Simple Base Deployment Script
# Fixes the duplicate --fork-url error

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}PROPHET Base Deployment${NC}"
echo ""

# Check if PRIVATE_KEY is set
if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}ERROR: PRIVATE_KEY is not set${NC}"
    echo "Set it with: export PRIVATE_KEY=0xYOUR_PRIVATE_KEY"
    exit 1
fi

# Default to Sepolia
NETWORK="${1:-sepolia}"

# Set RPC URL based on network
if [ "$NETWORK" == "mainnet" ]; then
    RPC_URL="https://mainnet.base.org"
    CHAIN_ID="8453"
    echo -e "${YELLOW}⚠️  Deploying to BASE MAINNET${NC}"
    read -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "Deployment cancelled."
        exit 0
    fi
elif [ "$NETWORK" == "sepolia" ]; then
    RPC_URL="https://sepolia.base.org"
    CHAIN_ID="84532"
    echo "Deploying to Base Sepolia..."
else
    echo -e "${RED}ERROR: Invalid network. Use 'mainnet' or 'sepolia'${NC}"
    exit 1
fi

echo ""
echo "Network: $NETWORK"
echo "RPC URL: $RPC_URL"
echo "Chain ID: $CHAIN_ID"
echo ""

# Build the command - only use --rpc-url, not --fork-url
FORGE_CMD="forge script script/DeployBase.s.sol:DeployBaseScript \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --chain-id $CHAIN_ID \
  -vvvv"

# Add verification if API key is set
if [ ! -z "$BASE_ETHERSCAN_API_KEY" ]; then
    echo "Verification enabled (BASE_ETHERSCAN_API_KEY found)"
    FORGE_CMD="$FORGE_CMD --verify --etherscan-api-key $BASE_ETHERSCAN_API_KEY"
else
    echo "Verification skipped (set BASE_ETHERSCAN_API_KEY to enable)"
fi

echo ""
echo "Running deployment..."
echo ""

# Run the command
eval $FORGE_CMD






