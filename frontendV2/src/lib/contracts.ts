import ProphetFactoryArtifact from "./abis/ProphetFactory.json";
import MarketContractArtifact from "./abis/MarketContract.json";
import PositionVaultArtifact from "./abis/PositionVault.json";
import PayoutDistributorArtifact from "./abis/PayoutDistributor.json";

export const PROPHET_FACTORY_ADDRESS =
  "0x15b9e263b6e896d4d8f0d9c89878678aa6abadec";
export const POSITION_VAULT_ADDRESS =
  "0x0115ca8539906db2d9a4bee36c64ea94a0d7fa31";
export const PAYOUT_DISTRIBUTOR_ADDRESS =
  "0x284991966a8256521e72470e3b92e03e8ab8c1c3";
export const MOCK_USDT_ADDRESS = "0xc2b0d2a7e858f13b349843ff87dbf4ebf9227f49";

// Ensure we get the `abi` array from the Foundry compilation artifact
export const PROPHET_FACTORY_ABI = ProphetFactoryArtifact.abi;
export const MARKET_CONTRACT_ABI = MarketContractArtifact.abi;
export const POSITION_VAULT_ABI = PositionVaultArtifact.abi;
export const PAYOUT_DISTRIBUTOR_ABI = PayoutDistributorArtifact.abi;
