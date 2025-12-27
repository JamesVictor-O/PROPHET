/* TypeScript file generated from TestHelpers.res by genType. */

/* eslint-disable */
/* tslint:disable */

const TestHelpersJS = require('./TestHelpers.res.js');

import type {MarketFactory_OwnershipTransferred_event as Types_MarketFactory_OwnershipTransferred_event} from './Types.gen';

import type {Oracle_MarketResolved_event as Types_Oracle_MarketResolved_event} from './Types.gen';

import type {PredictionMarket_MarketCreated_event as Types_PredictionMarket_MarketCreated_event} from './Types.gen';

import type {PredictionMarket_MarketResolved_event as Types_PredictionMarket_MarketResolved_event} from './Types.gen';

import type {PredictionMarket_PayoutClaimed_event as Types_PredictionMarket_PayoutClaimed_event} from './Types.gen';

import type {PredictionMarket_PredictionMade_event as Types_PredictionMarket_PredictionMade_event} from './Types.gen';

import type {ReputationSystem_ReputationUpdated_event as Types_ReputationSystem_ReputationUpdated_event} from './Types.gen';

import type {ReputationSystem_UsernameSet_event as Types_ReputationSystem_UsernameSet_event} from './Types.gen';

import type {t as Address_t} from 'envio/src/Address.gen';

import type {t as TestHelpers_MockDb_t} from './TestHelpers_MockDb.gen';

/** The arguements that get passed to a "processEvent" helper function */
export type EventFunctions_eventProcessorArgs<event> = {
  readonly event: event; 
  readonly mockDb: TestHelpers_MockDb_t; 
  readonly chainId?: number
};

export type EventFunctions_eventProcessor<event> = (_1:EventFunctions_eventProcessorArgs<event>) => Promise<TestHelpers_MockDb_t>;

export type EventFunctions_MockBlock_t = {
  readonly hash?: string; 
  readonly number?: number; 
  readonly timestamp?: number
};

export type EventFunctions_MockTransaction_t = {};

export type EventFunctions_mockEventData = {
  readonly chainId?: number; 
  readonly srcAddress?: Address_t; 
  readonly logIndex?: number; 
  readonly block?: EventFunctions_MockBlock_t; 
  readonly transaction?: EventFunctions_MockTransaction_t
};

export type MarketFactory_OwnershipTransferred_createMockArgs = {
  readonly previousOwner?: Address_t; 
  readonly newOwner?: Address_t; 
  readonly mockEventData?: EventFunctions_mockEventData
};

export type Oracle_MarketResolved_createMockArgs = {
  readonly marketId?: bigint; 
  readonly outcome?: bigint; 
  readonly resolver?: Address_t; 
  readonly mockEventData?: EventFunctions_mockEventData
};

export type PredictionMarket_MarketCreated_createMockArgs = {
  readonly marketId?: bigint; 
  readonly creator?: Address_t; 
  readonly question?: string; 
  readonly category?: string; 
  readonly endTime?: bigint; 
  readonly mockEventData?: EventFunctions_mockEventData
};

export type PredictionMarket_PredictionMade_createMockArgs = {
  readonly marketId?: bigint; 
  readonly user?: Address_t; 
  readonly side?: bigint; 
  readonly outcomeIndex?: bigint; 
  readonly amount?: bigint; 
  readonly mockEventData?: EventFunctions_mockEventData
};

export type PredictionMarket_MarketResolved_createMockArgs = {
  readonly marketId?: bigint; 
  readonly winningOutcome?: bigint; 
  readonly winningOutcomeIndex?: bigint; 
  readonly totalPayout?: bigint; 
  readonly mockEventData?: EventFunctions_mockEventData
};

export type PredictionMarket_PayoutClaimed_createMockArgs = {
  readonly marketId?: bigint; 
  readonly user?: Address_t; 
  readonly amount?: bigint; 
  readonly mockEventData?: EventFunctions_mockEventData
};

export type ReputationSystem_ReputationUpdated_createMockArgs = {
  readonly user?: Address_t; 
  readonly newScore?: bigint; 
  readonly streak?: bigint; 
  readonly mockEventData?: EventFunctions_mockEventData
};

export type ReputationSystem_UsernameSet_createMockArgs = {
  readonly user?: Address_t; 
  readonly username?: string; 
  readonly mockEventData?: EventFunctions_mockEventData
};

export const MockDb_createMockDb: () => TestHelpers_MockDb_t = TestHelpersJS.MockDb.createMockDb as any;

export const Addresses_mockAddresses: Address_t[] = TestHelpersJS.Addresses.mockAddresses as any;

export const Addresses_defaultAddress: Address_t = TestHelpersJS.Addresses.defaultAddress as any;

export const MarketFactory_OwnershipTransferred_processEvent: EventFunctions_eventProcessor<Types_MarketFactory_OwnershipTransferred_event> = TestHelpersJS.MarketFactory.OwnershipTransferred.processEvent as any;

export const MarketFactory_OwnershipTransferred_createMockEvent: (args:MarketFactory_OwnershipTransferred_createMockArgs) => Types_MarketFactory_OwnershipTransferred_event = TestHelpersJS.MarketFactory.OwnershipTransferred.createMockEvent as any;

export const Oracle_MarketResolved_processEvent: EventFunctions_eventProcessor<Types_Oracle_MarketResolved_event> = TestHelpersJS.Oracle.MarketResolved.processEvent as any;

export const Oracle_MarketResolved_createMockEvent: (args:Oracle_MarketResolved_createMockArgs) => Types_Oracle_MarketResolved_event = TestHelpersJS.Oracle.MarketResolved.createMockEvent as any;

export const PredictionMarket_MarketCreated_processEvent: EventFunctions_eventProcessor<Types_PredictionMarket_MarketCreated_event> = TestHelpersJS.PredictionMarket.MarketCreated.processEvent as any;

export const PredictionMarket_MarketCreated_createMockEvent: (args:PredictionMarket_MarketCreated_createMockArgs) => Types_PredictionMarket_MarketCreated_event = TestHelpersJS.PredictionMarket.MarketCreated.createMockEvent as any;

export const PredictionMarket_PredictionMade_processEvent: EventFunctions_eventProcessor<Types_PredictionMarket_PredictionMade_event> = TestHelpersJS.PredictionMarket.PredictionMade.processEvent as any;

export const PredictionMarket_PredictionMade_createMockEvent: (args:PredictionMarket_PredictionMade_createMockArgs) => Types_PredictionMarket_PredictionMade_event = TestHelpersJS.PredictionMarket.PredictionMade.createMockEvent as any;

export const PredictionMarket_MarketResolved_processEvent: EventFunctions_eventProcessor<Types_PredictionMarket_MarketResolved_event> = TestHelpersJS.PredictionMarket.MarketResolved.processEvent as any;

export const PredictionMarket_MarketResolved_createMockEvent: (args:PredictionMarket_MarketResolved_createMockArgs) => Types_PredictionMarket_MarketResolved_event = TestHelpersJS.PredictionMarket.MarketResolved.createMockEvent as any;

export const PredictionMarket_PayoutClaimed_processEvent: EventFunctions_eventProcessor<Types_PredictionMarket_PayoutClaimed_event> = TestHelpersJS.PredictionMarket.PayoutClaimed.processEvent as any;

export const PredictionMarket_PayoutClaimed_createMockEvent: (args:PredictionMarket_PayoutClaimed_createMockArgs) => Types_PredictionMarket_PayoutClaimed_event = TestHelpersJS.PredictionMarket.PayoutClaimed.createMockEvent as any;

export const ReputationSystem_ReputationUpdated_processEvent: EventFunctions_eventProcessor<Types_ReputationSystem_ReputationUpdated_event> = TestHelpersJS.ReputationSystem.ReputationUpdated.processEvent as any;

export const ReputationSystem_ReputationUpdated_createMockEvent: (args:ReputationSystem_ReputationUpdated_createMockArgs) => Types_ReputationSystem_ReputationUpdated_event = TestHelpersJS.ReputationSystem.ReputationUpdated.createMockEvent as any;

export const ReputationSystem_UsernameSet_processEvent: EventFunctions_eventProcessor<Types_ReputationSystem_UsernameSet_event> = TestHelpersJS.ReputationSystem.UsernameSet.processEvent as any;

export const ReputationSystem_UsernameSet_createMockEvent: (args:ReputationSystem_UsernameSet_createMockArgs) => Types_ReputationSystem_UsernameSet_event = TestHelpersJS.ReputationSystem.UsernameSet.createMockEvent as any;

export const MarketFactory: { OwnershipTransferred: { processEvent: EventFunctions_eventProcessor<Types_MarketFactory_OwnershipTransferred_event>; createMockEvent: (args:MarketFactory_OwnershipTransferred_createMockArgs) => Types_MarketFactory_OwnershipTransferred_event } } = TestHelpersJS.MarketFactory as any;

export const Oracle: { MarketResolved: { processEvent: EventFunctions_eventProcessor<Types_Oracle_MarketResolved_event>; createMockEvent: (args:Oracle_MarketResolved_createMockArgs) => Types_Oracle_MarketResolved_event } } = TestHelpersJS.Oracle as any;

export const Addresses: { mockAddresses: Address_t[]; defaultAddress: Address_t } = TestHelpersJS.Addresses as any;

export const ReputationSystem: { UsernameSet: { processEvent: EventFunctions_eventProcessor<Types_ReputationSystem_UsernameSet_event>; createMockEvent: (args:ReputationSystem_UsernameSet_createMockArgs) => Types_ReputationSystem_UsernameSet_event }; ReputationUpdated: { processEvent: EventFunctions_eventProcessor<Types_ReputationSystem_ReputationUpdated_event>; createMockEvent: (args:ReputationSystem_ReputationUpdated_createMockArgs) => Types_ReputationSystem_ReputationUpdated_event } } = TestHelpersJS.ReputationSystem as any;

export const PredictionMarket: {
  MarketResolved: {
    processEvent: EventFunctions_eventProcessor<Types_PredictionMarket_MarketResolved_event>; 
    createMockEvent: (args:PredictionMarket_MarketResolved_createMockArgs) => Types_PredictionMarket_MarketResolved_event
  }; 
  PredictionMade: {
    processEvent: EventFunctions_eventProcessor<Types_PredictionMarket_PredictionMade_event>; 
    createMockEvent: (args:PredictionMarket_PredictionMade_createMockArgs) => Types_PredictionMarket_PredictionMade_event
  }; 
  MarketCreated: {
    processEvent: EventFunctions_eventProcessor<Types_PredictionMarket_MarketCreated_event>; 
    createMockEvent: (args:PredictionMarket_MarketCreated_createMockArgs) => Types_PredictionMarket_MarketCreated_event
  }; 
  PayoutClaimed: {
    processEvent: EventFunctions_eventProcessor<Types_PredictionMarket_PayoutClaimed_event>; 
    createMockEvent: (args:PredictionMarket_PayoutClaimed_createMockArgs) => Types_PredictionMarket_PayoutClaimed_event
  }
} = TestHelpersJS.PredictionMarket as any;

export const MockDb: { createMockDb: () => TestHelpers_MockDb_t } = TestHelpersJS.MockDb as any;
