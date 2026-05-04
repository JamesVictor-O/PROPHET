// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IProphetFactory } from "./interfaces/IProphetFactory.sol";
import { ILiquidityPool } from "./interfaces/ILiquidityPool.sol";

/// @title LiquidityPool
/// @notice Protocol-owned liquidity for Prophet prediction markets.
///         LPs deposit USDT and receive shares. The market maker agent
///         allocates capital to new markets; markets return principal
///         (+ any fees) after resolution or cancellation.
/// @dev    Share price = totalPoolValue / totalShares.
///         Pool value grows as fees are returned from markets.
contract LiquidityPool is ILiquidityPool, ReentrancyGuard, Ownable {

    using SafeERC20 for IERC20;

    // ─────────────────────────────────────────────────────────────────────────
    // Immutables
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice USDT token on 0G Chain (6 decimals)
    address public immutable USDT;

    /// @notice ProphetFactory — used to validate market addresses
    address public immutable factory;

    /// @notice Market maker agent wallet — only address that can call allocateToMarket
    address public immutable agent;

    // ─────────────────────────────────────────────────────────────────────────
    // LP Share Tracking
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Total LP shares currently in circulation
    uint256 public totalShares;

    /// @notice LP address → their share balance
    mapping(address => uint256) public shares;

    // ─────────────────────────────────────────────────────────────────────────
    // Pool Accounting
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Cumulative USDT deposited via deposit() and addLiquidity()
    uint256 public totalDeposited;

    /// @notice USDT currently deployed in active markets
    uint256 public totalAllocated;

    /// @notice Cumulative fees returned from all resolved markets
    uint256 public totalFeesEarned;

    /// @notice Count of markets that have received an allocation
    uint256 public totalMarketsAllocated;

    // ─────────────────────────────────────────────────────────────────────────
    // Per-Market Tracking
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice market address → USDT allocated to it
    mapping(address => uint256) public marketAllocation;

    /// @notice market address → has the market returned funds?
    mapping(address => bool) public marketReturned;

    // ─────────────────────────────────────────────────────────────────────────
    // Configuration
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Minimum USDT deposit amount (default: 10 USDT)
    uint256 public minDeposit;

    /// @notice Maximum % of pool per market in BPS (default: 500 = 5%)
    uint256 public maxAllocationBps;

    /// @notice Minimum % of pool per market in BPS (default: 50 = 0.5%)
    uint256 public minAllocationBps;

    /// @notice Whether new deposits are accepted
    bool public depositsEnabled;

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    constructor(
        address _usdt,
        address _factory,
        address _agent,
        address _owner
    ) Ownable(_owner) {
        if (_usdt    == address(0)) revert LiquidityPool__ZeroAddress();
        if (_factory == address(0)) revert LiquidityPool__ZeroAddress();
        if (_agent   == address(0)) revert LiquidityPool__ZeroAddress();
        if (_owner   == address(0)) revert LiquidityPool__ZeroAddress();

        USDT    = _usdt;
        factory = _factory;
        agent   = _agent;

        minDeposit       = 10e6;   // 10 USDT
        maxAllocationBps = 500;    // 5%
        minAllocationBps = 50;     // 0.5%
        depositsEnabled  = true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LP Functions
    // ─────────────────────────────────────────────────────────────────────────

    /// @inheritdoc ILiquidityPool
    function deposit(uint256 amount) external override nonReentrant {
        if (!depositsEnabled) revert LiquidityPool__DepositsDisabled();
        if (amount < minDeposit) revert LiquidityPool__BelowMinDeposit(amount, minDeposit);

        // Calculate shares to mint BEFORE transfer (checked-effects-interactions)
        uint256 sharesToMint;
        uint256 poolVal = totalPoolValue();

        if (totalShares == 0 || poolVal == 0) {
            // First deposit — 1 share per 1 USDT unit
            sharesToMint = amount;
        } else {
            // Proportional: new shares = amount * totalShares / poolValue
            sharesToMint = (amount * totalShares) / poolVal;
        }

        if (sharesToMint == 0) revert LiquidityPool__ZeroShares();

        // Effects
        shares[msg.sender] += sharesToMint;
        totalShares        += sharesToMint;
        totalDeposited     += amount;

        // Interaction
        IERC20(USDT).safeTransferFrom(msg.sender, address(this), amount);

        emit Deposited(msg.sender, amount, sharesToMint);
    }

    /// @inheritdoc ILiquidityPool
    function withdraw(uint256 shareAmount) external override nonReentrant {
        if (shareAmount == 0) revert LiquidityPool__ZeroShares();
        if (shares[msg.sender] < shareAmount)
            revert LiquidityPool__InsufficientShares(shareAmount, shares[msg.sender]);

        // Calculate USDT to return: proportional to share of total pool value
        uint256 usdtAmount = (shareAmount * totalPoolValue()) / totalShares;

        uint256 available = availableLiquidity();
        if (usdtAmount > available)
            revert LiquidityPool__InsufficientLiquidity(usdtAmount, available);

        // Effects
        shares[msg.sender] -= shareAmount;
        totalShares        -= shareAmount;

        // Interaction
        IERC20(USDT).safeTransfer(msg.sender, usdtAmount);

        emit Withdrawn(msg.sender, usdtAmount, shareAmount);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Agent Function
    // ─────────────────────────────────────────────────────────────────────────

    /// @inheritdoc ILiquidityPool
    function allocateToMarket(
        address market,
        uint256 amount
    ) external override nonReentrant {
        if (msg.sender != agent) revert LiquidityPool__NotAgent();
        if (!IProphetFactory(factory).isValidMarket(market))
            revert LiquidityPool__NotValidMarket();
        if (marketAllocation[market] != 0)
            revert LiquidityPool__AlreadyAllocated(market);
        if (amount == 0) revert LiquidityPool__ZeroAmount();

        uint256 available = availableLiquidity();
        if (amount > available)
            revert LiquidityPool__InsufficientLiquidity(amount, available);

        uint256 poolVal = totalPoolValue();
        uint256 maxAmt  = (poolVal * maxAllocationBps) / 10_000;
        uint256 minAmt  = (poolVal * minAllocationBps) / 10_000;

        if (amount > maxAmt) revert LiquidityPool__AllocationTooLarge(amount, maxAmt);
        if (amount < minAmt) revert LiquidityPool__AllocationTooSmall(amount, minAmt);

        // Effects
        marketAllocation[market]  = amount;
        totalAllocated           += amount;
        totalMarketsAllocated    += 1;

        // Interaction — push USDT directly to market contract
        IERC20(USDT).safeTransfer(market, amount);

        emit AllocatedToMarket(market, amount, block.timestamp);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Market Callback
    // ─────────────────────────────────────────────────────────────────────────

    /// @inheritdoc ILiquidityPool
    /// @dev The market must transfer (principal + fees) to this contract BEFORE
    ///      calling this function. This function only updates accounting.
    ///      Access-controlled to valid Prophet markets — safe to trust.
    function returnFromMarket(
        uint256 principal,
        uint256 fees
    ) external override nonReentrant {
        if (!IProphetFactory(factory).isValidMarket(msg.sender))
            revert LiquidityPool__NotValidMarket();
        if (marketReturned[msg.sender])
            revert LiquidityPool__AlreadyReturned(msg.sender);
        if (marketAllocation[msg.sender] == 0)
            revert LiquidityPool__NoAllocationFound(msg.sender);

        // Effects — update accounting to reflect returned capital
        uint256 allocated = marketAllocation[msg.sender];
        totalAllocated              -= allocated;
        totalFeesEarned             += fees;
        marketReturned[msg.sender]  = true;
        marketAllocation[msg.sender] = 0;

        emit ReturnedFromMarket(msg.sender, principal, fees, block.timestamp);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Testing Gateway
    // ─────────────────────────────────────────────────────────────────────────

    // @dev Testing only — remove post-hackathon
    /// @inheritdoc ILiquidityPool
    function addLiquidity(uint256 amount) external override nonReentrant {
        if (amount == 0) revert LiquidityPool__ZeroAmount();

        // Effects
        totalDeposited += amount;

        // Interaction
        IERC20(USDT).safeTransferFrom(msg.sender, address(this), amount);

        emit LiquidityAdded(msg.sender, amount);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // View Functions
    // ─────────────────────────────────────────────────────────────────────────

    /// @inheritdoc ILiquidityPool
    function availableLiquidity() public view override returns (uint256) {
        return IERC20(USDT).balanceOf(address(this));
    }

    /// @inheritdoc ILiquidityPool
    function totalPoolValue() public view override returns (uint256) {
        return availableLiquidity() + totalAllocated;
    }

    /// @inheritdoc ILiquidityPool
    function sharePrice() public view override returns (uint256) {
        if (totalShares == 0) return 1e6; // 1 USDT per share before any deposits
        return (totalPoolValue() * 1e6) / totalShares;
    }

    /// @notice How much USDT a given LP can withdraw right now
    function withdrawableAmount(address lp) public view returns (uint256) {
        if (totalShares == 0) return 0;
        return (shares[lp] * totalPoolValue()) / totalShares;
    }

    /// @notice Pool utilization rate in BPS (deployed / total)
    function utilizationRate() public view returns (uint256) {
        uint256 poolVal = totalPoolValue();
        if (poolVal == 0) return 0;
        return (totalAllocated * 10_000) / poolVal;
    }

    /// @inheritdoc ILiquidityPool
    function getPoolStats() external view override returns (
        uint256 available,
        uint256 allocated,
        uint256 totalValue,
        uint256 feesEarned,
        uint256 _totalShares,
        uint256 _sharePrice,
        uint256 utilization,
        uint256 marketsAllocated
    ) {
        available        = availableLiquidity();
        allocated        = totalAllocated;
        totalValue       = totalPoolValue();
        feesEarned       = totalFeesEarned;
        _totalShares     = totalShares;
        _sharePrice      = sharePrice();
        utilization      = utilizationRate();
        marketsAllocated = totalMarketsAllocated;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Admin Functions
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Update minimum deposit amount
    function setMinDeposit(uint256 newMin) external onlyOwner {
        minDeposit = newMin;
        emit ConfigUpdated("minDeposit", newMin);
    }

    /// @notice Update maximum allocation per market in BPS
    function setMaxAllocationBps(uint256 newBps) external onlyOwner {
        if (newBps > 2_000) revert LiquidityPool__BpsTooHigh(newBps, 2_000);
        maxAllocationBps = newBps;
        emit ConfigUpdated("maxAllocationBps", newBps);
    }

    /// @notice Update minimum allocation per market in BPS
    function setMinAllocationBps(uint256 newBps) external onlyOwner {
        minAllocationBps = newBps;
        emit ConfigUpdated("minAllocationBps", newBps);
    }

    /// @notice Pause or unpause new deposits
    function setDepositsEnabled(bool enabled) external onlyOwner {
        depositsEnabled = enabled;
    }

    /// @notice Rescue non-USDT tokens accidentally sent to the contract
    function rescueTokens(address token, uint256 amount) external onlyOwner {
        if (token == USDT) revert LiquidityPool__CannotRescueUSDT();
        IERC20(token).safeTransfer(owner(), amount);
    }
}
