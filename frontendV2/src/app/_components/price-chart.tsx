"use client";

import { formatUnits } from "viem";
import type { ProphetMarket } from "@/lib/prophet-market";
import { marketStatusColor } from "@/lib/market-status";

// ── Probability view (per-market YES/NO split) ────────────────────────────────

function ProbabilityView({ yesPct }: { yesPct: number }) {
  const noPct = 100 - yesPct;
  return (
    <div className="flex flex-col h-full justify-center gap-5 px-6 py-4">
      <div className="flex justify-between text-[11px] font-medium text-white/40 uppercase tracking-widest">
        <span>YES</span>
        <span>NO</span>
      </div>

      <div className="relative flex rounded-full overflow-hidden h-3 bg-white/5">
        <div
          className="transition-all duration-700"
          style={{ width: `${yesPct}%`, background: "#34d399" }}
        />
        <div
          className="transition-all duration-700"
          style={{ width: `${noPct}%`, background: "#f87171" }}
        />
      </div>

      <div className="flex justify-between items-end">
        <div className="flex flex-col">
          <span className="text-4xl font-bold" style={{ color: "#34d399" }}>
            {yesPct}%
          </span>
          <span className="text-xs text-white/30 mt-1">implied YES</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-4xl font-bold" style={{ color: "#f87171" }}>
            {noPct}%
          </span>
          <span className="text-xs text-white/30 mt-1">implied NO</span>
        </div>
      </div>

      <p className="text-[10px] text-white/20 text-center mt-2">
        Market maker quote · Historical chart available after mainnet launch
      </p>
    </div>
  );
}

// ── Protocol volume view (markets overview) ───────────────────────────────────

function formatUsdt(raw: bigint): string {
  const n = Number(formatUnits(raw, 6));
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function VolumeView({ markets }: { markets: ProphetMarket[] }) {
  if (!markets.length) {
    return (
      <div className="flex h-full items-center justify-center text-white/20 text-sm">
        No markets yet
      </div>
    );
  }

  const totalRaw = markets.reduce((s, m) => s + m.rawCollateral, BigInt(0));

  // Count by status
  const byStatus = markets.reduce<Record<string, number>>((acc, m) => {
    const s = m.chainStatus ?? "Unknown";
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  const statusEntries = Object.entries(byStatus).sort((a, b) => b[1] - a[1]);
  const maxCount = Math.max(...statusEntries.map(([, c]) => c), 1);

  return (
    <div className="flex h-full flex-col justify-center gap-4 px-6 py-4">
      {/* Summary row */}
      <div className="flex gap-8">
        <div>
          <div className="text-2xl font-bold text-white">{markets.length}</div>
          <div className="text-[10px] uppercase tracking-widest text-white/30 mt-0.5">
            Total Markets
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold" style={{ color: "#34d399" }}>
            {markets.filter((m) => m.chainStatus === "Open").length}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-white/30 mt-0.5">
            Live Now
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold" style={{ color: "#7B6EF4" }}>
            {formatUsdt(totalRaw)}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-white/30 mt-0.5">
            Total Volume
          </div>
        </div>
      </div>

      {/* Per-status horizontal bars */}
      <div className="flex flex-col gap-2">
        {statusEntries.map(([status, count]) => (
          <div key={status} className="flex items-center gap-3">
            <span
              className="text-[10px] w-20 text-right shrink-0"
              style={{ color: marketStatusColor(status) }}
            >
              {status}
            </span>
            <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(count / maxCount) * 100}%`,
                  background: marketStatusColor(status),
                }}
              />
            </div>
            <span className="text-[10px] text-white/40 w-6 shrink-0">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

interface PriceChartProps {
  /** Per-market YES probability (0-100). Shows probability split view. */
  yesPct?: number;
  /** Protocol-level markets data. Shows aggregate volume/status view. */
  markets?: ProphetMarket[];
}

export default function PriceChart({ yesPct, markets }: PriceChartProps = {}) {
  if (yesPct !== undefined) {
    return <ProbabilityView yesPct={yesPct} />;
  }
  if (markets !== undefined) {
    return <VolumeView markets={markets} />;
  }
  return (
    <div className="w-full h-full bg-gray-900 rounded-lg flex items-center justify-center text-white/20 text-sm">
      No data
    </div>
  );
}
