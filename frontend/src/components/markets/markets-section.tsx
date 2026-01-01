"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { BinaryChart } from "./binary-chart";

// Category color mapping
const categoryColors: Record<string, string> = {
  music: "bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20",
  movies: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "reality-tv": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  awards: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  sports: "bg-green-500/10 text-green-400 border-green-500/20",
  other: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

// Category display names
const categoryDisplayNames: Record<string, string> = {
  music: "MUSIC",
  movies: "MOVIES",
  "reality-tv": "REALITY TV",
  awards: "AWARDS",
  sports: "SPORTS",
  other: "OTHER",
};

import { useEnvioMarkets, EnvioMarket } from "@/hooks/useEnvioData";
import { formatTokenAmount } from "@/lib/utils";
import { useChainId } from "wagmi";

export function MarketsSection() {
  const chainId = useChainId();
  const { data: envioData, isLoading } = useEnvioMarkets();

  const marketsData = envioData?.Market?.map((m: EnvioMarket) => {
    const totalPool = BigInt(m.totalPool || 0);
    const yesPool = BigInt(m.yesPool || 0);
    const noPool = BigInt(m.noPool || 0);

    let yesPercent = 50;
    let noPercent = 50;
    if (totalPool > BigInt(0)) {
      yesPercent = Number((yesPool * BigInt(10000)) / totalPool) / 100;
      noPercent = Number((noPool * BigInt(10000)) / totalPool) / 100;
    }

    const endTime = Number(m.endTime);
    const now = Math.floor(Date.now() / 1000);
    const secondsLeft = endTime - now;
    let timeLeft = "Ended";
    if (secondsLeft > 0) {
      const days = Math.floor(secondsLeft / 86400);
      const hours = Math.floor((secondsLeft % 86400) / 3600);
      timeLeft =
        days > 0
          ? `${days}d left`
          : hours > 0
          ? `${hours}h left`
          : `${Math.floor(secondsLeft / 60)}m left`;
    }

    return {
      ...m,
      yesPercent,
      noPercent,
      timeLeft,
      poolFormatted: `$${Number(formatTokenAmount(totalPool, chainId)).toFixed(
        2
      )}`,
    };
  });

  // Show up to 3 markets on homepage
  const displayMarkets = marketsData?.slice(0, 3) || [];

  return (
    <section id="markets" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-4xl font-bold mb-2">Live Markets</h2>
            <p className="text-gray-400">
              Active predictions you can join right now
            </p>
          </div>
          <Link href="/dashboard">
            <Button
              variant="outline"
              className="hidden md:block bg-[#1E293B] border-[#334155] text-white hover:bg-[#334155]"
            >
              View All Markets
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#2563EB]" />
            <p className="text-gray-400">Loading markets...</p>
          </div>
        ) : displayMarkets.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayMarkets.map((market) => {
              const categoryKey = market.category.toLowerCase();
              const categoryColor =
                categoryColors[categoryKey] || categoryColors.other;
              const categoryDisplay =
                categoryDisplayNames[categoryKey] ||
                market.category.toUpperCase();

              return (
                <Card
                  key={market.id}
                  className="bg-[#1E293B] border-[#334155] hover:border-[#2563EB] transition-colors"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge
                        className={`text-xs font-semibold ${categoryColor}`}
                      >
                        {categoryDisplay}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {market.timeLeft}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold mb-3 leading-snug">
                      {market.question}
                    </h3>

                    <div className="mb-4">
                      <BinaryChart
                        yesPercent={market.yesPercent}
                        noPercent={market.noPercent}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                      <span>Pool: {market.poolFormatted}</span>
                    </div>

                    <Link href="/dashboard">
                      <Button className="w-full bg-[#2563EB] text-white hover:bg-blue-700">
                        Place Prediction
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-4">
              No markets available yet
            </p>
            <Link href="/dashboard">
              <Button className="bg-[#2563EB] text-white hover:bg-blue-700">
                Create First Market
              </Button>
            </Link>
          </div>
        )}

        {displayMarkets.length > 0 && (
          <div className="text-center mt-8 md:hidden">
            <Link href="/dashboard">
              <Button
                variant="outline"
                className="bg-[#1E293B] border-[#334155] text-white hover:bg-[#334155]"
              >
                View All Markets
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
