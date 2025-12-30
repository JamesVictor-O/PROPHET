"use client";

import { Music, Film, Tv, Zap, Award, Share2, Sparkle } from "lucide-react";
import { cn } from "@/lib/utils";

export function Features() {
  const categories = [
    {
      icon: <Music className="w-10 h-10" />,
      title: "Music",
      label: "STREAMING & CHARTS",
      desc: "Afrobeats. Amapiano. Milestones. Predict the next chart-topper.",
      className:
        "md:col-span-3 bg-blue-600/10 border-blue-500/20 text-blue-400",
    },
    {
      icon: <Film className="w-10 h-10" />,
      title: "Movies",
      label: "BOX OFFICE",
      desc: "Nollywood hits & global views.",
      className:
        "md:col-span-2 bg-purple-600/10 border-purple-500/20 text-purple-400",
    },
    {
      icon: <Tv className="w-10 h-10" />,
      title: "Reality TV",
      label: "LIVE EVENTS",
      desc: "BBNaija evictions & show winners.",
      className:
        "md:col-span-2 bg-emerald-600/10 border-emerald-500/20 text-emerald-400",
    },
    {
      icon: <Zap className="w-10 h-10" />,
      title: "Instant Win",
      label: "SMART PROTOCOL",
      desc: "Smart contracts stream your wins home instantly.",
      className:
        "md:col-span-3 bg-orange-600/10 border-orange-500/20 text-orange-400",
    },
  ];

  const subFeatures = [
    { icon: <Award className="w-5 h-5" />, text: "Reputation Bonus" },
    { icon: <Share2 className="w-5 h-5" />, text: "Social Flexing" },
    { icon: <Sparkle className="w-5 h-5" />, text: "Exclusive Markets" },
  ];

  return (
    <section id="features" className="py-32 px-6 bg-[#020617] relative">
      <div className="max-w-7xl mx-auto">
        {/* Aggressive Header */}
        <div className="mb-20 space-y-4">
          <h2 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter uppercase leading-none">
            Built for the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-white to-slate-700">
              Prophet Class.
            </span>
          </h2>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {categories.map((cat, i) => (
            <div
              key={i}
              className={cn(
                "relative group overflow-hidden rounded-[2.5rem] border p-8 md:p-12 transition-all duration-700 hover:scale-[0.98]",
                cat.className
              )}
            >
              {/* Animated Glow Background */}
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-current opacity-[0.03] blur-[80px] group-hover:opacity-[0.08] transition-opacity" />

              <div className="relative z-10 h-full flex flex-col justify-between space-y-12">
                <div className="p-4 bg-white/5 rounded-2xl w-fit group-hover:rotate-12 transition-transform duration-500">
                  {cat.icon}
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-[9px] font-black tracking-[0.3em] opacity-60 mb-2 uppercase">
                      {cat.label}
                    </p>
                    <h3 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                      {cat.title}
                    </h3>
                  </div>
                  <p className="text-slate-500 font-bold leading-tight max-w-[240px]">
                    {cat.desc}
                  </p>
                </div>
              </div>
              <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white fill-white" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
