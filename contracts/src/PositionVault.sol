// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IPositionVault } from "./interfaces/IPositionVault.sol";
import { IMarketContract } from "./interfaces/IMarketContract.sol";
import { IPayoutDistributor } from "./interfaces/IPayoutDistributor.sol";
import { IProphetFactory } from "./interfaces/IProphetFactory.sol";

/// @title PositionVault
/// @notice Sealed position custody for Prophet prediction markets
/// @dev Receives encrypted bets, holds them sealed until market resolution
/// @dev TEE decryption happens off-chain — oracle agent submits results back on-chain
/// @dev Privacy guarantee: direction and size of every bet is hidden until simultaneous reveal
contract PositionVault is IPositionVault, ReentrancyGuard {

    using SafeERC20 for IERC20;

    // ─────────────────────────────────────────────────────────────
    // Immutables
    // ─────────────────────────────────────────────────────────────

    /// @inheritdoc IPositionVault
    address public immutable override factory;

    /// @inheritdoc IPositionVault
    address public immutable override oracleAgent;

    /// @inheritdoc IPositionVault
    address public immutable override USDT;

    /// @notice PayoutDistributor — called after positions are revealed
    address public immutable payoutDistributor;

    // ─────────────────────────────────────────────────────────────
    // Position Storage
    // ─────────────────────────────────────────────────────────────

    /// @notice All sealed positions per market
    mapping(address => EncryptedPosition[]) private _marketPositions;

    /// @notice Revealed positions per market (populated after TEE decryption)
    mapping(address => RevealedPosition[]) private _revealedPositions;

    /// @notice Total USDT committed per market
    mapping(address => uint256) private _totalCommitted;

    /// @notice Whether a market's positions have been revealed
    mapping(address => bool) private _hasRevealed;

    /// @notice Whether a specific bettor has a position in a specific market
    mapping(address => mapping(address => bool)) private _hasBet;

    // ─────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────

    /// @param _factory ProphetFactory address — used to validate market callers
    /// @param _oracleAgent Oracle agent address — authorized to reveal positions
    /// @param _usdt USDT token address
    /// @param _payoutDistributor PayoutDistributor address — called after reveal
    constructor(
        address _factory,
        address _oracleAgent,
        address _usdt,
        address _payoutDistributor
    ) {
        if (_factory == address(0))          revert PositionVault__NotValidMarket();
        if (_oracleAgent == address(0))      revert PositionVault__NotOracleAgent();
        if (_usdt == address(0))             revert PositionVault__ZeroCollateral();
        if (_payoutDistributor == address(0)) revert PositionVault__ZeroCollateral();

        factory           = _factory;
        oracleAgent       = _oracleAgent;
        USDT              = _usdt;
        payoutDistributor = _payoutDistributor;
    }

    // ─────────────────────────────────────────────────────────────
    // Modifiers
    // ─────────────────────────────────────────────────────────────

    /// @notice Only valid Prophet markets (deployed by factory) can call
    modifier onlyValidMarket() {
        if (!IProphetFactory(factory).isValidMarket(msg.sender)) {
            revert PositionVault__NotValidMarket();
        }
        _;
    }

    /// @notice Only the oracle agent can call
    modifier onlyOracle() {
        if (msg.sender != oracleAgent) revert PositionVault__NotOracleAgent();
        _;
    }

    // ─────────────────────────────────────────────────────────────
    // Core Functions
    // ─────────────────────────────────────────────────────────────

    /// @inheritdoc IPositionVault
    function commitPosition(
        address market,
        address bettor,
        bytes calldata encryptedCommitment,
        uint256 collateralAmount
    ) external override onlyValidMarket {
        // Validate inputs
        if (encryptedCommitment.length == 0) revert PositionVault__ZeroCommitment();
        if (collateralAmount == 0)           revert PositionVault__ZeroCollateral();

        // Validate market is still open
        IMarketContract.MarketStatus marketStatus = IMarketContract(market).status();
        if (marketStatus != IMarketContract.MarketStatus.Open) {
            revert PositionVault__MarketNotResolved(); // reusing error — market not accepting bets
        }

        // Store the encrypted position
        uint256 positionIndex = _marketPositions[market].length;

        _marketPositions[market].push(EncryptedPosition({
            bettor:               bettor,
            encryptedCommitment:  encryptedCommitment,
            collateralAmount:     collateralAmount,
            timestamp:            block.timestamp,
            revealed:             false
        }));

        // Update accounting
        _totalCommitted[market] += collateralAmount;
        _hasBet[market][bettor] = true;

        emit PositionCommitted(market, bettor, collateralAmount, positionIndex);
    }

    /// @inheritdoc IPositionVault
    function revealPositions(
        address market,
        RevealedPosition[] calldata positions,
        bytes calldata teeDecryptionProof
    ) external override onlyOracle nonReentrant {
        // Market must be resolved before revealing
        IMarketContract.MarketStatus marketStatus = IMarketContract(market).status();
        if (marketStatus != IMarketContract.MarketStatus.Resolved) {
            revert PositionVault__MarketNotResolved();
        }

        // Cannot reveal twice
        if (_hasRevealed[market]) revert PositionVault__AlreadyRevealed();

        // Must have positions to reveal
        uint256 storedCount = _marketPositions[market].length;
        if (storedCount == 0) revert PositionVault__NoPositionsToReveal();

        // Revealed position count must match stored position count
        if (positions.length != storedCount) {
            revert PositionVault__PositionCountMismatch(storedCount, positions.length);
        }

        // Validate TEE decryption proof
        // TODO: integrate 0G TEE verification SDK
        // For hackathon MVP: stub — non-empty proof is considered valid
        if (!_verifyTeeDecryptionProof(teeDecryptionProof)) {
            revert PositionVault__InvalidTeeProof();
        }

        // Store all revealed positions
        for (uint256 i = 0; i < positions.length; ) {
            _revealedPositions[market].push(positions[i]);
            _marketPositions[market][i].revealed = true;
            unchecked { ++i; }
        }

        _hasRevealed[market] = true;

        emit PositionsRevealed(market, positions.length, block.timestamp);

        // Trigger payout distribution — pass revealed positions to PayoutDistributor
        bool marketOutcome = IMarketContract(market).outcome();

        IPayoutDistributor(payoutDistributor).calculateAndDistribute(
            market,
            positions,
            marketOutcome
        );
    }

    /// @inheritdoc IPositionVault
    function refundAll(address market) external override nonReentrant {
        // Only the specific market contract can trigger its own refund
        if (msg.sender != market) revert PositionVault__NotValidMarket();

        // Market must be cancelled
        IMarketContract.MarketStatus marketStatus = IMarketContract(market).status();
        if (marketStatus != IMarketContract.MarketStatus.Cancelled) {
            revert PositionVault__MarketNotCancelled();
        }

        EncryptedPosition[] storage positions = _marketPositions[market];
        uint256 count = positions.length;

        if (count == 0) return;

        uint256 totalRefunded;

        for (uint256 i = 0; i < count; ) {
            EncryptedPosition storage pos = positions[i];

            if (pos.collateralAmount > 0) {
                uint256 refundAmount = pos.collateralAmount;
                address bettor       = pos.bettor;

                // Zero out before transfer — prevent reentrancy
                pos.collateralAmount = 0;

                IERC20(USDT).safeTransfer(bettor, refundAmount);
                totalRefunded += refundAmount;
            }

            unchecked { ++i; }
        }

        emit PositionsRefunded(market, totalRefunded, count);
    }

    // ─────────────────────────────────────────────────────────────
    // View Functions
    // ─────────────────────────────────────────────────────────────

    /// @inheritdoc IPositionVault
    function positionCount(address market) external view override returns (uint256) {
        return _marketPositions[market].length;
    }

    /// @inheritdoc IPositionVault
    function hasRevealed(address market) external view override returns (bool) {
        return _hasRevealed[market];
    }

    /// @inheritdoc IPositionVault
    function hasBet(address market, address bettor) external view override returns (bool) {
        return _hasBet[market][bettor];
    }

    /// @inheritdoc IPositionVault
    function getEncryptedPosition(
        address market,
        uint256 index
    ) external view override returns (EncryptedPosition memory) {
        return _marketPositions[market][index];
    }

    /// @inheritdoc IPositionVault
    function getRevealedPositions(
        address market
    ) external view override returns (RevealedPosition[] memory) {
        return _revealedPositions[market];
    }

    /// @inheritdoc IPositionVault
    function getTotalCommitted(address market) external view override returns (uint256) {
        return _totalCommitted[market];
    }

    // ─────────────────────────────────────────────────────────────
    // Internal Helpers
    // ─────────────────────────────────────────────────────────────

    /// @notice Verify a TEE decryption proof
    /// @dev TODO: integrate 0G TEE verification SDK before mainnet
    /// @dev For hackathon MVP: stub — non-empty proof is valid
    function _verifyTeeDecryptionProof(
        bytes calldata proof
    ) internal pure returns (bool) {
        // TODO: Replace with real 0G TEE verification
        return proof.length > 0;
    }
}
