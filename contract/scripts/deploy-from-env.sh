#!/bin/bash

# Deploy PROPHET to Base using .env.local file
# This script automatically loads PRIVATE_KEY from .env.local

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTRACT_DIR="$(dirname "$SCRIPT_DIR")"

# Navigate to contract directory
cd "$CONTRACT_DIR"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${RED}ERROR: .env.local file not found${NC}"
    echo "Create it with: cp env.local.example .env.local"
    echo "Then add your PRIVATE_KEY to it"
    exit 1
fi

# Load .env.local file (this exports all variables)
set -a
source .env.local
set +a

# Check if PRIVATE_KEY is set
if [ -z "$PRIVATE_KEY" ] || [ "$PRIVATE_KEY" == "0x0000000000000000000000000000000000000000000000000000000000000000" ]; then
    echo -e "${RED}ERROR: PRIVATE_KEY is not set in .env.local${NC}"
    echo "Please edit .env.local and set your PRIVATE_KEY"
    exit 1
fi

echo -e "${GREEN}✓ Loaded PRIVATE_KEY from .env.local${NC}"
echo ""

# Default to Sepolia
NETWORK="${1:-sepolia}"

# Set RPC URL based on network
if [ "$NETWORK" == "mainnet" ]; then
    RPC_URL="${BASE_MAINNET_RPC_URL:-https://mainnet.base.org}"
    CHAIN_ID="8453"
    echo -e "${YELLOW}⚠️  Deploying to BASE MAINNET${NC}"
    read -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "Deployment cancelled."
        exit 0
    fi
elif [ "$NETWORK" == "sepolia" ]; then
    RPC_URL="${BASE_SEPOLIA_RPC_URL:-https://sepolia.base.org}"
    CHAIN_ID="84532"
    echo "Deploying to Base Sepolia (testnet)..."
else
    echo -e "${RED}ERROR: Invalid network. Use 'mainnet' or 'sepolia'${NC}"
    exit 1
fi

echo ""
echo "Configuration:"
echo "  Network: $NETWORK"
echo "  RPC URL: $RPC_URL"
echo "  Chain ID: $CHAIN_ID"
echo "  Deployer: $(cast wallet address $PRIVATE_KEY 2>/dev/null || echo 'N/A')"
echo ""

# Build the forge command
FORGE_CMD="forge script script/DeployBase.s.sol:DeployBaseScript \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --chain-id $CHAIN_ID \
  -vvvv"

# Add verification if API key is set
if [ ! -z "$BASE_ETHERSCAN_API_KEY" ] && [ "$BASE_ETHERSCAN_API_KEY" != "your_basescan_api_key_here" ]; then
    echo -e "${GREEN}✓ Verification enabled${NC}"
    FORGE_CMD="$FORGE_CMD --verify --etherscan-api-key $BASE_ETHERSCAN_API_KEY"
else
    echo -e "${YELLOW}⚠ Verification skipped (set BASE_ETHERSCAN_API_KEY in .env.local to enable)${NC}"
fi

echo ""
echo "Running deployment..."
echo ""

# Run the command
eval $FORGE_CMD

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Deployment completed successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Save the contract addresses from the output above"
    echo "2. Update your frontend configuration with new addresses"
    echo "3. Update DEPLOYMENT_ADDRESSES.md with the new addresses"
else
    echo ""
    echo -e "${RED}✗ Deployment failed${NC}"
    exit 1
fi


