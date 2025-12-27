// This file is to dynamically generate TS types
// which we can't get using GenType
// Use @genType.import to link the types back to ReScript code

import type { Logger, EffectCaller } from "envio";
import type * as Entities from "./db/Entities.gen.ts";

export type HandlerContext = {
  /**
   * Access the logger instance with event as a context. The logs will be displayed in the console and Envio Hosted Service.
   */
  readonly log: Logger;
  /**
   * Call the provided Effect with the given input.
   * Effects are the best for external calls with automatic deduplication, error handling and caching.
   * Define a new Effect using createEffect outside of the handler.
   */
  readonly effect: EffectCaller;
  /**
   * True when the handlers run in preload mode - in parallel for the whole batch.
   * Handlers run twice per batch of events, and the first time is the "preload" run
   * During preload entities aren't set, logs are ignored and exceptions are silently swallowed.
   * Preload mode is the best time to populate data to in-memory cache.
   * After preload the handler will run for the second time in sequential order of events.
   */
  readonly isPreload: boolean;
  readonly GlobalStats: {
    /**
     * Load the entity GlobalStats from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.GlobalStats_t | undefined>,
    /**
     * Load the entity GlobalStats from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.GlobalStats_t>,
    readonly getWhere: Entities.GlobalStats_indexedFieldOperations,
    /**
     * Returns the entity GlobalStats from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.GlobalStats_t) => Promise<Entities.GlobalStats_t>,
    /**
     * Set the entity GlobalStats in the storage.
     */
    readonly set: (entity: Entities.GlobalStats_t) => void,
    /**
     * Delete the entity GlobalStats from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly Market: {
    /**
     * Load the entity Market from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.Market_t | undefined>,
    /**
     * Load the entity Market from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.Market_t>,
    readonly getWhere: Entities.Market_indexedFieldOperations,
    /**
     * Returns the entity Market from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.Market_t) => Promise<Entities.Market_t>,
    /**
     * Set the entity Market in the storage.
     */
    readonly set: (entity: Entities.Market_t) => void,
    /**
     * Delete the entity Market from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly MarketFactory_OwnershipTransferred: {
    /**
     * Load the entity MarketFactory_OwnershipTransferred from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.MarketFactory_OwnershipTransferred_t | undefined>,
    /**
     * Load the entity MarketFactory_OwnershipTransferred from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.MarketFactory_OwnershipTransferred_t>,
    readonly getWhere: Entities.MarketFactory_OwnershipTransferred_indexedFieldOperations,
    /**
     * Returns the entity MarketFactory_OwnershipTransferred from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.MarketFactory_OwnershipTransferred_t) => Promise<Entities.MarketFactory_OwnershipTransferred_t>,
    /**
     * Set the entity MarketFactory_OwnershipTransferred in the storage.
     */
    readonly set: (entity: Entities.MarketFactory_OwnershipTransferred_t) => void,
    /**
     * Delete the entity MarketFactory_OwnershipTransferred from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly Prediction: {
    /**
     * Load the entity Prediction from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.Prediction_t | undefined>,
    /**
     * Load the entity Prediction from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.Prediction_t>,
    readonly getWhere: Entities.Prediction_indexedFieldOperations,
    /**
     * Returns the entity Prediction from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.Prediction_t) => Promise<Entities.Prediction_t>,
    /**
     * Set the entity Prediction in the storage.
     */
    readonly set: (entity: Entities.Prediction_t) => void,
    /**
     * Delete the entity Prediction from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly PredictionMarket_MarketCreated: {
    /**
     * Load the entity PredictionMarket_MarketCreated from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.PredictionMarket_MarketCreated_t | undefined>,
    /**
     * Load the entity PredictionMarket_MarketCreated from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.PredictionMarket_MarketCreated_t>,
    readonly getWhere: Entities.PredictionMarket_MarketCreated_indexedFieldOperations,
    /**
     * Returns the entity PredictionMarket_MarketCreated from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.PredictionMarket_MarketCreated_t) => Promise<Entities.PredictionMarket_MarketCreated_t>,
    /**
     * Set the entity PredictionMarket_MarketCreated in the storage.
     */
    readonly set: (entity: Entities.PredictionMarket_MarketCreated_t) => void,
    /**
     * Delete the entity PredictionMarket_MarketCreated from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly PredictionMarket_MarketResolved: {
    /**
     * Load the entity PredictionMarket_MarketResolved from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.PredictionMarket_MarketResolved_t | undefined>,
    /**
     * Load the entity PredictionMarket_MarketResolved from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.PredictionMarket_MarketResolved_t>,
    readonly getWhere: Entities.PredictionMarket_MarketResolved_indexedFieldOperations,
    /**
     * Returns the entity PredictionMarket_MarketResolved from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.PredictionMarket_MarketResolved_t) => Promise<Entities.PredictionMarket_MarketResolved_t>,
    /**
     * Set the entity PredictionMarket_MarketResolved in the storage.
     */
    readonly set: (entity: Entities.PredictionMarket_MarketResolved_t) => void,
    /**
     * Delete the entity PredictionMarket_MarketResolved from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly PredictionMarket_PayoutClaimed: {
    /**
     * Load the entity PredictionMarket_PayoutClaimed from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.PredictionMarket_PayoutClaimed_t | undefined>,
    /**
     * Load the entity PredictionMarket_PayoutClaimed from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.PredictionMarket_PayoutClaimed_t>,
    readonly getWhere: Entities.PredictionMarket_PayoutClaimed_indexedFieldOperations,
    /**
     * Returns the entity PredictionMarket_PayoutClaimed from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.PredictionMarket_PayoutClaimed_t) => Promise<Entities.PredictionMarket_PayoutClaimed_t>,
    /**
     * Set the entity PredictionMarket_PayoutClaimed in the storage.
     */
    readonly set: (entity: Entities.PredictionMarket_PayoutClaimed_t) => void,
    /**
     * Delete the entity PredictionMarket_PayoutClaimed from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly PredictionMarket_PredictionMade: {
    /**
     * Load the entity PredictionMarket_PredictionMade from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.PredictionMarket_PredictionMade_t | undefined>,
    /**
     * Load the entity PredictionMarket_PredictionMade from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.PredictionMarket_PredictionMade_t>,
    readonly getWhere: Entities.PredictionMarket_PredictionMade_indexedFieldOperations,
    /**
     * Returns the entity PredictionMarket_PredictionMade from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.PredictionMarket_PredictionMade_t) => Promise<Entities.PredictionMarket_PredictionMade_t>,
    /**
     * Set the entity PredictionMarket_PredictionMade in the storage.
     */
    readonly set: (entity: Entities.PredictionMarket_PredictionMade_t) => void,
    /**
     * Delete the entity PredictionMarket_PredictionMade from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly ReputationSystem_ReputationUpdated: {
    /**
     * Load the entity ReputationSystem_ReputationUpdated from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.ReputationSystem_ReputationUpdated_t | undefined>,
    /**
     * Load the entity ReputationSystem_ReputationUpdated from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.ReputationSystem_ReputationUpdated_t>,
    readonly getWhere: Entities.ReputationSystem_ReputationUpdated_indexedFieldOperations,
    /**
     * Returns the entity ReputationSystem_ReputationUpdated from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.ReputationSystem_ReputationUpdated_t) => Promise<Entities.ReputationSystem_ReputationUpdated_t>,
    /**
     * Set the entity ReputationSystem_ReputationUpdated in the storage.
     */
    readonly set: (entity: Entities.ReputationSystem_ReputationUpdated_t) => void,
    /**
     * Delete the entity ReputationSystem_ReputationUpdated from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly ReputationSystem_UsernameSet: {
    /**
     * Load the entity ReputationSystem_UsernameSet from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.ReputationSystem_UsernameSet_t | undefined>,
    /**
     * Load the entity ReputationSystem_UsernameSet from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.ReputationSystem_UsernameSet_t>,
    readonly getWhere: Entities.ReputationSystem_UsernameSet_indexedFieldOperations,
    /**
     * Returns the entity ReputationSystem_UsernameSet from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.ReputationSystem_UsernameSet_t) => Promise<Entities.ReputationSystem_UsernameSet_t>,
    /**
     * Set the entity ReputationSystem_UsernameSet in the storage.
     */
    readonly set: (entity: Entities.ReputationSystem_UsernameSet_t) => void,
    /**
     * Delete the entity ReputationSystem_UsernameSet from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly User: {
    /**
     * Load the entity User from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.User_t | undefined>,
    /**
     * Load the entity User from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.User_t>,
    readonly getWhere: Entities.User_indexedFieldOperations,
    /**
     * Returns the entity User from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.User_t) => Promise<Entities.User_t>,
    /**
     * Set the entity User in the storage.
     */
    readonly set: (entity: Entities.User_t) => void,
    /**
     * Delete the entity User from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
};

