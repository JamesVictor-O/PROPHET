// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IMarketContract
/// @notice Interface for Prophet's individual prediction market contract
/// @dev Implemented by MarketContract.sol — used by PositionVault and PayoutDistributor
interface IMarketContract {

    // ─────────────────────────────────────────────────────────────
    // Enums
    // ─────────────────────────────────────────────────────────────

    /// @notice The full lifecycle of a prediction market
    /// @dev Pending is the initial state — market must gain community interest to go live
    enum MarketStatus {
        Pending,            // Newly created — 24hr social filter window, accepting interest signals
        Open,               // Interest threshold met — accepting bets, market maker quoting prices
        PendingResolution,  // Deadline passed — oracle gathering evidence
        Challenged,         // Oracle verdict posted — 24hr challenge window open
        Resolved,           // Final verdict confirmed — payouts being distributed
        Cancelled,          // Oracle returned INCONCLUSIVE twice — full refunds issued
        Archived            // Zero interest during pending period — bond refunded to creator
    }

    /// @notice Market maker liquidity tier based on observed collateral volume
    /// @dev Oracle agent reads this to determine per-market exposure cap
    enum LiquidityTier {
        Seed,    // 0 – 99 USDT   total collateral  →  minimal quote, ~5 USDT/side
        Low,     // 100 – 999 USDT                  →  up to 50 USDT/side
        Medium,  // 1 000 – 9 999 USDT               →  up to 500 USDT/side
        High     // 10 000+ USDT                     →  up to 5 000 USDT/side
    }

    // ─────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────

    event BetPlaced(
        address indexed market,
        address indexed bettor,
        uint256 collateralAmount,
        uint256 positionIndex
    );

    event InterestSignaled(
        address indexed market,
        address indexed user,
        uint256 newCount
    );

    event MarketActivated(
        address indexed market,
        uint256 interestCount,
        uint256 timestamp
    );

    event MarketArchived(
        address indexed market,
        address indexed creator,
        uint256 bondRefunded
    );

    event CreatorBondRefunded(
        address indexed market,
        address indexed creator,
        uint256 amount
    );

    event ResolutionTriggered(
        address indexed market,
        uint256 timestamp
    );

    event ResolutionPosted(
        address indexed market,
        bool verdict,
        bytes32 reasoningHash,
        uint256 challengeDeadline
    );

    event ResolutionChallenged(
        address indexed market,
        address indexed challenger,
        uint256 challengeStake
    );

    event ChallengeUpheld(
        address indexed market,
        address indexed challenger,
        uint256 reward
    );

    event ChallengeRejected(
        address indexed market,
        address indexed challenger,
        uint256 slashedStake
    );

    event ResolutionFinalized(
        address indexed market,
        bool outcome,
        uint256 timestamp
    );

    event PayoutsDistributed(
        address indexed market,
        uint256 totalDistributed,
        uint256 winnerCount
    );

    event MarketCancelled(
        address indexed market,
        string reason
    );

    // ─────────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────────

    error MarketContract__NotPending();
    error MarketContract__NotOpen();
    error MarketContract__NotPendingResolution();
    error MarketContract__NotChallenged();
    error MarketContract__NotResolved();
    error MarketContract__DeadlineNotReached();
    error MarketContract__DeadlinePassed();
    error MarketContract__NotOracleAgent();
    error MarketContract__NotPayoutDistributor();
    error MarketContract__NotPositionVault();
    error MarketContract__ChallengeWindowClosed();
    error MarketContract__ChallengeWindowStillOpen();
    error MarketContract__ChallengeAlreadyFiled();
    error MarketContract__NoChallengeToProcess();
    error MarketContract__InsufficientChallengeStake(uint256 provided, uint256 required);
    error MarketContract__AlreadyCancelled();
    error MarketContract__ZeroCollateral();
    error MarketContract__TransferFailed();
    error MarketContract__ArrayLengthMismatch();
    error MarketContract__InvalidTeeAttestation();
    error MarketContract__PendingPeriodNotOver();
    error MarketContract__PendingPeriodStillActive();
    error MarketContract__AlreadySignaled();
    error MarketContract__CreatorCannotSignal();
    error MarketContract__HasInterest();

    // ─────────────────────────────────────────────────────────────
    // State Variable Getters
    // ─────────────────────────────────────────────────────────────

    /// @notice The ProphetFactory that deployed this market
    function factory() external view returns (address);

    /// @notice The oracle agent address authorized to post resolutions
    function oracleAgent() external view returns (address);

    /// @notice The market maker agent address
    function marketMakerAgent() external view returns (address);

    /// @notice The PositionVault contract address
    function positionVault() external view returns (address);

    /// @notice The PayoutDistributor contract address
    function payoutDistributor() external view returns (address);

    /// @notice The USDT token address used for all collateral
    function USDT() external view returns (address);

    /// @notice The address that created this market
    function creator() external view returns (address);

    /// @notice The prediction market question
    function question() external view returns (string memory);

    /// @notice Unix timestamp when market closes and resolution begins
    function deadline() external view returns (uint256);

    /// @notice Market category (crypto, sports, politics, finance, custom)
    function category() external view returns (string memory);

    /// @notice keccak256 hash of the approved resolution sources JSON stored in 0G Storage
    function resolutionSourcesHash() external view returns (bytes32);

    /// @notice Current lifecycle status of the market
    function status() external view returns (MarketStatus);

    /// @notice Final outcome — true = YES won, false = NO won
    /// @dev Only meaningful when status == Resolved
    function outcome() external view returns (bool);

    /// @notice keccak256 hash of the oracle reasoning stored in 0G Storage Log Layer
    function verdictReasoningHash() external view returns (bytes32);

    /// @notice Total USDT collateral deposited into this market
    function totalCollateral() external view returns (uint256);

    /// @notice Unix timestamp when the challenge window closes
    function challengeDeadline() external view returns (uint256);

    /// @notice Unix timestamp when the oracle posted its verdict
    function resolutionTimestamp() external view returns (uint256);

    /// @notice Address of the user who filed a challenge (zero if no challenge)
    function challenger() external view returns (address);

    /// @notice Amount of USDT staked by the challenger
    function challengeStake() external view returns (uint256);

    /// @notice Whether the challenge has been processed
    function challengeResolved() external view returns (bool);

    /// @notice Unix timestamp when the pending period ends
    function pendingDeadline() external view returns (uint256);

    /// @notice Number of interest signals received during the pending period
    function interestCount() external view returns (uint256);

    /// @notice USDT bond locked at creation — refunded on clean resolution or archive
    function creatorBond() external view returns (uint256);

    // ─────────────────────────────────────────────────────────────
    // Core Functions
    // ─────────────────────────────────────────────────────────────

    /// @notice Express interest in this market during the pending period (free — no funds locked)
    /// @dev Anyone except the creator can signal once. Counts towards activation threshold.
    function signalInterest() external;

    /// @notice Activate market after pending period if interest threshold was met
    /// @dev Anyone can call. Transitions Pending → Open.
    function activateMarket() external;

    /// @notice Archive market after pending period if zero interest was shown
    /// @dev Anyone can call. Transitions Pending → Archived. Refunds creator bond immediately.
    function archiveMarket() external;

    /// @notice Place a sealed bet on this market
    /// @param encryptedCommitment TEE-encrypted bytes containing direction and amount
    /// @param collateralAmount USDT amount to commit (must be pre-approved)
    function placeBet(
        bytes calldata encryptedCommitment,
        uint256 collateralAmount
    ) external;

    /// @notice Move market to PendingResolution after deadline passes
    /// @dev Anyone can call this — just checks timestamp
    function triggerResolution() external;

    /// @notice Oracle agent posts its verdict after gathering evidence
    /// @param verdict true = YES outcome, false = NO outcome
    /// @param reasoningHash keccak256 hash of reasoning JSON written to 0G Storage
    /// @param teeAttestation Cryptographic proof from TEE environment
    function postResolution(
        bool verdict,
        bytes32 reasoningHash,
        bytes calldata teeAttestation
    ) external;

    /// @notice File a challenge against the oracle's verdict
    /// @dev Requires staking USDT equal to requiredChallengeStake()
    function challengeResolution() external;

    /// @notice Finalize the market after challenge window expires with no challenge
    /// @dev Anyone can call this after challengeDeadline passes
    function finalizeResolution() external;

    /// @notice Oracle agent processes the outcome of a filed challenge
    /// @param challengeUpheld true if second oracle call overturns the verdict
    function processChallengeOutcome(bool challengeUpheld) external;

    /// @notice PayoutDistributor calls this to execute USDT transfers to winners
    /// @param winners Array of winner addresses
    /// @param amounts Array of USDT amounts for each winner
    function distributePayout(
        address[] calldata winners,
        uint256[] calldata amounts
    ) external;

    /// @notice Oracle agent cancels market if resolution is inconclusive
    /// @dev Triggers full refunds via PositionVault. Bond is forfeited to treasury.
    function cancelMarket(string calldata reason) external;

    // ─────────────────────────────────────────────────────────────
    // View Functions
    // ─────────────────────────────────────────────────────────────

    /// @notice Returns core market state in a single call
    /// @dev Used by frontend to minimize RPC calls
    function getMarketInfo() external view returns (
        string memory question_,
        uint256 deadline_,
        MarketStatus status_,
        bool outcome_,
        uint256 totalCollateral_,
        uint256 challengeDeadline_,
        bytes32 verdictReasoningHash_,
        string memory category_,
        address creator_
    );

    /// @notice Returns pending-period specific state
    /// @dev Used by frontend to display pending market UI
    function getPendingInfo() external view returns (
        uint256 pendingDeadline_,
        uint256 interestCount_,
        uint256 creatorBond_,
        bool isPendingOver_
    );

    /// @notice Returns the current liquidity tier based on total collateral
    /// @dev Market maker agent reads this to set per-market exposure cap
    function liquidityTier() external view returns (LiquidityTier);

    /// @notice Returns seconds remaining until market deadline
    /// @return Seconds remaining, or 0 if deadline has passed
    function timeUntilDeadline() external view returns (uint256);

    /// @notice Returns whether the challenge window is currently open
    function isChallengeWindowOpen() external view returns (bool);

    /// @notice Returns the USDT amount required to file a challenge
    function requiredChallengeStake() external view returns (uint256);

    /// @notice Returns whether a specific address has placed a bet
    function hasBet(address bettor) external view returns (bool);

    /// @notice Returns whether a specific address has signaled interest
    function hasSignaled(address user) external view returns (bool);
}
