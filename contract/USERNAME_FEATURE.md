# Username Feature

## Overview

Added username functionality to the ReputationSystem contract, allowing users to set and display usernames instead of addresses.

## Features

### 1. Set Username
- Users can set a username (3-20 characters)
- Alphanumeric and underscores only
- Usernames must be unique
- Users can update their username (old one is freed)

### 2. Get Username
- Get username by address
- Get address by username (reverse lookup)

### 3. Username Validation
- Check if username is available
- Format validation (alphanumeric + underscore only)
- Length validation (3-20 characters)

## Contract Functions

```solidity
// Set or update username
function setUsername(string memory username) external;

// Get username for an address
function getUsername(address user) external view returns (string memory);

// Get address for a username
function getAddressByUsername(string memory username) external view returns (address);

// Check if username is available
function isUsernameAvailable(string memory username) external view returns (bool);
```

## Usage Examples

### Frontend Integration

```typescript
// Set username
await reputationSystem.setUsername("alice123");

// Get username
const username = await reputationSystem.getUsername(userAddress);

// Check availability
const isAvailable = await reputationSystem.isUsernameAvailable("newuser");

// Get address from username
const address = await reputationSystem.getAddressByUsername("alice123");
```

## Validation Rules

- **Length:** 3-20 characters
- **Format:** Alphanumeric (a-z, A-Z, 0-9) and underscores (_) only
- **Uniqueness:** Each username can only be used by one address
- **Case-sensitive:** "Alice" and "alice" are different usernames

## Gas Costs

- `setUsername`: ~90,000-115,000 gas
- `getUsername`: View function (no gas)
- `getAddressByUsername`: View function (no gas)
- `isUsernameAvailable`: View function (no gas)

## Events

```solidity
event UsernameSet(address indexed user, string username);
```

## Testing

All username functionality is tested:
- ✅ Set username
- ✅ Update username
- ✅ Username validation (too short, too long, invalid format)
- ✅ Uniqueness enforcement
- ✅ Get username by address
- ✅ Get address by username
- ✅ Check availability

## Next Steps

1. Redeploy ReputationSystem with username functionality
2. Update frontend to use usernames
3. Add username display in UI components
4. Add username setting in profile page


