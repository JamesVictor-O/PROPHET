"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon,
  BarChartIcon,
  PieChart01Icon,
  Robot01Icon,
  Settings01Icon,
  Tick01Icon,
  Copy01Icon,
  Analytics01Icon,
} from "@hugeicons/core-free-icons";

const NAV = [
  { label: "Overview", href: "/dashboard", icon: Home01Icon },
  { label: "Markets", href: "/markets", icon: BarChartIcon },
  { label: "Portfolio", href: "/portfolio", icon: PieChart01Icon },
  { label: "Oracle Agent", href: "/oracle", icon: Robot01Icon },
  { label: "Liquidity", href: "/liquidity", icon: Analytics01Icon },
  { label: "Settings", href: "/settings", icon: Settings01Icon },
];

const ACCENT = "#7B6EF4";

function truncate(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function UserCard() {
  const [copied, setCopied] = useState(false);
  const displayAddress = "0x7F2...9B4"; // Mock address
  const avatarChar = "0";

  function copy() {
    navigator.clipboard.writeText("0x7F2abcdef12345678909B4");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative overflow-hidden rounded-xl p-px mt-auto">
      {/* Rotating gradient border */}
      <div
        className="absolute"
        style={{
          inset: "-60%",
          background:
            "conic-gradient(from 0deg, transparent 0%, transparent 40%, #7B6EF4 55%, #a78bfa 65%, transparent 80%)",
          animation: "gradient-spin 4s linear infinite",
        }}
      />

      <div
        className="relative flex flex-col gap-2 p-2.5 rounded-xl"
        style={{ background: "#1a1a1a" }}
      >
        {/* Top row: avatar + identity */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[12px] font-bold"
            style={{
              background: `linear-gradient(135deg, ${ACCENT}, #a78bfa)`,
              color: "white",
            }}
          >
            {avatarChar}
          </div>
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-white leading-none truncate">
              Connected
            </span>
            <span className="text-[10px] text-gray-400">0G Chain</span>
          </div>
        </div>

        {/* Wallet address row */}
        <div
          className="flex items-center justify-between px-2 py-1.5"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <span
            className="text-[14px] font-mono"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            {displayAddress}
          </span>
          <button
            onClick={copy}
            className="flex items-center justify-center transition-opacity hover:opacity-80 shrink-0 ml-1 cursor-pointer"
          >
            <HugeiconsIcon
              icon={copied ? Tick01Icon : Copy01Icon}
              size={14}
              color={copied ? "#34d399" : "rgba(255,255,255,0.25)"}
              strokeWidth={1.5}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex flex-col w-[210px] h-screen sticky top-0 shrink-0 overflow-hidden"
      style={{
        background: "#1a1a1a",
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Logo */}
      <div className="px-5 pt-5 pb-5 flex items-center gap-3">
        <div className="size-6 bg-gradient-to-tr from-purple-600 to-blue-500 rounded flex items-center justify-center overflow-hidden">
          <span className="text-[13px] font-bold text-white">P</span>
        </div>
        <span className="text-[16px] font-bold tracking-wide text-white">
          Prophet
        </span>
      </div>

      <div
        className="mb-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      />

      {/* Nav */}
      <nav className="flex-1 px-3 flex flex-col gap-1">
        {NAV.map(({ label, href, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-[9px] rounded-md transition-colors"
              style={{
                background: active ? "rgba(255,255,255,0.06)" : "transparent",
                color: active ? "#fff" : "rgba(255,255,255,0.35)",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(255,255,255,0.03)";
                  (e.currentTarget as HTMLElement).style.color =
                    "rgba(255,255,255,0.6)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background =
                    "transparent";
                  (e.currentTarget as HTMLElement).style.color =
                    "rgba(255,255,255,0.35)";
                }
              }}
            >
              <HugeiconsIcon
                icon={icon}
                size={16}
                strokeWidth={active ? 2 : 1.5}
                color={active ? ACCENT : "currentColor"}
              />
              <span className="text-[14px] font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User card at the bottom */}
      <div className="px-3 pb-4">
        <UserCard />
      </div>
    </aside>
  );
}
