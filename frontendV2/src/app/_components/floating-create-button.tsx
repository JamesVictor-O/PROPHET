"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const CreateMarketModal = dynamic(
  () => import("../(dashboard)/_components/create-market-modal"),
  { ssr: false }
);

export default function FloatingCreateButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Create Market"
        className="fixed bottom-8 right-8 z-50 flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm shadow-lg transition-all hover:opacity-90 active:scale-95"
        style={{ background: "#7B6EF4", color: "#0a0a0a" }}
      >
        <span className="text-xl leading-none">+</span>
        Create Market
      </button>

      <CreateMarketModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
