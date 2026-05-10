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
    enum MarketStatus {
        Pending,            // Reserved — not used (markets open immediately on creation)
        Open,               // Accepting bets, market maker quoting prices
        PendingResolution,  // Deadline passed — oracle gathering evidence
        Challenged,         // Oracle verdict posted — 24hr challenge window open
        Resolved,           // Final verdict confirmed — payouts being distributed
        Cancelled,          // Oracle returned INCONCLUSIVE — full refunds issued
        Archived            // Reserved — not used
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

    event AmmLiquiditySeeded(
        address indexed market,
        uint256 collateralAmount,
        uint256 yesReserve,
        uint256 noReserve
    );

    event SharesPurchased(
        address indexed market,
        address indexed trader,
        bool indexed isYes,
        uint256 collateralIn,
        uint256 sharesOut,
        uint256 fee
    );

    event SharesSold(
        address indexed market,
        address indexed trader,
        bool indexed isYes,
        uint256 sharesIn,
        uint256 collateralOut,
        uint256 fee
    );

    event WinningSharesRedeemed(
        address indexed market,
        address indexed trader,
        uint256 sharesRedeemed,
        uint256 payout
    );

    event CancelledSharesRedeemed(
        address indexed market,
        address indexed trader,
        uint256 sharesRedeemed,
        uint256 payout
    );

    // ─────────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────────

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
    error MarketContract__NotCancelled();
    error MarketContract__ZeroCollateral();
    error MarketContract__TransferFailed();
    error MarketContract__ArrayLengthMismatch();
    error MarketContract__InvalidTeeAttestation();
    error MarketContract__InsufficientAmmLiquidity();
    error MarketContract__SlippageExceeded(uint256 actual, uint256 minimum);
    error MarketContract__InsufficientShares(uint256 requested, uint256 available);
    error MarketContract__AlreadyRedeemed();
    error MarketContract__AmmAlreadySeeded();
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

    /// @notice USDT bond locked at creation — refunded on clean resolution
    function creatorBond() external view returns (uint256);

    // ─────────────────────────────────────────────────────────────
    // Core Functions
    // ─────────────────────────────────────────────────────────────

    /// @notice Place a sealed bet on this market
    /// @param encryptedCommitment TEE-encrypted bytes containing direction and amount
    /// @param collateralAmount USDT amount to commit (must be pre-approved)
    function placeBet(
        bytes calldata encryptedCommitment,
        uint256 collateralAmount
    ) external;

    /// @notice Convert newly received USDT into AMM YES/NO inventory.
    /// @dev Called after protocol-owned liquidity is transferred into the market.
    function seedLiquidity(uint256 collateralAmount) external;

    /// @notice Buy YES or NO shares from the market AMM with USDT.
    function buyShares(
        bool isYes,
        uint256 collateralAmount,
        uint256 minSharesOut
    ) external returns (uint256 sharesOut);

    /// @notice Sell YES or NO shares back to the market AMM for USDT.
    function sellShares(
        bool isYes,
        uint256 sharesIn,
        uint256 minCollateralOut
    ) external returns (uint256 collateralOut);

    /// @notice Redeem winning YES/NO shares for 1 USDT each after final resolution.
    function redeemWinningShares() external returns (uint256 payout);

    /// @notice Redeem AMM YES/NO shares at neutral 50c value after cancellation.
    function redeemCancelledShares() external returns (uint256 payout);

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

    /// @notice Return AMM reserves, user balances, fees, and implied prices.
    function getAmmState(address trader) external view returns (
        uint256 yesReserve,
        uint256 noReserve,
        uint256 collateralBacking,
        uint256 tradingFees,
        uint256 traderYesShares,
        uint256 traderNoShares,
        uint256 yesPriceBps,
        uint256 noPriceBps
    );

    /// @notice Preview shares received for a buy.
    function getBuyAmount(bool isYes, uint256 collateralAmount) external view returns (
        uint256 sharesOut,
        uint256 fee
    );

    /// @notice Preview collateral received for a sell.
    function getSellAmount(bool isYes, uint256 sharesIn) external view returns (
        uint256 collateralOut,
        uint256 fee
    );
}
