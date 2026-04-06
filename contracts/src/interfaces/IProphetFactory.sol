// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IProphetFactory
/// @notice Minimal interface used by PositionVault and PayoutDistributor
/// @dev Only exposes the isValidMarket function needed for access control
interface IProphetFactory {

    /// @notice Returns whether a given address is a valid Prophet market
    /// @param market The address to check
    /// @return True if deployed by this factory, false otherwise
    function isValidMarket(address market) external view returns (bool);

    /// @notice Oracle agent address — shared across all markets
    function oracleAgent() external view returns (address);

    /// @notice Market maker agent address
    function marketMakerAgent() external view returns (address);

    /// @notice Protocol treasury address
    function protocolTreasury() external view returns (address);
}
