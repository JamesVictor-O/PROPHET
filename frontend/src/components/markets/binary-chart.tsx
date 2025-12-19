"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface BinaryChartProps {
  yesPercent: number;
  noPercent: number;
  onYesClick?: () => void;
  onNoClick?: () => void;
  className?: string;
}

export function BinaryChart({
  yesPercent,
  noPercent,
  onYesClick,
  onNoClick,
  className,
}: BinaryChartProps) {
  const [animatedYes, setAnimatedYes] = useState(0);
  const [animatedNo, setAnimatedNo] = useState(0);

  useEffect(() => {
    // Animate the percentages
    const duration = 800; // Animation duration in ms
    const steps = 60;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = Math.min(currentStep / steps, 1);

      // Easing function for smooth animation
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeOutCubic(progress);

      setAnimatedYes(yesPercent * easedProgress);
      setAnimatedNo(noPercent * easedProgress);

      if (currentStep >= steps) {
        clearInterval(interval);
        setAnimatedYes(yesPercent);
        setAnimatedNo(noPercent);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [yesPercent, noPercent]);

  const total = animatedYes + animatedNo;
  const yesWidth = total > 0 ? (animatedYes / total) * 100 : 50;
  const noWidth = total > 0 ? (animatedNo / total) * 100 : 50;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Visual Chart Bar */}
      <div className="relative w-full h-12 sm:h-14 bg-[#0F172A] border border-[#334155] rounded-lg overflow-hidden group">
        {/* Yes Section */}
        <div
          className={cn(
            "absolute left-0 top-0 h-full bg-gradient-to-r from-green-500/80 to-green-600/80 transition-all duration-500 ease-out flex items-center justify-start pl-3 sm:pl-4",
            onYesClick &&
              "cursor-pointer hover:from-green-500 hover:to-green-600"
          )}
          style={{ width: `${yesWidth}%` }}
          onClick={onYesClick}
        >
          {yesWidth > 15 && (
            <span className="text-white font-bold text-xs sm:text-sm drop-shadow-lg">
              YES
            </span>
          )}
        </div>

        {/* No Section */}
        <div
          className={cn(
            "absolute right-0 top-0 h-full bg-gradient-to-l from-red-500/80 to-red-600/80 transition-all duration-500 ease-out flex items-center justify-end pr-3 sm:pr-4",
            onNoClick && "cursor-pointer hover:from-red-500 hover:to-red-600"
          )}
          style={{ width: `${noWidth}%` }}
          onClick={onNoClick}
        >
          {noWidth > 15 && (
            <span className="text-white font-bold text-xs sm:text-sm drop-shadow-lg">
              NO
            </span>
          )}
        </div>

        {/* Divider Line */}
        {yesWidth > 0 && noWidth > 0 && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white/20 z-10 transition-all duration-500"
            style={{ left: `${yesWidth}%` }}
          />
        )}

        {/* Percentage Labels (shown when sections are too small for text) */}
        {yesWidth <= 15 && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2 z-20">
            <span className="text-green-400 font-bold text-xs sm:text-sm drop-shadow-lg">
              YES {animatedYes.toFixed(1)}%
            </span>
          </div>
        )}
        {noWidth <= 15 && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20">
            <span className="text-red-400 font-bold text-xs sm:text-sm drop-shadow-lg">
              NO {animatedNo.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
