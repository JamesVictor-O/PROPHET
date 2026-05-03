import ProphetFactoryArtifact from "./abis/ProphetFactory.json";
import MarketContractArtifact from "./abis/MarketContract.json";
import PositionVaultArtifact from "./abis/PositionVault.json";
import PayoutDistributorArtifact from "./abis/PayoutDistributor.json";

// 0G Galileo testnet (chain 16602) — deployed with ECDSA attestation
export const PROPHET_FACTORY_ADDRESS = (
  process.env.NEXT_PUBLIC_PROPHET_FACTORY_ADDRESS ?? "0x745979C05740a08E3bd33b952Ec23828d7271890"
) as `0x${string}`;
export const POSITION_VAULT_ADDRESS = (
  process.env.NEXT_PUBLIC_POSITION_VAULT_ADDRESS ?? "0xaA27d424b75E487767BFf135b377a62384f7ADe7"
) as `0x${string}`;
export const PAYOUT_DISTRIBUTOR_ADDRESS = (
  process.env.NEXT_PUBLIC_PAYOUT_DISTRIBUTOR_ADDRESS ?? "0xB47E02e88d10751Ca6FA79EbcD85fAd4a619a815"
) as `0x${string}`;
export const MOCK_USDT_ADDRESS = (
  process.env.NEXT_PUBLIC_USDT_ADDRESS ?? "0xc2B0D2A7e858F13B349843fF87dBF4EBF9227F49"
) as `0x${string}`;

// Ensure we get the `abi` array from the Foundry compilation artifact
export const PROPHET_FACTORY_ABI = ProphetFactoryArtifact.abi;
export const MARKET_CONTRACT_ABI = MarketContractArtifact.abi;
export const POSITION_VAULT_ABI = PositionVaultArtifact.abi;
export const PAYOUT_DISTRIBUTOR_ABI = PayoutDistributorArtifact.abi;
