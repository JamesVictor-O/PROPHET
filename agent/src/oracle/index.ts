
import "dotenv/config";
import nacl                    from "tweetnacl";
import { decodeBase64 } from "tweetnacl-util";
import { ethers }              from "ethers";
import { createLogger }        from "../shared/logger";
import { createProvider, createWallet, getFactory, getMarket, getVault,
         listenForEvent, getMarketInfo, getAllActiveMarkets,
         postResolutionOnChain, cancelMarketOnChain, triggerResolutionOnChain,
         processChallengeOnChain, revealPositionsOnChain,
         finalizeResolutionOnChain } from "../shared/chain";
import { callOracleInference }  from "../shared/compute";
import { writeResolutionRecord, writeOracleWorkingState, readFromStorage } from "../shared/storage";
import { cfg, cfgNum } from "../shared/config";
import type { OracleResponse }  from "../shared/types";

const logger = createLogger("oracle");
const ZERO_HASH = `0x${"0".repeat(64)}`;
const marketLocks = new Set<string>();

async function withMarketLock(
  marketAddress: string,
  label: string,
  fn: () => Promise<void>
): Promise<void> {
  const key = marketAddress.toLowerCase();
  if (marketLocks.has(key)) {
    logger.warn("Skipping duplicate oracle action — market already in flight", {
      market: marketAddress,
      action: label,
    });
    return;
  }

  marketLocks.add(key);
  try {
    await fn();
  } finally {
    marketLocks.delete(key);
  }
}

function isBytes32Hash(value: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(value);
}

function decodeOracleSecretKey(): Uint8Array {
  const secretKeyB64 = process.env.ORACLE_NACL_SECRET_KEY ?? "";
  if (!secretKeyB64) {
    throw new Error("Missing ORACLE_NACL_SECRET_KEY; cannot reveal sealed positions");
  }

  const secretKey = decodeBase64(secretKeyB64);
  if (secretKey.length !== 32) {
    throw new Error(`ORACLE_NACL_SECRET_KEY must decode to 32 bytes, got ${secretKey.length}`);
  }
  return secretKey;
}

function decodePositionDirection(
  encryptedCommitment: string,
  secretKey: Uint8Array,
  index: number
): boolean {
  const packed = ethers.getBytes(encryptedCommitment);

  if (packed.length > 56) {
    const ephemeralPub = packed.slice(0, 32);
    const nonce        = packed.slice(32, 56);
    const ciphertext   = packed.slice(56);
    const decrypted    = nacl.box.open(ciphertext, nonce, ephemeralPub, secretKey);

    if (!decrypted) {
      throw new Error(`TEE/Nacl decryption failed for position ${index}`);
    }

    const text = new TextDecoder().decode(decrypted).trim().toUpperCase();
    if (text === "YES") return true;
    if (text === "NO") return false;
    throw new Error(`Invalid decrypted direction for position ${index}: ${text}`);
  }

  if (cfgNum("ORACLE_ALLOW_LEGACY_PLAINTEXT_COMMITMENTS") <= 0) {
    throw new Error(`Position ${index} is not an encrypted commitment`);
  }

  const text = ethers.toUtf8String(encryptedCommitment).trim().toUpperCase();
  if (text === "YES") return true;
  if (text === "NO") return false;
  throw new Error(`Invalid legacy plaintext direction for position ${index}: ${text}`);
}

function isPrivateOrLocalHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) return true;

  const parts = host.split(".").map((p) => Number(p));
  if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) {
    return false;
  }

  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function stripHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function readResponseTextCapped(res: Response, maxBytes = 200_000): Promise<string> {
  if (!res.body) return "";

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done || !value) break;

    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      break;
    }
    chunks.push(value);
  }

  return new TextDecoder().decode(Buffer.concat(chunks));
}

async function fetchSourceExcerpt(source: string, index: number): Promise<string> {
  let url: URL;
  try {
    url = new URL(source);
  } catch {
    return `${index + 1}. ${source}\nEvidence excerpt: Source is a non-URL reference; no direct fetch performed.`;
  }

  if (!["https:", "http:"].includes(url.protocol) || isPrivateOrLocalHost(url.hostname)) {
    return `${index + 1}. ${source}\nEvidence excerpt: Source skipped by oracle fetch policy.`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "ProphetOracle/1.0 (+https://prophet.market)",
        "Accept": "text/html,application/json,text/plain;q=0.9,*/*;q=0.1",
      },
    });

    const contentType = res.headers.get("content-type") ?? "unknown";
    const raw = await readResponseTextCapped(res);
    const excerpt = stripHtml(raw).slice(0, 1_500);
    return [
      `${index + 1}. ${source}`,
      `Fetch status: ${res.status}`,
      `Content type: ${contentType}`,
      `Evidence excerpt: ${excerpt || "No readable text extracted."}`,
    ].join("\n");
  } catch (err) {
    return `${index + 1}. ${source}\nEvidence excerpt: Fetch failed: ${
      err instanceof Error ? err.message : String(err)
    }`;
  } finally {
    clearTimeout(timeout);
  }
}

async function collectEvidence(sources: string[]): Promise<string[]> {
  const cleanSources = sources
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);

  if (cleanSources.length === 0) return [];

  logger.info("Collecting bounded evidence excerpts from approved sources", {
    count: cleanSources.length,
  });

  return Promise.all(cleanSources.map((source, index) => fetchSourceExcerpt(source, index)));
}

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
  await withMarketLock(marketAddress, isChallenge ? "challenge-resolution" : "resolution", async () => {
  logger.info(`${isChallenge ? "Challenge resolution" : "Resolution"} started`, {
    market: marketAddress,
  });

  // 1. Read market state
  const info = await getMarketInfo(marketAddress, provider);
  if (!isChallenge && info.status !== "PendingResolution") {
    logger.warn("Skipping resolution — market is not pending resolution", {
      market: marketAddress,
      status: info.status,
    });
    return;
  }
  if (isChallenge && info.status !== "Challenged") {
    logger.warn("Skipping challenge resolution — market is not challenged", {
      market: marketAddress,
      status: info.status,
    });
    return;
  }

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
  if (info.resolutionSourcesHash && info.resolutionSourcesHash !== ZERO_HASH) {
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
  const minConfidence = cfgNum("ORACLE_MIN_CONFIDENCE");
  const evidence = await collectEvidence(sources);
  await writeOracleWorkingState(marketAddress, {
    stage:            "inferring",
    evidenceGathered: evidence,
    sourcesChecked:   sources,
    startedAt:        Date.now(),
  }, oracleWallet).catch((e) => logger.warn("Storage write failed (non-fatal)", e));

  let oracleResponse: OracleResponse;
  try {
    oracleResponse = await callOracleInference(
      info.question,
      info.deadline,
      evidence.length ? evidence : sources,
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
    computeProvider:  cfg("COMPUTE_PROVIDER_ADDRESS"),
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
    if (cfgNum("ORACLE_REQUIRE_STORAGE") > 0) {
      logger.error("0G Storage write failed — refusing to post unverifiable verdict", err);
      return;
    }
    logger.warn("0G Storage write failed (fallback mode enabled — continuing with hashed reasoning)", err);
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
  if (storageRootHash && !isBytes32Hash(storageRootHash)) {
    if (cfgNum("ORACLE_REQUIRE_STORAGE") > 0) {
      logger.error("0G Storage returned non-bytes32 root hash — refusing to post unverifiable verdict", {
        rootHash: storageRootHash,
      });
      return;
    }
    logger.warn("0G Storage root hash is not bytes32 — falling back to reasoning digest", {
      rootHash: storageRootHash,
    });
    storageRootHash = "";
  }

  const reasoningHash = storageRootHash || ethers.keccak256(
    ethers.toUtf8Bytes(oracleResponse.reasoning)
  );

  await writeOracleWorkingState(marketAddress, {
    stage:            "posting",
    evidenceGathered: oracleResponse.sourcesChecked,
    sourcesChecked:   oracleResponse.sourcesChecked,
    startedAt:        Date.now(),
  }, oracleWallet).catch((e) => logger.warn("Storage write failed (non-fatal)", e));

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
  await writeOracleWorkingState(marketAddress, {
    stage:            "done",
    evidenceGathered: oracleResponse.sourcesChecked,
    sourcesChecked:   oracleResponse.sourcesChecked,
    startedAt:        Date.now(),
  }, oracleWallet).catch((e) => logger.warn("Storage write failed (non-fatal)", e));
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
  await withMarketLock(marketAddress, "reveal", async () => {
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
  const secretKey = decodeOracleSecretKey();

  for (let i = 0; i < count; i++) {
    const pos = await vault.getEncryptedPosition(marketAddress, i) as {
      bettor:               string;
      encryptedCommitment:  string;   // hex-encoded bytes
      collateralAmount:     bigint;
      revealed:             boolean;
    };

    if (pos.revealed) continue;

    // Decrypt commitment: NaCl box (ECDH + XSalsa20-Poly1305).
    // Wire format: ephemeralPub(32) + nonce(24) + ciphertext.
    // Settlement must fail closed: if any position cannot be decrypted exactly,
    // do not reveal a partial or guessed set of positions.
    const direction = decodePositionDirection(pos.encryptedCommitment, secretKey, i);

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
  });
}

// ── Startup scan ──────────────────────────────────────────────────────────────

/**
 * On startup (and periodically), scan all markets and pick up any that need action:
 * - Open markets past their deadline → call triggerResolution() then resolve
 * - PendingResolution markets → resolve (agent was offline when event fired)
 * - Challenged markets → run second inference
 * - Resolved markets → reveal positions if not yet revealed
 */
async function catchUpOnPendingMarkets(
  oracleWallet: ReturnType<typeof createWallet>,
  provider:     ReturnType<typeof createProvider>
): Promise<void> {
  logger.info("Scanning for markets needing resolution...");

  const markets = await getAllActiveMarkets(provider);
  logger.info(`Found ${markets.length} total markets`);

  const nowSec = Math.floor(Date.now() / 1000);

  for (const addr of markets) {
    try {
      const info = await getMarketInfo(addr, provider);

      if (info.status === "Open" && info.deadline < nowSec) {
        const minsAgo = Math.floor((nowSec - info.deadline) / 60);
        logger.info("Found expired Open market — triggering resolution", {
          market: addr,
          question: info.question,
          expiredAgo: `${minsAgo} minute(s) ago`,
        });
        try {
          await triggerResolutionOnChain(addr, oracleWallet);
          // Wait for provider nonce cache to refresh before any further txs from same wallet
          await new Promise((r) => setTimeout(r, 8_000));
        } catch (triggerErr: unknown) {
          const msg = triggerErr instanceof Error ? triggerErr.message : String(triggerErr);
          // If already in PendingResolution (race condition), continue to resolve
          if (!msg.includes("InvalidStatus") && !msg.includes("already")) {
            logger.error("triggerResolution failed", { market: addr, err: triggerErr });
            continue;
          }
          logger.info("Market already transitioning — proceeding to resolve", { market: addr });
        }
        await resolveMarket(addr, oracleWallet, provider, false);

      } else if (info.status === "PendingResolution") {
        logger.info("Found market in PendingResolution — resolving", { market: addr });
        await resolveMarket(addr, oracleWallet, provider, false);

      } else if (info.status === "Challenged") {
        if (info.challenger !== ethers.ZeroAddress) {
          // Actual challenge filed — run second inference
          logger.info("Found challenged market — running second inference", { market: addr });
          await resolveMarket(addr, oracleWallet, provider, true);
        } else if (info.challengeDeadline < nowSec) {
          // Challenge window expired with no challenger — finalize so positions can be revealed
          logger.info("Challenge window expired with no challenge — finalizing resolution", {
            market:    addr,
            expiredAgo: `${Math.floor((nowSec - info.challengeDeadline) / 3600)}h ago`,
          });
          await finalizeResolutionOnChain(addr, oracleWallet);
          await revealPositions(addr, oracleWallet, provider);
        } else {
          const remaining = Math.floor((info.challengeDeadline - nowSec) / 60);
          logger.info("Challenge window still open — waiting", { market: addr, minutesRemaining: remaining });
        }

      } else if (info.status === "Resolved") {
        await revealPositions(addr, oracleWallet, provider);
      }
    } catch (err) {
      logger.error("Error processing market during scan", { market: addr, err });
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  logger.info("==============================================");
  logger.info("  Prophet Oracle Agent — starting up");
  logger.info("  Powered by 0G Compute + 0G Storage");
  logger.info("==============================================");

  // Validate the only truly required env vars — the private keys
  const requiredEnv = ["PRIVATE_KEY_ORACLE", "ORACLE_NACL_SECRET_KEY"];
  for (const key of requiredEnv) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  const provider     = createProvider();
  const oracleWallet = createWallet(process.env.PRIVATE_KEY_ORACLE!, provider);

  logger.info("Oracle wallet",        { address: oracleWallet.address });
  logger.info("0G Chain RPC",         { rpc: cfg("OG_CHAIN_RPC") });
  logger.info("0G Compute provider",  { address: cfg("COMPUTE_PROVIDER_ADDRESS") });

  // Check balance
  const balance = await provider.getBalance(oracleWallet.address);
  logger.info("Wallet balance", { balance: ethers.formatEther(balance) + " 0G" });

  // Catch up on any markets that need resolution (agent restart recovery)
  await catchUpOnPendingMarkets(oracleWallet, provider);

  // Set up event listeners
  const factory = getFactory(provider);

  // Listen on all already-known markets for ResolutionTriggered
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

  // Periodic scan: catch markets that expire while the agent is running.
  // Every 5 minutes, re-scan for Open markets past their deadline.
  const SCAN_INTERVAL_MS = 5 * 60 * 1000;
  setInterval(async () => {
    logger.info("Periodic scan: checking for newly expired markets...");
    await catchUpOnPendingMarkets(oracleWallet, provider).catch((err) =>
      logger.error("Periodic scan failed", err)
    );
  }, SCAN_INTERVAL_MS);

  logger.info("Oracle agent running — listening for events + scanning every 5 min");
}

main().catch((err) => {
  console.error("[FATAL] Oracle agent crashed:", err);
  process.exit(1);
});
