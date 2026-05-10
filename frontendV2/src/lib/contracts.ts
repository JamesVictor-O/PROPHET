import ProphetFactoryArtifact from "./abis/ProphetFactory.json";
import MarketContractArtifact from "./abis/MarketContract.json";
import PositionVaultArtifact from "./abis/PositionVault.json";
import PayoutDistributorArtifact from "./abis/PayoutDistributor.json";
import LiquidityPoolArtifact from "./abis/LiquidityPool.json";

// 0G Galileo testnet (chain 16602) — deployed with ECDSA attestation
export const PROPHET_FACTORY_ADDRESS = (
  process.env.NEXT_PUBLIC_PROPHET_FACTORY_ADDRESS ?? "0xEd51e3d6Ba8914875616bBcDd9aa9D4A00B27bD4"
) as `0x${string}`;
export const POSITION_VAULT_ADDRESS = (
  process.env.NEXT_PUBLIC_POSITION_VAULT_ADDRESS ?? "0x89FAcA46A2782b4751F697ddFe0A0b9124Eb794E"
) as `0x${string}`;
export const PAYOUT_DISTRIBUTOR_ADDRESS = (
  process.env.NEXT_PUBLIC_PAYOUT_DISTRIBUTOR_ADDRESS ?? "0x238D341Bb358AC7C8Ae0A22b35897bECE97b9740"
) as `0x${string}`;
export const MOCK_USDT_ADDRESS = (
  process.env.NEXT_PUBLIC_USDT_ADDRESS ?? "0xc2B0D2A7e858F13B349843fF87dBF4EBF9227F49"
) as `0x${string}`;
export const LIQUIDITY_POOL_ADDRESS = (
  process.env.NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS ?? "0x13AbE644693DA19f9A895C8c82Cf53879580DA8e"
) as `0x${string}`;

// Ensure we get the `abi` array from the Foundry compilation artifact
export const PROPHET_FACTORY_ABI = ProphetFactoryArtifact.abi;
export const MARKET_CONTRACT_ABI = MarketContractArtifact.abi;
export const POSITION_VAULT_ABI = PositionVaultArtifact.abi;
export const PAYOUT_DISTRIBUTOR_ABI = PayoutDistributorArtifact.abi;
export const LIQUIDITY_POOL_ABI = LiquidityPoolArtifact.abi;
