// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { Math } from "@openzeppelin/contracts/utils/math/Math.sol";
import { IMarketContract } from "./interfaces/IMarketContract.sol";
import { IPositionVault } from "./interfaces/IPositionVault.sol";
import { ILiquidityPool } from "./interfaces/ILiquidityPool.sol";
import { FeeLib } from "./libraries/FeeLib.sol";
import { MarketLib } from "./libraries/MarketLib.sol";

/// @title MarketContract
/// @notice Core contract for a single Prophet prediction market
/// @dev One instance deployed per market by ProphetFactory
/// @dev Lifecycle:
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
    uint256 public sealedCollateral;
    uint256 public override challengeDeadline;
    uint256 public override resolutionTimestamp;

    // ─── Pool integration ───
    bool private _poolFundsReturned;

    // Challenge state
    address public override challenger;
    uint256 public override challengeStake;
    bool public override challengeResolved;
    uint256 public challengeRewardPaid;

    // Bettor tracking
    mapping(address => bool) private _hasBet;

    // ─── YES/NO share AMM state ───
    uint256 public yesReserve;
    uint256 public noReserve;
    uint256 public ammCollateral;
    uint256 public tradingFeesAccrued;
    mapping(address => uint256) public yesShares;
    mapping(address => uint256) public noShares;
    mapping(address => bool) public hasRedeemedShares;

    // ─────────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────────

    // Errors added for pool integration (not in interface — new additions)
    error MarketContract__NotSettled();
    error MarketContract__PoolAlreadyReturned();
    error MarketContract__NotMarketMakerAgent();

    uint256 private constant CHALLENGE_WINDOW    = 24 hours;
    uint256 private constant CHALLENGE_STAKE_BPS = 500;   // 5% of total collateral
    uint256 private constant MIN_CHALLENGE_STAKE = 50e6;  // 50 USDT minimum
    uint256 private constant MIN_BET_AMOUNT      = 1e6;   // 1 USDT minimum bet
    uint256 private constant TRADE_FEE_BPS       = 100;   // 1% trading fee to LP/tresury flywheel
    uint256 private constant BPS_DENOMINATOR     = 10_000;

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

        status = MarketStatus.Open;
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
        sealedCollateral += collateralAmount;

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
    function seedLiquidity(uint256 collateralAmount) external override nonReentrant onlyWhenOpen {
        if (collateralAmount == 0) revert MarketContract__ZeroCollateral();
        if (yesReserve != 0 || noReserve != 0 || ammCollateral != 0) {
            revert MarketContract__AmmAlreadySeeded();
        }

        uint256 accounted = creatorBond + sealedCollateral + ammCollateral + tradingFeesAccrued + challengeStake;
        uint256 bal = IERC20(USDT).balanceOf(address(this));
        if (bal < accounted + collateralAmount) revert MarketContract__ZeroCollateral();

        yesReserve += collateralAmount;
        noReserve  += collateralAmount;
        ammCollateral += collateralAmount;

        emit AmmLiquiditySeeded(address(this), collateralAmount, yesReserve, noReserve);
    }

    /// @inheritdoc IMarketContract
    function buyShares(
        bool isYes,
        uint256 collateralAmount,
        uint256 minSharesOut
    ) external override nonReentrant onlyWhenOpen returns (uint256 sharesOut) {
        if (block.timestamp >= deadline) revert MarketContract__DeadlinePassed();
        if (collateralAmount < MIN_BET_AMOUNT) revert MarketContract__ZeroCollateral();
        if (yesReserve == 0 || noReserve == 0) revert MarketContract__InsufficientAmmLiquidity();

        (sharesOut, ) = getBuyAmount(isYes, collateralAmount);
        if (sharesOut < minSharesOut) {
            revert MarketContract__SlippageExceeded(sharesOut, minSharesOut);
        }
        if (sharesOut == 0) revert MarketContract__InsufficientAmmLiquidity();

        uint256 fee = (collateralAmount * TRADE_FEE_BPS) / BPS_DENOMINATOR;
        uint256 net = collateralAmount - fee;

        IERC20(USDT).safeTransferFrom(msg.sender, address(this), collateralAmount);

        tradingFeesAccrued += fee;
        ammCollateral += net;
        totalCollateral += collateralAmount;
        _hasBet[msg.sender] = true;

        if (isYes) {
            yesReserve = yesReserve + net - sharesOut;
            noReserve += net;
            yesShares[msg.sender] += sharesOut;
        } else {
            yesReserve += net;
            noReserve = noReserve + net - sharesOut;
            noShares[msg.sender] += sharesOut;
        }

        emit SharesPurchased(address(this), msg.sender, isYes, collateralAmount, sharesOut, fee);
    }

    /// @inheritdoc IMarketContract
    function sellShares(
        bool isYes,
        uint256 sharesIn,
        uint256 minCollateralOut
    ) external override nonReentrant onlyWhenOpen returns (uint256 collateralOut) {
        if (block.timestamp >= deadline) revert MarketContract__DeadlinePassed();
        if (sharesIn == 0) revert MarketContract__ZeroCollateral();

        uint256 bal = isYes ? yesShares[msg.sender] : noShares[msg.sender];
        if (bal < sharesIn) revert MarketContract__InsufficientShares(sharesIn, bal);

        (collateralOut, ) = getSellAmount(isYes, sharesIn);
        if (collateralOut < minCollateralOut) {
            revert MarketContract__SlippageExceeded(collateralOut, minCollateralOut);
        }
        if (collateralOut == 0) revert MarketContract__InsufficientAmmLiquidity();

        uint256 gross = _sellGrossCollateral(isYes, sharesIn);
        uint256 fee = gross - collateralOut;

        uint256 sameReserve = isYes ? yesReserve : noReserve;
        uint256 oppositeReserve = isYes ? noReserve : yesReserve;
        if (gross > oppositeReserve || gross > sameReserve + sharesIn || gross > ammCollateral) {
            revert MarketContract__InsufficientAmmLiquidity();
        }

        tradingFeesAccrued += fee;
        ammCollateral -= gross;
        totalCollateral += fee;

        if (isYes) {
            yesShares[msg.sender] -= sharesIn;
            yesReserve = yesReserve + sharesIn - gross;
            noReserve -= gross;
        } else {
            noShares[msg.sender] -= sharesIn;
            noReserve = noReserve + sharesIn - gross;
            yesReserve -= gross;
        }

        IERC20(USDT).safeTransfer(msg.sender, collateralOut);

        emit SharesSold(address(this), msg.sender, isYes, sharesIn, collateralOut, fee);
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
        if (!_verifyTeeAttestation(verdict, reasoningHash, teeAttestation)) {
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
            challengeRewardPaid = reward;

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

        uint256 oracleFeeToPay = fees.oracleFee;
        if (challengeRewardPaid > 0) {
            oracleFeeToPay = challengeRewardPaid >= oracleFeeToPay
                ? 0
                : oracleFeeToPay - challengeRewardPaid;
        }

        if (oracleFeeToPay > 0) {
            IERC20(USDT).safeTransfer(oracleAgent, oracleFeeToPay);
            emit FeeDistributed(oracleFeeToPay, oracleAgent, "oracle");
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
    function redeemWinningShares() external override nonReentrant onlyWhenResolved returns (uint256 payout) {
        if (hasRedeemedShares[msg.sender]) revert MarketContract__AlreadyRedeemed();

        uint256 winningShares = outcome ? yesShares[msg.sender] : noShares[msg.sender];
        if (winningShares == 0) revert MarketContract__InsufficientShares(1, 0);

        hasRedeemedShares[msg.sender] = true;
        if (outcome) {
            yesShares[msg.sender] = 0;
        } else {
            noShares[msg.sender] = 0;
        }

        payout = winningShares;
        if (payout > ammCollateral) revert MarketContract__InsufficientAmmLiquidity();
        ammCollateral -= payout;

        IERC20(USDT).safeTransfer(msg.sender, payout);

        emit WinningSharesRedeemed(address(this), msg.sender, winningShares, payout);
    }

    /// @notice Redeem AMM YES/NO shares after a market is cancelled.
    /// @dev Cancelled prediction markets settle neutrally at 50c per YES or NO share.
    ///      This is solvent because complete-set collateralization guarantees:
    ///      0.5 * (user YES + user NO) + pool min(YES reserve, NO reserve) <= AMM collateral.
    function redeemCancelledShares() external override nonReentrant returns (uint256 payout) {
        if (status != MarketStatus.Cancelled) revert MarketContract__NotCancelled();

        uint256 yesBal = yesShares[msg.sender];
        uint256 noBal = noShares[msg.sender];
        uint256 totalSharesToRefund = yesBal + noBal;
        if (totalSharesToRefund == 0) revert MarketContract__InsufficientShares(1, 0);

        yesShares[msg.sender] = 0;
        noShares[msg.sender] = 0;

        payout = totalSharesToRefund / 2;
        if (payout > ammCollateral) revert MarketContract__InsufficientAmmLiquidity();
        ammCollateral -= payout;

        IERC20(USDT).safeTransfer(msg.sender, payout);

        emit CancelledSharesRedeemed(address(this), msg.sender, totalSharesToRefund, payout);
    }

    /// @notice Return the liquidity pool's allocated capital after market settlement.
    /// @dev    When the market maker agent allocates via LiquidityPool.allocateToMarket,
    ///         that USDT is transferred directly to this contract but NOT tracked in
    ///         totalCollateral — it sits as extra balance. After distributePayout drains
    ///         bettor collateral, the pool allocation remains and can be returned here.
    ///         Fees are 0 for MVP — full fee-routing via mm fee will be added in V2.
    function returnLiquidityToPool(address pool) external nonReentrant {
        if (msg.sender != marketMakerAgent) revert MarketContract__NotMarketMakerAgent();
        if (status != MarketStatus.Resolved && status != MarketStatus.Cancelled) {
            revert MarketContract__NotSettled();
        }
        if (_poolFundsReturned) revert MarketContract__PoolAlreadyReturned();

        uint256 allocation = ILiquidityPool(pool).marketAllocation(address(this));
        if (allocation == 0) return; // market never received pool liquidity

        uint256 poolInventoryValue;
        if (status == MarketStatus.Cancelled) {
            poolInventoryValue = yesReserve < noReserve ? yesReserve : noReserve;
        } else {
            poolInventoryValue = outcome ? yesReserve : noReserve;
        }

        uint256 fees = tradingFeesAccrued;
        uint256 bal = IERC20(USDT).balanceOf(address(this));

        if (poolInventoryValue > ammCollateral) {
            poolInventoryValue = ammCollateral;
        }

        uint256 principalToReturn = poolInventoryValue > bal ? bal : poolInventoryValue;
        uint256 feesToReturn = fees;
        uint256 remainingBal = bal - principalToReturn;
        if (feesToReturn > remainingBal) feesToReturn = remainingBal;
        uint256 returnAmt = principalToReturn + feesToReturn;

        // Effects before external calls
        _poolFundsReturned = true;
        if (status == MarketStatus.Cancelled) {
            yesReserve -= principalToReturn;
            noReserve -= principalToReturn;
            ammCollateral = ammCollateral > principalToReturn ? ammCollateral - principalToReturn : 0;
        } else if (outcome) {
            ammCollateral = ammCollateral > principalToReturn ? ammCollateral - principalToReturn : 0;
            yesReserve = yesReserve > principalToReturn ? yesReserve - principalToReturn : 0;
        } else {
            ammCollateral = ammCollateral > principalToReturn ? ammCollateral - principalToReturn : 0;
            noReserve = noReserve > principalToReturn ? noReserve - principalToReturn : 0;
        }
        tradingFeesAccrued = fees > feesToReturn ? fees - feesToReturn : 0;

        // Transfer principal to pool, then notify for accounting
        if (returnAmt > 0) {
            IERC20(USDT).safeTransfer(pool, returnAmt);
        }
        ILiquidityPool(pool).returnFromMarket(principalToReturn, feesToReturn);
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
        if (sealedCollateral > 0) {
            IERC20(USDT).safeTransfer(positionVault, sealedCollateral);
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
    function getAmmState(address trader) external view override returns (
        uint256 yesReserve_,
        uint256 noReserve_,
        uint256 collateralBacking_,
        uint256 tradingFees_,
        uint256 traderYesShares_,
        uint256 traderNoShares_,
        uint256 yesPriceBps_,
        uint256 noPriceBps_
    ) {
        yesReserve_ = yesReserve;
        noReserve_ = noReserve;
        collateralBacking_ = ammCollateral;
        tradingFees_ = tradingFeesAccrued;
        traderYesShares_ = yesShares[trader];
        traderNoShares_ = noShares[trader];
        (yesPriceBps_, noPriceBps_) = _pricesBps();
    }

    /// @inheritdoc IMarketContract
    function getBuyAmount(
        bool isYes,
        uint256 collateralAmount
    ) public view override returns (uint256 sharesOut, uint256 fee) {
        if (collateralAmount == 0 || yesReserve == 0 || noReserve == 0) return (0, 0);

        fee = (collateralAmount * TRADE_FEE_BPS) / BPS_DENOMINATOR;
        uint256 net = collateralAmount - fee;
        uint256 k = yesReserve * noReserve;

        if (isYes) {
            uint256 endingYes = _ceilDiv(k, noReserve + net);
            uint256 availableYes = yesReserve + net;
            sharesOut = availableYes > endingYes ? availableYes - endingYes : 0;
        } else {
            uint256 endingNo = _ceilDiv(k, yesReserve + net);
            uint256 availableNo = noReserve + net;
            sharesOut = availableNo > endingNo ? availableNo - endingNo : 0;
        }
    }

    /// @inheritdoc IMarketContract
    function getSellAmount(
        bool isYes,
        uint256 sharesIn
    ) public view override returns (uint256 collateralOut, uint256 fee) {
        if (sharesIn == 0 || yesReserve == 0 || noReserve == 0) return (0, 0);

        uint256 gross = _sellGrossCollateral(isYes, sharesIn);
        fee = (gross * TRADE_FEE_BPS) / BPS_DENOMINATOR;
        collateralOut = gross - fee;
    }

    // ─────────────────────────────────────────────────────────────
    // Internal Helpers
    // ─────────────────────────────────────────────────────────────

    function _pricesBps() internal view returns (uint256 yesPriceBps, uint256 noPriceBps) {
        uint256 total = yesReserve + noReserve;
        if (total == 0) return (5_000, 5_000);
        yesPriceBps = (noReserve * BPS_DENOMINATOR) / total;
        noPriceBps = BPS_DENOMINATOR - yesPriceBps;
    }

    function _ceilDiv(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) return 0;
        return ((a - 1) / b) + 1;
    }

    function _sellGrossCollateral(bool isYes, uint256 sharesIn) internal view returns (uint256) {
        if (sharesIn == 0 || yesReserve == 0 || noReserve == 0) return 0;

        uint256 sameReserve = isYes ? yesReserve : noReserve;
        uint256 oppositeReserve = isYes ? noReserve : yesReserve;
        uint256 augmentedSameReserve = sameReserve + sharesIn;

        // Solve (same + sharesIn - gross) * (opposite - gross) = same * opposite.
        // Use ceil(sqrt(discriminant)) so gross rounds down and cannot overpay.
        uint256 sum = augmentedSameReserve + oppositeReserve;
        uint256 discriminant = (sum * sum) - (4 * sharesIn * oppositeReserve);
        uint256 root = Math.sqrt(discriminant);
        if (root * root < discriminant) root += 1;

        return (sum - root) / 2;
    }

    /// @notice Transfer creator bond back to the creator if one was paid
    function _refundBondToCreator() internal {
        if (creatorBond > 0) {
            IERC20(USDT).safeTransfer(creator, creatorBond);
            emit CreatorBondRefunded(address(this), creator, creatorBond);
        }
    }

    /// @notice Verify oracle's ECDSA signature over (market, verdict, reasoningHash).
    /// @dev The oracle agent signs keccak256(market ++ verdict ++ reasoningHash) with
    ///      its wallet private key before calling postResolution. This proves the verdict
    ///      was produced by the authorised oracle key, not an impersonator.
    ///      Full 0G TEE hardware attestation would replace this once the SDK is stable.
    function _verifyTeeAttestation(
        bool    verdict,
        bytes32 reasoningHash,
        bytes calldata attestation
    ) internal view returns (bool valid) {
        if (attestation.length == 0) return false;
        bytes32 msgHash = keccak256(
            abi.encodePacked(address(this), verdict, reasoningHash)
        );
        // Inline eth_sign prefix — equivalent to MessageHashUtils.toEthSignedMessageHash
        bytes32 ethHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", msgHash)
        );
        address signer  = ECDSA.recover(ethHash, attestation);
        valid = (signer == oracleAgent);
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
