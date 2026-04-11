"use client";

import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, AiBrain01Icon } from "@hugeicons/core-free-icons";
import Image from "next/image";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const SOCIAL = [
  { label: "X (Twitter)", href: "https://x.com/prophet" },
  { label: "Discord", href: "https://discord.gg/prophet" },
  { label: "GitHub", href: "https://github.com/prophet" },
];

const PROBLEMS = [
  {
    number: "01",
    title: "Centralization",
    body: "Existing prediction markets arbitrarily censor or filter what you can trade. We believe any verifiable event should be tradable.",
  },
  {
    number: "02",
    title: "Front-Running",
    body: "Positions on current protocols are fully public. The moment you place a large bet, sophisticated players monitor the mempool to trade against you.",
  },
  {
    number: "03",
    title: "Cold Liquidity",
    body: "Anyone can create a market, but nobody provides liquidity. Without market makers, new markets sit with zero volume and die out before gaining traction.",
  },
];

const PIPELINE = [
  {
    step: "01",
    label: "Permissionless Creation",
    desc: "Any user, any question. A lightweight LLM classifies if your event is unambiguous and resolvable. Approved markets deploy instantly via factory contracts.",
  },
  {
    step: "02",
    label: "Continuous Liquidity",
    desc: "Our Agent ID-powered Market Maker automatically seeds initial liquidity and continually adjusts pricing based on 0G Compute insights and aggregate market activity.",
  },
  {
    step: "03",
    label: "Sealed Inference",
    desc: "When you place a position, it's encrypted inside a Trusted Execution Environment (TEE). We eliminate front-running and MEV entirely. Your moves belong to you.",
  },
  {
    step: "04",
    label: "AI Oracle Resolution",
    desc: "At market deadline, the AI Oracle reads trusted sources to resolve outcomes. Full reasoning chains are stored permanently in 0G Storage — fully verifiable.",
  },
];

const CHAIN_STEPS = [
  {
    label: "0G Chain (EVM)",
    sub: "11k TPS",
    note: "Lightning-fast settlement",
  },
  {
    label: "0G Compute",
    sub: "LLM Execution",
    note: "Powers our AI Oracle and Market Maker agents",
  },
  {
    label: "0G Storage",
    sub: "Decentralized Memory",
    note: "Permanent audit log of all market definitions and AI decisions",
  },
  {
    label: "0G TEE",
    sub: "Confidential Compute",
    note: "Locks user commitments; releases upon resolution",
  },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <div
      className="relative flex flex-col min-h-screen overflow-x-hidden"
      style={{
        background: "#161616",
        fontFamily: "var(--font-barlow, sans-serif)",
      }}
    >
      {/* Top glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{
          height: 600,
          background:
            "radial-gradient(ellipse 60% 40% at 50% -10%, rgba(123,110,244,0.12) 0%, transparent 70%)",
          zIndex: 0,
        }}
      />

      {/* ── TOP BAR ───────────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between px-8 pt-7">
        <div className="flex items-center gap-2">
          {/* Logo Placeholder */}
          <div className="size-6 bg-gradient-to-tr from-purple-600 to-blue-500 rounded flex items-center justify-center overflow-hidden">
            <span className="text-[12px] font-bold text-white">P</span>
          </div>
          <span className="text-[16px] font-semibold tracking-wide text-white">
            Prophet
          </span>
        </div>
        <div className="flex items-center gap-4">
          <ConnectButton />
        </div>
      </div>

      {/* ── HERO ──────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[85vh] gap-7 px-6 text-center">
        <div className="flex flex-col items-center gap-4 max-w-2xl">
          <h1 className="text-[52px] font-bold leading-[1.05] text-white tracking-tight">
            Trade smarter. <br />
            <span style={{ color: "rgba(255,255,255,0.25)" }}>
              Privately. Autonomously. Verifiably.
            </span>
          </h1>
          <p
            className="text-[16px] leading-relaxed mt-4"
            style={{ color: "rgba(255,255,255,0.35)", maxWidth: 500 }}
          >
            The AI-Native Prediction Market. No centralized authorities. No
            human resolution committees. No front-running.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 mt-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="group flex items-center gap-2.5 px-8 py-4 text-[15px] font-bold transition-all"
            style={{
              background: "rgba(123,110,244,0.9)",
              color: "#0a0a0a",
              clipPath:
                "polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "#7B6EF4")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background =
                "rgba(123,110,244,0.9)")
            }
          >
            Launch Market
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={14}
              color="#0a0a0a"
              strokeWidth={2.5}
            />
          </button>
        </div>

        <div className="flex items-center gap-4 mt-8" style={{ width: 320 }}>
          <div
            className="flex-1 h-px"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />
          <span
            className="text-[10px] uppercase tracking-widest"
            style={{ color: "rgba(248, 244, 244, 0.87)" }}
          >
            100% Autonomous
          </span>
          <span
            className="text-[10px] font-medium uppercase tracking-widest"
            style={{ color: "rgba(123,110,244,0.85)" }}
          >
            Built on 0G Labs
          </span>
          <div
            className="flex-1 h-px"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />
        </div>
      </div>

      {/* ── SECTION: THE PROBLEM ──────────────────────────── */}
      <section
        className="relative z-10 px-8 py-28"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-center text-center gap-3 mb-16">
            <span
              className="text-[10px] uppercase tracking-widest font-medium"
              style={{ color: "#7B6EF4" }}
            >
              The Flaws
            </span>
            <h2 className="text-[32px] font-bold text-white leading-tight">
              Prediction markets are broken.
              <br />
              <span style={{ color: "rgba(255,255,255,0.3)" }}>
                We fixed the infrastructure.
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PROBLEMS.map(({ number, title, body }) => (
              <div
                key={number}
                className="flex flex-col gap-4 p-6 transition-all"
                style={{
                  border: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.02)",
                  clipPath:
                    "polygon(0 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%)",
                }}
              >
                <span
                  className="text-[11px] font-bold tracking-widest"
                  style={{ color: "rgba(123,110,244,0.5)" }}
                >
                  {number}
                </span>
                <h3 className="text-[16px] font-semibold text-white">
                  {title}
                </h3>
                <p
                  className="text-[13px] leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  {body}
                </p>
                <div
                  className="mt-auto h-px"
                  style={{ background: "rgba(123,110,244,0.2)" }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION: THE PIPELINE ─────────────────────────── */}
      <section
        className="relative z-10 px-8 py-28"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        {/* section glow */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0"
          style={{
            height: 400,
            background:
              "radial-gradient(ellipse 50% 30% at 50% 0%, rgba(123,110,244,0.07) 0%, transparent 70%)",
          }}
        />

        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-center text-center gap-3 mb-16">
            <span
              className="text-[10px] uppercase tracking-widest font-medium"
              style={{ color: "#7B6EF4" }}
            >
              The Architecture
            </span>
            <h2 className="text-[32px] font-bold text-white leading-tight">
              An agentic network.
              <br />
              <span style={{ color: "rgba(255,255,255,0.3)" }}>
                Working seamlessly on 0G Labs.
              </span>
            </h2>
            <p
              className="text-[14px] leading-relaxed max-w-md"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              A fully automated pipeline manages everything from the moment you
              initiate a market to the sub-second settlement of winnings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {PIPELINE.map(({ step, label, desc }, i) => (
              <div key={step} className="flex flex-col gap-3">
                {/* connector line */}
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center w-8 h-8 shrink-0"
                    style={{
                      background: "rgba(123,110,244,0.12)",
                      border: "1px solid rgba(123,110,244,0.3)",
                      clipPath:
                        "polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)",
                    }}
                  >
                    <span
                      className="text-[10px] font-bold"
                      style={{ color: "#7B6EF4" }}
                    >
                      {step}
                    </span>
                  </div>
                  {i < PIPELINE.length - 1 && (
                    <div
                      className="hidden md:block flex-1 h-px"
                      style={{ background: "rgba(255,255,255,0.08)" }}
                    />
                  )}
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  <span className="text-[14px] font-semibold text-white">
                    {label}
                  </span>
                  <p
                    className="text-[12px] leading-relaxed"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Sample brief preview */}
          <div
            className="mt-14 p-6"
            style={{
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.015)",
              fontFamily: "monospace",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: "#7B6EF4" }}
              />
              <span
                className="text-[10px] uppercase tracking-widest"
                style={{ color: "rgba(255,255,255,0.2)" }}
              >
                Sample Oracle Resolution — 0G Compute
              </span>
            </div>
            <div
              className="flex flex-col gap-2"
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: 13,
                lineHeight: 1.7,
              }}
            >
              <div>
                <span style={{ color: "rgba(255,255,255,0.2)" }}>MARKET </span>
                <span style={{ color: "rgba(255,255,255,0.8)" }}>
                  Will an autonomous agent write the best 0G hackathon project?
                </span>
              </div>
              <div
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                  paddingTop: 8,
                }}
              >
                <span style={{ color: "rgba(255,255,255,0.2)" }}>SOURCES </span>
                [GitHub API, 0G Analytics, Agent Logs]
              </div>
              <div>
                <span style={{ color: "rgba(255,255,255,0.2)" }}>OUTCOME </span>
                <span style={{ color: "#34d399", fontWeight: "bold" }}>
                  YES (Confidence: 99.9%)
                </span>
              </div>
              <div
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                  paddingTop: 8,
                }}
              >
                <span style={{ color: "rgba(255,255,255,0.2)" }}>
                  REASONING{" "}
                </span>
                <div
                  className="mt-1 flex flex-col gap-1 pl-4"
                  style={{ borderLeft: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div>
                    Evaluating sources based on pre-approved registry...
                  </div>
                  <div>
                    <span style={{ color: "rgba(123,110,244,0.7)" }}>
                      [EVIDENCE]
                    </span>{" "}
                    GitHub commit history shows 100% automated agentic
                    contributions.
                  </div>
                  <div>
                    <span style={{ color: "rgba(123,110,244,0.7)" }}>
                      [VERDICT LOGGED TO 0G STORAGE]
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION: EXECUTION LAYER ──────────────────────── */}
      <section
        className="relative z-10 px-8 py-28"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-center text-center gap-3 mb-16">
            <span
              className="text-[10px] uppercase tracking-widest font-medium"
              style={{ color: "#7B6EF4" }}
            >
              The Engine
            </span>
            <h2 className="text-[32px] font-bold text-white leading-tight">
              Prophet could not exist
              <br />
              <span style={{ color: "rgba(255,255,255,0.3)" }}>
                on any other chain.
              </span>
            </h2>
            <p
              className="text-[14px] leading-relaxed max-w-md"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              0G Labs provides the 5 pillars essential to a true agentic
              prediction market. We leverage every piece of the tech stack to
              decentralize and secure your predictions.
            </p>
          </div>

          {/* Chain flow */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 mb-14">
            {CHAIN_STEPS.map(({ label, sub, note }, i) => (
              <div key={label} className="flex items-center gap-3">
                <div
                  className="flex flex-col gap-1 px-5 py-4 text-center min-h-[140px] justify-center"
                  style={{
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.02)",
                    minWidth: 160,
                    maxWidth: 160,
                    clipPath:
                      "polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)",
                  }}
                >
                  <span className="text-[13px] font-semibold text-white">
                    {label}
                  </span>
                  <span
                    className="text-[10px]"
                    style={{ color: "rgba(123,110,244,0.6)" }}
                  >
                    {sub}
                  </span>
                  <span
                    className="text-[10px] mt-2"
                    style={{ color: "rgba(255,255,255,0.2)" }}
                  >
                    {note}
                  </span>
                </div>
                {i < CHAIN_STEPS.length - 1 && (
                  <div className="flex flex-col items-center gap-0.5 shrink-0">
                    <div
                      className="hidden md:block w-8 h-px"
                      style={{ background: "rgba(123,110,244,0.4)" }}
                    />
                    <span
                      className="hidden md:block text-[8px]"
                      style={{ color: "rgba(123,110,244,0.4)" }}
                    >
                      ▶
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-px"
            style={{
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.06)",
            }}
          >
            {[
              { value: "0", label: "Human Intervention" },
              { value: "0", label: "Front Running" },
              { value: "100%", label: "Verifiable" },
              { value: "sub-1s", label: "Finality" },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="flex flex-col items-center justify-center gap-1 py-8"
                style={{ background: "#161616" }}
              >
                <span className="text-[28px] font-bold text-white">
                  {value}
                </span>
                <span
                  className="text-[11px]"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION: FINAL CTA ────────────────────────────── */}
      <section
        className="relative z-10 px-8 py-28 overflow-hidden"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 50% 60% at 50% 100%, rgba(123,110,244,0.08) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-2xl mx-auto flex flex-col items-center text-center gap-7">
          <h2 className="text-[36px] font-bold text-white leading-tight">
            Stop giving up your edge.
          </h2>
          <p
            className="text-[15px] leading-relaxed"
            style={{ color: "rgba(255,255,255,0.35)", maxWidth: 450 }}
          >
            Put your knowledge to the test on a market built for deep liquidity,
            private positioning, and fast execution.
          </p>
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2.5 px-8 py-4 text-[14px] font-semibold transition-all"
              style={{
                background: "rgba(123,110,244,0.9)",
                color: "#0a0a0a",
                clipPath:
                  "polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.background = "#7B6EF4")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.background =
                  "rgba(123,110,244,0.9)")
              }
            >
              Enter the App
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={13}
                color="#0a0a0a"
                strokeWidth={2}
              />
            </button>
            <span
              className="text-[11px]"
              style={{ color: "rgba(255,255,255,0.18)" }}
            >
              No credit card required · Demo on Galileo Testnet
            </span>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <div
        className="relative z-10 flex items-center justify-between px-8 pb-7 pt-5"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <span
          className="text-[11px]"
          style={{ color: "rgba(255,255,255,0.15)" }}
        >
          © 2026 Prophet
        </span>
        <div className="flex items-center gap-5">
          {SOCIAL.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] transition-colors"
              style={{ color: "rgba(255,255,255,0.2)" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.color =
                  "rgba(255,255,255,0.6)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.color =
                  "rgba(255,255,255,0.2)")
              }
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
