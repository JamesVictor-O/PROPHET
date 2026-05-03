// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ProphetFactory.sol";
import "../src/PositionVault.sol";
import "../src/PayoutDistributor.sol";
import "../src/MarketContract.sol";
import "../src/libraries/MarketLib.sol";
import "../src/interfaces/IMarketContract.sol";
import "./helpers/MockUSDT.sol";

contract ProphetFactoryTest is Test {

    MockUSDT          usdt;
    ProphetFactory    factory;
    PositionVault     vault;
    PayoutDistributor distributor;

    address constant ORACLE        = address(0xA11CE);
    address constant MARKET_MAKER  = address(0xB0B);
    address constant TREASURY      = address(0x7EA50);
    address constant ALICE         = address(0xA11CE2);
    address constant BOB           = address(0xB0B2);

    bytes32 constant SOURCES_HASH = keccak256("ipfs://sources.json");

    // ── Events ────────────────────────────────────────────────────

    event MarketCreated(
        address indexed marketAddress,
        address indexed creator,
        string  question,
        uint256 deadline,
        string  category,
        bytes32 resolutionSourcesHash,
        uint256 indexed marketIndex
    );
    event VaultAndDistributorSet(address positionVault, address payoutDistributor);
    event TreasuryUpdated(address oldTreasury, address newTreasury);
    event CreationBondAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event FactoryPaused(address by);
    event FactoryUnpaused(address by);

    // ── Setup ──────────────────────────────────────────────────────

    function setUp() public {
        usdt    = new MockUSDT();
        factory = new ProphetFactory(address(usdt), ORACLE, MARKET_MAKER, TREASURY);

        // Resolve the circular-dependency between vault and distributor using address prediction
        uint64  nonce                = vm.getNonce(address(this));
        address predictedVault       = computeCreateAddress(address(this), nonce);
        address predictedDistributor = computeCreateAddress(address(this), nonce + 1);

        vault       = new PositionVault(address(factory), ORACLE, address(usdt), predictedDistributor);
        distributor = new PayoutDistributor(
            address(factory), address(vault), ORACLE, MARKET_MAKER, TREASURY, address(usdt)
        );

        assertEq(address(vault),       predictedVault,       "vault address mismatch");
        assertEq(address(distributor), predictedDistributor, "distributor address mismatch");

        factory.setVaultAndDistributor(address(vault), address(distributor));

        // Disable bond for tests that don't test the bond mechanism
        factory.updateCreationBond(0);

        // Mint USDT to test users for tests that DO test bond
        usdt.mint(ALICE, 100e6);
        usdt.mint(BOB,   100e6);
    }

    // Helper: create a market (opens immediately — no pending period)
    function _createAndActivateMarket(string memory q) internal returns (address m) {
        m = factory.createMarket(q, block.timestamp + 2 hours, "crypto", SOURCES_HASH);
    }

    // ─────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────

    function test_Constructor_SetsAllImmutables() public {
        ProphetFactory f = new ProphetFactory(address(usdt), ORACLE, MARKET_MAKER, TREASURY);
        assertEq(f.USDT(),             address(usdt));
        assertEq(f.oracleAgent(),      ORACLE);
        assertEq(f.marketMakerAgent(), MARKET_MAKER);
        assertEq(f.protocolTreasury(), TREASURY);
        assertEq(f.owner(),            address(this));
        assertFalse(f.paused());
        assertEq(f.totalMarketsCreated(), 0);
        assertEq(f.positionVault(),    address(0));
        assertEq(f.payoutDistributor(), address(0));
    }

    function test_Constructor_RejectsZeroUSDT() public {
        vm.expectRevert(ProphetFactory.ProphetFactory__ZeroAddress.selector);
        new ProphetFactory(address(0), ORACLE, MARKET_MAKER, TREASURY);
    }

    function test_Constructor_RejectsZeroOracle() public {
        vm.expectRevert(ProphetFactory.ProphetFactory__ZeroAddress.selector);
        new ProphetFactory(address(usdt), address(0), MARKET_MAKER, TREASURY);
    }

    function test_Constructor_RejectsZeroMarketMaker() public {
        vm.expectRevert(ProphetFactory.ProphetFactory__ZeroAddress.selector);
        new ProphetFactory(address(usdt), ORACLE, address(0), TREASURY);
    }

    function test_Constructor_RejectsZeroTreasury() public {
        vm.expectRevert(ProphetFactory.ProphetFactory__ZeroAddress.selector);
        new ProphetFactory(address(usdt), ORACLE, MARKET_MAKER, address(0));
    }

    // ─────────────────────────────────────────────────────────────
    // setVaultAndDistributor
    // ─────────────────────────────────────────────────────────────

    function test_setVaultAndDistributor_SetsAddresses() public {
        ProphetFactory f = new ProphetFactory(address(usdt), ORACLE, MARKET_MAKER, TREASURY);
        assertEq(f.positionVault(),    address(0));
        assertEq(f.payoutDistributor(), address(0));

        f.setVaultAndDistributor(address(vault), address(distributor));

        assertEq(f.positionVault(),    address(vault));
        assertEq(f.payoutDistributor(), address(distributor));
    }

    function test_setVaultAndDistributor_EmitsEvent() public {
        ProphetFactory f = new ProphetFactory(address(usdt), ORACLE, MARKET_MAKER, TREASURY);
        vm.expectEmit(false, false, false, true);
        emit VaultAndDistributorSet(address(vault), address(distributor));
        f.setVaultAndDistributor(address(vault), address(distributor));
    }

    function test_setVaultAndDistributor_OnlyOwner_Reverts() public {
        ProphetFactory f = new ProphetFactory(address(usdt), ORACLE, MARKET_MAKER, TREASURY);
        vm.prank(ALICE);
        vm.expectRevert(); // OwnableUnauthorizedAccount
        f.setVaultAndDistributor(address(vault), address(distributor));
    }

    function test_setVaultAndDistributor_RevertsIfAlreadyInitialized() public {
        // setUp already called setVaultAndDistributor on factory
        vm.expectRevert(ProphetFactory.ProphetFactory__AlreadyInitialized.selector);
        factory.setVaultAndDistributor(address(vault), address(distributor));
    }

    function test_setVaultAndDistributor_RejectsZeroVault() public {
        ProphetFactory f = new ProphetFactory(address(usdt), ORACLE, MARKET_MAKER, TREASURY);
        vm.expectRevert(ProphetFactory.ProphetFactory__ZeroAddress.selector);
        f.setVaultAndDistributor(address(0), address(distributor));
    }

    function test_setVaultAndDistributor_RejectsZeroDistributor() public {
        ProphetFactory f = new ProphetFactory(address(usdt), ORACLE, MARKET_MAKER, TREASURY);
        vm.expectRevert(ProphetFactory.ProphetFactory__ZeroAddress.selector);
        f.setVaultAndDistributor(address(vault), address(0));
    }

    // ─────────────────────────────────────────────────────────────
    // createMarket — preconditions
    // ─────────────────────────────────────────────────────────────

    function test_createMarket_RevertsIfNotInitialized() public {
        ProphetFactory f = new ProphetFactory(address(usdt), ORACLE, MARKET_MAKER, TREASURY);
        vm.expectRevert(ProphetFactory.ProphetFactory__NotInitialized.selector);
        f.createMarket("Will ETH hit $10k?", block.timestamp + 2 hours, "crypto", SOURCES_HASH);
    }

    function test_createMarket_RevertsIfPaused() public {
        factory.pause();
        vm.expectRevert(ProphetFactory.ProphetFactory__Paused.selector);
        factory.createMarket("Will ETH hit $10k?", block.timestamp + 2 hours, "crypto", SOURCES_HASH);
    }

    function test_createMarket_RevertsEmptyQuestion() public {
        vm.expectRevert(MarketLib.MarketLib__EmptyQuestion.selector);
        factory.createMarket("", block.timestamp + 2 hours, "crypto", SOURCES_HASH);
    }

    function test_createMarket_RevertsQuestionTooLong() public {
        bytes memory longQ = new bytes(281);
        for (uint256 i; i < 281; ++i) longQ[i] = 0x61; // 'a'
        vm.expectRevert();
        factory.createMarket(string(longQ), block.timestamp + 2 hours, "crypto", SOURCES_HASH);
    }

    function test_createMarket_RevertsInvalidCategory() public {
        vm.expectRevert();
        factory.createMarket("Question?", block.timestamp + 2 hours, "unicorn", SOURCES_HASH);
    }

    function test_createMarket_RevertsDeadlineTooSoon() public {
        vm.expectRevert();
        factory.createMarket("Question?", block.timestamp + 30 minutes, "crypto", SOURCES_HASH);
    }

    // ─────────────────────────────────────────────────────────────
    // createMarket — success paths
    // ─────────────────────────────────────────────────────────────

    function test_createMarket_Success_ReturnsNonZeroAddress() public {
        address m = factory.createMarket("Will ETH hit $10k?", block.timestamp + 2 hours, "crypto", SOURCES_HASH);
        assertTrue(m != address(0));
    }

    function test_createMarket_Success_RegistersMarket() public {
        address m = factory.createMarket("Q?", block.timestamp + 2 hours, "crypto", SOURCES_HASH);
        assertTrue(factory.isValidMarket(m));
        assertEq(factory.totalMarketsCreated(), 1);
        assertEq(factory.totalMarkets(), 1);
    }

    function test_createMarket_Success_EmitsEvent() public {
        uint256 dl = block.timestamp + 2 hours;
        // We don't know the market address ahead of time, so only check the indexed creator
        vm.expectEmit(false, true, true, false);
        emit MarketCreated(address(0), address(this), "Will ETH hit $10k?", dl, "crypto", SOURCES_HASH, 0);
        factory.createMarket("Will ETH hit $10k?", dl, "crypto", SOURCES_HASH);
    }

    function test_createMarket_Success_SetsMarketParameters() public {
        uint256 dl = block.timestamp + 2 hours;
        address m  = factory.createMarket("Will ETH hit $10k?", dl, "crypto", SOURCES_HASH);

        MarketContract mc = MarketContract(m);
        assertEq(mc.question(),               "Will ETH hit $10k?");
        assertEq(mc.deadline(),               dl);
        assertEq(mc.category(),               "crypto");
        assertEq(mc.resolutionSourcesHash(),  SOURCES_HASH);
        assertEq(mc.creator(),                address(this));
        assertEq(mc.factory(),                address(factory));
        assertEq(mc.oracleAgent(),            ORACLE);
        assertEq(mc.marketMakerAgent(),       MARKET_MAKER);
        assertEq(mc.positionVault(),          address(vault));
        assertEq(mc.payoutDistributor(),      address(distributor));
        assertEq(mc.USDT(),                   address(usdt));
        // Market starts in Pending — must pass the social filter before going Open
        assertEq(uint8(mc.status()), uint8(IMarketContract.MarketStatus.Pending));
    }

    function test_createMarket_Success_TracksCreator() public {
        uint256 dl = block.timestamp + 2 hours;
        vm.prank(ALICE);
        address m = factory.createMarket("Alice market?", dl, "crypto", SOURCES_HASH);

        address[] memory aliceMarkets = factory.getMarketsByCreator(ALICE);
        assertEq(aliceMarkets.length, 1);
        assertEq(aliceMarkets[0], m);
        assertEq(factory.getMarketsByCreator(BOB).length, 0);
    }

    function test_createMarket_MultipleMarkets_IncrementCounter() public {
        uint256 dl = block.timestamp + 2 hours;
        factory.createMarket("Q1?", dl, "crypto",   SOURCES_HASH);
        factory.createMarket("Q2?", dl, "sports",   SOURCES_HASH);
        factory.createMarket("Q3?", dl, "politics", SOURCES_HASH);

        assertEq(factory.totalMarketsCreated(), 3);
        assertEq(factory.totalMarkets(),        3);
    }

    function test_createMarket_AllValidCategories() public {
        string[5] memory cats = ["crypto", "sports", "politics", "finance", "custom"];
        uint256 dl = block.timestamp + 2 hours;
        for (uint256 i; i < cats.length; ++i) {
            address m = factory.createMarket("Test?", dl, cats[i], SOURCES_HASH);
            assertTrue(factory.isValidMarket(m));
        }
        assertEq(factory.totalMarketsCreated(), 5);
    }

    function test_createMarket_MaxLengthQuestion_Succeeds() public {
        bytes memory q280 = new bytes(280);
        for (uint256 i; i < 280; ++i) q280[i] = 0x61;
        address m = factory.createMarket(string(q280), block.timestamp + 2 hours, "crypto", SOURCES_HASH);
        assertTrue(factory.isValidMarket(m));
    }

    function test_createMarket_MultipleCreators_TrackedSeparately() public {
        uint256 dl = block.timestamp + 2 hours;
        vm.prank(ALICE);
        address m1 = factory.createMarket("Alice Q?", dl, "crypto", SOURCES_HASH);
        vm.prank(BOB);
        address m2 = factory.createMarket("Bob Q?",   dl, "sports", SOURCES_HASH);

        assertEq(factory.getMarketsByCreator(ALICE)[0], m1);
        assertEq(factory.getMarketsByCreator(BOB)[0],   m2);
    }

    // ─────────────────────────────────────────────────────────────
    // Creation Bond
    // ─────────────────────────────────────────────────────────────

    function test_CreationBond_RequiresApproval() public {
        factory.updateCreationBond(10e6);
        vm.expectRevert(); // ERC20InsufficientAllowance
        factory.createMarket("Q?", block.timestamp + 2 hours, "crypto", SOURCES_HASH);
    }

    function test_CreationBond_ForwardedToMarket() public {
        factory.updateCreationBond(10e6);
        usdt.mint(address(this), 10e6);
        usdt.approve(address(factory), 10e6);

        address m = factory.createMarket("Q?", block.timestamp + 2 hours, "crypto", SOURCES_HASH);

        // Bond sits in the market contract
        assertEq(usdt.balanceOf(m), 10e6);
        assertEq(MarketContract(m).creatorBond(), 10e6);
        assertEq(usdt.balanceOf(address(this)), 0);
    }

    function test_CreationBond_HeldByMarket() public {
        factory.updateCreationBond(10e6);
        usdt.mint(address(this), 10e6);
        usdt.approve(address(factory), 10e6);

        address m = factory.createMarket("Q?", block.timestamp + 2 hours, "crypto", SOURCES_HASH);
        assertEq(usdt.balanceOf(m), 10e6);
        assertEq(MarketContract(m).creatorBond(), 10e6);
    }

    function test_CreationBond_InsufficientBalance_Reverts() public {
        factory.updateCreationBond(10e6);
        // No mint — creator cannot pay bond
        usdt.approve(address(factory), 10e6);
        vm.expectRevert(); // ERC20InsufficientBalance
        factory.createMarket("Q?", block.timestamp + 2 hours, "crypto", SOURCES_HASH);
    }

    function test_CreationBond_ZeroAmount_NoUSDTMoved() public {
        // Explicit 0 bond (setUp default) — createMarket succeeds with no USDT on caller
        assertEq(factory.creationBondAmount(), 0);
        uint256 selfBefore = usdt.balanceOf(address(this));
        address m = factory.createMarket("Free?", block.timestamp + 2 hours, "crypto", SOURCES_HASH);
        assertEq(usdt.balanceOf(address(this)), selfBefore);
        assertEq(usdt.balanceOf(m), 0);
        assertEq(MarketContract(m).creatorBond(), 0);
    }

    function test_updateCreationBond_OnlyOwner() public {
        vm.prank(ALICE);
        vm.expectRevert();
        factory.updateCreationBond(50e6);
    }

    function test_updateCreationBond_EmitsEvent() public {
        vm.expectEmit(false, false, false, true);
        emit CreationBondAmountUpdated(0, 25e6);
        factory.updateCreationBond(25e6);
        assertEq(factory.creationBondAmount(), 25e6);
    }

    // ─────────────────────────────────────────────────────────────
    // getMarkets pagination
    // ─────────────────────────────────────────────────────────────

    function test_getMarkets_EmptyRegistry_Reverts() public {
        vm.expectRevert(ProphetFactory.ProphetFactory__InvalidOffset.selector);
        factory.getMarkets(0, 10);
    }

    function test_getMarkets_SingleMarket() public {
        address m = factory.createMarket("Q?", block.timestamp + 2 hours, "crypto", SOURCES_HASH);
        address[] memory result = factory.getMarkets(0, 10);
        assertEq(result.length, 1);
        assertEq(result[0], m);
    }

    function test_getMarkets_Pagination_FirstPage() public {
        uint256 dl = block.timestamp + 2 hours;
        for (uint256 i; i < 5; ++i) factory.createMarket("Q?", dl, "crypto", SOURCES_HASH);

        address[] memory page = factory.getMarkets(0, 3);
        assertEq(page.length, 3);
    }

    function test_getMarkets_Pagination_SecondPage() public {
        uint256 dl = block.timestamp + 2 hours;
        for (uint256 i; i < 5; ++i) factory.createMarket("Q?", dl, "crypto", SOURCES_HASH);

        address[] memory page = factory.getMarkets(3, 10); // limit clipped to remaining 2
        assertEq(page.length, 2);
    }

    function test_getMarkets_InvalidOffset_Reverts() public {
        factory.createMarket("Q?", block.timestamp + 2 hours, "crypto", SOURCES_HASH);
        vm.expectRevert(ProphetFactory.ProphetFactory__InvalidOffset.selector);
        factory.getMarkets(1, 10); // only 1 market, offset=1 is out-of-bounds
    }

    function test_getMarkets_LimitTooHigh_Reverts() public {
        factory.createMarket("Q?", block.timestamp + 2 hours, "crypto", SOURCES_HASH);
        vm.expectRevert(ProphetFactory.ProphetFactory__LimitTooHigh.selector);
        factory.getMarkets(0, 101);
    }

    // ─────────────────────────────────────────────────────────────
    // isValidMarket
    // ─────────────────────────────────────────────────────────────

    function test_isValidMarket_False_ForRandomAddress() public {
        assertFalse(factory.isValidMarket(address(0xDEAD)));
    }

    function test_isValidMarket_True_ForDeployedMarket() public {
        address m = factory.createMarket("Q?", block.timestamp + 2 hours, "crypto", SOURCES_HASH);
        assertTrue(factory.isValidMarket(m));
    }

    // ─────────────────────────────────────────────────────────────
    // Admin — updateTreasury
    // ─────────────────────────────────────────────────────────────

    function test_updateTreasury_Success() public {
        address newT = makeAddr("newTreasury");
        vm.expectEmit(false, false, false, true);
        emit TreasuryUpdated(TREASURY, newT);
        factory.updateTreasury(newT);
        assertEq(factory.protocolTreasury(), newT);
    }

    function test_updateTreasury_OnlyOwner_Reverts() public {
        vm.prank(ALICE);
        vm.expectRevert();
        factory.updateTreasury(makeAddr("newT"));
    }

    function test_updateTreasury_RejectsZeroAddress() public {
        vm.expectRevert(ProphetFactory.ProphetFactory__ZeroAddress.selector);
        factory.updateTreasury(address(0));
    }

    // ─────────────────────────────────────────────────────────────
    // Admin — pause / unpause
    // ─────────────────────────────────────────────────────────────

    function test_pause_SetsFlag() public {
        vm.expectEmit(false, false, false, true);
        emit FactoryPaused(address(this));
        factory.pause();
        assertTrue(factory.paused());
    }

    function test_pause_OnlyOwner_Reverts() public {
        vm.prank(ALICE);
        vm.expectRevert();
        factory.pause();
    }

    function test_unpause_ClearsFlag() public {
        factory.pause();
        vm.expectEmit(false, false, false, true);
        emit FactoryUnpaused(address(this));
        factory.unpause();
        assertFalse(factory.paused());
    }

    function test_unpause_OnlyOwner_Reverts() public {
        factory.pause();
        vm.prank(ALICE);
        vm.expectRevert();
        factory.unpause();
    }

    function test_pause_Unpause_CreateMarket_Cycle() public {
        factory.pause();
        vm.expectRevert(ProphetFactory.ProphetFactory__Paused.selector);
        factory.createMarket("Q?", block.timestamp + 2 hours, "crypto", SOURCES_HASH);

        factory.unpause();
        address m = factory.createMarket("Q?", block.timestamp + 2 hours, "crypto", SOURCES_HASH);
        assertTrue(factory.isValidMarket(m));
    }
}
