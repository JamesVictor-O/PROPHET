module ContractType = {
  @genType
  type t = 
    | @as("MarketFactory") MarketFactory
    | @as("Oracle") Oracle
    | @as("PredictionMarket") PredictionMarket
    | @as("ReputationSystem") ReputationSystem

  let name = "CONTRACT_TYPE"
  let variants = [
    MarketFactory,
    Oracle,
    PredictionMarket,
    ReputationSystem,
  ]
  let config = Internal.makeEnumConfig(~name, ~variants)
}

module EntityType = {
  @genType
  type t = 
    | @as("GlobalStats") GlobalStats
    | @as("Market") Market
    | @as("MarketFactory_OwnershipTransferred") MarketFactory_OwnershipTransferred
    | @as("Prediction") Prediction
    | @as("PredictionMarket_MarketCreated") PredictionMarket_MarketCreated
    | @as("PredictionMarket_MarketResolved") PredictionMarket_MarketResolved
    | @as("PredictionMarket_PayoutClaimed") PredictionMarket_PayoutClaimed
    | @as("PredictionMarket_PredictionMade") PredictionMarket_PredictionMade
    | @as("ReputationSystem_ReputationUpdated") ReputationSystem_ReputationUpdated
    | @as("ReputationSystem_UsernameSet") ReputationSystem_UsernameSet
    | @as("User") User
    | @as("dynamic_contract_registry") DynamicContractRegistry

  let name = "ENTITY_TYPE"
  let variants = [
    GlobalStats,
    Market,
    MarketFactory_OwnershipTransferred,
    Prediction,
    PredictionMarket_MarketCreated,
    PredictionMarket_MarketResolved,
    PredictionMarket_PayoutClaimed,
    PredictionMarket_PredictionMade,
    ReputationSystem_ReputationUpdated,
    ReputationSystem_UsernameSet,
    User,
    DynamicContractRegistry,
  ]
  let config = Internal.makeEnumConfig(~name, ~variants)
}

let allEnums = ([
  ContractType.config->Internal.fromGenericEnumConfig,
  EntityType.config->Internal.fromGenericEnumConfig,
])
