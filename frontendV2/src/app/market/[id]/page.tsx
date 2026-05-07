"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowUpRight01Icon,
  Clock01Icon,
  BarChartIcon,
} from "@hugeicons/core-free-icons";
import TradePanel from "../../_components/trade-panel";
import {
  useMarketDetail,
  formatUsdtUsd,
  formatDeadlineTs,
} from "@/lib/hooks/use-market-detail";
import { useOracleReasoning } from "@/lib/hooks/use-oracle-reasoning";
import { useMarketMetadata } from "@/lib/hooks/use-market-metadata";
import { zeroGGalileo } from "@/lib/web3-config";

const CandlestickChart = dynamic(
  () => import("../../_components/candlestick-chart"),
  { ssr: false }
);

const TABS = ["Summary", "Recent Trades"] as const;
type Tab = (typeof TABS)[number];

const explorer = zeroGGalileo.blockExplorers.default.url;

function shortHash(h: string, left = 6, right = 4) {
  if (!h || h.length < 12) return h;
  return `${h.slice(0, left)}…${h.slice(-right)}`;
}

export default function MarketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("Summary");
  const [range, setRange] = useState("3M");

  const {
    address,
    invalidAddress,
    notRegistered,
    detail,
    canTrade,
    impliedYesPct,
    isPriceLive,
    isLoading,
    error,
  } = useMarketDetail(id);

  const title = detail?.question ?? (isLoading ? "Loading…" : "Market");
  const category = detail?.category ?? "";
  const closesAt = detail ? formatDeadlineTs(detail.deadline) : "";
  const volumeFormatted = detail
    ? `${formatUsdtUsd(detail.totalCollateral)} Vol`
    : "";
  const liquidityFormatted = detail
    ? formatUsdtUsd(detail.totalCollateral)
    : "";
  const {
    data: oracleReasoning,
    isLoading: loadingReasoning,
    error: reasoningError,
    hasHash: hasReasoningHash,
  } = useOracleReasoning(detail?.verdictReasoningHash);

  const {
    data: metadata,
    isLoading: loadingOverview,
  } = useMarketMetadata(detail?.resolutionSourcesHash);

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: "#161616" }}
    >
      <div
        className="flex items-center gap-3 px-8 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <button
          type="button"
          className="flex items-center justify-center w-7 h-7 transition-all"
          style={{
            border: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(255,255,255,0.03)",
          }}
          onClick={() => router.back()}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.background =
              "rgba(255,255,255,0.06)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.background =
              "rgba(255,255,255,0.03)")
          }
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={13}
            color="rgba(255,255,255,0.5)"
            strokeWidth={1.5}
          />
        </button>
        <Link
          href="/markets"
          className="text-[13px] hover:text-white/80"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          Markets
        </Link>
        <span
          className="text-[13px]"
          style={{ color: "rgba(255,255,255,0.15)" }}
        >
          /
        </span>
        <span
          className="text-[13px] font-medium truncate max-w-md"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          {isLoading ? "Loading…" : title}
        </span>
      </div>

      {invalidAddress && (
        <div className="px-8 py-12 text-center text-sm text-white/40">
          This URL is not a valid market address. Open a market from the{" "}
          <Link href="/markets" className="text-[#7B6EF4] hover:underline">
            markets list
          </Link>
          .
        </div>
      )}

      {notRegistered && address && (
        <div className="px-8 py-12 text-center text-sm text-amber-200/80 max-w-lg mx-auto">
          <p className="mb-2">
            <code className="text-xs text-white/60">{address}</code> is not
            registered on this Prophet factory.
          </p>
          <Link href="/markets" className="text-[#7B6EF4] hover:underline text-sm">
            Back to markets
          </Link>
        </div>
      )}

      {error && address && !notRegistered && (
        <div className="px-8 py-8">
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-300 max-w-xl">
            Failed to load market:{" "}
            {error instanceof Error ? error.message : "Unknown error"}
          </div>
        </div>
      )}

      {!invalidAddress && !notRegistered && (
        <div className="flex flex-1 gap-0">
          <div className="flex flex-col flex-1 min-w-0 px-8 py-6 gap-5">
            <div className="flex items-start gap-4">
              <div
                className="relative shrink-0 overflow-hidden rounded-xl flex items-center justify-center text-lg font-bold text-white/60"
                style={{
                  width: 52,
                  height: 52,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background:
                    "linear-gradient(135deg, rgba(123,110,244,0.25), rgba(52,211,153,0.15))",
                }}
              >
                {category ? category.charAt(0) : "?"}
              </div>

              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-[10px] font-medium uppercase tracking-wide"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    Prophet · 0G Galileo
                  </span>
                  {detail?.statusLabel && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded"
                      style={{
                        background: "rgba(123,110,244,0.15)",
                        color: "rgba(167,159,250,0.95)",
                      }}
                    >
                      {detail.statusLabel}
                    </span>
                  )}
                  {category && (
                    <span
                      className="text-[10px]"
                      style={{ color: "rgba(255,255,255,0.25)" }}
                    >
                      {category}
                    </span>
                  )}
                  {closesAt && (
                    <div className="flex items-center gap-1 ml-auto">
                      <HugeiconsIcon
                        icon={Clock01Icon}
                        size={10}
                        color="rgba(255,255,255,0.2)"
                        strokeWidth={1.5}
                      />
                      <span
                        className="text-[10px]"
                        style={{ color: "rgba(255,255,255,0.25)" }}
                      >
                        Closes {closesAt}
                      </span>
                    </div>
                  )}
                </div>
                {isLoading ? (
                  <div
                    style={{
                      width: "70%",
                      height: 20,
                      background: "rgba(255,255,255,0.06)",
                      borderRadius: 3,
                      animation: "skeleton-pulse 1.5s ease-in-out infinite",
                    }}
                  />
                ) : (
                  <h1 className="text-[18px] font-semibold text-white leading-snug">
                    {title}
                  </h1>
                )}
                <div className="flex items-center gap-4 flex-wrap">
                  {volumeFormatted && (
                    <div className="flex items-center gap-1.5">
                      <HugeiconsIcon
                        icon={BarChartIcon}
                        size={11}
                        color="rgba(255,255,255,0.2)"
                        strokeWidth={1.5}
                      />
                      <span
                        className="text-[11px]"
                        style={{ color: "rgba(255,255,255,0.3)" }}
                      >
                        {volumeFormatted}
                      </span>
                    </div>
                  )}
                  {!isLoading && detail && (
                    <div className="flex items-center gap-1.5 ml-auto">
                      {isPriceLive ? (
                        <>
                          <span className="text-[22px] font-bold text-white leading-none">
                            {impliedYesPct}¢
                          </span>
                          <span className="text-[10px] text-white/30 max-w-[140px] text-right">
                            implied YES
                          </span>
                          <div
                            className="flex items-center gap-1 px-1.5 py-0.5"
                            style={{
                              background: "rgba(52,211,153,0.1)",
                              border: "1px solid rgba(52,211,153,0.15)",
                            }}
                          >
                            <HugeiconsIcon icon={ArrowUpRight01Icon} size={10} color="#34d399" strokeWidth={2} />
                            <span className="text-[10px] font-semibold" style={{ color: "#34d399" }}>YES</span>
                          </div>
                        </>
                      ) : (
                        <span className="text-[11px] text-white/25 italic">
                          Awaiting market maker…
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div
              className="flex flex-col"
              style={{
                border: "1px solid rgba(255,255,255,0.06)",
                background: "#161616",
              }}
            >
              <div
                className="flex items-center justify-between px-4 py-2.5"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    YES probability
                  </span>
                  {isPriceLive ? (
                    <span className="text-[11px] font-mono" style={{ color: "#34d399" }}>
                      {impliedYesPct}¢
                    </span>
                  ) : (
                    <span className="text-[11px] italic" style={{ color: "rgba(255,255,255,0.2)" }}>
                      pending
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-0.5">
                  {["1W", "1M", "3M", "All"].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRange(r)}
                      className="px-2 py-1 text-[10px] font-medium transition-all rounded"
                      style={{
                        color: range === r ? "white" : "rgba(255,255,255,0.3)",
                        background:
                          range === r ? "rgba(255,255,255,0.08)" : "transparent",
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ height: 280 }}>
                {detail ? (
                  <CandlestickChart
                    yesPct={impliedYesPct}
                    deadlineTs={Number(detail.deadline)}
                    height={280}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-white/20 text-xs">
                    Loading chart…
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-0">
              <div
                className="flex items-center gap-0"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                {TABS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className="px-4 py-2.5 text-[12px] font-medium transition-all relative"
                    style={{
                      color: tab === t ? "white" : "rgba(255,255,255,0.3)",
                    }}
                  >
                    {t}
                    {tab === t && (
                      <span
                        className="absolute bottom-0 left-0 right-0 h-px"
                        style={{ background: "#7B6EF4" }}
                      />
                    )}
                  </button>
                ))}
              </div>

              {tab === "Summary" && (
                <div className="flex flex-col gap-4 py-4">
                  {detail && (
                    <>
                      {/* ── AI Overview (0G Compute) ─────────────────────── */}
                      <div
                        className="p-3 rounded-lg"
                        style={{
                          border: "1px solid rgba(123,110,244,0.15)",
                          background: "rgba(123,110,244,0.04)",
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className="text-[10px] font-semibold uppercase tracking-widest"
                            style={{ color: "rgba(167,159,250,0.7)" }}
                          >
                            AI Overview · 0G Compute
                          </span>
                        </div>

                        {loadingOverview && (
                          <div className="flex flex-col gap-1.5">
                            {[80, 100, 60].map((w) => (
                              <div
                                key={w}
                                style={{
                                  width: `${w}%`,
                                  height: 11,
                                  background: "rgba(255,255,255,0.06)",
                                  borderRadius: 2,
                                  animation: "skeleton-pulse 1.5s ease-in-out infinite",
                                }}
                              />
                            ))}
                          </div>
                        )}

                        {!loadingOverview && metadata?.aiOverview && (
                          <div className="flex flex-col gap-3 text-[12px]">
                            <p className="text-white/70 leading-relaxed">
                              {metadata.aiOverview.overview}
                            </p>
                            {metadata.aiOverview.keyFactors?.length > 0 && (
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase tracking-widest text-white/30">
                                  Key factors
                                </span>
                                <ul className="flex flex-col gap-0.5">
                                  {metadata.aiOverview.keyFactors.map((f) => (
                                    <li
                                      key={f}
                                      className="flex items-start gap-1.5 text-white/55"
                                    >
                                      <span
                                        className="mt-1.5 shrink-0 rounded-full"
                                        style={{
                                          width: 3,
                                          height: 3,
                                          background: "rgba(167,159,250,0.6)",
                                        }}
                                      />
                                      {f}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {metadata.aiOverview.currentOddsContext && (
                              <p
                                className="text-[11px] leading-relaxed"
                                style={{ color: "rgba(255,255,255,0.38)" }}
                              >
                                {metadata.aiOverview.currentOddsContext}
                              </p>
                            )}
                          </div>
                        )}

                        {!loadingOverview && !metadata?.aiOverview && (
                          <p className="text-[12px] text-white/30">
                            {metadata
                              ? "AI overview not generated for this market."
                              : "Overview loading…"}
                          </p>
                        )}
                      </div>

                      {/* ── On-chain details ─────────────────────────────── */}
                      <dl className="grid gap-2 text-[12px]">
                        <div className="flex justify-between gap-4">
                          <dt className="text-white/35">Contract</dt>
                          <dd>
                            <a
                              href={`${explorer}/address/${detail.address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#7B6EF4] hover:underline font-mono text-[11px]"
                            >
                              {shortHash(detail.address, 8, 6)}
                            </a>
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-white/35">Creator</dt>
                          <dd>
                            <a
                              href={`${explorer}/address/${detail.creator}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#7B6EF4] hover:underline font-mono text-[11px]"
                            >
                              {shortHash(detail.creator, 8, 6)}
                            </a>
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-white/35">Sources hash</dt>
                          <dd
                            className="font-mono text-[11px] text-white/50 truncate max-w-[60%] text-right"
                            title={detail.verdictReasoningHash}
                          >
                            {shortHash(detail.verdictReasoningHash, 10, 8)}
                          </dd>
                        </div>
                        {detail.status >= 4 && (
                          <div className="flex justify-between gap-4">
                            <dt className="text-white/35">Outcome</dt>
                            <dd className="text-white/80">
                              {detail.outcome ? "YES" : "NO"}
                            </dd>
                          </div>
                        )}
                      </dl>

                      {/* ── Oracle reasoning (post-resolution) ───────────── */}
                      <div
                        className="p-3 rounded-lg"
                        style={{
                          border: "1px solid rgba(255,255,255,0.06)",
                          background: "rgba(255,255,255,0.02)",
                        }}
                      >
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <h3 className="text-[12px] font-semibold text-white/85">
                            Oracle reasoning (0G Storage)
                          </h3>
                          {oracleReasoning?.confidence !== undefined && (
                            <span className="text-[11px] text-white/50">
                              Confidence {oracleReasoning.confidence}%
                            </span>
                          )}
                        </div>

                        {!hasReasoningHash && (
                          <p className="text-[12px] text-white/35">
                            The AI oracle will post its full reasoning here once
                            this market resolves. The reasoning chain is stored
                            permanently on 0G Storage and linked on-chain.
                          </p>
                        )}

                        {hasReasoningHash && loadingReasoning && (
                          <p className="text-[12px] text-white/45">
                            Loading reasoning from 0G Storage...
                          </p>
                        )}

                        {hasReasoningHash && reasoningError && (
                          <p className="text-[12px] text-red-300/90">
                            Could not load reasoning: {reasoningError}
                          </p>
                        )}

                        {hasReasoningHash &&
                          !loadingReasoning &&
                          !reasoningError &&
                          oracleReasoning && (
                            <div className="flex flex-col gap-2 text-[12px]">
                              {oracleReasoning.evidenceSummary && (
                                <p className="text-white/65">
                                  {oracleReasoning.evidenceSummary}
                                </p>
                              )}
                              <p className="text-white/75 whitespace-pre-wrap leading-relaxed">
                                {oracleReasoning.reasoning ??
                                  oracleReasoning.raw ??
                                  "No reasoning text available."}
                              </p>
                              {!!oracleReasoning.sourcesChecked?.length && (
                                <p className="text-white/45">
                                  Sources:{" "}
                                  {oracleReasoning.sourcesChecked.join(", ")}
                                </p>
                              )}
                            </div>
                          )}
                      </div>
                    </>
                  )}
                  <div
                    className="grid grid-cols-2 gap-px"
                    style={{
                      border: "1px solid rgba(255,255,255,0.06)",
                      background: "rgba(255,255,255,0.06)",
                    }}
                  >
                    {[
                      {
                        label: "Pool (collateral)",
                        value: isLoading ? "…" : liquidityFormatted || "—",
                      },
                      {
                        label: "Volume",
                        value: isLoading ? "…" : volumeFormatted || "—",
                      },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="flex flex-col gap-1 px-4 py-3"
                        style={{ background: "rgba(255,255,255,0.015)" }}
                      >
                        <span
                          className="text-[10px] uppercase tracking-widest"
                          style={{ color: "rgba(255,255,255,0.25)" }}
                        >
                          {label}
                        </span>
                        <span className="text-[15px] font-semibold text-white">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === "Recent Trades" && (
                <div className="py-10 px-4 text-center text-sm text-white/35 border border-dashed border-white/10 rounded-lg">
                  On-chain fills are not indexed in this MVP. Use the explorer
                  for transaction history, or add an indexer later.
                </div>
              )}
            </div>
          </div>

          <div
            className="w-[30%] shrink-0 sticky top-0 self-start pt-6 pb-6 px-5 max-lg:w-full max-lg:border-l-0 max-lg:border-t max-lg:border-white/5"
            style={{ borderLeft: "1px solid rgba(255,255,255,0.05)" }}
          >
            <TradePanel
              marketAddress={address}
              marketYesPct={impliedYesPct}
              tradeEnabled={!isLoading && canTrade}
            />
          </div>
        </div>
      )}
    </div>
  );
}
