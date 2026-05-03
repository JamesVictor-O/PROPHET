"use client";

import { useEffect, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { erc20Abi, parseUnits } from "viem";
import { MARKET_CONTRACT_ABI, MOCK_USDT_ADDRESS } from "../../lib/contracts";
import { encryptBetDirection } from "@/lib/bet-encryption";

export default function TradePanel({
  marketAddress,
  marketYesPct,
  tradeEnabled = true,
}: {
  marketAddress?: string;
  marketYesPct: number;
  /** When false, market is not in Open status — bets revert on-chain */
  tradeEnabled?: boolean;
}) {
  const { address: userAddress } = useAccount();
  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [amountStr, setAmountStr] = useState("");

  const amountUnits = amountStr ? parseUnits(amountStr, 6) : BigInt(0);

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
    amountUnits > BigInt(0) && currentAllowance < amountUnits;

  // 2. Write Contract Setups
  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: isApprovePending,
  } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } =
    useWaitForTransactionReceipt({ hash: approveHash });

  const {
    writeContract: writeBet,
    data: betHash,
    error: betError,
    isPending: isBetPending,
  } = useWriteContract();
  const { isLoading: isBetConfirming, isSuccess: isBetSuccess } =
    useWaitForTransactionReceipt({ hash: betHash });

  useEffect(() => {
    if (isApproveSuccess) void refetchAllowance();
  }, [isApproveSuccess, refetchAllowance]);

  const handleAction = () => {
    if (!tradeEnabled || !marketAddress || amountUnits === BigInt(0)) return;

    if (needsApproval) {
      writeApprove({
        address: MOCK_USDT_ADDRESS as `0x${string}`,
        abi: erc20Abi,
        functionName: "approve",
        args: [marketAddress as `0x${string}`, amountUnits],
      });
    } else {
      // Encrypt bet direction with oracle's NaCl public key (ECDH + XSalsa20-Poly1305).
      // Only the oracle agent can decrypt — direction is never revealed on-chain.
      const oraclePublicKey = process.env.NEXT_PUBLIC_ORACLE_NACL_PUBLIC_KEY ?? "";
      const encryptedCommitment = encryptBetDirection(side, oraclePublicKey);

      writeBet({
        address: marketAddress as `0x${string}`,
        abi: MARKET_CONTRACT_ABI,
        functionName: "placeBet",
        args: [encryptedCommitment, amountUnits],
      });
    }
  };

  const isWriting = isApprovePending || isBetPending;
  const isConfirming = isApproveConfirming || isBetConfirming;

  let buttonText = "Place Bet";
  if (isConfirming) buttonText = "Confirming on Chain...";
  else if (isWriting) buttonText = "Awaiting Wallet Signature...";
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
          YES {marketYesPct}%
        </button>
        <button
          onClick={() => setSide("NO")}
          className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${side === "NO" ? "bg-[#f87171]/20 text-[#f87171]" : "text-white/40 hover:text-white"}`}
        >
          NO {100 - marketYesPct}%
        </button>
      </div>

      {/* Amount Parameter Input */}
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">
            Amount
          </span>
          <span className="text-xs text-white/30">Balance: USDT</span>
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
            USDT
          </span>
        </div>
      </div>

      {/* Probability Summary Stats */}
      <div
        className="flex flex-col gap-3 mb-6 p-4 rounded-lg bg-white/5"
        style={{ border: "1px solid rgba(255,255,255,0.03)" }}
      >
        <div className="flex justify-between text-sm">
          <span className="text-white/50">Avg. price</span>
          <span className="text-white font-mono">
            {side === "YES" ? marketYesPct : 100 - marketYesPct}¢
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-white/50">Est. shares</span>
          <span className="text-white font-mono">
            {amountStr && Number(amountStr) > 0
              ? (
                  Number(amountStr) /
                  ((side === "YES" ? marketYesPct : 100 - marketYesPct) / 100)
                ).toFixed(2)
              : "0.00"}
          </span>
        </div>
        <div className="flex justify-between text-sm font-semibold mt-1">
          <span className="text-white/80">Potential return</span>
          <span className="text-[#34d399] font-mono">
            {amountStr && Number(amountStr) > 0
              ? "$" +
                (
                  Number(amountStr) /
                  ((side === "YES" ? marketYesPct : 100 - marketYesPct) / 100)
                ).toFixed(2)
              : "$0.00"}
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

      {betError && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 break-words">
          {betError.message.split("\n")[0]}
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
          isWriting ||
          isConfirming
        }
        className="w-full py-4 rounded-lg flex items-center justify-center font-bold text-[15px] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
        style={{
          background: needsApproval ? "rgba(255,255,255,0.1)" : "#7B6EF4",
          color: needsApproval ? "#fff" : "#0a0a0a",
        }}
      >
        {!tradeEnabled
          ? "Trading unavailable"
          : !userAddress
            ? "Connect Wallet To Proceed"
            : buttonText}
      </button>
    </div>
  );
}
