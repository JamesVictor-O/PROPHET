/***** TAKE NOTE ******
This is a hack to get genType to work!

In order for genType to produce recursive types, it needs to be at the 
root module of a file. If it's defined in a nested module it does not 
work. So all the MockDb types and internal functions are defined in TestHelpers_MockDb
and only public functions are recreated and exported from this module.

the following module:
```rescript
module MyModule = {
  @genType
  type rec a = {fieldB: b}
  @genType and b = {fieldA: a}
}
```

produces the following in ts:
```ts
// tslint:disable-next-line:interface-over-type-literal
export type MyModule_a = { readonly fieldB: b };

// tslint:disable-next-line:interface-over-type-literal
export type MyModule_b = { readonly fieldA: MyModule_a };
```

fieldB references type b which doesn't exist because it's defined
as MyModule_b
*/

module MockDb = {
  @genType
  let createMockDb = TestHelpers_MockDb.createMockDb
}

@genType
module Addresses = {
  include TestHelpers_MockAddresses
}

module EventFunctions = {
  //Note these are made into a record to make operate in the same way
  //for Res, JS and TS.

  /**
  The arguements that get passed to a "processEvent" helper function
  */
  @genType
  type eventProcessorArgs<'event> = {
    event: 'event,
    mockDb: TestHelpers_MockDb.t,
    @deprecated("Set the chainId for the event instead")
    chainId?: int,
  }

  @genType
  type eventProcessor<'event> = eventProcessorArgs<'event> => promise<TestHelpers_MockDb.t>

  /**
  A function composer to help create individual processEvent functions
  */
  let makeEventProcessor = (~register) => args => {
    let {event, mockDb, ?chainId} =
      args->(Utils.magic: eventProcessorArgs<'event> => eventProcessorArgs<Internal.event>)

    // Have the line here, just in case the function is called with
    // a manually created event. We don't want to break the existing tests here.
    let _ =
      TestHelpers_MockDb.mockEventRegisters->Utils.WeakMap.set(event, register)
    TestHelpers_MockDb.makeProcessEvents(mockDb, ~chainId=?chainId)([event->(Utils.magic: Internal.event => Types.eventLog<unknown>)])
  }

  module MockBlock = {
    @genType
    type t = {
      hash?: string,
      number?: int,
      timestamp?: int,
    }

    let toBlock = (_mock: t) => {
      hash: _mock.hash->Belt.Option.getWithDefault("foo"),
      number: _mock.number->Belt.Option.getWithDefault(0),
      timestamp: _mock.timestamp->Belt.Option.getWithDefault(0),
    }->(Utils.magic: Types.AggregatedBlock.t => Internal.eventBlock)
  }

  module MockTransaction = {
    @genType
    type t = {
    }

    let toTransaction = (_mock: t) => {
    }->(Utils.magic: Types.AggregatedTransaction.t => Internal.eventTransaction)
  }

  @genType
  type mockEventData = {
    chainId?: int,
    srcAddress?: Address.t,
    logIndex?: int,
    block?: MockBlock.t,
    transaction?: MockTransaction.t,
  }

  /**
  Applies optional paramters with defaults for all common eventLog field
  */
  let makeEventMocker = (
    ~params: Internal.eventParams,
    ~mockEventData: option<mockEventData>,
    ~register: unit => Internal.eventConfig,
  ): Internal.event => {
    let {?block, ?transaction, ?srcAddress, ?chainId, ?logIndex} =
      mockEventData->Belt.Option.getWithDefault({})
    let block = block->Belt.Option.getWithDefault({})->MockBlock.toBlock
    let transaction = transaction->Belt.Option.getWithDefault({})->MockTransaction.toTransaction
    let config = RegisterHandlers.getConfig()
    let event: Internal.event = {
      params,
      transaction,
      chainId: switch chainId {
      | Some(chainId) => chainId
      | None =>
        switch config.defaultChain {
        | Some(chainConfig) => chainConfig.id
        | None =>
          Js.Exn.raiseError(
            "No default chain Id found, please add at least 1 chain to your config.yaml",
          )
        }
      },
      block,
      srcAddress: srcAddress->Belt.Option.getWithDefault(Addresses.defaultAddress),
      logIndex: logIndex->Belt.Option.getWithDefault(0),
    }
    // Since currently it's not possible to figure out the event config from the event
    // we store a reference to the register function by event in a weak map
    let _ = TestHelpers_MockDb.mockEventRegisters->Utils.WeakMap.set(event, register)
    event
  }
}


module MarketFactory = {
  module OwnershipTransferred = {
    @genType
    let processEvent: EventFunctions.eventProcessor<Types.MarketFactory.OwnershipTransferred.event> = EventFunctions.makeEventProcessor(
      ~register=(Types.MarketFactory.OwnershipTransferred.register :> unit => Internal.eventConfig),
    )

    @genType
    type createMockArgs = {
      @as("previousOwner")
      previousOwner?: Address.t,
      @as("newOwner")
      newOwner?: Address.t,
      mockEventData?: EventFunctions.mockEventData,
    }

    @genType
    let createMockEvent = args => {
      let {
        ?previousOwner,
        ?newOwner,
        ?mockEventData,
      } = args

      let params = 
      {
       previousOwner: previousOwner->Belt.Option.getWithDefault(TestHelpers_MockAddresses.defaultAddress),
       newOwner: newOwner->Belt.Option.getWithDefault(TestHelpers_MockAddresses.defaultAddress),
      }
->(Utils.magic: Types.MarketFactory.OwnershipTransferred.eventArgs => Internal.eventParams)

      EventFunctions.makeEventMocker(
        ~params,
        ~mockEventData,
        ~register=(Types.MarketFactory.OwnershipTransferred.register :> unit => Internal.eventConfig),
      )->(Utils.magic: Internal.event => Types.MarketFactory.OwnershipTransferred.event)
    }
  }

}


module Oracle = {
  module MarketResolved = {
    @genType
    let processEvent: EventFunctions.eventProcessor<Types.Oracle.MarketResolved.event> = EventFunctions.makeEventProcessor(
      ~register=(Types.Oracle.MarketResolved.register :> unit => Internal.eventConfig),
    )

    @genType
    type createMockArgs = {
      @as("marketId")
      marketId?: bigint,
      @as("outcome")
      outcome?: bigint,
      @as("resolver")
      resolver?: Address.t,
      mockEventData?: EventFunctions.mockEventData,
    }

    @genType
    let createMockEvent = args => {
      let {
        ?marketId,
        ?outcome,
        ?resolver,
        ?mockEventData,
      } = args

      let params = 
      {
       marketId: marketId->Belt.Option.getWithDefault(0n),
       outcome: outcome->Belt.Option.getWithDefault(0n),
       resolver: resolver->Belt.Option.getWithDefault(TestHelpers_MockAddresses.defaultAddress),
      }
->(Utils.magic: Types.Oracle.MarketResolved.eventArgs => Internal.eventParams)

      EventFunctions.makeEventMocker(
        ~params,
        ~mockEventData,
        ~register=(Types.Oracle.MarketResolved.register :> unit => Internal.eventConfig),
      )->(Utils.magic: Internal.event => Types.Oracle.MarketResolved.event)
    }
  }

}


module PredictionMarket = {
  module MarketCreated = {
    @genType
    let processEvent: EventFunctions.eventProcessor<Types.PredictionMarket.MarketCreated.event> = EventFunctions.makeEventProcessor(
      ~register=(Types.PredictionMarket.MarketCreated.register :> unit => Internal.eventConfig),
    )

    @genType
    type createMockArgs = {
      @as("marketId")
      marketId?: bigint,
      @as("creator")
      creator?: Address.t,
      @as("question")
      question?: string,
      @as("category")
      category?: string,
      @as("endTime")
      endTime?: bigint,
      mockEventData?: EventFunctions.mockEventData,
    }

    @genType
    let createMockEvent = args => {
      let {
        ?marketId,
        ?creator,
        ?question,
        ?category,
        ?endTime,
        ?mockEventData,
      } = args

      let params = 
      {
       marketId: marketId->Belt.Option.getWithDefault(0n),
       creator: creator->Belt.Option.getWithDefault(TestHelpers_MockAddresses.defaultAddress),
       question: question->Belt.Option.getWithDefault("foo"),
       category: category->Belt.Option.getWithDefault("foo"),
       endTime: endTime->Belt.Option.getWithDefault(0n),
      }
->(Utils.magic: Types.PredictionMarket.MarketCreated.eventArgs => Internal.eventParams)

      EventFunctions.makeEventMocker(
        ~params,
        ~mockEventData,
        ~register=(Types.PredictionMarket.MarketCreated.register :> unit => Internal.eventConfig),
      )->(Utils.magic: Internal.event => Types.PredictionMarket.MarketCreated.event)
    }
  }

  module PredictionMade = {
    @genType
    let processEvent: EventFunctions.eventProcessor<Types.PredictionMarket.PredictionMade.event> = EventFunctions.makeEventProcessor(
      ~register=(Types.PredictionMarket.PredictionMade.register :> unit => Internal.eventConfig),
    )

    @genType
    type createMockArgs = {
      @as("marketId")
      marketId?: bigint,
      @as("user")
      user?: Address.t,
      @as("side")
      side?: bigint,
      @as("outcomeIndex")
      outcomeIndex?: bigint,
      @as("amount")
      amount?: bigint,
      mockEventData?: EventFunctions.mockEventData,
    }

    @genType
    let createMockEvent = args => {
      let {
        ?marketId,
        ?user,
        ?side,
        ?outcomeIndex,
        ?amount,
        ?mockEventData,
      } = args

      let params = 
      {
       marketId: marketId->Belt.Option.getWithDefault(0n),
       user: user->Belt.Option.getWithDefault(TestHelpers_MockAddresses.defaultAddress),
       side: side->Belt.Option.getWithDefault(0n),
       outcomeIndex: outcomeIndex->Belt.Option.getWithDefault(0n),
       amount: amount->Belt.Option.getWithDefault(0n),
      }
->(Utils.magic: Types.PredictionMarket.PredictionMade.eventArgs => Internal.eventParams)

      EventFunctions.makeEventMocker(
        ~params,
        ~mockEventData,
        ~register=(Types.PredictionMarket.PredictionMade.register :> unit => Internal.eventConfig),
      )->(Utils.magic: Internal.event => Types.PredictionMarket.PredictionMade.event)
    }
  }

  module MarketResolved = {
    @genType
    let processEvent: EventFunctions.eventProcessor<Types.PredictionMarket.MarketResolved.event> = EventFunctions.makeEventProcessor(
      ~register=(Types.PredictionMarket.MarketResolved.register :> unit => Internal.eventConfig),
    )

    @genType
    type createMockArgs = {
      @as("marketId")
      marketId?: bigint,
      @as("winningOutcome")
      winningOutcome?: bigint,
      @as("winningOutcomeIndex")
      winningOutcomeIndex?: bigint,
      @as("totalPayout")
      totalPayout?: bigint,
      mockEventData?: EventFunctions.mockEventData,
    }

    @genType
    let createMockEvent = args => {
      let {
        ?marketId,
        ?winningOutcome,
        ?winningOutcomeIndex,
        ?totalPayout,
        ?mockEventData,
      } = args

      let params = 
      {
       marketId: marketId->Belt.Option.getWithDefault(0n),
       winningOutcome: winningOutcome->Belt.Option.getWithDefault(0n),
       winningOutcomeIndex: winningOutcomeIndex->Belt.Option.getWithDefault(0n),
       totalPayout: totalPayout->Belt.Option.getWithDefault(0n),
      }
->(Utils.magic: Types.PredictionMarket.MarketResolved.eventArgs => Internal.eventParams)

      EventFunctions.makeEventMocker(
        ~params,
        ~mockEventData,
        ~register=(Types.PredictionMarket.MarketResolved.register :> unit => Internal.eventConfig),
      )->(Utils.magic: Internal.event => Types.PredictionMarket.MarketResolved.event)
    }
  }

  module PayoutClaimed = {
    @genType
    let processEvent: EventFunctions.eventProcessor<Types.PredictionMarket.PayoutClaimed.event> = EventFunctions.makeEventProcessor(
      ~register=(Types.PredictionMarket.PayoutClaimed.register :> unit => Internal.eventConfig),
    )

    @genType
    type createMockArgs = {
      @as("marketId")
      marketId?: bigint,
      @as("user")
      user?: Address.t,
      @as("amount")
      amount?: bigint,
      mockEventData?: EventFunctions.mockEventData,
    }

    @genType
    let createMockEvent = args => {
      let {
        ?marketId,
        ?user,
        ?amount,
        ?mockEventData,
      } = args

      let params = 
      {
       marketId: marketId->Belt.Option.getWithDefault(0n),
       user: user->Belt.Option.getWithDefault(TestHelpers_MockAddresses.defaultAddress),
       amount: amount->Belt.Option.getWithDefault(0n),
      }
->(Utils.magic: Types.PredictionMarket.PayoutClaimed.eventArgs => Internal.eventParams)

      EventFunctions.makeEventMocker(
        ~params,
        ~mockEventData,
        ~register=(Types.PredictionMarket.PayoutClaimed.register :> unit => Internal.eventConfig),
      )->(Utils.magic: Internal.event => Types.PredictionMarket.PayoutClaimed.event)
    }
  }

}


module ReputationSystem = {
  module ReputationUpdated = {
    @genType
    let processEvent: EventFunctions.eventProcessor<Types.ReputationSystem.ReputationUpdated.event> = EventFunctions.makeEventProcessor(
      ~register=(Types.ReputationSystem.ReputationUpdated.register :> unit => Internal.eventConfig),
    )

    @genType
    type createMockArgs = {
      @as("user")
      user?: Address.t,
      @as("newScore")
      newScore?: bigint,
      @as("streak")
      streak?: bigint,
      mockEventData?: EventFunctions.mockEventData,
    }

    @genType
    let createMockEvent = args => {
      let {
        ?user,
        ?newScore,
        ?streak,
        ?mockEventData,
      } = args

      let params = 
      {
       user: user->Belt.Option.getWithDefault(TestHelpers_MockAddresses.defaultAddress),
       newScore: newScore->Belt.Option.getWithDefault(0n),
       streak: streak->Belt.Option.getWithDefault(0n),
      }
->(Utils.magic: Types.ReputationSystem.ReputationUpdated.eventArgs => Internal.eventParams)

      EventFunctions.makeEventMocker(
        ~params,
        ~mockEventData,
        ~register=(Types.ReputationSystem.ReputationUpdated.register :> unit => Internal.eventConfig),
      )->(Utils.magic: Internal.event => Types.ReputationSystem.ReputationUpdated.event)
    }
  }

  module UsernameSet = {
    @genType
    let processEvent: EventFunctions.eventProcessor<Types.ReputationSystem.UsernameSet.event> = EventFunctions.makeEventProcessor(
      ~register=(Types.ReputationSystem.UsernameSet.register :> unit => Internal.eventConfig),
    )

    @genType
    type createMockArgs = {
      @as("user")
      user?: Address.t,
      @as("username")
      username?: string,
      mockEventData?: EventFunctions.mockEventData,
    }

    @genType
    let createMockEvent = args => {
      let {
        ?user,
        ?username,
        ?mockEventData,
      } = args

      let params = 
      {
       user: user->Belt.Option.getWithDefault(TestHelpers_MockAddresses.defaultAddress),
       username: username->Belt.Option.getWithDefault("foo"),
      }
->(Utils.magic: Types.ReputationSystem.UsernameSet.eventArgs => Internal.eventParams)

      EventFunctions.makeEventMocker(
        ~params,
        ~mockEventData,
        ~register=(Types.ReputationSystem.UsernameSet.register :> unit => Internal.eventConfig),
      )->(Utils.magic: Internal.event => Types.ReputationSystem.UsernameSet.event)
    }
  }

}

