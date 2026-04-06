// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { MarketLib } from "./libraries/MarketLib.sol";
import { MarketContract } from "./MarketContract.sol";

/// @title ProphetFactory
/// @notice Entry point for Prophet prediction market creation
/// @dev Deploys and registers MarketContract instances
/// @dev Maintains the canonical registry of all valid Prophet markets
contract ProphetFactory is Ownable, ReentrancyGuard {

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
        string question,
        uint256 deadline,
        string category,
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

        USDT               = _usdt;
        oracleAgent        = _oracleAgent;
        marketMakerAgent   = _marketMakerAgent;
        protocolTreasury   = _protocolTreasury;
    }

    // ─────────────────────────────────────────────────────────────
    // Initialization — called after PositionVault + PayoutDistributor deploy
    // ─────────────────────────────────────────────────────────────

    /// @notice Link PositionVault and PayoutDistributor to this factory
    /// @dev Must be called once after all contracts are deployed
    /// @dev Can only be set once — prevents accidental overwrite
    /// @param _positionVault Deployed PositionVault address
    /// @param _payoutDistributor Deployed PayoutDistributor address
    function setVaultAndDistributor(
        address _positionVault,
        address _payoutDistributor
    ) external onlyOwner {
        if (positionVault != address(0) || payoutDistributor != address(0)) {
            revert ProphetFactory__AlreadyInitialized();
        }
        if (_positionVault == address(0))    revert ProphetFactory__ZeroAddress();
        if (_payoutDistributor == address(0)) revert ProphetFactory__ZeroAddress();

        positionVault    = _positionVault;
        payoutDistributor = _payoutDistributor;

        emit VaultAndDistributorSet(_positionVault, _payoutDistributor);
    }

    // ─────────────────────────────────────────────────────────────
    // Market Creation
    // ─────────────────────────────────────────────────────────────

    /// @notice Deploy a new prediction market
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
        // Validate factory is initialized and not paused
        if (positionVault == address(0) || payoutDistributor == address(0)) {
            revert ProphetFactory__NotInitialized();
        }
        if (paused) revert ProphetFactory__Paused();

        // Validate all market parameters using MarketLib
        MarketLib.validateQuestion(question);
        MarketLib.validateDeadline(deadline);
        MarketLib.validateCategory(category);

        // Deploy new MarketContract
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
            resolutionSourcesHash
        );

        marketAddress = address(market);

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
    /// @param creator The creator address to query
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
    /// @dev Used by PositionVault and PayoutDistributor for access control
    function isValidMarket(address market) external view returns (bool) {
        return isMarket[market];
    }

    // ─────────────────────────────────────────────────────────────
    // Admin Functions
    // ─────────────────────────────────────────────────────────────

    /// @notice Update the protocol treasury address
    /// @param newTreasury New treasury address
    function updateTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert ProphetFactory__ZeroAddress();
        emit TreasuryUpdated(protocolTreasury, newTreasury);
        protocolTreasury = newTreasury;
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
