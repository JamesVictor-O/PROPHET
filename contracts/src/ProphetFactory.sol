// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { MarketLib } from "./libraries/MarketLib.sol";
import { MarketContract } from "./MarketContract.sol";

/// @title ProphetFactory
/// @notice Entry point for Prophet prediction market creation
/// @dev Deploys and registers MarketContract instances
/// @dev Maintains the canonical registry of all valid Prophet markets
/// @dev Creation friction design:
///        - Creator locks a USDT bond (creationBondAmount) when calling createMarket().
///        - The bond is forwarded to the new MarketContract and held there.
///        - Bond is refunded to creator on clean resolution or archive (zero interest).
///        - Bond is forfeited to treasury if the oracle cancels (unresolvable market).
///        - A 24-hour pending window runs before the market goes Open. Community members
///          call signalInterest() to express intent (free — no funds locked). If zero
///          signals arrive the market auto-archives via archiveMarket().
contract ProphetFactory is Ownable, ReentrancyGuard {

    using SafeERC20 for IERC20;
    using MarketLib for string;

    // ─────────────────────────────────────────────────────────────
    // Immutables — set once at deployment, never change
    // ─────────────────────────────────────────────────────────────

    /// @notice USDT token address on 0G Chain
    address public immutable USDT;

    /// @notice Oracle agent wallet — authorized to resolve markets
    address public immutable oracleAgent;

    /// @notice Market maker agent wallet — provides liquidity quotes
    address public immutable marketMakerAgent;

    // ─────────────────────────────────────────────────────────────
    // Mutable State — set after deployment via setVaultAndDistributor
    // ─────────────────────────────────────────────────────────────

    /// @notice PositionVault contract address — set after vault deployment
    address public positionVault;

    /// @notice PayoutDistributor contract address — set after distributor deployment
    address public payoutDistributor;

    /// @notice Protocol treasury — receives 0.5% fee from every market payout
    address public protocolTreasury;

    /// @notice Whether the factory is accepting new market creation
    bool public paused;

    // ─────────────────────────────────────────────────────────────
    // Creation-Friction Parameters (owner-updatable)
    // ─────────────────────────────────────────────────────────────

    /// @notice USDT amount creator must deposit when creating a market
    /// @dev Forwarded to the MarketContract. Refunded on clean resolution/archive.
    /// @dev Default: 10 USDT. Enough to deter throwaway markets, low enough to be accessible.
    uint256 public creationBondAmount = 10e6;

    // ─────────────────────────────────────────────────────────────
    // Market Registry
    // ─────────────────────────────────────────────────────────────

    /// @notice All market addresses ever deployed by this factory
    address[] public allMarkets;

    /// @notice Quick lookup — is this address a valid Prophet market?
    mapping(address => bool) public isMarket;

    /// @notice Markets created by each user address
    mapping(address => address[]) public marketsByCreator;

    /// @notice Total markets ever created
    uint256 public totalMarketsCreated;

    // ─────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────

    event MarketCreated(
        address indexed marketAddress,
        address indexed creator,
        string  question,
        uint256 deadline,
        string  category,
        bytes32 resolutionSourcesHash,
        uint256 indexed marketIndex
    );

    event VaultAndDistributorSet(
        address positionVault,
        address payoutDistributor
    );

    event TreasuryUpdated(
        address oldTreasury,
        address newTreasury
    );

    event CreationBondAmountUpdated(uint256 oldAmount, uint256 newAmount);

    event FactoryPaused(address by);
    event FactoryUnpaused(address by);

    // ─────────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────────

    error ProphetFactory__ZeroAddress();
    error ProphetFactory__AlreadyInitialized();
    error ProphetFactory__NotInitialized();
    error ProphetFactory__Paused();
    error ProphetFactory__InvalidOffset();
    error ProphetFactory__LimitTooHigh();
    error ProphetFactory__BondTransferFailed();

    // ─────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────

    /// @param _usdt USDT token address on 0G Chain
    /// @param _oracleAgent Oracle agent wallet address
    /// @param _marketMakerAgent Market maker agent wallet address
    /// @param _protocolTreasury Protocol treasury address
    constructor(
        address _usdt,
        address _oracleAgent,
        address _marketMakerAgent,
        address _protocolTreasury
    ) Ownable(msg.sender) {
        if (_usdt == address(0))             revert ProphetFactory__ZeroAddress();
        if (_oracleAgent == address(0))      revert ProphetFactory__ZeroAddress();
        if (_marketMakerAgent == address(0)) revert ProphetFactory__ZeroAddress();
        if (_protocolTreasury == address(0)) revert ProphetFactory__ZeroAddress();

        USDT             = _usdt;
        oracleAgent      = _oracleAgent;
        marketMakerAgent = _marketMakerAgent;
        protocolTreasury = _protocolTreasury;
    }

    // ─────────────────────────────────────────────────────────────
    // Initialization — called after PositionVault + PayoutDistributor deploy
    // ─────────────────────────────────────────────────────────────

    /// @notice Link PositionVault and PayoutDistributor to this factory
    /// @dev Must be called once after all contracts are deployed
    /// @dev Can only be set once — prevents accidental overwrite
    function setVaultAndDistributor(
        address _positionVault,
        address _payoutDistributor
    ) external onlyOwner {
        if (positionVault != address(0) || payoutDistributor != address(0)) {
            revert ProphetFactory__AlreadyInitialized();
        }
        if (_positionVault == address(0))     revert ProphetFactory__ZeroAddress();
        if (_payoutDistributor == address(0)) revert ProphetFactory__ZeroAddress();

        positionVault     = _positionVault;
        payoutDistributor = _payoutDistributor;

        emit VaultAndDistributorSet(_positionVault, _payoutDistributor);
    }

    // ─────────────────────────────────────────────────────────────
    // Market Creation
    // ─────────────────────────────────────────────────────────────

    /// @notice Deploy a new prediction market
    /// @dev Creator must have approved this factory for at least creationBondAmount USDT.
    ///      The bond is transferred from creator → factory → market contract.
    ///      It is returned to the creator on clean resolution or archive.
    /// @param question The prediction question — max 280 characters
    /// @param deadline Unix timestamp when market closes
    /// @param category Category string: "crypto","sports","politics","finance","custom"
    /// @param resolutionSourcesHash keccak256 hash of approved sources JSON in 0G Storage
    /// @return marketAddress Address of the newly deployed MarketContract
    function createMarket(
        string calldata question,
        uint256 deadline,
        string calldata category,
        bytes32 resolutionSourcesHash
    ) external nonReentrant returns (address marketAddress) {
        if (positionVault == address(0) || payoutDistributor == address(0)) {
            revert ProphetFactory__NotInitialized();
        }
        if (paused) revert ProphetFactory__Paused();

        MarketLib.validateQuestion(question);
        MarketLib.validateDeadline(deadline);
        MarketLib.validateCategory(category);

        // Pull the creation bond from the caller before deploying the market
        uint256 bond = creationBondAmount;
        if (bond > 0) {
            IERC20(USDT).safeTransferFrom(msg.sender, address(this), bond);
        }

        MarketContract market = new MarketContract(
            address(this),
            oracleAgent,
            marketMakerAgent,
            positionVault,
            payoutDistributor,
            USDT,
            protocolTreasury,
            msg.sender,
            question,
            deadline,
            category,
            resolutionSourcesHash,
            bond
        );

        marketAddress = address(market);

        // Forward bond to the market contract so it can refund/slash autonomously
        if (bond > 0) {
            IERC20(USDT).safeTransfer(marketAddress, bond);
        }

        // Register in all tracking structures
        allMarkets.push(marketAddress);
        isMarket[marketAddress] = true;
        marketsByCreator[msg.sender].push(marketAddress);
        totalMarketsCreated++;

        emit MarketCreated(
            marketAddress,
            msg.sender,
            question,
            deadline,
            category,
            resolutionSourcesHash,
            totalMarketsCreated - 1
        );
    }

    // ─────────────────────────────────────────────────────────────
    // Registry View Functions
    // ─────────────────────────────────────────────────────────────

    /// @notice Paginated retrieval of all market addresses
    /// @param offset Starting index in allMarkets array
    /// @param limit Maximum number of markets to return (max 100)
    function getMarkets(
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory markets) {
        if (limit > 100) revert ProphetFactory__LimitTooHigh();

        uint256 total = allMarkets.length;
        if (offset >= total) revert ProphetFactory__InvalidOffset();

        uint256 end = offset + limit;
        if (end > total) end = total;

        uint256 size = end - offset;
        markets = new address[](size);

        for (uint256 i = 0; i < size; ) {
            markets[i] = allMarkets[offset + i];
            unchecked { ++i; }
        }
    }

    /// @notice Returns all markets created by a specific address
    function getMarketsByCreator(
        address creator
    ) external view returns (address[] memory) {
        return marketsByCreator[creator];
    }

    /// @notice Returns total number of markets ever deployed
    function totalMarkets() external view returns (uint256) {
        return allMarkets.length;
    }

    /// @notice Returns whether a given address is a valid Prophet market
    function isValidMarket(address market) external view returns (bool) {
        return isMarket[market];
    }

    // ─────────────────────────────────────────────────────────────
    // Admin Functions
    // ─────────────────────────────────────────────────────────────

    /// @notice Update the protocol treasury address
    function updateTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert ProphetFactory__ZeroAddress();
        emit TreasuryUpdated(protocolTreasury, newTreasury);
        protocolTreasury = newTreasury;
    }

    /// @notice Update the USDT bond required at market creation
    /// @dev Set to 0 to disable the bond requirement entirely
    function updateCreationBond(uint256 newAmount) external onlyOwner {
        emit CreationBondAmountUpdated(creationBondAmount, newAmount);
        creationBondAmount = newAmount;
    }

    /// @notice Pause market creation — emergency use only
    function pause() external onlyOwner {
        paused = true;
        emit FactoryPaused(msg.sender);
    }

    /// @notice Resume market creation
    function unpause() external onlyOwner {
        paused = false;
        emit FactoryUnpaused(msg.sender);
    }
}
