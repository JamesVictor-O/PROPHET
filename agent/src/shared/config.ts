// ─────────────────────────────────────────────────────────────────────────────
// Prophet Agent — static configuration
//
// Only the three private keys need to be environment variables.
// Everything else is hardcoded here since it's public testnet data.
// ─────────────────────────────────────────────────────────────────────────────

export const CONFIG = {
  // ── 0G Chain ──────────────────────────────────────────────────────────────
  OG_CHAIN_RPC:    "https://evmrpc-testnet.0g.ai",
  OG_CHAIN_ID:     16602,

  // ── 0G Storage ────────────────────────────────────────────────────────────
  OG_INDEXER_RPC:  "https://indexer-storage-testnet-standard.0g.ai",

  // ── 0G Compute ────────────────────────────────────────────────────────────
  COMPUTE_PROVIDER_ADDRESS: "0xa48f01287233509FD694a22Bf840225062E67836",
  COMPUTE_MIN_BALANCE:      10,
  COMPUTE_TOPUP_AMOUNT:     50,

  // ── Deployed contracts (0G Galileo testnet, chain 16602) ──────────────────
  USDT_ADDRESS:              "0xc2B0D2A7e858F13B349843fF87dBF4EBF9227F49",
  PROPHET_FACTORY_ADDRESS:   "0xCEd9B4405b9B7d09f6b7d44e6bA113EcF2627333",
  POSITION_VAULT_ADDRESS:    "0x3f831E170f828DB2711403c6C3AD80e6fB02da75",
  PAYOUT_DISTRIBUTOR_ADDRESS:"0x0d979Db2cDda3D2f35FDFAb5883F97De40760054",
  LIQUIDITY_POOL_ADDRESS:    "0x1A39bD969870e71d22A10b38F2845baBB56649A4",

  // ── NaCl public key (not secret — safe to hardcode) ───────────────────────
  ORACLE_NACL_PUBLIC_KEY:    "c63ZR8XoOQmN8rbWZyYi8JzicwoaiuEk1NSzl0KyLTE=",

  // ── Agent tuning ──────────────────────────────────────────────────────────
  REPRICE_INTERVAL_MS:   300_000,  // 5 minutes
  ORACLE_MIN_CONFIDENCE: 70,
} as const;

// ── Helpers to read config with optional env override ─────────────────────────
// Env vars still take precedence so you can override in dev without code changes

export function cfg(key: keyof typeof CONFIG): string {
  const envVal = process.env[key];
  if (envVal !== undefined && envVal !== "") return envVal;
  return String(CONFIG[key]);
}

export function cfgNum(key: keyof typeof CONFIG): number {
  const envVal = process.env[key];
  if (envVal !== undefined && envVal !== "") return Number(envVal);
  return Number(CONFIG[key]);
}
