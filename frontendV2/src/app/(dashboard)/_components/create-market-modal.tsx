"use client";

import { useEffect, useRef, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { erc20Abi, maxUint256, parseUnits } from "viem";
import {
  PROPHET_FACTORY_ADDRESS,
  PROPHET_FACTORY_ABI,
  MOCK_USDT_ADDRESS,
} from "../../../lib/contracts";

/** View ABI fragment — full JSON artifact may lag behind the contract */
const PROPHET_FACTORY_READ_ABI = [
  {
    type: "function",
    name: "creationBondAmount",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
] as const;

/** Must match MarketLib.MIN_DEADLINE_BUFFER (1 hours) */
const MIN_DEADLINE_AHEAD_SEC = BigInt(3600);

type PendingCreatePayload = {
  question: string;
  deadlineTimestamp: bigint;
  category: string;
  mockedHash: `0x${string}`;
};

export default function CreateMarketModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState("crypto");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  /** Set when user clicks Create Market but USDT allowance is insufficient — create runs after approve confirms */
  const pendingCreateAfterApproveRef = useRef<PendingCreatePayload | null>(
    null,
  );
  /** Prevents duplicate createMarket if the approval effect runs twice (e.g. React Strict Mode) */
  const createChainedForApproveHashRef = useRef<string | null>(null);

  const { address: userAddress } = useAccount();

  const { data: bondData } = useReadContract({
    address: PROPHET_FACTORY_ADDRESS as `0x${string}`,
    abi: PROPHET_FACTORY_READ_ABI,
    functionName: "creationBondAmount",
  });
  const bondAmount =
    bondData !== undefined ? (bondData as bigint) : parseUnits("10", 6);

  const { data: allowanceData, refetch: refetchAllowance } = useReadContract({
    address: MOCK_USDT_ADDRESS as `0x${string}`,
    abi: erc20Abi,
    functionName: "allowance",
    args:
      userAddress && bondAmount > BigInt(0)
        ? [userAddress, PROPHET_FACTORY_ADDRESS as `0x${string}`]
        : undefined,
    query: {
      enabled: !!userAddress && !!isOpen && bondAmount > BigInt(0),
    },
  });

  const { data: balanceData } = useReadContract({
    address: MOCK_USDT_ADDRESS as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress && !!isOpen },
  });

  const allowance = (allowanceData as bigint | undefined) ?? BigInt(0);
  const balance = (balanceData as bigint | undefined) ?? BigInt(0);
  const needsApproval =
    bondAmount > BigInt(0) && userAddress && allowance < bondAmount;

  const {
    writeContract: writeApprove,
    data: approveHash,
    error: approveError,
    isPending: isApprovePending,
  } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } =
    useWaitForTransactionReceipt({ hash: approveHash });

  const {
    writeContract,
    data: hash,
    error: writeError,
    isPending: isWriting,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isApproveSuccess) void refetchAllowance();
  }, [isApproveSuccess, refetchAllowance]);

  /** After approval tx confirms, submit createMarket in one flow (no second button click) */
  useEffect(() => {
    if (!isApproveSuccess || !approveHash) return;
    if (createChainedForApproveHashRef.current === approveHash) return;
    const payload = pendingCreateAfterApproveRef.current;
    if (!payload) return;

    createChainedForApproveHashRef.current = approveHash;
    pendingCreateAfterApproveRef.current = null;

    void (async () => {
      await refetchAllowance();
      writeContract({
        address: PROPHET_FACTORY_ADDRESS,
        abi: PROPHET_FACTORY_ABI,
        functionName: "createMarket",
        args: [
          payload.question,
          payload.deadlineTimestamp,
          payload.category,
          payload.mockedHash,
        ],
      });
    })();
  }, [isApproveSuccess, approveHash, refetchAllowance, writeContract]);

  useEffect(() => {
    if (approveError) {
      pendingCreateAfterApproveRef.current = null;
      createChainedForApproveHashRef.current = null;
    }
  }, [approveError]);

  useEffect(() => {
    if (!isOpen) {
      pendingCreateAfterApproveRef.current = null;
      createChainedForApproveHashRef.current = null;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    if (!question.trim() || !deadlineDate) return;
    if (!userAddress) {
      setValidationError("Connect your wallet first.");
      return;
    }

    const deadlineTimestamp = BigInt(
      Math.floor(new Date(deadlineDate).getTime() / 1000),
    );
    const now = BigInt(Math.floor(Date.now() / 1000));
    if (deadlineTimestamp < now + MIN_DEADLINE_AHEAD_SEC) {
      setValidationError(
        "Deadline must be at least 1 hour from now (on-chain rule).",
      );
      return;
    }

    if (bondAmount > BigInt(0) && balance < bondAmount) {
      setValidationError(
        "Not enough mock USDT. Mint from the contract or use the faucet flow your team configured.",
      );
      return;
    }

    const mockedHash =
      "0x0000000000000000000000000000000000000000000000000000000000000000" as const;

    if (needsApproval) {
      pendingCreateAfterApproveRef.current = {
        question: question.trim(),
        deadlineTimestamp,
        category,
        mockedHash,
      };
      writeApprove({
        address: MOCK_USDT_ADDRESS as `0x${string}`,
        abi: erc20Abi,
        functionName: "approve",
        args: [PROPHET_FACTORY_ADDRESS as `0x${string}`, maxUint256],
      });
      return;
    }

    writeContract({
      address: PROPHET_FACTORY_ADDRESS,
      abi: PROPHET_FACTORY_ABI,
      functionName: "createMarket",
      args: [question.trim(), deadlineTimestamp, category, mockedHash],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-lg p-6 rounded-2xl flex flex-col gap-6 relative"
        style={{
          background: "#161616",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white"
        >
          ✕
        </button>

        <div>
          <h2 className="text-xl font-bold text-white mb-1">Create Market</h2>
          <p className="text-sm text-white/40">
            Deploy a new prediction market autonomously on 0G Chain.
          </p>
        </div>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="w-16 h-16 rounded-full bg-[#34d399]/20 flex items-center justify-center text-[#34d399] text-3xl">
              ✓
            </div>
            <span className="text-white font-medium">
              Market Created Successfully!
            </span>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                Question
              </label>
              <textarea
                required
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. Will BTC exceed $150k by Dec 2026?"
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-white/20 outline-none focus:border-[#7B6EF4] transition-colors resize-none"
                rows={3}
                maxLength={280}
              />
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-[#7B6EF4] transition-colors"
                >
                  {["crypto", "sports", "politics", "finance", "custom"].map(
                    (cat) => (
                      <option
                        key={cat}
                        value={cat}
                        className="bg-[#161616] text-white capitalize"
                      >
                        {cat}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Deadline
                </label>
                <input
                  type="datetime-local"
                  required
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-[#7B6EF4] transition-colors [color-scheme:dark]"
                />
              </div>
            </div>

            {bondAmount > BigInt(0) && (
              <p className="text-xs text-white/45">
                Creation bond: {(Number(bondAmount) / 1e6).toFixed(2)} USDT
                (approved for ProphetFactory, then sent with createMarket).
              </p>
            )}

            {validationError && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-lg text-xs text-amber-200/90">
                {validationError}
              </div>
            )}

            {(approveError || writeError) && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 break-words">
                {(approveError ?? writeError)?.message.split("\n")[0]}
              </div>
            )}

            {(isApprovePending ||
              isApproveConfirming ||
              isWriting ||
              isConfirming) && (
              <p className="text-xs text-center text-white/50">
                {isApprovePending
                  ? "Sign USDT approval in your wallet…"
                  : isApproveConfirming && !isWriting
                    ? "Approval confirmed — creating market…"
                    : isConfirming
                      ? "Confirming on chain…"
                      : isWriting
                        ? "Sign market creation in your wallet…"
                        : ""}
              </p>
            )}

            <button
              type="submit"
              disabled={
                isWriting ||
                isConfirming ||
                isApprovePending ||
                isApproveConfirming
              }
              className="mt-2 w-full py-3.5 rounded-lg flex items-center justify-center font-bold text-[15px] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
              style={{ background: "#7B6EF4", color: "#0a0a0a" }}
            >
              {isApprovePending || isApproveConfirming || isWriting || isConfirming
                ? "Working…"
                : "Create Market"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
