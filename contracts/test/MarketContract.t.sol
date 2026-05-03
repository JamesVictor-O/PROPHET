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

contract MarketContractTest is Test {

    MockUSDT          usdt;
    ProphetFactory    factory;
    PositionVault     vault;
    PayoutDistributor distributor;
    MarketContract    market;

    uint256 constant ORACLE_PK     = 0xA11CE_BEEF;  // private key for oracle in tests
    address          ORACLE;                          // derived from ORACLE_PK in setUp
    address constant MARKET_MAKER = address(0xB0B);
    address constant TREASURY     = address(0x7EA50);
    address constant ALICE        = address(0xA11CE2);
    address constant BOB          = address(0xB0B2);
    address constant CHARLIE      = address(0xC4A411E);

    uint256 constant INITIAL_BALANCE = 10_000e6; // 10 000 USDT
    uint256 constant ALICE_BET       = 300e6;    //   300 USDT
    uint256 constant BOB_BET         = 200e6;    //   200 USDT
    uint256 constant MIN_BET         = 1e6;      //     1 USDT

    bytes32 constant SOURCES_HASH    = keccak256("ipfs://sources.json");
    bytes   constant VALID_ATTEST    = hex"deadbeef"; // used for revealPositions stub only
    bytes32 constant REASONING_HASH  = keccak256("oracle reasoning json");

    uint256 MARKET_DEADLINE;

    // ── Events ────────────────────────────────────────────────────

    event BetPlaced(address indexed market, address indexed bettor, uint256 collateralAmount, uint256 positionIndex);
    event ResolutionTriggered(address indexed market, uint256 timestamp);
    event ResolutionPosted(address indexed market, bool verdict, bytes32 reasoningHash, uint256 challengeDeadline);
    event ResolutionChallenged(address indexed market, address indexed challenger, uint256 challengeStake);
    event ChallengeUpheld(address indexed market, address indexed challenger, uint256 reward);
    event ChallengeRejected(address indexed market, address indexed challenger, uint256 slashedStake);
    event ResolutionFinalized(address indexed market, bool outcome, uint256 timestamp);
    event MarketCancelled(address indexed market, string reason);
    event CreatorBondRefunded(address indexed market, address indexed creator, uint256 amount);

    // ── Setup ──────────────────────────────────────────────────────

    function setUp() public {
        ORACLE  = vm.addr(ORACLE_PK);
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

        // No bond — markets open immediately on creation
        factory.updateCreationBond(0);

        MARKET_DEADLINE = block.timestamp + 48 hours;
        market = MarketContract(
            factory.createMarket("Will ETH reach $10k by end of 2025?", MARKET_DEADLINE, "crypto", SOURCES_HASH)
        );

        usdt.mint(BOB, INITIAL_BALANCE);

        usdt.mint(ALICE,   INITIAL_BALANCE);
        // BOB already minted above
        usdt.mint(CHARLIE, INITIAL_BALANCE);
    }

    // ── Internal helpers ───────────────────────────────────────────

    function _placeBet(address user, uint256 amount, bool direction) internal {
        vm.startPrank(user);
        usdt.approve(address(market), amount);
        market.placeBet(abi.encode(direction, amount), amount);
        vm.stopPrank();
    }

    function _triggerResolution() internal {
        vm.warp(MARKET_DEADLINE + 1);
        market.triggerResolution();
    }

    // Sign (market, verdict, reasoningHash) with oracle private key — matches _verifyTeeAttestation
    function _oracleAttest(address mkt, bool verdict, bytes32 hash) internal view returns (bytes memory) {
        bytes32 msgHash = keccak256(abi.encodePacked(mkt, verdict, hash));
        bytes32 ethHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", msgHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ORACLE_PK, ethHash);
        return abi.encodePacked(r, s, v);
    }

    function _postResolution(bool verdict) internal {
        vm.prank(ORACLE);
        market.postResolution(verdict, REASONING_HASH, _oracleAttest(address(market), verdict, REASONING_HASH));
    }

    function _finalizeResolution() internal {
        vm.warp(block.timestamp + 25 hours);
        market.finalizeResolution();
    }

    function _resolveMarket(bool verdict) internal {
        _triggerResolution();
        _postResolution(verdict);
        _finalizeResolution();
    }

    /// @dev Sets factory bond to `bond`, deploys a new market (opens immediately).
    function _createOpenMarketWithBond(uint256 bond) internal returns (MarketContract m) {
        factory.updateCreationBond(bond);
        if (bond > 0) {
            usdt.mint(address(this), bond);
            usdt.approve(address(factory), bond);
        }
        uint256 dl = block.timestamp + 48 hours;
        m = MarketContract(factory.createMarket("Bond market?", dl, "crypto", SOURCES_HASH));
    }

    // ─────────────────────────────────────────────────────────────
    // Initial State
    // ─────────────────────────────────────────────────────────────

    function test_InitialState_Immutables() public {
        assertEq(market.factory(),             address(factory));
        assertEq(market.oracleAgent(),         ORACLE);
        assertEq(market.marketMakerAgent(),    MARKET_MAKER);
        assertEq(market.positionVault(),       address(vault));
        assertEq(market.payoutDistributor(),   address(distributor));
        assertEq(market.USDT(),                address(usdt));
        assertEq(market.creator(),             address(this));
        assertEq(market.deadline(),            MARKET_DEADLINE);
        assertEq(market.resolutionSourcesHash(), SOURCES_HASH);
    }

    function test_InitialState_MutableFields() public {
        assertEq(uint8(market.status()),       uint8(IMarketContract.MarketStatus.Open)); // activated in setUp
        assertFalse(market.outcome());
        assertEq(market.totalCollateral(),     0);
        assertEq(market.challengeDeadline(),   0);
        assertEq(market.resolutionTimestamp(), 0);
        assertEq(market.challenger(),          address(0));
        assertEq(market.challengeStake(),      0);
        assertFalse(market.challengeResolved());
    }

    function test_InitialState_StringFields() public {
        assertEq(market.question(), "Will ETH reach $10k by end of 2025?");
        assertEq(market.category(), "crypto");
    }

    // ─────────────────────────────────────────────────────────────
    // placeBet
    // ─────────────────────────────────────────────────────────────

    function test_placeBet_Success_TransfersUSDT() public {
        vm.startPrank(ALICE);
        usdt.approve(address(market), ALICE_BET);
        market.placeBet(abi.encode(true, ALICE_BET), ALICE_BET);
        vm.stopPrank();

        assertEq(usdt.balanceOf(address(market)), ALICE_BET);
        assertEq(market.totalCollateral(),         ALICE_BET);
    }

    function test_placeBet_Success_EmitsEvent() public {
        vm.startPrank(ALICE);
        usdt.approve(address(market), ALICE_BET);
        vm.expectEmit(true, true, false, true);
        emit BetPlaced(address(market), ALICE, ALICE_BET, 0);
        market.placeBet(abi.encode(true), ALICE_BET);
        vm.stopPrank();
    }

    function test_placeBet_Success_SetsBettorFlag() public {
        assertFalse(market.hasBet(ALICE));
        _placeBet(ALICE, ALICE_BET, true);
        assertTrue(market.hasBet(ALICE));
    }

    function test_placeBet_Success_AccumulatesCollateral() public {
        _placeBet(ALICE, ALICE_BET, true);
        _placeBet(BOB,   BOB_BET,   false);
        assertEq(market.totalCollateral(), ALICE_BET + BOB_BET);
    }

    function test_placeBet_Success_StoresPositionInVault() public {
        _placeBet(ALICE, ALICE_BET, true);
        assertEq(vault.positionCount(address(market)), 1);
        assertEq(vault.getTotalCommitted(address(market)), ALICE_BET);
    }

    function test_placeBet_RevertsDeadlinePassed() public {
        vm.warp(MARKET_DEADLINE + 1);
        vm.startPrank(ALICE);
        usdt.approve(address(market), ALICE_BET);
        vm.expectRevert(IMarketContract.MarketContract__DeadlinePassed.selector);
        market.placeBet(abi.encode(true), ALICE_BET);
        vm.stopPrank();
    }

    function test_placeBet_RevertsAtExactDeadline() public {
        vm.warp(MARKET_DEADLINE); // at == deadline, not strictly before
        vm.startPrank(ALICE);
        usdt.approve(address(market), ALICE_BET);
        vm.expectRevert(IMarketContract.MarketContract__DeadlinePassed.selector);
        market.placeBet(abi.encode(true), ALICE_BET);
        vm.stopPrank();
    }

    function test_placeBet_RevertsBelowMinBet() public {
        vm.startPrank(ALICE);
        usdt.approve(address(market), MIN_BET - 1);
        vm.expectRevert(IMarketContract.MarketContract__ZeroCollateral.selector);
        market.placeBet(abi.encode(true), MIN_BET - 1);
        vm.stopPrank();
    }

    function test_placeBet_RevertsZeroAmount() public {
        vm.startPrank(ALICE);
        usdt.approve(address(market), 0);
        vm.expectRevert(IMarketContract.MarketContract__ZeroCollateral.selector);
        market.placeBet(abi.encode(true), 0);
        vm.stopPrank();
    }

    function test_placeBet_RevertsEmptyCommitment() public {
        vm.startPrank(ALICE);
        usdt.approve(address(market), ALICE_BET);
        vm.expectRevert(IMarketContract.MarketContract__InvalidTeeAttestation.selector);
        market.placeBet(new bytes(0), ALICE_BET);
        vm.stopPrank();
    }

    function test_placeBet_RevertsWhenNotOpen() public {
        _triggerResolution(); // status → PendingResolution
        vm.startPrank(ALICE);
        usdt.approve(address(market), ALICE_BET);
        vm.expectRevert(IMarketContract.MarketContract__NotOpen.selector);
        market.placeBet(abi.encode(true), ALICE_BET);
        vm.stopPrank();
    }

    // ─────────────────────────────────────────────────────────────
    // triggerResolution
    // ─────────────────────────────────────────────────────────────

    function test_triggerResolution_Success() public {
        vm.warp(MARKET_DEADLINE + 1);
        vm.expectEmit(true, false, false, false);
        emit ResolutionTriggered(address(market), block.timestamp);
        market.triggerResolution();
        assertEq(uint8(market.status()), uint8(IMarketContract.MarketStatus.PendingResolution));
    }

    function test_triggerResolution_AnyoneCanCall() public {
        vm.warp(MARKET_DEADLINE + 1);
        vm.prank(BOB);
        market.triggerResolution();
        assertEq(uint8(market.status()), uint8(IMarketContract.MarketStatus.PendingResolution));
    }

    function test_triggerResolution_RevertsBeforeDeadline() public {
        vm.expectRevert(IMarketContract.MarketContract__DeadlineNotReached.selector);
        market.triggerResolution();
    }

    function test_triggerResolution_RevertsIfAlreadyTriggered() public {
        _triggerResolution();
        vm.expectRevert(IMarketContract.MarketContract__NotOpen.selector);
        market.triggerResolution();
    }

    // ─────────────────────────────────────────────────────────────
    // postResolution
    // ─────────────────────────────────────────────────────────────

    function test_postResolution_YES_SetsState() public {
        _triggerResolution();
        vm.prank(ORACLE);
        market.postResolution(true, REASONING_HASH, _oracleAttest(address(market), true, REASONING_HASH));

        assertEq(uint8(market.status()),          uint8(IMarketContract.MarketStatus.Challenged));
        assertTrue(market.outcome());
        assertEq(market.verdictReasoningHash(),   REASONING_HASH);
        assertEq(market.resolutionTimestamp(),     block.timestamp);
        assertEq(market.challengeDeadline(),       block.timestamp + 24 hours);
    }

    function test_postResolution_NO_SetsState() public {
        _triggerResolution();
        vm.prank(ORACLE);
        market.postResolution(false, REASONING_HASH, _oracleAttest(address(market), false, REASONING_HASH));

        assertFalse(market.outcome());
        assertEq(uint8(market.status()), uint8(IMarketContract.MarketStatus.Challenged));
    }

    function test_postResolution_EmitsEvent() public {
        _triggerResolution();
        uint256 expectedChallengeDl = block.timestamp + 24 hours;
        vm.prank(ORACLE);
        vm.expectEmit(true, false, false, true);
        emit ResolutionPosted(address(market), true, REASONING_HASH, expectedChallengeDl);
        market.postResolution(true, REASONING_HASH, _oracleAttest(address(market), true, REASONING_HASH));
    }

    function test_postResolution_RevertsNotOracle() public {
        _triggerResolution();
        vm.prank(ALICE);
        vm.expectRevert(IMarketContract.MarketContract__NotOracleAgent.selector);
        market.postResolution(true, REASONING_HASH, _oracleAttest(address(market), true, REASONING_HASH));
    }

    function test_postResolution_RevertsNotPendingResolution() public {
        // Market is Open
        vm.prank(ORACLE);
        vm.expectRevert(IMarketContract.MarketContract__NotPendingResolution.selector);
        market.postResolution(true, REASONING_HASH, _oracleAttest(address(market), true, REASONING_HASH));
    }

    function test_postResolution_RevertsEmptyAttestation() public {
        _triggerResolution();
        vm.prank(ORACLE);
        vm.expectRevert(IMarketContract.MarketContract__InvalidTeeAttestation.selector);
        market.postResolution(true, REASONING_HASH, new bytes(0));
    }

    function test_postResolution_AlwaysEntersChallengeWindow() public {
        _triggerResolution();
        _postResolution(true);
        // Even without a challenger, status is Challenged (not Resolved yet)
        assertEq(uint8(market.status()), uint8(IMarketContract.MarketStatus.Challenged));
    }

    // ─────────────────────────────────────────────────────────────
    // challengeResolution
    // ─────────────────────────────────────────────────────────────

    function test_challengeResolution_Success() public {
        _placeBet(ALICE, ALICE_BET, true); // pool = 300 USDT
        _triggerResolution();
        _postResolution(true);

        uint256 stake = market.requiredChallengeStake(); // max(5%, 50e6) = 50e6

        vm.startPrank(BOB);
        usdt.approve(address(market), stake);
        vm.expectEmit(true, true, false, true);
        emit ResolutionChallenged(address(market), BOB, stake);
        market.challengeResolution();
        vm.stopPrank();

        assertEq(market.challenger(),    BOB);
        assertEq(market.challengeStake(), stake);
        assertEq(usdt.balanceOf(address(market)), ALICE_BET + stake);
    }

    function test_challengeResolution_RevertsWindowClosed() public {
        _triggerResolution();
        _postResolution(true);
        vm.warp(block.timestamp + 25 hours); // past 24h window

        vm.startPrank(BOB);
        uint256 stake = market.requiredChallengeStake();
        usdt.approve(address(market), stake);
        vm.expectRevert(IMarketContract.MarketContract__ChallengeWindowClosed.selector);
        market.challengeResolution();
        vm.stopPrank();
    }

    function test_challengeResolution_RevertsAlreadyChallenged() public {
        _triggerResolution();
        _postResolution(true);

        uint256 stake = market.requiredChallengeStake();
        vm.startPrank(BOB);
        usdt.approve(address(market), stake);
        market.challengeResolution();
        vm.stopPrank();

        vm.startPrank(CHARLIE);
        usdt.approve(address(market), stake);
        vm.expectRevert(IMarketContract.MarketContract__ChallengeAlreadyFiled.selector);
        market.challengeResolution();
        vm.stopPrank();
    }

    function test_challengeResolution_RevertsWhenMarketNotInChallengedStatus() public {
        // Market is Open
        vm.startPrank(BOB);
        uint256 stake = market.requiredChallengeStake();
        usdt.approve(address(market), stake);
        vm.expectRevert(IMarketContract.MarketContract__NotChallenged.selector);
        market.challengeResolution();
        vm.stopPrank();
    }

    // ─────────────────────────────────────────────────────────────
    // requiredChallengeStake
    // ─────────────────────────────────────────────────────────────

    function test_requiredChallengeStake_MinimumApplies_SmallPool() public {
        // 300 USDT * 5% = 15 USDT < 50 USDT minimum → 50 USDT
        _placeBet(ALICE, ALICE_BET, true);
        assertEq(market.requiredChallengeStake(), 50e6);
    }

    function test_requiredChallengeStake_BpsDominates_LargePool() public {
        // 2000 USDT * 5% = 100 USDT > 50 USDT minimum → 100 USDT
        usdt.mint(ALICE, 2000e6);
        _placeBet(ALICE, 2000e6, true);
        assertEq(market.requiredChallengeStake(), 100e6);
    }

    function test_requiredChallengeStake_ZeroPool() public {
        // No bets → totalCollateral = 0 → 0 bps stake < 50e6 min → 50e6
        assertEq(market.requiredChallengeStake(), 50e6);
    }

    // ─────────────────────────────────────────────────────────────
    // finalizeResolution
    // ─────────────────────────────────────────────────────────────

    function test_finalizeResolution_Success() public {
        _triggerResolution();
        _postResolution(true);
        vm.warp(block.timestamp + 25 hours);

        vm.expectEmit(true, false, false, false);
        emit ResolutionFinalized(address(market), true, block.timestamp);
        market.finalizeResolution();

        assertEq(uint8(market.status()), uint8(IMarketContract.MarketStatus.Resolved));
    }

    function test_finalizeResolution_AnyoneCanCall() public {
        _triggerResolution();
        _postResolution(true);
        vm.warp(block.timestamp + 25 hours);
        vm.prank(CHARLIE);
        market.finalizeResolution();
        assertEq(uint8(market.status()), uint8(IMarketContract.MarketStatus.Resolved));
    }

    function test_finalizeResolution_RevertsWindowStillOpen() public {
        _triggerResolution();
        _postResolution(true);
        // Do not warp — window is open
        vm.expectRevert(IMarketContract.MarketContract__ChallengeWindowStillOpen.selector);
        market.finalizeResolution();
    }

    function test_finalizeResolution_ReverstsChallengeAlreadyFiled() public {
        _placeBet(ALICE, ALICE_BET, true);
        _triggerResolution();
        _postResolution(true);

        uint256 stake = market.requiredChallengeStake();
        vm.startPrank(BOB);
        usdt.approve(address(market), stake);
        market.challengeResolution();
        vm.stopPrank();

        vm.warp(block.timestamp + 25 hours);
        vm.expectRevert(IMarketContract.MarketContract__ChallengeAlreadyFiled.selector);
        market.finalizeResolution();
    }

    // ─────────────────────────────────────────────────────────────
    // processChallengeOutcome
    // ─────────────────────────────────────────────────────────────

    function test_processChallengeOutcome_Upheld_FlipsVerdict() public {
        _placeBet(ALICE, ALICE_BET, true);
        _triggerResolution();
        _postResolution(true); // oracle says YES

        uint256 stake = market.requiredChallengeStake(); // 50e6 for 300 USDT pool
        vm.startPrank(BOB);
        usdt.approve(address(market), stake);
        market.challengeResolution();
        vm.stopPrank();

        vm.prank(ORACLE);
        vm.expectEmit(true, true, false, false);
        emit ChallengeUpheld(address(market), BOB, 0);
        market.processChallengeOutcome(true);

        // Verdict flipped: YES → NO
        assertFalse(market.outcome());
        assertEq(uint8(market.status()), uint8(IMarketContract.MarketStatus.Resolved));
        assertTrue(market.challengeResolved());
    }

    function test_processChallengeOutcome_Upheld_PaysChallenger() public {
        _placeBet(ALICE, ALICE_BET, true); // pool = 300e6
        _triggerResolution();
        _postResolution(true);

        uint256 stake = market.requiredChallengeStake(); // 50e6
        vm.startPrank(BOB);
        usdt.approve(address(market), stake);
        market.challengeResolution();
        vm.stopPrank();

        uint256 bobBefore = usdt.balanceOf(BOB); // 0 after spending stake

        vm.prank(ORACLE);
        market.processChallengeOutcome(true);

        // BOB gets: stake + 50% of oracle fee
        // oracleFee = 300e6 * 1% = 3e6; reward = 3e6 * 50% = 1_500_000
        uint256 oracleFee  = 300e6 * 100 / 10_000; // 3_000_000
        uint256 reward     = oracleFee * 5_000 / 10_000; // 1_500_000
        assertEq(usdt.balanceOf(BOB), bobBefore + stake + reward);
    }

    function test_processChallengeOutcome_Rejected_KeepsVerdict() public {
        _placeBet(ALICE, ALICE_BET, true);
        _triggerResolution();
        _postResolution(true); // oracle says YES

        uint256 stake = market.requiredChallengeStake();
        vm.startPrank(BOB);
        usdt.approve(address(market), stake);
        market.challengeResolution();
        vm.stopPrank();

        uint256 oracleBalBefore = usdt.balanceOf(ORACLE);

        vm.prank(ORACLE);
        vm.expectEmit(true, true, false, true);
        emit ChallengeRejected(address(market), BOB, stake);
        market.processChallengeOutcome(false);

        // Verdict unchanged: YES
        assertTrue(market.outcome());
        assertEq(uint8(market.status()), uint8(IMarketContract.MarketStatus.Resolved));
        // Oracle receives challenger's slashed stake
        assertEq(usdt.balanceOf(ORACLE), oracleBalBefore + stake);
        // BOB started with INITIAL_BALANCE, spent `stake` to challenge and lost it
        assertEq(usdt.balanceOf(BOB), INITIAL_BALANCE - stake);
    }

    function test_processChallengeOutcome_RevertsNotOracle() public {
        _triggerResolution();
        _postResolution(true);

        uint256 stake = market.requiredChallengeStake();
        vm.startPrank(BOB);
        usdt.approve(address(market), stake);
        market.challengeResolution();
        vm.stopPrank();

        vm.prank(ALICE);
        vm.expectRevert(IMarketContract.MarketContract__NotOracleAgent.selector);
        market.processChallengeOutcome(true);
    }

    function test_processChallengeOutcome_RevertsNoChallengeToProcess() public {
        _triggerResolution();
        _postResolution(true); // no challenge filed

        vm.prank(ORACLE);
        vm.expectRevert(IMarketContract.MarketContract__NoChallengeToProcess.selector);
        market.processChallengeOutcome(true);
    }

    function test_processChallengeOutcome_RevertsWhenNotChallengedStatus() public {
        vm.prank(ORACLE);
        vm.expectRevert(IMarketContract.MarketContract__NotChallenged.selector);
        market.processChallengeOutcome(true);
    }

    // ─────────────────────────────────────────────────────────────
    // cancelMarket
    // ─────────────────────────────────────────────────────────────

    function test_cancelMarket_Success_SetsStatus() public {
        _triggerResolution();
        vm.prank(ORACLE);
        market.cancelMarket("INCONCLUSIVE after two attempts");
        assertEq(uint8(market.status()), uint8(IMarketContract.MarketStatus.Cancelled));
    }

    function test_cancelMarket_Success_RefundsBettors() public {
        _placeBet(ALICE, ALICE_BET, true);
        _placeBet(BOB,   BOB_BET,   false);

        uint256 aliceAfterBet = usdt.balanceOf(ALICE); // INITIAL - ALICE_BET
        uint256 bobAfterBet   = usdt.balanceOf(BOB);   // INITIAL - BOB_BET

        _triggerResolution();
        vm.prank(ORACLE);
        vm.expectEmit(true, false, false, false);
        emit MarketCancelled(address(market), "INCONCLUSIVE");
        market.cancelMarket("INCONCLUSIVE");

        assertEq(usdt.balanceOf(ALICE), aliceAfterBet + ALICE_BET);
        assertEq(usdt.balanceOf(BOB),   bobAfterBet   + BOB_BET);
        assertEq(usdt.balanceOf(address(market)), 0);
    }

    function test_cancelMarket_EmptyPool_NoRevert() public {
        _triggerResolution();
        vm.prank(ORACLE);
        market.cancelMarket("INCONCLUSIVE");
        assertEq(uint8(market.status()), uint8(IMarketContract.MarketStatus.Cancelled));
    }

    function test_cancelMarket_RevertsNotOracle() public {
        _triggerResolution();
        vm.prank(ALICE);
        vm.expectRevert(IMarketContract.MarketContract__NotOracleAgent.selector);
        market.cancelMarket("reason");
    }

    function test_cancelMarket_RevertsAlreadyCancelled() public {
        _triggerResolution();
        vm.prank(ORACLE);
        market.cancelMarket("first");

        vm.prank(ORACLE);
        vm.expectRevert(IMarketContract.MarketContract__AlreadyCancelled.selector);
        market.cancelMarket("second");
    }

    function test_cancelMarket_RevertsWhenNotPendingResolution() public {
        // Market is Open
        vm.prank(ORACLE);
        vm.expectRevert(IMarketContract.MarketContract__NotPendingResolution.selector);
        market.cancelMarket("reason");
    }

    // ─────────────────────────────────────────────────────────────
    // Creator bond (creationBondAmount from factory at deploy time)
    // ─────────────────────────────────────────────────────────────

    function test_creatorBond_Immutable_MatchesFactoryAtDeployTime() public {
        MarketContract mBond = _createOpenMarketWithBond(10e6);
        assertEq(mBond.creatorBond(), 10e6);
        assertEq(usdt.balanceOf(address(mBond)), 10e6);

        factory.updateCreationBond(99e6);
        assertEq(mBond.creatorBond(), 10e6); // snapshot at deploy
    }

    function test_creatorBond_RefundedOnFinalizeResolution() public {
        MarketContract mBond = _createOpenMarketWithBond(10e6);
        uint256 creatorAfterCreate = usdt.balanceOf(address(this));

        _placeBetOn(ALICE, mBond, ALICE_BET, true);

        vm.warp(mBond.deadline() + 1);
        mBond.triggerResolution();
        vm.prank(ORACLE);
        mBond.postResolution(true, REASONING_HASH, _oracleAttest(address(mBond), true, REASONING_HASH));
        vm.warp(block.timestamp + 25 hours);

        vm.expectEmit(true, true, false, true);
        emit CreatorBondRefunded(address(mBond), address(this), 10e6);
        mBond.finalizeResolution();

        assertEq(usdt.balanceOf(address(this)), creatorAfterCreate + 10e6);
        assertEq(uint8(mBond.status()), uint8(IMarketContract.MarketStatus.Resolved));
    }

    function test_creatorBond_RefundedOnProcessChallengeOutcome() public {
        MarketContract mBond = _createOpenMarketWithBond(10e6);
        uint256 creatorAfterCreate = usdt.balanceOf(address(this));

        _placeBetOn(ALICE, mBond, ALICE_BET, true);

        vm.warp(mBond.deadline() + 1);
        mBond.triggerResolution();
        vm.prank(ORACLE);
        mBond.postResolution(true, REASONING_HASH, _oracleAttest(address(mBond), true, REASONING_HASH));

        uint256 stake = mBond.requiredChallengeStake();
        vm.startPrank(BOB);
        usdt.approve(address(mBond), stake);
        mBond.challengeResolution();
        vm.stopPrank();

        vm.prank(ORACLE);
        mBond.processChallengeOutcome(false);

        assertEq(usdt.balanceOf(address(this)), creatorAfterCreate + 10e6);
        assertEq(uint8(mBond.status()), uint8(IMarketContract.MarketStatus.Resolved));
    }

    function test_creatorBond_ForfeitedToTreasury_OnCancel() public {
        MarketContract mBond = _createOpenMarketWithBond(10e6);

        _placeBetOn(ALICE, mBond, ALICE_BET, true);

        uint256 treasuryBefore = usdt.balanceOf(TREASURY);

        vm.warp(mBond.deadline() + 1);
        mBond.triggerResolution();
        vm.prank(ORACLE);
        mBond.cancelMarket("INCONCLUSIVE");

        assertEq(usdt.balanceOf(TREASURY), treasuryBefore + 10e6);
        assertEq(uint8(mBond.status()), uint8(IMarketContract.MarketStatus.Cancelled));
    }

    function _placeBetOn(
        address user,
        MarketContract m_,
        uint256 amount,
        bool direction
    ) internal {
        vm.startPrank(user);
        usdt.approve(address(m_), amount);
        m_.placeBet(abi.encode(direction, amount), amount);
        vm.stopPrank();
    }

    // ─────────────────────────────────────────────────────────────
    // distributePayout (called by PayoutDistributor only)
    // ─────────────────────────────────────────────────────────────

    function test_distributePayout_RevertsNotDistributor() public {
        _placeBet(ALICE, ALICE_BET, true);
        _resolveMarket(true);

        address[] memory winners = new address[](1);
        uint256[] memory amounts = new uint256[](1);
        winners[0] = ALICE;
        amounts[0]  = ALICE_BET;

        vm.prank(ALICE);
        vm.expectRevert(IMarketContract.MarketContract__NotPayoutDistributor.selector);
        market.distributePayout(winners, amounts);
    }

    function test_distributePayout_RevertsArrayLengthMismatch() public {
        _placeBet(ALICE, ALICE_BET, true);
        _resolveMarket(true);

        address[] memory winners = new address[](2);
        uint256[] memory amounts = new uint256[](1);

        vm.prank(address(distributor));
        vm.expectRevert(IMarketContract.MarketContract__ArrayLengthMismatch.selector);
        market.distributePayout(winners, amounts);
    }

    function test_distributePayout_RevertsWhenNotResolved() public {
        _placeBet(ALICE, ALICE_BET, true);
        // Market not yet resolved

        address[] memory winners = new address[](1);
        uint256[] memory amounts = new uint256[](1);

        vm.prank(address(distributor));
        vm.expectRevert(IMarketContract.MarketContract__NotResolved.selector);
        market.distributePayout(winners, amounts);
    }

    // ─────────────────────────────────────────────────────────────
    // View Functions
    // ─────────────────────────────────────────────────────────────

    function test_getMarketInfo_ReturnsAllFields() public {
        (
            string memory q,
            uint256 dl,
            IMarketContract.MarketStatus st,
            bool out,
            uint256 collateral,
            uint256 challengeDl,
            bytes32 rHash,
            string memory cat,
            address cr
        ) = market.getMarketInfo();

        assertEq(q,           "Will ETH reach $10k by end of 2025?");
        assertEq(dl,          MARKET_DEADLINE);
        assertEq(uint8(st),   uint8(IMarketContract.MarketStatus.Open));
        assertFalse(out);
        assertEq(collateral,  0);
        assertEq(challengeDl, 0);
        assertEq(rHash,       bytes32(0));
        assertEq(cat,         "crypto");
        assertEq(cr,          address(this));
    }

    function test_timeUntilDeadline_Before() public {
        uint256 t = market.timeUntilDeadline();
        assertGt(t, 0);
        assertLe(t, 48 hours); // deadline is 48h from setUp
    }

    function test_timeUntilDeadline_After() public {
        vm.warp(MARKET_DEADLINE + 1);
        assertEq(market.timeUntilDeadline(), 0);
    }

    function test_isChallengeWindowOpen_OpenStatus_False() public {
        assertFalse(market.isChallengeWindowOpen());
    }

    function test_isChallengeWindowOpen_ChallengedNoChallengeYet_True() public {
        _triggerResolution();
        _postResolution(true);
        assertTrue(market.isChallengeWindowOpen());
    }

    function test_isChallengeWindowOpen_WindowExpired_False() public {
        _triggerResolution();
        _postResolution(true);
        vm.warp(block.timestamp + 25 hours);
        assertFalse(market.isChallengeWindowOpen());
    }

    function test_isChallengeWindowOpen_ChallengeAlreadyFiled_False() public {
        _placeBet(ALICE, ALICE_BET, true);
        _triggerResolution();
        _postResolution(true);

        uint256 stake = market.requiredChallengeStake();
        vm.startPrank(BOB);
        usdt.approve(address(market), stake);
        market.challengeResolution();
        vm.stopPrank();

        assertFalse(market.isChallengeWindowOpen());
    }

    function test_hasBet_FalseBeforeBet() public {
        assertFalse(market.hasBet(ALICE));
    }

    function test_hasBet_TrueAfterBet() public {
        _placeBet(ALICE, MIN_BET, true);
        assertTrue(market.hasBet(ALICE));
        assertFalse(market.hasBet(BOB)); // didn't bet
    }

    // ─────────────────────────────────────────────────────────────
    // Full End-to-End Lifecycle
    // ─────────────────────────────────────────────────────────────

    function test_E2E_YesWins_SingleBettor() public {
        // Alice bets 300 YES, Bob bets 200 NO → pool 500 USDT, YES wins
        _placeBet(ALICE, ALICE_BET, true);
        _placeBet(BOB,   BOB_BET,   false);

        assertEq(market.totalCollateral(), ALICE_BET + BOB_BET);

        _triggerResolution();
        assertEq(uint8(market.status()), uint8(IMarketContract.MarketStatus.PendingResolution));

        _postResolution(true);
        assertEq(uint8(market.status()), uint8(IMarketContract.MarketStatus.Challenged));
        assertTrue(market.isChallengeWindowOpen());

        _finalizeResolution();
        assertEq(uint8(market.status()), uint8(IMarketContract.MarketStatus.Resolved));

        // Oracle reveals and triggers payout
        IPositionVault.RevealedPosition[] memory positions = new IPositionVault.RevealedPosition[](2);
        positions[0] = IPositionVault.RevealedPosition({ bettor: ALICE, direction: true,  collateralAmount: ALICE_BET });
        positions[1] = IPositionVault.RevealedPosition({ bettor: BOB,   direction: false, collateralAmount: BOB_BET   });

        uint256 aliceBefore = usdt.balanceOf(ALICE); // INITIAL_BALANCE - ALICE_BET

        vm.prank(ORACLE);
        vault.revealPositions(address(market), positions, VALID_ATTEST);

        // totalCollateral = 500e6, netPool = 500e6 * 97.5% = 487_500_000
        // Alice is sole winner (300/300 = 100% of netPool)
        uint256 netPool = 500e6 - (500e6 * 250 / 10_000); // 487_500_000
        assertEq(usdt.balanceOf(ALICE), aliceBefore + netPool);
        assertEq(usdt.balanceOf(BOB),   INITIAL_BALANCE - BOB_BET); // Bob lost his bet
    }

    function test_E2E_ChallengeRejected_OriginalVerdictStands() public {
        _placeBet(ALICE, ALICE_BET, true);
        _placeBet(BOB,   BOB_BET,   false);
        _triggerResolution();
        _postResolution(true); // oracle says YES

        // Charlie challenges
        uint256 stake = market.requiredChallengeStake();
        vm.startPrank(CHARLIE);
        usdt.approve(address(market), stake);
        market.challengeResolution();
        vm.stopPrank();

        // Oracle rejects challenge
        vm.prank(ORACLE);
        market.processChallengeOutcome(false);

        assertEq(uint8(market.status()), uint8(IMarketContract.MarketStatus.Resolved));
        assertTrue(market.outcome()); // unchanged

        // Charlie's stake went to oracle
        assertEq(usdt.balanceOf(CHARLIE), INITIAL_BALANCE - stake);
        assertEq(usdt.balanceOf(ORACLE),  stake);
    }
}
