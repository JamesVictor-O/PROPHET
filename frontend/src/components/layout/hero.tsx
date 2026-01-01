"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Wallet, Zap, TrendingUp } from "lucide-react";
import { useAccount, useConnect } from "wagmi";
import { isMiniPayAvailable, formatAddress } from "@/lib/wallet-config";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useRecentPredictionsGraphQL } from "@/hooks/graphql";

export function Hero() {
  const { isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  // Use lazy initializers to avoid useEffect
  const [mounted] = useState(() => typeof window !== "undefined");
  const [isMiniPay] = useState(() => isMiniPayAvailable());

  // Fetch recent prediction events for live ticker
  const { data: recentPredictions = [], isLoading: isLoadingPredictions } =
    useRecentPredictionsGraphQL(10);

  // Get 3 most recent events for the ticker
  const tickerItems = useMemo(() => {
    return recentPredictions.slice(0, 3);
  }, [recentPredictions]);

  const handleConnect = () => {
    const minipayConnector = connectors.find((c) => c.id === "injected");
    if (minipayConnector) {
      connect({ connector: minipayConnector });
    } else {
      toast.error("Connect via MiniPay to begin.");
    }
  };

  return (
    <section className="relative min-h-screen pt-20 flex items-center bg-[#020617] overflow-hidden">
      {/* Background Kinetic Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        {/* Left Side: The Hook */}
        <div className="lg:col-span-7 space-y-10">
          <div className="space-y-6">
            <h1 className="text-6xl md:text-8xl font-black text-white italic tracking-tighter leading-[0.85] uppercase">
              Culture <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-white to-slate-700">
                Is Your Asset.
              </span>
            </h1>

            <p className="text-slate-400 text-lg md:text-xl max-w-xl font-medium leading-relaxed italic">
              Monetize your gut feeling. Predict the pulse of African music,
              film, and entertainment. Built for the streets, settled on the
              chain.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-5">
            {mounted && isConnected ? (
              <Button
                asChild
                size="lg"
                className="h-16 px-10 bg-white text-black hover:bg-emerald-400 rounded-2xl transition-all duration-300 group shadow-2xl shadow-white/5"
              >
                <Link
                  href="/dashboard/home"
                  className="flex items-center gap-3 text-xs font-black uppercase tracking-widest"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </Link>
              </Button>
            ) : (
              <Button
                onClick={handleConnect}
                disabled={isPending}
                className="h-16 px-10 bg-white text-black hover:bg-blue-500 hover:text-white rounded-2xl transition-all duration-300 shadow-2xl shadow-white/5"
              >
                <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest">
                  {isPending
                    ? "Syncing..."
                    : mounted && isMiniPay
                    ? "Connect MiniPay"
                    : "Connect Wallet"}
                  <Wallet className="w-4 h-4" />
                </div>
              </Button>
            )}

            <div className="flex items-center gap-6 px-4">
              <HeroStat label="Active Pools" value="$12.4k+" />
              <div className="h-8 w-px bg-white/10" />
              <HeroStat label="Settled" value="1.2k+" />
            </div>
          </div>
        </div>

        {/* Right Side: The Visual flex */}
        <div className="lg:col-span-5 relative group">
          <div className="absolute -inset-1  rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>

          <div className="relative aspect-[4/5] lg:aspect-square bg-[#0F172A] border border-white/10 rounded-[2.5rem] p-4 overflow-hidden shadow-2xl">
            {/* Overlay Gradient for depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent z-20" />

            <Image
              src="/dashboard.png"
              alt="Prophet Terminal"
              fill
              className="object-cover object-top opacity-80 group-hover:scale-105 transition-transform duration-700"
              priority
            />

            {/* Floating UI Elements for "Magic" */}
            <div className="absolute top-10 right-[-20px] bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl z-30 animate-bounce transition-all duration-[3000ms]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[8px] uppercase tracking-widest text-slate-500 font-bold">
                    New Win
                  </p>
                  <p className="text-xs font-black text-white">+$18.42</p>
                </div>
              </div>
            </div>

            <div className="absolute bottom-10 left-10 right-10 z-30">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-3xl space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
                    Trending Market
                  </p>
                  <Zap className="w-3 h-3 text-blue-400 fill-blue-400" />
                </div>
                <p className="text-sm font-bold text-white leading-tight">
                  Will Burna Boy win a Grammy in 2026?
                </p>
                <div className="flex gap-2">
                  <div className="h-1 flex-1 bg-blue-500 rounded-full" />
                  <div className="h-1 w-1/3 bg-white/10 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    
      <div className="absolute bottom-0 w-full py-6 bg-white/[0.02] border-t border-white/5 backdrop-blur-sm hidden md:block">
        <div className="max-w-[1400px] mx-auto px-12 flex justify-between items-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
            Live Prediction Stream
          </p>
          <div className="flex gap-12">
            {isLoadingPredictions ? (
              // Show loading placeholders
              <>
                <TickerItem
                  user="Loading..."
                  action="syncing"
                  market="..."
                  color="text-slate-500"
                />
                <TickerItem
                  user="Loading..."
                  action="syncing"
                  market="..."
                  color="text-slate-500"
                />
                <TickerItem
                  user="Loading..."
                  action="syncing"
                  market="..."
                  color="text-slate-500"
                />
              </>
            ) : tickerItems.length > 0 ? (
              // Show real events
              tickerItems.map((event) => (
                <TickerItem
                  key={event.id}
                  user={formatAddress(event.user)}
                  action={
                    event.action === "won"
                      ? `won ${event.amount}`
                      : event.action
                  }
                  market={
                    event.marketQuestion.length > 20
                      ? `${event.marketQuestion.slice(0, 20)}...`
                      : event.marketQuestion
                  }
                  color={event.color}
                />
              ))
            ) : (
              // Show fallback if no events
              <>
                <TickerItem
                  user="0x0...000"
                  action="predicted YES"
                  market="No recent activity"
                  color="text-slate-500"
                />
                <TickerItem
                  user="0x0...000"
                  action="predicted NO"
                  market="No recent activity"
                  color="text-slate-500"
                />
                <TickerItem
                  user="0x0...000"
                  action="predicted YES"
                  market="No recent activity"
                  color="text-slate-500"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
        {label}
      </span>
      <span className="text-xl font-bold text-white tracking-tighter">
        {value}
      </span>
    </div>
  );
}

interface TickerItemProps {
  user: string;
  action: string;
  market: string;
  color?: string;
}

function TickerItem({
  user,
  action,
  market,
  color = "text-blue-400",
}: TickerItemProps) {
  return (
    <div className="flex items-center gap-2 text-[10px] font-bold tracking-tight">
      <span className="text-slate-500 font-mono">{user}</span>
      <span className={cn("uppercase", color)}>{action}</span>
      <span className="text-white italic">on {market}</span>
    </div>
  );
}
