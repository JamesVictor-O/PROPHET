// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IPayoutDistributor } from "./interfaces/IPayoutDistributor.sol";
import { IMarketContract } from "./interfaces/IMarketContract.sol";
import { IPositionVault } from "./interfaces/IPositionVault.sol";
import { IProphetFactory } from "./interfaces/IProphetFactory.sol";
import { FeeLib } from "./libraries/FeeLib.sol";
import { MarketLib } from "./libraries/MarketLib.sol";

/// @title PayoutDistributor
/// @notice Calculates proportional winner shares and distributes USDT payouts
/// @dev Called by PositionVault after TEE reveals all positions
/// @dev Deducts protocol fees then distributes net pool proportionally to winners
contract PayoutDistributor is IPayoutDistributor, ReentrancyGuard {

    using SafeERC20 for IERC20;

    // ─────────────────────────────────────────────────────────────
    // Immutables
    // ─────────────────────────────────────────────────────────────

    /// @inheritdoc IPayoutDistributor
    address public immutable override factory;

    /// @inheritdoc IPayoutDistributor
    address public immutable override positionVault;

    /// @inheritdoc IPayoutDistributor
    address public immutable override oracleAgent;

    /// @inheritdoc IPayoutDistributor
    address public immutable override marketMakerAgent;

    /// @inheritdoc IPayoutDistributor
    address public immutable override protocolTreasury;

    /// @inheritdoc IPayoutDistributor
    address public immutable override USDT;

    // ─────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────

    /// @notice Whether payouts have been distributed for each market
    mapping(address => bool) private _hasDistributed;

    /// @notice Stored payout summaries per market — for transparency and frontend queries
    mapping(address => PayoutSummary) private _payoutSummaries;

    // ─────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────

    /// @param _factory ProphetFactory address
    /// @param _positionVault PositionVault address — only authorized caller
    /// @param _oracleAgent Oracle agent wallet — receives oracle fee
    /// @param _marketMakerAgent Market maker wallet — receives MM fee
    /// @param _protocolTreasury Protocol treasury — receives protocol fee
    /// @param _usdt USDT token address
    constructor(
        address _factory,
        address _positionVault,
        address _oracleAgent,
        address _marketMakerAgent,
        address _protocolTreasury,
        address _usdt
    ) {
        if (_factory == address(0))          revert PayoutDistributor__InvalidMarket();
        if (_positionVault == address(0))    revert PayoutDistributor__InvalidMarket();
        if (_oracleAgent == address(0))      revert PayoutDistributor__InvalidMarket();
        if (_marketMakerAgent == address(0)) revert PayoutDistributor__InvalidMarket();
        if (_protocolTreasury == address(0)) revert PayoutDistributor__InvalidMarket();
        if (_usdt == address(0))             revert PayoutDistributor__InvalidMarket();

        factory          = _factory;
        positionVault    = _positionVault;
        oracleAgent      = _oracleAgent;
        marketMakerAgent = _marketMakerAgent;
        protocolTreasury = _protocolTreasury;
        USDT             = _usdt;
    }

    // ─────────────────────────────────────────────────────────────
    // Core Distribution Function
    // ─────────────────────────────────────────────────────────────

    /// @inheritdoc IPayoutDistributor
    function calculateAndDistribute(
        address market,
        IPositionVault.RevealedPosition[] calldata positions,
        bool outcome
    ) external override nonReentrant {
        // Only PositionVault can trigger distribution
        if (msg.sender != positionVault) revert PayoutDistributor__NotPositionVault();

        // Validate market
        if (!IProphetFactory(factory).isValidMarket(market)) {
            revert PayoutDistributor__InvalidMarket();
        }

        // Market must be resolved
        IMarketContract.MarketStatus marketStatus = IMarketContract(market).status();
        if (marketStatus != IMarketContract.MarketStatus.Resolved) {
            revert PayoutDistributor__MarketNotResolved();
        }

        // Prevent double distribution
        if (_hasDistributed[market]) revert PayoutDistributor__AlreadyDistributed();

        // Get total collateral from market contract
        uint256 totalCollateral = IMarketContract(market).totalCollateral();
        if (totalCollateral == 0) revert PayoutDistributor__ZeroCollateral();

        // Calculate all fees using FeeLib
        FeeLib.FeeBreakdown memory fees = FeeLib.calculateFeeBreakdown(totalCollateral);

        // Separate winners from losers
        // Winners = bettors whose direction matches the outcome
        uint256 winnerCount;
        uint256 totalWinningStake;

        // First pass — count winners and total winning stake
        for (uint256 i = 0; i < positions.length; ) {
            if (positions[i].direction == outcome) {
                totalWinningStake += positions[i].collateralAmount;
                unchecked { ++winnerCount; }
            }
            unchecked { ++i; }
        }

        // Build winner arrays and calculate payouts
        address[] memory winners  = new address[](winnerCount);
        uint256[] memory amounts  = new uint256[](winnerCount);

        if (winnerCount == 0) {
            // Edge case: nobody bet on the winning side
            // Send entire net pool to protocol treasury
            _handleNoWinners(market, fees);
            _markDistributed(market, totalCollateral, fees, 0, 0, outcome);
            return;
        }

        // Second pass — calculate each winner's proportional payout
        uint256 winnerIndex;
        for (uint256 i = 0; i < positions.length; ) {
            if (positions[i].direction == outcome) {
                uint256 payout = MarketLib.calculatePayout(
                    positions[i].collateralAmount,
                    totalWinningStake,
                    fees.netPool
                );

                winners[winnerIndex] = positions[i].bettor;
                amounts[winnerIndex] = payout;

                emit WinnerPaid(
                    market,
                    positions[i].bettor,
                    positions[i].collateralAmount,
                    payout
                );

                unchecked { ++winnerIndex; }
            }
            unchecked { ++i; }
        }

        // Mark as distributed before external calls
        _markDistributed(market, totalCollateral, fees, winnerCount, totalWinningStake, outcome);

        // Execute the actual USDT transfers via MarketContract
        // MarketContract holds the USDT and performs the transfers
        IMarketContract(market).distributePayout(winners, amounts);

        emit PayoutsCalculated(
            market,
            outcome,
            winnerCount,
            fees.netPool,
            fees.totalFees
        );
    }

    // ─────────────────────────────────────────────────────────────
    // View Functions
    // ─────────────────────────────────────────────────────────────

    /// @inheritdoc IPayoutDistributor
    function hasDistributed(address market) external view override returns (bool) {
        return _hasDistributed[market];
    }

    /// @inheritdoc IPayoutDistributor
    function getEstimatedPayout(
        address market,
        uint256 stakeAmount,
        bool direction
    ) external view override returns (uint256 estimatedPayout) {
        uint256 totalCollateral = IMarketContract(market).totalCollateral();
        if (totalCollateral == 0 || stakeAmount == 0) return 0;

        // Estimate net pool after fees
        uint256 netPool = FeeLib.estimateNetPool(totalCollateral + stakeAmount);

        // Get current revealed positions to calculate winning stake
        // For open markets, use committed totals as approximation
        // This is an estimate — actual payout depends on final pool composition
        IPositionVault.RevealedPosition[] memory revealed =
            IPositionVault(positionVault).getRevealedPositions(market);

        uint256 totalDirectionStake = stakeAmount;
        for (uint256 i = 0; i < revealed.length; ) {
            if (revealed[i].direction == direction) {
                totalDirectionStake += revealed[i].collateralAmount;
            }
            unchecked { ++i; }
        }

        estimatedPayout = MarketLib.calculatePayout(
            stakeAmount,
            totalDirectionStake,
            netPool
        );
    }

    /// @inheritdoc IPayoutDistributor
    function getPayoutSummary(
        address market
    ) external view override returns (PayoutSummary memory) {
        return _payoutSummaries[market];
    }

    /// @inheritdoc IPayoutDistributor
    function getFeeConstants() external pure override returns (
        uint256 oracleFeeBps,
        uint256 mmFeeBps,
        uint256 protocolFeeBps,
        uint256 totalFeeBps
    ) {
        return (
            FeeLib.ORACLE_FEE_BPS,
            FeeLib.MM_FEE_BPS,
            FeeLib.PROTOCOL_FEE_BPS,
            FeeLib.TOTAL_FEE_BPS
        );
    }

    // ─────────────────────────────────────────────────────────────
    // Internal Helpers
    // ─────────────────────────────────────────────────────────────

    /// @notice Handle the edge case where no bettors picked the winning side
    /// @dev Sends entire net pool to protocol treasury
    function _handleNoWinners(
        address market,
        FeeLib.FeeBreakdown memory fees
    ) internal {
        // Build single-element arrays pointing to treasury
        address[] memory recipients = new address[](1);
        uint256[] memory amounts    = new uint256[](1);

        recipients[0] = protocolTreasury;
        amounts[0]    = fees.netPool;

        // Send net pool to treasury via market contract
        IMarketContract(market).distributePayout(recipients, amounts);

        emit NoWinnersEdgeCase(market, fees.netPool);
    }

    /// @notice Record distribution in state and store payout summary
    function _markDistributed(
        address market,
        uint256 totalCollateral,
        FeeLib.FeeBreakdown memory fees,
        uint256 winnerCount,
        uint256 totalWinningStake,
        bool outcome
    ) internal {
        _hasDistributed[market] = true;

        _payoutSummaries[market] = PayoutSummary({
            totalCollateral:   totalCollateral,
            oracleFee:         fees.oracleFee,
            mmFee:             fees.mmFee,
            protocolFee:       fees.protocolFee,
            totalFees:         fees.totalFees,
            netPool:           fees.netPool,
            totalWinners:      winnerCount,
            totalWinningStake: totalWinningStake,
            outcome:           outcome
        });
    }
}
