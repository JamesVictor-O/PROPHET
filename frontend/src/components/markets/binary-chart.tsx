"use client";

import { Area, AreaChart, ResponsiveContainer, YAxis, XAxis } from "recharts";
import { cn } from "@/lib/utils";

interface BinaryChartProps {
  yesPercent: number;
  noPercent: number;
  className?: string;
}

export function BinaryChart({
  yesPercent,
  noPercent,
  className,
}: BinaryChartProps) {
  // Mock data creates that smooth "wave" look from your reference
  const data = [
    { name: "1", yes: 45, no: 55 },
    { name: "2", yes: 52, no: 48 },
    { name: "3", yes: 48, no: 52 },
    { name: "4", yes: 65, no: 35 },
    { name: "5", yes: yesPercent, no: noPercent },
  ];

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* 1. Clean Label Row */}
      <div className="flex justify-between items-end px-1">
        <div className="space-y-0.5">
          <p className="text-[10px] uppercase tracking-[0.15em] text-emerald-500/80 font-bold">
            Yes
          </p>
          <p className="text-2xl font-light tracking-tight text-white leading-none">
            {yesPercent.toFixed(1)}
            <span className="text-sm opacity-50 ml-0.5">%</span>
          </p>
        </div>
        <div className="space-y-0.5 text-right">
          <p className="text-[10px] uppercase tracking-[0.15em] text-rose-500/80 font-bold">
            No
          </p>
          <p className="text-2xl font-light tracking-tight text-white leading-none">
            {noPercent.toFixed(1)}
            <span className="text-sm opacity-50 ml-0.5">%</span>
          </p>
        </div>
      </div>

      {/* 2. The Slick Chart */}
      <div className="w-full h-[80px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
          >
            <XAxis hide dataKey="name" />
            <YAxis hide domain={[0, 100]} />

            {/* NO Line - Thinner, subtle fill */}
            <Area
              type="monotone"
              dataKey="no"
              stroke="#f43f5e"
              strokeWidth={1.5}
              fill="#f43f5e"
              fillOpacity={0.03} // Very subtle to keep it clean
            />

            {/* YES Line - Thinner, subtle fill */}
            <Area
              type="monotone"
              dataKey="yes"
              stroke="#10b981"
              strokeWidth={1.5}
              fill="#10b981"
              fillOpacity={0.03}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
