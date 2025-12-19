"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useAllMarkets } from "@/hooks/contracts/useAllMarkets";
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

export function MarketsSection() {
  const { data: marketsData, isLoading } = useAllMarkets();

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
