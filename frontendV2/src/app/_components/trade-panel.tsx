"use client";

import { useEffect, useRef, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { erc20Abi, formatUnits, maxUint256, parseUnits } from "viem";
import { MARKET_CONTRACT_ABI, MOCK_USDT_ADDRESS } from "../../lib/contracts";

const BPS_DENOMINATOR = BigInt(10_000);
const SLIPPAGE_BPS = BigInt(100);

function formatSharePrice(price: number) {
  if (!Number.isFinite(price)) return "$0.00";
  const normalizedPrice = Math.min(Math.max(price, 0), 1);
  return `$${normalizedPrice.toFixed(2)}`;
}

export default function TradePanel({
  marketAddress,
  marketYesPct,
  isPriceLive = true,
  tradeEnabled = true,
}: {
  marketAddress?: string;
  marketYesPct: number;
  /** When false, the price is a fallback 50 — show "—" in toggle instead */
  isPriceLive?: boolean;
  /** When false, market is not in Open status — bets revert on-chain */
  tradeEnabled?: boolean;
}) {
  const { address: wagmiAddress } = useAccount();
  // Cache address in a ref so brief wagmi undefined blips after tx don't show "Connect Wallet"
  const addressRef = useRef<`0x${string}` | undefined>(undefined);
  if (wagmiAddress) addressRef.current = wagmiAddress;
  const userAddress = wagmiAddress ?? addressRef.current;
  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [mode, setMode] = useState<"BUY" | "SELL">("BUY");
  const [amountStr, setAmountStr] = useState("");
  const [txErrorMessage, setTxErrorMessage] = useState<string | null>(null);

  const amountUnits = amountStr ? parseUnits(amountStr, 6) : BigInt(0);
  const isBuy = mode === "BUY";
  const isYes = side === "YES";

  // 1. Read USDT Allowance
  const { data: allowanceData, refetch: refetchAllowance } = useReadContract({
    address: MOCK_USDT_ADDRESS as `0x${string}`,
    abi: erc20Abi,
    functionName: "allowance",
    args:
      userAddress && marketAddress
        ? [userAddress, marketAddress as `0x${string}`]
        : undefined,
    query: {
      enabled: !!userAddress && !!marketAddress,
    },
  });

  const currentAllowance = (allowanceData as bigint) ?? BigInt(0);
  const needsApproval =
    isBuy && amountUnits > BigInt(0) && currentAllowance < amountUnits;

  const { data: ammStateData, refetch: refetchAmmState } = useReadContract({
    address: marketAddress as `0x${string}` | undefined,
    abi: MARKET_CONTRACT_ABI,
    functionName: "getAmmState",
    args:
      marketAddress && userAddress
        ? [userAddress]
        : undefined,
    query: {
      enabled: !!marketAddress && !!userAddress,
      refetchInterval: 10_000,
    },
  });

  const ammState = Array.isArray(ammStateData) ? (ammStateData as readonly bigint[]) : undefined;
  const userYesShares = ammState?.[4] ?? BigInt(0);
  const userNoShares = ammState?.[5] ?? BigInt(0);
  const selectedShareBalance = isYes ? userYesShares : userNoShares;
  const formattedYesShares = Number(formatUnits(userYesShares, 6)).toFixed(2);
  const formattedNoShares = Number(formatUnits(userNoShares, 6)).toFixed(2);
  const formattedSelectedShares = Number(
    formatUnits(selectedShareBalance, 6),
  ).toFixed(2);
  const fallbackYesPrice = marketYesPct / 100;
  const yesSharePrice =
    ammState?.[6] !== undefined
      ? Number(ammState[6]) / 10_000
      : fallbackYesPrice;
  const noSharePrice =
    ammState?.[7] !== undefined
      ? Number(ammState[7]) / 10_000
      : 1 - fallbackYesPrice;
  const selectedSharePrice = isYes ? yesSharePrice : noSharePrice;
  const formattedYesPrice = formatSharePrice(yesSharePrice);
  const formattedNoPrice = formatSharePrice(noSharePrice);
  const formattedSelectedPrice = formatSharePrice(selectedSharePrice);

  const { data: buyQuoteData, isLoading: isBuyQuoteLoading } = useReadContract({
    address: marketAddress as `0x${string}` | undefined,
    abi: MARKET_CONTRACT_ABI,
    functionName: "getBuyAmount",
    args: marketAddress && amountUnits > BigInt(0) ? [isYes, amountUnits] : undefined,
    query: { enabled: !!marketAddress && isBuy && amountUnits > BigInt(0) },
  });

  const { data: sellQuoteData, isLoading: isSellQuoteLoading } = useReadContract({
    address: marketAddress as `0x${string}` | undefined,
    abi: MARKET_CONTRACT_ABI,
    functionName: "getSellAmount",
    args: marketAddress && amountUnits > BigInt(0) ? [isYes, amountUnits] : undefined,
    query: { enabled: !!marketAddress && !isBuy && amountUnits > BigInt(0) },
  });

  const buyQuote = Array.isArray(buyQuoteData) ? (buyQuoteData as readonly bigint[]) : undefined;
  const sellQuote = Array.isArray(sellQuoteData) ? (sellQuoteData as readonly bigint[]) : undefined;
  const expectedShares = buyQuote?.[0] ?? BigInt(0);
  const expectedCollateral = sellQuote?.[0] ?? BigInt(0);
  const minSharesOut =
    (expectedShares * (BPS_DENOMINATOR - SLIPPAGE_BPS)) / BPS_DENOMINATOR;
  const minCollateralOut =
    (expectedCollateral * (BPS_DENOMINATOR - SLIPPAGE_BPS)) / BPS_DENOMINATOR;

  const {
    data: usdtBalanceData,
    isLoading: isUsdtBalanceLoading,
    refetch: refetchUsdtBalance,
  } = useReadContract({
    address: MOCK_USDT_ADDRESS as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
      refetchInterval: 8_000,
    },
  });

  const usdtBalance = (usdtBalanceData as bigint) ?? BigInt(0);
  const isInsufficientUsdt =
    isBuy && amountUnits > BigInt(0) && amountUnits > usdtBalance;
  const isInsufficientShares =
    !isBuy && amountUnits > BigInt(0) && amountUnits > selectedShareBalance;
  const isQuoteLoading =
    amountUnits > BigInt(0) && (isBuy ? isBuyQuoteLoading : isSellQuoteLoading);
  const hasNoExecutableQuote =
    amountUnits > BigInt(0) &&
    !isQuoteLoading &&
    (isBuy ? expectedShares === BigInt(0) : expectedCollateral === BigInt(0));

  // 2. Write Contract Setups
  const {
    writeContract: writeApprove,
    data: approveHash,
    error: approveError,
    isPending: isApprovePending,
    reset: resetApprove,
  } = useWriteContract();
  const {
    data: approveReceipt,
    error: approveReceiptError,
    isError: isApproveReceiptError,
    isLoading: isApproveConfirming,
    isSuccess: isApproveReceiptSuccess,
  } = useWaitForTransactionReceipt({ hash: approveHash });

  const {
    writeContract: writeBet,
    data: betHash,
    error: betError,
    isPending: isBetPending,
    reset: resetBet,
  } = useWriteContract();
  const {
    data: betReceipt,
    error: betReceiptError,
    isError: isBetReceiptError,
    isLoading: isBetConfirming,
    isSuccess: isBetReceiptSuccess,
  } = useWaitForTransactionReceipt({ hash: betHash });

  const isApproveSuccess =
    isApproveReceiptSuccess && approveReceipt?.status === "success";
  const isBetSuccess = isBetReceiptSuccess && betReceipt?.status === "success";
  const isApproveReverted = approveReceipt?.status === "reverted";
  const isBetReverted = betReceipt?.status === "reverted";

  useEffect(() => {
    if (isApproveSuccess) void refetchAllowance();
  }, [isApproveSuccess, refetchAllowance]);

  useEffect(() => {
    if (isApproveReverted) {
      setTxErrorMessage("USDT approval reverted on-chain. Please try again.");
    } else if (isApproveReceiptError || approveError) {
      setTxErrorMessage(
        (approveReceiptError ?? approveError)?.message.split("\n")[0] ??
          "USDT approval failed. Please try again.",
      );
    }
  }, [approveError, approveReceiptError, isApproveReceiptError, isApproveReverted]);

  useEffect(() => {
    if (isBetReverted) {
      setTxErrorMessage(
        isBuy
          ? "Buy reverted on-chain. The pool price or liquidity changed before confirmation. Please refresh the quote and try again."
          : "Sell reverted on-chain. The pool could not pay that sell size at the current liquidity imbalance. Try selling a smaller amount.",
      );
    } else if (isBetReceiptError || betError) {
      setTxErrorMessage(
        (betReceiptError ?? betError)?.message.split("\n")[0] ??
          "Trade failed. Please refresh the quote and try again.",
      );
    }
  }, [
    betError,
    betReceiptError,
    isBetReceiptError,
    isBetReverted,
    isBuy,
  ]);

  // After a successful bet, clear tx state after 3 s so the user can place another
  useEffect(() => {
    if (!isBetSuccess) return;
    const timer = setTimeout(() => {
      resetBet();
      resetApprove();
      setAmountStr("");
      void refetchAllowance();
      void refetchAmmState();
      void refetchUsdtBalance();
    }, 3000);
    return () => clearTimeout(timer);
  }, [
    isBetSuccess,
    resetBet,
    resetApprove,
    refetchAllowance,
    refetchAmmState,
    refetchUsdtBalance,
  ]);

  const handleAction = () => {
    if (!tradeEnabled || !marketAddress || amountUnits === BigInt(0)) return;
    if (isInsufficientUsdt || isInsufficientShares || isQuoteLoading || hasNoExecutableQuote) return;
    setTxErrorMessage(null);

    if (isBuy && needsApproval) {
      writeApprove({
        address: MOCK_USDT_ADDRESS as `0x${string}`,
        abi: erc20Abi,
        functionName: "approve",
        args: [marketAddress as `0x${string}`, maxUint256],
      });
    } else if (isBuy) {
      writeBet({
        address: marketAddress as `0x${string}`,
        abi: MARKET_CONTRACT_ABI,
        functionName: "buyShares",
        args: [isYes, amountUnits, minSharesOut],
      });
    } else {
      writeBet({
        address: marketAddress as `0x${string}`,
        abi: MARKET_CONTRACT_ABI,
        functionName: "sellShares",
        args: [isYes, amountUnits, minCollateralOut],
      });
    }
  };

  const isWriting = isApprovePending || isBetPending;
  const isConfirming = isApproveConfirming || isBetConfirming;
  const isProcessing = isWriting || isConfirming;

  let buttonText = isBuy ? `Buy ${side}` : `Sell ${side}`;
  if (isConfirming) buttonText = "Confirming on Chain...";
  else if (isWriting) buttonText = "Awaiting Wallet Signature...";
  else if (isQuoteLoading) buttonText = "Refreshing quote...";
  else if (needsApproval) buttonText = "Approve USDT";

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden p-5"
      style={{
        background: "#161616",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <h3 className="font-bold text-white mb-4">Trade</h3>

      <div
        className="flex p-1 bg-white/5 rounded-lg mb-3"
        style={{ border: "1px solid rgba(255,255,255,0.05)" }}
      >
        <button
          onClick={() => setMode("BUY")}
          className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${mode === "BUY" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}
        >
          Buy
        </button>
        <button
          onClick={() => setMode("SELL")}
          className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${mode === "SELL" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}
        >
          Sell
        </button>
      </div>

      {!tradeEnabled && (
        <p className="mb-4 text-xs text-amber-200/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          Trading is only available while the market is <strong>Open</strong>{" "}
          (after the pending period and activation). Check back once the market
          is live.
        </p>
      )}

      {/* Side Segmented Toggle */}
      <div
        className="flex p-1 bg-white/5 rounded-lg mb-5"
        style={{ border: "1px solid rgba(255,255,255,0.05)" }}
      >
        <button
          onClick={() => setSide("YES")}
          className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${side === "YES" ? "bg-[#34d399]/20 text-[#34d399]" : "text-white/40 hover:text-white"}`}
        >
          YES {isPriceLive ? formattedYesPrice : "—"}
        </button>
        <button
          onClick={() => setSide("NO")}
          className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${side === "NO" ? "bg-[#f87171]/20 text-[#f87171]" : "text-white/40 hover:text-white"}`}
        >
          NO {isPriceLive ? formattedNoPrice : "—"}
        </button>
      </div>

      <div
        className="grid grid-cols-2 gap-2 mb-5"
        aria-label="Your market shares"
      >
        <div
          className="rounded-lg px-3 py-2 bg-white/5"
          style={{ border: "1px solid rgba(52,211,153,0.16)" }}
        >
          <div className="text-[11px] font-semibold uppercase tracking-widest text-[#34d399]">
            Your YES
          </div>
          <div className="mt-1 font-mono text-sm text-white">
            {userAddress ? formattedYesShares : "--"}
          </div>
        </div>
        <div
          className="rounded-lg px-3 py-2 bg-white/5"
          style={{ border: "1px solid rgba(248,113,113,0.16)" }}
        >
          <div className="text-[11px] font-semibold uppercase tracking-widest text-[#f87171]">
            Your NO
          </div>
          <div className="mt-1 font-mono text-sm text-white">
            {userAddress ? formattedNoShares : "--"}
          </div>
        </div>
      </div>

      {/* Amount Parameter Input */}
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">
            {isBuy ? "Amount" : `${side} shares`}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/30">
              {isBuy
                ? `Balance: ${
                    isUsdtBalanceLoading
                      ? "..."
                      : Number(formatUnits(usdtBalance, 6)).toFixed(2)
                  } USDT`
                : `Balance: ${formattedSelectedShares} ${side}`}
            </span>
            {!isBuy && selectedShareBalance > BigInt(0) && (
              <button
                type="button"
                onClick={() => setAmountStr(formatUnits(selectedShareBalance, 6))}
                className="rounded px-2 py-1 text-[11px] font-bold text-white/80 bg-white/10 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B6EF4]"
              >
                Max
              </button>
            )}
          </div>
        </div>
        <div
          className="flex items-center px-4 py-3 rounded-lg bg-white/5 transition-colors focus-within:border-[#7B6EF4]"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <input
            type="number"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            placeholder="0.00"
            min="0"
            step="any"
            className="flex-1 bg-transparent border-none text-white text-lg font-mono outline-none placeholder-white/20"
          />
          <span className="text-sm font-bold text-white/80 shrink-0 ml-2">
            {isBuy ? "USDT" : side}
          </span>
        </div>
      </div>

      {/* Quote Summary Stats */}
      <div
        className="flex flex-col gap-3 mb-6 p-4 rounded-lg bg-white/5"
        style={{ border: "1px solid rgba(255,255,255,0.03)" }}
      >
        <div className="flex justify-between text-sm">
          <span className="text-white/50">Share price</span>
          <span className="text-white font-mono">
            {isPriceLive ? `${formattedSelectedPrice}/share` : "—"}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-white/50">{isBuy ? "Est. shares" : "Est. receive"}</span>
          <span className="text-white font-mono">
            {isBuy
              ? `${Number(formatUnits(expectedShares, 6)).toFixed(2)} ${side}`
              : `$${Number(formatUnits(expectedCollateral, 6)).toFixed(2)}`}
          </span>
        </div>
        <div className="flex justify-between text-sm font-semibold mt-1">
          <span className="text-white/80">If {side} wins</span>
          <span className="text-[#34d399] font-mono text-right">
            {isBuy
              ? `$${Number(formatUnits(expectedShares, 6)).toFixed(2)}`
              : "Reduced position"}
          </span>
        </div>
      </div>

      {isBetSuccess && (
        <div className="mb-4 p-3 bg-[#34d399]/10 border border-[#34d399]/20 rounded-lg flex items-center justify-center">
          <span className="text-[#34d399] text-sm font-medium">
            Position Secured Successfully!
          </span>
        </div>
      )}

      {txErrorMessage && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 break-words">
          {txErrorMessage}
        </div>
      )}

      {/* Primary Action Button */}
      <button
        onClick={handleAction}
        disabled={
          !tradeEnabled ||
          !userAddress ||
          !marketAddress ||
          !amountStr ||
          Number(amountStr) <= 0 ||
          isInsufficientUsdt ||
          isInsufficientShares ||
          isQuoteLoading ||
          hasNoExecutableQuote ||
          isProcessing
        }
        className="w-full py-4 rounded-lg flex items-center justify-center font-bold text-[15px] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
        style={{
          background: needsApproval ? "rgba(255,255,255,0.1)" : "#7B6EF4",
          color: needsApproval ? "#fff" : "#0a0a0a",
        }}
      >
        {isProcessing && (
          <span
            className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        )}
        {!tradeEnabled
          ? "Trading unavailable"
          : !userAddress
            ? "Connect Wallet To Proceed"
            : isInsufficientUsdt
              ? "Insufficient USDT"
              : isInsufficientShares
                ? `Insufficient ${side} Shares`
                : hasNoExecutableQuote
                  ? "No executable quote"
                  : buttonText}
      </button>
    </div>
  );
}
