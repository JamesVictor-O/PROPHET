// ─────────────────────────────────────────────────────────────────────────────
// Prophet Oracle Agent
//
// Lifecycle:
//   1. On startup: scan all markets in PendingResolution / Challenged state
//   2. Listen for ResolutionTriggered events → call 0G Compute → post verdict
//   3. Listen for ResolutionChallenged events → run second inference → process
//   4. Listen for ResolutionFinalized events → reveal positions via PositionVault
//
// 0G integrations:
//   - 0G Chain:   reads market state, submits postResolution / revealPositions
//   - 0G Compute: DeepSeek V3 (mainnet) / Qwen 7B (testnet) for oracle inference
//   - 0G Storage: writes reasoning chain permanently to Log layer
//                 verdictReasoningHash on-chain points here for verifiability
// ─────────────────────────────────────────────────────────────────────────────

import "dotenv/config";
import nacl                    from "tweetnacl";
import { decodeBase64, decodeUTF8 } from "tweetnacl-util";
import { ethers }              from "ethers";
import { createLogger }        from "../shared/logger";
import { createProvider, createWallet, getFactory, getMarket, getVault,
         listenForEvent, getMarketInfo, getAllActiveMarkets,
         postResolutionOnChain, cancelMarketOnChain,
         processChallengeOnChain, revealPositionsOnChain } from "../shared/chain";
import { callOracleInference }  from "../shared/compute";
import { writeResolutionRecord, writeOracleWorkingState, readFromStorage } from "../shared/storage";
import type { OracleResponse }  from "../shared/types";

const logger = createLogger("oracle");

// ── Resolve a market ──────────────────────────────────────────────────────────

/**
 * Full oracle resolution flow for a single market:
 *   1. Read market metadata from chain
 *   2. Update working state in 0G Storage
 *   3. Call 0G Compute (DeepSeek/Qwen) for inference
 *   4. Write reasoning to 0G Storage (permanent, immutable)
 *   5. Post verdict on-chain — verdictReasoningHash links to 0G Storage
 *   6. On INCONCLUSIVE: cancel market (refunds all bettors)
 */
async function resolveMarket(
  marketAddress: string,
  oracleWallet:  ReturnType<typeof createWallet>,
  provider:      ReturnType<typeof createProvider>,
  isChallenge:   boolean = false
): Promise<void> {
  logger.info(`${isChallenge ? "Challenge resolution" : "Resolution"} started`, {
    market: marketAddress,
  });

  // 1. Read market state
  const info = await getMarketInfo(marketAddress, provider);

  logger.info("Market info", {
    question:        info.question,
    deadline:        new Date(info.deadline * 1000).toISOString(),
    totalCollateral: ethers.formatUnits(info.totalCollateral, 6) + " USDT",
  });

  // 2. Update oracle working state in 0G Storage
  await writeOracleWorkingState(marketAddress, {
    stage:            "gathering",
    evidenceGathered: [],
    sourcesChecked:   [],
    startedAt:        Date.now(),
  }, oracleWallet).catch((e) => logger.warn("Storage write failed (non-fatal)", e));

  // 3. Read approved sources from 0G Storage using resolutionSourcesHash
  //    This hash was written by the frontend at market creation and stored on-chain
  let sources: string[] = [];
  const zeroHash = `0x${"0".repeat(64)}`;
  if (info.resolutionSourcesHash && info.resolutionSourcesHash !== zeroHash) {
    try {
      const metadata = await readFromStorage<{ sources?: string[] }>(info.resolutionSourcesHash);
      sources = metadata.sources ?? [];
      logger.info("Loaded resolution sources from 0G Storage", {
        count: sources.length,
        hash:  info.resolutionSourcesHash,
      });
    } catch (err) {
      logger.warn("Could not read sources from 0G Storage (continuing without)", err);
    }
  }

  // 4. Call 0G Compute — question + deadline + approved sources → verdict
  const minConfidence = Number(process.env.ORACLE_MIN_CONFIDENCE ?? 70);

  let oracleResponse: OracleResponse;
  try {
    oracleResponse = await callOracleInference(
      info.question,
      info.deadline,
      sources,
      oracleWallet
    );
  } catch (err) {
    logger.error("0G Compute inference failed", err);
    // Don't cancel on compute error — retry on next ResolutionTriggered event
    return;
  }

  // 4. Write full reasoning to 0G Storage (Log layer — permanent, unmodifiable)
  //    This rootHash is what gets stored on-chain as verdictReasoningHash
  let storageRootHash = "";
  const resolutionRecord = {
    verdict:          oracleResponse.verdict,
    confidence:       oracleResponse.confidence,
    reasoning:        oracleResponse.reasoning,
    evidenceSummary:  oracleResponse.evidenceSummary,
    sourcesChecked:   oracleResponse.sourcesChecked,
    inconclusiveReason: oracleResponse.inconclusiveReason,
    timestamp:        Date.now(),
    txHash:           "",              // filled after on-chain submission
    computeProvider:  process.env.COMPUTE_PROVIDER_ADDRESS ?? "",
    isChallenge,
  };

  try {
    storageRootHash = await writeResolutionRecord(
      marketAddress,
      resolutionRecord,
      oracleWallet
    );
    logger.info("Reasoning stored on 0G Storage", { rootHash: storageRootHash });
  } catch (err) {
    logger.warn("0G Storage write failed (non-fatal — continuing with on-chain post)", err);
  }

  // 5. Handle INCONCLUSIVE — cancel the market
  if (oracleResponse.verdict === null || oracleResponse.confidence < minConfidence) {
    logger.warn("Oracle returned INCONCLUSIVE", {
      confidence: oracleResponse.confidence,
      reason:     oracleResponse.inconclusiveReason,
    });

    if (isChallenge) {
      // Second inference was also inconclusive — reject challenge, keep original verdict
      logger.warn("Challenge resolution inconclusive — rejecting challenge");
      await processChallengeOnChain(marketAddress, false, oracleWallet);
    } else {
      await cancelMarketOnChain(
        marketAddress,
        oracleResponse.inconclusiveReason ?? "Oracle could not determine outcome with sufficient confidence",
        oracleWallet
      );
    }
    return;
  }

  // 6. Post verdict on-chain
  //    reasoningHash links the on-chain record to the full reasoning in 0G Storage
  const reasoningHash = storageRootHash || ethers.keccak256(
    ethers.toUtf8Bytes(oracleResponse.reasoning)
  );

  let receipt;
  if (isChallenge) {
    // Challenge: second inference flips outcome if different from original
    const originalOutcome = info.outcome;
    const upheld          = oracleResponse.verdict !== originalOutcome;
    receipt = await processChallengeOnChain(marketAddress, upheld, oracleWallet);
    logger.info("Challenge processed", {
      original: originalOutcome,
      revised:  oracleResponse.verdict,
      upheld,
    });
  } else {
    receipt = await postResolutionOnChain(
      marketAddress,
      oracleResponse.verdict,
      reasoningHash,
      oracleWallet
    );
  }

  logger.info("Oracle resolution complete", {
    market:     marketAddress,
    verdict:    oracleResponse.verdict,
    confidence: oracleResponse.confidence,
    txHash:     receipt.hash,
  });
}

// ── Reveal positions ──────────────────────────────────────────────────────────

/**
 * After ResolutionFinalized: read sealed positions from PositionVault and
 * submit the reveal.
 *
 * MVP encoding: frontend sends toHex("YES") or toHex("NO") as the commitment.
 * Real TEE implementation would decrypt here using the 0G TEE SDK.
 */
async function revealPositions(
  marketAddress: string,
  oracleWallet:  ReturnType<typeof createWallet>,
  provider:      ReturnType<typeof createProvider>
): Promise<void> {
  const vault    = getVault(provider);
  const count    = Number(await vault.positionCount(marketAddress));
  const revealed = await vault.hasRevealed(marketAddress) as boolean;

  if (revealed || count === 0) {
    logger.info("No positions to reveal", { market: marketAddress, count, revealed });
    return;
  }

  logger.info("Collecting sealed positions for reveal...", { market: marketAddress, count });

  // Read each position directly from PositionVault — this is the source of truth.
  // BetPlaced events on MarketContract do NOT include the encryptedCommitment.
  const positions: Array<{ bettor: string; direction: boolean; collateralAmount: bigint }> = [];

  for (let i = 0; i < count; i++) {
    const pos = await vault.getEncryptedPosition(marketAddress, i) as {
      bettor:               string;
      encryptedCommitment:  string;   // hex-encoded bytes
      collateralAmount:     bigint;
      revealed:             boolean;
    };

    if (pos.revealed) continue;

    // Decrypt commitment: NaCl box (ECDH + XSalsa20-Poly1305)
    // Wire format: ephemeralPub(32) + nonce(24) + ciphertext
    let direction = true;
    try {
      const secretKeyB64 = process.env.ORACLE_NACL_SECRET_KEY ?? "";
      const secretKey    = decodeBase64(secretKeyB64);
      const packed       = ethers.getBytes(pos.encryptedCommitment);

      if (packed.length > 56) {
        const ephemeralPub = packed.slice(0, 32);
        const nonce        = packed.slice(32, 56);
        const ciphertext   = packed.slice(56);
        const decrypted    = nacl.box.open(ciphertext, nonce, ephemeralPub, secretKey);
        if (decrypted) {
          const text = new TextDecoder().decode(decrypted);
          direction  = text.trim().toUpperCase() === "YES";
        } else {
          logger.warn("NaCl decryption failed for position — defaulting to YES", { index: i });
        }
      } else {
        // Fallback: legacy plaintext UTF-8 commitment (pre-encryption bets)
        const text = ethers.toUtf8String(pos.encryptedCommitment);
        direction  = text.trim().toUpperCase() === "YES";
      }
    } catch {
      logger.warn("Could not decrypt commitment for position — defaulting to YES", { market: marketAddress, index: i });
    }

    positions.push({
      bettor:           pos.bettor,
      direction,
      collateralAmount: pos.collateralAmount,
    });
  }

  if (positions.length === 0) {
    logger.warn("No positions to reveal after decoding", { market: marketAddress });
    return;
  }

  await revealPositionsOnChain(marketAddress, positions, oracleWallet);
  logger.info("Positions revealed", { market: marketAddress, count: positions.length });
}

// ── Startup scan ──────────────────────────────────────────────────────────────

/**
 * On startup, scan all markets and pick up any that are stuck in
 * PendingResolution or Challenged (agent may have been offline).
 */
async function catchUpOnPendingMarkets(
  oracleWallet: ReturnType<typeof createWallet>,
  provider:     ReturnType<typeof createProvider>
): Promise<void> {
  logger.info("Scanning for markets needing resolution...");

  const markets = await getAllActiveMarkets(provider);
  logger.info(`Found ${markets.length} total markets`);

  for (const addr of markets) {
    try {
      const info = await getMarketInfo(addr, provider);

      if (info.status === "PendingResolution") {
        logger.info("Found market in PendingResolution — resolving", { market: addr });
        await resolveMarket(addr, oracleWallet, provider, false);
      } else if (info.status === "Challenged" && info.challenger !== ethers.ZeroAddress) {
        logger.info("Found challenged market — running second inference", { market: addr });
        await resolveMarket(addr, oracleWallet, provider, true);
      } else if (info.status === "Resolved") {
        // Check if positions need to be revealed
        await revealPositions(addr, oracleWallet, provider);
      }
    } catch (err) {
      logger.error("Error processing market during startup scan", { market: addr, err });
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  logger.info("==============================================");
  logger.info("  Prophet Oracle Agent — starting up");
  logger.info("  Powered by 0G Compute + 0G Storage");
  logger.info("==============================================");

  // Validate required env vars
  const requiredEnv = [
    "PRIVATE_KEY_ORACLE",
    "OG_CHAIN_RPC",
    "OG_INDEXER_RPC",
    "COMPUTE_PROVIDER_ADDRESS",
    "PROPHET_FACTORY_ADDRESS",
    "POSITION_VAULT_ADDRESS",
  ];
  for (const key of requiredEnv) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  const provider     = createProvider();
  const oracleWallet = createWallet(process.env.PRIVATE_KEY_ORACLE!, provider);

  logger.info("Oracle wallet", { address: oracleWallet.address });
  logger.info("0G Chain RPC",  { rpc: process.env.OG_CHAIN_RPC });
  logger.info("0G Compute provider", { address: process.env.COMPUTE_PROVIDER_ADDRESS });

  // Check balance
  const balance = await provider.getBalance(oracleWallet.address);
  logger.info("Wallet balance", { balance: ethers.formatEther(balance) + " 0G" });

  // Catch up on any markets that need resolution (agent restart recovery)
  await catchUpOnPendingMarkets(oracleWallet, provider);

  // Set up event listeners
  const factory = getFactory(provider);

  // ── Event: ResolutionTriggered ────────────────────────────────────────────
  // Fired by MarketContract when anyone calls triggerResolution() after deadline
  listenForEvent<[string, bigint, unknown]>(
    factory,
    "ResolutionTriggered",
    async (marketAddress, timestamp) => {
      logger.info("ResolutionTriggered event", {
        market:    marketAddress,
        timestamp: new Date(Number(timestamp) * 1000).toISOString(),
      });
      await resolveMarket(marketAddress, oracleWallet, provider, false);
    }
  );

  // Also listen on all already-known markets for ResolutionTriggered
  // (factory only forwards if it's a new market)
  const existingMarkets = await getAllActiveMarkets(provider);
  for (const addr of existingMarkets) {
    const marketContract = getMarket(addr, provider);

    listenForEvent<[string, bigint, unknown]>(
      marketContract,
      "ResolutionTriggered",
      async (market, _timestamp) => {
        logger.info("ResolutionTriggered (existing market)", { market });
        await resolveMarket(market, oracleWallet, provider, false);
      }
    );

    // ── Event: ResolutionChallenged ─────────────────────────────────────────
    // Fired when a user files a challenge against the initial verdict
    listenForEvent<[string, string, bigint, unknown]>(
      marketContract,
      "ResolutionChallenged",
      async (market, challenger, stake) => {
        logger.info("ResolutionChallenged event", {
          market,
          challenger,
          stake: ethers.formatUnits(stake, 6) + " USDT",
        });
        // Run second inference after a short delay to allow any new evidence
        await new Promise((r) => setTimeout(r, 5_000));
        await resolveMarket(market, oracleWallet, provider, true);
      }
    );

    // ── Event: ResolutionFinalized ──────────────────────────────────────────
    // Fired when the challenge window expires without a challenge
    listenForEvent<[string, boolean, bigint, unknown]>(
      marketContract,
      "ResolutionFinalized",
      async (market, outcome) => {
        logger.info("ResolutionFinalized event", { market, outcome });
        await revealPositions(market, oracleWallet, provider);
      }
    );
  }

  // Also listen for new markets being created, to attach listeners dynamically
  listenForEvent<[string, string, string, bigint, string, string, bigint, unknown]>(
    factory,
    "MarketCreated",
    async (marketAddress) => {
      logger.info("New market created — attaching listeners", { market: marketAddress });
      const marketContract = getMarket(marketAddress, provider);

      listenForEvent<[string, bigint, unknown]>(
        marketContract,
        "ResolutionTriggered",
        async (market) => {
          await resolveMarket(market, oracleWallet, provider, false);
        }
      );

      listenForEvent<[string, string, bigint, unknown]>(
        marketContract,
        "ResolutionChallenged",
        async (market) => {
          await new Promise((r) => setTimeout(r, 5_000));
          await resolveMarket(market, oracleWallet, provider, true);
        }
      );

      listenForEvent<[string, boolean, bigint, unknown]>(
        marketContract,
        "ResolutionFinalized",
        async (market) => {
          await revealPositions(market, oracleWallet, provider);
        }
      );
    }
  );

  logger.info("Oracle agent running — listening for events");
}

main().catch((err) => {
  console.error("[FATAL] Oracle agent crashed:", err);
  process.exit(1);
});
