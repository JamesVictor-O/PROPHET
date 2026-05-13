"use client";

import { useState } from "react";
import { formatUnits } from "viem";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Brain02Icon,
  InformationCircleIcon,
  Clock01Icon,
  ArrowRight01Icon,
  Tick01Icon,
  Robot01Icon,
  ArrowUpRight01Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { useMarkets } from "@/lib/hooks/use-markets";
import { useOracleReasoning } from "@/lib/hooks/use-oracle-reasoning";
import type { ProphetMarket } from "@/lib/prophet-market";
import { zeroGGalileo } from "@/lib/web3-config";

const ORACLE_ADDRESS = "0x2e5d8B56F9B4770a88794a47C32c177542d2f6ea";
const ZERO_HASH = `0x${"0".repeat(64)}`;
const explorer = zeroGGalileo.blockExplorers.default.url;

function shortAddr(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function formatUsdt(raw: bigint) {
  const n = Number(formatUnits(raw, 6));
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function timeLeft(deadlineSec: bigint): string {
  const diff = Number(deadlineSec) - Math.floor(Date.now() / 1000);
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return `${h}h ${m}m left`;
}

// ── Per-resolved-market row with lazy 0G Storage fetch ───────────────────────
function ResolvedRow({ market }: { market: ProphetMarket }) {
  const [expanded, setExpanded] = useState(false);
  const hash = market.verdictReasoningHash;
  const hasHash = !!hash && hash !== ZERO_HASH;

  const { data: reasoning, isLoading: loadingReasoning } =
    useOracleReasoning(expanded && hasHash ? hash : undefined);

  const verdictLabel = market.outcome ? "YES" : "NO";
  const verdictColor = market.outcome ? "#34d399" : "#f87171";

  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl transition-all"
      style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
    >
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setExpanded((x) => !x)}
      >
        <div className="flex items-center gap-3">
          <span
            className="px-2 py-1 rounded text-xs font-bold w-12 text-center"
            style={{ background: `${verdictColor}18`, color: verdictColor }}
          >
            {verdictLabel}
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-white/90 line-clamp-1">
              {market.title}
            </span>
            <span className="text-[11px] text-white/40 font-mono">
              {hasHash
                ? `0G Hash: ${hash!.slice(0, 10)}…${hash!.slice(-6)}`
                : "Hash: local fallback (0G Storage unavailable at creation)"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-white/30 font-semibold">POOL</span>
            <span className="text-sm text-white font-mono">{formatUsdt(market.rawCollateral)}</span>
          </div>
          <Link
            href={`/market/${market.id}`}
            className="text-white/20 hover:text-[#7B6EF4] transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} />
          </Link>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={16}
            color="rgba(255,255,255,0.3)"
            className={`transition-transform ${expanded ? "rotate-90" : ""}`}
          />
        </div>
      </div>

      {expanded && (
        <div
          className="flex flex-col gap-3 p-4 bg-black/20"
          style={{ borderTop: "1px solid rgba(255,255,255,0.03)" }}
        >
          {!hasHash ? (
            <p className="text-xs text-white/30 italic">
              No 0G Storage hash — market was created while the storage indexer was offline. The oracle resolved using general knowledge.
            </p>
          ) : loadingReasoning ? (
            <p className="text-xs text-white/30 animate-pulse">
              Fetching reasoning from 0G Storage…
            </p>
          ) : reasoning?.reasoning ? (
            <>
              <div className="flex items-center gap-1.5 text-white/50">
                <HugeiconsIcon icon={Brain02Icon} size={13} color="currentColor" />
                <span className="text-[11px] uppercase font-bold tracking-widest">
                  Oracle Reasoning · 0G Storage
                </span>
                {reasoning.confidence && (
                  <span className="ml-auto text-[11px] font-mono text-[#7B6EF4]">
                    {reasoning.confidence}% confidence
                  </span>
                )}
              </div>
              <p
                className="text-xs text-white/60 leading-relaxed font-mono whitespace-pre-wrap pl-4"
                style={{ borderLeft: "2px solid rgba(123,110,244,0.3)" }}
              >
                {reasoning.reasoning}
              </p>
              {reasoning.sourcesChecked && reasoning.sourcesChecked.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {reasoning.sourcesChecked.map((s, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/30 font-mono">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-white/30 italic">
              Reasoning not found in 0G Storage — the oracle agent may not have been running at resolution time.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function OracleStatusRow({ market }: { market: ProphetMarket }) {
  const isCancelled = market.chainStatus === "Cancelled";
  const tone = isCancelled
    ? { label: "INCONCLUSIVE", color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.18)" }
    : { label: market.chainStatus ?? "PENDING", color: "#fbbf24", bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.18)" };

  return (
    <div
      className="flex items-center justify-between gap-4 rounded-xl p-4"
      style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${tone.border}` }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="w-28 rounded px-2 py-1 text-center text-[10px] font-bold"
          style={{ background: tone.bg, color: tone.color }}
        >
          {tone.label}
        </span>
        <div className="min-w-0">
          <p className="line-clamp-1 text-sm font-semibold text-white/85">
            {market.title}
          </p>
          <p className="mt-0.5 text-[11px] text-white/30">
            {isCancelled
              ? "Oracle could not safely post a conclusive YES/NO verdict, so the market was refunded."
              : "Oracle agent is collecting evidence and preparing a 0G Compute verdict."}
          </p>
        </div>
      </div>
      <Link
        href={`/market/${market.id}`}
        className="shrink-0 text-white/25 transition-colors hover:text-[#7B6EF4]"
      >
        <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} />
      </Link>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function OracleDashboardPage() {
  const { markets, isLoading } = useMarkets();

  const resolved   = markets.filter((m) => m.chainStatus === "Resolved");
  const resolving  = markets.filter((m) => m.chainStatus === "Resolving");
  const challenged = markets.filter((m) => m.chainStatus === "Challenged");
  const cancelled  = markets.filter((m) => m.chainStatus === "Cancelled");

  const totalResolutions = resolved.length;
  const accuracy = totalResolutions + cancelled.length > 0
    ? Math.round((totalResolutions / (totalResolutions + cancelled.length)) * 100)
    : 100;

  // Oracle earns 1% fee on resolved markets (from FeeLib: ORACLE_FEE_BPS = 100)
  const feesEarned = resolved.reduce((s, m) => s + m.rawCollateral, BigInt(0)) / BigInt(100);

  return (
    <div className="flex flex-col gap-8 p-8 min-h-screen" style={{ background: "#161616" }}>
      {/* Header */}
      <div className="flex items-start justify-between border-b border-white/5 pb-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            AI Oracle Transparency
            <div
              className="px-2.5 py-1 rounded flex items-center gap-1.5"
              style={{ background: "rgba(123,110,244,0.15)", border: "1px solid rgba(123,110,244,0.3)" }}
            >
              <HugeiconsIcon icon={Tick01Icon} size={13} color="#7B6EF4" strokeWidth={2} />
              <span className="text-[11px] font-bold text-[#7B6EF4] tracking-widest uppercase">
                Live On-Chain
              </span>
            </div>
          </h1>
          <p className="text-[13px] text-white/40 max-w-2xl">
            Every resolution is made autonomously by the 0G Compute oracle agent.
            Reasoning chains are stored permanently on 0G Storage — publicly verifiable.
          </p>
        </div>

        {/* Oracle identity */}
        <div className="flex flex-col gap-1 text-right shrink-0">
          <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest">Oracle Agent</span>
          <a
            href={`${explorer}/address/${ORACLE_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-sm transition-colors hover:opacity-80"
            style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", color: "#34d399" }}
          >
            <HugeiconsIcon icon={Robot01Icon} size={13} color="#34d399" />
            {shortAddr(ORACLE_ADDRESS)}
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={11} color="#34d399" />
          </a>
          <span className="text-[10px] text-white/20">0G Galileo · Powered by 0G Compute</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-2 p-5 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Tick01Icon} size={14} color="rgba(255,255,255,0.3)" />
            <span className="text-xs uppercase tracking-widest text-white/40 font-semibold">Total Resolutions</span>
          </div>
          <span className="text-3xl font-bold text-white">
            {isLoading ? "—" : totalResolutions}
          </span>
          <span className="text-xs text-white/25">{cancelled.length} cancelled (inconclusive)</span>
        </div>

        <div className="flex flex-col gap-2 p-5 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Tick01Icon} size={14} color="#34d399" />
            <span className="text-xs uppercase tracking-widest text-[#34d399]/60 font-semibold">Conclusive Rate</span>
          </div>
          <span className="text-3xl font-bold text-[#34d399]">
            {isLoading ? "—" : `${accuracy}%`}
          </span>
          <span className="text-xs text-white/25">resolved vs cancelled markets</span>
        </div>

        <div className="flex flex-col gap-2 p-5 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Brain02Icon} size={14} color="#7B6EF4" />
            <span className="text-xs uppercase tracking-widest text-[#7B6EF4]/70 font-semibold">Agent Fees Earned</span>
          </div>
          <span className="text-3xl font-bold text-white">
            {isLoading ? "—" : formatUsdt(feesEarned)}
          </span>
          <span className="text-xs text-white/25">1% of resolved pool collateral</span>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        {/* Verified resolutions from chain */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <span className="text-sm font-bold text-white">Verified Resolutions</span>
            <span className="text-[11px] text-white/30 uppercase tracking-widest">Reasoning from 0G Storage</span>
          </div>

          {isLoading && (
            <div className="text-sm text-white/30 animate-pulse py-4">Loading markets from 0G Chain…</div>
          )}

          {!isLoading && resolved.length === 0 && (
            <div className="py-8 text-center border border-dashed border-white/10 rounded-xl">
              <p className="text-sm text-white/30">No resolved markets yet.</p>
              <p className="text-xs text-white/20 mt-1">
                Resolved YES/NO verdicts will appear here after the challenge window closes.
              </p>
            </div>
          )}

          {resolved.map((market) => (
            <ResolvedRow key={market.id} market={market} />
          ))}

          {cancelled.length > 0 && (
            <div className="mt-5 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-sm font-bold text-white">Inconclusive / Refunded</span>
                <span className="text-[11px] uppercase tracking-widest text-white/25">
                  Safety fallback
                </span>
              </div>
              {cancelled.map((market) => (
                <OracleStatusRow key={market.id} market={market} />
              ))}
            </div>
          )}
        </div>

        {/* Active challenge window */}
        <div className="w-full xl:w-[380px] shrink-0 flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <span className="text-sm font-bold text-white">Active Challenge Window</span>
            <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[9px] font-bold">24H</span>
          </div>

          <div
            className="flex items-start gap-3 p-4 rounded-xl"
            style={{ background: "rgba(248,113,113,0.03)", border: "1px solid rgba(248,113,113,0.15)" }}
          >
            <HugeiconsIcon icon={InformationCircleIcon} size={15} color="#f87171" className="shrink-0 mt-0.5" />
            <p className="text-xs text-white/50 leading-relaxed">
              Any user can challenge the oracle's verdict within 24 hours of posting.
              Staking 5% of the pool triggers a second 0G Compute inference run.
            </p>
          </div>

          {isLoading && (
            <p className="text-xs text-white/30 animate-pulse">Loading…</p>
          )}

          {!isLoading && challenged.length === 0 && (
            <div className="py-6 text-center border border-dashed border-white/10 rounded-xl">
              <p className="text-sm text-white/30">No active challenges</p>
            </div>
          )}

          {challenged.map((market) => (
            <div
              key={market.id}
              className="flex flex-col gap-4 p-5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[#f87171] font-semibold flex items-center gap-1">
                  <HugeiconsIcon icon={Clock01Icon} size={12} color="currentColor" />
                  {market.challengeDeadline ? timeLeft(market.challengeDeadline) : "—"}
                </span>
                <span className="text-sm font-semibold text-white leading-snug line-clamp-2">
                  {market.title}
                </span>
              </div>

              <div
                className="flex items-center justify-between py-2 border-y"
                style={{ borderColor: "rgba(255,255,255,0.05)" }}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-white/30 font-bold tracking-widest">INITIAL VERDICT</span>
                  <span className={`text-sm font-bold ${market.outcome ? "text-[#34d399]" : "text-[#f87171]"}`}>
                    {market.outcome ? "YES" : "NO"}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 text-right">
                  <span className="text-[10px] text-white/30 font-bold tracking-widest">POOL SIZE</span>
                  <span className="text-sm font-mono text-white/80">{formatUsdt(market.rawCollateral)}</span>
                </div>
              </div>

              <Link
                href={`/market/${market.id}`}
                className="w-full py-3 rounded text-sm font-bold transition-all hover:bg-white/10 text-center block"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
              >
                View Market & Challenge
              </Link>
            </div>
          ))}

          <div className="mt-4 flex items-center justify-between pb-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <span className="text-sm font-bold text-white">Oracle Queue</span>
            <span className="text-[11px] text-white/30 uppercase tracking-widest">PendingResolution</span>
          </div>

          {!isLoading && resolving.length === 0 && (
            <div className="py-6 text-center border border-dashed border-white/10 rounded-xl">
              <p className="text-sm text-white/30">No markets waiting on oracle</p>
            </div>
          )}

          {resolving.map((market) => (
            <OracleStatusRow key={market.id} market={market} />
          ))}
        </div>
      </div>
    </div>
  );
}
