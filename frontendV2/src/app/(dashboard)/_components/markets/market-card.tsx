"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDownRight01Icon,
  ArrowUpRight01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import TradeModal from "./trade-modal";
import type { ProphetMarket } from "@/lib/prophet-market";
import { marketStatusColor, marketStatusDisplay } from "@/lib/market-status";

export type { ProphetMarket };

export default function MarketCard({ market }: { market: ProphetMarket }) {
  const [isTradeOpen, setIsTradeOpen] = useState(false);
  const up     = market.change >= 0;
  const isOpen = market.chainStatus === "Open";

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden transition-colors"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Header */}
      <div
        className="flex gap-3 p-3.5 pb-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div
          className="relative shrink-0 overflow-hidden rounded-lg bg-white/5"
          style={{ width: 44, height: 44 }}
        >
          <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
            <span className="text-[14px] font-bold text-white/50">
              {market.category.charAt(0)}
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-between min-w-0 flex-1 gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <span
              className="text-[10px] font-medium"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              0G Network
            </span>
            <span
              className="text-[10px] shrink-0 font-bold"
              style={{ color: marketStatusColor(market.chainStatus) }}
            >
              {market.chainStatus
                ? `${market.category} · ${marketStatusDisplay(market.chainStatus)}`
                : market.category}
            </span>
          </div>
          <p className="text-[13px] font-semibold text-white leading-snug line-clamp-2">
            {market.title}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            {market.isPriceLive ? (
              <>
                <span className="text-xl font-bold text-white leading-none">
                  {market.price}¢
                </span>
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                  / YES
                </span>
              </>
            ) : (
              <span className="text-[11px] italic" style={{ color: "rgba(255,255,255,0.2)" }}>
                Awaiting pricing…
              </span>
            )}
          </div>
          {market.change !== 0 ? (
            <div
              className="flex items-center gap-1 px-2 py-0.5"
              style={{
                background: up
                  ? "rgba(52,211,153,0.08)"
                  : "rgba(248,113,113,0.08)",
                border: `1px solid ${up ? "rgba(52,211,153,0.18)" : "rgba(248,113,113,0.18)"}`,
              }}
            >
              <HugeiconsIcon
                icon={up ? ArrowUpRight01Icon : ArrowDownRight01Icon}
                size={10}
                color={up ? "#34d399" : "#f87171"}
                strokeWidth={2}
              />
              <span
                className="text-[10px] font-semibold"
                style={{ color: up ? "#34d399" : "#f87171" }}
              >
                {up ? "+" : ""}
                {market.change}%
              </span>
            </div>
          ) : (
            <span
              className="text-[10px] text-white/25 px-2 py-0.5"
              title="No on-chain price feed yet"
            >
              —
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span
            className="text-[10px]"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            Vol {market.volume}
          </span>
          <span
            className="text-[10px]"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            Closes {market.closeDate}
          </span>
        </div>

        <div className="flex gap-2">
          {isOpen && (
            <button
              onClick={() => setIsTradeOpen(true)}
              className="flex-1 w-full justify-center px-4 py-2 text-[12px] font-semibold transition-all hover:opacity-80"
              style={{
                background: "#7B6EF4",
                color: "#0a0a0a",
                clipPath:
                  "polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)",
              }}
            >
              Trade
            </button>
          )}

          <Link href={`/market/${market.id}`} className="flex-1 text-center">
            <button
              className="w-full flex items-center justify-center gap-1 px-4 py-2 text-[12px] font-semibold transition-all hover:bg-white/10"
              style={{
                background: "rgba(255,255,255,0.05)",
                color: "white",
                clipPath:
                  "polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)",
              }}
            >
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={11}
                color="rgba(255,255,255,0.5)"
                strokeWidth={1.5}
              />
              View
            </button>
          </Link>
        </div>
      </div>

      <TradeModal
        isOpen={isTradeOpen}
        onClose={() => setIsTradeOpen(false)}
        marketAddress={market.id}
        marketTitle={market.title}
        marketYesPct={market.price}
        isPriceLive={market.isPriceLive}
      />
    </div>
  );
}
