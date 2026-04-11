// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/ProphetFactory.sol";
import "../src/PositionVault.sol";
import "../src/PayoutDistributor.sol";
import "../test/helpers/MockUSDT.sol";

/**
 * @title  DeployProphet
 * @notice Full deployment script for the Prophet prediction market system.
 *
 * DEPLOYMENT ORDER (resolves the vault<->distributor circular dependency
 * using deterministic nonce-based address prediction):
 *   1. MockUSDT          -- if USDT_ADDRESS env var is empty
 *   2. ProphetFactory    -- deploys markets, holds the registry
 *   3. PositionVault     -- needs PayoutDistributor address (predicted)
 *   4. PayoutDistributor -- needs PositionVault address (already deployed)
 *   5. factory.setVaultAndDistributor() -- links everything together
 *
 * ENV VARS (contracts/.env):
 *   PRIVATE_KEY              required  deployer / admin wallet private key
 *   USDT_ADDRESS             optional  leave empty to auto-deploy MockUSDT
 *   ORACLE_AGENT_ADDRESS     optional  leave empty to use deployer address
 *   MARKET_MAKER_ADDRESS     optional  leave empty to use deployer address
 *   PROTOCOL_TREASURY        optional  leave empty to use deployer address
 *
 * USAGE:
 *   forge script script/Deploy.s.sol \
 *     --rpc-url og_testnet \
 *     --broadcast \
 *     -vvv
 */
contract DeployProphet is Script {

    function run() external {
        // ----------------------------------------------------------------
        // 1. Load deployer key and resolve all addresses
        // ----------------------------------------------------------------
        // Accept PRIVATE_KEY with or without "0x" prefix
        string memory pkRaw = vm.envString("PRIVATE_KEY");
        string memory pkHex = bytes(pkRaw).length >= 2 &&
            bytes(pkRaw)[0] == "0" && bytes(pkRaw)[1] == "x"
            ? pkRaw
            : string(abi.encodePacked("0x", pkRaw));
        uint256 deployerKey = vm.parseUint(pkHex);
        address deployer    = vm.addr(deployerKey);

        // Empty env vars fall back to the deployer address for hackathon convenience
        address usdtAddress = _envAddress("USDT_ADDRESS",          address(0));
        address oracleAgent = _envAddress("ORACLE_AGENT_ADDRESS",  deployer);
        address marketMaker = _envAddress("MARKET_MAKER_ADDRESS",  deployer);
        address treasury    = _envAddress("PROTOCOL_TREASURY",     deployer);

        // ----------------------------------------------------------------
        // 2. Pre-flight log
        // ----------------------------------------------------------------
        console.log("=================================================");
        console.log("  Prophet Deployment - 0G Galileo Testnet");
        console.log("=================================================");
        console.log("Chain ID     :", block.chainid);
        console.log("Deployer     :", deployer);
        console.log("Oracle Agent :", oracleAgent);
        console.log("Market Maker :", marketMaker);
        console.log("Treasury     :", treasury);
        if (usdtAddress == address(0)) {
            console.log("USDT         : deploying MockUSDT...");
        } else {
            console.log("USDT         :", usdtAddress);
        }
        console.log("-------------------------------------------------");

        // ----------------------------------------------------------------
        // 3. Broadcast all transactions
        // ----------------------------------------------------------------
        vm.startBroadcast(deployerKey);

        // Step A: Deploy MockUSDT when no real USDT address is provided
        if (usdtAddress == address(0)) {
            MockUSDT mockUsdt = new MockUSDT();
            usdtAddress = address(mockUsdt);
            // Mint 1 000 000 USDT to deployer for test markets and agent funding
            mockUsdt.mint(deployer, 1_000_000e6);
            console.log("[1/5] MockUSDT deployed  :", usdtAddress);
            console.log("      Minted 1_000_000 USDT to deployer");
        } else {
            console.log("[1/5] Using existing USDT:", usdtAddress);
        }

        // Step B: ProphetFactory
        ProphetFactory factory = new ProphetFactory(
            usdtAddress,
            oracleAgent,
            marketMaker,
            treasury
        );
        console.log("[2/5] ProphetFactory      :", address(factory));

        // Step C: Predict vault and distributor addresses.
        //
        // Both contracts reference each other in their constructors (immutables),
        // creating a circular dependency. We solve this by predicting the
        // address that the NEXT deployment (distributor) will land at, based on
        // the deployer's current nonce, BEFORE actually deploying distributor.
        //
        //   nonce N   -> PositionVault will land here
        //   nonce N+1 -> PayoutDistributor will land here
        //
        uint64  nextNonce            = vm.getNonce(deployer);
        address predictedVault       = vm.computeCreateAddress(deployer, nextNonce);
        address predictedDistributor = vm.computeCreateAddress(deployer, nextNonce + 1);

        console.log("      Predicted vault      :", predictedVault);
        console.log("      Predicted distributor:", predictedDistributor);

        // Step D: PositionVault -- passes the *predicted* distributor address
        PositionVault vault = new PositionVault(
            address(factory),
            oracleAgent,
            usdtAddress,
            predictedDistributor
        );
        require(
            address(vault) == predictedVault,
            "Deploy: vault address mismatch - check nonce logic"
        );
        console.log("[3/5] PositionVault       :", address(vault));

        // Step E: PayoutDistributor -- vault is already deployed, address is real
        PayoutDistributor distributor = new PayoutDistributor(
            address(factory),
            address(vault),
            oracleAgent,
            marketMaker,
            treasury,
            usdtAddress
        );
        require(
            address(distributor) == predictedDistributor,
            "Deploy: distributor address mismatch - check nonce logic"
        );
        console.log("[4/5] PayoutDistributor   :", address(distributor));

        // Step F: Wire vault + distributor into factory (can only be called once)
        factory.setVaultAndDistributor(address(vault), address(distributor));
        console.log("[5/5] Factory initialised - vault and distributor linked");

        vm.stopBroadcast();

        // ----------------------------------------------------------------
        // 4. Post-deployment summary
        // ----------------------------------------------------------------
        console.log("");
        console.log("=================================================");
        console.log("  DEPLOYMENT COMPLETE");
        console.log("=================================================");
        console.log("USDT_ADDRESS               =", usdtAddress);
        console.log("PROPHET_FACTORY_ADDRESS    =", address(factory));
        console.log("POSITION_VAULT_ADDRESS     =", address(vault));
        console.log("PAYOUT_DISTRIBUTOR_ADDRESS =", address(distributor));
        console.log("-------------------------------------------------");
        console.log("Explorer links (0G Galileo):");
        console.log("  Factory     https://chainscan-galileo.0g.ai/address/", address(factory));
        console.log("  Vault       https://chainscan-galileo.0g.ai/address/", address(vault));
        console.log("  Distributor https://chainscan-galileo.0g.ai/address/", address(distributor));
        console.log("-------------------------------------------------");
        console.log("Next steps - add these addresses to:");
        console.log("  contracts/.env          PROPHET_FACTORY_ADDRESS, POSITION_VAULT_ADDRESS");
        console.log("  agent/.env              PROPHET_FACTORY_ADDRESS, POSITION_VAULT_ADDRESS");
        console.log("  frontend/.env.local     NEXT_PUBLIC_FACTORY_ADDRESS, NEXT_PUBLIC_USDT_ADDRESS");
        console.log("=================================================");
    }

    // ----------------------------------------------------------------
    // Internal helpers
    // ----------------------------------------------------------------

    /**
     * @dev Read an address env var. Returns `fallback_` when:
     *      - the env var is not set
     *      - the env var is set to an empty string ""
     *      - the env var is set to the zero address
     */
    function _envAddress(
        string memory key,
        address fallback_
    ) internal view returns (address result) {
        string memory raw = vm.envOr(key, string(""));
        if (bytes(raw).length == 0) return fallback_;
        result = vm.parseAddress(raw);
        if (result == address(0)) return fallback_;
    }
}
