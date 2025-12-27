
type hyperSyncConfig = {endpointUrl: string}
type hyperFuelConfig = {endpointUrl: string}

@genType.opaque
type rpcConfig = {
  syncConfig: InternalConfig.sourceSync,
}

@genType
type syncSource = HyperSync(hyperSyncConfig) | HyperFuel(hyperFuelConfig) | Rpc(rpcConfig)

@genType.opaque
type aliasAbi = Ethers.abi

type eventName = string

type contract = {
  name: string,
  abi: aliasAbi,
  addresses: array<string>,
  events: array<eventName>,
}

type configYaml = {
  syncSource,
  startBlock: int,
  confirmedBlockThreshold: int,
  contracts: dict<contract>,
  lowercaseAddresses: bool,
}

let publicConfig = ChainMap.fromArrayUnsafe([
  {
    let contracts = Js.Dict.fromArray([
      (
        "MarketFactory",
        {
          name: "MarketFactory",
          abi: Types.MarketFactory.abi,
          addresses: [
            "0x1cF71f7e4a5e79B2bEd17655eb22E31422d9A3f1",
          ],
          events: [
            Types.MarketFactory.OwnershipTransferred.name,
          ],
        }
      ),
      (
        "PredictionMarket",
        {
          name: "PredictionMarket",
          abi: Types.PredictionMarket.abi,
          addresses: [
            "0x1d06d3fDb2e9DC1bD870A26198559237640Ce310",
          ],
          events: [
            Types.PredictionMarket.MarketCreated.name,
            Types.PredictionMarket.PredictionMade.name,
            Types.PredictionMarket.MarketResolved.name,
            Types.PredictionMarket.PayoutClaimed.name,
          ],
        }
      ),
      (
        "Oracle",
        {
          name: "Oracle",
          abi: Types.Oracle.abi,
          addresses: [
            "0x7b99147Fbcc797713357D29EAeF5e7bB5d8BA018",
          ],
          events: [
            Types.Oracle.MarketResolved.name,
          ],
        }
      ),
      (
        "ReputationSystem",
        {
          name: "ReputationSystem",
          abi: Types.ReputationSystem.abi,
          addresses: [
            "0xD763b4dC216B84C378aeAFD007166609F6F1f62C",
          ],
          events: [
            Types.ReputationSystem.ReputationUpdated.name,
            Types.ReputationSystem.UsernameSet.name,
          ],
        }
      ),
    ])
    let chain = ChainMap.Chain.makeUnsafe(~chainId=84532)
    (
      chain,
      {
        confirmedBlockThreshold: 200,
        syncSource: HyperSync({endpointUrl: "https://84532.hypersync.xyz"}),
        startBlock: 35545281,
        contracts,
        lowercaseAddresses: false
      }
    )
  },
])

@genType
let getGeneratedByChainId: int => configYaml = chainId => {
  let chain = ChainMap.Chain.makeUnsafe(~chainId)
  if !(publicConfig->ChainMap.has(chain)) {
    Js.Exn.raiseError(
      "No chain with id " ++ chain->ChainMap.Chain.toString ++ " found in config.yaml",
    )
  }
  publicConfig->ChainMap.get(chain)
}
