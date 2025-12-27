  @genType
module MarketFactory = {
  module OwnershipTransferred = Types.MakeRegister(Types.MarketFactory.OwnershipTransferred)
}

  @genType
module Oracle = {
  module MarketResolved = Types.MakeRegister(Types.Oracle.MarketResolved)
}

  @genType
module PredictionMarket = {
  module MarketCreated = Types.MakeRegister(Types.PredictionMarket.MarketCreated)
  module PredictionMade = Types.MakeRegister(Types.PredictionMarket.PredictionMade)
  module MarketResolved = Types.MakeRegister(Types.PredictionMarket.MarketResolved)
  module PayoutClaimed = Types.MakeRegister(Types.PredictionMarket.PayoutClaimed)
}

  @genType
module ReputationSystem = {
  module ReputationUpdated = Types.MakeRegister(Types.ReputationSystem.ReputationUpdated)
  module UsernameSet = Types.MakeRegister(Types.ReputationSystem.UsernameSet)
}

@genType /** Register a Block Handler. It'll be called for every block by default. */
let onBlock: (
  Envio.onBlockOptions<Types.chain>,
  Envio.onBlockArgs<Types.handlerContext> => promise<unit>,
) => unit = (
  EventRegister.onBlock: (unknown, Internal.onBlockArgs => promise<unit>) => unit
)->Utils.magic
