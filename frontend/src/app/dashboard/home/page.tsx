"use client";

import { useState } from "react";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { useAfricanEvents } from "@/hooks/useAfricanEvents";
import { Loader2, Calendar, Zap, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateMarketModal } from "@/components/markets/create-market-modal";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const [createMarketModalOpen, setCreateMarketModalOpen] = useState(false);
  const { data: events, isLoading } = useAfricanEvents();

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 selection:bg-blue-500/30 font-sans">
      <DashboardNav onCreateMarket={() => setCreateMarketModalOpen(true)} />

      <div className="pt-16 flex">
        <DashboardSidebar />

        <main className="flex-1 lg:ml-64 transition-all pb-20 lg:pb-8">
          {/* Top Intelligence Bar (Ticker Style) */}
          <div className="border-b border-white/5 bg-black/20 backdrop-blur-md px-2 sm:px-4 py-2 sm:py-3 overflow-hidden">
            <div className="flex items-center gap-4 sm:gap-8 animate-marquee">
              {events && events.trending && events.trending.length > 0
                ? events.trending.slice(0, 8).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-1.5 sm:gap-2 shrink-0"
                    >
                      <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-blue-500" />
                      <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-[0.2em] text-slate-400 line-clamp-1 max-w-[200px] sm:max-w-none">
                        {event.title.length > 50
                          ? `${event.title.substring(0, 50)}...`
                          : event.title}
                      </span>
                    </div>
                  ))
                : // Fallback while loading
                  [
                    "NG 3-2 TUN (AFCON)",
                    "CONGO VS MOROCCO - MON",
                    "BBN APPLICATIONS OPEN",
                    "TECH FEST LAGOS - DEC",
                  ].map((news, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 sm:gap-2 shrink-0"
                    >
                      <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-blue-500" />
                      <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-[0.2em] text-slate-400">
                        {news}
                      </span>
                    </div>
                  ))}
            </div>
          </div>

          <div className="px-4 sm:px-6 md:px-8 py-6 sm:py-8 lg:px-12 max-w-[1600px] mx-auto">
            {/* Professional Header */}
            <header className="mb-8 sm:mb-12 space-y-3 sm:space-y-2">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black italic tracking-tighter uppercase leading-tight sm:leading-none">
                  Global <span className="text-slate-600">Updates</span>
                </h1>
              </div>
            </header>

            {/* Quick Filter / Categorization */}
            <div className="flex flex-wrap gap-2 mb-6 sm:mb-10 pb-3 sm:pb-4 border-b border-white/5 overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              {[
                "All Updates",
                "Sports",
                "Politics",
                "Tech",
                "Entertainment",
              ].map((cat) => (
                <button
                  key={cat}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-widest hover:bg-white hover:text-black transition-all duration-300 whitespace-nowrap shrink-0"
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 sm:py-32">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
                {/* Column 1: TRENDING (The "Big" News) */}
                <div className="lg:col-span-8 space-y-6 sm:space-y-8">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <h2 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white">
                      High Volatility Updates
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {events?.trending?.map((event, index) => (
                      <div
                        key={index}
                        className="group relative border border-white/5 overflow-hidden hover:bg-white/2 transition-all duration-500 rounded-xl"
                      >
                        {/* Side Accent */}
                        <div className="absolute top-0 left-0 w-[2px] h-0 group-hover:h-full bg-blue-500 transition-all duration-500 z-10" />

                        {/* Image */}
                        {event.imageUrl && (
                          <div className="relative w-full h-48 sm:h-56 overflow-hidden">
                            <Image
                              src={event.imageUrl}
                              alt={event.title}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-110"
                              unoptimized
                            />
                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent" />
                            {/* Category badge */}
                            <div className="absolute top-3 left-3 z-20">
                              <span className="text-[8px] sm:text-[9px] font-black text-blue-400 uppercase tracking-wider sm:tracking-widest border border-blue-500/30 bg-black/50 backdrop-blur-sm px-2 py-1 rounded">
                                {event.category}
                              </span>
                            </div>
                            {/* Time badge */}
                            <div className="absolute top-3 right-3 z-20">
                              <span className="text-[8px] sm:text-[9px] font-bold text-white/90 bg-black/50 backdrop-blur-sm px-2 py-1 rounded">
                                {(() => {
                                  const now = new Date();
                                  const published = new Date(event.publishedAt);
                                  const diffInSeconds = Math.floor(
                                    (now.getTime() - published.getTime()) / 1000
                                  );
                                  if (diffInSeconds < 60) return "just now";
                                  if (diffInSeconds < 3600)
                                    return `${Math.floor(
                                      diffInSeconds / 60
                                    )}m ago`;
                                  if (diffInSeconds < 86400)
                                    return `${Math.floor(
                                      diffInSeconds / 3600
                                    )}h ago`;
                                  return `${Math.floor(
                                    diffInSeconds / 86400
                                  )}d ago`;
                                })()}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="p-4 sm:p-6">
                          {!event.imageUrl && (
                            <div className="flex justify-between items-start mb-3 sm:mb-4 gap-2">
                              <span className="text-[8px] sm:text-[9px] font-black text-blue-500 uppercase tracking-wider sm:tracking-widest border border-blue-500/20 px-1.5 sm:px-2 py-0.5 shrink-0">
                                {event.category}
                              </span>
                              <span className="text-[8px] sm:text-[9px] font-bold text-slate-600 italic shrink-0">
                                {(() => {
                                  const now = new Date();
                                  const published = new Date(event.publishedAt);
                                  const diffInSeconds = Math.floor(
                                    (now.getTime() - published.getTime()) / 1000
                                  );
                                  if (diffInSeconds < 60) return "just now";
                                  if (diffInSeconds < 3600)
                                    return `${Math.floor(
                                      diffInSeconds / 60
                                    )}m ago`;
                                  if (diffInSeconds < 86400)
                                    return `${Math.floor(
                                      diffInSeconds / 3600
                                    )}h ago`;
                                  return `${Math.floor(
                                    diffInSeconds / 86400
                                  )}d ago`;
                                })()}
                              </span>
                            </div>
                          )}

                          <h3
                            className={cn(
                              "font-bold text-white mb-3 sm:mb-4 leading-tight group-hover:text-blue-400 transition-colors line-clamp-2",
                              event.imageUrl
                                ? "text-base sm:text-lg md:text-xl"
                                : "text-base sm:text-lg md:text-xl"
                            )}
                          >
                            {event.title}
                          </h3>

                          <p className="text-[11px] sm:text-xs text-slate-400 mb-4 sm:mb-6 line-clamp-2 sm:line-clamp-3 font-medium leading-relaxed">
                            {event.description}
                          </p>

                          <Button
                            onClick={() => setCreateMarketModalOpen(true)}
                            className="w-full bg-transparent border border-white/10 hover:bg-white hover:text-black text-[9px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-widest h-9 sm:h-11 transition-all"
                          >
                            <span className="flex items-center justify-center gap-1.5 sm:gap-2">
                              Predict This Event
                              <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 2: FEED / ANNOUNCEMENTS (The "Side" Intel) */}
                <div className="lg:col-span-4 space-y-6 sm:space-y-8 mt-6 lg:mt-0">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
                    <h2 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white">
                      Calendar & Intel
                    </h2>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    {events?.latest?.map((event, index) => (
                      <div
                        key={index}
                        className="border-b border-white/5 pb-3 sm:pb-4 group cursor-pointer"
                      >
                        <div className="flex gap-3 sm:gap-4">
                          {event.imageUrl ? (
                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-lg overflow-hidden border border-white/10">
                              <Image
                                src={event.imageUrl}
                                alt={event.title}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-110"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 border border-white/10 flex flex-col items-center justify-center bg-white/2">
                              <span className="text-[9px] sm:text-[10px] font-black text-white leading-none">
                                {new Date(event.publishedAt).getDate()}
                              </span>
                              <span className="text-[7px] sm:text-[8px] font-bold text-slate-500 uppercase">
                                {new Date(event.publishedAt).toLocaleDateString(
                                  "en-US",
                                  { month: "short" }
                                )}
                              </span>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 sm:truncate">
                              {event.title}
                            </h4>
                            <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium uppercase tracking-tight mt-1">
                              {event.country || "Continental Update"} •{" "}
                              {event.source}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* PROPHET CTA */}
                  <div className="p-5 sm:p-6 md:p-8 border border-blue-500/20 bg-blue-500/2 relative overflow-hidden">
                    <Zap className="absolute -bottom-2 -right-2 sm:-bottom-4 sm:-right-4 w-16 h-16 sm:w-24 sm:h-24 text-blue-500/10 rotate-12" />
                    <h3 className="text-sm sm:text-base md:text-lg font-black italic uppercase leading-tight mb-2">
                      Have your own Intel?
                    </h3>
                    <p className="text-[10px] sm:text-xs text-slate-400 mb-4 sm:mb-6">
                      Create a custom market and earn protocol fees.
                    </p>
                    <Button
                      onClick={() => setCreateMarketModalOpen(true)}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-wider sm:tracking-widest text-[9px] sm:text-[10px] h-9 sm:h-10"
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
        @media (max-width: 640px) {
          .animate-marquee {
            animation-duration: 20s;
          }
        }
      `}</style>
    </div>
  );
}
