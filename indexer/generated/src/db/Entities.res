open Table
open Enums.EntityType
type id = string

type internalEntity = Internal.entity
module type Entity = {
  type t
  let name: string
  let schema: S.t<t>
  let rowsSchema: S.t<array<t>>
  let table: Table.table
  let entityHistory: EntityHistory.t<t>
}
external entityModToInternal: module(Entity with type t = 'a) => Internal.entityConfig = "%identity"
external entityModsToInternal: array<module(Entity)> => array<Internal.entityConfig> = "%identity"
external entitiesToInternal: array<'a> => array<Internal.entity> = "%identity"

@get
external getEntityId: internalEntity => string = "id"

exception UnexpectedIdNotDefinedOnEntity
let getEntityIdUnsafe = (entity: 'entity): id =>
  switch Utils.magic(entity)["id"] {
  | Some(id) => id
  | None =>
    UnexpectedIdNotDefinedOnEntity->ErrorHandling.mkLogAndRaise(
      ~msg="Property 'id' does not exist on expected entity object",
    )
  }

//shorthand for punning
let isPrimaryKey = true
let isNullable = true
let isArray = true
let isIndex = true

@genType
type whereOperations<'entity, 'fieldType> = {
  eq: 'fieldType => promise<array<'entity>>,
  gt: 'fieldType => promise<array<'entity>>
}

module GlobalStats = {
  let name = (GlobalStats :> string)
  @genType
  type t = {
    id: id,
    totalMarkets: bigint,
    totalPredictions: bigint,
    totalResolved: bigint,
    totalUsers: bigint,
    totalVolume: bigint,
  }

  let schema = S.object((s): t => {
    id: s.field("id", S.string),
    totalMarkets: s.field("totalMarkets", BigInt.schema),
    totalPredictions: s.field("totalPredictions", BigInt.schema),
    totalResolved: s.field("totalResolved", BigInt.schema),
    totalUsers: s.field("totalUsers", BigInt.schema),
    totalVolume: s.field("totalVolume", BigInt.schema),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "totalMarkets", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "totalPredictions", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "totalResolved", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "totalUsers", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "totalVolume", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema)

  external castToInternal: t => Internal.entity = "%identity"
}

module Market = {
  let name = (Market :> string)
  @genType
  type t = {
    category: string,
    createdAt: bigint,
    creator: string,
    endTime: bigint,
    id: id,
    marketId: bigint,
    marketType: bigint,
    noPool: bigint,
    predictionCount: bigint,
    question: string,
    resolved: bool,
    resolvedAt: option<bigint>,
    status: string,
    totalPool: bigint,
    winningOutcome: option<bigint>,
    winningOutcomeIndex: option<bigint>,
    yesPool: bigint,
  }

  let schema = S.object((s): t => {
    category: s.field("category", S.string),
    createdAt: s.field("createdAt", BigInt.schema),
    creator: s.field("creator", S.string),
    endTime: s.field("endTime", BigInt.schema),
    id: s.field("id", S.string),
    marketId: s.field("marketId", BigInt.schema),
    marketType: s.field("marketType", BigInt.schema),
    noPool: s.field("noPool", BigInt.schema),
    predictionCount: s.field("predictionCount", BigInt.schema),
    question: s.field("question", S.string),
    resolved: s.field("resolved", S.bool),
    resolvedAt: s.field("resolvedAt", S.null(BigInt.schema)),
    status: s.field("status", S.string),
    totalPool: s.field("totalPool", BigInt.schema),
    winningOutcome: s.field("winningOutcome", S.null(BigInt.schema)),
    winningOutcomeIndex: s.field("winningOutcomeIndex", S.null(BigInt.schema)),
    yesPool: s.field("yesPool", BigInt.schema),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "category", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "createdAt", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "creator", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "endTime", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "marketId", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "marketType", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "noPool", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "predictionCount", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "question", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "resolved", 
      Boolean,
      ~fieldSchema=S.bool,
      
      
      
      
      
      ),
      mkField(
      "resolvedAt", 
      Numeric,
      ~fieldSchema=S.null(BigInt.schema),
      
      ~isNullable,
      
      
      
      ),
      mkField(
      "status", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "totalPool", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "winningOutcome", 
      Numeric,
      ~fieldSchema=S.null(BigInt.schema),
      
      ~isNullable,
      
      
      
      ),
      mkField(
      "winningOutcomeIndex", 
      Numeric,
      ~fieldSchema=S.null(BigInt.schema),
      
      ~isNullable,
      
      
      
      ),
      mkField(
      "yesPool", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema)

  external castToInternal: t => Internal.entity = "%identity"
}

module MarketFactory_OwnershipTransferred = {
  let name = (MarketFactory_OwnershipTransferred :> string)
  @genType
  type t = {
    id: id,
    newOwner: string,
    previousOwner: string,
  }

  let schema = S.object((s): t => {
    id: s.field("id", S.string),
    newOwner: s.field("newOwner", S.string),
    previousOwner: s.field("previousOwner", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "newOwner", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "previousOwner", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema)

  external castToInternal: t => Internal.entity = "%identity"
}

module Prediction = {
  let name = (Prediction :> string)
  @genType
  type t = {
    amount: bigint,
    claimed: bool,
    id: id,
    marketId: bigint,
    outcomeIndex: bigint,
    side: bigint,
    timestamp: bigint,
    user: string,
  }

  let schema = S.object((s): t => {
    amount: s.field("amount", BigInt.schema),
    claimed: s.field("claimed", S.bool),
    id: s.field("id", S.string),
    marketId: s.field("marketId", BigInt.schema),
    outcomeIndex: s.field("outcomeIndex", BigInt.schema),
    side: s.field("side", BigInt.schema),
    timestamp: s.field("timestamp", BigInt.schema),
    user: s.field("user", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "amount", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "claimed", 
      Boolean,
      ~fieldSchema=S.bool,
      
      
      
      
      
      ),
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "marketId", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "outcomeIndex", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "side", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "timestamp", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "user", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema)

  external castToInternal: t => Internal.entity = "%identity"
}

module PredictionMarket_MarketCreated = {
  let name = (PredictionMarket_MarketCreated :> string)
  @genType
  type t = {
    category: string,
    creator: string,
    endTime: bigint,
    id: id,
    marketId: bigint,
    question: string,
  }

  let schema = S.object((s): t => {
    category: s.field("category", S.string),
    creator: s.field("creator", S.string),
    endTime: s.field("endTime", BigInt.schema),
    id: s.field("id", S.string),
    marketId: s.field("marketId", BigInt.schema),
    question: s.field("question", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "category", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "creator", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "endTime", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "marketId", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "question", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema)

  external castToInternal: t => Internal.entity = "%identity"
}

module PredictionMarket_MarketResolved = {
  let name = (PredictionMarket_MarketResolved :> string)
  @genType
  type t = {
    id: id,
    marketId: bigint,
    totalPayout: bigint,
    winningOutcome: bigint,
    winningOutcomeIndex: bigint,
  }

  let schema = S.object((s): t => {
    id: s.field("id", S.string),
    marketId: s.field("marketId", BigInt.schema),
    totalPayout: s.field("totalPayout", BigInt.schema),
    winningOutcome: s.field("winningOutcome", BigInt.schema),
    winningOutcomeIndex: s.field("winningOutcomeIndex", BigInt.schema),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "marketId", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "totalPayout", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "winningOutcome", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "winningOutcomeIndex", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema)

  external castToInternal: t => Internal.entity = "%identity"
}

module PredictionMarket_PayoutClaimed = {
  let name = (PredictionMarket_PayoutClaimed :> string)
  @genType
  type t = {
    amount: bigint,
    id: id,
    marketId: bigint,
    user: string,
  }

  let schema = S.object((s): t => {
    amount: s.field("amount", BigInt.schema),
    id: s.field("id", S.string),
    marketId: s.field("marketId", BigInt.schema),
    user: s.field("user", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "amount", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "marketId", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "user", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema)

  external castToInternal: t => Internal.entity = "%identity"
}

module PredictionMarket_PredictionMade = {
  let name = (PredictionMarket_PredictionMade :> string)
  @genType
  type t = {
    amount: bigint,
    id: id,
    marketId: bigint,
    outcomeIndex: bigint,
    side: bigint,
    user: string,
  }

  let schema = S.object((s): t => {
    amount: s.field("amount", BigInt.schema),
    id: s.field("id", S.string),
    marketId: s.field("marketId", BigInt.schema),
    outcomeIndex: s.field("outcomeIndex", BigInt.schema),
    side: s.field("side", BigInt.schema),
    user: s.field("user", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "amount", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "marketId", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "outcomeIndex", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "side", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "user", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema)

  external castToInternal: t => Internal.entity = "%identity"
}

module ReputationSystem_ReputationUpdated = {
  let name = (ReputationSystem_ReputationUpdated :> string)
  @genType
  type t = {
    id: id,
    newScore: bigint,
    streak: bigint,
    user: string,
  }

  let schema = S.object((s): t => {
    id: s.field("id", S.string),
    newScore: s.field("newScore", BigInt.schema),
    streak: s.field("streak", BigInt.schema),
    user: s.field("user", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "newScore", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "streak", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "user", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema)

  external castToInternal: t => Internal.entity = "%identity"
}

module ReputationSystem_UsernameSet = {
  let name = (ReputationSystem_UsernameSet :> string)
  @genType
  type t = {
    id: id,
    user: string,
    username: string,
  }

  let schema = S.object((s): t => {
    id: s.field("id", S.string),
    user: s.field("user", S.string),
    username: s.field("username", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "user", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "username", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema)

  external castToInternal: t => Internal.entity = "%identity"
}

module User = {
  let name = (User :> string)
  @genType
  type t = {
    address: string,
    bestStreak: bigint,
    correctPredictions: bigint,
    currentStreak: bigint,
    id: id,
    reputationScore: bigint,
    totalPredictions: bigint,
    totalStaked: bigint,
    totalWinnings: bigint,
    username: option<string>,
  }

  let schema = S.object((s): t => {
    address: s.field("address", S.string),
    bestStreak: s.field("bestStreak", BigInt.schema),
    correctPredictions: s.field("correctPredictions", BigInt.schema),
    currentStreak: s.field("currentStreak", BigInt.schema),
    id: s.field("id", S.string),
    reputationScore: s.field("reputationScore", BigInt.schema),
    totalPredictions: s.field("totalPredictions", BigInt.schema),
    totalStaked: s.field("totalStaked", BigInt.schema),
    totalWinnings: s.field("totalWinnings", BigInt.schema),
    username: s.field("username", S.null(S.string)),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "address", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "bestStreak", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "correctPredictions", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "currentStreak", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "reputationScore", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "totalPredictions", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "totalStaked", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "totalWinnings", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "username", 
      Text,
      ~fieldSchema=S.null(S.string),
      
      ~isNullable,
      
      
      
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema)

  external castToInternal: t => Internal.entity = "%identity"
}

let userEntities = [
  module(GlobalStats),
  module(Market),
  module(MarketFactory_OwnershipTransferred),
  module(Prediction),
  module(PredictionMarket_MarketCreated),
  module(PredictionMarket_MarketResolved),
  module(PredictionMarket_PayoutClaimed),
  module(PredictionMarket_PredictionMade),
  module(ReputationSystem_ReputationUpdated),
  module(ReputationSystem_UsernameSet),
  module(User),
]->entityModsToInternal

let allEntities =
  userEntities->Js.Array2.concat(
    [module(InternalTable.DynamicContractRegistry)]->entityModsToInternal,
  )

let byName =
  allEntities
  ->Js.Array2.map(entityConfig => {
    (entityConfig.name, entityConfig)
  })
  ->Js.Dict.fromArray
