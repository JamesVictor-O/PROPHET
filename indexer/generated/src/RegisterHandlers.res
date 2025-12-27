@val external require: string => unit = "require"

let registerContractHandlers = (
  ~contractName,
  ~handlerPathRelativeToRoot,
  ~handlerPathRelativeToConfig,
) => {
  try {
    require(`../${Path.relativePathToRootFromGenerated}/${handlerPathRelativeToRoot}`)
  } catch {
  | exn =>
    let params = {
      "Contract Name": contractName,
      "Expected Handler Path": handlerPathRelativeToConfig,
      "Code": "EE500",
    }
    let logger = Logging.createChild(~params)

    let errHandler = exn->ErrorHandling.make(~msg="Failed to import handler file", ~logger)
    errHandler->ErrorHandling.log
    errHandler->ErrorHandling.raiseExn
  }
}

%%private(
  let makeGeneratedConfig = () => {
    let chains = [
      {
        let contracts = [
          {
            InternalConfig.name: "MarketFactory",
            abi: Types.MarketFactory.abi,
            addresses: [
              "0x1cF71f7e4a5e79B2bEd17655eb22E31422d9A3f1"->Address.Evm.fromStringOrThrow
,
            ],
            events: [
              (Types.MarketFactory.OwnershipTransferred.register() :> Internal.eventConfig),
            ],
            startBlock: None,
          },
          {
            InternalConfig.name: "PredictionMarket",
            abi: Types.PredictionMarket.abi,
            addresses: [
              "0x1d06d3fDb2e9DC1bD870A26198559237640Ce310"->Address.Evm.fromStringOrThrow
,
            ],
            events: [
              (Types.PredictionMarket.MarketCreated.register() :> Internal.eventConfig),
              (Types.PredictionMarket.PredictionMade.register() :> Internal.eventConfig),
              (Types.PredictionMarket.MarketResolved.register() :> Internal.eventConfig),
              (Types.PredictionMarket.PayoutClaimed.register() :> Internal.eventConfig),
            ],
            startBlock: None,
          },
          {
            InternalConfig.name: "Oracle",
            abi: Types.Oracle.abi,
            addresses: [
              "0x7b99147Fbcc797713357D29EAeF5e7bB5d8BA018"->Address.Evm.fromStringOrThrow
,
            ],
            events: [
              (Types.Oracle.MarketResolved.register() :> Internal.eventConfig),
            ],
            startBlock: None,
          },
          {
            InternalConfig.name: "ReputationSystem",
            abi: Types.ReputationSystem.abi,
            addresses: [
              "0xD763b4dC216B84C378aeAFD007166609F6F1f62C"->Address.Evm.fromStringOrThrow
,
            ],
            events: [
              (Types.ReputationSystem.ReputationUpdated.register() :> Internal.eventConfig),
              (Types.ReputationSystem.UsernameSet.register() :> Internal.eventConfig),
            ],
            startBlock: None,
          },
        ]
        let chain = ChainMap.Chain.makeUnsafe(~chainId=84532)
        {
          InternalConfig.confirmedBlockThreshold: 200,
          startBlock: 35545281,
          id: 84532,
          contracts,
          sources: NetworkSources.evm(~chain, ~contracts=[{name: "MarketFactory",events: [Types.MarketFactory.OwnershipTransferred.register()],abi: Types.MarketFactory.abi}, {name: "PredictionMarket",events: [Types.PredictionMarket.MarketCreated.register(), Types.PredictionMarket.PredictionMade.register(), Types.PredictionMarket.MarketResolved.register(), Types.PredictionMarket.PayoutClaimed.register()],abi: Types.PredictionMarket.abi}, {name: "Oracle",events: [Types.Oracle.MarketResolved.register()],abi: Types.Oracle.abi}, {name: "ReputationSystem",events: [Types.ReputationSystem.ReputationUpdated.register(), Types.ReputationSystem.UsernameSet.register()],abi: Types.ReputationSystem.abi}], ~hyperSync=Some("https://84532.hypersync.xyz"), ~allEventSignatures=[Types.MarketFactory.eventSignatures, Types.PredictionMarket.eventSignatures, Types.Oracle.eventSignatures, Types.ReputationSystem.eventSignatures]->Belt.Array.concatMany, ~shouldUseHypersyncClientDecoder=true, ~rpcs=[], ~lowercaseAddresses=false)
        }
      },
    ]

    Config.make(
      ~shouldRollbackOnReorg=true,
      ~shouldSaveFullHistory=false,
      ~isUnorderedMultichainMode=true,
      ~chains,
      ~enableRawEvents=false,
      ~batchSize=?Env.batchSize,
      ~preloadHandlers=true,
      ~lowercaseAddresses=false,
      ~shouldUseHypersyncClientDecoder=true,
    )
  }

  let config: ref<option<Config.t>> = ref(None)
)

let registerAllHandlers = () => {
  let configWithoutRegistrations = makeGeneratedConfig()
  EventRegister.startRegistration(
    ~ecosystem=configWithoutRegistrations.ecosystem,
    ~multichain=configWithoutRegistrations.multichain,
    ~preloadHandlers=configWithoutRegistrations.preloadHandlers,
  )

  registerContractHandlers(
    ~contractName="MarketFactory",
    ~handlerPathRelativeToRoot="src/EventHandlers.ts",
    ~handlerPathRelativeToConfig="src/EventHandlers.ts",
  )
  registerContractHandlers(
    ~contractName="Oracle",
    ~handlerPathRelativeToRoot="src/EventHandlers.ts",
    ~handlerPathRelativeToConfig="src/EventHandlers.ts",
  )
  registerContractHandlers(
    ~contractName="PredictionMarket",
    ~handlerPathRelativeToRoot="src/EventHandlers.ts",
    ~handlerPathRelativeToConfig="src/EventHandlers.ts",
  )
  registerContractHandlers(
    ~contractName="ReputationSystem",
    ~handlerPathRelativeToRoot="src/EventHandlers.ts",
    ~handlerPathRelativeToConfig="src/EventHandlers.ts",
  )

  let generatedConfig = {
    // Need to recreate initial config one more time,
    // since configWithoutRegistrations called register for event
    // before they were ready
    ...makeGeneratedConfig(),
    registrations: Some(EventRegister.finishRegistration()),
  }
  config := Some(generatedConfig)
  generatedConfig
}

let getConfig = () => {
  switch config.contents {
  | Some(config) => config
  | None => registerAllHandlers()
  }
}

let getConfigWithoutRegistrations = makeGeneratedConfig
