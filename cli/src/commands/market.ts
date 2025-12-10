import { Command } from "commander";
import { formatEther, parseEther, getAddress, decodeEventLog } from "viem";
import { getClients } from "../utils/client.js";
import { getContracts } from "../config/contracts.js";
import { MarketFactoryABI, PredictionMarketABI } from "../utils/abis.js";
import chalk from "chalk";

export const marketCommands = new Command("market").description(
  "Market management commands"
);

// Create Binary Market
marketCommands
  .command("create-binary")
  .description("Create a Binary (Yes/No) market")
  .requiredOption("--question <question>", "The prediction question")
  .requiredOption("--category <category>", "Market category")
  .requiredOption(
    "--end-date <date>",
    "End date (YYYY-MM-DD or Unix timestamp)"
  )
  .requiredOption(
    "--stake <amount>",
    "Initial stake amount in token units (e.g., 1.0)"
  )
  .requiredOption("--side <yes|no>", "Initial prediction side (yes or no)")
  .action(async (options) => {
    try {
      const { walletClient, publicClient, chain } = getClients();
      const contracts = getContracts();

      console.log(chalk.blue("\nCreating Binary Market...\n"));
      console.log("Question:", options.question);
      console.log("Category:", options.category);
      console.log("End Date:", options.endDate);
      console.log("Stake:", options.stake);
      console.log("Side:", options.side);
      console.log("");

      // Parse end date
      let endTime: bigint;
      if (/^\d+$/.test(options.endDate)) {
        endTime = BigInt(options.endDate);
      } else {
        const date = new Date(options.endDate);
        if (isNaN(date.getTime())) {
          throw new Error(
            "Invalid date format. Use YYYY-MM-DD or Unix timestamp"
          );
        }
        endTime = BigInt(Math.floor(date.getTime() / 1000));
      }

      // Parse stake
      const initialStake = parseEther(options.stake);

      // Parse side (0 = Yes, 1 = No)
      const initialSide = options.side.toLowerCase() === "yes" ? 0 : 1;

      // Check balance first
      if (!walletClient.account) {
        throw new Error("Wallet client account is not initialized");
      }
      const account = walletClient.account.address;

      const ERC20_BALANCE_ABI = [
        {
          name: "balanceOf",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "owner", type: "address" }],
          outputs: [{ name: "", type: "uint256" }],
        },
      ];

      const balance = (await publicClient.readContract({
        address: contracts.paymentToken,
        abi: ERC20_BALANCE_ABI,
        functionName: "balanceOf",
        args: [account],
      })) as bigint;

      if (balance < initialStake) {
        throw new Error(
          `\nInsufficient cUSD balance on Celo Mainnet.\n\n` +
            `Current Balance: ${formatEther(balance)} cUSD\n` +
            `Required: ${formatEther(initialStake)} cUSD\n\n` +
            `To get cUSD on Celo Mainnet:\n` +
            `  1. Bridge cUSD from another chain\n` +
            `  2. Use a DEX to swap CELO for cUSD\n` +
            `  3. Use a centralized exchange that supports Celo deposits\n` +
            `  4. Use Opera MiniPay or Valora wallet to get cUSD\n\n` +
            `Token Address: ${contracts.paymentToken}\n` +
            `Your Address: ${account}\n` +
            `Network: Celo Mainnet (Chain ID: ${contracts.chainId})\n\n` +
            `Check your balance with: prophet user balance`
        );
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

      // Check allowance (account already defined above)
      let allowance = (await publicClient.readContract({
        address: contracts.paymentToken,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [account, contracts.factory],
      })) as bigint;

      if (allowance < initialStake) {
        console.log(chalk.yellow("Approving token spending..."));
        const approveAmount = parseEther("1000000"); // Approve a large amount
        const approveHash = await walletClient.writeContract({
          account: walletClient.account!,
          chain,
          address: contracts.paymentToken,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [contracts.factory, approveAmount],
        });

        console.log(
          chalk.gray(`Approval tx: ${contracts.explorer}/tx/${approveHash}`)
        );
        console.log(chalk.blue("Waiting for approval confirmation..."));
        await publicClient.waitForTransactionReceipt({ hash: approveHash });

        // Re-check allowance to ensure it's updated (with retries)
        let retries = 3;
        while (retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second delay
          allowance = (await publicClient.readContract({
            address: contracts.paymentToken,
            abi: ERC20_ABI,
            functionName: "allowance",
            args: [account, contracts.factory],
          })) as bigint;

          if (allowance >= initialStake) {
            break; // Allowance is sufficient
          }
          retries--;
          if (retries > 0) {
            console.log(
              chalk.yellow(
                `Waiting for allowance to update... (${retries} retries left)`
              )
            );
          }
        }

        if (allowance < initialStake) {
          throw new Error(
            `Approval not reflected after waiting. Allowance: ${allowance.toString()}, Required: ${initialStake.toString()}. Please check the approval transaction.`
          );
        }
        console.log(chalk.green("✓ Approved"));
      }

      // Create market
      console.log(chalk.blue("Creating market..."));
      const hash = await walletClient.writeContract({
        account: walletClient.account!,
        chain,
        address: contracts.factory,
        abi: MarketFactoryABI(),
        functionName: "createMarket",
        args: [
          0, // MarketType.Binary
          options.question,
          options.category,
          endTime,
          initialStake,
          initialSide,
          "", // initialOutcomeLabel (empty for Binary)
        ],
      });

      console.log(chalk.gray(`Transaction: ${contracts.explorer}/tx/${hash}`));
      console.log(chalk.blue("Waiting for confirmation..."));

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log(chalk.green("✓ Market created!"));

      // Get market ID from events
      const marketCreatedEvent = receipt.logs.find((log) => {
        try {
          const decoded = decodeEventLog({
            abi: MarketFactoryABI(),
            data: log.data,
            topics: log.topics,
          }) as { eventName: string; args: any };
          return decoded.eventName === "MarketCreated";
        } catch {
          return false;
        }
      });

      if (marketCreatedEvent) {
        const decoded = decodeEventLog({
          abi: MarketFactoryABI(),
          data: marketCreatedEvent.data,
          topics: marketCreatedEvent.topics,
        }) as { eventName: string; args: any };
        const marketId = (decoded.args as any).marketId;
        console.log(chalk.green(`\nMarket ID: ${marketId.toString()}`));
        console.log(
          chalk.gray(
            `Market: ${contracts.explorer}/address/${contracts.predictionMarket}`
          )
        );
      }
    } catch (error: any) {
      console.error(chalk.red(`\n✗ Error: ${error.message}`));
      process.exit(1);
    }
  });

// Create CrowdWisdom Market
marketCommands
  .command("create-crowdwisdom")
  .description("Create a CrowdWisdom (Multi-outcome) market")
  .requiredOption("--question <question>", "The prediction question")
  .requiredOption("--category <category>", "Market category")
  .requiredOption(
    "--end-date <date>",
    "End date (YYYY-MM-DD or Unix timestamp)"
  )
  .requiredOption(
    "--stake <amount>",
    "Initial stake amount in token units (e.g., 1.0)"
  )
  .requiredOption("--outcome <label>", "Initial outcome label")
  .action(async (options) => {
    try {
      const { walletClient, publicClient, chain } = getClients();
      const contracts = getContracts();

      console.log(chalk.blue("\nCreating CrowdWisdom Market...\n"));
      console.log("Question:", options.question);
      console.log("Category:", options.category);
      console.log("End Date:", options.endDate);
      console.log("Stake:", options.stake);
      console.log("Initial Outcome:", options.outcome);
      console.log("");

      // Parse end date
      let endTime: bigint;
      if (/^\d+$/.test(options.endDate)) {
        endTime = BigInt(options.endDate);
      } else {
        const date = new Date(options.endDate);
        if (isNaN(date.getTime())) {
          throw new Error(
            "Invalid date format. Use YYYY-MM-DD or Unix timestamp"
          );
        }
        endTime = BigInt(Math.floor(date.getTime() / 1000));
      }

      // Parse stake
      const initialStake = parseEther(options.stake);

      if (!walletClient.account) {
        throw new Error("Wallet client account is not initialized");
      }
      const account = walletClient.account.address;

      // Check balance first
      const ERC20_BALANCE_ABI = [
        {
          name: "balanceOf",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "owner", type: "address" }],
          outputs: [{ name: "", type: "uint256" }],
        },
      ];

      const balance = (await publicClient.readContract({
        address: contracts.paymentToken,
        abi: ERC20_BALANCE_ABI,
        functionName: "balanceOf",
        args: [account],
      })) as bigint;

      if (balance < initialStake) {
        throw new Error(
          `\nInsufficient cUSD balance on Celo Mainnet.\n\n` +
            `Current Balance: ${formatEther(balance)} cUSD\n` +
            `Required: ${formatEther(initialStake)} cUSD\n\n` +
            `To get cUSD on Celo Mainnet:\n` +
            `  1. Bridge cUSD from another chain\n` +
            `  2. Use a DEX to swap CELO for cUSD\n` +
            `  3. Use a centralized exchange that supports Celo deposits\n` +
            `  4. Use Opera MiniPay or Valora wallet to get cUSD\n\n` +
            `Token Address: ${contracts.paymentToken}\n` +
            `Your Address: ${account}\n` +
            `Network: Celo Mainnet (Chain ID: ${contracts.chainId})\n\n` +
            `Check your balance with: prophet user balance`
        );
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

      // Check allowance (account already defined above)
      let allowance = (await publicClient.readContract({
        address: contracts.paymentToken,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [account, contracts.factory],
      })) as bigint;

      if (allowance < initialStake) {
        console.log(chalk.yellow("Approving token spending..."));
        const approveAmount = parseEther("1000000"); // Approve a large amount
        const approveHash = await walletClient.writeContract({
          account: walletClient.account!,
          chain,
          address: contracts.paymentToken,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [contracts.factory, approveAmount],
        });

        console.log(
          chalk.gray(`Approval tx: ${contracts.explorer}/tx/${approveHash}`)
        );
        console.log(chalk.blue("Waiting for approval confirmation..."));
        await publicClient.waitForTransactionReceipt({ hash: approveHash });

        // Re-check allowance to ensure it's updated (with retries)
        let retries = 3;
        while (retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second delay
          allowance = (await publicClient.readContract({
            address: contracts.paymentToken,
            abi: ERC20_ABI,
            functionName: "allowance",
            args: [account, contracts.factory],
          })) as bigint;

          if (allowance >= initialStake) {
            break; // Allowance is sufficient
          }
          retries--;
          if (retries > 0) {
            console.log(
              chalk.yellow(
                `Waiting for allowance to update... (${retries} retries left)`
              )
            );
          }
        }

        if (allowance < initialStake) {
          throw new Error(
            `Approval not reflected after waiting. Allowance: ${allowance.toString()}, Required: ${initialStake.toString()}. Please check the approval transaction.`
          );
        }
        console.log(chalk.green("✓ Approved"));
      }

      // Create market
      console.log(chalk.blue("Creating market..."));
      const hash = await walletClient.writeContract({
        account: walletClient.account!,
        chain,
        address: contracts.factory,
        abi: MarketFactoryABI(),
        functionName: "createMarket",
        args: [
          1, // MarketType.CrowdWisdom
          options.question,
          options.category,
          endTime,
          initialStake,
          0, // initialSide (ignored for CrowdWisdom)
          options.outcome, // initialOutcomeLabel
        ],
      });

      console.log(chalk.gray(`Transaction: ${contracts.explorer}/tx/${hash}`));
      console.log(chalk.blue("Waiting for confirmation..."));

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log(chalk.green("✓ Market created!"));

      // Get market ID from events
      const marketCreatedEvent = receipt.logs.find((log) => {
        try {
          const decoded = decodeEventLog({
            abi: MarketFactoryABI(),
            data: log.data,
            topics: log.topics,
          }) as { eventName: string; args: any };
          return decoded.eventName === "MarketCreated";
        } catch {
          return false;
        }
      });

      if (marketCreatedEvent) {
        const decoded = decodeEventLog({
          abi: MarketFactoryABI(),
          data: marketCreatedEvent.data,
          topics: marketCreatedEvent.topics,
        }) as { eventName: string; args: any };
        const marketId = (decoded.args as any).marketId;
        console.log(chalk.green(`\nMarket ID: ${marketId.toString()}`));
        console.log(
          chalk.gray(
            `Market: ${contracts.explorer}/address/${contracts.predictionMarket}`
          )
        );
      }
    } catch (error: any) {
      console.error(chalk.red(`\n✗ Error: ${error.message}`));
      process.exit(1);
    }
  });

// List all markets
marketCommands
  .command("list")
  .description("List all markets")
  .option("--limit <number>", "Limit number of markets to show", "50")
  .action(async (options) => {
    try {
      const { publicClient } = getClients();
      const contracts = getContracts();

      console.log(chalk.blue("\nFetching markets...\n"));

      const marketCount = Number(
        (await publicClient.readContract({
          address: contracts.factory,
          abi: MarketFactoryABI(),
          functionName: "getMarketCount",
          args: [],
        })) as unknown as bigint
      );

      const limit = Math.min(Number(options.limit), Number(marketCount));
      console.log(`Total markets: ${marketCount.toString()}\n`);

      for (let i = 0; i < limit; i++) {
        try {
          const marketId = await publicClient.readContract({
            address: contracts.factory,
            abi: MarketFactoryABI(),
            functionName: "getMarketId",
            args: [BigInt(i)],
          });

          const marketInfo = await publicClient.readContract({
            address: contracts.predictionMarket,
            abi: PredictionMarketABI(),
            functionName: "getMarketInfo",
            args: [marketId],
          });

          const market: any = marketInfo;
          const endDate = new Date(
            Number(market.endTime) * 1000
          ).toLocaleString();

          console.log(chalk.cyan(`Market #${marketId.toString()}`));
          console.log(`  Question: ${market.question}`);
          console.log(`  Category: ${market.category}`);
          console.log(
            `  Type: ${market.marketType === 0n ? "Binary" : "CrowdWisdom"}`
          );
          console.log(`  End Date: ${endDate}`);
          console.log(`  Resolved: ${market.resolved ? "Yes" : "No"}`);
          console.log("");
        } catch (error) {
          // Skip if market doesn't exist
          continue;
        }
      }
    } catch (error: any) {
      console.error(chalk.red(`\n✗ Error: ${error.message}`));
      process.exit(1);
    }
  });

// Get market info
marketCommands
  .command("info")
  .description("Get market details")
  .requiredOption("--id <marketId>", "Market ID")
  .action(async (options) => {
    try {
      const { publicClient } = getClients();
      const contracts = getContracts();

      const marketId = BigInt(options.id);

      console.log(chalk.blue(`\nFetching market #${marketId}...\n`));

      const marketInfo = await publicClient.readContract({
        address: contracts.predictionMarket,
        abi: PredictionMarketABI(),
        functionName: "getMarketInfo",
        args: [marketId],
      });

      const market: any = marketInfo;
      const endDate = new Date(Number(market.endTime) * 1000).toLocaleString();

      console.log(chalk.cyan(`Market #${marketId}`));
      console.log(`Question: ${market.question}`);
      console.log(`Category: ${market.category}`);
      console.log(
        `Type: ${market.marketType === 0n ? "Binary" : "CrowdWisdom"}`
      );
      console.log(`End Date: ${endDate}`);
      console.log(`Resolved: ${market.resolved ? "Yes" : "No"}`);

      if (market.resolved) {
        console.log(`Winning Outcome: ${market.winningOutcome}`);
      }

      // Get pool amounts for Binary markets
      if (market.marketType === 0n) {
        const yesPool = (await publicClient.readContract({
          address: contracts.predictionMarket,
          abi: PredictionMarketABI(),
          functionName: "poolAmounts",
          args: [marketId, 0n],
        })) as unknown as bigint;

        const noPool = (await publicClient.readContract({
          address: contracts.predictionMarket,
          abi: PredictionMarketABI(),
          functionName: "poolAmounts",
          args: [marketId, 1n],
        })) as unknown as bigint;

        const totalPool = yesPool + noPool;
        const yesPercent =
          totalPool > 0n ? Number((yesPool * 10000n) / totalPool) / 100 : 0;
        const noPercent =
          totalPool > 0n ? Number((noPool * 10000n) / totalPool) / 100 : 0;

        console.log(`\nPool Distribution:`);
        console.log(`  YES: ${formatEther(yesPool)} (${yesPercent}%)`);
        console.log(`  NO:  ${formatEther(noPool)} (${noPercent}%)`);
        console.log(`  Total: ${formatEther(totalPool)}`);
      }
    } catch (error: any) {
      console.error(chalk.red(`\n✗ Error: ${error.message}`));
      process.exit(1);
    }
  });
