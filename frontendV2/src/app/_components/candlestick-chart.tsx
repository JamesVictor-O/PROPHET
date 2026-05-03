"use client";

import { useEffect, useRef, useMemo } from "react";
import {
  createChart,
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  type IChartApi,
} from "lightweight-charts";

// ── Seeded PRNG (mulberry32) ─────────────────────────────────────────────────
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Generate synthetic OHLC candles ─────────────────────────────────────────
// Produces a random walk from ~50 → yesPct so the chart always looks "alive"
// and ends where the current probability is.
function generateCandles(
  yesPct: number,
  deadlineTs: number,   // seconds
  createdTs: number,    // seconds
  count = 60
) {
  const rand   = mulberry32(Math.round(yesPct * 137 + createdTs % 9999));
  const now    = Math.floor(Date.now() / 1000);
  const start  = Math.max(createdTs, now - 60 * 60 * 24 * 90); // up to 90 days back
  const end    = Math.min(now, deadlineTs);
  const step   = Math.max(Math.floor((end - start) / count), 60);

  let price = 50;
  const target = yesPct;
  const candles = [];

  for (let i = 0; i < count; i++) {
    const t = start + i * step;
    if (t > now) break;

    // Drift toward target, with noise
    const progress = i / count;
    const drift    = (target - price) * 0.08 * (1 + progress);
    const noise    = (rand() - 0.48) * 4;
    const move     = drift + noise;

    const open  = price;
    price       = Math.max(1, Math.min(99, price + move));
    const close = price;

    const hi = Math.max(open, close) + rand() * 2.5;
    const lo = Math.min(open, close) - rand() * 2.5;

    candles.push({
      time:  t as unknown as import("lightweight-charts").Time,
      open:  +open.toFixed(2),
      high:  +Math.min(99, hi).toFixed(2),
      low:   +Math.max(1, lo).toFixed(2),
      close: +close.toFixed(2),
    });
  }

  return candles;
}

// ── Component ────────────────────────────────────────────────────────────────

interface CandlestickChartProps {
  yesPct:     number;
  deadlineTs: number;   // unix seconds
  createdTs?: number;   // unix seconds (fallback: 90 days ago)
  height?:    number;
}

export default function CandlestickChart({
  yesPct,
  deadlineTs,
  createdTs,
  height = 280,
}: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<IChartApi | null>(null);

  const candles = useMemo(
    () =>
      generateCandles(
        yesPct,
        deadlineTs,
        createdTs ?? Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 30
      ),
    [yesPct, deadlineTs, createdTs]
  );

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background:  { type: ColorType.Solid, color: "transparent" },
        textColor:   "rgba(255,255,255,0.3)",
        fontFamily:  "ui-monospace, monospace",
        fontSize:    11,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "rgba(123,110,244,0.5)", labelBackgroundColor: "#7B6EF4" },
        horzLine: { color: "rgba(123,110,244,0.5)", labelBackgroundColor: "#7B6EF4" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.06)",
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor:       "rgba(255,255,255,0.06)",
        timeVisible:       true,
        secondsVisible:    false,
        tickMarkFormatter: (t: number) => {
          const d = new Date(t * 1000);
          return `${d.getMonth() + 1}/${d.getDate()}`;
        },
      },
      handleScroll:  true,
      handleScale:   true,
      width:  containerRef.current.clientWidth,
      height,
    });

    chartRef.current = chart;

    const series = chart.addSeries(CandlestickSeries, {
      upColor:         "#34d399",
      downColor:       "#f87171",
      borderUpColor:   "#34d399",
      borderDownColor: "#f87171",
      wickUpColor:     "#34d399",
      wickDownColor:   "#f87171",
    });

    series.setData(candles);
    chart.timeScale().fitContent();

    // Resize observer
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        chart.applyOptions({ width: entry.contentRect.width });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [candles, height]);

  return <div ref={containerRef} style={{ width: "100%", height }} />;
}
