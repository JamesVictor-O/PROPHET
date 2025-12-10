import { Command } from "commander";
import { getClients } from "../utils/client.js";
import { getContracts } from "../config/contracts.js";
import { OracleABI } from "../utils/abis.js";
import chalk from "chalk";

export const oracleCommands = new Command("oracle").description(
  "Oracle commands (Oracle only)"
);

// Resolve market
oracleCommands
  .command("resolve")
  .description("Resolve a market (Oracle only)")
  .requiredOption("--market-id <id>", "Market ID")
  .requiredOption(
    "--outcome <outcome>",
    "Winning outcome (yes/no for Binary, outcome label for CrowdWisdom)"
  )
  .action(async (options) => {
    try {
      const { walletClient, publicClient, chain } = getClients();
      const contracts = getContracts();

      const marketId = BigInt(options.marketId);

      console.log(chalk.blue(`\nResolving market #${marketId}...\n`));
      console.log(`Outcome: ${options.outcome}\n`);

      // Get market info to determine type
      const { PredictionMarketABI } = await import("../utils/abis.js");
      const marketInfo = await publicClient.readContract({
        address: contracts.predictionMarket,
        abi: PredictionMarketABI(),
        functionName: "getMarketInfo",
        args: [marketId],
      });

      const market: any = marketInfo;

      if (!walletClient.account) {
        throw new Error("Wallet client account is not initialized");
      }

      let hash: `0x${string}`;

      if (market.marketType === 0n) {
        // Binary market
        const outcome = options.outcome.toLowerCase() === "yes" ? 0 : 1;
        hash = await walletClient.writeContract({
          account: walletClient.account,
          chain,
          address: contracts.oracle,
          abi: OracleABI(),
          functionName: "resolveMarket",
          args: [marketId, BigInt(outcome)],
        });
      } else {
        // CrowdWisdom market
        hash = await walletClient.writeContract({
          account: walletClient.account,
          chain,
          address: contracts.oracle,
          abi: OracleABI(),
          functionName: "resolveCrowdWisdomMarket",
          args: [marketId, options.outcome],
        });
      }

      console.log(chalk.gray(`Transaction: ${contracts.explorer}/tx/${hash}`));
      console.log(chalk.blue("Waiting for confirmation..."));
      await publicClient.waitForTransactionReceipt({ hash });
      console.log(chalk.green("✓ Market resolved!"));
    } catch (error: any) {
      console.error(chalk.red(`\n✗ Error: ${error.message}`));
      if (
        error.message.includes("AccessControlUnauthorizedAccount") ||
        error.message.includes("unauthorized")
      ) {
        console.error(
          chalk.yellow(
            "You do not have oracle permissions. Only authorized oracles can resolve markets."
          )
        );
      }
      process.exit(1);
    }
  });
