import ProphetFactoryArtifact from "./abis/ProphetFactory.json";
import MarketContractArtifact from "./abis/MarketContract.json";
import PositionVaultArtifact from "./abis/PositionVault.json";
import PayoutDistributorArtifact from "./abis/PayoutDistributor.json";
import LiquidityPoolArtifact from "./abis/LiquidityPool.json";

// 0G Galileo testnet (chain 16602) — deployed with ECDSA attestation
export const PROPHET_FACTORY_ADDRESS = (
  process.env.NEXT_PUBLIC_PROPHET_FACTORY_ADDRESS ?? "0xCEd9B4405b9B7d09f6b7d44e6bA113EcF2627333"
) as `0x${string}`;
export const POSITION_VAULT_ADDRESS = (
  process.env.NEXT_PUBLIC_POSITION_VAULT_ADDRESS ?? "0x3f831E170f828DB2711403c6C3AD80e6fB02da75"
) as `0x${string}`;
export const PAYOUT_DISTRIBUTOR_ADDRESS = (
  process.env.NEXT_PUBLIC_PAYOUT_DISTRIBUTOR_ADDRESS ?? "0x0d979Db2cDda3D2f35FDFAb5883F97De40760054"
) as `0x${string}`;
export const MOCK_USDT_ADDRESS = (
  process.env.NEXT_PUBLIC_USDT_ADDRESS ?? "0xc2B0D2A7e858F13B349843fF87dBF4EBF9227F49"
) as `0x${string}`;
export const LIQUIDITY_POOL_ADDRESS = (
  process.env.NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS ?? "0x1A39bD969870e71d22A10b38F2845baBB56649A4"
) as `0x${string}`;

// Ensure we get the `abi` array from the Foundry compilation artifact
export const PROPHET_FACTORY_ABI = ProphetFactoryArtifact.abi;
export const MARKET_CONTRACT_ABI = MarketContractArtifact.abi;
export const POSITION_VAULT_ABI = PositionVaultArtifact.abi;
export const PAYOUT_DISTRIBUTOR_ABI = PayoutDistributorArtifact.abi;
export const LIQUIDITY_POOL_ABI = LiquidityPoolArtifact.abi;
