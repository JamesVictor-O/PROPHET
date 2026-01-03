
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
            "0x1c849781862895235688912850235d9C6a86650e",
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
            "0xD5377BF1cfAA0Bb24d54c5010242d12Ed189d261",
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
            "0x439B12822485Bab0af0731bDfa58eEE5A50F8001",
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
            "0x1Ef708437cCBBC0353779e68a3275E566b165AAF",
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
        startBlock: 35797900,
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
