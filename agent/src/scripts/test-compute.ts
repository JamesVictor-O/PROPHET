// ─────────────────────────────────────────────────────────────────────────────
// 0G Compute diagnostic script
//
// Runs every step of the compute integration in sequence and reports
// pass/fail at each stage so you know exactly where things break.
//
// Usage:
//   cd agent
//   cp .env.example .env   # fill in PRIVATE_KEY_ORACLE + COMPUTE_PROVIDER_ADDRESS
//   npx tsx src/scripts/test-compute.ts
// ─────────────────────────────────────────────────────────────────────────────

import "dotenv/config";
import { ethers }                        from "ethers";
import { createZGComputeNetworkBroker }  from "@0glabs/0g-serving-broker";
import OpenAI                            from "openai";

// ── Helpers ───────────────────────────────────────────────────────────────────

const GREEN  = "\x1b[32m✓\x1b[0m";
const RED    = "\x1b[31m✗\x1b[0m";
const YELLOW = "\x1b[33m⚠\x1b[0m";
const BOLD   = "\x1b[1m";
const RESET  = "\x1b[0m";

function pass(label: string, detail?: string) {
  console.log(`  ${GREEN} ${label}${detail ? `  →  ${detail}` : ""}`);
}

function fail(label: string, err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  console.log(`  ${RED} ${label}`);
  console.log(`       ${msg}`);
}

function warn(label: string, detail?: string) {
  console.log(`  ${YELLOW} ${label}${detail ? `  →  ${detail}` : ""}`);
}

function section(title: string) {
  console.log(`\n${BOLD}${title}${RESET}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${BOLD}═══════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}  Prophet × 0G Compute — Diagnostic${RESET}`);
  console.log(`${BOLD}═══════════════════════════════════════════════${RESET}`);

  // ── Step 1: Environment ───────────────────────────────────────────────────
  section("1. Environment");

  const requiredVars = ["PRIVATE_KEY_ORACLE", "OG_CHAIN_RPC", "COMPUTE_PROVIDER_ADDRESS"];
  let envOk = true;
  for (const v of requiredVars) {
    if (process.env[v]) {
      pass(v, v === "PRIVATE_KEY_ORACLE" ? "***set***" : process.env[v]);
    } else {
      fail(v, "not set in .env");
      envOk = false;
    }
  }
  if (!envOk) {
    console.log("\n  Fill in the missing .env values and re-run.\n");
    process.exit(1);
  }

  // ── Step 2: Chain connection ──────────────────────────────────────────────
  section("2. 0G Chain connection");

  let provider: ethers.JsonRpcProvider;
  let wallet: ethers.Wallet;

  try {
    provider = new ethers.JsonRpcProvider(process.env.OG_CHAIN_RPC!);
    const network = await provider.getNetwork();
    pass("RPC connected", `chain ID ${network.chainId}`);
  } catch (err) {
    fail("RPC connection failed", err);
    process.exit(1);
  }

  try {
    const key = process.env.PRIVATE_KEY_ORACLE!;
    wallet = new ethers.Wallet(
      key.startsWith("0x") ? key : `0x${key}`,
      provider
    );
    const balance = await provider.getBalance(wallet.address);
    pass("Wallet loaded", wallet.address);
    pass("Wallet balance", `${ethers.formatEther(balance)} 0G`);

    if (balance === 0n) {
      warn("Balance is zero — get testnet 0G from https://faucet.0g.ai");
    }
  } catch (err) {
    fail("Wallet setup failed", err);
    process.exit(1);
  }

  // ── Step 3: Broker initialization ────────────────────────────────────────
  section("3. 0G Compute broker initialization");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let broker: any;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    broker = await createZGComputeNetworkBroker(wallet as any);
    pass("Broker created (auto-detected network from chain ID)");
  } catch (err) {
    fail("Broker creation failed", err);
    process.exit(1);
  }

  // ── Step 4: Ledger account ────────────────────────────────────────────────
  section("4. Ledger account");

  let ledgerExists = false;
  try {
    const ledger = await broker.ledger.getLedger();
    const balance = Number(ledger.balance ?? 0);
    pass("Ledger account found", `balance: ${balance} 0G`);
    ledgerExists = true;

    if (balance < 1) {
      warn("Balance < 1 0G — deposit more with: broker.ledger.depositFund(50)");
    }
  } catch {
    warn("No ledger account found — will create one");
    ledgerExists = false;
  }

  if (!ledgerExists) {
    try {
      const walletBalance = await provider.getBalance(wallet.address);
      if (walletBalance < ethers.parseEther("10")) {
        warn("Wallet has < 10 0G — fund from https://faucet.0g.ai before creating ledger");
      } else {
        await broker.ledger.addLedger(10);
        pass("Ledger account created with 10 0G");
      }
    } catch (err) {
      fail("Ledger creation failed", err);
    }
  }

  // ── Step 5: Provider info ─────────────────────────────────────────────────
  section("5. Compute provider");

  const providerAddress = process.env.COMPUTE_PROVIDER_ADDRESS!;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let serviceMetadata: any;
  try {
    serviceMetadata = await broker.inference.getServiceMetadata(providerAddress);
    pass("Provider reachable", providerAddress);
    pass("Endpoint", serviceMetadata.endpoint);
    pass("Model", serviceMetadata.model);
  } catch (err) {
    fail("Could not get provider metadata", err);
    console.log(`\n  Check COMPUTE_PROVIDER_ADDRESS — find active providers at:`);
    console.log(`  https://compute-marketplace.0g.ai/inference\n`);
    process.exit(1);
  }

  // ── Step 6: TEE attestation ───────────────────────────────────────────────
  section("6. TEE attestation");

  try {
    const status = await broker.inference.checkProviderSignerStatus(providerAddress);
    pass("Provider signer status checked", `acknowledged: ${status.isAcknowledged}`);

    if (!status.isAcknowledged) {
      warn("Provider TEE signer not acknowledged — acknowledging now...");
      await broker.inference.acknowledgeProviderSigner(providerAddress);
      pass("Provider TEE signer acknowledged");
    }
  } catch (err) {
    warn("Provider signer check failed (non-fatal on testnet)", String(err));
  }

  try {
    await broker.inference.verifyService(providerAddress);
    pass("TEE attestation verified ✓");
  } catch (err) {
    warn("TEE verification failed (non-fatal on testnet)", String(err));
  }

  // ── Step 7: Fund ledger if empty ─────────────────────────────────────────
  section("7. Fund ledger");

  try {
    const ledger        = await broker.ledger.getLedger();
    const balance       = Number(ledger.balance ?? 0);
    if (balance < 1) {
      const walletBal   = await provider.getBalance(wallet.address);
      const walletFloat = parseFloat(ethers.formatEther(walletBal));
      const deposit     = Math.min(5, Math.floor(walletFloat * 0.8));
      if (deposit < 1) {
        warn("Not enough 0G to fund ledger — get more from https://faucet.0g.ai");
      } else {
        console.log(`  Depositing ${deposit} 0G (wallet has ${walletFloat.toFixed(2)} 0G)...`);
        await broker.ledger.depositFund(deposit);
        pass(`Ledger funded with ${deposit} 0G`);
      }
    } else {
      pass("Ledger already funded", `${balance} 0G`);
    }
  } catch (err) {
    fail("Ledger deposit failed", err);
  }

  // ── Step 8: Live inference call ───────────────────────────────────────────
  section("8. Live inference call (oracle test question)");

  const testQuestion = "Did the sun rise today?";
  const userContent  = `Market Question: "${testQuestion}"
Respond with: { "verdict": true or false or null, "confidence": 0-100, "reasoning": "brief explanation", "evidenceSummary": "one sentence", "sourcesChecked": [] }`;

  console.log(`  Question: "${testQuestion}"`);

  try {
    // Get broker billing headers — the 0G provider requires a signed
    // Authorization: Bearer app-sk-<base64(rawMessage:signature)> token
    const billingHeaders = await broker.inference.getRequestHeaders(
      providerAddress,
      userContent
    );
    pass("Billing headers generated", Object.keys(billingHeaders).join(", "));

    const client = new OpenAI({
      baseURL:        serviceMetadata.endpoint,
      apiKey:         "",
      defaultHeaders: billingHeaders,
    });

    const response = await client.chat.completions.create({
      model:    serviceMetadata.model,
      messages: [
        {
          role:    "system",
          content: "You are a prediction market oracle. Respond ONLY in valid JSON. No markdown.",
        },
        {
          role:    "user",
          content: userContent,
        },
      ],
      temperature: 0.1,
      max_tokens:  300,
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty response from model");

    pass("Inference call succeeded");
    console.log(`\n  ${BOLD}Raw response:${RESET}`);
    console.log(`  ${raw}`);

    try {
      const parsed = JSON.parse(raw);
      console.log(`\n  ${BOLD}Parsed verdict:${RESET}`);
      pass("verdict",     String(parsed.verdict));
      pass("confidence",  `${parsed.confidence}%`);
      pass("reasoning",   parsed.reasoning?.slice(0, 80) + "...");
    } catch {
      warn("Response was not valid JSON — check model output format");
    }
  } catch (err) {
    fail("Inference call failed", err);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n${BOLD}═══════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}  Diagnostic complete${RESET}`);
  console.log(`${BOLD}═══════════════════════════════════════════════${RESET}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n[FATAL]", err);
    process.exit(1);
  });
