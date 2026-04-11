// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IMarketContract } from "./interfaces/IMarketContract.sol";
import { IPositionVault } from "./interfaces/IPositionVault.sol";
import { FeeLib } from "./libraries/FeeLib.sol";
import { MarketLib } from "./libraries/MarketLib.sol";

/// @title MarketContract
/// @notice Core contract for a single Prophet prediction market
/// @dev One instance deployed per market by ProphetFactory
/// @dev Lifecycle:
///      Pending  -> Open (interest threshold met after 24h social filter)
///      Pending  -> Archived (zero interest after 24h)
///      Open     -> PendingResolution (deadline passed)
///      PendingResolution -> Challenged (oracle posts verdict, 24h challenge window)
///      Challenged -> Resolved (no challenge filed, window expires)
///      Challenged -> Resolved (challenge processed by oracle)
///      PendingResolution -> Cancelled (oracle inconclusive x2)
contract MarketContract is IMarketContract, ReentrancyGuard {

    using SafeERC20 for IERC20;
    using FeeLib for uint256;

    // ─────────────────────────────────────────────────────────────
    // Immutables — set at construction by ProphetFactory
    // ─────────────────────────────────────────────────────────────

    address public immutable override factory;
    address public immutable override oracleAgent;
    address public immutable override marketMakerAgent;
    address public immutable override positionVault;
    address public immutable override payoutDistributor;
    address public immutable override USDT;
    address public immutable protocolTreasury;
    address public immutable override creator;
    uint256 public immutable override deadline;
    bytes32 public immutable override resolutionSourcesHash;

    /// @notice USDT bond locked at creation — refunded on clean resolution or archive
    /// @dev Set once from ProphetFactory.creationBondAmount at deploy time
    uint256 public immutable override creatorBond;

    // ─────────────────────────────────────────────────────────────
    // Market Parameters — set at construction
    // ─────────────────────────────────────────────────────────────

    string private _question;
    string private _category;

    // ─────────────────────────────────────────────────────────────
    // Market State — mutable
    // ─────────────────────────────────────────────────────────────

    MarketStatus public override status;
    bool public override outcome;
    bytes32 public override verdictReasoningHash;
    uint256 public override totalCollateral;
    uint256 public override challengeDeadline;
    uint256 public override resolutionTimestamp;

    // Challenge state
    address public override challenger;
    uint256 public override challengeStake;
    bool public override challengeResolved;

    // Pending-period social filter state
    uint256 public override pendingDeadline;
    uint256 public override interestCount;

    // Bettor tracking
    mapping(address => bool) private _hasBet;

    // Interest signal tracking
    mapping(address => bool) private _hasSignaled;

    // ─────────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────────

    uint256 private constant CHALLENGE_WINDOW    = 24 hours;
    uint256 private constant CHALLENGE_STAKE_BPS = 500;   // 5% of total collateral
    uint256 private constant MIN_CHALLENGE_STAKE = 50e6;  // 50 USDT minimum
    uint256 private constant MIN_BET_AMOUNT      = 1e6;   // 1 USDT minimum bet

    // Liquidity tier thresholds (USDT, 6 decimals)
    uint256 private constant TIER_LOW_THRESHOLD    = 100e6;     // 100 USDT
    uint256 private constant TIER_MEDIUM_THRESHOLD = 1_000e6;   // 1 000 USDT
    uint256 private constant TIER_HIGH_THRESHOLD   = 10_000e6;  // 10 000 USDT

    // ─────────────────────────────────────────────────────────────
    // Constructor — called by ProphetFactory.createMarket()
    // ─────────────────────────────────────────────────────────────

    constructor(
        address _factory,
        address _oracleAgent,
        address _marketMakerAgent,
        address _positionVault,
        address _payoutDistributor,
        address _usdt,
        address _protocolTreasury,
        address _creator,
        string memory question_,
        uint256 _deadline,
        string memory category_,
        bytes32 _resolutionSourcesHash,
        uint256 _pendingPeriod,
        uint256 _creatorBond
    ) {
        factory               = _factory;
        oracleAgent           = _oracleAgent;
        marketMakerAgent      = _marketMakerAgent;
        positionVault         = _positionVault;
        payoutDistributor     = _payoutDistributor;
        USDT                  = _usdt;
        protocolTreasury      = _protocolTreasury;
        creator               = _creator;
        deadline              = _deadline;
        resolutionSourcesHash = _resolutionSourcesHash;
        creatorBond           = _creatorBond;
        _question             = question_;
        _category             = category_;

        // Market starts in Pending — community filter runs for pendingPeriod
        status          = MarketStatus.Pending;
        pendingDeadline = block.timestamp + _pendingPeriod;
    }

    // ─────────────────────────────────────────────────────────────
    // Modifiers
    // ─────────────────────────────────────────────────────────────

    modifier onlyOracle() {
        if (msg.sender != oracleAgent) revert MarketContract__NotOracleAgent();
        _;
    }

    modifier onlyPayoutDistributor() {
        if (msg.sender != payoutDistributor) revert MarketContract__NotPayoutDistributor();
        _;
    }

    modifier onlyWhenPending() {
        if (status != MarketStatus.Pending) revert MarketContract__NotPending();
        _;
    }

    modifier onlyWhenOpen() {
        if (status != MarketStatus.Open) revert MarketContract__NotOpen();
        _;
    }

    modifier onlyWhenPendingResolution() {
        if (status != MarketStatus.PendingResolution) {
            revert MarketContract__NotPendingResolution();
        }
        _;
    }

    modifier onlyWhenChallenged() {
        if (status != MarketStatus.Challenged) revert MarketContract__NotChallenged();
        _;
    }

    modifier onlyWhenResolved() {
        if (status != MarketStatus.Resolved) revert MarketContract__NotResolved();
        _;
    }

    // ─────────────────────────────────────────────────────────────
    // Pending-Period Social Filter
    // ─────────────────────────────────────────────────────────────

    /// @inheritdoc IMarketContract
    function signalInterest() external override onlyWhenPending {
        // Pending period must still be active
        if (block.timestamp > pendingDeadline) revert MarketContract__PendingPeriodNotOver();

        // Creator signaling their own market doesn't count
        if (msg.sender == creator) revert MarketContract__CreatorCannotSignal();

        // Each address can only signal once
        if (_hasSignaled[msg.sender]) revert MarketContract__AlreadySignaled();

        _hasSignaled[msg.sender] = true;
        interestCount++;

        emit InterestSignaled(address(this), msg.sender, interestCount);
    }

    /// @inheritdoc IMarketContract
    function activateMarket() external override onlyWhenPending {
        // Pending period must have elapsed
        if (block.timestamp <= pendingDeadline) revert MarketContract__PendingPeriodStillActive();

        // Must have at least one signal from the community
        if (interestCount == 0) revert MarketContract__HasInterest();

        status = MarketStatus.Open;

        emit MarketActivated(address(this), interestCount, block.timestamp);
    }

    /// @inheritdoc IMarketContract
    function archiveMarket() external override onlyWhenPending {
        // Pending period must have elapsed
        if (block.timestamp <= pendingDeadline) revert MarketContract__PendingPeriodStillActive();

        // Can only archive if no one signaled interest
        if (interestCount > 0) revert MarketContract__HasInterest();

        status = MarketStatus.Archived;

        emit MarketArchived(address(this), creator, creatorBond);

        // Refund the creation bond to creator immediately
        _refundBondToCreator();
    }

    // ─────────────────────────────────────────────────────────────
    // Core Market Functions
    // ─────────────────────────────────────────────────────────────

    /// @inheritdoc IMarketContract
    function placeBet(
        bytes calldata encryptedCommitment,
        uint256 collateralAmount
    ) external override nonReentrant onlyWhenOpen {
        // Deadline must not have passed
        if (block.timestamp >= deadline) revert MarketContract__DeadlinePassed();

        // Validate bet amount
        if (collateralAmount < MIN_BET_AMOUNT) revert MarketContract__ZeroCollateral();

        // Validate commitment is not empty
        if (encryptedCommitment.length == 0) revert MarketContract__InvalidTeeAttestation();

        // Transfer USDT from bettor to this contract
        IERC20(USDT).safeTransferFrom(msg.sender, address(this), collateralAmount);

        // Update total collateral
        totalCollateral += collateralAmount;

        // Track that this address has bet
        _hasBet[msg.sender] = true;

        // Forward commitment to PositionVault for sealed storage
        IPositionVault(positionVault).commitPosition(
            address(this),
            msg.sender,
            encryptedCommitment,
            collateralAmount
        );

        emit BetPlaced(
            address(this),
            msg.sender,
            collateralAmount,
            IPositionVault(positionVault).positionCount(address(this)) - 1
        );
    }

    /// @inheritdoc IMarketContract
    function triggerResolution() external override {
        if (status != MarketStatus.Open) revert MarketContract__NotOpen();
        if (block.timestamp < deadline) revert MarketContract__DeadlineNotReached();

        status = MarketStatus.PendingResolution;

        emit ResolutionTriggered(address(this), block.timestamp);
    }

    /// @inheritdoc IMarketContract
    function postResolution(
        bool verdict,
        bytes32 reasoningHash,
        bytes calldata teeAttestation
    ) external override onlyOracle onlyWhenPendingResolution {
        // Validate TEE attestation
        // TODO: integrate 0G TEE verification SDK
        // For hackathon MVP: stub returns true — replace with real verification
        if (!_verifyTeeAttestation(teeAttestation)) {
            revert MarketContract__InvalidTeeAttestation();
        }

        outcome              = verdict;
        verdictReasoningHash = reasoningHash;
        resolutionTimestamp  = block.timestamp;
        challengeDeadline    = block.timestamp + CHALLENGE_WINDOW;

        // Always enters challenge window first
        status = MarketStatus.Challenged;

        emit ResolutionPosted(
            address(this),
            verdict,
            reasoningHash,
            challengeDeadline
        );
    }

    /// @inheritdoc IMarketContract
    function challengeResolution() external override nonReentrant onlyWhenChallenged {
        // Challenge window must still be open
        if (block.timestamp > challengeDeadline) {
            revert MarketContract__ChallengeWindowClosed();
        }

        // Only one challenge allowed
        if (challenger != address(0)) revert MarketContract__ChallengeAlreadyFiled();

        uint256 required = requiredChallengeStake();

        IERC20(USDT).safeTransferFrom(msg.sender, address(this), required);

        challenger     = msg.sender;
        challengeStake = required;

        emit ResolutionChallenged(address(this), msg.sender, required);
    }

    /// @inheritdoc IMarketContract
    function finalizeResolution() external override onlyWhenChallenged {
        // Challenge window must have expired
        if (block.timestamp <= challengeDeadline) {
            revert MarketContract__ChallengeWindowStillOpen();
        }

        // No challenge must have been filed
        if (challenger != address(0)) revert MarketContract__ChallengeAlreadyFiled();

        status = MarketStatus.Resolved;

        emit ResolutionFinalized(address(this), outcome, block.timestamp);

        // Clean resolution — refund creator bond
        _refundBondToCreator();
    }

    /// @inheritdoc IMarketContract
    function processChallengeOutcome(
        bool challengeUpheld
    ) external override onlyOracle onlyWhenChallenged {
        if (challenger == address(0)) revert MarketContract__NoChallengeToProcess();

        challengeResolved = true;

        if (challengeUpheld) {
            // Flip the outcome
            outcome = !outcome;

            // Calculate challenger reward: stake back + 50% of oracle fee
            FeeLib.FeeBreakdown memory fees = FeeLib.calculateFeeBreakdown(totalCollateral);
            uint256 reward = FeeLib.calculateChallengeReward(fees.oracleFee);
            uint256 totalChallengerPayout = challengeStake + reward;

            IERC20(USDT).safeTransfer(challenger, totalChallengerPayout);

            emit ChallengeUpheld(address(this), challenger, reward);
        } else {
            // Slash challenger stake — send to oracle agent
            IERC20(USDT).safeTransfer(oracleAgent, challengeStake);

            emit ChallengeRejected(address(this), challenger, challengeStake);
        }

        status = MarketStatus.Resolved;

        emit ResolutionFinalized(address(this), outcome, block.timestamp);

        // Refund creator bond on resolution (regardless of challenge outcome — oracle erred, not creator)
        _refundBondToCreator();
    }

    /// @inheritdoc IMarketContract
    function distributePayout(
        address[] calldata winners,
        uint256[] calldata amounts
    ) external override nonReentrant onlyPayoutDistributor onlyWhenResolved {
        if (winners.length != amounts.length) {
            revert MarketContract__ArrayLengthMismatch();
        }

        FeeLib.FeeBreakdown memory fees = FeeLib.calculateFeeBreakdown(totalCollateral);

        if (fees.oracleFee > 0) {
            IERC20(USDT).safeTransfer(oracleAgent, fees.oracleFee);
            emit FeeDistributed(fees.oracleFee, oracleAgent, "oracle");
        }
        if (fees.mmFee > 0) {
            IERC20(USDT).safeTransfer(marketMakerAgent, fees.mmFee);
            emit FeeDistributed(fees.mmFee, marketMakerAgent, "marketmaker");
        }
        if (fees.protocolFee > 0) {
            IERC20(USDT).safeTransfer(protocolTreasury, fees.protocolFee);
            emit FeeDistributed(fees.protocolFee, protocolTreasury, "protocol");
        }

        uint256 totalPaid;
        for (uint256 i = 0; i < winners.length; ) {
            if (amounts[i] > 0) {
                IERC20(USDT).safeTransfer(winners[i], amounts[i]);
                totalPaid += amounts[i];
            }
            unchecked { ++i; }
        }

        emit PayoutsDistributed(address(this), totalPaid, winners.length);
    }

    /// @inheritdoc IMarketContract
    function cancelMarket(
        string calldata reason
    ) external override onlyOracle {
        if (status == MarketStatus.Cancelled) revert MarketContract__AlreadyCancelled();

        if (status != MarketStatus.PendingResolution) {
            revert MarketContract__NotPendingResolution();
        }

        status = MarketStatus.Cancelled;

        emit MarketCancelled(address(this), reason);

        // Bond forfeited to treasury — creator made an unresolvable market
        if (creatorBond > 0) {
            IERC20(USDT).safeTransfer(protocolTreasury, creatorBond);
        }

        // Transfer all bettor collateral to PositionVault for individual refunds
        if (totalCollateral > 0) {
            IERC20(USDT).safeTransfer(positionVault, totalCollateral);
        }
        IPositionVault(positionVault).refundAll(address(this));
    }

    // ─────────────────────────────────────────────────────────────
    // View Functions
    // ─────────────────────────────────────────────────────────────

    /// @inheritdoc IMarketContract
    function question() external view override returns (string memory) {
        return _question;
    }

    /// @inheritdoc IMarketContract
    function category() external view override returns (string memory) {
        return _category;
    }

    /// @inheritdoc IMarketContract
    function getMarketInfo() external view override returns (
        string memory question_,
        uint256 deadline_,
        MarketStatus status_,
        bool outcome_,
        uint256 totalCollateral_,
        uint256 challengeDeadline_,
        bytes32 verdictReasoningHash_,
        string memory category_,
        address creator_
    ) {
        return (
            _question,
            deadline,
            status,
            outcome,
            totalCollateral,
            challengeDeadline,
            verdictReasoningHash,
            _category,
            creator
        );
    }

    /// @inheritdoc IMarketContract
    function getPendingInfo() external view override returns (
        uint256 pendingDeadline_,
        uint256 interestCount_,
        uint256 creatorBond_,
        bool isPendingOver_
    ) {
        pendingDeadline_ = pendingDeadline;
        interestCount_   = interestCount;
        creatorBond_     = creatorBond;
        isPendingOver_   = block.timestamp > pendingDeadline;
    }

    /// @inheritdoc IMarketContract
    function liquidityTier() external view override returns (LiquidityTier) {
        if (totalCollateral >= TIER_HIGH_THRESHOLD)   return LiquidityTier.High;
        if (totalCollateral >= TIER_MEDIUM_THRESHOLD) return LiquidityTier.Medium;
        if (totalCollateral >= TIER_LOW_THRESHOLD)    return LiquidityTier.Low;
        return LiquidityTier.Seed;
    }

    /// @inheritdoc IMarketContract
    function timeUntilDeadline() external view override returns (uint256) {
        if (block.timestamp >= deadline) return 0;
        return deadline - block.timestamp;
    }

    /// @inheritdoc IMarketContract
    function isChallengeWindowOpen() external view override returns (bool) {
        return (
            status == MarketStatus.Challenged &&
            block.timestamp <= challengeDeadline &&
            challenger == address(0)
        );
    }

    /// @inheritdoc IMarketContract
    function requiredChallengeStake() public view override returns (uint256) {
        return MarketLib.calculateChallengeStake(
            totalCollateral,
            CHALLENGE_STAKE_BPS,
            MIN_CHALLENGE_STAKE
        );
    }

    /// @inheritdoc IMarketContract
    function hasBet(address bettor) external view override returns (bool) {
        return _hasBet[bettor];
    }

    /// @inheritdoc IMarketContract
    function hasSignaled(address user) external view override returns (bool) {
        return _hasSignaled[user];
    }

    // ─────────────────────────────────────────────────────────────
    // Internal Helpers
    // ─────────────────────────────────────────────────────────────

    /// @notice Transfer creator bond back to the creator if one was paid
    function _refundBondToCreator() internal {
        if (creatorBond > 0) {
            IERC20(USDT).safeTransfer(creator, creatorBond);
            emit CreatorBondRefunded(address(this), creator, creatorBond);
        }
    }

    /// @notice Verify a TEE attestation proof
    /// @dev TODO: integrate 0G TEE verification SDK before mainnet
    /// @dev For hackathon MVP this is a stub — always returns true for non-empty bytes
    function _verifyTeeAttestation(
        bytes calldata attestation
    ) internal pure returns (bool valid) {
        // TODO: Replace with real 0G TEE attestation verification
        // Reference: https://docs.0g.ai — TEE verification SDK
        valid = attestation.length > 0;
    }

    // ─────────────────────────────────────────────────────────────
    // Internal Events (not in interface — internal accounting only)
    // ─────────────────────────────────────────────────────────────

    event FeeDistributed(
        uint256 amount,
        address indexed recipient,
        string feeType
    );
}
