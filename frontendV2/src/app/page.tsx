"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { AiBrain01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";

const ConnectButton = dynamic(
  () => import("@rainbow-me/rainbowkit").then((mod) => mod.ConnectButton),
  { ssr: false }
);

const MARKET_ROWS = [
  { label: "YES share", price: "$0.64", tone: "text-[#34d399]", width: "64%" },
  { label: "NO share", price: "$0.36", tone: "text-[#f87171]", width: "36%" },
];

const FLOW = [
  "Question validated by 0G Compute",
  "Liquidity allocated from protocol pool",
  "YES/NO AMM prices move with demand",
  "Reasoning stored on 0G Storage",
  "Settlement enforced on 0G Chain",
];

const STACK = [
  {
    title: "0G Chain",
    status: "Settlement",
    body: "Smart contracts execute market creation, AMM trades, redemption, and liquidity return.",
  },
  {
    title: "0G Compute",
    status: "Inference",
    body: "Agents validate markets, reason about outcomes, and support autonomous market operations.",
  },
  {
    title: "0G Storage",
    status: "Memory",
    body: "Market metadata, oracle reasoning, and agent state become durable audit trails.",
  },
];

const PRINCIPLES = [
  "YES and NO shares trade between $0 and $1",
  "Large trades create real slippage",
  "Liquidity is finite and protected",
  "Winning shares redeem deterministically",
];

const SOCIAL = [
  { label: "X", href: "https://x.com/prophet" },
  { label: "Discord", href: "https://discord.gg/prophet" },
  { label: "GitHub", href: "https://github.com/prophet" },
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
      className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#8b80ff] px-5 py-3 text-sm font-semibold text-[#101010] transition-colors duration-150 ease-out hover:bg-[#a39aff] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8c2ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111]"
    >
      {children}
      <HugeiconsIcon
        icon={ArrowRight01Icon}
        size={16}
        strokeWidth={2.25}
        aria-hidden="true"
        className="motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out group-hover:translate-x-0.5"
      />
    </Link>
  );
}

function SecondaryLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/10 px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:border-white/25 hover:bg-white/[0.04] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b80ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111]"
    >
      {children}
    </Link>
  );
}

function MarketPreview() {
  return (
    <div className="landing-reveal landing-reveal-2 w-full rounded-2xl border border-white/10 bg-[#171717] p-3 sm:p-4 lg:p-5">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 lg:pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b80ff]">
            Live market
          </p>
          <h2 className="mt-2 max-w-sm text-base font-semibold leading-snug text-white sm:text-lg">
            Will autonomous agents become core DeFi infrastructure in 2026?
          </h2>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#8b80ff]/30 bg-[#8b80ff]/10">
          <HugeiconsIcon
            icon={AiBrain01Icon}
            size={21}
            strokeWidth={1.8}
            className="text-[#c8c2ff]"
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="mt-4 space-y-3 lg:mt-5 lg:space-y-4">
        {MARKET_ROWS.map((row) => (
          <div
            key={row.label}
            className="rounded-xl border border-white/10 bg-white/[0.025] p-3 lg:p-4"
          >
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm font-medium text-white/70">{row.label}</span>
              <span className={`font-mono text-xl font-semibold tabular-nums sm:text-2xl ${row.tone}`}>
                {row.price}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="market-bar h-full rounded-full bg-white/75"
                style={{ width: row.width }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center lg:mt-5">
        {[
          ["Pool", "$50.00"],
          ["Fees", "1.00%"],
          ["Slippage", "Live"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-white/10 bg-[#111111] p-2.5 lg:p-3">
            <p className="text-[11px] font-medium text-white/40">{label}</p>
            <p className="mt-1 font-mono text-sm font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#111111] text-white">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-3 rounded-lg pr-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b80ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111]"
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
          <span className="text-sm font-semibold tracking-wide text-white">
            Prophet
          </span>
        </Link>


        <div className="flex items-center">
          <ConnectButton />
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100svh-84px)] max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.82fr)] lg:gap-10 lg:px-8 lg:py-12">
        <div className="max-w-3xl">
          <h1 className="landing-reveal landing-reveal-1 max-w-4xl text-4xl font-semibold leading-[1.04] tracking-normal text-white sm:text-5xl lg:text-[clamp(3rem,5vw,4.25rem)]">
            Autonomous prediction markets that feel calm, clear, and built to
            settle.
          </h1>

          <p className="landing-reveal landing-reveal-2 mt-5 max-w-2xl text-base leading-7 text-white/60 sm:text-lg sm:leading-8">
            Prophet turns real-world questions into YES/NO share markets. 0G
            Chain executes the AMM, 0G Compute powers the agents, and 0G Storage
            preserves the reasoning.
          </p>

          <div className="landing-reveal landing-reveal-3 mt-7 flex flex-col gap-3 sm:flex-row">
            <PrimaryLink href="/dashboard">Explore markets</PrimaryLink>
          </div>
        </div>

        <MarketPreview />
      </section>

      <section className="border-y border-white/10 bg-[#151515]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.78fr_1fr] lg:px-8 lg:py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b80ff]">
              Why it exists
            </p>
            <h2 className="mt-4 max-w-xl text-3xl font-semibold leading-tight text-white sm:text-4xl">
              Prediction markets should not depend on manual liquidity or opaque
              resolution.
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              [
                "Oracle problem",
                "Outcomes need clear reasoning that users can inspect after settlement.",
              ],
              [
                "Liquidity problem",
                "New markets need depth immediately, not only after human LPs arrive.",
              ],
              [
                "Trust problem",
                "Agents should leave permanent evidence, not private logs on a server.",
              ],
              [
                "Solvency problem",
                "Prices need slippage and bounded payouts so the AMM cannot be drained.",
              ],
            ].map(([title, body]) => (
              <article
                key={title}
                className="rounded-2xl border border-white/10 bg-[#111111] p-5 transition-colors duration-150 ease-out hover:border-white/20"
              >
                <h3 className="text-base font-semibold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/60">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b80ff]">
              Autonomous flow
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-4xl">
              From question to settlement, the system keeps moving.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/60">
              The landing experience should feel like the protocol itself:
              steady, transparent, and deliberate. Every step has a role, and
              every off-chain decision leaves a verifiable trail.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#151515] p-4 sm:p-5">
            <ol className="relative space-y-3 overflow-hidden">
              <span className="flow-tracer" aria-hidden="true" />
              {FLOW.map((item, index) => (
                <li
                  key={item}
                  className="flow-item grid grid-cols-[2.75rem_1fr] gap-4 rounded-xl border border-white/10 bg-[#111111] p-4"
                >
                  <div className="relative flex justify-center">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#8b80ff]/30 bg-[#8b80ff]/10 font-mono text-xs font-semibold text-[#c8c2ff]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      className="flow-step-pulse"
                      style={{ animationDelay: `${index * 420}ms` }}
                      aria-hidden="true"
                    />
                    {index < FLOW.length - 1 && (
                      <span className="flow-line" aria-hidden="true" />
                    )}
                  </div>
                  <div className="flex min-h-9 items-center">
                    <p className="text-sm font-medium leading-6 text-white/80">
                      {item}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#151515]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b80ff]">
              Built on 0G
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-4xl">
              Compute, storage, and settlement working as one surface.
            </h2>
          </div>

          <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 lg:grid-cols-3">
            {STACK.map((item, index) => (
              <article key={item.title} className="bg-[#111111] p-6">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg font-semibold text-white">
                    {item.title}
                  </h3>
                  <span className="rounded-full border border-[#8b80ff]/20 bg-[#8b80ff]/10 px-2.5 py-1 text-[11px] font-medium text-[#c8c2ff]">
                    {item.status}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 text-white/60">
                  {item.body}
                </p>
                <div className="mt-6 overflow-hidden rounded-full bg-white/10">
                  <span
                    className="stack-signal block h-1.5 w-1/3 rounded-full bg-[#8b80ff]"
                    style={{ animationDelay: `${index * 300}ms` }}
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-4 grid grid-cols-6 gap-1" aria-hidden="true">
                  {Array.from({ length: 6 }).map((_, cellIndex) => (
                    <span
                      key={cellIndex}
                      className="stack-cell h-6 rounded-md border border-white/10 bg-white/[0.03]"
                      style={{ animationDelay: `${index * 280 + cellIndex * 90}ms` }}
                    />
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.82fr] lg:px-8 lg:py-24">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b80ff]">
            AMM principles
          </p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-4xl">
            A market that moves because liquidity is real.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/60">
            Prophet shows share prices in dollars, not vague percentages. If
            users push hard into YES, YES gets expensive and NO gets cheaper.
            That movement is the point: it is how the market expresses belief
            while protecting the pool.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#151515] p-5">
          <div className="rounded-xl border border-white/10 bg-[#111111] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b80ff]">
                  AMM motion
                </p>
                <p className="mt-1 text-sm text-white/60">
                  Demand shifts reserves, so prices move.
                </p>
              </div>
              <span className="rounded-full border border-[#34d399]/20 bg-[#34d399]/10 px-2.5 py-1 font-mono text-xs text-[#34d399]">
                Live
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-white/70">YES price</span>
                  <span className="font-mono text-[#34d399]">$0.36 → $0.74</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <span className="amm-yes block h-full rounded-full bg-[#34d399]" />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-white/70">NO price</span>
                  <span className="font-mono text-[#f87171]">$0.64 → $0.26</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <span className="amm-no block h-full rounded-full bg-[#f87171]" />
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.025] p-3">
              <span className="trade-packet h-2.5 w-2.5 rounded-full bg-[#8b80ff]" aria-hidden="true" />
              <p className="text-xs leading-5 text-white/60">
                A large YES buy makes YES scarce, pushes YES up, and pushes NO down.
              </p>
            </div>
          </div>

          <ul className="mt-5 space-y-3">
            {PRINCIPLES.map((item) => (
              <li
                key={item}
                className="flex gap-3 rounded-xl border border-white/10 bg-[#111111] p-4"
              >
                <span
                  className="mt-2 h-1.5 w-1.5 rounded-full bg-[#8b80ff]"
                  aria-hidden="true"
                />
                <span className="text-sm leading-6 text-white/70">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#151515]">
        <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b80ff]">
            Ready to test it
          </p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-4xl">
            Open Prophet and watch a YES/NO market behave like a real exchange.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/60">
            Claim testnet USDT, create a market, and see protocol-owned
            liquidity, AMM prices, and agent infrastructure in the same flow.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <PrimaryLink href="/dashboard">Launch Prophet</PrimaryLink>
            <SecondaryLink href="/dashboard/faucet">
              Get test USDT
            </SecondaryLink>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-sm text-white/40 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <span>© 2026 Prophet. Built on 0G Galileo.</span>
        <div className="flex items-center gap-4">
          {SOCIAL.map((item) => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-10 rounded-lg px-2 py-2 transition-colors duration-150 ease-out hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b80ff]"
            >
              {item.label}
            </a>
          ))}
        </div>
      </footer>
    </main>
  );
}
