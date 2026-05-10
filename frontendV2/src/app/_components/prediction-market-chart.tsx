"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";

interface PriceHistoryEntry {
  yesPrice: number;
  noPrice: number;
  lastUpdated: number;
  timestamp: number;
}

interface PredictionMarketChartProps {
  marketAddress: `0x${string}`;
  yesPct: number;
  isPriceLive: boolean;
  range: string;
  height?: number;
}

interface ChartPoint {
  timestamp: number;
  yesPrice: number;
  noPrice: number;
}

interface SvgPoint {
  x: number;
  y: number;
  value: number;
}

const RANGE_MS: Record<string, number> = {
  "1W": 7 * 24 * 60 * 60 * 1000,
  "1M": 30 * 24 * 60 * 60 * 1000,
  "3M": 90 * 24 * 60 * 60 * 1000,
};

const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 320;
const PLOT = {
  left: 22,
  right: 72,
  top: 70,
  bottom: 46,
};

function clampPrice(price: number): number {
  return Math.max(0, Math.min(100, price));
}

function centsToDollars(cents: number): number {
  return Math.max(0, Math.min(1, cents / 100));
}

function percentLabel(value: number): string {
  return `${Math.round(clampPrice(value))}%`;
}

function dollarLabel(value: number): string {
  return `$${centsToDollars(value).toFixed(2)}`;
}

function formatInspectionTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildFallbackHistory(yesPct: number): PriceHistoryEntry[] {
  const now = Date.now();
  return [
    {
      yesPrice: yesPct,
      noPrice: 100 - yesPct,
      lastUpdated: now - 60 * 60 * 1000,
      timestamp: now - 60 * 60 * 1000,
    },
    {
      yesPrice: yesPct,
      noPrice: 100 - yesPct,
      lastUpdated: now,
      timestamp: now,
    },
  ];
}

function formatAxisTime(timestamp: number, range: string): string {
  const date = new Date(timestamp);
  if (range === "1W") {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }

  if (range === "1M" || range === "3M") {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }

  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function makeLinePath(points: SvgPoint[]): string {
  if (points.length === 0) return "";

  const [first, ...rest] = points;
  const commands = [`M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`];

  for (const point of rest) {
    commands.push(`H ${point.x.toFixed(2)}`);
    commands.push(`V ${point.y.toFixed(2)}`);
  }

  return commands.join(" ");
}

function plotPoints(entries: ChartPoint[], side: "yes" | "no", maxAxis: number): SvgPoint[] {
  const plotWidth = VIEWBOX_WIDTH - PLOT.left - PLOT.right;
  const plotHeight = VIEWBOX_HEIGHT - PLOT.top - PLOT.bottom;
  const firstTime = entries[0]?.timestamp ?? Date.now();
  const lastTime = entries.at(-1)?.timestamp ?? firstTime + 1;
  const duration = Math.max(1, lastTime - firstTime);

  return entries.map((entry) => {
    const value = clampPrice(side === "yes" ? entry.yesPrice : entry.noPrice);
    const x = PLOT.left + ((entry.timestamp - firstTime) / duration) * plotWidth;
    const y = PLOT.top + ((maxAxis - value) / maxAxis) * plotHeight;

    return { x, y, value };
  });
}

function makeAxisLabels(entries: ChartPoint[], range: string) {
  const first = entries[0]?.timestamp ?? Date.now();
  const last = entries.at(-1)?.timestamp ?? first;
  const duration = Math.max(1, last - first);

  return Array.from({ length: 5 }, (_, index) => {
    const ratio = index / 4;
    const timestamp = first + duration * ratio;
    const x = PLOT.left + (VIEWBOX_WIDTH - PLOT.left - PLOT.right) * ratio;
    const anchor = index === 0 ? "start" : index === 4 ? "end" : "middle";

    return { x, label: formatAxisTime(timestamp, range), anchor };
  }) satisfies Array<{
    x: number;
    label: string;
    anchor: "start" | "middle" | "end";
  }>;
}

function clampLabelY(y: number): number {
  return Math.max(PLOT.top + 12, Math.min(VIEWBOX_HEIGHT - PLOT.bottom - 10, y));
}

function makeYAxisTicks(maxAxis: number): number[] {
  return Array.from({ length: 5 }, (_, index) => Math.round((maxAxis / 4) * index));
}

function findNearestPointIndex(points: SvgPoint[], x: number): number | null {
  if (points.length === 0) return null;

  let nearestIndex = 0;
  let nearestDistance = Math.abs(points[0].x - x);

  for (let index = 1; index < points.length; index += 1) {
    const distance = Math.abs(points[index].x - x);
    if (distance < nearestDistance) {
      nearestIndex = index;
      nearestDistance = distance;
    }
  }

  return nearestIndex;
}

function tooltipPlacement(x: number, y: number) {
  const width = 236;
  const height = 102;
  const left = Math.min(Math.max(PLOT.left + 4, x + 16), VIEWBOX_WIDTH - PLOT.right - width - 8);
  const top = Math.min(
    Math.max(PLOT.top + 8, y - height / 2),
    VIEWBOX_HEIGHT - PLOT.bottom - height - 8
  );

  return { left, top, width, height };
}

export default function PredictionMarketChart({
  marketAddress,
  yesPct,
  isPriceLive,
  range,
  height = 280,
}: PredictionMarketChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [history, setHistory] = useState<PriceHistoryEntry[]>([]);
  const [browserHistory, setBrowserHistory] = useState<PriceHistoryEntry[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const [inspectedIndex, setInspectedIndex] = useState<number | null>(null);
  const [isInspectionLocked, setIsInspectionLocked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      try {
        const res = await fetch(`/api/prices?market=${marketAddress}&history=1`);
        if (!res.ok) {
          if (!cancelled) setLoadFailed(true);
          return;
        }

        const data = (await res.json()) as { history?: PriceHistoryEntry[] };
        if (cancelled) return;

        setHistory(Array.isArray(data.history) ? data.history : []);
        setLoadFailed(false);
      } catch {
        if (!cancelled) setLoadFailed(true);
      }
    }

    void loadHistory();
    const id = setInterval(() => {
      void loadHistory();
    }, 30_000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [marketAddress]);

  useEffect(() => {
    try {
      const key = `prophet-price-history:${marketAddress.toLowerCase()}`;
      const raw = window.localStorage.getItem(key);
      const parsed = raw ? (JSON.parse(raw) as PriceHistoryEntry[]) : [];

      setBrowserHistory(
        Array.isArray(parsed)
          ? parsed.filter((entry) =>
              typeof entry.yesPrice === "number" &&
              typeof entry.noPrice === "number" &&
              typeof entry.timestamp === "number"
            ).slice(-100)
          : []
      );
    } catch {
      setBrowserHistory([]);
    }
  }, [marketAddress]);

  useEffect(() => {
    if (!isPriceLive) return;

    setBrowserHistory((current) => {
      const now = Date.now();
      const entry = {
        yesPrice: yesPct,
        noPrice: 100 - yesPct,
        lastUpdated: now,
        timestamp: now,
      };
      const last = current.at(-1);

      if (
        last &&
        Math.round(last.yesPrice) === Math.round(entry.yesPrice) &&
        Math.round(last.noPrice) === Math.round(entry.noPrice) &&
        now - last.timestamp < 60_000
      ) {
        return current;
      }

      const next = [...current, entry].slice(-100);
      try {
        window.localStorage.setItem(
          `prophet-price-history:${marketAddress.toLowerCase()}`,
          JSON.stringify(next)
        );
      } catch {
        // Local storage is only a visual history helper.
      }

      return next;
    });
  }, [isPriceLive, marketAddress, yesPct]);

  const visibleHistory = useMemo(() => {
    const base = [...history, ...browserHistory];
    const sortedBase = base
      .sort((a, b) => a.timestamp - b.timestamp)
      .filter((entry, index, entries) => {
        const previous = entries[index - 1];
        if (!previous) return true;
        return (
          previous.timestamp !== entry.timestamp ||
          previous.yesPrice !== entry.yesPrice ||
          previous.noPrice !== entry.noPrice
        );
      });
    const sorted = sortedBase.length >= 2 ? sortedBase : buildFallbackHistory(yesPct);
    const rangeMs = RANGE_MS[range];

    if (!rangeMs) return sorted;

    const cutoff = Date.now() - rangeMs;
    const filtered = sorted.filter((entry) => entry.timestamp >= cutoff);

    return filtered.length >= 2 ? filtered : sorted.slice(-2);
  }, [browserHistory, history, range, yesPct]);

  const chartData = useMemo<ChartPoint[]>(
    () =>
      visibleHistory.map((entry) => ({
        timestamp: entry.timestamp,
        yesPrice: clampPrice(entry.yesPrice),
        noPrice: clampPrice(entry.noPrice),
      })),
    [visibleHistory]
  );

  const maxAxis = useMemo(() => {
    const highest = Math.max(
      60,
      ...chartData.map((entry) => Math.max(entry.yesPrice, entry.noPrice))
    );
    return Math.min(100, Math.ceil(highest / 10) * 10);
  }, [chartData]);
  const yesPoints = useMemo(() => plotPoints(chartData, "yes", maxAxis), [chartData, maxAxis]);
  const noPoints = useMemo(() => plotPoints(chartData, "no", maxAxis), [chartData, maxAxis]);
  const yesPath = useMemo(() => makeLinePath(yesPoints), [yesPoints]);
  const noPath = useMemo(() => makeLinePath(noPoints), [noPoints]);
  const axisLabels = useMemo(() => makeAxisLabels(chartData, range), [chartData, range]);
  const lastYes = yesPoints.at(-1) ?? { x: 0, y: 0, value: yesPct };
  const lastNo = noPoints.at(-1) ?? { x: 0, y: 0, value: 100 - yesPct };
  const inspectedPoint = inspectedIndex !== null
    ? {
        entry: chartData[inspectedIndex],
        yes: yesPoints[inspectedIndex],
        no: noPoints[inspectedIndex],
      }
    : null;
  const tooltip = inspectedPoint
    ? tooltipPlacement(
        inspectedPoint.yes.x,
        Math.min(inspectedPoint.yes.y, inspectedPoint.no.y)
      )
    : null;
  const yAxisTicks = useMemo(() => makeYAxisTicks(maxAxis), [maxAxis]);
  const endpointLabels = useMemo(
    () => ({
      yesY: clampLabelY(lastYes.y),
      noY: clampLabelY(lastNo.y),
    }),
    [lastNo.y, lastYes.y]
  );
  const chartNote = loadFailed
    ? "Could not load stored history. Showing current quote."
    : isPriceLive && history.length + browserHistory.length < 2
      ? "Collecting price history from live trades."
      : !isPriceLive
        ? "Awaiting live market-maker quote."
        : null;

  const updateInspectionFromPointer = (
    event: MouseEvent<SVGSVGElement> | PointerEvent<SVGSVGElement>
  ) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const pointerX = ((event.clientX - rect.left) / rect.width) * VIEWBOX_WIDTH;
    setInspectedIndex(findNearestPointIndex(yesPoints, pointerX));
  };

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-[#0d1117]"
      style={{ minHeight: height }}
    >
      <div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-white">
          <span className="h-2.5 w-2.5 rounded-full bg-[#34d399]" />
          <span>YES</span>
          <span className="font-mono text-white/48">{percentLabel(yesPct)}</span>
        </div>
        <div className="flex items-center gap-2 text-[13px] font-semibold text-white">
          <span className="h-2.5 w-2.5 rounded-full bg-[#fb7185]" />
          <span>NO</span>
          <span className="font-mono text-white/48">{percentLabel(100 - yesPct)}</span>
        </div>
      </div>

      <svg
        aria-label={`YES price is ${dollarLabel(yesPct)} and NO price is ${dollarLabel(100 - yesPct)}`}
        className="h-full w-full"
        onClick={(event) => {
          updateInspectionFromPointer(event);
          setIsInspectionLocked(true);
        }}
        onPointerLeave={() => {
          if (!isInspectionLocked) setInspectedIndex(null);
        }}
        onPointerMove={(event) => {
          if (!isInspectionLocked) updateInspectionFromPointer(event);
        }}
        preserveAspectRatio="none"
        ref={svgRef}
        role="img"
        style={{ height }}
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      >
        <rect width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} fill="transparent" />

        {yAxisTicks.map((value) => {
          const plotHeight = VIEWBOX_HEIGHT - PLOT.top - PLOT.bottom;
          const y = PLOT.top + ((maxAxis - value) / maxAxis) * plotHeight;

          return (
            <g key={value}>
              <line
                stroke="rgba(255,255,255,0.07)"
                strokeWidth="1"
                x1={PLOT.left}
                x2={VIEWBOX_WIDTH - PLOT.right}
                y1={y}
                y2={y}
              />
              <text
                fill="rgba(255,255,255,0.48)"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
                fontSize="13"
                textAnchor="start"
                x={VIEWBOX_WIDTH - PLOT.right + 10}
                y={y + 4}
              >
                {value}%
              </text>
            </g>
          );
        })}

        <path d={noPath} fill="none" stroke="#fb7185" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
        <path d={yesPath} fill="none" stroke="#34d399" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />

        {inspectedPoint && tooltip && (
          <g>
            <line
              stroke="rgba(255,255,255,0.56)"
              strokeDasharray="5 6"
              strokeWidth="1.2"
              x1={inspectedPoint.yes.x}
              x2={inspectedPoint.yes.x}
              y1={PLOT.top}
              y2={VIEWBOX_HEIGHT - PLOT.bottom}
            />
            <circle cx={inspectedPoint.no.x} cy={inspectedPoint.no.y} fill="#fb7185" r="6" />
            <circle cx={inspectedPoint.yes.x} cy={inspectedPoint.yes.y} fill="#34d399" r="6" />
            <rect
              fill="#10151d"
              height={tooltip.height}
              rx="7"
              stroke="rgba(255,255,255,0.12)"
              width={tooltip.width}
              x={tooltip.left}
              y={tooltip.top}
            />
            <circle cx={tooltip.left + 18} cy={tooltip.top + 27} fill="#34d399" r="4.5" />
            <text
              fill="white"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
              fontSize="14"
              fontWeight="600"
              x={tooltip.left + 31}
              y={tooltip.top + 32}
            >
              YES
            </text>
            <text
              fill="white"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
              fontSize="14"
              fontWeight="700"
              textAnchor="end"
              x={tooltip.left + tooltip.width - 16}
              y={tooltip.top + 32}
            >
              {percentLabel(inspectedPoint.entry.yesPrice)}
            </text>
            <circle cx={tooltip.left + 18} cy={tooltip.top + 56} fill="#fb7185" r="4.5" />
            <text
              fill="white"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
              fontSize="14"
              fontWeight="600"
              x={tooltip.left + 31}
              y={tooltip.top + 61}
            >
              NO
            </text>
            <text
              fill="white"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
              fontSize="14"
              fontWeight="700"
              textAnchor="end"
              x={tooltip.left + tooltip.width - 16}
              y={tooltip.top + 61}
            >
              {percentLabel(inspectedPoint.entry.noPrice)}
            </text>
            <text
              fill="rgba(255,255,255,0.56)"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
              fontSize="12"
              textAnchor="middle"
              x={tooltip.left + tooltip.width / 2}
              y={tooltip.top + 88}
            >
              {formatInspectionTime(inspectedPoint.entry.timestamp)}
            </text>
          </g>
        )}

        <circle cx={lastNo.x} cy={lastNo.y} fill="rgba(251,113,133,0.15)" r="13" />
        <circle cx={lastYes.x} cy={lastYes.y} fill="rgba(52,211,153,0.15)" r="13" />
        <circle cx={lastNo.x} cy={lastNo.y} fill="#fb7185" r="4.5" />
        <circle cx={lastYes.x} cy={lastYes.y} fill="#34d399" r="4.5" />

        <text
          fill="#fb7185"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
          fontSize="13"
          fontWeight="600"
          x={VIEWBOX_WIDTH - PLOT.right + 10}
          y={endpointLabels.noY + 5}
        >
          {percentLabel(lastNo.value)}
        </text>

        <text
          fill="#34d399"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
          fontSize="13"
          fontWeight="600"
          x={VIEWBOX_WIDTH - PLOT.right + 10}
          y={endpointLabels.yesY + 5}
        >
          {percentLabel(lastYes.value)}
        </text>

        {axisLabels.map((item) => (
          <text
            fill="rgba(255,255,255,0.48)"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
            fontSize="12"
            key={`${item.x}-${item.label}`}
            textAnchor={item.anchor}
            x={item.x}
            y={VIEWBOX_HEIGHT - 18}
          >
            {item.label}
          </text>
        ))}
      </svg>

      <div className="pointer-events-none absolute right-4 top-4 flex items-center gap-3 text-[11px] text-white/42">
        <span className="font-mono text-emerald-200">YES {dollarLabel(yesPct)}</span>
        <span className="h-1 w-1 rounded-full bg-white/25" />
        <span className="font-mono text-rose-200">NO {dollarLabel(100 - yesPct)}</span>
      </div>

      {chartNote && (
        <div className="pointer-events-none absolute bottom-4 left-4 max-w-[17rem] rounded border border-white/10 bg-[#161616]/95 px-2.5 py-1.5 text-[10px] leading-4 text-white/42">
          {chartNote}
        </div>
      )}
    </div>
  );
}
