/* TypeScript file generated from Types.res by genType. */

/* eslint-disable */
/* tslint:disable */

import type {GlobalStats_t as Entities_GlobalStats_t} from '../src/db/Entities.gen';

import type {HandlerContext as $$handlerContext} from './Types.ts';

import type {HandlerWithOptions as $$fnWithEventConfig} from './bindings/OpaqueTypes.ts';

import type {MarketFactory_OwnershipTransferred_t as Entities_MarketFactory_OwnershipTransferred_t} from '../src/db/Entities.gen';

import type {Market_t as Entities_Market_t} from '../src/db/Entities.gen';

import type {PredictionMarket_MarketCreated_t as Entities_PredictionMarket_MarketCreated_t} from '../src/db/Entities.gen';

import type {PredictionMarket_MarketResolved_t as Entities_PredictionMarket_MarketResolved_t} from '../src/db/Entities.gen';

import type {PredictionMarket_PayoutClaimed_t as Entities_PredictionMarket_PayoutClaimed_t} from '../src/db/Entities.gen';

import type {PredictionMarket_PredictionMade_t as Entities_PredictionMarket_PredictionMade_t} from '../src/db/Entities.gen';

import type {Prediction_t as Entities_Prediction_t} from '../src/db/Entities.gen';

import type {ReputationSystem_ReputationUpdated_t as Entities_ReputationSystem_ReputationUpdated_t} from '../src/db/Entities.gen';

import type {ReputationSystem_UsernameSet_t as Entities_ReputationSystem_UsernameSet_t} from '../src/db/Entities.gen';

import type {SingleOrMultiple as $$SingleOrMultiple_t} from './bindings/OpaqueTypes';

import type {User_t as Entities_User_t} from '../src/db/Entities.gen';

import type {eventOptions as Internal_eventOptions} from 'envio/src/Internal.gen';

import type {genericContractRegisterArgs as Internal_genericContractRegisterArgs} from 'envio/src/Internal.gen';

import type {genericContractRegister as Internal_genericContractRegister} from 'envio/src/Internal.gen';

import type {genericEvent as Internal_genericEvent} from 'envio/src/Internal.gen';

import type {genericHandlerArgs as Internal_genericHandlerArgs} from 'envio/src/Internal.gen';

import type {genericHandler as Internal_genericHandler} from 'envio/src/Internal.gen';

import type {logger as Envio_logger} from 'envio/src/Envio.gen';

import type {t as Address_t} from 'envio/src/Address.gen';

export type id = string;
export type Id = id;

export type contractRegistrations = {
  readonly log: Envio_logger; 
  readonly addMarketFactory: (_1:Address_t) => void; 
  readonly addOracle: (_1:Address_t) => void; 
  readonly addPredictionMarket: (_1:Address_t) => void; 
  readonly addReputationSystem: (_1:Address_t) => void
};

export type entityHandlerContext<entity,indexedFieldOperations> = {
  readonly get: (_1:id) => Promise<(undefined | entity)>; 
  readonly getOrThrow: (_1:id, message:(undefined | string)) => Promise<entity>; 
  readonly getWhere: indexedFieldOperations; 
  readonly getOrCreate: (_1:entity) => Promise<entity>; 
  readonly set: (_1:entity) => void; 
  readonly deleteUnsafe: (_1:id) => void
};

export type handlerContext = $$handlerContext;

export type globalStats = Entities_GlobalStats_t;
export type GlobalStats = globalStats;

export type market = Entities_Market_t;
export type Market = market;

export type marketFactory_OwnershipTransferred = Entities_MarketFactory_OwnershipTransferred_t;
export type MarketFactory_OwnershipTransferred = marketFactory_OwnershipTransferred;

export type prediction = Entities_Prediction_t;
export type Prediction = prediction;

export type predictionMarket_MarketCreated = Entities_PredictionMarket_MarketCreated_t;
export type PredictionMarket_MarketCreated = predictionMarket_MarketCreated;

export type predictionMarket_MarketResolved = Entities_PredictionMarket_MarketResolved_t;
export type PredictionMarket_MarketResolved = predictionMarket_MarketResolved;

export type predictionMarket_PayoutClaimed = Entities_PredictionMarket_PayoutClaimed_t;
export type PredictionMarket_PayoutClaimed = predictionMarket_PayoutClaimed;

export type predictionMarket_PredictionMade = Entities_PredictionMarket_PredictionMade_t;
export type PredictionMarket_PredictionMade = predictionMarket_PredictionMade;

export type reputationSystem_ReputationUpdated = Entities_ReputationSystem_ReputationUpdated_t;
export type ReputationSystem_ReputationUpdated = reputationSystem_ReputationUpdated;

export type reputationSystem_UsernameSet = Entities_ReputationSystem_UsernameSet_t;
export type ReputationSystem_UsernameSet = reputationSystem_UsernameSet;

export type user = Entities_User_t;
export type User = user;

export type eventIdentifier = {
  readonly chainId: number; 
  readonly blockTimestamp: number; 
  readonly blockNumber: number; 
  readonly logIndex: number
};

export type entityUpdateAction<entityType> = "Delete" | { TAG: "Set"; _0: entityType };

export type entityUpdate<entityType> = {
  readonly eventIdentifier: eventIdentifier; 
  readonly entityId: id; 
  readonly entityUpdateAction: entityUpdateAction<entityType>
};

export type entityValueAtStartOfBatch<entityType> = 
    "NotSet"
  | { TAG: "AlreadySet"; _0: entityType };

export type updatedValue<entityType> = {
  readonly latest: entityUpdate<entityType>; 
  readonly history: entityUpdate<entityType>[]; 
  readonly containsRollbackDiffChange: boolean
};

export type inMemoryStoreRowEntity<entityType> = 
    { TAG: "Updated"; _0: updatedValue<entityType> }
  | { TAG: "InitialReadFromDb"; _0: entityValueAtStartOfBatch<entityType> };

export type Transaction_t = {};

export type Block_t = {
  readonly number: number; 
  readonly timestamp: number; 
  readonly hash: string
};

export type AggregatedBlock_t = {
  readonly hash: string; 
  readonly number: number; 
  readonly timestamp: number
};

export type AggregatedTransaction_t = {};

export type eventLog<params> = Internal_genericEvent<params,Block_t,Transaction_t>;
export type EventLog<params> = eventLog<params>;

export type SingleOrMultiple_t<a> = $$SingleOrMultiple_t<a>;

export type HandlerTypes_args<eventArgs,context> = { readonly event: eventLog<eventArgs>; readonly context: context };

export type HandlerTypes_contractRegisterArgs<eventArgs> = Internal_genericContractRegisterArgs<eventLog<eventArgs>,contractRegistrations>;

export type HandlerTypes_contractRegister<eventArgs> = Internal_genericContractRegister<HandlerTypes_contractRegisterArgs<eventArgs>>;

export type HandlerTypes_eventConfig<eventFilters> = Internal_eventOptions<eventFilters>;

export type fnWithEventConfig<fn,eventConfig> = $$fnWithEventConfig<fn,eventConfig>;

export type contractRegisterWithOptions<eventArgs,eventFilters> = fnWithEventConfig<HandlerTypes_contractRegister<eventArgs>,HandlerTypes_eventConfig<eventFilters>>;

export type MarketFactory_chainId = 84532;

export type MarketFactory_OwnershipTransferred_eventArgs = { readonly previousOwner: Address_t; readonly newOwner: Address_t };

export type MarketFactory_OwnershipTransferred_block = Block_t;

export type MarketFactory_OwnershipTransferred_transaction = Transaction_t;

export type MarketFactory_OwnershipTransferred_event = {
  /** The parameters or arguments associated with this event. */
  readonly params: MarketFactory_OwnershipTransferred_eventArgs; 
  /** The unique identifier of the blockchain network where this event occurred. */
  readonly chainId: MarketFactory_chainId; 
  /** The address of the contract that emitted this event. */
  readonly srcAddress: Address_t; 
  /** The index of this event's log within the block. */
  readonly logIndex: number; 
  /** The transaction that triggered this event. Configurable in `config.yaml` via the `field_selection` option. */
  readonly transaction: MarketFactory_OwnershipTransferred_transaction; 
  /** The block in which this event was recorded. Configurable in `config.yaml` via the `field_selection` option. */
  readonly block: MarketFactory_OwnershipTransferred_block
};

export type MarketFactory_OwnershipTransferred_handlerArgs = Internal_genericHandlerArgs<MarketFactory_OwnershipTransferred_event,handlerContext,void>;

export type MarketFactory_OwnershipTransferred_handler = Internal_genericHandler<MarketFactory_OwnershipTransferred_handlerArgs>;

export type MarketFactory_OwnershipTransferred_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<MarketFactory_OwnershipTransferred_event,contractRegistrations>>;

export type MarketFactory_OwnershipTransferred_eventFilter = { readonly previousOwner?: SingleOrMultiple_t<Address_t>; readonly newOwner?: SingleOrMultiple_t<Address_t> };

export type MarketFactory_OwnershipTransferred_eventFiltersArgs = { 
/** The unique identifier of the blockchain network where this event occurred. */
readonly chainId: MarketFactory_chainId; 
/** Addresses of the contracts indexing the event. */
readonly addresses: Address_t[] };

export type MarketFactory_OwnershipTransferred_eventFiltersDefinition = 
    MarketFactory_OwnershipTransferred_eventFilter
  | MarketFactory_OwnershipTransferred_eventFilter[];

export type MarketFactory_OwnershipTransferred_eventFilters = 
    MarketFactory_OwnershipTransferred_eventFilter
  | MarketFactory_OwnershipTransferred_eventFilter[]
  | ((_1:MarketFactory_OwnershipTransferred_eventFiltersArgs) => MarketFactory_OwnershipTransferred_eventFiltersDefinition);

export type Oracle_chainId = 84532;

export type Oracle_MarketResolved_eventArgs = {
  readonly marketId: bigint; 
  readonly outcome: bigint; 
  readonly resolver: Address_t
};

export type Oracle_MarketResolved_block = Block_t;

export type Oracle_MarketResolved_transaction = Transaction_t;

export type Oracle_MarketResolved_event = {
  /** The parameters or arguments associated with this event. */
  readonly params: Oracle_MarketResolved_eventArgs; 
  /** The unique identifier of the blockchain network where this event occurred. */
  readonly chainId: Oracle_chainId; 
  /** The address of the contract that emitted this event. */
  readonly srcAddress: Address_t; 
  /** The index of this event's log within the block. */
  readonly logIndex: number; 
  /** The transaction that triggered this event. Configurable in `config.yaml` via the `field_selection` option. */
  readonly transaction: Oracle_MarketResolved_transaction; 
  /** The block in which this event was recorded. Configurable in `config.yaml` via the `field_selection` option. */
  readonly block: Oracle_MarketResolved_block
};

export type Oracle_MarketResolved_handlerArgs = Internal_genericHandlerArgs<Oracle_MarketResolved_event,handlerContext,void>;

export type Oracle_MarketResolved_handler = Internal_genericHandler<Oracle_MarketResolved_handlerArgs>;

export type Oracle_MarketResolved_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<Oracle_MarketResolved_event,contractRegistrations>>;

export type Oracle_MarketResolved_eventFilter = { readonly marketId?: SingleOrMultiple_t<bigint>; readonly resolver?: SingleOrMultiple_t<Address_t> };

export type Oracle_MarketResolved_eventFiltersArgs = { 
/** The unique identifier of the blockchain network where this event occurred. */
readonly chainId: Oracle_chainId; 
/** Addresses of the contracts indexing the event. */
readonly addresses: Address_t[] };

export type Oracle_MarketResolved_eventFiltersDefinition = 
    Oracle_MarketResolved_eventFilter
  | Oracle_MarketResolved_eventFilter[];

export type Oracle_MarketResolved_eventFilters = 
    Oracle_MarketResolved_eventFilter
  | Oracle_MarketResolved_eventFilter[]
  | ((_1:Oracle_MarketResolved_eventFiltersArgs) => Oracle_MarketResolved_eventFiltersDefinition);

export type PredictionMarket_chainId = 84532;

export type PredictionMarket_MarketCreated_eventArgs = {
  readonly marketId: bigint; 
  readonly creator: Address_t; 
  readonly question: string; 
  readonly category: string; 
  readonly endTime: bigint
};

export type PredictionMarket_MarketCreated_block = Block_t;

export type PredictionMarket_MarketCreated_transaction = Transaction_t;

export type PredictionMarket_MarketCreated_event = {
  /** The parameters or arguments associated with this event. */
  readonly params: PredictionMarket_MarketCreated_eventArgs; 
  /** The unique identifier of the blockchain network where this event occurred. */
  readonly chainId: PredictionMarket_chainId; 
  /** The address of the contract that emitted this event. */
  readonly srcAddress: Address_t; 
  /** The index of this event's log within the block. */
  readonly logIndex: number; 
  /** The transaction that triggered this event. Configurable in `config.yaml` via the `field_selection` option. */
  readonly transaction: PredictionMarket_MarketCreated_transaction; 
  /** The block in which this event was recorded. Configurable in `config.yaml` via the `field_selection` option. */
  readonly block: PredictionMarket_MarketCreated_block
};

export type PredictionMarket_MarketCreated_handlerArgs = Internal_genericHandlerArgs<PredictionMarket_MarketCreated_event,handlerContext,void>;

export type PredictionMarket_MarketCreated_handler = Internal_genericHandler<PredictionMarket_MarketCreated_handlerArgs>;

export type PredictionMarket_MarketCreated_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<PredictionMarket_MarketCreated_event,contractRegistrations>>;

export type PredictionMarket_MarketCreated_eventFilter = { readonly marketId?: SingleOrMultiple_t<bigint>; readonly creator?: SingleOrMultiple_t<Address_t> };

export type PredictionMarket_MarketCreated_eventFiltersArgs = { 
/** The unique identifier of the blockchain network where this event occurred. */
readonly chainId: PredictionMarket_chainId; 
/** Addresses of the contracts indexing the event. */
readonly addresses: Address_t[] };

export type PredictionMarket_MarketCreated_eventFiltersDefinition = 
    PredictionMarket_MarketCreated_eventFilter
  | PredictionMarket_MarketCreated_eventFilter[];

export type PredictionMarket_MarketCreated_eventFilters = 
    PredictionMarket_MarketCreated_eventFilter
  | PredictionMarket_MarketCreated_eventFilter[]
  | ((_1:PredictionMarket_MarketCreated_eventFiltersArgs) => PredictionMarket_MarketCreated_eventFiltersDefinition);

export type PredictionMarket_PredictionMade_eventArgs = {
  readonly marketId: bigint; 
  readonly user: Address_t; 
  readonly side: bigint; 
  readonly outcomeIndex: bigint; 
  readonly amount: bigint
};

export type PredictionMarket_PredictionMade_block = Block_t;

export type PredictionMarket_PredictionMade_transaction = Transaction_t;

export type PredictionMarket_PredictionMade_event = {
  /** The parameters or arguments associated with this event. */
  readonly params: PredictionMarket_PredictionMade_eventArgs; 
  /** The unique identifier of the blockchain network where this event occurred. */
  readonly chainId: PredictionMarket_chainId; 
  /** The address of the contract that emitted this event. */
  readonly srcAddress: Address_t; 
  /** The index of this event's log within the block. */
  readonly logIndex: number; 
  /** The transaction that triggered this event. Configurable in `config.yaml` via the `field_selection` option. */
  readonly transaction: PredictionMarket_PredictionMade_transaction; 
  /** The block in which this event was recorded. Configurable in `config.yaml` via the `field_selection` option. */
  readonly block: PredictionMarket_PredictionMade_block
};

export type PredictionMarket_PredictionMade_handlerArgs = Internal_genericHandlerArgs<PredictionMarket_PredictionMade_event,handlerContext,void>;

export type PredictionMarket_PredictionMade_handler = Internal_genericHandler<PredictionMarket_PredictionMade_handlerArgs>;

export type PredictionMarket_PredictionMade_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<PredictionMarket_PredictionMade_event,contractRegistrations>>;

export type PredictionMarket_PredictionMade_eventFilter = { readonly marketId?: SingleOrMultiple_t<bigint>; readonly user?: SingleOrMultiple_t<Address_t> };

export type PredictionMarket_PredictionMade_eventFiltersArgs = { 
/** The unique identifier of the blockchain network where this event occurred. */
readonly chainId: PredictionMarket_chainId; 
/** Addresses of the contracts indexing the event. */
readonly addresses: Address_t[] };

export type PredictionMarket_PredictionMade_eventFiltersDefinition = 
    PredictionMarket_PredictionMade_eventFilter
  | PredictionMarket_PredictionMade_eventFilter[];

export type PredictionMarket_PredictionMade_eventFilters = 
    PredictionMarket_PredictionMade_eventFilter
  | PredictionMarket_PredictionMade_eventFilter[]
  | ((_1:PredictionMarket_PredictionMade_eventFiltersArgs) => PredictionMarket_PredictionMade_eventFiltersDefinition);

export type PredictionMarket_MarketResolved_eventArgs = {
  readonly marketId: bigint; 
  readonly winningOutcome: bigint; 
  readonly winningOutcomeIndex: bigint; 
  readonly totalPayout: bigint
};

export type PredictionMarket_MarketResolved_block = Block_t;

export type PredictionMarket_MarketResolved_transaction = Transaction_t;

export type PredictionMarket_MarketResolved_event = {
  /** The parameters or arguments associated with this event. */
  readonly params: PredictionMarket_MarketResolved_eventArgs; 
  /** The unique identifier of the blockchain network where this event occurred. */
  readonly chainId: PredictionMarket_chainId; 
  /** The address of the contract that emitted this event. */
  readonly srcAddress: Address_t; 
  /** The index of this event's log within the block. */
  readonly logIndex: number; 
  /** The transaction that triggered this event. Configurable in `config.yaml` via the `field_selection` option. */
  readonly transaction: PredictionMarket_MarketResolved_transaction; 
  /** The block in which this event was recorded. Configurable in `config.yaml` via the `field_selection` option. */
  readonly block: PredictionMarket_MarketResolved_block
};

export type PredictionMarket_MarketResolved_handlerArgs = Internal_genericHandlerArgs<PredictionMarket_MarketResolved_event,handlerContext,void>;

export type PredictionMarket_MarketResolved_handler = Internal_genericHandler<PredictionMarket_MarketResolved_handlerArgs>;

export type PredictionMarket_MarketResolved_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<PredictionMarket_MarketResolved_event,contractRegistrations>>;

export type PredictionMarket_MarketResolved_eventFilter = { readonly marketId?: SingleOrMultiple_t<bigint> };

export type PredictionMarket_MarketResolved_eventFiltersArgs = { 
/** The unique identifier of the blockchain network where this event occurred. */
readonly chainId: PredictionMarket_chainId; 
/** Addresses of the contracts indexing the event. */
readonly addresses: Address_t[] };

export type PredictionMarket_MarketResolved_eventFiltersDefinition = 
    PredictionMarket_MarketResolved_eventFilter
  | PredictionMarket_MarketResolved_eventFilter[];

export type PredictionMarket_MarketResolved_eventFilters = 
    PredictionMarket_MarketResolved_eventFilter
  | PredictionMarket_MarketResolved_eventFilter[]
  | ((_1:PredictionMarket_MarketResolved_eventFiltersArgs) => PredictionMarket_MarketResolved_eventFiltersDefinition);

export type PredictionMarket_PayoutClaimed_eventArgs = {
  readonly marketId: bigint; 
  readonly user: Address_t; 
  readonly amount: bigint
};

export type PredictionMarket_PayoutClaimed_block = Block_t;

export type PredictionMarket_PayoutClaimed_transaction = Transaction_t;

export type PredictionMarket_PayoutClaimed_event = {
  /** The parameters or arguments associated with this event. */
  readonly params: PredictionMarket_PayoutClaimed_eventArgs; 
  /** The unique identifier of the blockchain network where this event occurred. */
  readonly chainId: PredictionMarket_chainId; 
  /** The address of the contract that emitted this event. */
  readonly srcAddress: Address_t; 
  /** The index of this event's log within the block. */
  readonly logIndex: number; 
  /** The transaction that triggered this event. Configurable in `config.yaml` via the `field_selection` option. */
  readonly transaction: PredictionMarket_PayoutClaimed_transaction; 
  /** The block in which this event was recorded. Configurable in `config.yaml` via the `field_selection` option. */
  readonly block: PredictionMarket_PayoutClaimed_block
};

export type PredictionMarket_PayoutClaimed_handlerArgs = Internal_genericHandlerArgs<PredictionMarket_PayoutClaimed_event,handlerContext,void>;

export type PredictionMarket_PayoutClaimed_handler = Internal_genericHandler<PredictionMarket_PayoutClaimed_handlerArgs>;

export type PredictionMarket_PayoutClaimed_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<PredictionMarket_PayoutClaimed_event,contractRegistrations>>;

export type PredictionMarket_PayoutClaimed_eventFilter = { readonly marketId?: SingleOrMultiple_t<bigint>; readonly user?: SingleOrMultiple_t<Address_t> };

export type PredictionMarket_PayoutClaimed_eventFiltersArgs = { 
/** The unique identifier of the blockchain network where this event occurred. */
readonly chainId: PredictionMarket_chainId; 
/** Addresses of the contracts indexing the event. */
readonly addresses: Address_t[] };

export type PredictionMarket_PayoutClaimed_eventFiltersDefinition = 
    PredictionMarket_PayoutClaimed_eventFilter
  | PredictionMarket_PayoutClaimed_eventFilter[];

export type PredictionMarket_PayoutClaimed_eventFilters = 
    PredictionMarket_PayoutClaimed_eventFilter
  | PredictionMarket_PayoutClaimed_eventFilter[]
  | ((_1:PredictionMarket_PayoutClaimed_eventFiltersArgs) => PredictionMarket_PayoutClaimed_eventFiltersDefinition);

export type ReputationSystem_chainId = 84532;

export type ReputationSystem_ReputationUpdated_eventArgs = {
  readonly user: Address_t; 
  readonly newScore: bigint; 
  readonly streak: bigint
};

export type ReputationSystem_ReputationUpdated_block = Block_t;

export type ReputationSystem_ReputationUpdated_transaction = Transaction_t;

export type ReputationSystem_ReputationUpdated_event = {
  /** The parameters or arguments associated with this event. */
  readonly params: ReputationSystem_ReputationUpdated_eventArgs; 
  /** The unique identifier of the blockchain network where this event occurred. */
  readonly chainId: ReputationSystem_chainId; 
  /** The address of the contract that emitted this event. */
  readonly srcAddress: Address_t; 
  /** The index of this event's log within the block. */
  readonly logIndex: number; 
  /** The transaction that triggered this event. Configurable in `config.yaml` via the `field_selection` option. */
  readonly transaction: ReputationSystem_ReputationUpdated_transaction; 
  /** The block in which this event was recorded. Configurable in `config.yaml` via the `field_selection` option. */
  readonly block: ReputationSystem_ReputationUpdated_block
};

export type ReputationSystem_ReputationUpdated_handlerArgs = Internal_genericHandlerArgs<ReputationSystem_ReputationUpdated_event,handlerContext,void>;

export type ReputationSystem_ReputationUpdated_handler = Internal_genericHandler<ReputationSystem_ReputationUpdated_handlerArgs>;

export type ReputationSystem_ReputationUpdated_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<ReputationSystem_ReputationUpdated_event,contractRegistrations>>;

export type ReputationSystem_ReputationUpdated_eventFilter = { readonly user?: SingleOrMultiple_t<Address_t> };

export type ReputationSystem_ReputationUpdated_eventFiltersArgs = { 
/** The unique identifier of the blockchain network where this event occurred. */
readonly chainId: ReputationSystem_chainId; 
/** Addresses of the contracts indexing the event. */
readonly addresses: Address_t[] };

export type ReputationSystem_ReputationUpdated_eventFiltersDefinition = 
    ReputationSystem_ReputationUpdated_eventFilter
  | ReputationSystem_ReputationUpdated_eventFilter[];

export type ReputationSystem_ReputationUpdated_eventFilters = 
    ReputationSystem_ReputationUpdated_eventFilter
  | ReputationSystem_ReputationUpdated_eventFilter[]
  | ((_1:ReputationSystem_ReputationUpdated_eventFiltersArgs) => ReputationSystem_ReputationUpdated_eventFiltersDefinition);

export type ReputationSystem_UsernameSet_eventArgs = { readonly user: Address_t; readonly username: string };

export type ReputationSystem_UsernameSet_block = Block_t;

export type ReputationSystem_UsernameSet_transaction = Transaction_t;

export type ReputationSystem_UsernameSet_event = {
  /** The parameters or arguments associated with this event. */
  readonly params: ReputationSystem_UsernameSet_eventArgs; 
  /** The unique identifier of the blockchain network where this event occurred. */
  readonly chainId: ReputationSystem_chainId; 
  /** The address of the contract that emitted this event. */
  readonly srcAddress: Address_t; 
  /** The index of this event's log within the block. */
  readonly logIndex: number; 
  /** The transaction that triggered this event. Configurable in `config.yaml` via the `field_selection` option. */
  readonly transaction: ReputationSystem_UsernameSet_transaction; 
  /** The block in which this event was recorded. Configurable in `config.yaml` via the `field_selection` option. */
  readonly block: ReputationSystem_UsernameSet_block
};

export type ReputationSystem_UsernameSet_handlerArgs = Internal_genericHandlerArgs<ReputationSystem_UsernameSet_event,handlerContext,void>;

export type ReputationSystem_UsernameSet_handler = Internal_genericHandler<ReputationSystem_UsernameSet_handlerArgs>;

export type ReputationSystem_UsernameSet_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<ReputationSystem_UsernameSet_event,contractRegistrations>>;

export type ReputationSystem_UsernameSet_eventFilter = { readonly user?: SingleOrMultiple_t<Address_t> };

export type ReputationSystem_UsernameSet_eventFiltersArgs = { 
/** The unique identifier of the blockchain network where this event occurred. */
readonly chainId: ReputationSystem_chainId; 
/** Addresses of the contracts indexing the event. */
readonly addresses: Address_t[] };

export type ReputationSystem_UsernameSet_eventFiltersDefinition = 
    ReputationSystem_UsernameSet_eventFilter
  | ReputationSystem_UsernameSet_eventFilter[];

export type ReputationSystem_UsernameSet_eventFilters = 
    ReputationSystem_UsernameSet_eventFilter
  | ReputationSystem_UsernameSet_eventFilter[]
  | ((_1:ReputationSystem_UsernameSet_eventFiltersArgs) => ReputationSystem_UsernameSet_eventFiltersDefinition);

export type chainId = number;

export type chain = 84532;
