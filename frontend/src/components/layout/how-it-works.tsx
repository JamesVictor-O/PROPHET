"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Check,
  ArrowRight,
  Zap,
  Sparkles,
  Trophy,
  MousePointer2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function HowItWorks() {
  const steps = [
    {
      title: "Sync",
      sub: "TAP & GO",
      desc: "One-tap MiniPay connection. No seed phrases, just speed.",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      title: "Vibe",
      sub: "PICK SIDES",
      desc: "Trust your gut on culture. Stake what you want, from $0.01.",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      title: "Win",
      sub: "CASH OUT",
      desc: "Smart contracts stream wins to your wallet. Instantly.",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="py-32 px-6 bg-[#020617] relative overflow-hidden"
    >
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-600/10 blur-[100px] rounded-full" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Livelier Header */}
        <div className="flex flex-col items-center text-center mb-24 space-y-6">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white text-[10px] uppercase tracking-[0.3em] font-black">
            <Sparkles className="w-3 h-3 text-yellow-400" /> The Prophet Path
          </div>
          <h2 className="text-5xl md:text-8xl font-black tracking-tighter text-white uppercase italic">
            Zero{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-emerald-400">
              Friction.
            </span>
          </h2>
          <p className="text-slate-400 text-lg md:text-xl max-w-xl font-medium tracking-tight">
            Stop watching from the sidelines. Turn your cultural IQ into real
            assets in three moves.
          </p>
        </div>

        {/* Action Steps with Visual Connector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-32 relative">
          {steps.map((step, i) => (
            <div key={i} className="relative group">
              <div className="flex flex-col items-center text-center space-y-6">
                <div
                  className={cn(
                    "w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-3xl font-black rotate-3 group-hover:rotate-12 transition-all duration-500 shadow-2xl shadow-black/50 border border-white/10",
                    step.bg,
                    step.color
                  )}
                >
                  {i + 1}
                </div>
                <div className="space-y-2">
                  <p
                    className={cn(
                      "text-[10px] font-black tracking-[0.3em] uppercase",
                      step.color
                    )}
                  >
                    {step.sub}
                  </p>
                  <h3 className="text-3xl font-bold text-white tracking-tighter italic">
                    {step.title}
                  </h3>
                  <p className="text-slate-500 text-sm font-semibold max-w-[200px] mx-auto leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
              {i < 2 && (
                <ArrowRight className="hidden md:block absolute top-12 -right-6 w-12 h-12 text-white/5 stroke-[1px]" />
              )}
            </div>
          ))}
        </div>

        {/* "The Winning Moment" Interactive Card */}
        <div className="relative group perspective-1000">
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-500 rounded-[3rem] opacity-20 blur-2xl group-hover:opacity-40 transition-opacity duration-700" />

          <Card className="relative bg-black/40 backdrop-blur-3xl border-white/10 rounded-[2.5rem] overflow-hidden">
            <CardContent className="p-1 w-full">
              <div className="grid grid-cols-1 lg:grid-cols-5 h-full">
                {/* Visual Narrative Side */}
                <div className="lg:col-span-3 p-8 md:p-16 space-y-10">
                  <div className="space-y-4">
                    <h4 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter leading-none">
                      SEE IT. <br />
                      <span className="text-slate-500">PREDICT IT.</span> <br />
                      <span className="text-emerald-400 underline decoration-white/20 underline-offset-8">
                        OWN IT.
                      </span>
                    </h4>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-4 group/item">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover/item:scale-125 transition-transform">
                        <MousePointer2 className="w-4 h-4" />
                      </div>
                      <p className="text-white font-bold tracking-tight">
                        You predicted Burna Boy drops a Surprise EP
                      </p>
                    </div>
                    <div className="flex items-center gap-4 group/item">
                      <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 group-hover/item:scale-125 transition-transform">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <p className="text-white font-bold tracking-tight">
                        Market Settles. Reality matches your gut.
                      </p>
                    </div>
                  </div>

                  <button className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-black uppercase text-xs tracking-widest hover:bg-emerald-400 hover:scale-105 transition-all shadow-xl shadow-white/5">
                    Enter the Arena <Zap className="w-4 h-4 fill-black" />
                  </button>
                </div>

                {/* The "Dynamic Receipt" - The Lively Part */}
                <div className="lg:col-span-2 bg-gradient-to-b from-slate-900 to-black p-8 md:p-12 border-l border-white/5 flex flex-col justify-center relative">
                  <div className="space-y-8 relative z-10">
                    <div className="space-y-1">
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                        Your Position
                      </p>
                      <p className="text-4xl font-black text-white">$10.00</p>
                    </div>

                    <div className="h-px bg-white/5 w-full" />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">
                          Multiplier
                        </p>
                        <p className="text-xl font-bold text-white">1.8x</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">
                          Network
                        </p>
                        <p className="text-xl font-bold text-blue-400">
                          MiniPay
                        </p>
                      </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 relative group/payout overflow-hidden">
                      <div className="absolute inset-0 bg-emerald-500/10 translate-y-full group-hover/payout:translate-y-0 transition-transform duration-500" />
                      <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-1 relative z-10">
                        Instant Payout
                      </p>
                      <p className="text-5xl font-black text-emerald-400 tracking-tighter relative z-10">
                        $18.42
                      </p>
                      <p className="text-xs font-bold text-emerald-500/60 mt-2 relative z-10">
                        +84% GAIN
                      </p>
                    </div>
                  </div>

                  {/* Aesthetic grid pattern for the receipt */}
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
