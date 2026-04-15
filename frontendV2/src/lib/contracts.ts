import ProphetFactoryArtifact from "./abis/ProphetFactory.json";
import MarketContractArtifact from "./abis/MarketContract.json";
import PositionVaultArtifact from "./abis/PositionVault.json";
import PayoutDistributorArtifact from "./abis/PayoutDistributor.json";

// 0G Galileo testnet (chain 16602)
export const PROPHET_FACTORY_ADDRESS =
  "0x0D08b49a5f26B429E4d72BF1556FB01E3313156b";
export const POSITION_VAULT_ADDRESS =
  "0xCdC7Bc596C72E4Ff4c8c23B11eeEcb23cA9C97C0";
export const PAYOUT_DISTRIBUTOR_ADDRESS =
  "0x80E7AEc2c254d21b720811FBc3C5E47FE796E133";
export const MOCK_USDT_ADDRESS =
  "0xc2B0D2A7e858F13B349843fF87dBF4EBF9227F49";

// Ensure we get the `abi` array from the Foundry compilation artifact
export const PROPHET_FACTORY_ABI = ProphetFactoryArtifact.abi;
export const MARKET_CONTRACT_ABI = MarketContractArtifact.abi;
export const POSITION_VAULT_ABI = PositionVaultArtifact.abi;
export const PAYOUT_DISTRIBUTOR_ABI = PayoutDistributorArtifact.abi;
