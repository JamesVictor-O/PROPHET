
import { ethers, type Wallet } from "ethers";
import type {
  MarketCreatedEvent,
  ResolutionTriggeredEvent,
  ResolutionChallengedEvent,
  ResolutionFinalizedEvent,
  MarketStatusString,
} from "./types";
import { createLogger } from "./logger";
import { cfg } from "./config";

const logger = createLogger("chain");

const FACTORY_ABI = [
  "event MarketCreated(address indexed marketAddress, address indexed creator, string question, uint256 deadline, string category, bytes32 resolutionSourcesHash, uint256 indexed marketIndex)",
  "function getMarkets(uint256 offset, uint256 limit) view returns (address[])",
  "function totalMarkets() view returns (uint256)",
  "function isValidMarket(address market) view returns (bool)",
] as const;

const MARKET_ABI = [
  "event ResolutionTriggered(address indexed market, uint256 timestamp)",
  "event ResolutionPosted(address indexed market, bool verdict, bytes32 reasoningHash, uint256 challengeDeadline)",
  "event ResolutionChallenged(address indexed market, address indexed challenger, uint256 challengeStake)",
  "event ResolutionFinalized(address indexed market, bool outcome, uint256 timestamp)",
  "event MarketCancelled(address indexed market, string reason)",
  "event SharesPurchased(address indexed market, address indexed trader, bool indexed isYes, uint256 collateralIn, uint256 sharesOut, uint256 fee)",
  "event SharesSold(address indexed market, address indexed trader, bool indexed isYes, uint256 sharesIn, uint256 collateralOut, uint256 fee)",
  "event MarketActivated(address indexed market, uint256 interestCount, uint256 timestamp)",

  "function getMarketInfo() view returns (string question, uint256 deadline, uint8 status, bool outcome, uint256 totalCollateral, uint256 challengeDeadline, bytes32 verdictReasoningHash, string category, address creator)",
  "function getPendingInfo() view returns (uint256 pendingDeadline, uint256 interestCount, uint256 creatorBond, bool isPendingOver)",
  "function liquidityTier() view returns (uint8)",
  "function status() view returns (uint8)",
  "function deadline() view returns (uint256)",
  "function totalCollateral() view returns (uint256)",
  "function resolutionSourcesHash() view returns (bytes32)",
  "function question() view returns (string)",
  "function category() view returns (string)",
  "function creator() view returns (address)",
  "function challenger() view returns (address)",
  "function challengeDeadline() view returns (uint256)",
  "function hasBet(address bettor) view returns (bool)",
  "function getAmmState(address trader) view returns (uint256 yesReserve, uint256 noReserve, uint256 collateralBacking, uint256 tradingFees, uint256 traderYesShares, uint256 traderNoShares, uint256 yesPriceBps, uint256 noPriceBps)",

  "function triggerResolution()",
  "function postResolution(bool verdict, bytes32 reasoningHash, bytes teeAttestation)",
  "function processChallengeOutcome(bool challengeUpheld)",
  "function finalizeResolution()",
  "function cancelMarket(string reason)",
  "function returnLiquidityToPool(address pool)",
] as const;

const LIQUIDITY_POOL_ABI = [
  "function availableLiquidity() view returns (uint256)",
  "function totalPoolValue() view returns (uint256)",
  "function marketAllocation(address market) view returns (uint256)",
  "function maxAllocationBps() view returns (uint256)",
  "function minAllocationBps() view returns (uint256)",
  "function allocateToMarket(address market, uint256 amount)",
] as const;

const VAULT_ABI = [
  "event PositionsRevealed(address indexed market, uint256 totalPositions, uint256 timestamp)",
  "function getEncryptedPosition(address market, uint256 index) view returns (tuple(address bettor, bytes encryptedCommitment, uint256 collateralAmount, uint256 timestamp, bool revealed))",
  "function getRevealedPositions(address market) view returns (tuple(address bettor, bool direction, uint256 collateralAmount)[])",
  "function positionCount(address market) view returns (uint256)",
  "function hasRevealed(address market) view returns (bool)",
  "function revealPositions(address market, tuple(address bettor, bool direction, uint256 collateralAmount)[] positions, bytes teeDecryptionProof)",
] as const;


const STATUS_MAP: Record<number, MarketStatusString> = {
  0: "Pending",
  1: "Open",
  2: "PendingResolution",
  3: "Challenged",
  4: "Resolved",
  5: "Cancelled",
  6: "Archived",
};

export function statusToString(n: number): MarketStatusString {
  return STATUS_MAP[n] ?? "Pending";
}


export function createProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(cfg("OG_CHAIN_RPC"));
}

export function createWallet(privateKey: string, provider: ethers.JsonRpcProvider): Wallet {
  const key = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
  return new ethers.Wallet(key, provider);
}

export function getFactory(
  provider: ethers.JsonRpcProvider | Wallet
): ethers.Contract {
  return new ethers.Contract(cfg("PROPHET_FACTORY_ADDRESS"), FACTORY_ABI, provider);
}

export function getMarket(
  marketAddress: string,
  signerOrProvider: ethers.JsonRpcProvider | Wallet
): ethers.Contract {
  return new ethers.Contract(marketAddress, MARKET_ABI, signerOrProvider);
}

export function getVault(
  signerOrProvider: ethers.JsonRpcProvider | Wallet
): ethers.Contract {
  return new ethers.Contract(cfg("POSITION_VAULT_ADDRESS"), VAULT_ABI, signerOrProvider);
}

export function getLiquidityPool(
  signerOrProvider: ethers.JsonRpcProvider | Wallet
): ethers.Contract | null {
  const address = cfg("LIQUIDITY_POOL_ADDRESS");
  if (!address) return null;
  return new ethers.Contract(address, LIQUIDITY_POOL_ABI, signerOrProvider);
}

// ── Event listeners ───────────────────────────────────────────────────────────

export function listenForEvent<T extends unknown[]>(
  contract: ethers.Contract,
  eventName: string,
  handler: (...args: T) => Promise<void>
): void {
  contract.on(eventName, async (...args: unknown[]) => {
    const event = args[args.length - 1] as { blockNumber: number };
    logger.info(`Event: ${eventName}`, { block: event.blockNumber });
    try {
      await handler(...(args as T));
    } catch (err) {
      logger.error(`Handler for ${eventName} failed`, err);
    }
  });
  logger.info(`Listening for ${eventName}`);
}

// ── Market info helpers ───────────────────────────────────────────────────────

export interface MarketInfo {
  question:              string;
  deadline:              number;
  status:                MarketStatusString;
  outcome:               boolean;
  totalCollateral:       bigint;
  challengeDeadline:     number;
  verdictReasoningHash:  string;
  category:              string;
  creator:               string;
  challenger:            string;
  resolutionSourcesHash: string;
}

export async function getMarketInfo(
  marketAddress: string,
  provider: ethers.JsonRpcProvider
): Promise<MarketInfo> {
  const market      = getMarket(marketAddress, provider);
  const info        = await market.getMarketInfo() as [
    string, bigint, number, boolean, bigint, bigint, string, string, string
  ];
  const [challenger, resolutionSourcesHash] = await Promise.all([
    market.challenger() as Promise<string>,
    market.resolutionSourcesHash() as Promise<string>,
  ]);
  return {
    question:              info[0],
    deadline:              Number(info[1]),
    status:                statusToString(info[2]),
    outcome:               info[3],
    totalCollateral:       info[4],
    challengeDeadline:     Number(info[5]),
    verdictReasoningHash:  info[6],
    category:              info[7],
    creator:               info[8],
    challenger,
    resolutionSourcesHash,
  };
}

export async function getAllActiveMarkets(
  provider: ethers.JsonRpcProvider
): Promise<string[]> {
  const factory = getFactory(provider);
  const total   = Number(await factory.totalMarkets()) as number;
  if (total === 0) return [];

  const markets: string[] = [];
  const pageSize           = 50;
  for (let offset = 0; offset < total; offset += pageSize) {
    const limit = Math.min(pageSize, total - offset);
    const page  = await factory.getMarkets(offset, limit) as string[];
    markets.push(...page);
  }
  return markets;
}

// ── On-chain writes ───────────────────────────────────────────────────────────


export async function postResolutionOnChain(
  marketAddress: string,
  verdict:        boolean,
  reasoningHash:  string,
  oracleSigner:   Wallet
): Promise<ethers.TransactionReceipt> {
  const market = getMarket(marketAddress, oracleSigner);
  // reasoningHash may be a 0x-prefixed bytes32 hex (from keccak256 or 0G Storage root hash)
  // or an arbitrary string. Use it as-is if it's already bytes32, otherwise hash it.
  const bytes32Hash: `0x${string}` =
    (reasoningHash.startsWith("0x") && reasoningHash.length === 66)
      ? (reasoningHash as `0x${string}`)
      : (ethers.keccak256(ethers.toUtf8Bytes(reasoningHash)) as `0x${string}`);

  // Sign keccak256(market ++ verdict ++ reasoningHash) with the oracle private key.
  // The contract's _verifyTeeAttestation recovers the signer and checks it equals oracleAgent.
  const msgHash     = ethers.solidityPackedKeccak256(
    ["address", "bool", "bytes32"],
    [marketAddress, verdict, bytes32Hash]
  );
  const attestation = await oracleSigner.signMessage(ethers.getBytes(msgHash));

  logger.info("Posting resolution on-chain...", {
    market:  marketAddress,
    verdict,
  });

  const tx      = await market.postResolution(verdict, bytes32Hash, attestation);
  const receipt = await tx.wait();

  logger.info("Resolution posted", { txHash: receipt.hash, block: receipt.blockNumber });
  return receipt;
}


export async function cancelMarketOnChain(
  marketAddress: string,
  reason:        string,
  oracleSigner:  Wallet
): Promise<ethers.TransactionReceipt> {
  const market = getMarket(marketAddress, oracleSigner);
  logger.warn("Cancelling market (INCONCLUSIVE)", { market: marketAddress, reason });
  const tx      = await market.cancelMarket(reason);
  const receipt = await tx.wait();
  logger.info("Market cancelled", { txHash: receipt.hash });
  return receipt;
}


export async function processChallengeOnChain(
  marketAddress:  string,
  upheld:         boolean,
  oracleSigner:   Wallet
): Promise<ethers.TransactionReceipt> {
  const market  = getMarket(marketAddress, oracleSigner);
  logger.info("Processing challenge outcome", { market: marketAddress, upheld });
  const tx      = await market.processChallengeOutcome(upheld);
  const receipt = await tx.wait();
  logger.info("Challenge processed", { txHash: receipt.hash });
  return receipt;
}


export async function triggerResolutionOnChain(
  marketAddress: string,
  oracleSigner:  Wallet
): Promise<ethers.TransactionReceipt> {
  const market  = getMarket(marketAddress, oracleSigner);
  logger.info("Triggering resolution on-chain...", { market: marketAddress });
  const tx      = await market.triggerResolution();
  const receipt = await tx.wait();
  logger.info("Resolution triggered", { txHash: receipt.hash });
  return receipt;
}


export async function finalizeResolutionOnChain(
  marketAddress: string,
  signer:        Wallet
): Promise<ethers.TransactionReceipt> {
  const market  = getMarket(marketAddress, signer);
  logger.info("Finalizing resolution (challenge window expired, no challenge)...", { market: marketAddress });
  const tx      = await market.finalizeResolution();
  const receipt = await tx.wait();
  logger.info("Resolution finalized", { txHash: receipt.hash });
  return receipt;
}


export async function revealPositionsOnChain(
  marketAddress: string,
  positions:     Array<{ bettor: string; direction: boolean; collateralAmount: bigint }>,
  oracleSigner:  Wallet
): Promise<ethers.TransactionReceipt> {
  const vault  = getVault(oracleSigner);
  const proof  = ethers.hexlify(ethers.toUtf8Bytes("0g-tee-decryption-proof-stub"));

  logger.info("Revealing positions on-chain...", {
    market:    marketAddress,
    positions: positions.length,
  });

  const tx      = await vault.revealPositions(marketAddress, positions, proof);
  const receipt = await tx.wait();
  logger.info("Positions revealed", { txHash: receipt.hash });
  return receipt;
}

// Re-export event types
export type { MarketCreatedEvent, ResolutionTriggeredEvent, ResolutionChallengedEvent, ResolutionFinalizedEvent };
