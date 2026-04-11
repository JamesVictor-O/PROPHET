// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IPositionVault
/// @notice Interface for Prophet's sealed position custody contract
/// @dev Implemented by PositionVault.sol
/// @dev Receives encrypted bets, holds them sealed, reveals at resolution via TEE
interface IPositionVault {

    // ─────────────────────────────────────────────────────────────
    // Structs
    // ─────────────────────────────────────────────────────────────

    /// @notice A sealed position commitment stored before resolution
    /// @dev encryptedCommitment is opaque — the contract never reads its contents
    struct EncryptedPosition {
        address bettor;               // User who placed this bet
        bytes encryptedCommitment;    // TEE-encrypted payload (direction + amount)
        uint256 collateralAmount;     // USDT committed — stored plaintext for accounting
        uint256 timestamp;            // Block timestamp when commitment was made
        bool revealed;                // Whether TEE has decrypted this position
    }

    /// @notice A position after TEE decryption at market resolution
    /// @dev Populated by the oracle agent's TEE service and submitted on-chain
    struct RevealedPosition {
        address bettor;           // User who placed this bet
        bool direction;           // true = bet YES, false = bet NO
        uint256 collateralAmount; // USDT amount bet
    }

    // ─────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────

    event PositionCommitted(
        address indexed market,
        address indexed bettor,
        uint256 collateralAmount,
        uint256 positionIndex
    );

    event PositionsRevealed(
        address indexed market,
        uint256 totalPositions,
        uint256 timestamp
    );

    event PositionsRefunded(
        address indexed market,
        uint256 totalRefunded,
        uint256 positionCount
    );

    // ─────────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────────

    error PositionVault__NotValidMarket();
    error PositionVault__NotOracleAgent();
    error PositionVault__MarketNotResolved();
    error PositionVault__MarketNotCancelled();
    error PositionVault__InvalidTeeProof();
    error PositionVault__AlreadyRevealed();
    error PositionVault__NoPositionsToReveal();
    error PositionVault__PositionCountMismatch(uint256 expected, uint256 provided);
    error PositionVault__RefundFailed(address bettor, uint256 amount);
    error PositionVault__ZeroCommitment();
    error PositionVault__ZeroCollateral();

    // ─────────────────────────────────────────────────────────────
    // State Variable Getters
    // ─────────────────────────────────────────────────────────────

    /// @notice The ProphetFactory — used to validate market addresses
    function factory() external view returns (address);

    /// @notice The oracle agent address — only one authorized to reveal positions
    function oracleAgent() external view returns (address);

    /// @notice The USDT token address
    function USDT() external view returns (address);

    /// @notice Total number of sealed positions in a given market
    function positionCount(address market) external view returns (uint256);

    /// @notice Whether positions for a market have already been revealed
    function hasRevealed(address market) external view returns (bool);

    /// @notice Whether a specific bettor has a position in a specific market
    function hasBet(address market, address bettor) external view returns (bool);

    // ─────────────────────────────────────────────────────────────
    // Core Functions
    // ─────────────────────────────────────────────────────────────

    /// @notice Store an encrypted position commitment
    /// @dev Called by MarketContract when a user places a bet
    /// @param market The MarketContract address this position belongs to
    /// @param bettor The user placing the bet
    /// @param encryptedCommitment TEE-encrypted bytes (direction + amount — opaque to contract)
    /// @param collateralAmount USDT amount committed (plaintext — needed for refunds)
    function commitPosition(
        address market,
        address bettor,
        bytes calldata encryptedCommitment,
        uint256 collateralAmount
    ) external;

    /// @notice Submit TEE-decrypted positions after market resolution
    /// @dev Called by oracle agent after TEE service decrypts all commitments
    /// @dev Triggers PayoutDistributor.calculateAndDistribute() after storing positions
    /// @param market The market whose positions are being revealed
    /// @param positions Array of RevealedPosition structs decrypted by the TEE
    /// @param teeDecryptionProof Cryptographic proof validating the TEE decryption
    function revealPositions(
        address market,
        RevealedPosition[] calldata positions,
        bytes calldata teeDecryptionProof
    ) external;

    /// @notice Issue full refunds to all bettors when a market is cancelled
    /// @dev Called by MarketContract when oracle returns INCONCLUSIVE twice
    /// @param market The cancelled market address
    function refundAll(address market) external;

    // ─────────────────────────────────────────────────────────────
    // View Functions
    // ─────────────────────────────────────────────────────────────

    /// @notice Returns a specific encrypted position by market and index
    /// @param market The market address
    /// @param index The position index
    function getEncryptedPosition(
        address market,
        uint256 index
    ) external view returns (EncryptedPosition memory);

    /// @notice Returns all revealed positions for a market
    /// @dev Only populated after revealPositions() is called
    /// @param market The market address
    function getRevealedPositions(
        address market
    ) external view returns (RevealedPosition[] memory);

    /// @notice Returns the total USDT committed to a market across all positions
    /// @param market The market address
    function getTotalCommitted(address market) external view returns (uint256);

    /// @notice Returns all market addresses where a bettor has committed a position
    /// @dev Enables portfolio pages to enumerate a user's positions without an indexer
    /// @param bettor The bettor address
    function getMarketsForBettor(address bettor) external view returns (address[] memory);

    /// @notice Returns the total USDT a bettor has staked in a specific market
    /// @param market The market address
    /// @param bettor The bettor address
    function getBettorCollateral(address market, address bettor) external view returns (uint256);

    /// @notice Returns the revealed position for a bettor after TEE decryption
    /// @dev Returns empty struct and hasReveal=false if positions not yet revealed
    /// @param market The market address
    /// @param bettor The bettor address
    /// @return position The revealed position (direction + collateral)
    /// @return hasReveal Whether a reveal exists for this bettor in this market
    function getRevealedPositionForBettor(
        address market,
        address bettor
    ) external view returns (RevealedPosition memory position, bool hasReveal);
}
