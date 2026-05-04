"use client";

import Link from "next/link";
import { useState, useCallback, useEffect } from "react";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SafeIcon,
  AnalyticsUpIcon,
  ChartLineData01Icon,
  Robot01Icon,
  ArrowUpRight01Icon,
  InformationCircleIcon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Tick02Icon,
  Loading03Icon,
  AlertCircleIcon,
  PieChart01Icon,
  MoneyBag01Icon,
  PercentCircleIcon,
} from "@hugeicons/core-free-icons";
import { useMarkets } from "@/lib/hooks/use-markets";
import {
  usePoolStats,
  useLpPosition,
  useUsdtForPool,
  useApproveUsdt,
  useDeposit,
  useWithdraw,
  useMarketAllocations,
  formatUsdt6,
  formatShares,
  formatBps,
} from "@/lib/hooks/use-liquidity-pool";
import { LIQUIDITY_POOL_ADDRESS } from "@/lib/contracts";

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Format a raw 6-decimal USDT bigint into a human-readable string */
function fmtUsdt(raw: bigint): string {
  const n = Number(formatUnits(raw, 6));
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 100_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Share price comes back from the contract as (totalPoolValue * 1e6) / totalShares,
 * so it is already a 6-decimal USDT value — same unit as every other pool figure.
 * We just want to show it with enough precision (4 dp) so "1.0000 USDT" is clear.
 */
function fmtSharePrice(raw: bigint): string {
  const n = Number(formatUnits(raw, 6));
  return n.toFixed(4);
}

const STATUS_COLOR: Record<string, string> = {
  Open: "#34d399",
  Resolved: "#7B6EF4",
  Resolving: "#60a5fa",
  Challenged: "#f97316",
  Cancelled: "#6b7280",
  Pending: "#fbbf24",
};

const POOL_CONFIGURED =
  !!LIQUIDITY_POOL_ADDRESS && LIQUIDITY_POOL_ADDRESS.length > 4;

// ─── DepositWithdrawPanel ─────────────────────────────────────────────────────

type PanelTab = "deposit" | "withdraw";

function DepositWithdrawPanel() {
  const { address } = useAccount();
  const [tab, setTab] = useState<PanelTab>("deposit");
  const [amount, setAmount] = useState("");
  const [txStatus, setTxStatus] = useState<"idle" | "approving" | "depositing" | "withdrawing" | "done" | "error">("idle");
  const [txMsg, setTxMsg] = useState("");

  const { stats, refetch: refetchStats } = usePoolStats();
  const { myShares, withdrawable, refetch: refetchPos } = useLpPosition();
  const { balance, allowance, refetch: refetchUsdt } = useUsdtForPool();

  const approve = useApproveUsdt();
  const deposit = useDeposit();
  const withdraw = useWithdraw();

  // Watch for tx completions
  useEffect(() => {
    if (approve.isSuccess) {
      setTxStatus("depositing");
      setTxMsg("Approval confirmed. Depositing…");
      deposit.deposit(amount);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approve.isSuccess]);

  useEffect(() => {
    if (deposit.isSuccess) {
      setTxStatus("done");
      setTxMsg("Deposit confirmed!");
      setAmount("");
      void refetchStats();
      void refetchPos();
      void refetchUsdt();
    }
    if (deposit.error) {
      setTxStatus("error");
      setTxMsg("Deposit failed. Check console.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deposit.isSuccess, deposit.error]);

  useEffect(() => {
    if (withdraw.isSuccess) {
      setTxStatus("done");
      setTxMsg("Withdrawal confirmed!");
      setAmount("");
      void refetchStats();
      void refetchPos();
      void refetchUsdt();
    }
    if (withdraw.error) {
      setTxStatus("error");
      setTxMsg("Withdrawal failed. Check console.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withdraw.isSuccess, withdraw.error]);

  const handleDeposit = useCallback(() => {
    if (!amount || Number(amount) <= 0) return;
    const parsed = BigInt(Math.floor(Number(amount) * 1_000_000));
    if (parsed > allowance) {
      setTxStatus("approving");
      setTxMsg("Approving USDT…");
      approve.approve(amount);
    } else {
      setTxStatus("depositing");
      setTxMsg("Depositing…");
      deposit.deposit(amount);
    }
  }, [amount, allowance, approve, deposit]);

  const handleWithdraw = useCallback(() => {
    if (!amount || Number(amount) <= 0) return;
    // amount here is in shares (same 6-decimal precision as first deposit)
    const sharesToBurn = BigInt(Math.floor(Number(amount) * 1_000_000));
    if (sharesToBurn > myShares) return;
    setTxStatus("withdrawing");
    setTxMsg("Withdrawing…");
    withdraw.withdraw(sharesToBurn);
  }, [amount, myShares, withdraw]);

  const isBusy = txStatus === "approving" || txStatus === "depositing" || txStatus === "withdrawing";

  const maxDeposit = Number(formatUnits(balance, 6));
  const maxWithdraw = Number(formatUnits(myShares, 6));

  if (!address) {
    return (
      <div className="flex flex-col gap-3 p-5 rounded-xl border border-white/10 bg-white/5 text-center">
        <span className="text-sm text-white/40">Connect your wallet to deposit or withdraw.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-white/10">
        {(["deposit", "withdraw"] as PanelTab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setTab(t); setAmount(""); setTxStatus("idle"); setTxMsg(""); }}
            className="flex-1 py-3 text-sm font-semibold transition-colors relative"
            style={{ color: tab === t ? "#fff" : "rgba(255,255,255,0.35)" }}
          >
            <span className="flex items-center justify-center gap-2">
              <HugeiconsIcon icon={t === "deposit" ? ArrowDown01Icon : ArrowUp01Icon} size={14} color={tab === t ? "#7B6EF4" : "currentColor"} />
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </span>
            {tab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7B6EF4]" />}
          </button>
        ))}
      </div>

      <div className="p-5 flex flex-col gap-4">
        {/* Balance info */}
        <div className="flex items-center justify-between text-xs text-white/40">
          {tab === "deposit" ? (
            <>
              <span>Wallet USDT</span>
              <span className="font-mono text-white/60">{fmtUsdt(balance)} USDT</span>
            </>
          ) : (
            <>
              <span>Your shares</span>
              <span className="font-mono text-white/60">{formatShares(myShares)} shares ≈ {fmtUsdt(withdrawable)} USDT</span>
            </>
          )}
        </div>

        {/* Amount input */}
        <div className="flex flex-col gap-1.5">
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder={tab === "deposit" ? "USDT amount" : "Shares to burn"}
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setTxStatus("idle"); setTxMsg(""); }}
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/25 font-mono"
            />
            <button
              type="button"
              onClick={() => setAmount(tab === "deposit" ? maxDeposit.toFixed(2) : maxWithdraw.toFixed(4))}
              className="text-[10px] font-bold px-2 py-0.5 rounded"
              style={{ background: "rgba(123,110,244,0.15)", color: "#7B6EF4" }}
            >
              MAX
            </button>
          </div>
          {tab === "deposit" && stats && (
            <span className="text-[10px] text-white/30">
              Min deposit: 10.00 USDT · Share price: {fmtSharePrice(stats.sharePrice)} USDT
            </span>
          )}
        </div>

        {/* Status message */}
        {txMsg && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
            style={{
              background: txStatus === "error" ? "rgba(239,68,68,0.1)" : txStatus === "done" ? "rgba(52,211,153,0.1)" : "rgba(123,110,244,0.1)",
              border: `1px solid ${txStatus === "error" ? "rgba(239,68,68,0.2)" : txStatus === "done" ? "rgba(52,211,153,0.2)" : "rgba(123,110,244,0.2)"}`,
              color: txStatus === "error" ? "#f87171" : txStatus === "done" ? "#34d399" : "#a78bfa",
            }}
          >
            <HugeiconsIcon
              icon={txStatus === "error" ? AlertCircleIcon : txStatus === "done" ? Tick02Icon : Loading03Icon}
              size={13}
            />
            {txMsg}
          </div>
        )}

        {/* Action button */}
        <button
          type="button"
          disabled={isBusy || !amount || Number(amount) <= 0}
          onClick={tab === "deposit" ? handleDeposit : handleWithdraw}
          className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg, #7B6EF4, #6366f1)", color: "white" }}
        >
          {isBusy ? "Processing…" : tab === "deposit" ? "Deposit USDT" : "Withdraw"}
        </button>

        {/* LP position summary */}
        {myShares > BigInt(0) && (
          <div
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span className="text-white/40">Your position</span>
            <span className="font-mono text-white/70">{formatShares(myShares)} shares · {fmtUsdt(withdrawable)} USDT</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PoolStatsPanel ───────────────────────────────────────────────────────────

function PoolStatsPanel() {
  const { stats, isLoading } = usePoolStats();

  const statCards = [
    {
      label: "Total Pool Value",
      value: stats ? fmtUsdt(stats.totalValue) + " USDT" : "—",
      sub: "Idle + deployed capital",
      icon: SafeIcon,
      color: "#7B6EF4",
    },
    {
      label: "Available Liquidity",
      value: stats ? fmtUsdt(stats.available) + " USDT" : "—",
      sub: "Ready to allocate to markets",
      icon: AnalyticsUpIcon,
      color: "#34d399",
    },
    {
      label: "Deployed to Markets",
      value: stats ? fmtUsdt(stats.allocated) + " USDT" : "—",
      sub: stats ? `${Number(stats.marketsAllocated)} market${Number(stats.marketsAllocated) !== 1 ? "s" : ""}` : "—",
      icon: ChartLineData01Icon,
      color: "#60a5fa",
    },
    {
      label: "Fees Earned",
      value: stats ? fmtUsdt(stats.feesEarned) + " USDT" : "—",
      sub: "Cumulative from resolved markets",
      icon: MoneyBag01Icon,
      color: "#f59e0b",
    },
    {
      label: "Share Price",
      value: stats ? fmtSharePrice(stats.sharePrice) + " USDT" : "—",
      sub: "Value of 1 LP share",
      icon: PieChart01Icon,
      color: "#a78bfa",
    },
    {
      label: "Utilization",
      value: stats ? formatBps(stats.utilization) : "—",
      sub: "% of pool deployed",
      icon: PercentCircleIcon,
      color: stats && stats.utilization > BigInt(7000) ? "#f97316" : "#34d399",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Protocol Liquidity Pool</h2>
        {POOL_CONFIGURED && (
          <a
            href={`https://chainscan-galileo.0g.ai/address/${LIQUIDITY_POOL_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-white/30 hover:text-[#7B6EF4] transition-colors"
          >
            <span className="font-mono">{LIQUIDITY_POOL_ADDRESS.slice(0, 6)}…{LIQUIDITY_POOL_ADDRESS.slice(-4)}</span>
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={11} />
          </a>
        )}
      </div>

      {!POOL_CONFIGURED ? (
        <div
          className="flex items-start gap-3 p-4 rounded-xl border"
          style={{ background: "rgba(251,191,36,0.06)", borderColor: "rgba(251,191,36,0.2)" }}
        >
          <HugeiconsIcon icon={AlertCircleIcon} size={16} color="#fbbf24" className="shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-white">Pool not deployed yet</span>
            <span className="text-xs text-white/50">
              Set <code className="text-white/70">NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS</code> in{" "}
              <code className="text-white/70">.env.local</code> after running{" "}
              <code className="text-white/70">forge script script/Deploy.s.sol --broadcast</code>.
            </span>
          </div>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", animation: "skeleton-pulse 1.5s ease-in-out infinite" }}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="flex flex-col gap-2 p-4 rounded-xl border border-white/10 bg-white/5 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <HugeiconsIcon icon={card.icon} size={40} color={card.color} />
              </div>
              <span className="text-[10px] uppercase tracking-widest font-medium" style={{ color: card.color }}>
                {card.label}
              </span>
              <span className="text-xl font-bold text-white font-mono">{card.value}</span>
              <span className="text-[10px] text-white/35">{card.sub}</span>
            </div>
          ))}
        </div>
      )}

      {/* Utilization bar */}
      {stats && POOL_CONFIGURED && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>Pool utilization</span>
            <span className="font-mono">{formatBps(stats.utilization)}</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(Number(stats.utilization) / 100, 100)}%`,
                background: Number(stats.utilization) > 7000
                  ? "linear-gradient(90deg, #f97316, #ef4444)"
                  : "linear-gradient(90deg, #7B6EF4, #34d399)",
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-white/25">
            <span>0%</span>
            <span>Available: {fmtUsdt(stats.available)} USDT</span>
            <span>100%</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MarketAllocationsTable ───────────────────────────────────────────────────

function MarketAllocationsTable({ marketAddresses, marketTitles }: {
  marketAddresses: `0x${string}`[];
  marketTitles: Record<string, string>;
}) {
  const { rows, isLoading } = useMarketAllocations(marketAddresses);

  if (!POOL_CONFIGURED) return null;

  return (
    <div className="flex flex-col border border-white/10 bg-white/5 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Pool Allocations to Markets</h2>
        <div className="flex items-center gap-1.5 text-xs text-white/30">
          <HugeiconsIcon icon={InformationCircleIcon} size={13} />
          <span>USDT deployed from pool into each market</span>
        </div>
      </div>

      {isLoading ? (
        <div className="px-6 py-8 text-center text-white/30 text-sm">Loading allocations…</div>
      ) : rows.length === 0 ? (
        <div className="px-6 py-8 text-center text-white/30 text-sm">
          No pool allocations yet. The market maker agent allocates when new markets are created.
        </div>
      ) : (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-xs text-white/40 uppercase tracking-wider">
              <th className="px-6 py-3 font-medium">Market</th>
              <th className="px-6 py-3 font-medium text-right">Allocated</th>
              <th className="px-6 py-3 font-medium text-center">Status</th>
              <th className="px-6 py-3 font-medium text-right"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const title = marketTitles[row.market.toLowerCase()] ?? row.market;
              return (
                <tr key={row.market} className="border-b border-white/5 hover:bg-white/5 transition-colors text-sm">
                  <td className="px-6 py-4 text-white font-medium max-w-xs">
                    <span className="line-clamp-1" title={title}>{title}</span>
                    <span className="block text-[10px] font-mono text-white/25 mt-0.5">
                      {row.market.slice(0, 8)}…{row.market.slice(-6)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white font-mono text-right">
                    {row.returned ? (
                      <span className="text-white/40 line-through">{fmtUsdt(row.amount)}</span>
                    ) : (
                      <span>{fmtUsdt(row.amount)} USDT</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {row.returned ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ color: "#34d399", background: "rgba(52,211,153,0.1)" }}>
                        <HugeiconsIcon icon={Tick02Icon} size={10} />
                        Returned
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ color: "#60a5fa", background: "rgba(96,165,250,0.1)" }}>
                        <HugeiconsIcon icon={Loading03Icon} size={10} />
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/market/${row.market}`}
                      className="text-xs text-white/30 hover:text-[#7B6EF4] transition-colors flex items-center justify-end gap-1"
                    >
                      View
                      <HugeiconsIcon icon={ArrowUpRight01Icon} size={11} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LiquidityPage() {
  const { markets, isLoading: marketsLoading } = useMarkets();

  // Market collateral aggregates (bettor-side liquidity)
  const totalBettorLiquidity = markets.reduce((s, m) => s + m.rawCollateral, BigInt(0));
  const activeBettorLiquidity = markets
    .filter((m) => m.chainStatus === "Open")
    .reduce((s, m) => s + m.rawCollateral, BigInt(0));

  const byLiquidity = [...markets].sort((a, b) =>
    a.rawCollateral > b.rawCollateral ? -1 : a.rawCollateral < b.rawCollateral ? 1 : 0
  );

  // Build a title lookup for the allocations table
  const marketAddresses = markets.map((m) => m.id as `0x${string}`);
  const marketTitles: Record<string, string> = {};
  for (const m of markets) {
    marketTitles[m.id.toLowerCase()] = m.title;
  }

  return (
    <div className="p-8 mx-auto flex flex-col gap-10 min-h-screen">
      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Liquidity</h1>
        <p className="text-sm text-white/40">
          Deposit USDT into the protocol liquidity pool, track real-time allocations to markets,
          and earn fees as the AI market maker puts capital to work.
        </p>
      </div>

      {/* ── Section 1: Protocol Pool stats + Deposit/Withdraw ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pool stats — takes 2/3 width */}
        <div className="lg:col-span-2">
          <PoolStatsPanel />
        </div>

        {/* Deposit / Withdraw panel — takes 1/3 width */}
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-white">Provide Liquidity</h2>
          {POOL_CONFIGURED ? (
            <DepositWithdrawPanel />
          ) : (
            <div
              className="flex flex-col gap-2 p-4 rounded-xl border border-white/10 bg-white/5 text-xs text-white/40"
            >
              Deploy the contracts first, then set{" "}
              <code className="text-white/60">NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS</code> to enable deposits.
            </div>
          )}
        </div>
      </div>

      {/* ── Section 2: AI Market Maker banner ── */}
      <div
        className="flex items-start gap-4 p-5 rounded-xl border"
        style={{ background: "rgba(123,110,244,0.06)", borderColor: "rgba(123,110,244,0.2)" }}
      >
        <HugeiconsIcon icon={Robot01Icon} size={22} color="#7B6EF4" className="shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-white">AI Market Maker Agent</span>
          <span className="text-xs text-white/50 leading-relaxed">
            Prophet&apos;s market maker agent runs on{" "}
            <span className="text-white/70">0G Compute</span> and listens for{" "}
            <code className="text-white/60">MarketCreated</code> events. When a new market is
            deployed it calls <code className="text-white/60">allocateToMarket()</code> to seed
            it with pool capital, then returns principal + fees via{" "}
            <code className="text-white/60">returnLiquidityToPool()</code> after resolution.
            LP share price grows as fees accumulate.
          </span>
        </div>
      </div>

      {/* ── Section 3: Pool → Market allocations ── */}
      <MarketAllocationsTable
        marketAddresses={marketAddresses}
        marketTitles={marketTitles}
      />

      {/* ── Section 4: Bettor collateral by market ── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Bettor Collateral by Market</h2>
          <div className="flex items-center gap-4 text-xs text-white/40">
            <span>Total: <span className="text-white/60 font-mono">{fmtUsdt(totalBettorLiquidity)} USDT</span></span>
            <span>Active: <span className="text-white/60 font-mono">{fmtUsdt(activeBettorLiquidity)} USDT</span></span>
          </div>
        </div>

        <div className="flex flex-col border border-white/10 bg-white/5 rounded-xl overflow-hidden">
          {marketsLoading ? (
            <div className="px-6 py-10 text-center text-white/30 text-sm">Loading markets from 0G Chain…</div>
          ) : byLiquidity.length === 0 ? (
            <div className="px-6 py-10 text-center text-white/30 text-sm">
              No markets yet. Create one to seed the first pool.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-xs text-white/40 uppercase tracking-wider">
                  <th className="px-6 py-3 font-medium">Market</th>
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Collateral</th>
                  <th className="px-6 py-3 font-medium text-right">Share</th>
                  <th className="px-6 py-3 font-medium text-right"></th>
                </tr>
              </thead>
              <tbody>
                {byLiquidity.map((market) => {
                  const share =
                    totalBettorLiquidity > BigInt(0)
                      ? Number((market.rawCollateral * BigInt(10000)) / totalBettorLiquidity) / 100
                      : 0;
                  const color = STATUS_COLOR[market.chainStatus ?? ""] ?? "#6b7280";
                  return (
                    <tr key={market.id} className="border-b border-white/5 hover:bg-white/5 transition-colors text-sm">
                      <td className="px-6 py-4 text-white font-medium max-w-xs">
                        <span className="line-clamp-1" title={market.title}>{market.title}</span>
                      </td>
                      <td className="px-6 py-4 text-white/50 text-xs">{market.category}</td>
                      <td className="px-6 py-4">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ color, background: `${color}18` }}
                        >
                          {market.chainStatus ?? "Unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white font-mono text-right">
                        {fmtUsdt(market.rawCollateral)} USDT
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${share}%`, background: "#7B6EF4" }}
                            />
                          </div>
                          <span className="text-xs text-white/40 w-10 text-right">{share.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/market/${market.id}`}
                          className="text-xs text-white/30 hover:text-[#7B6EF4] transition-colors flex items-center justify-end gap-1"
                        >
                          View
                          <HugeiconsIcon icon={ArrowUpRight01Icon} size={11} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Section 5: How it works ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            step: "01",
            title: "LPs Deposit",
            desc: "Anyone deposits USDT into the protocol pool and receives LP shares proportional to their contribution.",
          },
          {
            step: "02",
            title: "Market Created",
            desc: "A user creates a prediction market. ProphetFactory deploys a new MarketContract on 0G Chain.",
          },
          {
            step: "03",
            title: "Agent Allocates",
            desc: "The AI market maker detects the MarketCreated event and calls allocateToMarket() to seed it with pool capital.",
          },
          {
            step: "04",
            title: "Fees Return",
            desc: "After resolution, the market returns principal + fees to the pool. Share price grows. LPs can withdraw anytime.",
          },
        ].map(({ step, title, desc }) => (
          <div
            key={step}
            className="flex flex-col gap-3 p-5 rounded-xl border border-white/10 bg-white/5"
          >
            <span className="text-xs font-mono text-[#7B6EF4] opacity-60">{step}</span>
            <span className="text-sm font-semibold text-white">{title}</span>
            <span className="text-xs text-white/40 leading-relaxed">{desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
