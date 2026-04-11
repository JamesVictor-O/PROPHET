"use client";

import TradePanel from "../../../_components/trade-panel";

export default function TradeModal({
  isOpen,
  onClose,
  marketAddress,
  marketTitle,
  marketYesPct,
}: {
  isOpen: boolean;
  onClose: () => void;
  marketAddress: string;
  marketTitle: string;
  marketYesPct: number;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-md p-6 rounded-2xl flex flex-col gap-4 relative"
        style={{
          background: "#161616",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
        >
          ✕
        </button>

        <div className="flex flex-col mb-2">
          <span className="text-[10px] uppercase tracking-widest text-[#7B6EF4] font-medium mb-1">
            Quick Trade
          </span>
          <h2 className="text-lg font-bold text-white leading-snug pr-6">
            {marketTitle}
          </h2>
        </div>

        {/* Re-use the highly configured TradePanel block but embedded into this modal window */}
        <div
          style={{
            marginLeft: "-20px",
            marginRight: "-20px",
            marginBottom: "-20px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <TradePanel
            marketAddress={marketAddress}
            marketYesPct={marketYesPct}
          />
        </div>
      </div>
    </div>
  );
}
