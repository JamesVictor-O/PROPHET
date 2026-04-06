// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title MarketLib
/// @notice Shared utility functions used across all Prophet contracts
/// @dev Pure functions only — no state, no storage, no external calls
library MarketLib {

    // ─────────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────────

    uint256 internal constant BPS_DENOMINATOR = 10_000;
    uint256 internal constant MAX_QUESTION_LENGTH = 280;
    uint256 internal constant MIN_DEADLINE_BUFFER = 1 hours;
    uint256 internal constant USDT_DECIMALS = 6;

    // Accepted category strings (validated as keccak hashes for gas efficiency)
    bytes32 internal constant CATEGORY_CRYPTO   = keccak256("crypto");
    bytes32 internal constant CATEGORY_SPORTS   = keccak256("sports");
    bytes32 internal constant CATEGORY_POLITICS = keccak256("politics");
    bytes32 internal constant CATEGORY_FINANCE  = keccak256("finance");
    bytes32 internal constant CATEGORY_CUSTOM   = keccak256("custom");

    // ─────────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────────

    error MarketLib__EmptyQuestion();
    error MarketLib__QuestionTooLong(uint256 length, uint256 maxLength);
    error MarketLib__InvalidCategory(string category);
    error MarketLib__DeadlineTooSoon(uint256 provided, uint256 minimum);
    error MarketLib__ZeroAmount();
    error MarketLib__ZeroAddress();
    error MarketLib__ArrayLengthMismatch(uint256 lengthA, uint256 lengthB);
    error MarketLib__InvalidBps(uint256 bps);
    error MarketLib__TotalFeesExceed100Percent(uint256 totalBps);

    // ─────────────────────────────────────────────────────────────
    // Validation Functions
    // ─────────────────────────────────────────────────────────────

    /// @notice Validates a market question string
    /// @param question The prediction market question
    /// @dev Reverts if question is empty or exceeds MAX_QUESTION_LENGTH
    function validateQuestion(string calldata question) internal pure {
        uint256 len = bytes(question).length;
        if (len == 0) revert MarketLib__EmptyQuestion();
        if (len > MAX_QUESTION_LENGTH) {
            revert MarketLib__QuestionTooLong(len, MAX_QUESTION_LENGTH);
        }
    }

    /// @notice Validates a market category string
    /// @param category The category string assigned by off-chain LLM classifier
    /// @dev Accepted values: "crypto", "sports", "politics", "finance", "custom"
    function validateCategory(string calldata category) internal pure {
        bytes32 hash = keccak256(bytes(category));
        if (
            hash != CATEGORY_CRYPTO   &&
            hash != CATEGORY_SPORTS   &&
            hash != CATEGORY_POLITICS &&
            hash != CATEGORY_FINANCE  &&
            hash != CATEGORY_CUSTOM
        ) {
            revert MarketLib__InvalidCategory(category);
        }
    }

    /// @notice Validates a market deadline
    /// @param deadline Unix timestamp when market closes
    /// @dev Deadline must be at least MIN_DEADLINE_BUFFER seconds from now
    function validateDeadline(uint256 deadline) internal view {
        uint256 minimum = block.timestamp + MIN_DEADLINE_BUFFER;
        if (deadline < minimum) {
            revert MarketLib__DeadlineTooSoon(deadline, minimum);
        }
    }

    /// @notice Validates an amount is non-zero
    /// @param amount The amount to validate
    function validateAmount(uint256 amount) internal pure {
        if (amount == 0) revert MarketLib__ZeroAmount();
    }

    /// @notice Validates an address is non-zero
    /// @param addr The address to validate
    function validateAddress(address addr) internal pure {
        if (addr == address(0)) revert MarketLib__ZeroAddress();
    }

    /// @notice Validates two arrays have the same length
    /// @param lengthA Length of first array
    /// @param lengthB Length of second array
    function validateArrayLengths(
        uint256 lengthA,
        uint256 lengthB
    ) internal pure {
        if (lengthA != lengthB) {
            revert MarketLib__ArrayLengthMismatch(lengthA, lengthB);
        }
    }

    /// @notice Validates a basis points value is within range
    /// @param bps Basis points value (must be <= 10000)
    function validateBps(uint256 bps) internal pure {
        if (bps > BPS_DENOMINATOR) {
            revert MarketLib__InvalidBps(bps);
        }
    }

    /// @notice Validates total fee basis points do not exceed 100%
    /// @param oracleBps Oracle fee in basis points
    /// @param mmBps Market maker fee in basis points
    /// @param protocolBps Protocol fee in basis points
    function validateTotalFees(
        uint256 oracleBps,
        uint256 mmBps,
        uint256 protocolBps
    ) internal pure {
        uint256 total = oracleBps + mmBps + protocolBps;
        if (total > BPS_DENOMINATOR) {
            revert MarketLib__TotalFeesExceed100Percent(total);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Fee Calculation Functions
    // ─────────────────────────────────────────────────────────────

    /// @notice Calculate a fee amount from basis points
    /// @param amount The total amount to take the fee from
    /// @param feeBps The fee in basis points (100 = 1%)
    /// @return fee The calculated fee amount
    function calculateFee(
        uint256 amount,
        uint256 feeBps
    ) internal pure returns (uint256 fee) {
        fee = (amount * feeBps) / BPS_DENOMINATOR;
    }

    /// @notice Calculate all three Prophet fees at once
    /// @param totalAmount The total collateral pool
    /// @param oracleBps Oracle agent fee in bps
    /// @param mmBps Market maker fee in bps
    /// @param protocolBps Protocol treasury fee in bps
    /// @return oracleFee Amount going to oracle agent
    /// @return mmFee Amount going to market maker agent
    /// @return protocolFee Amount going to protocol treasury
    /// @return netAmount Remaining amount after all fees
    function calculateAllFees(
        uint256 totalAmount,
        uint256 oracleBps,
        uint256 mmBps,
        uint256 protocolBps
    ) internal pure returns (
        uint256 oracleFee,
        uint256 mmFee,
        uint256 protocolFee,
        uint256 netAmount
    ) {
        oracleFee   = calculateFee(totalAmount, oracleBps);
        mmFee       = calculateFee(totalAmount, mmBps);
        protocolFee = calculateFee(totalAmount, protocolBps);
        netAmount   = totalAmount - oracleFee - mmFee - protocolFee;
    }

    // ─────────────────────────────────────────────────────────────
    // Payout Calculation Functions
    // ─────────────────────────────────────────────────────────────

    /// @notice Calculate proportional payout for a single winner
    /// @param winnerStake The individual winner's collateral amount
    /// @param totalWinningStake Sum of all winning bettors' collateral
    /// @param netPool Total pool after fees are deducted
    /// @return payout The winner's proportional share of the net pool
    /// @dev Uses full precision multiplication before division to minimize rounding
    function calculatePayout(
        uint256 winnerStake,
        uint256 totalWinningStake,
        uint256 netPool
    ) internal pure returns (uint256 payout) {
        if (totalWinningStake == 0) return 0;
        payout = (winnerStake * netPool) / totalWinningStake;
    }

    /// @notice Calculate the required challenge stake amount
    /// @param totalCollateral The total collateral in the market
    /// @param challengeStakeBps The challenge stake in basis points
    /// @param minChallengeStake The minimum absolute challenge stake
    /// @return stake The required stake — whichever is larger: bps-based or minimum
    function calculateChallengeStake(
        uint256 totalCollateral,
        uint256 challengeStakeBps,
        uint256 minChallengeStake
    ) internal pure returns (uint256 stake) {
        uint256 bpsStake = calculateFee(totalCollateral, challengeStakeBps);
        stake = bpsStake > minChallengeStake ? bpsStake : minChallengeStake;
    }

    // ─────────────────────────────────────────────────────────────
    // Helper Functions
    // ─────────────────────────────────────────────────────────────

    /// @notice Returns whether a category string is valid
    /// @param category The category string to check
    /// @return True if valid, false otherwise
    /// @dev Non-reverting version of validateCategory — useful for view functions
    function isValidCategory(
        string calldata category
    ) internal pure returns (bool) {
        bytes32 hash = keccak256(bytes(category));
        return (
            hash == CATEGORY_CRYPTO   ||
            hash == CATEGORY_SPORTS   ||
            hash == CATEGORY_POLITICS ||
            hash == CATEGORY_FINANCE  ||
            hash == CATEGORY_CUSTOM
        );
    }

    /// @notice Returns whether a deadline is valid given the current block timestamp
    /// @param deadline The deadline to check
    /// @return True if valid, false otherwise
    /// @dev Non-reverting version — useful for off-chain simulation
    function isValidDeadline(uint256 deadline) internal view returns (bool) {
        return deadline >= block.timestamp + MIN_DEADLINE_BUFFER;
    }

    /// @notice Converts a USDT amount (6 decimals) to a human-readable string
    /// @dev Used for event logging clarity — not used in financial calculations
    /// @param amount Amount in USDT base units (6 decimals)
    /// @return dollars Whole dollar amount
    /// @return cents Cents portion (0-99)
    function splitUsdtAmount(
        uint256 amount
    ) internal pure returns (uint256 dollars, uint256 cents) {
        dollars = amount / 1e6;
        cents   = (amount % 1e6) / 1e4; // 2 decimal places
    }
}
