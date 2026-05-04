// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ProphetFactory.sol";
import "../src/MarketContract.sol";
import "../src/PositionVault.sol";
import "../src/PayoutDistributor.sol";
import "../src/LiquidityPool.sol";
import "../src/interfaces/ILiquidityPool.sol";
import "../src/interfaces/IMarketContract.sol";
import "./helpers/MockUSDT.sol";

contract LiquidityPoolTest is Test {

    MockUSDT          usdt;
    ProphetFactory    factory;
    PositionVault     vault;
    PayoutDistributor distributor;
    LiquidityPool     pool;

    uint256 constant ORACLE_PK    = 0xA11CE_BEEF;
    address          ORACLE;
    address constant AGENT        = address(0xA6E47); // market maker / pool agent
    address constant TREASURY     = address(0x7EA50);
    address constant ALICE        = address(0xA11CE2);
    address constant BOB          = address(0xB0B2);
    address constant CHARLIE      = address(0xC4A411E);
    address constant OWNER        = address(0x0FFEE);

    uint256 constant INITIAL_USDT = 100_000e6;
    uint256 constant MIN_DEPOSIT  = 10e6;

    // ── Events ────────────────────────────────────────────────────────────────

    event Deposited(address indexed lp, uint256 usdtAmount, uint256 sharesIssued);
    event Withdrawn(address indexed lp, uint256 usdtAmount, uint256 sharesBurned);
    event AllocatedToMarket(address indexed market, uint256 amount, uint256 timestamp);
    event ReturnedFromMarket(address indexed market, uint256 principal, uint256 fees, uint256 timestamp);
    event LiquidityAdded(address indexed depositor, uint256 amount);

    // ── Setup ─────────────────────────────────────────────────────────────────

    function setUp() public {
        ORACLE  = vm.addr(ORACLE_PK);
        usdt    = new MockUSDT();
        factory = new ProphetFactory(address(usdt), ORACLE, AGENT, TREASURY);

        uint64  nonce                = vm.getNonce(address(this));
        address predictedVault       = computeCreateAddress(address(this), nonce);
        address predictedDistributor = computeCreateAddress(address(this), nonce + 1);

        vault       = new PositionVault(address(factory), ORACLE, address(usdt), predictedDistributor);
        distributor = new PayoutDistributor(
            address(factory), address(vault), ORACLE, AGENT, TREASURY, address(usdt)
        );
        factory.setVaultAndDistributor(address(vault), address(distributor));
        factory.updateCreationBond(0);

        pool = new LiquidityPool(address(usdt), address(factory), AGENT, OWNER);

        // Fund test accounts
        usdt.mint(ALICE,   INITIAL_USDT);
        usdt.mint(BOB,     INITIAL_USDT);
        usdt.mint(CHARLIE, INITIAL_USDT);
        usdt.mint(AGENT,   INITIAL_USDT);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    function _deposit(address lp, uint256 amount) internal returns (uint256 sharesGiven) {
        vm.startPrank(lp);
        usdt.approve(address(pool), amount);
        uint256 sharesBefore = pool.shares(lp);
        pool.deposit(amount);
        sharesGiven = pool.shares(lp) - sharesBefore;
        vm.stopPrank();
    }

    function _deployMarket() internal returns (MarketContract) {
        return MarketContract(
            factory.createMarket(
                "Will ETH hit $10k?",
                block.timestamp + 7 days,
                "crypto",
                keccak256("sources")
            )
        );
    }

    function _oracleAttest(address mkt, bool verdict, bytes32 hash) internal view returns (bytes memory) {
        bytes32 msgHash = keccak256(abi.encodePacked(mkt, verdict, hash));
        bytes32 ethHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", msgHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ORACLE_PK, ethHash);
        return abi.encodePacked(r, s, v);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // deposit()
    // ══════════════════════════════════════════════════════════════════════════

    function test_Deposit_FirstDeposit_OneToOneShares() public {
        uint256 amount = 1_000e6;
        uint256 shares = _deposit(ALICE, amount);

        assertEq(shares, amount, "first deposit: shares == amount");
        assertEq(pool.totalShares(), amount);
        assertEq(pool.sharePrice(), 1e6); // 1 USDT per share
        assertEq(pool.availableLiquidity(), amount);
    }

    function test_Deposit_SubsequentDeposit_ProportionalShares() public {
        _deposit(ALICE, 1_000e6);

        // Pool has 1000 USDT, 1000 shares → price = 1 USDT/share
        // Bob deposits 500 USDT → should get 500 shares
        uint256 bobShares = _deposit(BOB, 500e6);
        assertEq(bobShares, 500e6);
        assertEq(pool.totalShares(), 1_500e6);
    }

    function test_Deposit_SharePriceAfterFees() public {
        _deposit(ALICE, 1_000e6);
        // Inject 100 USDT as "fees" via addLiquidity (no shares issued)
        vm.startPrank(BOB);
        usdt.approve(address(pool), 100e6);
        pool.addLiquidity(100e6);
        vm.stopPrank();

        // Pool now has 1100 USDT, 1000 shares → price = 1.1 USDT/share
        assertEq(pool.sharePrice(), 1.1e6);

        // Bob deposits 550 USDT → gets 550/1.1 = 500 shares
        uint256 bobShares = _deposit(BOB, 550e6);
        assertEq(bobShares, 500e6);
    }

    function test_Deposit_RevertsWhenDepositsBelowMin() public {
        vm.startPrank(ALICE);
        usdt.approve(address(pool), 5e6);
        vm.expectRevert(
            abi.encodeWithSelector(ILiquidityPool.LiquidityPool__BelowMinDeposit.selector, 5e6, MIN_DEPOSIT)
        );
        pool.deposit(5e6);
        vm.stopPrank();
    }

    function test_Deposit_RevertsWhenDepositsDisabled() public {
        vm.prank(OWNER);
        pool.setDepositsEnabled(false);

        vm.startPrank(ALICE);
        usdt.approve(address(pool), 100e6);
        vm.expectRevert(ILiquidityPool.LiquidityPool__DepositsDisabled.selector);
        pool.deposit(100e6);
        vm.stopPrank();
    }

    function test_Deposit_EmitsEvent() public {
        vm.startPrank(ALICE);
        usdt.approve(address(pool), 1_000e6);
        vm.expectEmit(true, false, false, true);
        emit Deposited(ALICE, 1_000e6, 1_000e6);
        pool.deposit(1_000e6);
        vm.stopPrank();
    }

    // ══════════════════════════════════════════════════════════════════════════
    // withdraw()
    // ══════════════════════════════════════════════════════════════════════════

    function test_Withdraw_ReturnsCorrectUsdt() public {
        uint256 depositAmt = 1_000e6;
        uint256 aliceShares = _deposit(ALICE, depositAmt);

        uint256 balBefore = usdt.balanceOf(ALICE);
        vm.prank(ALICE);
        pool.withdraw(aliceShares);

        assertEq(usdt.balanceOf(ALICE) - balBefore, depositAmt);
        assertEq(pool.totalShares(), 0);
    }

    function test_Withdraw_SharePriceIncreasesAfterFees() public {
        _deposit(ALICE, 1_000e6);

        // Inject 200 USDT as fees (no new shares — price rises)
        vm.startPrank(BOB);
        usdt.approve(address(pool), 200e6);
        pool.addLiquidity(200e6);
        vm.stopPrank();

        // Pool: 1200 USDT, 1000 shares → price = 1.2 USDT/share
        // Alice withdraws all shares → gets 1200 USDT back
        uint256 balBefore   = usdt.balanceOf(ALICE);
        uint256 aliceShares = pool.shares(ALICE); // read before prank consumes the call
        vm.prank(ALICE);
        pool.withdraw(aliceShares);

        assertEq(usdt.balanceOf(ALICE) - balBefore, 1_200e6);
    }

    function test_Withdraw_RevertsInsufficientShares() public {
        uint256 shares = _deposit(ALICE, 1_000e6);

        vm.startPrank(ALICE);
        vm.expectRevert(
            abi.encodeWithSelector(
                ILiquidityPool.LiquidityPool__InsufficientShares.selector,
                shares + 1,
                shares
            )
        );
        pool.withdraw(shares + 1);
        vm.stopPrank();
    }

    function test_Withdraw_RevertsInsufficientLiquidity() public {
        // Deposit 10 000 USDT so allocation bounds are wide enough
        uint256 aliceShares = _deposit(ALICE, 10_000e6);

        // Agent allocates max (5% = 500 USDT) to a market
        MarketContract market = _deployMarket();
        vm.prank(AGENT);
        pool.allocateToMarket(address(market), 500e6);

        // Set deposits disabled & set minDeposit high so Bob cannot top up (cleaner test)
        // Alice tries to withdraw full 10000 USDT but only 9500 is available
        vm.startPrank(ALICE);
        vm.expectRevert(
            abi.encodeWithSelector(
                ILiquidityPool.LiquidityPool__InsufficientLiquidity.selector,
                10_000e6,
                9_500e6
            )
        );
        pool.withdraw(aliceShares);
        vm.stopPrank();
    }

    function test_Withdraw_EmitsEvent() public {
        uint256 shares = _deposit(ALICE, 1_000e6);

        vm.startPrank(ALICE);
        vm.expectEmit(true, false, false, true);
        emit Withdrawn(ALICE, 1_000e6, shares);
        pool.withdraw(shares);
        vm.stopPrank();
    }

    // ══════════════════════════════════════════════════════════════════════════
    // allocateToMarket()
    // ══════════════════════════════════════════════════════════════════════════

    function test_AllocateToMarket_TransfersUsdtAndUpdatesAccounting() public {
        _deposit(ALICE, 10_000e6);
        MarketContract market = _deployMarket();

        uint256 poolBalBefore   = usdt.balanceOf(address(pool));
        uint256 marketBalBefore = usdt.balanceOf(address(market));

        vm.prank(AGENT);
        pool.allocateToMarket(address(market), 500e6);

        assertEq(usdt.balanceOf(address(pool))   , poolBalBefore   - 500e6);
        assertEq(usdt.balanceOf(address(market)) , marketBalBefore + 500e6);
        assertEq(pool.totalAllocated()           , 500e6);
        assertEq(pool.marketAllocation(address(market)), 500e6);
        assertEq(pool.totalMarketsAllocated()    , 1);
    }

    function test_AllocateToMarket_TotalPoolValueUnchanged() public {
        _deposit(ALICE, 10_000e6);
        MarketContract market = _deployMarket();

        uint256 valueBefore = pool.totalPoolValue();
        vm.prank(AGENT);
        pool.allocateToMarket(address(market), 500e6);

        // Value = idle + allocated — should be unchanged
        assertEq(pool.totalPoolValue(), valueBefore);
    }

    function test_AllocateToMarket_SharePriceUnchanged() public {
        _deposit(ALICE, 10_000e6);
        MarketContract market = _deployMarket();

        uint256 priceBefore = pool.sharePrice();
        vm.prank(AGENT);
        pool.allocateToMarket(address(market), 500e6);

        assertEq(pool.sharePrice(), priceBefore);
    }

    function test_AllocateToMarket_RevertsFromNonAgent() public {
        _deposit(ALICE, 10_000e6);
        MarketContract market = _deployMarket();

        vm.prank(ALICE);
        vm.expectRevert(ILiquidityPool.LiquidityPool__NotAgent.selector);
        pool.allocateToMarket(address(market), 500e6);
    }

    function test_AllocateToMarket_RevertsIfMarketNotValid() public {
        _deposit(ALICE, 10_000e6);

        vm.prank(AGENT);
        vm.expectRevert(ILiquidityPool.LiquidityPool__NotValidMarket.selector);
        pool.allocateToMarket(address(0x1234), 500e6);
    }

    function test_AllocateToMarket_RevertsIfAlreadyAllocated() public {
        _deposit(ALICE, 10_000e6);
        MarketContract market = _deployMarket();

        vm.startPrank(AGENT);
        pool.allocateToMarket(address(market), 500e6);

        vm.expectRevert(
            abi.encodeWithSelector(ILiquidityPool.LiquidityPool__AlreadyAllocated.selector, address(market))
        );
        pool.allocateToMarket(address(market), 500e6);
        vm.stopPrank();
    }

    function test_AllocateToMarket_RevertsIfAmountExceedsMaxBps() public {
        _deposit(ALICE, 10_000e6);
        MarketContract market = _deployMarket();

        // max = 5% of 10 000 = 500 USDT. 501 should revert.
        vm.prank(AGENT);
        vm.expectRevert(
            abi.encodeWithSelector(ILiquidityPool.LiquidityPool__AllocationTooLarge.selector, 501e6, 500e6)
        );
        pool.allocateToMarket(address(market), 501e6);
    }

    function test_AllocateToMarket_RevertsIfAmountBelowMinBps() public {
        _deposit(ALICE, 10_000e6);
        MarketContract market = _deployMarket();

        // min = 0.5% of 10 000 = 50 USDT. 49 should revert.
        vm.prank(AGENT);
        vm.expectRevert(
            abi.encodeWithSelector(ILiquidityPool.LiquidityPool__AllocationTooSmall.selector, 49e6, 50e6)
        );
        pool.allocateToMarket(address(market), 49e6);
    }

    function test_AllocateToMarket_EmitsEvent() public {
        _deposit(ALICE, 10_000e6);
        MarketContract market = _deployMarket();

        vm.prank(AGENT);
        vm.expectEmit(true, false, false, false);
        emit AllocatedToMarket(address(market), 500e6, block.timestamp);
        pool.allocateToMarket(address(market), 500e6);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // returnFromMarket()
    // ══════════════════════════════════════════════════════════════════════════

    function test_ReturnFromMarket_UpdatesAccountingCorrectly() public {
        _deposit(ALICE, 10_000e6);
        MarketContract market = _deployMarket();

        vm.prank(AGENT);
        pool.allocateToMarket(address(market), 500e6);

        assertEq(pool.totalAllocated(), 500e6);

        // Simulate market returning principal (market transfers then calls accounting)
        // In practice MarketContract.returnLiquidityToPool does this
        vm.startPrank(address(market));
        usdt.mint(address(market), 500e6); // give market funds to return
        usdt.approve(address(pool), 500e6);
        // Transfer first (as market.returnLiquidityToPool would do)
        usdt.transfer(address(pool), 500e6);
        pool.returnFromMarket(500e6, 0);
        vm.stopPrank();

        assertEq(pool.totalAllocated(), 0);
        assertEq(pool.marketAllocation(address(market)), 0);
        assertTrue(pool.marketReturned(address(market)));
    }

    function test_ReturnFromMarket_FeesIncreaseSharePrice() public {
        _deposit(ALICE, 10_000e6);
        MarketContract market = _deployMarket();

        vm.prank(AGENT);
        pool.allocateToMarket(address(market), 500e6);

        uint256 priceBefore = pool.sharePrice();

        // Market returns 500 principal + 50 fees
        vm.startPrank(address(market));
        usdt.mint(address(market), 550e6);
        usdt.transfer(address(pool), 550e6);
        pool.returnFromMarket(500e6, 50e6);
        vm.stopPrank();

        assertGt(pool.sharePrice(), priceBefore);
        assertEq(pool.totalFeesEarned(), 50e6);
    }

    function test_ReturnFromMarket_RevertsIfAlreadyReturned() public {
        _deposit(ALICE, 10_000e6);
        MarketContract market = _deployMarket();

        vm.prank(AGENT);
        pool.allocateToMarket(address(market), 500e6);

        vm.startPrank(address(market));
        usdt.mint(address(market), 500e6);
        usdt.transfer(address(pool), 500e6);
        pool.returnFromMarket(500e6, 0);

        vm.expectRevert(
            abi.encodeWithSelector(ILiquidityPool.LiquidityPool__AlreadyReturned.selector, address(market))
        );
        pool.returnFromMarket(0, 0);
        vm.stopPrank();
    }

    function test_ReturnFromMarket_RevertsIfNoAllocationFound() public {
        MarketContract market = _deployMarket();

        vm.prank(address(market));
        vm.expectRevert(
            abi.encodeWithSelector(ILiquidityPool.LiquidityPool__NoAllocationFound.selector, address(market))
        );
        pool.returnFromMarket(0, 0);
    }

    function test_ReturnFromMarket_RevertsFromNonMarket() public {
        vm.prank(ALICE);
        vm.expectRevert(ILiquidityPool.LiquidityPool__NotValidMarket.selector);
        pool.returnFromMarket(0, 0);
    }

    function test_ReturnFromMarket_EmitsEvent() public {
        _deposit(ALICE, 10_000e6);
        MarketContract market = _deployMarket();

        vm.prank(AGENT);
        pool.allocateToMarket(address(market), 500e6);

        vm.startPrank(address(market));
        usdt.mint(address(market), 500e6);
        usdt.transfer(address(pool), 500e6);

        vm.expectEmit(true, false, false, false);
        emit ReturnedFromMarket(address(market), 500e6, 0, block.timestamp);
        pool.returnFromMarket(500e6, 0);
        vm.stopPrank();
    }

    // ══════════════════════════════════════════════════════════════════════════
    // addLiquidity()
    // ══════════════════════════════════════════════════════════════════════════

    function test_AddLiquidity_AddsUsdtToPool() public {
        uint256 balBefore = usdt.balanceOf(address(pool));

        vm.startPrank(ALICE);
        usdt.approve(address(pool), 500e6);
        pool.addLiquidity(500e6);
        vm.stopPrank();

        assertEq(usdt.balanceOf(address(pool)), balBefore + 500e6);
    }

    function test_AddLiquidity_DoesNotIssueShares() public {
        uint256 sharesBefore = pool.totalShares();

        vm.startPrank(ALICE);
        usdt.approve(address(pool), 500e6);
        pool.addLiquidity(500e6);
        vm.stopPrank();

        assertEq(pool.totalShares(), sharesBefore);
        assertEq(pool.shares(ALICE), 0);
    }

    function test_AddLiquidity_IncreasesSharePriceForExistingLPs() public {
        _deposit(ALICE, 1_000e6);
        uint256 priceBefore = pool.sharePrice();

        vm.startPrank(BOB);
        usdt.approve(address(pool), 200e6);
        pool.addLiquidity(200e6);
        vm.stopPrank();

        assertGt(pool.sharePrice(), priceBefore);
    }

    function test_AddLiquidity_EmitsEvent() public {
        vm.startPrank(ALICE);
        usdt.approve(address(pool), 500e6);
        vm.expectEmit(true, false, false, true);
        emit LiquidityAdded(ALICE, 500e6);
        pool.addLiquidity(500e6);
        vm.stopPrank();
    }

    function test_AddLiquidity_RevertsOnZeroAmount() public {
        vm.prank(ALICE);
        vm.expectRevert(ILiquidityPool.LiquidityPool__ZeroAmount.selector);
        pool.addLiquidity(0);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // sharePrice()
    // ══════════════════════════════════════════════════════════════════════════

    function test_SharePrice_StartsAtOneMicroUsdt() public view {
        assertEq(pool.sharePrice(), 1e6);
    }

    function test_SharePrice_IncreasesProportionallyWithFees() public {
        _deposit(ALICE, 1_000e6);

        // Pool = 1000 USDT, 1000 shares → price = 1e6
        assertEq(pool.sharePrice(), 1e6);

        // Add 1000 USDT fees via addLiquidity (no shares)
        vm.startPrank(BOB);
        usdt.approve(address(pool), 1_000e6);
        pool.addLiquidity(1_000e6);
        vm.stopPrank();

        // Pool = 2000 USDT, 1000 shares → price = 2e6
        assertEq(pool.sharePrice(), 2e6);
    }

    function test_SharePrice_UnchangedByNewDeposits() public {
        _deposit(ALICE, 1_000e6);
        uint256 priceBefore = pool.sharePrice();

        _deposit(BOB, 500e6);

        assertEq(pool.sharePrice(), priceBefore);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // returnLiquidityToPool (MarketContract integration)
    // ══════════════════════════════════════════════════════════════════════════

    function test_MarketReturnLiquidityToPool_ReturnsCapitalAfterResolution() public {
        _deposit(ALICE, 10_000e6);
        MarketContract market = _deployMarket();

        // Agent allocates 500 USDT to market
        vm.prank(AGENT);
        pool.allocateToMarket(address(market), 500e6);

        uint256 marketBal = usdt.balanceOf(address(market));
        assertEq(marketBal, 500e6); // only pool allocation, no bettors

        // Fast-forward past deadline and resolve
        vm.warp(block.timestamp + 7 days + 1);
        market.triggerResolution();

        bytes32 reasonHash = keccak256("oracle reasoning");
        bytes memory attest = _oracleAttest(address(market), true, reasonHash);
        vm.prank(ORACLE);
        market.postResolution(true, reasonHash, attest);

        // Fast-forward past challenge window
        vm.warp(block.timestamp + 25 hours);
        market.finalizeResolution();

        uint256 poolBalBefore = usdt.balanceOf(address(pool));

        // Anyone can call returnLiquidityToPool
        market.returnLiquidityToPool(address(pool));

        assertEq(usdt.balanceOf(address(pool)), poolBalBefore + 500e6);
        assertEq(pool.totalAllocated(), 0);
        assertTrue(pool.marketReturned(address(market)));
    }

    function test_MarketReturnLiquidityToPool_ReturnsCapitalAfterCancellation() public {
        _deposit(ALICE, 10_000e6);
        MarketContract market = _deployMarket();

        vm.prank(AGENT);
        pool.allocateToMarket(address(market), 500e6);

        // Deadline passes, oracle cancels
        vm.warp(block.timestamp + 7 days + 1);
        market.triggerResolution();

        vm.prank(ORACLE);
        market.cancelMarket("inconclusive");

        uint256 poolBalBefore = usdt.balanceOf(address(pool));
        market.returnLiquidityToPool(address(pool));

        assertEq(usdt.balanceOf(address(pool)), poolBalBefore + 500e6);
    }

    function test_MarketReturnLiquidityToPool_RevertsIfNotSettled() public {
        _deposit(ALICE, 10_000e6);
        MarketContract market = _deployMarket();

        vm.prank(AGENT);
        pool.allocateToMarket(address(market), 500e6);

        vm.expectRevert(MarketContract.MarketContract__NotSettled.selector);
        market.returnLiquidityToPool(address(pool));
    }

    function test_MarketReturnLiquidityToPool_RevertsIfCalledTwice() public {
        _deposit(ALICE, 10_000e6);
        MarketContract market = _deployMarket();

        vm.prank(AGENT);
        pool.allocateToMarket(address(market), 500e6);

        vm.warp(block.timestamp + 7 days + 1);
        market.triggerResolution();

        bytes32 reasonHash = keccak256("oracle reasoning");
        bytes memory attest = _oracleAttest(address(market), true, reasonHash);
        vm.prank(ORACLE);
        market.postResolution(true, reasonHash, attest);

        vm.warp(block.timestamp + 25 hours);
        market.finalizeResolution();

        market.returnLiquidityToPool(address(pool));

        vm.expectRevert(MarketContract.MarketContract__PoolAlreadyReturned.selector);
        market.returnLiquidityToPool(address(pool));
    }

    function test_MarketReturnLiquidityToPool_NoOpWhenNoAllocation() public {
        _deposit(ALICE, 10_000e6);
        MarketContract market = _deployMarket();

        // No pool allocation — nothing to return
        vm.warp(block.timestamp + 7 days + 1);
        market.triggerResolution();

        vm.prank(ORACLE);
        market.cancelMarket("inconclusive");

        uint256 poolBalBefore = usdt.balanceOf(address(pool));
        market.returnLiquidityToPool(address(pool)); // should be no-op

        assertEq(usdt.balanceOf(address(pool)), poolBalBefore);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Admin
    // ══════════════════════════════════════════════════════════════════════════

    function test_SetMaxAllocationBps_UpdatesValue() public {
        vm.prank(OWNER);
        pool.setMaxAllocationBps(1_000);
        assertEq(pool.maxAllocationBps(), 1_000);
    }

    function test_SetMaxAllocationBps_RevertsAbove2000() public {
        vm.prank(OWNER);
        vm.expectRevert(
            abi.encodeWithSelector(ILiquidityPool.LiquidityPool__BpsTooHigh.selector, 2_001, 2_000)
        );
        pool.setMaxAllocationBps(2_001);
    }

    function test_RescueTokens_RevertsForUsdt() public {
        vm.prank(OWNER);
        vm.expectRevert(ILiquidityPool.LiquidityPool__CannotRescueUSDT.selector);
        pool.rescueTokens(address(usdt), 100e6);
    }

    function test_Constructor_RevertsOnZeroAddress() public {
        vm.expectRevert(ILiquidityPool.LiquidityPool__ZeroAddress.selector);
        new LiquidityPool(address(0), address(factory), AGENT, OWNER);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // getPoolStats()
    // ══════════════════════════════════════════════════════════════════════════

    function test_GetPoolStats_ReturnsCorrectValues() public {
        _deposit(ALICE, 10_000e6);
        MarketContract market = _deployMarket();
        vm.prank(AGENT);
        pool.allocateToMarket(address(market), 500e6);

        (
            uint256 available,
            uint256 allocated,
            uint256 totalValue,
            uint256 feesEarned,
            uint256 _totalShares,
            uint256 _sharePrice,
            uint256 utilization,
            uint256 marketsAllocated
        ) = pool.getPoolStats();

        assertEq(available,        9_500e6);
        assertEq(allocated,        500e6);
        assertEq(totalValue,       10_000e6);
        assertEq(feesEarned,       0);
        assertEq(_totalShares,     10_000e6);
        assertEq(_sharePrice,      1e6);
        assertEq(utilization,      500);   // 500/10000 * 10000 = 500 bps (5%)
        assertEq(marketsAllocated, 1);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // utilizationRate()
    // ══════════════════════════════════════════════════════════════════════════

    function test_UtilizationRate_ZeroWhenNothingAllocated() public view {
        assertEq(pool.utilizationRate(), 0);
    }

    function test_UtilizationRate_CorrectAfterAllocation() public {
        _deposit(ALICE, 10_000e6);
        MarketContract market = _deployMarket();

        vm.prank(AGENT);
        pool.allocateToMarket(address(market), 500e6); // 5%

        // 500 / 10000 * 10000 = 500 bps (5%)
        assertEq(pool.utilizationRate(), 500);
    }
}
