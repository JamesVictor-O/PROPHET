// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ProphetFactory.sol";
import "../src/MarketContract.sol";
import "../src/PositionVault.sol";
import "../src/PayoutDistributor.sol";
import "../src/interfaces/IMarketContract.sol";
import "../src/interfaces/IPositionVault.sol";
import "./helpers/MockUSDT.sol";

contract PositionVaultTest is Test {

    MockUSDT          usdt;
    ProphetFactory    factory;
    PositionVault     vault;
    PayoutDistributor distributor;
    MarketContract    market;

    address constant ORACLE       = address(0xA11CE);
    address constant MARKET_MAKER = address(0xB0B);
    address constant TREASURY     = address(0x7EA50);
    address constant ALICE        = address(0xA11CE2);
    address constant BOB          = address(0xB0B2);

    uint256 constant INITIAL_BALANCE = 10_000e6;
    uint256 constant ALICE_BET       = 300e6;
    uint256 constant BOB_BET         = 200e6;

    bytes32 constant SOURCES_HASH   = keccak256("ipfs://sources.json");
    bytes   constant VALID_ATTEST   = hex"deadbeef";
    bytes32 constant REASONING_HASH = keccak256("reasoning");

    uint256 MARKET_DEADLINE;

    // ── Events ────────────────────────────────────────────────────

    event PositionCommitted(address indexed market, address indexed bettor, uint256 collateralAmount, uint256 positionIndex);
    event PositionsRevealed(address indexed market, uint256 totalPositions, uint256 timestamp);
    event PositionsRefunded(address indexed market, uint256 totalRefunded, uint256 positionCount);

    // ── Setup ──────────────────────────────────────────────────────

    function setUp() public {
        usdt    = new MockUSDT();
        factory = new ProphetFactory(address(usdt), ORACLE, MARKET_MAKER, TREASURY);

        uint64  nonce                = vm.getNonce(address(this));
        address predictedVault       = computeCreateAddress(address(this), nonce);
        address predictedDistributor = computeCreateAddress(address(this), nonce + 1);

        vault       = new PositionVault(address(factory), ORACLE, address(usdt), predictedDistributor);
        distributor = new PayoutDistributor(
            address(factory), address(vault), ORACLE, MARKET_MAKER, TREASURY, address(usdt)
        );
        factory.setVaultAndDistributor(address(vault), address(distributor));

        factory.updateCreationBond(0);
        factory.updatePendingPeriod(1);

        MARKET_DEADLINE = block.timestamp + 48 hours;
        market = MarketContract(
            factory.createMarket("Will ETH hit $10k?", MARKET_DEADLINE, "crypto", SOURCES_HASH)
        );

        usdt.mint(ALICE, INITIAL_BALANCE);
        usdt.mint(BOB,   INITIAL_BALANCE);

        // Activate market through the pending filter
        vm.prank(ALICE);
        market.signalInterest();
        vm.warp(block.timestamp + 2);
        market.activateMarket();
    }

    // ── Internal helpers ───────────────────────────────────────────

    function _placeBet(address user, uint256 amount, bool direction) internal {
        vm.startPrank(user);
        usdt.approve(address(market), amount);
        market.placeBet(abi.encode(direction, amount), amount);
        vm.stopPrank();
    }

    function _resolveMarket(bool verdict) internal {
        vm.warp(MARKET_DEADLINE + 1);
        market.triggerResolution();
        vm.prank(ORACLE);
        market.postResolution(verdict, REASONING_HASH, VALID_ATTEST);
        vm.warp(block.timestamp + 25 hours);
        market.finalizeResolution();
    }

    function _buildRevealedPositions(
        address[] memory bettors,
        bool[]    memory directions,
        uint256[] memory amounts
    ) internal pure returns (IPositionVault.RevealedPosition[] memory positions) {
        positions = new IPositionVault.RevealedPosition[](bettors.length);
        for (uint256 i; i < bettors.length; ++i) {
            positions[i] = IPositionVault.RevealedPosition({
                bettor:           bettors[i],
                direction:        directions[i],
                collateralAmount: amounts[i]
            });
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────

    function test_Constructor_SetsImmutables() public {
        assertEq(vault.factory(),    address(factory));
        assertEq(vault.oracleAgent(), ORACLE);
        assertEq(vault.USDT(),        address(usdt));
    }

    function test_Constructor_RejectsZeroFactory() public {
        vm.expectRevert(IPositionVault.PositionVault__NotValidMarket.selector);
        new PositionVault(address(0), ORACLE, address(usdt), address(distributor));
    }

    function test_Constructor_RejectsZeroOracle() public {
        vm.expectRevert(IPositionVault.PositionVault__NotOracleAgent.selector);
        new PositionVault(address(factory), address(0), address(usdt), address(distributor));
    }

    function test_Constructor_RejectsZeroUSDT() public {
        vm.expectRevert(IPositionVault.PositionVault__ZeroCollateral.selector);
        new PositionVault(address(factory), ORACLE, address(0), address(distributor));
    }

    function test_Constructor_RejectsZeroDistributor() public {
        vm.expectRevert(IPositionVault.PositionVault__ZeroCollateral.selector);
        new PositionVault(address(factory), ORACLE, address(usdt), address(0));
    }

    // ─────────────────────────────────────────────────────────────
    // commitPosition (called via market.placeBet)
    // ─────────────────────────────────────────────────────────────

    function test_commitPosition_SingleBet_StoresPosition() public {
        _placeBet(ALICE, ALICE_BET, true);

        assertEq(vault.positionCount(address(market)), 1);
        assertEq(vault.getTotalCommitted(address(market)), ALICE_BET);
        assertTrue(vault.hasBet(address(market), ALICE));
    }

    function test_commitPosition_MultipleBets_AccumulatesCorrectly() public {
        _placeBet(ALICE, ALICE_BET, true);
        _placeBet(BOB,   BOB_BET,   false);

        assertEq(vault.positionCount(address(market)), 2);
        assertEq(vault.getTotalCommitted(address(market)), ALICE_BET + BOB_BET);
        assertTrue(vault.hasBet(address(market), ALICE));
        assertTrue(vault.hasBet(address(market), BOB));
    }

    function test_commitPosition_EmitsEvent() public {
        vm.startPrank(ALICE);
        usdt.approve(address(market), ALICE_BET);
        vm.expectEmit(true, true, false, true);
        emit PositionCommitted(address(market), ALICE, ALICE_BET, 0);
        market.placeBet(abi.encode(true), ALICE_BET);
        vm.stopPrank();
    }

    function test_commitPosition_StoresEncryptedCommitment() public {
        bytes memory commitment = abi.encode(true, ALICE_BET);
        vm.startPrank(ALICE);
        usdt.approve(address(market), ALICE_BET);
        market.placeBet(commitment, ALICE_BET);
        vm.stopPrank();

        IPositionVault.EncryptedPosition memory pos = vault.getEncryptedPosition(address(market), 0);
        assertEq(pos.bettor,              ALICE);
        assertEq(pos.collateralAmount,    ALICE_BET);
        assertEq(pos.encryptedCommitment, commitment);
        assertFalse(pos.revealed);
        assertGt(pos.timestamp, 0);
    }

    function test_commitPosition_RevertsCalledDirectly_NotValidMarket() public {
        // Calling vault directly without going through a valid market
        vm.expectRevert(IPositionVault.PositionVault__NotValidMarket.selector);
        vault.commitPosition(address(market), ALICE, hex"01", ALICE_BET);
    }

    function test_commitPosition_RevertsWhenMarketNotOpen() public {
        // Trigger resolution so market is no longer Open
        vm.warp(MARKET_DEADLINE + 1);
        market.triggerResolution();

        // Now try to bet — market.placeBet will revert on NotOpen first,
        // but even if we could get to vault it would see non-Open status.
        vm.startPrank(ALICE);
        usdt.approve(address(market), ALICE_BET);
        vm.expectRevert(IMarketContract.MarketContract__NotOpen.selector);
        market.placeBet(abi.encode(true), ALICE_BET);
        vm.stopPrank();
    }

    // ─────────────────────────────────────────────────────────────
    // revealPositions
    // ─────────────────────────────────────────────────────────────

    function test_revealPositions_Success_StoresRevealedPositions() public {
        _placeBet(ALICE, ALICE_BET, true);
        _placeBet(BOB,   BOB_BET,   false);
        _resolveMarket(true);

        address[] memory bettors    = new address[](2);
        bool[]    memory directions = new bool[](2);
        uint256[] memory amounts    = new uint256[](2);
        bettors[0] = ALICE; directions[0] = true;  amounts[0] = ALICE_BET;
        bettors[1] = BOB;   directions[1] = false; amounts[1] = BOB_BET;

        IPositionVault.RevealedPosition[] memory positions = _buildRevealedPositions(bettors, directions, amounts);

        vm.prank(ORACLE);
        vm.expectEmit(true, false, false, true);
        emit PositionsRevealed(address(market), 2, block.timestamp);
        vault.revealPositions(address(market), positions, VALID_ATTEST);

        assertTrue(vault.hasRevealed(address(market)));

        IPositionVault.RevealedPosition[] memory stored = vault.getRevealedPositions(address(market));
        assertEq(stored.length,             2);
        assertEq(stored[0].bettor,          ALICE);
        assertTrue(stored[0].direction);
        assertEq(stored[0].collateralAmount, ALICE_BET);
        assertEq(stored[1].bettor,          BOB);
        assertFalse(stored[1].direction);
        assertEq(stored[1].collateralAmount, BOB_BET);
    }

    function test_revealPositions_MarkesEncryptedPositionsAsRevealed() public {
        _placeBet(ALICE, ALICE_BET, true);
        _resolveMarket(true);

        IPositionVault.RevealedPosition[] memory positions = new IPositionVault.RevealedPosition[](1);
        positions[0] = IPositionVault.RevealedPosition({ bettor: ALICE, direction: true, collateralAmount: ALICE_BET });

        vm.prank(ORACLE);
        vault.revealPositions(address(market), positions, VALID_ATTEST);

        IPositionVault.EncryptedPosition memory enc = vault.getEncryptedPosition(address(market), 0);
        assertTrue(enc.revealed);
    }

    function test_revealPositions_TriggersPayout() public {
        _placeBet(ALICE, ALICE_BET, true);
        _placeBet(BOB,   BOB_BET,   false);
        _resolveMarket(true); // YES wins

        uint256 aliceBefore = usdt.balanceOf(ALICE);

        IPositionVault.RevealedPosition[] memory positions = new IPositionVault.RevealedPosition[](2);
        positions[0] = IPositionVault.RevealedPosition({ bettor: ALICE, direction: true,  collateralAmount: ALICE_BET });
        positions[1] = IPositionVault.RevealedPosition({ bettor: BOB,   direction: false, collateralAmount: BOB_BET   });

        vm.prank(ORACLE);
        vault.revealPositions(address(market), positions, VALID_ATTEST);

        // Alice (only YES bettor) gets net pool
        uint256 totalPool = ALICE_BET + BOB_BET; // 500e6
        uint256 netPool   = totalPool - (totalPool * 250 / 10_000); // 487_500_000
        assertEq(usdt.balanceOf(ALICE), aliceBefore + netPool);

        // Distributor marked this market as distributed
        assertTrue(distributor.hasDistributed(address(market)));
    }

    function test_revealPositions_RevertsNotOracle() public {
        _placeBet(ALICE, ALICE_BET, true);
        _resolveMarket(true);

        IPositionVault.RevealedPosition[] memory positions = new IPositionVault.RevealedPosition[](1);
        positions[0] = IPositionVault.RevealedPosition({ bettor: ALICE, direction: true, collateralAmount: ALICE_BET });

        vm.prank(ALICE);
        vm.expectRevert(IPositionVault.PositionVault__NotOracleAgent.selector);
        vault.revealPositions(address(market), positions, VALID_ATTEST);
    }

    function test_revealPositions_RevertsMarketNotResolved() public {
        _placeBet(ALICE, ALICE_BET, true);
        // Market is still Open

        IPositionVault.RevealedPosition[] memory positions = new IPositionVault.RevealedPosition[](1);
        positions[0] = IPositionVault.RevealedPosition({ bettor: ALICE, direction: true, collateralAmount: ALICE_BET });

        vm.prank(ORACLE);
        vm.expectRevert(IPositionVault.PositionVault__MarketNotResolved.selector);
        vault.revealPositions(address(market), positions, VALID_ATTEST);
    }

    function test_revealPositions_RevertsAlreadyRevealed() public {
        _placeBet(ALICE, ALICE_BET, true);
        _resolveMarket(true);

        IPositionVault.RevealedPosition[] memory positions = new IPositionVault.RevealedPosition[](1);
        positions[0] = IPositionVault.RevealedPosition({ bettor: ALICE, direction: true, collateralAmount: ALICE_BET });

        vm.prank(ORACLE);
        vault.revealPositions(address(market), positions, VALID_ATTEST);

        vm.prank(ORACLE);
        vm.expectRevert(IPositionVault.PositionVault__AlreadyRevealed.selector);
        vault.revealPositions(address(market), positions, VALID_ATTEST);
    }

    function test_revealPositions_RevertsNoPositions() public {
        // No bets placed — vault has 0 encrypted positions
        _resolveMarket(true);

        IPositionVault.RevealedPosition[] memory empty = new IPositionVault.RevealedPosition[](0);
        vm.prank(ORACLE);
        vm.expectRevert(IPositionVault.PositionVault__NoPositionsToReveal.selector);
        vault.revealPositions(address(market), empty, VALID_ATTEST);
    }

    function test_revealPositions_RevertsPositionCountMismatch() public {
        _placeBet(ALICE, ALICE_BET, true);
        _placeBet(BOB,   BOB_BET,   false);
        _resolveMarket(true);

        // Only provide 1 revealed position for 2 stored
        IPositionVault.RevealedPosition[] memory positions = new IPositionVault.RevealedPosition[](1);
        positions[0] = IPositionVault.RevealedPosition({ bettor: ALICE, direction: true, collateralAmount: ALICE_BET });

        vm.prank(ORACLE);
        vm.expectRevert(
            abi.encodeWithSelector(IPositionVault.PositionVault__PositionCountMismatch.selector, 2, 1)
        );
        vault.revealPositions(address(market), positions, VALID_ATTEST);
    }

    function test_revealPositions_RevertsEmptyTeeProof() public {
        _placeBet(ALICE, ALICE_BET, true);
        _resolveMarket(true);

        IPositionVault.RevealedPosition[] memory positions = new IPositionVault.RevealedPosition[](1);
        positions[0] = IPositionVault.RevealedPosition({ bettor: ALICE, direction: true, collateralAmount: ALICE_BET });

        vm.prank(ORACLE);
        vm.expectRevert(IPositionVault.PositionVault__InvalidTeeProof.selector);
        vault.revealPositions(address(market), positions, new bytes(0));
    }

    // ─────────────────────────────────────────────────────────────
    // refundAll (called via market.cancelMarket → vault.refundAll)
    // ─────────────────────────────────────────────────────────────

    function test_refundAll_Success_RefundsAllBettors() public {
        _placeBet(ALICE, ALICE_BET, true);
        _placeBet(BOB,   BOB_BET,   false);

        uint256 aliceAfterBet = usdt.balanceOf(ALICE);
        uint256 bobAfterBet   = usdt.balanceOf(BOB);

        vm.warp(MARKET_DEADLINE + 1);
        market.triggerResolution();

        vm.prank(ORACLE);
        market.cancelMarket("INCONCLUSIVE");

        assertEq(usdt.balanceOf(ALICE), aliceAfterBet + ALICE_BET);
        assertEq(usdt.balanceOf(BOB),   bobAfterBet   + BOB_BET);
        assertEq(usdt.balanceOf(address(vault)), 0);
    }

    function test_refundAll_EmptyMarket_NoRevert() public {
        vm.warp(MARKET_DEADLINE + 1);
        market.triggerResolution();

        vm.prank(ORACLE);
        market.cancelMarket("INCONCLUSIVE");
        // No positions — refundAll returns early without revert
    }

    function test_refundAll_RevertsIfCalledDirectly_NotMarket() public {
        vm.warp(MARKET_DEADLINE + 1);
        market.triggerResolution();
        vm.prank(ORACLE);
        market.cancelMarket("INCONCLUSIVE");

        // Call refundAll directly (msg.sender != market address)
        vm.prank(ALICE);
        vm.expectRevert(IPositionVault.PositionVault__NotValidMarket.selector);
        vault.refundAll(address(market));
    }

    function test_refundAll_RevertsWhenMarketNotCancelled() public {
        // Market is still Open — cancel not triggered
        vm.prank(address(market)); // simulate market calling vault directly
        vm.expectRevert(IPositionVault.PositionVault__MarketNotCancelled.selector);
        vault.refundAll(address(market));
    }

    // ─────────────────────────────────────────────────────────────
    // View Functions
    // ─────────────────────────────────────────────────────────────

    function test_positionCount_ZeroInitially() public {
        assertEq(vault.positionCount(address(market)), 0);
    }

    function test_positionCount_IncrementsWithBets() public {
        _placeBet(ALICE, ALICE_BET, true);
        assertEq(vault.positionCount(address(market)), 1);
        _placeBet(BOB, BOB_BET, false);
        assertEq(vault.positionCount(address(market)), 2);
    }

    function test_hasRevealed_FalseBeforeReveal() public {
        assertFalse(vault.hasRevealed(address(market)));
    }

    function test_hasRevealed_TrueAfterReveal() public {
        _placeBet(ALICE, ALICE_BET, true);
        _resolveMarket(true);

        IPositionVault.RevealedPosition[] memory positions = new IPositionVault.RevealedPosition[](1);
        positions[0] = IPositionVault.RevealedPosition({ bettor: ALICE, direction: true, collateralAmount: ALICE_BET });

        vm.prank(ORACLE);
        vault.revealPositions(address(market), positions, VALID_ATTEST);

        assertTrue(vault.hasRevealed(address(market)));
    }

    function test_hasBet_FalseForNonBettor() public {
        assertFalse(vault.hasBet(address(market), ALICE));
    }

    function test_getTotalCommitted_ReflectsAllBets() public {
        _placeBet(ALICE, ALICE_BET, true);
        _placeBet(BOB,   BOB_BET,   false);
        assertEq(vault.getTotalCommitted(address(market)), ALICE_BET + BOB_BET);
    }

    function test_getRevealedPositions_EmptyBeforeReveal() public {
        IPositionVault.RevealedPosition[] memory revealed = vault.getRevealedPositions(address(market));
        assertEq(revealed.length, 0);
    }

    // ─────────────────────────────────────────────────────────────
    // Multi-market isolation
    // ─────────────────────────────────────────────────────────────

    function test_VaultIsolatesBetweenMarkets() public {
        // Create a second market
        MarketContract market2 = MarketContract(
            factory.createMarket("Second market?", block.timestamp + 2 hours, "sports", SOURCES_HASH)
        );

        _placeBet(ALICE, ALICE_BET, true); // bet on market 1

        // market2 vault state unaffected
        assertEq(vault.positionCount(address(market)),  1);
        assertEq(vault.positionCount(address(market2)), 0);
        assertFalse(vault.hasBet(address(market2), ALICE));
    }
}
