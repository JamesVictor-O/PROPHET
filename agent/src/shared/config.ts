
export const CONFIG = {
  // ── 0G Chain ──────────────────────────────────────────────────────────────
  OG_CHAIN_RPC:    "https://evmrpc-testnet.0g.ai",
  OG_CHAIN_ID:     16602,

  // ── 0G Storage ────────────────────────────────────────────────────────────
  OG_INDEXER_RPC:  "https://indexer-storage-testnet-turbo.0g.ai",

  // ── 0G Compute ────────────────────────────────────────────────────────────
  COMPUTE_PROVIDER_ADDRESS: "0xa48f01287233509FD694a22Bf840225062E67836",
  COMPUTE_MIN_BALANCE:      10,
  COMPUTE_TOPUP_AMOUNT:     50,
  COMPUTE_TIMEOUT_MS:       45_000,
  COMPUTE_RETRIES:          2,
  COMPUTE_REQUIRE_TEE:      0,

  // ── Deployed contracts (0G Galileo testnet, chain 16602) ──────────────────
  USDT_ADDRESS:              "0xc2B0D2A7e858F13B349843fF87dBF4EBF9227F49",
  PROPHET_FACTORY_ADDRESS:   "0xEd51e3d6Ba8914875616bBcDd9aa9D4A00B27bD4",
  POSITION_VAULT_ADDRESS:    "0x89FAcA46A2782b4751F697ddFe0A0b9124Eb794E",
  PAYOUT_DISTRIBUTOR_ADDRESS:"0x238D341Bb358AC7C8Ae0A22b35897bECE97b9740",
  LIQUIDITY_POOL_ADDRESS:    "0x13AbE644693DA19f9A895C8c82Cf53879580DA8e",

  // ── NaCl public key (not secret — safe to hardcode) ───────────────────────
  ORACLE_NACL_PUBLIC_KEY:    "c63ZR8XoOQmN8rbWZyYi8JzicwoaiuEk1NSzl0KyLTE=",

  // ── Agent tuning ──────────────────────────────────────────────────────────
  REPRICE_INTERVAL_MS:   300_000,  // 5 minutes
  RECOVERY_INTERVAL_MS:   60_000,  // 1 minute chain/settlement catch-up loop
  ORACLE_MIN_CONFIDENCE: 70,
  ORACLE_REQUIRE_STORAGE: 1,
  ORACLE_ALLOW_LEGACY_PLAINTEXT_COMMITMENTS: 0,

  // ── 0G Storage reliability ────────────────────────────────────────────────
  STORAGE_RETRIES:       3,
  STORAGE_VERIFY_WRITES: 1,
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
  const value = envVal !== undefined && envVal !== "" ? Number(envVal) : Number(CONFIG[key]);
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid numeric config ${key}: ${envVal ?? CONFIG[key]}`);
  }
  return value;
}
