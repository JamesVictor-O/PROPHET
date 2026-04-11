"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowUpRight01Icon,
  Clock01Icon,
  BarChartIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import TradePanel from "../../_components/trade-panel";
import PlatformLogo from "../../../_components/markets/platform-logo";
import { useMarketEvent } from "@/lib/hooks/use-market-event";
import { AIBriefContent } from "@/app/(dashboard)/alpha/_components/ai-brief-content";

const PriceChart = dynamic(() => import("../../_components/price-chart"), {
  ssr: false,
});

const TABS = ["Summary", "Recent Trades"] as const;
type Tab = (typeof TABS)[number];

const RECENT_TRADES = [
  {
    side: "yes",
    price: 67,
    shares: 150,
    value: 100.5,
    time: "2m ago",
    user: "0x3f...a1",
  },
  {
    side: "no",
    price: 33,
    shares: 90,
    value: 29.7,
    time: "5m ago",
    user: "0x7b...c4",
  },
  {
    side: "yes",
    price: 66,
    shares: 200,
    value: 132,
    time: "11m ago",
    user: "0x1a...d9",
  },
  {
    side: "yes",
    price: 65,
    shares: 75,
    value: 48.75,
    time: "18m ago",
    user: "0xfe...2e",
  },
  {
    side: "no",
    price: 34,
    shares: 300,
    value: 102,
    time: "24m ago",
    user: "0x5c...77",
  },
  {
    side: "yes",
    price: 64,
    shares: 500,
    value: 320,
    time: "31m ago",
    user: "0x8d...b0",
  },
  {
    side: "no",
    price: 36,
    shares: 120,
    value: 43.2,
    time: "40m ago",
    user: "0x2f...61",
  },
];

export default function MarketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("Summary");
  const [range, setRange] = useState("3M");

  const { data, isLoading, isError } = useMarketEvent(id ?? "");
  const event = data?.event;
  const brief = data?.brief;

  const platform = brief?.platform ?? "polymarket";
  const platformLabel = platform === "bayse" ? "Bayse" : "Polymarket";

  const title = brief?.eventTitle ?? (isLoading ? "" : "Market not found");
  const description = event?.description ?? "";
  const category = brief?.category ?? "";
  const image = brief?.image || `https://picsum.photos/seed/${id}/52/52`;
  const closesAt = brief?.closesAt
    ? new Date(brief.closesAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";
  const volumeFormatted = brief
    ? brief.volume >= 1_000_000
      ? `$${(brief.volume / 1_000_000).toFixed(1)}M Vol`
      : `$${(brief.volume / 1_000).toFixed(0)}K Vol`
    : "";
  const liquidityFormatted = brief
    ? brief.liquidity >= 1_000_000
      ? `$${(brief.liquidity / 1_000_000).toFixed(1)}M`
      : `$${(brief.liquidity / 1_000).toFixed(0)}K`
    : "";
  const probability = brief?.marketProbability ?? 0;

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: "#161616" }}
    >
      {/* Top bar */}
      <div
        className="flex items-center gap-3 px-8 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <button
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
        <span
          className="text-[13px]"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          Markets
        </span>
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

      {/* Main layout */}
      <div className="flex flex-1 gap-0">
        {/* Left: chart + tabs */}
        <div className="flex flex-col flex-1 min-w-0 px-8 py-6 gap-5">
          {/* Market header */}
          <div className="flex items-start gap-4">
            <div
              className="relative shrink-0 overflow-hidden rounded-xl"
              style={{
                width: 52,
                height: 52,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {isLoading ? (
                <div
                  style={{
                    width: 52,
                    height: 52,
                    background: "rgba(255,255,255,0.06)",
                    animation: "skeleton-pulse 1.5s ease-in-out infinite",
                  }}
                />
              ) : (
                <Image
                  src={image}
                  alt={title}
                  fill
                  className="object-cover"
                  sizes="52px"
                />
              )}
            </div>

            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <PlatformLogo platform={platform} size={16} />
                  <span
                    className="text-[10px] font-medium"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    {platformLabel}
                  </span>
                </div>
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
              <div className="flex items-center gap-4">
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
                {/* current probability */}
                {!isLoading && brief && (
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-[22px] font-bold text-white leading-none">
                      {probability}¢
                    </span>
                    <div
                      className="flex items-center gap-1 px-1.5 py-0.5"
                      style={{
                        background: "rgba(52,211,153,0.1)",
                        border: "1px solid rgba(52,211,153,0.15)",
                      }}
                    >
                      <HugeiconsIcon
                        icon={ArrowUpRight01Icon}
                        size={10}
                        color="#34d399"
                        strokeWidth={2}
                      />
                      <span
                        className="text-[10px] font-semibold"
                        style={{ color: "#34d399" }}
                      >
                        YES
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chart */}
          <div
            className="flex flex-col"
            style={{
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.015)",
            }}
          >
            {/* Chart toolbar */}
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
            >
              <span
                className="text-[10px] uppercase tracking-widest"
                style={{ color: "rgba(255,255,255,0.2)" }}
              >
                YES probability
              </span>
              <div className="flex items-center gap-0.5">
                {["1W", "1M", "3M", "All"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className="px-2 py-1 text-[10px] font-medium transition-all"
                    style={{
                      color: range === r ? "white" : "rgba(255,255,255,0.3)",
                      background:
                        range === r ? "rgba(255,255,255,0.07)" : "transparent",
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ height: 280 }}>
              <PriceChart />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-col gap-0">
            <div
              className="flex items-center gap-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              {TABS.map((t) => (
                <button
                  key={t}
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
                {isLoading ? (
                  <div className="flex flex-col gap-2">
                    {[90, 75, 60].map((w) => (
                      <div
                        key={w}
                        style={{
                          width: `${w}%`,
                          height: 10,
                          background: "rgba(255,255,255,0.06)",
                          borderRadius: 2,
                          animation: "skeleton-pulse 1.5s ease-in-out infinite",
                        }}
                      />
                    ))}
                  </div>
                ) : description ? (
                  <p
                    className="text-[13px] leading-relaxed"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    {description}
                  </p>
                ) : null}

                {/* AI brief, when available */}
                {brief && (
                  <div className="mt-2">
                    <AIBriefContent
                      slug={brief.eventSlug}
                      fallbackSummary={brief.opportunitySummary}
                    />
                  </div>
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
                      label: "Liquidity",
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
              <div className="flex flex-col">
                <div
                  className="grid grid-cols-5 px-4 py-2"
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  {["Side", "Price", "Shares", "Value", "Time"].map((h) => (
                    <span
                      key={h}
                      className="text-[10px] uppercase tracking-widest"
                      style={{ color: "rgba(255,255,255,0.2)" }}
                    >
                      {h}
                    </span>
                  ))}
                </div>
                {RECENT_TRADES.map((trade, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-5 px-4 py-2.5 transition-colors"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.background =
                        "rgba(255,255,255,0.02)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.background =
                        "transparent")
                    }
                  >
                    <span
                      className="text-[11px] font-semibold uppercase"
                      style={{
                        color: trade.side === "yes" ? "#34d399" : "#f87171",
                      }}
                    >
                      {trade.side}
                    </span>
                    <span className="text-[11px] text-white">
                      {trade.price}¢
                    </span>
                    <span
                      className="text-[11px]"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      {trade.shares}
                    </span>
                    <span className="text-[11px] text-white">
                      ${trade.value}
                    </span>
                    <span
                      className="text-[11px]"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      {trade.time}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: trade panel */}
        <div
          className="w-[30%] shrink-0 sticky top-0 self-start pt-6 pb-6 px-5"
          style={{ borderLeft: "1px solid rgba(255,255,255,0.05)" }}
        >
          <TradePanel
            marketAddress={
              (event as { conditionId?: string } | undefined)?.conditionId as
                | `0x${string}`
                | undefined
            }
            marketYesPct={probability || 50}
          />
        </div>
      </div>
    </div>
  );
}
