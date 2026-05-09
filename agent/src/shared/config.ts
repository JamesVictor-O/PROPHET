
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
  PROPHET_FACTORY_ADDRESS:   "0x069e6203ef2CEB6aB7eC23432f9693eADdE0Af7C",
  POSITION_VAULT_ADDRESS:    "0xb941a917B0a345B87f30598589Cc71b5ff9b72b9",
  PAYOUT_DISTRIBUTOR_ADDRESS:"0x33a32264031c6CE010b200227aC8119E5156b405",
  LIQUIDITY_POOL_ADDRESS:    "0xda95ad4cA75eC78fE71D5Be970c8c3956E32B018",

  // ── NaCl public key (not secret — safe to hardcode) ───────────────────────
  ORACLE_NACL_PUBLIC_KEY:    "c63ZR8XoOQmN8rbWZyYi8JzicwoaiuEk1NSzl0KyLTE=",

  // ── Agent tuning ──────────────────────────────────────────────────────────
  REPRICE_INTERVAL_MS:   300_000,  // 5 minutes
  RECOVERY_INTERVAL_MS:   60_000,  // 1 minute chain/settlement catch-up loop
  ORACLE_MIN_CONFIDENCE: 70,

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
