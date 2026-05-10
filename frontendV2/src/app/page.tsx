"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  Database01Icon,
  CpuIcon,
  Link04Icon,
  Shield01Icon,
  TradeUpIcon,
} from "@hugeicons/core-free-icons";

const ConnectButton = dynamic(
  () => import("@rainbow-me/rainbowkit").then((mod) => mod.ConnectButton),
  { ssr: false },
);

const HERO_TICKS = [
  { t: "09:41", yes: "0.50", no: "0.50", note: "Market initialized" },
  { t: "09:44", yes: "0.57", no: "0.43", note: "YES pressure" },
  { t: "09:49", yes: "0.42", no: "0.58", note: "NO rebalance" },
  { t: "09:52", yes: "0.68", no: "0.32", note: "Liquidity deepened" },
];

const SYSTEM_FLOW = [
  ["01", "Validate", "0G Compute scores the market question and sources."],
  ["02", "Seed", "Protocol liquidity initializes a neutral YES/NO AMM."],
  ["03", "Trade", "Users move prices through real reserve imbalance."],
  ["04", "Resolve", "The oracle posts verdict and reasoning to 0G Storage."],
  ["05", "Recycle", "Remaining liquidity and fees return to the pool."],
];

const OG_MODULES = [
  {
    icon: Link04Icon,
    title: "0G Chain",
    label: "Execution",
    body: "Market creation, AMM trades, settlement, redemption, and liquidity return live on-chain.",
    signal: "sub-second settlement surface",
  },
  {
    icon: CpuIcon,
    title: "0G Compute",
    label: "Intelligence",
    body: "Agents validate questions, evaluate risk, reason through outcomes, and operate market infrastructure.",
    signal: "TEE-aware inference path",
  },
  {
    icon: Database01Icon,
    title: "0G Storage",
    label: "Memory",
    body: "Oracle reasoning, metadata, evidence packages, and agent state become durable audit trails.",
    signal: "permanent market record",
  },
];

const LEDGER_ROWS = [
  ["source", "UEFA official report", "stored"],
  ["compute", "oracle verdict: YES", "attested"],
  ["hash", "0xf08d...7584", "on-chain"],
  ["status", "challenge window", "closed"],
];

const AMM_ROWS = [
  ["YES bought", "$23.00", "$0.50", "$0.64"],
  ["NO sold", "14.20", "$0.36", "$0.31"],
  ["fees", "1.00%", "pool", "recycled"],
];

const SOCIAL = [
  { label: "X", href: "https://x.com/prophet" },
  { label: "Discord", href: "https://discord.gg/prophet" },
  { label: "GitHub", href: "https://github.com/JamesVictor-O/PROPHET" },
];

function PrimaryLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#ece8df] px-5 py-3 text-sm font-semibold text-[#111111] transition-colors duration-150 ease-out hover:bg-white active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ece8df] focus-visible:ring-offset-2 focus-visible:ring-offset-[#101010]"
    >
      {children}
      <HugeiconsIcon
        icon={ArrowRight01Icon}
        size={16}
        strokeWidth={2.2}
        aria-hidden="true"
        className="motion-safe:duration-150 motion-safe:ease-out group-hover:translate-x-0.5"
      />
    </Link>
  );
}



function MiniChart() {
  return (
    <svg
      viewBox="0 0 520 190"
      className="h-full w-full"
      role="img"
      aria-label="Animated YES and NO share price movement"
    >
      <g className="landing-grid">
        {[22, 68, 114, 160].map((y) => (
          <line key={y} x1="0" x2="520" y1={y} y2={y} />
        ))}
        {[60, 160, 260, 360, 460].map((x) => (
          <line key={x} x1={x} x2={x} y1="0" y2="190" />
        ))}
      </g>
      <path
        className="hero-path hero-path-yes"
        d="M8 124 L72 124 L72 104 L136 104 L136 116 L198 116 L198 82 L262 82 L262 72 L326 72 L326 96 L388 96 L388 54 L452 54 L452 48 L512 48"
      />
      <path
        className="hero-path hero-path-no"
        d="M8 64 L72 64 L72 84 L136 84 L136 72 L198 72 L198 106 L262 106 L262 116 L326 116 L326 92 L388 92 L388 134 L452 134 L452 140 L512 140"
      />
      <circle className="hero-dot hero-dot-yes" cx="512" cy="48" r="5" />
      <circle className="hero-dot hero-dot-no" cx="512" cy="140" r="5" />
      <text x="456" y="34" className="hero-chart-label hero-chart-label-yes">
        YES $0.68
      </text>
      <text x="456" y="164" className="hero-chart-label hero-chart-label-no">
        NO $0.32
      </text>
    </svg>
  );
}

function HeroTerminal() {
  return (
    <section className="landing-panel landing-reveal landing-reveal-2">
      <div className="grid border-b border-white/10 lg:grid-cols-[1fr_13rem]">
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b80ff]">
                Live YES/NO AMM
              </p>
              <h2 className="mt-2 max-w-lg text-lg font-semibold leading-tight text-white sm:text-xl">
                Will autonomous agents become core DeFi infrastructure in 2026?
              </h2>
            </div>
            <span className="hidden rounded-full border border-[#34d399]/25 px-3 py-1 font-mono text-xs text-[#34d399] sm:inline-flex">
              OPEN
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 border-t border-white/10 lg:grid-cols-1 lg:border-l lg:border-t-0">
          <div className="px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/32">
              Pool
            </p>
            <p className="mt-1 font-mono text-lg text-white">$50.00</p>
          </div>
          <div className="border-l border-white/10 px-4 py-3 lg:border-l-0 lg:border-t">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/32">
              Fee
            </p>
            <p className="mt-1 font-mono text-lg text-white">1.00%</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_13rem]">
        <div className="relative h-[220px] border-b border-white/10 p-4 sm:h-[280px] lg:border-b-0 lg:p-5">
          <MiniChart />
        </div>
        <div className="divide-y divide-white/10 border-white/10 lg:border-l">
          {HERO_TICKS.map((row) => (
            <div key={row.t} className="grid grid-cols-[3.2rem_1fr] gap-3 px-4 py-3">
              <span className="font-mono text-[11px] text-white/32">{row.t}</span>
              <div>
                <div className="flex items-center justify-between gap-3 font-mono text-xs">
                  <span className="text-[#34d399]">{row.yes}</span>
                  <span className="text-[#f87171]">{row.no}</span>
                </div>
                <p className="mt-1 text-[11px] leading-4 text-white/45">{row.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FlowRail() {
  return (
    <section className="landing-scene mx-auto flex max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="eyebrow">Autonomous Flow</p>
          <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-white sm:text-4xl">
            The protocol behaves like an exchange operator, not a betting desk.
          </h2>
        </div>
        <p className="max-w-md text-sm leading-6 text-white/55">
          Each step has an accountable surface: compute decides, contracts
          enforce, storage preserves, and liquidity returns to the system.
        </p>
      </div>

      <div className="protocol-rail">
        <span className="protocol-runner" aria-hidden="true" />
        {SYSTEM_FLOW.map(([step, title, body]) => (
          <article key={step} className="protocol-node">
            <span className="font-mono text-xs text-[#8b80ff]">{step}</span>
            <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-white/55">{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function OgSection() {
  return (
    <section className="landing-scene flex items-center border-y border-white/10 bg-[#141414]">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.72fr_1fr] lg:px-8 lg:py-24">
        <div>
          <p className="eyebrow">Built On 0G</p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-4xl">
            Chain, Compute, and Storage are not badges here. They are the market.
          </h2>
          <p className="mt-5 text-base leading-7 text-white/56">
            Prophet uses 0G as the operating layer for autonomous markets:
            settlement, intelligence, and memory are designed to reinforce one
            another.
          </p>
        </div>

        <div className="divide-y divide-white/10 border border-white/10">
          {OG_MODULES.map((item) => (
            <article key={item.title} className="grid gap-4 p-5 sm:grid-cols-[3rem_1fr_auto] sm:items-start">
              <div className="flex h-10 w-10 items-center justify-center border border-white/10 bg-white/[0.03]">
                <HugeiconsIcon icon={item.icon} size={20} strokeWidth={1.8} aria-hidden="true" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/34">
                    {item.label}
                  </span>
                </div>
                <p className="mt-3 max-w-xl text-sm leading-6 text-white/55">{item.body}</p>
              </div>
              <span className="self-start border border-[#8b80ff]/25 px-2.5 py-1 font-mono text-[11px] text-[#c8c2ff]">
                {item.signal}
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AmmSection() {
  return (
    <section className="landing-scene mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.86fr] lg:px-8 lg:py-24">
      <div>
        <p className="eyebrow">AMM Mechanics</p>
        <h2 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-4xl">
          YES and NO are priced like real inventory.
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-7 text-white/56">
          The landing page should teach the core idea without sounding like a
          manual. The pool is finite, large trades move price, and traders
          introduce directional belief.
        </p>
        <div className="mt-8 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-3">
          {AMM_ROWS.map(([label, value, before, after]) => (
            <div key={label} className="bg-[#101010] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/32">{label}</p>
              <p className="mt-3 font-mono text-xl text-white">{value}</p>
              <p className="mt-2 font-mono text-xs text-white/44">
                {before} / {after}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="landing-depth">
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/34">
              Reserve pressure
            </p>
            <p className="mt-1 text-sm text-white/62">A large YES buy moves the curve.</p>
          </div>
          <HugeiconsIcon icon={TradeUpIcon} size={22} strokeWidth={1.8} className="text-[#8b80ff]" aria-hidden="true" />
        </div>
        <div className="space-y-5 p-5">
          <div>
            <div className="mb-2 flex justify-between font-mono text-sm">
              <span className="text-[#34d399]">YES</span>
              <span className="text-white">$0.34 → $0.68</span>
            </div>
            <div className="h-3 border border-white/10 bg-white/[0.03]">
              <span className="amm-yes block h-full bg-[#34d399]" />
            </div>
          </div>
          <div>
            <div className="mb-2 flex justify-between font-mono text-sm">
              <span className="text-[#f87171]">NO</span>
              <span className="text-white">$0.66 → $0.32</span>
            </div>
            <div className="h-3 border border-white/10 bg-white/[0.03]">
              <span className="amm-no block h-full bg-[#f87171]" />
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 p-5">
          <div className="landing-equation">
            <span>YES</span>
            <span>+</span>
            <span>NO</span>
            <span>=</span>
            <span>$1.00</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function LedgerSection() {
  return (
    <section className="landing-scene flex items-center border-y border-white/10 bg-[#141414]">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.8fr_1fr] lg:px-8 lg:py-24">
        <div>
          <p className="eyebrow">Oracle Memory</p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-4xl">
            Every resolution leaves a trail a judge can inspect.
          </h2>
          <p className="mt-5 text-base leading-7 text-white/56">
            Prophet is strongest when the oracle is not a black box. The
            reasoning payload lives on 0G Storage, while the market contract
            stores the hash.
          </p>
        </div>
        <div className="ledger-surface">
          <div className="grid grid-cols-[1fr_auto] border-b border-white/10 p-4">
            <div className="flex items-center gap-3">
              <HugeiconsIcon icon={Shield01Icon} size={20} strokeWidth={1.8} className="text-[#c8c2ff]" aria-hidden="true" />
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-white/52">
                Resolution Packet
              </span>
            </div>
            <span className="font-mono text-xs text-[#34d399]">verified</span>
          </div>
          <div className="divide-y divide-white/10">
            {LEDGER_ROWS.map(([key, value, status]) => (
              <div key={key} className="grid grid-cols-[5rem_1fr_auto] gap-3 px-4 py-3 text-sm">
                <span className="font-mono text-white/34">{key}</span>
                <span className="truncate text-white/78">{value}</span>
                <span className="font-mono text-[11px] text-[#8b80ff]">{status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#101010] text-white">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-3 rounded-md pr-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ece8df] focus-visible:ring-offset-2 focus-visible:ring-offset-[#101010]"
          aria-label="Prophet home"
        >
          <Image
            src="/ProphateLogo1.png"
            alt=""
            width={34}
            height={34}
            className="rounded-full bg-white"
            priority
          />
          <div>
            <span className="block text-sm font-semibold tracking-wide text-white">
              Prophet
            </span>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-white/30 sm:block">
              Autonomous markets on 0G
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <ConnectButton />
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100svh-84px)] max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[0.86fr_1fr] lg:px-8">
        <div className="max-w-3xl">
          <h1 className="landing-reveal landing-reveal-2 mt-6 max-w-4xl text-[clamp(2.7rem,7vw,5.8rem)] font-semibold leading-[0.93] tracking-[-0.035em] text-[#f5f2ea]">
            Markets that operate themselves.
          </h1>
          <p className="landing-reveal landing-reveal-3 mt-6 max-w-2xl text-base leading-8 text-white/58 sm:text-lg">
            Prophet turns real-world questions into YES/NO share markets where
            autonomous agents allocate liquidity, reason through outcomes, and
            preserve the evidence trail on 0G.
          </p>
          <div className="landing-reveal landing-reveal-4 mt-8 flex flex-col gap-3 sm:flex-row">
            <PrimaryLink href="/dashboard">Enter the market</PrimaryLink>
          </div>
        </div>

        <HeroTerminal />
      </section>

      <FlowRail />
      <OgSection />
      <AmmSection />
      <LedgerSection />

      <footer className="mx-auto flex max-w-7xl flex-col gap-4 border-t border-white/10 px-4 py-6 text-sm text-white/40 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <span>© 2026 Prophet. Built on 0G Galileo.</span>
        <div className="flex items-center gap-4">
          {SOCIAL.map((item) => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-10 rounded-md px-2 py-2 transition-colors duration-150 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ece8df]"
            >
              {item.label}
            </a>
          ))}
        </div>
      </footer>
    </main>
  );
}
