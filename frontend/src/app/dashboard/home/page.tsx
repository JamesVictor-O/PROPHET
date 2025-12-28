"use client";

import { useState } from "react";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { AfricanEventCard } from "@/components/home/african-event-card";
import { useAfricanEvents } from "@/hooks/useAfricanEvents";
import {
  Loader2,
  TrendingUp,
  Sparkles,
  Calendar,
  Zap,
  Globe,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateMarketModal } from "@/components/markets/create-market-modal";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const [createMarketModalOpen, setCreateMarketModalOpen] = useState(false);
  const { data: events, isLoading, error, refetch } = useAfricanEvents();

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 selection:bg-blue-500/30 font-sans">
      <DashboardNav onCreateMarket={() => setCreateMarketModalOpen(true)} />

      <div className="pt-16 flex">
        <DashboardSidebar />

        <main className="flex-1 lg:ml-64 transition-all">
          {/* Top Intelligence Bar (Ticker Style) */}
          <div className="border-b border-white/5 bg-black/20 backdrop-blur-md px-4 py-3 overflow-hidden whitespace-nowrap">
            <div className="flex items-center gap-8 animate-marquee">
              {[
                "NG 3-2 TUN (AFCON)",
                "CONGO VS MOROCCO - MON",
                "BBN APPLICATIONS OPEN",
                "TECH FEST LAGOS - DEC",
              ].map((news, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    {news}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="px-4 sm:px-8 py-8 lg:px-12 max-w-[1600px] mx-auto">
            {/* Professional Header */}
            <header className="mb-12 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-[1px] w-8 bg-blue-600" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">
                  Intelligence Feed
                </span>
              </div>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none">
                  Global <span className="text-slate-600">Flashpoints</span>
                </h1>
                <p className="text-slate-500 text-sm max-w-xs font-medium italic border-l border-white/10 pl-4">
                  Real-time events curated for precision prediction. Turn news
                  into assets.
                </p>
              </div>
            </header>

            {/* Quick Filter / Categorization */}
            <div className="flex flex-wrap gap-2 mb-10 pb-4 border-b border-white/5">
              {[
                "All Updates",
                "Sports",
                "Politics",
                "Tech",
                "Entertainment",
              ].map((cat) => (
                <button
                  key={cat}
                  className="px-4 py-2 rounded-full border border-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-300"
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="grid grid-cols-12 gap-6">
                {/* Column 1: TRENDING (The "Big" News) */}
                <div className="col-span-12 lg:col-span-8 space-y-8">
                  <div className="flex items-center gap-3 mb-6">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white">
                      High Volatility Updates
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {events?.trending?.map((event, index) => (
                      <div
                        key={index}
                        className="group relative border border-white/5 p-6 hover:bg-white/[0.02] transition-all duration-500 overflow-hidden"
                      >
                        {/* Side Accent */}
                        <div className="absolute top-0 left-0 w-[2px] h-0 group-hover:h-full bg-blue-500 transition-all duration-500" />

                        <div className="flex justify-between items-start mb-4">
                          <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest border border-blue-500/20 px-2 py-0.5">
                            Hot Topic
                          </span>
                          <span className="text-[9px] font-bold text-slate-600 italic">
                            2m ago
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-4 leading-tight group-hover:text-blue-400 transition-colors">
                          {event.title}
                        </h3>

                        <p className="text-slate-500 text-xs mb-6 line-clamp-2 font-medium leading-relaxed">
                          {event.description}
                        </p>

                        <Button
                          onClick={() => setCreateMarketModalOpen(true)}
                          className="w-full bg-transparent border border-white/10 hover:bg-white hover:text-black text-[10px] font-black uppercase tracking-widest h-11 transition-all"
                        >
                          Predict This Event <Plus className="ml-2 w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 2: FEED / ANNOUNCEMENTS (The "Side" Intel) */}
                <div className="col-span-12 lg:col-span-4 space-y-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Calendar className="w-4 h-4 text-emerald-500" />
                    <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white">
                      Calendar & Intel
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {events?.latest?.map((event, index) => (
                      <div
                        key={index}
                        className="border-b border-white/5 pb-4 group cursor-pointer"
                      >
                        <div className="flex gap-4">
                          <div className="w-12 h-12 shrink-0 border border-white/10 flex flex-col items-center justify-center bg-white/[0.02]">
                            <span className="text-[10px] font-black text-white leading-none">
                              24
                            </span>
                            <span className="text-[8px] font-bold text-slate-500 uppercase">
                              DEC
                            </span>
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                              {event.title}
                            </h4>
                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight mt-1">
                              {event.location || "Continental Update"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* PROPHET CTA */}
                  <div className="p-8 border border-blue-500/20 bg-blue-500/[0.02] relative overflow-hidden">
                    <Zap className="absolute -bottom-4 -right-4 w-24 h-24 text-blue-500/10 rotate-12" />
                    <h3 className="text-lg font-black italic uppercase leading-tight mb-2">
                      Have your own Intel?
                    </h3>
                    <p className="text-xs text-slate-400 mb-6">
                      Create a custom market and earn protocol fees.
                    </p>
                    <Button
                      onClick={() => setCreateMarketModalOpen(true)}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[10px]"
                    >
                      Create Market
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <CreateMarketModal
        open={createMarketModalOpen}
        onOpenChange={setCreateMarketModalOpen}
        onCreateMarket={async (market) => console.log(market)}
      />

      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          display: flex;
          width: fit-content;
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
