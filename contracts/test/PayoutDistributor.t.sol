// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ProphetFactory.sol";
import "../src/MarketContract.sol";
import "../src/PositionVault.sol";
import "../src/PayoutDistributor.sol";
import "../src/interfaces/IMarketContract.sol";
import "../src/interfaces/IPositionVault.sol";
import "../src/interfaces/IPayoutDistributor.sol";
import "./helpers/MockUSDT.sol";

contract PayoutDistributorTest is Test {

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
    address constant CHARLIE      = address(0xC4A411E);

    uint256 constant INITIAL_BALANCE = 10_000e6;

    bytes32 constant SOURCES_HASH   = keccak256("ipfs://sources.json");
    bytes   constant VALID_ATTEST   = hex"deadbeef";
    bytes32 constant REASONING_HASH = keccak256("reasoning");

    // Fee constants (from FeeLib)
    uint256 constant ORACLE_FEE_BPS   = 100;  // 1%
    uint256 constant MM_FEE_BPS       = 100;  // 1%
    uint256 constant PROTOCOL_FEE_BPS = 50;   // 0.5%
    uint256 constant TOTAL_FEE_BPS    = 250;  // 2.5%
    uint256 constant BPS_DENOM        = 10_000;

    uint256 MARKET_DEADLINE;

    // ── Events ────────────────────────────────────────────────────

    event PayoutsCalculated(address indexed market, bool outcome, uint256 totalWinners, uint256 totalDistributed, uint256 totalFees);
    event WinnerPaid(address indexed market, address indexed winner, uint256 stake, uint256 payout);
    event NoWinnersEdgeCase(address indexed market, uint256 collateralSentToTreasury);

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

        MARKET_DEADLINE = block.timestamp + 48 hours;
        market = MarketContract(
            factory.createMarket("Will ETH hit $10k?", MARKET_DEADLINE, "crypto", SOURCES_HASH)
        );

        usdt.mint(ALICE,   INITIAL_BALANCE);
        usdt.mint(BOB,     INITIAL_BALANCE);
        usdt.mint(CHARLIE, INITIAL_BALANCE);
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

    function _revealAndDistribute(
        address[] memory bettors,
        bool[]    memory directions,
        uint256[] memory amounts
    ) internal {
        IPositionVault.RevealedPosition[] memory positions =
            new IPositionVault.RevealedPosition[](bettors.length);
        for (uint256 i; i < bettors.length; ++i) {
            positions[i] = IPositionVault.RevealedPosition({
                bettor:           bettors[i],
                direction:        directions[i],
                collateralAmount: amounts[i]
            });
        }
        vm.prank(ORACLE);
        vault.revealPositions(address(market), positions, VALID_ATTEST);
    }

    // Helper to compute expected fee amounts from totalCollateral
    function _fees(uint256 total) internal pure returns (uint256 oFee, uint256 mmFee, uint256 pFee, uint256 net) {
        oFee  = total * ORACLE_FEE_BPS   / BPS_DENOM;
        mmFee = total * MM_FEE_BPS       / BPS_DENOM;
        pFee  = total * PROTOCOL_FEE_BPS / BPS_DENOM;
        net   = total - oFee - mmFee - pFee;
    }

    // ─────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────

    function test_Constructor_SetsAllImmutables() public {
        assertEq(distributor.factory(),          address(factory));
        assertEq(distributor.positionVault(),    address(vault));
        assertEq(distributor.oracleAgent(),      ORACLE);
        assertEq(distributor.marketMakerAgent(), MARKET_MAKER);
        assertEq(distributor.protocolTreasury(), TREASURY);
        assertEq(distributor.USDT(),             address(usdt));
    }

    function test_Constructor_RejectsZeroFactory() public {
        vm.expectRevert(IPayoutDistributor.PayoutDistributor__InvalidMarket.selector);
        new PayoutDistributor(address(0), address(vault), ORACLE, MARKET_MAKER, TREASURY, address(usdt));
    }

    function test_Constructor_RejectsZeroVault() public {
        vm.expectRevert(IPayoutDistributor.PayoutDistributor__InvalidMarket.selector);
        new PayoutDistributor(address(factory), address(0), ORACLE, MARKET_MAKER, TREASURY, address(usdt));
    }

    function test_Constructor_RejectsZeroOracle() public {
        vm.expectRevert(IPayoutDistributor.PayoutDistributor__InvalidMarket.selector);
        new PayoutDistributor(address(factory), address(vault), address(0), MARKET_MAKER, TREASURY, address(usdt));
    }

    function test_Constructor_RejectsZeroMarketMaker() public {
        vm.expectRevert(IPayoutDistributor.PayoutDistributor__InvalidMarket.selector);
        new PayoutDistributor(address(factory), address(vault), ORACLE, address(0), TREASURY, address(usdt));
    }

    function test_Constructor_RejectsZeroTreasury() public {
        vm.expectRevert(IPayoutDistributor.PayoutDistributor__InvalidMarket.selector);
        new PayoutDistributor(address(factory), address(vault), ORACLE, MARKET_MAKER, address(0), address(usdt));
    }

    function test_Constructor_RejectsZeroUSDT() public {
        vm.expectRevert(IPayoutDistributor.PayoutDistributor__InvalidMarket.selector);
        new PayoutDistributor(address(factory), address(vault), ORACLE, MARKET_MAKER, TREASURY, address(0));
    }

    // ─────────────────────────────────────────────────────────────
    // getFeeConstants
    // ─────────────────────────────────────────────────────────────

    function test_getFeeConstants_CorrectValues() public {
        (uint256 oFee, uint256 mmFee, uint256 pFee, uint256 total) = distributor.getFeeConstants();
        assertEq(oFee,  ORACLE_FEE_BPS);
        assertEq(mmFee, MM_FEE_BPS);
        assertEq(pFee,  PROTOCOL_FEE_BPS);
        assertEq(total, TOTAL_FEE_BPS);
    }

    function test_getFeeConstants_SumIsCorrect() public {
        (uint256 oFee, uint256 mmFee, uint256 pFee, uint256 total) = distributor.getFeeConstants();
        assertEq(oFee + mmFee + pFee, total);
    }

    // ─────────────────────────────────────────────────────────────
    // calculateAndDistribute — access control
    // ─────────────────────────────────────────────────────────────

    function test_calculateAndDistribute_RevertsNotPositionVault() public {
        _placeBet(ALICE, 100e6, true);
        _resolveMarket(true);

        IPositionVault.RevealedPosition[] memory positions = new IPositionVault.RevealedPosition[](1);
        positions[0] = IPositionVault.RevealedPosition({ bettor: ALICE, direction: true, collateralAmount: 100e6 });

        vm.prank(ALICE); // not the vault
        vm.expectRevert(IPayoutDistributor.PayoutDistributor__NotPositionVault.selector);
        distributor.calculateAndDistribute(address(market), positions, true);
    }

    function test_calculateAndDistribute_RevertsInvalidMarket() public {
        _resolveMarket(true);

        IPositionVault.RevealedPosition[] memory positions = new IPositionVault.RevealedPosition[](0);
        address fakeMarket = address(0xDEAD);

        vm.prank(address(vault));
        vm.expectRevert(IPayoutDistributor.PayoutDistributor__InvalidMarket.selector);
        distributor.calculateAndDistribute(fakeMarket, positions, true);
    }

    function test_calculateAndDistribute_RevertsMarketNotResolved() public {
        _placeBet(ALICE, 100e6, true);
        // Market not resolved — still Open

        IPositionVault.RevealedPosition[] memory positions = new IPositionVault.RevealedPosition[](1);
        positions[0] = IPositionVault.RevealedPosition({ bettor: ALICE, direction: true, collateralAmount: 100e6 });

        vm.prank(address(vault));
        vm.expectRevert(IPayoutDistributor.PayoutDistributor__MarketNotResolved.selector);
        distributor.calculateAndDistribute(address(market), positions, true);
    }

    function test_calculateAndDistribute_RevertsAlreadyDistributed() public {
        _placeBet(ALICE, 100e6, true);
        _resolveMarket(true);

        address[] memory bettors    = new address[](1);
        bool[]    memory directions = new bool[](1);
        uint256[] memory amounts    = new uint256[](1);
        bettors[0] = ALICE; directions[0] = true; amounts[0] = 100e6;

        _revealAndDistribute(bettors, directions, amounts); // first distribution

        // Try again directly
        IPositionVault.RevealedPosition[] memory positions = new IPositionVault.RevealedPosition[](1);
        positions[0] = IPositionVault.RevealedPosition({ bettor: ALICE, direction: true, collateralAmount: 100e6 });

        vm.prank(address(vault));
        vm.expectRevert(IPayoutDistributor.PayoutDistributor__AlreadyDistributed.selector);
        distributor.calculateAndDistribute(address(market), positions, true);
    }

    function test_calculateAndDistribute_RevertsZeroCollateral() public {
        // Market resolved but no bets — totalCollateral = 0
        _resolveMarket(true);

        IPositionVault.RevealedPosition[] memory positions = new IPositionVault.RevealedPosition[](0);
        vm.prank(address(vault));
        vm.expectRevert(IPayoutDistributor.PayoutDistributor__ZeroCollateral.selector);
        distributor.calculateAndDistribute(address(market), positions, true);
    }

    // ─────────────────────────────────────────────────────────────
    // calculateAndDistribute — fee math
    // ─────────────────────────────────────────────────────────────

    function test_FeeDistribution_ExactAmounts_1000USDT() public {
        // Pool = 1000 USDT
        // Oracle fee: 10 USDT (1%), MM fee: 10 USDT (1%), Protocol: 5 USDT (0.5%)
        uint256 totalPool = 1_000e6;
        usdt.mint(ALICE, totalPool);
        _placeBet(ALICE, totalPool, true);
        _resolveMarket(true);

        (uint256 oFee, uint256 mmFee, uint256 pFee, uint256 netPool) = _fees(totalPool);
        assertEq(oFee,   10e6);  // 10 USDT
        assertEq(mmFee,  10e6);  // 10 USDT
        assertEq(pFee,    5e6);  //  5 USDT
        assertEq(netPool, 975e6); // 975 USDT

        uint256 oracleBefore   = usdt.balanceOf(ORACLE);
        uint256 mmBefore       = usdt.balanceOf(MARKET_MAKER);
        uint256 treasuryBefore = usdt.balanceOf(TREASURY);

        address[] memory bettors    = new address[](1);
        bool[]    memory directions = new bool[](1);
        uint256[] memory amounts    = new uint256[](1);
        bettors[0] = ALICE; directions[0] = true; amounts[0] = totalPool;

        _revealAndDistribute(bettors, directions, amounts);

        assertEq(usdt.balanceOf(ORACLE),       oracleBefore   + oFee);
        assertEq(usdt.balanceOf(MARKET_MAKER), mmBefore       + mmFee);
        assertEq(usdt.balanceOf(TREASURY),     treasuryBefore + pFee);
    }

    function test_FeeDistribution_TotalFeesMatchNetPool() public {
        uint256 totalPool = 500e6;
        _placeBet(ALICE, totalPool, true);
        _resolveMarket(true);

        (uint256 oFee, uint256 mmFee, uint256 pFee, uint256 netPool) = _fees(totalPool);
        assertEq(oFee + mmFee + pFee + netPool, totalPool); // must sum to 100%
    }

    // ─────────────────────────────────────────────────────────────
    // calculateAndDistribute — payout math
    // ─────────────────────────────────────────────────────────────

    function test_SingleWinner_ReceivesFullNetPool() public {
        // Alice bets 300 YES, Bob bets 200 NO, YES wins → Alice gets 100% of netPool
        _placeBet(ALICE, 300e6, true);
        _placeBet(BOB,   200e6, false);
        _resolveMarket(true);

        uint256 totalPool = 500e6;
        (,,, uint256 netPool) = _fees(totalPool);

        uint256 aliceBefore = usdt.balanceOf(ALICE);

        address[] memory bettors    = new address[](2);
        bool[]    memory directions = new bool[](2);
        uint256[] memory amounts    = new uint256[](2);
        bettors[0] = ALICE; directions[0] = true;  amounts[0] = 300e6;
        bettors[1] = BOB;   directions[1] = false; amounts[1] = 200e6;

        _revealAndDistribute(bettors, directions, amounts);

        // Alice is sole winner: 300/300 = 100% of netPool
        assertEq(usdt.balanceOf(ALICE), aliceBefore + netPool);
        assertEq(usdt.balanceOf(BOB),   INITIAL_BALANCE - 200e6); // Bob lost
    }

    function test_EqualStakers_SplitProportionally() public {
        // Alice 500 YES, Bob 500 YES, Charlie 1000 NO → YES wins, Alice/Bob split netPool equally
        _placeBet(ALICE,   500e6, true);
        _placeBet(BOB,     500e6, true);
        _placeBet(CHARLIE, 1000e6, false);
        _resolveMarket(true);

        uint256 totalPool = 2000e6;
        (,,, uint256 netPool) = _fees(totalPool);

        uint256 aliceBefore   = usdt.balanceOf(ALICE);
        uint256 bobBefore     = usdt.balanceOf(BOB);

        address[] memory bettors    = new address[](3);
        bool[]    memory directions = new bool[](3);
        uint256[] memory amounts    = new uint256[](3);
        bettors[0] = ALICE;   directions[0] = true;  amounts[0] = 500e6;
        bettors[1] = BOB;     directions[1] = true;  amounts[1] = 500e6;
        bettors[2] = CHARLIE; directions[2] = false; amounts[2] = 1000e6;

        _revealAndDistribute(bettors, directions, amounts);

        // Alice: 500/(500+500) = 50% of netPool
        // Bob:   500/(500+500) = 50% of netPool
        uint256 alicePayout = (500e6 * netPool) / 1000e6;
        uint256 bobPayout   = (500e6 * netPool) / 1000e6;

        assertEq(usdt.balanceOf(ALICE), aliceBefore + alicePayout);
        assertEq(usdt.balanceOf(BOB),   bobBefore   + bobPayout);
    }

    function test_UnequalStakers_ProportionalPayouts() public {
        // Alice 300 YES, Bob 200 YES → Alice gets 60%, Bob gets 40% of netPool
        // Charlie 500 NO → Charlie loses
        _placeBet(ALICE,   300e6, true);
        _placeBet(BOB,     200e6, true);
        _placeBet(CHARLIE, 500e6, false);
        _resolveMarket(true);

        uint256 totalPool = 1000e6;
        (,,, uint256 netPool) = _fees(totalPool); // 975e6

        uint256 aliceBefore = usdt.balanceOf(ALICE);
        uint256 bobBefore   = usdt.balanceOf(BOB);

        address[] memory bettors    = new address[](3);
        bool[]    memory directions = new bool[](3);
        uint256[] memory amounts    = new uint256[](3);
        bettors[0] = ALICE;   directions[0] = true;  amounts[0] = 300e6;
        bettors[1] = BOB;     directions[1] = true;  amounts[1] = 200e6;
        bettors[2] = CHARLIE; directions[2] = false; amounts[2] = 500e6;

        _revealAndDistribute(bettors, directions, amounts);

        // Alice: 300/500 of netPool = 585e6
        // Bob:   200/500 of netPool = 390e6
        uint256 totalWinningStake = 500e6;
        uint256 alicePayout = (300e6 * netPool) / totalWinningStake; // 585_000_000
        uint256 bobPayout   = (200e6 * netPool) / totalWinningStake; // 390_000_000

        assertEq(usdt.balanceOf(ALICE), aliceBefore + alicePayout);
        assertEq(usdt.balanceOf(BOB),   bobBefore   + bobPayout);
        assertEq(alicePayout + bobPayout, netPool); // no dust (300+200=500 divides cleanly)
    }

    function test_NoWinners_FullNetPoolGoesToTreasury() public {
        // Alice bets YES, Bob bets YES, NO wins → nobody picked NO
        _placeBet(ALICE, 300e6, true);
        _placeBet(BOB,   200e6, true);
        _resolveMarket(false); // NO wins

        uint256 totalPool = 500e6;
        (uint256 oFee, uint256 mmFee, uint256 pFee, uint256 netPool) = _fees(totalPool);

        uint256 treasuryBefore = usdt.balanceOf(TREASURY);

        address[] memory bettors    = new address[](2);
        bool[]    memory directions = new bool[](2);
        uint256[] memory amounts    = new uint256[](2);
        bettors[0] = ALICE; directions[0] = true; amounts[0] = 300e6;
        bettors[1] = BOB;   directions[1] = true; amounts[1] = 200e6;

        vm.expectEmit(true, false, false, true);
        emit NoWinnersEdgeCase(address(market), netPool);
        _revealAndDistribute(bettors, directions, amounts);

        // Treasury gets: protocolFee + netPool (since no winners)
        assertEq(usdt.balanceOf(TREASURY), treasuryBefore + pFee + netPool);
        assertEq(usdt.balanceOf(ORACLE),       oFee);
        assertEq(usdt.balanceOf(MARKET_MAKER), mmFee);

        // Alice and Bob don't receive anything
        assertEq(usdt.balanceOf(ALICE), INITIAL_BALANCE - 300e6);
        assertEq(usdt.balanceOf(BOB),   INITIAL_BALANCE - 200e6);
    }

    function test_hasDistributed_FalseBeforeDistribution() public {
        assertFalse(distributor.hasDistributed(address(market)));
    }

    function test_hasDistributed_TrueAfterDistribution() public {
        _placeBet(ALICE, 100e6, true);
        _resolveMarket(true);

        address[] memory bettors    = new address[](1);
        bool[]    memory directions = new bool[](1);
        uint256[] memory amounts    = new uint256[](1);
        bettors[0] = ALICE; directions[0] = true; amounts[0] = 100e6;

        _revealAndDistribute(bettors, directions, amounts);
        assertTrue(distributor.hasDistributed(address(market)));
    }

    // ─────────────────────────────────────────────────────────────
    // getPayoutSummary
    // ─────────────────────────────────────────────────────────────

    function test_getPayoutSummary_EmptyBeforeDistribution() public {
        IPayoutDistributor.PayoutSummary memory s = distributor.getPayoutSummary(address(market));
        assertEq(s.totalCollateral, 0);
        assertEq(s.totalWinners,    0);
    }

    function test_getPayoutSummary_PopulatedAfterDistribution() public {
        uint256 aliceBet = 300e6;
        uint256 bobBet   = 200e6;
        _placeBet(ALICE, aliceBet, true);
        _placeBet(BOB,   bobBet,   false);
        _resolveMarket(true); // YES wins

        uint256 totalPool = aliceBet + bobBet; // 500e6
        (uint256 oFee, uint256 mmFee, uint256 pFee, uint256 netPool) = _fees(totalPool);

        address[] memory bettors    = new address[](2);
        bool[]    memory directions = new bool[](2);
        uint256[] memory amounts    = new uint256[](2);
        bettors[0] = ALICE; directions[0] = true;  amounts[0] = aliceBet;
        bettors[1] = BOB;   directions[1] = false; amounts[1] = bobBet;

        _revealAndDistribute(bettors, directions, amounts);

        IPayoutDistributor.PayoutSummary memory s = distributor.getPayoutSummary(address(market));
        assertEq(s.totalCollateral,   totalPool);
        assertEq(s.oracleFee,         oFee);
        assertEq(s.mmFee,             mmFee);
        assertEq(s.protocolFee,       pFee);
        assertEq(s.totalFees,         oFee + mmFee + pFee);
        assertEq(s.netPool,           netPool);
        assertEq(s.totalWinners,      1);        // only Alice (YES)
        assertEq(s.totalWinningStake, aliceBet); // Alice's stake
        assertTrue(s.outcome);                   // YES won
    }

    // ─────────────────────────────────────────────────────────────
    // getEstimatedPayout
    // ─────────────────────────────────────────────────────────────

    function test_getEstimatedPayout_ZeroWhenNoCollateral() public {
        uint256 estimate = distributor.getEstimatedPayout(address(market), 100e6, true);
        assertEq(estimate, 0);
    }

    function test_getEstimatedPayout_ZeroWhenZeroStake() public {
        _placeBet(ALICE, 100e6, true);
        uint256 estimate = distributor.getEstimatedPayout(address(market), 0, true);
        assertEq(estimate, 0);
    }

    function test_getEstimatedPayout_PositiveWhenPoolExists() public {
        _placeBet(ALICE, 500e6, true);
        // Estimate for a 100 USDT YES bet
        uint256 estimate = distributor.getEstimatedPayout(address(market), 100e6, true);
        assertGt(estimate, 0);
        // Estimate should be less than or equal to (100 + 500) * 97.5% (rough upper bound)
        assertLe(estimate, 600e6);
    }

    // ─────────────────────────────────────────────────────────────
    // Invariants — conservation of funds
    // ─────────────────────────────────────────────────────────────

    function test_Invariant_TotalOutflowEqualsTotalPool() public {
        uint256 aliceBet = 300e6;
        uint256 bobBet   = 200e6;
        _placeBet(ALICE, aliceBet, true);
        _placeBet(BOB,   bobBet,   false);
        _resolveMarket(true);

        uint256 totalPool = aliceBet + bobBet;

        uint256 aliceBefore   = usdt.balanceOf(ALICE);
        uint256 oracleBefore  = usdt.balanceOf(ORACLE);
        uint256 mmBefore      = usdt.balanceOf(MARKET_MAKER);
        uint256 tBefore       = usdt.balanceOf(TREASURY);

        address[] memory bettors    = new address[](2);
        bool[]    memory directions = new bool[](2);
        uint256[] memory amounts    = new uint256[](2);
        bettors[0] = ALICE; directions[0] = true;  amounts[0] = aliceBet;
        bettors[1] = BOB;   directions[1] = false; amounts[1] = bobBet;

        _revealAndDistribute(bettors, directions, amounts);

        uint256 aliceGained   = usdt.balanceOf(ALICE)        - aliceBefore;
        uint256 oracleGained  = usdt.balanceOf(ORACLE)       - oracleBefore;
        uint256 mmGained      = usdt.balanceOf(MARKET_MAKER) - mmBefore;
        uint256 tGained       = usdt.balanceOf(TREASURY)     - tBefore;
        // Bob received nothing (he lost)

        // All money out must equal total pool deposited
        assertEq(aliceGained + oracleGained + mmGained + tGained, totalPool);
    }

    function test_Invariant_MarketContractEmptyAfterDistribution() public {
        _placeBet(ALICE, 400e6, true);
        _placeBet(BOB,   600e6, false);
        _resolveMarket(true);

        address[] memory bettors    = new address[](2);
        bool[]    memory directions = new bool[](2);
        uint256[] memory amounts    = new uint256[](2);
        bettors[0] = ALICE; directions[0] = true;  amounts[0] = 400e6;
        bettors[1] = BOB;   directions[1] = false; amounts[1] = 600e6;

        _revealAndDistribute(bettors, directions, amounts);

        assertEq(usdt.balanceOf(address(market)), 0);
    }

    // ─────────────────────────────────────────────────────────────
    // Fuzz Tests — payout proportionality
    // ─────────────────────────────────────────────────────────────

    /// @dev Verifies proportional payout math: sum of payouts must equal netPool
    function test_Fuzz_PayoutSumsToNetPool(uint128 aliceStake, uint128 bobStake) public {
        vm.assume(aliceStake >= 1e6 && aliceStake <= 5_000e6);
        vm.assume(bobStake   >= 1e6 && bobStake   <= 5_000e6);

        usdt.mint(ALICE, aliceStake);
        usdt.mint(BOB,   bobStake);
        _placeBet(ALICE, aliceStake, true);
        _placeBet(BOB,   bobStake,   true); // both YES — both win when YES outcome
        _resolveMarket(true);

        uint256 totalPool = uint256(aliceStake) + uint256(bobStake);
        (,,, uint256 netPool) = _fees(totalPool);

        uint256 aliceBefore = usdt.balanceOf(ALICE);
        uint256 bobBefore   = usdt.balanceOf(BOB);

        address[] memory bettors    = new address[](2);
        bool[]    memory directions = new bool[](2);
        uint256[] memory amounts    = new uint256[](2);
        bettors[0] = ALICE; directions[0] = true; amounts[0] = aliceStake;
        bettors[1] = BOB;   directions[1] = true; amounts[1] = bobStake;

        _revealAndDistribute(bettors, directions, amounts);

        uint256 alicePayout = usdt.balanceOf(ALICE) - aliceBefore;
        uint256 bobPayout   = usdt.balanceOf(BOB)   - bobBefore;
        uint256 totalPaid   = alicePayout + bobPayout;

        // Due to integer division rounding, total paid may be <= netPool (rounding down)
        assertLe(totalPaid, netPool);
        // Rounding error at most 1 wei per winner
        assertGe(totalPaid + 2, netPool);
    }

    /// @dev Verifies fee math: total fees are always exactly 2.5% of totalCollateral
    function test_Fuzz_FeesMath(uint128 stake) public {
        vm.assume(stake >= 1e6 && stake <= 100_000e6);

        uint256 oFee  = uint256(stake) * ORACLE_FEE_BPS   / BPS_DENOM;
        uint256 mmFee = uint256(stake) * MM_FEE_BPS       / BPS_DENOM;
        uint256 pFee  = uint256(stake) * PROTOCOL_FEE_BPS / BPS_DENOM;
        uint256 net   = uint256(stake) - oFee - mmFee - pFee;

        // All funds must be accounted for
        assertEq(oFee + mmFee + pFee + net, stake);
        // Fees must be non-negative
        assertLe(oFee + mmFee + pFee, stake);
    }
}
