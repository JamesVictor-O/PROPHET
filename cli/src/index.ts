#!/usr/bin/env node

import { Command } from "commander";
import { config } from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { marketCommands } from "./commands/market.js";
import { predictionCommands } from "./commands/prediction.js";
import { userCommands } from "./commands/user.js";
import { oracleCommands } from "./commands/oracle.js";

// Load environment variables (check multiple locations)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Try loading from cli directory first, then project root
const envPaths = [
  path.join(__dirname, "../.env.local"), // cli/.env.local
  path.join(__dirname, "../.env"), // cli/.env
  path.join(__dirname, "../../.env.local"), // project root .env.local
  path.join(__dirname, "../../.env"), // project root .env
];
for (const envPath of envPaths) {
  const result = config({ path: envPath });
  if (!result.error) {
    break; // Stop at first successful load
  }
}

const program = new Command();

program
  .name("prophet")
  .description(
    "PROPHET CLI - Interact with PROPHET contracts from command line"
  )
  .version("1.0.0");

// Add command groups
program.addCommand(marketCommands);
program.addCommand(predictionCommands);
program.addCommand(userCommands);
program.addCommand(oracleCommands);

program.parse(process.argv);
