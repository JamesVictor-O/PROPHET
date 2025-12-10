import { Command } from "commander";
import { formatEther } from "viem";
import { getClients, getAccountAddress } from "../utils/client.js";
import { getContracts } from "../config/contracts.js";
import { ReputationSystemABI } from "../utils/abis.js";
import chalk from "chalk";

export const userCommands = new Command("user").description(
  "User management commands"
);

// Check cUSD balance
userCommands
  .command("balance")
  .description("Check your cUSD balance on Celo Mainnet")
  .option("--address <address>", "Address to check (default: your address)")
  .action(async (options) => {
    try {
      const { publicClient } = getClients();
      const contracts = getContracts();
      const account = options.address || (await getAccountAddress());

      console.log(chalk.blue(`\nChecking cUSD balance for ${account}...\n`));

      const ERC20_ABI = [
        {
          name: "balanceOf",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "owner", type: "address" }],
          outputs: [{ name: "", type: "uint256" }],
        },
        {
          name: "decimals",
          type: "function",
          stateMutability: "view",
          inputs: [],
          outputs: [{ name: "", type: "uint8" }],
        },
        {
          name: "symbol",
          type: "function",
          stateMutability: "view",
          inputs: [],
          outputs: [{ name: "", type: "string" }],
        },
      ];

      const balance = (await publicClient.readContract({
        address: contracts.paymentToken,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [account as `0x${string}`],
      })) as bigint;

      const symbol = (await publicClient.readContract({
        address: contracts.paymentToken,
        abi: ERC20_ABI,
        functionName: "symbol",
        args: [],
      })) as string;

      const balanceFormatted = formatEther(balance);
      const minStake = formatEther(BigInt("2500000000000000")); // 0.0025 cUSD

      console.log(chalk.cyan(`${symbol} Balance:`));
      console.log(`  ${balanceFormatted} ${symbol}`);
      console.log(`  Minimum Stake Required: ${minStake} ${symbol}`);
      console.log(`  Token Address: ${contracts.paymentToken}`);
      console.log(`  Network: Celo Mainnet (Chain ID: ${contracts.chainId})`);

      if (balance === 0n) {
        console.log(
          chalk.yellow("\n⚠️  You don't have any cUSD on Celo Mainnet.")
        );
        console.log(chalk.yellow("To get cUSD on Celo Mainnet, you can:"));
        console.log(
          chalk.yellow("  1. Bridge cUSD from another chain")
        );
        console.log(
          chalk.yellow("  2. Use a DEX to swap CELO for cUSD")
        );
        console.log(
          chalk.yellow("  3. Use a centralized exchange that supports Celo")
        );
        console.log(
          chalk.yellow("  4. Use Opera MiniPay or Valora wallet to get cUSD")
        );
      } else if (balance < BigInt("2500000000000000")) {
        console.log(
          chalk.yellow(
            `\n⚠️  Your balance is below the minimum stake of ${minStake} cUSD.`
          )
        );
      } else {
        console.log(
          chalk.green(`\n✓ You have sufficient ${symbol} to create markets!`)
        );
      }
    } catch (error: any) {
      console.error(chalk.red(`\n✗ Error: ${error.message}`));
      process.exit(1);
    }
  });

// Get user stats
userCommands
  .command("stats")
  .description("Get your user statistics")
  .option("--address <address>", "User address (default: your address)")
  .action(async (options) => {
    try {
      const { publicClient } = getClients();
      const contracts = getContracts();

      const address = options.address || (await getAccountAddress());

      console.log(chalk.blue(`\nFetching stats for ${address}...\n`));

      const stats = await publicClient.readContract({
        address: contracts.reputationSystem,
        abi: ReputationSystemABI(),
        functionName: "getUserStats",
        args: [address as `0x${string}`],
      });

      const userStats: any = stats;
      const totalPredictions = Number(userStats.totalPredictions);
      const correctPredictions = Number(userStats.correctPredictions);
      const winRate =
        totalPredictions > 0
          ? ((correctPredictions / totalPredictions) * 100).toFixed(2)
          : "0.00";

      console.log(chalk.cyan("User Statistics:"));
      console.log(`Total Predictions: ${totalPredictions}`);
      console.log(`Correct Predictions: ${correctPredictions}`);
      console.log(`Win Rate: ${winRate}%`);
      console.log(`Total Winnings: ${formatEther(userStats.totalWinnings)}`);
      console.log(`Current Streak: ${userStats.currentStreak.toString()}`);
      console.log(`Best Streak: ${userStats.bestStreak.toString()}`);
      console.log(`Reputation Score: ${userStats.reputationScore.toString()}`);

      // Get username if set
      const username = await publicClient.readContract({
        address: contracts.reputationSystem,
        abi: ReputationSystemABI(),
        functionName: "getUsername",
        args: [address as `0x${string}`],
      });

      if (username && username.length > 0) {
        console.log(`Username: ${username}`);
      }
    } catch (error: any) {
      console.error(chalk.red(`\n✗ Error: ${error.message}`));
      process.exit(1);
    }
  });

// Set username
userCommands
  .command("set-username")
  .description("Set your username")
  .requiredOption(
    "--name <username>",
    "Username (3-20 characters, alphanumeric and underscores)"
  )
  .action(async (options) => {
    try {
      const { walletClient, publicClient, chain } = getClients();
      const contracts = getContracts();

      console.log(chalk.blue(`\nSetting username to "${options.name}"...\n`));

      // Check if username is available
      const isAvailable = await publicClient.readContract({
        address: contracts.reputationSystem,
        abi: ReputationSystemABI(),
        functionName: "isUsernameAvailable",
        args: [options.name],
      });

      if (!isAvailable) {
        throw new Error("Username is already taken");
      }

      if (!walletClient.account) {
        throw new Error("Wallet client account is not initialized");
      }

      const hash = await walletClient.writeContract({
        account: walletClient.account,
        chain,
        address: contracts.reputationSystem,
        abi: ReputationSystemABI(),
        functionName: "setUsername",
        args: [options.name],
      });

      console.log(chalk.gray(`Transaction: ${contracts.explorer}/tx/${hash}`));
      await publicClient.waitForTransactionReceipt({ hash });
      console.log(chalk.green(`✓ Username set to "${options.name}"!`));
    } catch (error: any) {
      console.error(chalk.red(`\n✗ Error: ${error.message}`));
      process.exit(1);
    }
  });

// Get leaderboard
userCommands
  .command("leaderboard")
  .description("Get leaderboard")
  .option("--limit <number>", "Number of users to show", "10")
  .action(async (options) => {
    try {
      const { publicClient } = getClients();
      const contracts = getContracts();

      const limit = parseInt(options.limit, 10);

      console.log(chalk.blue(`\nFetching top ${limit} users...\n`));

      const topUsers = await publicClient.readContract({
        address: contracts.reputationSystem,
        abi: ReputationSystemABI(),
        functionName: "getTopUsers",
        args: [BigInt(limit)],
      });

      console.log(chalk.cyan("Leaderboard:"));
      console.log("");

      for (let i = 0; i < topUsers.length; i++) {
        const address = topUsers[i];
        const stats = await publicClient.readContract({
          address: contracts.reputationSystem,
          abi: ReputationSystemABI(),
          functionName: "getUserStats",
          args: [address],
        });

        const userStats: any = stats;
        const username = await publicClient.readContract({
          address: contracts.reputationSystem,
          abi: ReputationSystemABI(),
          functionName: "getUsername",
          args: [address],
        });

        const displayName =
          username && username.length > 0
            ? username
            : address.slice(0, 10) + "...";

        console.log(`${i + 1}. ${displayName}`);
        console.log(`   Score: ${userStats.reputationScore.toString()}`);
        console.log(
          `   Win Rate: ${
            Number(userStats.totalPredictions) > 0
              ? (
                  (Number(userStats.correctPredictions) /
                    Number(userStats.totalPredictions)) *
                  100
                ).toFixed(2)
              : "0.00"
          }%`
        );
        console.log(`   Winnings: ${formatEther(userStats.totalWinnings)}`);
        console.log("");
      }
    } catch (error: any) {
      console.error(chalk.red(`\n✗ Error: ${error.message}`));
      process.exit(1);
    }
  });
