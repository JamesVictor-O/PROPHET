import { Command } from "commander";
import { formatEther, parseEther } from "viem";
import { getClients, getAccountAddress } from "../utils/client.js";
import { getContracts } from "../config/contracts.js";
import { PredictionMarketABI } from "../utils/abis.js";
import chalk from "chalk";

export const predictionCommands = new Command("predict").description(
  "Prediction and staking commands"
);

// Make a prediction
predictionCommands
  .command("create")
  .description("Make a prediction/stake on a market")
  .requiredOption("--market-id <id>", "Market ID")
  .option("--side <yes|no>", "Side for Binary market (yes or no)")
  .option("--outcome <label>", "Outcome label for CrowdWisdom market")
  .requiredOption("--stake <amount>", "Stake amount (e.g., 1.0)")
  .action(async (options) => {
    try {
      const { walletClient, publicClient, chain } = getClients();
      const contracts = getContracts();
      const account = await getAccountAddress();

      const marketId = BigInt(options.marketId);
      const stake = parseEther(options.stake);

      console.log(chalk.blue("\nMaking prediction...\n"));
      console.log(`Market ID: ${marketId}`);
      console.log(`Stake: ${options.stake}`);

      // Get market info
      const marketInfo = await publicClient.readContract({
        address: contracts.predictionMarket,
        abi: PredictionMarketABI(),
        functionName: "getMarketInfo",
        args: [marketId],
      });

      const market: any = marketInfo;
      if (market.resolved) {
        throw new Error("Market is already resolved");
      }

      // Check allowance
      const ERC20_ABI = [
        {
          name: "approve",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" },
          ],
          outputs: [{ name: "", type: "bool" }],
        },
        {
          name: "allowance",
          type: "function",
          stateMutability: "view",
          inputs: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
          ],
          outputs: [{ name: "", type: "uint256" }],
        },
      ];

      const allowance = (await publicClient.readContract({
        address: contracts.paymentToken,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [account, contracts.predictionMarket],
      })) as bigint;

      if (allowance < stake) {
        console.log(chalk.yellow("Approving token spending..."));
        if (!walletClient.account) {
          throw new Error("Wallet client account is not initialized");
        }
        const approveHash = await walletClient.writeContract({
          account: walletClient.account,
          chain,
          address: contracts.paymentToken,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [contracts.predictionMarket, parseEther("1000000")],
        });

        console.log(
          chalk.gray(`Approval tx: ${contracts.explorer}/tx/${approveHash}`)
        );
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
        console.log(chalk.green("✓ Approved"));
      }

      // Make prediction based on market type
      if (market.marketType === 0n) {
        // Binary market
        if (!options.side) {
          throw new Error("--side is required for Binary markets");
        }

        const side = options.side.toLowerCase() === "yes" ? 0 : 1;
        console.log(`Side: ${options.side}\n`);

        if (!walletClient.account) {
          throw new Error("Wallet client account is not initialized");
        }

        console.log(chalk.blue("Placing prediction..."));
        const hash = await walletClient.writeContract({
          account: walletClient.account,
          chain,
          address: contracts.predictionMarket,
          abi: PredictionMarketABI(),
          functionName: "predict",
          args: [marketId, BigInt(side), stake],
        });

        console.log(
          chalk.gray(`Transaction: ${contracts.explorer}/tx/${hash}`)
        );
        await publicClient.waitForTransactionReceipt({ hash });
        console.log(chalk.green("✓ Prediction placed!"));
      } else {
        // CrowdWisdom market
        if (!options.outcome) {
          throw new Error("--outcome is required for CrowdWisdom markets");
        }

        console.log(`Outcome: ${options.outcome}\n`);

        console.log(chalk.blue("Commenting and staking..."));
        if (!walletClient.account) {
          throw new Error("Wallet client account is not initialized");
        }
        const hash = await walletClient.writeContract({
          account: walletClient.account,
          chain,
          address: contracts.predictionMarket,
          abi: PredictionMarketABI(),
          functionName: "commentAndStake",
          args: [marketId, options.outcome, stake],
        });

        console.log(
          chalk.gray(`Transaction: ${contracts.explorer}/tx/${hash}`)
        );
        await publicClient.waitForTransactionReceipt({ hash });
        console.log(chalk.green("✓ Comment and stake placed!"));
      }
    } catch (error: any) {
      console.error(chalk.red(`\n✗ Error: ${error.message}`));
      process.exit(1);
    }
  });

// Stake on existing CrowdWisdom outcome
predictionCommands
  .command("stake")
  .description("Stake on an existing CrowdWisdom outcome")
  .requiredOption("--market-id <id>", "Market ID")
  .requiredOption("--outcome <label>", "Outcome label")
  .requiredOption("--stake <amount>", "Stake amount (e.g., 1.0)")
  .action(async (options) => {
    try {
      const { walletClient, publicClient, chain } = getClients();
      const contracts = getContracts();
      const account = await getAccountAddress();

      const marketId = BigInt(options.marketId);
      const stake = parseEther(options.stake);

      console.log(chalk.blue("\nStaking on outcome...\n"));
      console.log(`Market ID: ${marketId}`);
      console.log(`Outcome: ${options.outcome}`);
      console.log(`Stake: ${options.stake}\n`);

      // Check allowance
      const ERC20_ABI = [
        {
          name: "approve",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" },
          ],
          outputs: [{ name: "", type: "bool" }],
        },
        {
          name: "allowance",
          type: "function",
          stateMutability: "view",
          inputs: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
          ],
          outputs: [{ name: "", type: "uint256" }],
        },
      ];

      const allowance = (await publicClient.readContract({
        address: contracts.paymentToken,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [account, contracts.predictionMarket],
      })) as bigint;

      if (allowance < stake) {
        console.log(chalk.yellow("Approving token spending..."));
        if (!walletClient.account) {
          throw new Error("Wallet client account is not initialized");
        }
        const approveHash = await walletClient.writeContract({
          account: walletClient.account,
          chain,
          address: contracts.paymentToken,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [contracts.predictionMarket, parseEther("1000000")],
        });

        console.log(
          chalk.gray(`Approval tx: ${contracts.explorer}/tx/${approveHash}`)
        );
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
        console.log(chalk.green("✓ Approved"));
      }

      console.log(chalk.blue("Staking..."));
      if (!walletClient.account) {
        throw new Error("Wallet client account is not initialized");
      }
      const hash = await walletClient.writeContract({
        account: walletClient.account,
        chain,
        address: contracts.predictionMarket,
        abi: PredictionMarketABI(),
        functionName: "stakeOnOutcome",
        args: [marketId, options.outcome, stake],
      });

      console.log(chalk.gray(`Transaction: ${contracts.explorer}/tx/${hash}`));
      await publicClient.waitForTransactionReceipt({ hash });
      console.log(chalk.green("✓ Staked!"));
    } catch (error: any) {
      console.error(chalk.red(`\n✗ Error: ${error.message}`));
      process.exit(1);
    }
  });

// List user predictions
predictionCommands
  .command("list")
  .description("List your predictions")
  .action(async () => {
    try {
      const { publicClient } = getClients();
      const contracts = getContracts();
      const account = await getAccountAddress();

      console.log(chalk.blue(`\nFetching predictions for ${account}...\n`));

      // Get all market IDs
      const { MarketFactoryABI } = await import("../utils/abis.js");
      const marketCount = Number(
        (await publicClient.readContract({
          address: contracts.factory,
          abi: MarketFactoryABI(),
          functionName: "getMarketCount",
          args: [],
        })) as unknown as bigint
      );

      let predictionCount = 0;
      for (let i = 0; i < Number(marketCount); i++) {
        try {
          const marketId = await publicClient.readContract({
            address: contracts.factory,
            abi: MarketFactoryABI(),
            functionName: "getMarketId",
            args: [BigInt(i)],
          });

          // Get user prediction
          const userPrediction = await publicClient.readContract({
            address: contracts.predictionMarket,
            abi: PredictionMarketABI(),
            functionName: "userPredictions",
            args: [marketId, account],
          });

          const prediction: any = userPrediction;
          if (prediction.hasPredicted) {
            predictionCount++;
            const marketInfo = await publicClient.readContract({
              address: contracts.predictionMarket,
              abi: PredictionMarketABI(),
              functionName: "getMarketInfo",
              args: [marketId],
            });

            const market: any = marketInfo;
            console.log(chalk.cyan(`Market #${marketId}`));
            console.log(`  Question: ${market.question}`);
            console.log(`  Stake: ${formatEther(prediction.stake)}`);
            if (market.marketType === 0n) {
              console.log(`  Side: ${prediction.side === 0n ? "YES" : "NO"}`);
            } else {
              console.log(`  Outcome: ${prediction.outcomeLabel || "N/A"}`);
            }
            console.log(
              `  Status: ${
                market.resolved
                  ? prediction.hasWon
                    ? "Won"
                    : "Lost"
                  : "Pending"
              }`
            );
            console.log("");
          }
        } catch (error) {
          // Skip if error
          continue;
        }
      }

      if (predictionCount === 0) {
        console.log(chalk.yellow("No predictions found."));
      } else {
        console.log(chalk.green(`Found ${predictionCount} prediction(s)`));
      }
    } catch (error: any) {
      console.error(chalk.red(`\n✗ Error: ${error.message}`));
      process.exit(1);
    }
  });

// Claim payout
predictionCommands
  .command("claim")
  .description("Claim payout for resolved market")
  .requiredOption("--market-id <id>", "Market ID")
  .action(async (options) => {
    try {
      const { walletClient, publicClient, chain } = getClients();
      const contracts = getContracts();

      const marketId = BigInt(options.marketId);

      console.log(chalk.blue(`\nClaiming payout for market #${marketId}...\n`));

      // Check if market is resolved
      const marketInfo = await publicClient.readContract({
        address: contracts.predictionMarket,
        abi: PredictionMarketABI(),
        functionName: "getMarketInfo",
        args: [marketId],
      });

      const market: any = marketInfo;
      if (!market.resolved) {
        throw new Error("Market is not yet resolved");
      }

      const account = await getAccountAddress();
      const userPrediction = await publicClient.readContract({
        address: contracts.predictionMarket,
        abi: PredictionMarketABI(),
        functionName: "userPredictions",
        args: [marketId, account],
      });

      const prediction: any = userPrediction;
      if (!prediction.hasPredicted) {
        throw new Error("You have no prediction on this market");
      }

      const hasClaimed = await publicClient.readContract({
        address: contracts.predictionMarket,
        abi: PredictionMarketABI(),
        functionName: "hasClaimed",
        args: [marketId, account],
      });

      if (hasClaimed) {
        throw new Error("Payout already claimed");
      }

      if (!prediction.hasWon) {
        throw new Error("Your prediction did not win");
      }

      console.log(chalk.blue("Claiming payout..."));
      if (!walletClient.account) {
        throw new Error("Wallet client account is not initialized");
      }
      const hash = await walletClient.writeContract({
        account: walletClient.account,
        chain,
        address: contracts.predictionMarket,
        abi: PredictionMarketABI(),
        functionName: "claimPayout",
        args: [marketId],
      });

      console.log(chalk.gray(`Transaction: ${contracts.explorer}/tx/${hash}`));
      await publicClient.waitForTransactionReceipt({ hash });
      console.log(chalk.green("✓ Payout claimed!"));
    } catch (error: any) {
      console.error(chalk.red(`\n✗ Error: ${error.message}`));
      process.exit(1);
    }
  });
