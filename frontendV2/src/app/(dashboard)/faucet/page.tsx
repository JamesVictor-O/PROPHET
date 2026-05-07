"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { erc20Abi, formatUnits } from "viem";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Coins01Icon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  Loading03Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { MOCK_USDT_ADDRESS } from "@/lib/contracts";

const FAUCET_AMOUNT = BigInt(50_000_000); // 50 USDT (6 decimals)

const MOCK_USDT_ABI = [
  { name: "mint", type: "function", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [] },
  ...erc20Abi,
] as const;

export default function FaucetPage() {
  const { address: userAddress } = useAccount();

  // Current USDT balance
  const { data: balanceRaw, refetch: refetchBalance } = useReadContract({
    address: MOCK_USDT_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress },
  });
  const balance = balanceRaw ? Number(formatUnits(balanceRaw as bigint, 6)) : 0;

  // Server-side claim status
  const [alreadyClaimed, setAlreadyClaimed] = useState<boolean | null>(null);
  const [checkingClaim, setCheckingClaim] = useState(false);

  useEffect(() => {
    if (!userAddress) { setAlreadyClaimed(null); return; }
    setCheckingClaim(true);
    fetch(`/api/faucet?address=${userAddress}`)
      .then((r) => r.json())
      .then((d: { claimed: boolean }) => setAlreadyClaimed(d.claimed))
      .catch(() => setAlreadyClaimed(false))
      .finally(() => setCheckingClaim(false));
  }, [userAddress]);

  // Mint write
  const {
    writeContract: writeMint,
    data: mintHash,
    isPending: isMintPending,
    error: mintWriteError,
    reset: resetMint,
  } = useWriteContract();

  const { isLoading: isMintConfirming, isSuccess: isMintSuccess } =
    useWaitForTransactionReceipt({ hash: mintHash });

  // After on-chain success: record claim server-side and refresh balance
  useEffect(() => {
    if (!isMintSuccess || !userAddress) return;

    fetch("/api/faucet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: userAddress }),
    }).catch(() => {});

    setAlreadyClaimed(true);
    void refetchBalance();
  }, [isMintSuccess, userAddress, refetchBalance]);

  function handleClaim() {
    if (!userAddress) return;
    resetMint();
    writeMint({
      address: MOCK_USDT_ADDRESS,
      abi: MOCK_USDT_ABI,
      functionName: "mint",
      args: [userAddress, FAUCET_AMOUNT],
    });
  }

  const isWorking = isMintPending || isMintConfirming;
  const mintError = mintWriteError;

  // ── Button state ──────────────────────────────────────────────────────────────
  let btnLabel = "Claim 50 USDT";
  let btnDisabled = false;
  let btnStyle: React.CSSProperties = { background: "#7B6EF4", color: "#0a0a0a" };

  if (!userAddress) {
    btnLabel = "Connect Wallet First";
    btnDisabled = true;
    btnStyle = { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)" };
  } else if (checkingClaim) {
    btnLabel = "Checking eligibility…";
    btnDisabled = true;
    btnStyle = { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)" };
  } else if (alreadyClaimed || isMintSuccess) {
    btnLabel = "Already Claimed";
    btnDisabled = true;
    btnStyle = { background: "rgba(52,211,153,0.1)", color: "#34d399", border: "1px solid rgba(52,211,153,0.25)" };
  } else if (isMintConfirming) {
    btnLabel = "Confirming on Chain…";
    btnDisabled = true;
    btnStyle = { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" };
  } else if (isMintPending) {
    btnLabel = "Awaiting Wallet Signature…";
    btnDisabled = true;
    btnStyle = { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" };
  }

  return (
    <div className="min-h-screen p-8" style={{ background: "#0f0f0f" }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Testnet Faucet</h1>
        <p className="text-sm text-white/40">
          Claim 50 mock USDT to use on Prophet — one claim per wallet address.
        </p>
      </div>

      <div className="max-w-md mx-auto flex flex-col gap-5">
        {/* Balance card */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(123,110,244,0.12)" }}
            >
              <HugeiconsIcon icon={Wallet01Icon} size={18} color="#7B6EF4" strokeWidth={1.5} />
            </div>
            <span className="text-sm font-semibold text-white/70">Your USDT Balance</span>
          </div>
          <p className="text-3xl font-bold text-white font-mono">
            {userAddress ? `${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT` : "—"}
          </p>
          {userAddress && (
            <p className="mt-1 text-xs text-white/30 font-mono break-all">{userAddress}</p>
          )}
        </div>

        {/* Claim card */}
        <div
          className="rounded-2xl p-5 flex flex-col gap-4"
          style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {/* Faucet amount display */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(52,211,153,0.1)" }}
              >
                <HugeiconsIcon icon={Coins01Icon} size={18} color="#34d399" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Faucet Amount</p>
                <p className="text-xs text-white/40">One-time claim per address</p>
              </div>
            </div>
            <span className="text-xl font-bold text-[#34d399] font-mono">50 USDT</span>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }} className="pt-4 flex flex-col gap-3">
            {/* Rules */}
            <ul className="text-xs text-white/40 flex flex-col gap-1.5 mb-1">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-white/20 shrink-0" />
                Each wallet address may claim exactly once
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-white/20 shrink-0" />
                Tokens are on 0G Galileo testnet — no real value
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-white/20 shrink-0" />
                Use them to place bets and test markets
              </li>
            </ul>

            {/* Claim button */}
            <button
              onClick={handleClaim}
              disabled={btnDisabled || isWorking}
              className="w-full py-4 rounded-xl font-bold text-[15px] transition-all disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2"
              style={btnStyle}
            >
              {isWorking && (
                <HugeiconsIcon
                  icon={Loading03Icon}
                  size={16}
                  color="currentColor"
                  strokeWidth={2}
                  className="animate-spin"
                />
              )}
              {(alreadyClaimed || isMintSuccess) && !isWorking && (
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} color="#34d399" strokeWidth={2} />
              )}
              {btnLabel}
            </button>
          </div>
        </div>

        {/* Success banner */}
        {isMintSuccess && (
          <div
            className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)" }}
          >
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} color="#34d399" strokeWidth={2} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[#34d399]">50 USDT claimed successfully!</p>
              {mintHash && (
                <a
                  href={`https://chainscan-galileo.0g.ai/tx/${mintHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-white/40 hover:text-white/70 transition-colors font-mono break-all mt-1 block"
                >
                  {mintHash}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Error banner */}
        {mintError && !isMintSuccess && (
          <div
            className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}
          >
            <HugeiconsIcon icon={AlertCircleIcon} size={18} color="#f87171" strokeWidth={2} className="mt-0.5 shrink-0" />
            <p className="text-xs text-red-400 break-words">
              {mintError.message.split("\n")[0]}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
