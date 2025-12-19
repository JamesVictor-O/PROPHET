#!/bin/bash

# PROPHET Base Deployment Script
# This script helps deploy PROPHET contracts to Base networks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
NETWORK="sepolia"
VERIFY=false

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 is not installed. Please install it first."
        exit 1
    fi
}

# Function to check environment variables
check_env() {
    if [ -z "$PRIVATE_KEY" ]; then
        print_error "PRIVATE_KEY is not set. Please set it in your .env file or export it."
        exit 1
    fi

    if [ "$VERIFY" = true ] && [ -z "$BASE_ETHERSCAN_API_KEY" ]; then
        print_error "BASE_ETHERSCAN_API_KEY is not set. Set it to verify contracts."
        exit 1
    fi
}

# Function to get RPC URL based on network
get_rpc_url() {
    case $NETWORK in
        mainnet)
            if [ -z "$BASE_MAINNET_RPC_URL" ]; then
                echo "https://mainnet.base.org"
            else
                echo "$BASE_MAINNET_RPC_URL"
            fi
            ;;
        sepolia)
            if [ -z "$BASE_SEPOLIA_RPC_URL" ]; then
                echo "https://sepolia.base.org"
            else
                echo "$BASE_SEPOLIA_RPC_URL"
            fi
            ;;
        *)
            print_error "Unknown network: $NETWORK"
            exit 1
            ;;
    esac
}

# Function to get chain ID based on network
get_chain_id() {
    case $NETWORK in
        mainnet)
            echo "8453"
            ;;
        sepolia)
            echo "84532"
            ;;
        *)
            print_error "Unknown network: $NETWORK"
            exit 1
            ;;
    esac
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --network)
            NETWORK="$2"
            shift 2
            ;;
        --mainnet)
            NETWORK="mainnet"
            shift
            ;;
        --sepolia)
            NETWORK="sepolia"
            shift
            ;;
        --verify)
            VERIFY=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --network <mainnet|sepolia>  Network to deploy to (default: sepolia)"
            echo "  --mainnet                    Deploy to Base Mainnet"
            echo "  --sepolia                    Deploy to Base Sepolia (default)"
            echo "  --verify                     Verify contracts on Basescan"
            echo "  --help                       Show this help message"
            echo ""
            echo "Environment Variables:"
            echo "  PRIVATE_KEY                  Private key of deployer (required)"
            echo "  BASE_MAINNET_RPC_URL         Base Mainnet RPC endpoint (optional)"
            echo "  BASE_SEPOLIA_RPC_URL         Base Sepolia RPC endpoint (optional)"
            echo "  BASE_ETHERSCAN_API_KEY       Basescan API key (required for --verify)"
            echo ""
            echo "Examples:"
            echo "  $0 --sepolia                  # Deploy to Base Sepolia"
            echo "  $0 --mainnet --verify         # Deploy to Base Mainnet and verify"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Check prerequisites
print_info "Checking prerequisites..."
check_command forge
check_command cast

# Check environment
print_info "Checking environment variables..."
check_env

# Get network configuration
RPC_URL=$(get_rpc_url)
CHAIN_ID=$(get_chain_id)

print_info "Deployment Configuration:"
echo "  Network: $NETWORK"
echo "  Chain ID: $CHAIN_ID"
echo "  RPC URL: $RPC_URL"
echo "  Verify: $VERIFY"
echo ""

# Confirm deployment
if [ "$NETWORK" = "mainnet" ]; then
    print_warning "You are about to deploy to BASE MAINNET!"
    print_warning "This will cost real ETH and deploy real contracts!"
    read -p "Are you sure you want to continue? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_info "Deployment cancelled."
        exit 0
    fi
fi

# Build the forge command
FORGE_CMD="forge script script/DeployBase.s.sol:DeployBaseScript --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --chain-id $CHAIN_ID -vvvv"

if [ "$VERIFY" = true ]; then
    FORGE_CMD="$FORGE_CMD --verify --etherscan-api-key $BASE_ETHERSCAN_API_KEY"
fi

# Run deployment
print_info "Starting deployment..."
print_info "Command: $FORGE_CMD"
echo ""

eval $FORGE_CMD

if [ $? -eq 0 ]; then
    print_info "Deployment completed successfully!"
    print_info "Check the deployment output above for contract addresses."
    print_info "Update your frontend configuration with the new addresses."
else
    print_error "Deployment failed. Check the error messages above."
    exit 1
fi




