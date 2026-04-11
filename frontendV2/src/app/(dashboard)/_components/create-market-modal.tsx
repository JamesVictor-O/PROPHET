"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import {
  PROPHET_FACTORY_ADDRESS,
  PROPHET_FACTORY_ABI,
} from "../../../lib/contracts";

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

  const {
    writeContract,
    data: hash,
    error: writeError,
    isPending: isWriting,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || !deadlineDate) return;

    // Convert local date string to unix timestamp
    const deadlineTimestamp = Math.floor(
      new Date(deadlineDate).getTime() / 1000,
    );
    // Mock resolution sources hash (bytes32) needed by ABI
    const mockedHash =
      "0x0000000000000000000000000000000000000000000000000000000000000000";

    writeContract({
      address: PROPHET_FACTORY_ADDRESS,
      abi: PROPHET_FACTORY_ABI,
      functionName: "createMarket",
      args: [question, BigInt(deadlineTimestamp), category, mockedHash],
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

            {writeError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 break-words">
                {writeError.message.split("\n")[0]}
              </div>
            )}

            <button
              type="submit"
              disabled={isWriting || isConfirming}
              className="mt-2 w-full py-3.5 rounded-lg flex items-center justify-center font-bold text-[15px] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
              style={{ background: "#7B6EF4", color: "#0a0a0a" }}
            >
              {isWriting
                ? "Confirm in Wallet..."
                : isConfirming
                  ? "Deploying Market..."
                  : "Create Market"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
