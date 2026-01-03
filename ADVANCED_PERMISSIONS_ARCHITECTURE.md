# Advanced Permissions Architecture (ERC‑7715) — PROPHET

This document explains how PROPHET uses **MetaMask Advanced Permissions (ERC‑7715)** to enable **one‑time permission → many automated actions** (One‑Tap Betting + Set‑and‑Forget Strategies), while keeping the user in control via **scope + limits + expiry + revocation**.

---

## What PROPHET is doing “under the hood”

### High-level flow

1. **User connects MetaMask** (EOA).
2. PROPHET creates a **session key** (EOA) and a **session smart account** (ERC‑4337 smart account) for automation.
3. User grants an **ERC‑7715 execution permission** to that session key (time‑bound + spend‑capped).
4. When the user taps “Predict” (or when a strategy matches), PROPHET:
   - **redeems** the permission to perform a **token transfer** (funding step),
   - then submits a **UserOperation** from the session smart account to execute the prediction contract call(s),
   - all without repeated wallet popups during the permission window.

---

## Key roles and why they exist

### User EOA (MetaMask account)

- **Purpose**: the user identity and source of funds.
- **User control**: grants permission once; can revoke anytime.

### Session Key EOA

- **Purpose**: the designated signer in the ERC‑7715 permission (the “automation key”).
- **Why**: lets PROPHET automate actions without re-prompting the user for every action.

### Session Smart Account (ERC‑4337)

- **Purpose**: executes the prediction transactions (batched contract calls).
- **Why**: enables account abstraction UX (bundler/paymaster, batching, better reliability).

---

## Where the “request permission” happens (ERC‑7715)

PROPHET requests execution permissions via MetaMask’s ERC‑7715 provider actions:

- **Primary UI**: `frontend/src/components/wallet/permissions-manager.tsx`

  - Calls `requestExecutionPermissions(...)` with:
    - token scope (USDC/cUSD),
    - spend cap (period amount),
    - period duration,
    - expiry time,
    - signer = **session key EOA**.

- **Alternative UI**: `frontend/src/components/wallet/grant-permissions-button.tsx`
  - Same permission request, packaged as a single “Enable One‑Tap Betting” button.

---

## Where the “redeem permission” + execution happens

The heart of the integration lives in:

- `frontend/src/hooks/useRedeemDelegations.ts`

It performs two key steps:

### Step A — Redeem delegation (funding step)

- Uses `redeemDelegations(...)` to execute a **delegated token transfer** under the permission context.
- This ensures the session account has the tokens needed to execute the prediction call(s).

### Step B — Execute contract calls via UserOperation

- Uses `sendUserOperationWithDelegation(...)` to send the actual prediction transaction(s) from the session smart account.
- Bundler/paymaster is used for the UserOperation (so the UX stays smooth).

---

## Strategies: “Set-and-Forget” automation

Strategies are created and stored locally, then executed automatically when markets match.

- **Strategy executor**: `frontend/src/services/strategyExecutor.ts`
- **React integration / trigger loop**: `frontend/src/hooks/useStrategyExecutor.ts`

The executor calls the same `redeemWithUSDCTransfer(...)` pathway, so strategies use **the same ERC‑7715 permission** as one‑tap manual predictions.

---

## Why this qualifies as “Advanced Permissions” (hackathon criteria)

- **One permission, many actions**: user grants once, app executes multiple times within the session window.
- **User-controlled safety**: explicit limits (cap), explicit token scope, explicit expiry.
- **Revocable**: permission can be removed to immediately stop automation.
- **Composable automation**: the same permission is used for:
  - manual “One‑Tap Betting”
  - automated “Set‑and‑Forget” strategies

---

## Quick “Code Usage Links” (for judges)

- **Request Advanced Permissions**:

  - `frontend/src/components/wallet/permissions-manager.tsx`
  - `frontend/src/components/wallet/grant-permissions-button.tsx`

- **Redeem + execute with Advanced Permissions**:

  - `frontend/src/hooks/useRedeemDelegations.ts`

- **Automation loop**:
  - `frontend/src/hooks/useStrategyExecutor.ts`
  - `frontend/src/services/strategyExecutor.ts`
