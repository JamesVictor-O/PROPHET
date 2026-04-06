// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IPositionVault } from "./IPositionVault.sol";

/// @title IPayoutDistributor
/// @notice Interface for Prophet's payout calculation and distribution contract
/// @dev Implemented by PayoutDistributor.sol
/// @dev Receives revealed positions from PositionVault, calculates shares, distributes USDT
interface IPayoutDistributor {

    // ─────────────────────────────────────────────────────────────
    // Structs
    // ─────────────────────────────────────────────────────────────

    /// @notice Full breakdown of a market's payout distribution
    /// @dev Emitted in PayoutsCalculated event for full transparency
    struct PayoutSummary {
        uint256 totalCollateral;     // Total USDT in the market pool
        uint256 oracleFee;           // Amount sent to oracle agent
        uint256 mmFee;               // Amount sent to market maker agent
        uint256 protocolFee;         // Amount sent to protocol treasury
        uint256 totalFees;           // Sum of all fees
        uint256 netPool;             // Pool distributed to winners
        uint256 totalWinners;        // Number of winning positions
        uint256 totalWinningStake;   // Total USDT staked by winners
        bool outcome;                // The market outcome (true=YES, false=NO)
    }

    // ─────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────

    event PayoutsCalculated(
        address indexed market,
        bool outcome,
        uint256 totalWinners,
        uint256 totalDistributed,
        uint256 totalFees
    );

    event FeeDistributed(
        address indexed market,
        address indexed recipient,
        uint256 amount,
        string feeType           // "oracle", "marketmaker", "protocol"
    );

    event WinnerPaid(
        address indexed market,
        address indexed winner,
        uint256 stake,
        uint256 payout
    );

    event NoWinnersEdgeCase(
        address indexed market,
        uint256 collateralSentToTreasury
    );

    // ─────────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────────

    error PayoutDistributor__NotPositionVault();
    error PayoutDistributor__MarketNotResolved();
    error PayoutDistributor__AlreadyDistributed();
    error PayoutDistributor__ArrayLengthMismatch();
    error PayoutDistributor__ZeroCollateral();
    error PayoutDistributor__TransferFailed(address recipient, uint256 amount);
    error PayoutDistributor__InvalidMarket();

    // ─────────────────────────────────────────────────────────────
    // State Variable Getters
    // ─────────────────────────────────────────────────────────────

    /// @notice The ProphetFactory — for market validation
    function factory() external view returns (address);

    /// @notice The PositionVault — only caller authorized to trigger distribution
    function positionVault() external view returns (address);

    /// @notice Oracle agent wallet — receives oracle fee
    function oracleAgent() external view returns (address);

    /// @notice Market maker agent wallet — receives market maker fee
    function marketMakerAgent() external view returns (address);

    /// @notice Protocol treasury — receives protocol fee
    function protocolTreasury() external view returns (address);

    /// @notice USDT token address
    function USDT() external view returns (address);

    /// @notice Whether payouts have been distributed for a given market
    /// @param market The market address to check
    function hasDistributed(address market) external view returns (bool);

    // ─────────────────────────────────────────────────────────────
    // Core Functions
    // ─────────────────────────────────────────────────────────────

    /// @notice Calculate winner shares and distribute USDT payouts
    /// @dev Called by PositionVault after TEE reveals all positions
    /// @dev This is the only entry point — triggered automatically after reveal
    /// @param market The resolved market address
    /// @param positions All revealed positions from PositionVault
    /// @param outcome The final market outcome (true=YES won, false=NO won)
    function calculateAndDistribute(
        address market,
        IPositionVault.RevealedPosition[] calldata positions,
        bool outcome
    ) external;

    // ─────────────────────────────────────────────────────────────
    // View Functions
    // ─────────────────────────────────────────────────────────────

    /// @notice Estimate the payout for a hypothetical bet given current pool state
    /// @dev Read-only — does not affect state. Estimate only, not guaranteed.
    /// @param market The market address
    /// @param stakeAmount The USDT amount being considered
    /// @param direction The bet direction (true=YES, false=NO)
    /// @return estimatedPayout The estimated USDT payout if this direction wins
    function getEstimatedPayout(
        address market,
        uint256 stakeAmount,
        bool direction
    ) external view returns (uint256 estimatedPayout);

    /// @notice Returns the payout summary for an already-distributed market
    /// @dev Returns empty struct if market has not been distributed yet
    /// @param market The market address
    function getPayoutSummary(
        address market
    ) external view returns (PayoutSummary memory);

    /// @notice Returns the fee constants used by this distributor
    function getFeeConstants() external pure returns (
        uint256 oracleFeeBps,
        uint256 mmFeeBps,
        uint256 protocolFeeBps,
        uint256 totalFeeBps
    );
}
