// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title FeeLib
/// @notice Handles all fee-related constants and calculations for Prophet
/// @dev All fee values are in basis points (BPS). 100 BPS = 1%. 10000 BPS = 100%
library FeeLib {

    // ─────────────────────────────────────────────────────────────
    // Fee Constants
    // ─────────────────────────────────────────────────────────────

    /// @notice Denominator for all basis point calculations
    uint256 internal constant BPS_DENOMINATOR = 10_000;

    /// @notice Oracle agent fee — 1% of total collateral pool
    /// @dev Paid to the oracle agent wallet as incentive for accurate resolution
    uint256 internal constant ORACLE_FEE_BPS = 100;

    /// @notice Market maker agent fee — 1% of total collateral pool
    /// @dev Paid to the market maker agent wallet as incentive for providing liquidity
    uint256 internal constant MM_FEE_BPS = 100;

    /// @notice Protocol treasury fee — 0.5% of total collateral pool
    /// @dev Paid to the Prophet protocol treasury for development and governance
    uint256 internal constant PROTOCOL_FEE_BPS = 50;

    /// @notice Total fee in basis points — 2.5% of total collateral pool
    /// @dev Sum of all three fees — used for validation and quick reference
    uint256 internal constant TOTAL_FEE_BPS = ORACLE_FEE_BPS + MM_FEE_BPS + PROTOCOL_FEE_BPS;

    /// @notice Challenge stake in basis points — 5% of total collateral
    /// @dev Challenger must stake this amount to file a resolution challenge
    uint256 internal constant CHALLENGE_STAKE_BPS = 500;

    /// @notice Minimum absolute challenge stake — 50 USDT (6 decimals)
    /// @dev Prevents cheap challenges on small markets
    uint256 internal constant MIN_CHALLENGE_STAKE = 50e6;

    /// @notice Challenge reward for successful challengers
    /// @dev Challenger gets their stake back plus this percentage of the oracle fee
    uint256 internal constant CHALLENGE_REWARD_BPS = 5_000; // 50% of oracle fee

    // ─────────────────────────────────────────────────────────────
    // Structs
    // ─────────────────────────────────────────────────────────────

    /// @notice Holds the breakdown of all fees for a market
    struct FeeBreakdown {
        uint256 oracleFee;       // Amount going to oracle agent
        uint256 mmFee;           // Amount going to market maker agent
        uint256 protocolFee;     // Amount going to protocol treasury
        uint256 totalFees;       // Sum of all three fees
        uint256 netPool;         // Total collateral minus all fees — distributed to winners
    }

    // ─────────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────────

    error FeeLib__ZeroCollateral();
    error FeeLib__FeesExceedCollateral(uint256 fees, uint256 collateral);

    // ─────────────────────────────────────────────────────────────
    // Core Fee Functions
    // ─────────────────────────────────────────────────────────────

    /// @notice Calculate the complete fee breakdown for a market payout
    /// @param totalCollateral The total USDT collateral in the market pool
    /// @return breakdown A FeeBreakdown struct with all calculated amounts
    /// @dev This is the primary function called by PayoutDistributor
    function calculateFeeBreakdown(
        uint256 totalCollateral
    ) internal pure returns (FeeBreakdown memory breakdown) {
        if (totalCollateral == 0) revert FeeLib__ZeroCollateral();

        breakdown.oracleFee   = _bps(totalCollateral, ORACLE_FEE_BPS);
        breakdown.mmFee       = _bps(totalCollateral, MM_FEE_BPS);
        breakdown.protocolFee = _bps(totalCollateral, PROTOCOL_FEE_BPS);
        breakdown.totalFees   = breakdown.oracleFee + breakdown.mmFee + breakdown.protocolFee;
        breakdown.netPool     = totalCollateral - breakdown.totalFees;

        // Sanity check — fees should never exceed the pool
        if (breakdown.totalFees > totalCollateral) {
            revert FeeLib__FeesExceedCollateral(breakdown.totalFees, totalCollateral);
        }
    }

    /// @notice Calculate the required challenge stake for a given market pool
    /// @param totalCollateral The total USDT collateral in the market
    /// @return stake The required challenge stake amount
    /// @dev Returns whichever is larger: the BPS-based stake or the minimum absolute stake
    function calculateChallengeStake(
        uint256 totalCollateral
    ) internal pure returns (uint256 stake) {
        uint256 bpsStake = _bps(totalCollateral, CHALLENGE_STAKE_BPS);
        stake = bpsStake > MIN_CHALLENGE_STAKE ? bpsStake : MIN_CHALLENGE_STAKE;
    }

    /// @notice Calculate the reward paid to a successful challenger
    /// @param oracleFee The oracle fee amount for this market
    /// @return reward The USDT reward paid to the challenger on top of their stake refund
    /// @dev Challenger gets: stake refunded + 50% of oracle fee as reward
    function calculateChallengeReward(
        uint256 oracleFee
    ) internal pure returns (uint256 reward) {
        reward = _bps(oracleFee, CHALLENGE_REWARD_BPS);
    }

    // ─────────────────────────────────────────────────────────────
    // View Helpers
    // ─────────────────────────────────────────────────────────────

    /// @notice Returns the total fee percentage as basis points
    /// @return Total fees in BPS (250 = 2.5%)
    function totalFeeBps() internal pure returns (uint256) {
        return TOTAL_FEE_BPS;
    }

    /// @notice Returns the net pool percentage after fees as basis points
    /// @return Net pool in BPS (9750 = 97.5%)
    function netPoolBps() internal pure returns (uint256) {
        return BPS_DENOMINATOR - TOTAL_FEE_BPS;
    }

    /// @notice Estimates net pool for a given collateral amount
    /// @param totalCollateral The collateral to estimate for
    /// @return The estimated net pool (winners' share)
    function estimateNetPool(
        uint256 totalCollateral
    ) internal pure returns (uint256) {
        return totalCollateral - _bps(totalCollateral, TOTAL_FEE_BPS);
    }

    // ─────────────────────────────────────────────────────────────
    // Internal Helpers
    // ─────────────────────────────────────────────────────────────

    /// @notice Multiply amount by basis points and divide by denominator
    /// @param amount The base amount
    /// @param bps The basis points to apply
    /// @return result The calculated amount
    function _bps(
        uint256 amount,
        uint256 bps
    ) private pure returns (uint256 result) {
        result = (amount * bps) / BPS_DENOMINATOR;
    }
}
