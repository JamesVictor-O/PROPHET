// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ILiquidityPool
/// @notice Interface for Prophet's protocol-owned liquidity pool
/// @dev Market maker agent calls allocateToMarket; markets call returnFromMarket
interface ILiquidityPool {

    // ─── Events ───────────────────────────────────────────────────────────────

    event Deposited(address indexed lp, uint256 usdtAmount, uint256 sharesIssued);
    event Withdrawn(address indexed lp, uint256 usdtAmount, uint256 sharesBurned);
    event AllocatedToMarket(address indexed market, uint256 amount, uint256 timestamp);
    event ReturnedFromMarket(address indexed market, uint256 principal, uint256 fees, uint256 timestamp);
    event LiquidityAdded(address indexed depositor, uint256 amount);
    event ConfigUpdated(string parameter, uint256 newValue);

    // ─── Errors ───────────────────────────────────────────────────────────────

    error LiquidityPool__ZeroAddress();
    error LiquidityPool__DepositsDisabled();
    error LiquidityPool__BelowMinDeposit(uint256 amount, uint256 minimum);
    error LiquidityPool__ZeroShares();
    error LiquidityPool__InsufficientShares(uint256 requested, uint256 available);
    error LiquidityPool__InsufficientLiquidity(uint256 requested, uint256 available);
    error LiquidityPool__NotAgent();
    error LiquidityPool__NotValidMarket();
    error LiquidityPool__AlreadyAllocated(address market);
    error LiquidityPool__AlreadyReturned(address market);
    error LiquidityPool__NoAllocationFound(address market);
    error LiquidityPool__AllocationTooLarge(uint256 amount, uint256 max);
    error LiquidityPool__AllocationTooSmall(uint256 amount, uint256 min);
    error LiquidityPool__CannotRescueUSDT();
    error LiquidityPool__BpsTooHigh(uint256 bps, uint256 max);
    error LiquidityPool__ZeroAmount();

    // ─── LP Functions ─────────────────────────────────────────────────────────

    /// @notice Deposit USDT and receive LP shares proportional to contribution
    function deposit(uint256 amount) external;

    /// @notice Burn LP shares and receive proportional USDT back
    function withdraw(uint256 shareAmount) external;

    // ─── Agent Functions ──────────────────────────────────────────────────────

    /// @notice Deploy liquidity from pool into a newly created market
    /// @dev Only callable by the market maker agent
    function allocateToMarket(address market, uint256 amount) external;

    // ─── Market Callback ──────────────────────────────────────────────────────

    /// @notice Market calls this after returning funds to update pool accounting
    /// @dev Market must have already transferred principal + fees to this contract
    /// @param principal The original allocated amount being returned
    /// @param fees Any additional fees earned on top of principal
    function returnFromMarket(uint256 principal, uint256 fees) external;

    // ─── Testing Gateway ──────────────────────────────────────────────────────

    /// @notice Add USDT to the pool without issuing shares — for testing only
    // @dev Testing only — remove post-hackathon
    function addLiquidity(uint256 amount) external;

    // ─── View Functions ───────────────────────────────────────────────────────

    /// @notice USDT currently idle in the pool (not deployed to markets)
    function availableLiquidity() external view returns (uint256);

    /// @notice Total pool value: idle + deployed capital
    function totalPoolValue() external view returns (uint256);

    /// @notice Current value of 1 LP share in USDT (6-decimal precision)
    function sharePrice() external view returns (uint256);

    /// @notice Amount of USDT allocated to a specific market
    function marketAllocation(address market) external view returns (uint256);

    /// @notice Full pool stats in one call — used by frontend
    function getPoolStats() external view returns (
        uint256 available,
        uint256 allocated,
        uint256 totalValue,
        uint256 feesEarned,
        uint256 _totalShares,
        uint256 _sharePrice,
        uint256 utilization,
        uint256 marketsAllocated
    );
}
