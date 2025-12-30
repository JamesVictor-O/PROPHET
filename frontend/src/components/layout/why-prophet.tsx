"use client";

import {
  DollarSign,
  Shield,
  Smartphone,
  ArrowUpRight,
  Zap,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function WhyProphet() {
  const features = [
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: "Micro-Stakes. Mega-Wins.",
      sub: "ACCESSIBILITY",
      description:
        "Start with just $0.0025. We've lowered the barrier so the whole continent can skin the game.",
      color: "from-blue-600 to-blue-400",
      accent: "text-blue-400",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Immutable. Automatic.",
      sub: "TRUSTLESS",
      description:
        "No middlemen. No 'wait for payout'. Smart contracts stream your wins the second the market hits.",
      color: "from-purple-600 to-purple-400",
      accent: "text-purple-400",
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "MiniPay Native Experience.",
      sub: "MOBILE-FIRST",
      description:
        "Built for the streets. Predict on the bus, in the club, or at home. Fast, light, and deadly simple.",
      color: "from-emerald-600 to-emerald-400",
      accent: "text-emerald-400",
    },
  ];

  return (
    <section className="py-32 px-6 bg-[#020617] relative overflow-hidden">
      {/* Background "Noise" Texture */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Aggressive Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-24">
          <div className="max-w-2xl space-y-4">
            <h3 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter leading-[0.85] uppercase">
              Engineered for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-500 to-slate-800">
                The Culture.
              </span>
            </h3>
          </div>
          <p className="text-slate-500 font-bold text-lg lg:max-w-xs leading-tight italic">
            &ldquo;The first prediction market built for the pulse of African
            entertainment&rdquo;
          </p>
        </div>

        {/* Feature Layout - Asymmetric & Lively */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-1px bg-white/5 border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-[#020617] p-10 md:p-16 hover:bg-white/[0.02] transition-all duration-700"
            >
              {/* Hover Gradient Glow */}
              <div
                className={cn(
                  "absolute top-0 left-0 w-full h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                  feature.color
                )}
              />

              <div className="space-y-12">
               

                <div className="space-y-4">
                  <p
                    className={cn(
                      "text-[10px] font-black tracking-[0.3em] uppercase opacity-50",
                      feature.accent
                    )}
                  >
                    {feature.sub}
                  </p>
                  <h4 className="text-3xl font-black text-white tracking-tighter leading-none group-hover:translate-x-2 transition-transform duration-500">
                    {feature.title}
                  </h4>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>

              {/* Decorative Number */}
              <span className="absolute bottom-10 right-10 text-8xl font-black text-white/[0.02] select-none group-hover:text-white/[0.05] transition-colors">
                0{index + 1}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-white">
      <div className="w-5 h-5">{icon}</div>
      <span className="text-[10px] font-black uppercase tracking-[0.2em]">
        {text}
      </span>
    </div>
  );
}
