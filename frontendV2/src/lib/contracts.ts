import ProphetFactoryArtifact from "./abis/ProphetFactory.json";
import MarketContractArtifact from "./abis/MarketContract.json";
import PositionVaultArtifact from "./abis/PositionVault.json";
import PayoutDistributorArtifact from "./abis/PayoutDistributor.json";
import LiquidityPoolArtifact from "./abis/LiquidityPool.json";

// 0G Galileo testnet (chain 16602) — deployed with ECDSA attestation
export const PROPHET_FACTORY_ADDRESS = (
  process.env.NEXT_PUBLIC_PROPHET_FACTORY_ADDRESS ?? "0x069e6203ef2CEB6aB7eC23432f9693eADdE0Af7C"
) as `0x${string}`;
export const POSITION_VAULT_ADDRESS = (
  process.env.NEXT_PUBLIC_POSITION_VAULT_ADDRESS ?? "0xb941a917B0a345B87f30598589Cc71b5ff9b72b9"
) as `0x${string}`;
export const PAYOUT_DISTRIBUTOR_ADDRESS = (
  process.env.NEXT_PUBLIC_PAYOUT_DISTRIBUTOR_ADDRESS ?? "0x33a32264031c6CE010b200227aC8119E5156b405"
) as `0x${string}`;
export const MOCK_USDT_ADDRESS = (
  process.env.NEXT_PUBLIC_USDT_ADDRESS ?? "0xc2B0D2A7e858F13B349843fF87dBF4EBF9227F49"
) as `0x${string}`;
export const LIQUIDITY_POOL_ADDRESS = (
  process.env.NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS ?? "0xda95ad4cA75eC78fE71D5Be970c8c3956E32B018"
) as `0x${string}`;

// Ensure we get the `abi` array from the Foundry compilation artifact
export const PROPHET_FACTORY_ABI = ProphetFactoryArtifact.abi;
export const MARKET_CONTRACT_ABI = MarketContractArtifact.abi;
export const POSITION_VAULT_ABI = PositionVaultArtifact.abi;
export const PAYOUT_DISTRIBUTOR_ABI = PayoutDistributorArtifact.abi;
export const LIQUIDITY_POOL_ABI = LiquidityPoolArtifact.abi;
