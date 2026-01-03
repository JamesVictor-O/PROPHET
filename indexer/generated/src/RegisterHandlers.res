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
              "0x1c849781862895235688912850235d9C6a86650e"->Address.Evm.fromStringOrThrow
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
              "0xD5377BF1cfAA0Bb24d54c5010242d12Ed189d261"->Address.Evm.fromStringOrThrow
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
              "0x439B12822485Bab0af0731bDfa58eEE5A50F8001"->Address.Evm.fromStringOrThrow
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
              "0x1Ef708437cCBBC0353779e68a3275E566b165AAF"->Address.Evm.fromStringOrThrow
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
          startBlock: 35797900,
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
    ~handlerPathRelativeToRoot="src/EventHandlers.js",
    ~handlerPathRelativeToConfig="src/EventHandlers.js",
  )
  registerContractHandlers(
    ~contractName="Oracle",
    ~handlerPathRelativeToRoot="src/EventHandlers.js",
    ~handlerPathRelativeToConfig="src/EventHandlers.js",
  )
  registerContractHandlers(
    ~contractName="PredictionMarket",
    ~handlerPathRelativeToRoot="src/EventHandlers.js",
    ~handlerPathRelativeToConfig="src/EventHandlers.js",
  )
  registerContractHandlers(
    ~contractName="ReputationSystem",
    ~handlerPathRelativeToRoot="src/EventHandlers.js",
    ~handlerPathRelativeToConfig="src/EventHandlers.js",
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
