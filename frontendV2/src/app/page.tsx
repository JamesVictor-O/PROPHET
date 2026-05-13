"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
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

const HERO_PILLS = ["0G Chain", "0G Compute", "0G Storage"];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Create a Question",
    userAction: "Pick a real-world YES/NO event you care about.",
    systemAction: "Prophet validates it and opens a live market.",
    icon: Shield01Icon,
    side: "left",
  },
  {
    step: "02",
    title: "Instant Market Depth",
    userAction: "Open the market and see live YES/NO prices.",
    systemAction: "Protocol liquidity seeds a balanced AMM start.",
    icon: Link04Icon,
    side: "right",
  },
  {
    step: "03",
    title: "Trade Your View",
    userAction: "Buy or sell shares as your conviction changes.",
    systemAction: "AMM reprices continuously from reserve imbalance.",
    icon: TradeUpIcon,
    side: "left",
  },
  {
    step: "04",
    title: "Resolve and Redeem",
    userAction: "Winning holders redeem directly from the market.",
    systemAction: "Oracle settles outcome and stores reasoning on 0G.",
    icon: Database01Icon,
    side: "right",
  },
];

const OG_MODULES = [
  {
    icon: Database01Icon,
    title: "0G Storage",
    label: "Historical Data",
    body: "Market evidence, oracle reasoning, and agent state persist as immutable records.",
    slot: "top",
  },
  {
    icon: CpuIcon,
    title: "0G Compute",
    label: "Predictive Intelligence",
    body: "TEE-backed inference powers validation, risk scoring, and market resolution logic.",
    slot: "right",
  },
  {
    icon: Link04Icon,
    title: "0G Chain",
    label: "Settlement Layer",
    body: "AMM trading, collateral accounting, and deterministic payouts execute on-chain.",
    slot: "bottom",
  },
  {
    icon: Shield01Icon,
    title: "Protocol Layer",
    label: "Integrated Analytics",
    body: "Agent outcomes feed allocation, pricing, and liquidity management across markets.",
    slot: "left",
  },
];

const WHY_PROPHET = [
  {
    step: "01",
    title: "Turn Hot Opinions Into Markets",
    body: "If your take can spark real argument, you can launch it as a YES/NO market and let people price the truth.",
    icon: TradeUpIcon,
    tone: "bg-[#ef6b4a]/18 text-[#ef6b4a]",
  },
  {
    step: "02",
    title: "No Liquidity Headache",
    body: "You do not need to chase manual LPs. Prophet injects protocol liquidity so your market is tradable from day one.",
    icon: Link04Icon,
    tone: "bg-[#5b5ce6]/20 text-[#8b80ff]",
  },
  {
    step: "03",
    title: "Verifiable Resolution",
    body: "Outcomes are settled with auditable reasoning on 0G, so users can verify why a market resolved the way it did.",
    icon: Database01Icon,
    tone: "bg-[#26c281]/18 text-[#26c281]",
  },
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



function HeroTerminal({
  isConnected,
  onConnectWallet,
}: {
  isConnected: boolean;
  onConnectWallet?: () => void;
}) {
  return (
    <section className="hero-shell landing-reveal landing-reveal-2 h-full w-full">
      <div className="hero-grid-bg" aria-hidden="true" />
      <div className="relative grid h-full items-center gap-8 px-6 pb-4 pt-4 sm:px-8 sm:pt-6 lg:grid-cols-[1fr_0.95fr] lg:px-10 lg:pt-8">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
            Welcome to Prophet Markets
          </p>
          <h2 className="mt-4 text-[clamp(2.4rem,4.6vw,4.9rem)] font-semibold leading-[1.01] text-white">
           The{" "}
            <span className="text-[#f5cf6a]">Autonomous Prediction</span>{" "}
            Platform
          </h2>
          <p className="mt-5 text-sm leading-7 text-white/62 sm:text-base">
            Trade real YES/NO share prices with protocol-owned liquidity, AI
            resolution, and verifiable 0G evidence trails.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {HERO_PILLS.map((pill) => (
              <span
                key={pill}
                className="rounded border border-white/15 bg-white/[0.03] px-3 py-1 text-[11px] font-medium text-white/70"
              >
                {pill}
              </span>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-3 text-sm text-white/80">
            <div className="hero-avatars" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <span className="text-xs text-white/55">
              Built To Make Your Opinion Tradeable.
            </span>
          </div>
          <div className="mt-7">
            {isConnected ? (
              <PrimaryLink href="/dashboard">Explore market</PrimaryLink>
            ) : (
              <button
                type="button"
                onClick={onConnectWallet}
                className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#ece8df] px-5 py-3 text-sm font-semibold text-[#111111] transition-colors duration-150 ease-out hover:bg-white active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ece8df] focus-visible:ring-offset-2 focus-visible:ring-offset-[#101010]"
              >
                Connect wallet
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={16}
                  strokeWidth={2.2}
                  aria-hidden="true"
                  className="motion-safe:duration-150 motion-safe:ease-out group-hover:translate-x-0.5"
                />
              </button>
            )}
          </div>
        </div>
        <div className="hero-device-stage">
          <div className="hero-device hero-device-back">
            <Image
              src="/mobilePridiction.jpg"
              alt="Prophet mobile trading interface"
              width={260}
              height={520}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <div className="hero-device hero-device-mid">
            <Image
              src="/mobilePridiction.jpg"
              alt="Prophet market dashboard on mobile"
              width={260}
              height={520}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <div className="hero-device hero-device-front">
            <Image
              src="/mobilePridiction.jpg"
              alt="Prophet prediction market detail on mobile"
              width={260}
              height={520}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <span className="hero-device-floor" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section className="landing-scene h-screen flex items-center">
      <div className="mx-auto w-full px-6 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <p className="eyebrow">How It Works</p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-4xl">
            Prophet in 4 clear steps.
          </h2>
          <p className="mt-4 text-sm leading-6 text-white/58 sm:text-base">
            Create, trade, and settle in one clear flow. Simple for users,
            autonomous behind the scenes.
          </p>
        </div>

        <div className="how-works">
          <span className="how-works-line" aria-hidden="true" />
          {HOW_IT_WORKS.map((item) => (
            <article
              key={item.step}
              className={`how-works-item how-works-item-${item.side}`}
            >
              <div className="how-works-col how-works-col-left">
                {item.side === "left" ? (
                  <div className="how-works-card">
                    <div className="how-works-card-head">
                      <HugeiconsIcon icon={item.icon} size={18} strokeWidth={1.9} aria-hidden="true" />
                      <h3>{item.title}</h3>
                    </div>
                    <p>
                      <strong>You:</strong> {item.userAction}
                    </p>
                    <p>
                      <strong>Prophet:</strong> {item.systemAction}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="how-works-node" aria-hidden="true">
                <span>{item.step}</span>
              </div>

              <div className="how-works-col how-works-col-right">
                {item.side === "right" ? (
                  <div className="how-works-card">
                    <div className="how-works-card-head">
                      <HugeiconsIcon icon={item.icon} size={18} strokeWidth={1.9} aria-hidden="true" />
                      <h3>{item.title}</h3>
                    </div>
                    <p>
                      <strong>You:</strong> {item.userAction}
                    </p>
                    <p>
                      <strong>Prophet:</strong> {item.systemAction}
                    </p>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function OgSection() {
  return (
    <section className="landing-scene h-screen overflow-hidden">
      <div className="flex h-full w-full flex-col pb-4 pt-4">
        <div className="mx-auto mb-6 w-full max-w-xl px-6 text-center sm:px-8 lg:px-10">
          <p className="eyebrow">Why OG Labs</p>
          <h2 className="mt-4  text-2xl font-semibold leading-tight text-white sm:text-3xl">
            Prophet runs as a connected 0G intelligence system.
          </h2>
        </div>

        <div className="og-system mt-4 min-h-0 w-full flex-1">
          <div className="og-link og-link-top" />
          <div className="og-link og-link-right" />
          <div className="og-link og-link-bottom" />
          <div className="og-link og-link-left" />

          <div className="og-core">
            <h3 className="text-2xl font-semibold leading-tight text-white ">
              Prophet Autonomous
              <br />
              Market Core
            </h3>
            <p className="mt-3 text-sm leading-6 text-white/58">
              Connected execution across chain, compute, storage, and protocol
              analytics.
            </p>
          </div>

          {OG_MODULES.map((item) => (
            <article
              key={item.title}
              className={`og-panel og-panel-${item.slot} ${
                item.slot === "left"
                  ? "items-end text-right"
                  : item.slot === "right"
                    ? "items-start text-left"
                    : "items-center text-center"
              }`}
            >
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/12 bg-white text-[#111]">
                <HugeiconsIcon
                  icon={item.icon}
                  size={24}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </div>
              <div className="mt-3 max-w-xs">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/42">
                  {item.label}
                </p>
                <h4 className="mt-1 text-[1.9rem] font-semibold leading-[1.04] text-white">
                  {item.title}
                </h4>
                <p className="mt-3 text-sm leading-6 text-white/56">
                  {item.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}



function LedgerSection() {
  return (
    <section className="landing-scene h-screen flex items-center">
      <div className="mx-auto w-full max-w-7xl px-6 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="eyebrow">Why Prophet</p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-5xl">
            Why Use Prophet
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {WHY_PROPHET.map((reason) => (
            <article
              key={reason.step}
              className="border border-white/10 bg-white/[0.02] p-5"
            >
              <div className="mb-5 flex items-center justify-between">
                <span
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-sm ${reason.tone}`}
                >
                  <HugeiconsIcon icon={reason.icon} size={18} strokeWidth={2} aria-hidden="true" />
                </span>
                <span className="font-mono text-sm text-white/55">{reason.step}</span>
              </div>
              <h3 className="text-2xl font-semibold leading-tight text-white">
                {reason.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-white/62">{reason.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  return (
    <main className="landing-global-bg min-h-screen overflow-x-hidden text-white">
      <section className="relative h-screen w-full overflow-hidden">
        <header className="absolute inset-x-0 top-0 z-30">
          <div className="flex h-20 w-full items-center justify-between px-6 sm:px-8 lg:px-10">
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
          </div>
        </header>

        <div className="h-full w-full">
          <HeroTerminal
            isConnected={isConnected}
            onConnectWallet={openConnectModal}
          />
        </div>
      </section>

      <HowItWorksSection />
      <OgSection />
      <LedgerSection />

      <footer className="mx-auto flex max-w-7xl flex-col gap-4 border-t border-white/10 px-6 py-6 text-sm text-white/40 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
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
