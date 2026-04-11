"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Brain02Icon,
  InformationCircleIcon,
  Clock01Icon,
  ArrowRight01Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";

const MOCK_ORACLE_STATS = {
  agentId: "prophet-oracle.0g",
  accuracy: "99.8%",
  resolutions: 142,
  earnedFees: "1,240 USDT",
};

const PENDING_CHALLENGES = [
  {
    id: "chal-1",
    marketTitle: "Will Tesla announce a Sub-$25k car by Q2?",
    verdict: "NO",
    confidence: "94%",
    stakedDispute: "500 USDT (5%)",
    timeRemaining: "14h 22m",
  },
];

const VERIFICATION_LOGS = [
  {
    id: "log-1",
    marketTitle: "Is Ethereum gas under 5 gwei on May 1st?",
    verdict: "YES",
    confidence: "98.5%",
    resolutionDate: "May 1, 2024",
    hash: "0x8fae...31b2",
    reasoning:
      "Scraped mainnet block heights ranging from 19800100 to 19803500 via the 0G compute bridge API endpoints. Measured standard gas prices strictly settling under 4.2 GWEI across a 12 hour period. Confidence interval aligns identically to required market definitions.",
    expanded: true,
  },
  {
    id: "log-2",
    marketTitle: "Will SP500 hit 5500 by July 1st?",
    verdict: "YES",
    confidence: "88%",
    resolutionDate: "July 1, 2024",
    hash: "0x1bc3...9fa1",
    reasoning:
      "Cross-referenced standardized EOD financial data pipelines matching standard SPX indexes breaking resistance levels past 5520 prior to deadline constraints.",
    expanded: false,
  },
];

export default function OracleDashboardPage() {
  const [logs, setLogs] = useState(VERIFICATION_LOGS);

  const toggleLog = (index: number) => {
    const next = [...logs];
    next[index].expanded = !next[index].expanded;
    setLogs(next);
  };

  return (
    <div
      className="flex flex-col gap-8 p-8"
      style={{ background: "#161616", minHeight: "100vh" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span className="text-white">AI Oracle Transparency</span>
            <div
              className="px-2.5 py-1 rounded bg-[#7B6EF4]/20 flex items-center gap-1.5"
              style={{ border: "1px solid rgba(123,110,244,0.3)" }}
            >
              <HugeiconsIcon
                icon={Tick01Icon}
                size={14}
                color="#7B6EF4"
                strokeWidth={2}
              />
              <span className="text-[11px] font-bold text-[#7B6EF4] tracking-widest uppercase">
                Verified Audits
              </span>
            </div>
          </h1>
          <p
            className="text-[13px] max-w-2xl"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            The Prophet platform relies on 0G Compute LLMs to resolve market
            outcomes entirely autonomously. No central committee. Permanent
            accountability utilizing 0G Storage reasoning hashes.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col text-right">
            <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest">
              Oracle Agent Identity
            </span>
            <span className="text-sm font-mono text-[#34d399] bg-[#34d399]/10 px-3 py-1 rounded mt-1 border border-[#34d399]/20">
              {MOCK_ORACLE_STATS.agentId}
            </span>
          </div>
        </div>
      </div>

      {/* Global Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Arbitrations */}
        <div
          className="flex flex-col gap-2 p-5 rounded-xl"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <HugeiconsIcon
              icon={Tick01Icon}
              size={14}
              color="rgba(255,255,255,0.3)"
            />
            <span className="text-xs uppercase tracking-widest text-white/40 font-semibold">
              Total Resolutions
            </span>
          </div>
          <span className="text-3xl font-bold text-white">
            {MOCK_ORACLE_STATS.resolutions}
          </span>
        </div>

        {/* Accuracy */}
        <div
          className="flex flex-col gap-2 p-5 rounded-xl"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <HugeiconsIcon icon={Tick01Icon} size={14} color="#34d399" />
            <span className="text-xs uppercase tracking-widest text-[#34d399]/60 font-semibold">
              Historical Accuracy
            </span>
          </div>
          <span className="text-3xl font-bold text-[#34d399]">
            {MOCK_ORACLE_STATS.accuracy}
          </span>
        </div>

        {/* Total Earned */}
        <div
          className="flex flex-col gap-2 p-5 rounded-xl"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <HugeiconsIcon icon={Brain02Icon} size={14} color="#7B6EF4" />
            <span className="text-xs uppercase tracking-widest text-[#7B6EF4]/70 font-semibold">
              Agent Fees Earned
            </span>
          </div>
          <span className="text-3xl font-bold text-white">
            {MOCK_ORACLE_STATS.earnedFees}
          </span>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        {/* Verification Feeds Panel */}
        <div className="flex-1 flex flex-col gap-4">
          <div
            className="flex items-center justify-between pb-2"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
          >
            <span className="text-sm font-bold text-white">
              Verified 0G Storage Log Trailing
            </span>
            <span className="text-[11px] text-white/30 uppercase tracking-widest">
              Public Immutable Read
            </span>
          </div>

          {logs.map((log, idx) => (
            <div
              key={log.id}
              className="flex flex-col overflow-hidden rounded-xl transition-all"
              style={{
                border: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => toggleLog(idx)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`px-2 py-1 rounded text-xs font-bold w-12 text-center ${log.verdict === "YES" ? "bg-[#34d399]/10 text-[#34d399]" : "bg-[#f87171]/10 text-[#f87171]"}`}
                  >
                    {log.verdict}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-white/90">
                      {log.marketTitle}
                    </span>
                    <span className="text-[11px] text-white/40 font-mono">
                      0G Hash: {log.hash} • {log.resolutionDate}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] text-white/30 font-semibold">
                      CONFIDENCE
                    </span>
                    <span className="text-sm text-white font-mono">
                      {log.confidence}
                    </span>
                  </div>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={16}
                    color="rgba(255,255,255,0.3)"
                    className={`transition-transform ${log.expanded ? "rotate-90" : ""}`}
                  />
                </div>
              </div>
              {/* Collapsable Reasoning Box */}
              {log.expanded && (
                <div
                  className="flex flex-col gap-3 p-4 bg-black/20"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.03)" }}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-white/50">
                    <HugeiconsIcon
                      icon={Brain02Icon}
                      size={13}
                      color="currentColor"
                    />
                    <span className="text-[11px] uppercase font-bold tracking-widest">
                      Agent Reasoning Output Memory
                    </span>
                  </div>
                  <p
                    className="text-xs text-white/60 leading-relaxed font-mono whitespace-pre-wrap pl-4"
                    style={{ borderLeft: "2px solid rgba(123,110,244,0.3)" }}
                  >
                    {log.reasoning}
                  </p>
                </div>
              )}
            </div>
          ))}
          {/* Note for reviewers */}
          <div className="mt-2 p-4 rounded-xl border border-dashed border-white/10 bg-transparent flex items-center justify-center">
            <span className="text-xs text-white/30 font-medium">
              Historical Storage Query Bridge Waiting for Node Connection
            </span>
          </div>
        </div>

        {/* 24 Hour Dispute Window */}
        <div className="w-full xl:w-[400px] shrink-0 flex flex-col gap-4">
          <div
            className="flex items-center gap-2 pb-2"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
          >
            <span className="text-sm font-bold text-white">
              Active Arbitration Window
            </span>
            <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[9px] font-bold">
              24H LIMIT
            </span>
          </div>

          <div
            className="flex flex-col gap-3 p-4 rounded-xl"
            style={{
              background: "rgba(248,113,113,0.03)",
              border: "1px solid rgba(248,113,113,0.15)",
            }}
          >
            <div className="flex items-start gap-2">
              <HugeiconsIcon
                icon={InformationCircleIcon}
                size={15}
                color="#f87171"
                className="shrink-0 mt-0.5"
              />
              <p className="text-xs text-white/60 leading-relaxed">
                Any user can challenge the AI Agent's resolution within 24
                hours. Staking 5% triggers a stronger secondary Compute
                Validation prompt.
              </p>
            </div>
          </div>

          {PENDING_CHALLENGES.map((chal) => (
            <div
              key={chal.id}
              className="flex flex-col gap-4 p-5 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[#f87171] font-semibold flex items-center gap-1">
                  <HugeiconsIcon
                    icon={Clock01Icon}
                    size={12}
                    color="currentColor"
                  />
                  {chal.timeRemaining} Left to Dispute
                </span>
                <span className="text-sm font-semibold text-white leading-snug">
                  {chal.marketTitle}
                </span>
              </div>

              <div
                className="flex items-center justify-between py-2 border-y my-1"
                style={{ borderColor: "rgba(255,255,255,0.05)" }}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-white/30 font-bold tracking-widest">
                    INITIAL VERDICT
                  </span>
                  <span
                    className={`text-sm font-bold ${chal.verdict === "NO" ? "text-red-400" : "text-green-400"}`}
                  >
                    {chal.verdict} ({chal.confidence})
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 text-right">
                  <span className="text-[10px] text-white/30 font-bold tracking-widest">
                    REQUIRED STAKE
                  </span>
                  <span className="text-sm font-mono text-white/80">
                    {chal.stakedDispute}
                  </span>
                </div>
              </div>

              <button
                className="w-full py-3 rounded text-sm font-bold transition-all hover:bg-white/10"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "white",
                }}
              >
                Dispute Verdict
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
