#!/bin/bash

# Staged deployment script - deploys contracts one at a time with delays
# Use this if you're hitting rate limits

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTRACT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$CONTRACT_DIR"

if [ ! -f ".env.local" ]; then
    echo -e "${RED}ERROR: .env.local file not found${NC}"
    exit 1
fi

set -a
source .env.local
set +a

if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}ERROR: PRIVATE_KEY is not set${NC}"
    exit 1
fi

NETWORK="${1:-sepolia}"

if [ "$NETWORK" == "sepolia" ]; then
    RPC_URL="${BASE_SEPOLIA_RPC_URL:-https://sepolia.base.org}"
    CHAIN_ID="84532"
else
    echo -e "${RED}ERROR: Invalid network${NC}"
    exit 1
fi

echo -e "${GREEN}Staged Deployment to Base Sepolia${NC}"
echo "RPC URL: $RPC_URL"
echo "Chain ID: $CHAIN_ID"
echo ""
echo -e "${YELLOW}This will deploy contracts one at a time with 15-second delays${NC}"
read -p "Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    exit 0
fi

BASE_CMD="forge script script/DeployBaseStaged.s.sol:DeployBaseStagedScript --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --chain-id $CHAIN_ID"

echo ""
echo -e "${GREEN}Step 1: Deploying ReputationSystem...${NC}"
if ! eval "$BASE_CMD --sig 'deployReputationSystem()'"; then
    echo -e "${RED}Failed to deploy ReputationSystem${NC}"
    exit 1
fi
echo -e "${GREEN}✓ ReputationSystem deployed${NC}"
echo -e "${YELLOW}Check the output above for the contract address${NC}"
echo "Waiting 15 seconds..."
sleep 15

echo ""
echo -e "${YELLOW}Enter ReputationSystem address from Step 1:${NC}"
read -p "ReputationSystem address: " REPUTATION_SYSTEM
echo ""
echo -e "${GREEN}Step 2: Deploying PredictionMarket...${NC}"
if ! eval "$BASE_CMD --sig 'deployPredictionMarket(address)' $REPUTATION_SYSTEM"; then
    echo -e "${RED}Failed to deploy PredictionMarket${NC}"
    exit 1
fi
echo -e "${GREEN}✓ PredictionMarket deployed${NC}"
echo -e "${YELLOW}Check the output above for the contract address${NC}"
echo "Waiting 15 seconds..."
sleep 15

echo ""
echo -e "${YELLOW}Enter PredictionMarket address from Step 2:${NC}"
read -p "PredictionMarket address: " PREDICTION_MARKET
echo ""
echo -e "${GREEN}Step 3: Deploying Oracle...${NC}"
if ! eval "$BASE_CMD --sig 'deployOracle(address)' $PREDICTION_MARKET"; then
    echo -e "${RED}Failed to deploy Oracle${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Oracle deployed${NC}"
echo -e "${YELLOW}Check the output above for the contract address${NC}"
echo "Waiting 15 seconds..."
sleep 15

echo ""
echo -e "${YELLOW}Enter Oracle address from Step 3:${NC}"
read -p "Oracle address: " ORACLE
echo ""
echo -e "${GREEN}Step 4: Setting Oracle in PredictionMarket...${NC}"
if ! eval "$BASE_CMD --sig 'setOracle(address,address)' $PREDICTION_MARKET $ORACLE"; then
    echo -e "${RED}Failed to set Oracle${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Oracle set${NC}"
echo "Waiting 15 seconds..."
sleep 15

echo ""
echo -e "${GREEN}Step 5: Deploying MarketFactory...${NC}"
if ! eval "$BASE_CMD --sig 'deployMarketFactory(address,address,address)' $PREDICTION_MARKET $ORACLE $REPUTATION_SYSTEM"; then
    echo -e "${RED}Failed to deploy MarketFactory${NC}"
    exit 1
fi
echo -e "${GREEN}✓ MarketFactory deployed${NC}"
echo -e "${YELLOW}Check the output above for the contract address${NC}"
echo "Waiting 15 seconds..."
sleep 15

echo ""
echo -e "${GREEN}Step 6: Granting UPDATER_ROLE...${NC}"
if ! eval "$BASE_CMD --sig 'grantUpdaterRole(address,address)' $REPUTATION_SYSTEM $PREDICTION_MARKET"; then
    echo -e "${RED}Failed to grant UPDATER_ROLE${NC}"
    exit 1
fi
echo -e "${GREEN}✓ UPDATER_ROLE granted${NC}"

echo ""
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo "All contracts deployed successfully!"
echo "Check the output above for all contract addresses."
echo "Or check: broadcast/DeployBaseStaged.s.sol/84532/run-latest.json"
echo "=========================="

