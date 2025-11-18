"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useLeaderboard } from "@/hooks/contracts";

export function LeaderboardSection() {
  const { data: entries, isLoading, isError } = useLeaderboard(3); // Show top 3

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#1E293B]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-2">Top Prophets</h2>
          <p className="text-gray-400">
            The most accurate predictors this month
          </p>
        </div>

        {isLoading ? (
          <Card className="max-w-3xl mx-auto bg-[#0F172A] border-dark-700">
            <CardContent className="p-12">
              <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
                <p className="text-gray-400">Loading leaderboard...</p>
              </div>
            </CardContent>
          </Card>
        ) : isError ? (
          <Card className="max-w-3xl mx-auto bg-[#0F172A] border-dark-700">
            <CardContent className="p-12">
              <div className="text-center">
                <p className="text-red-400 mb-2">Error loading leaderboard</p>
                <p className="text-gray-400 text-sm">
                  Please check your connection and try again
                </p>
              </div>
            </CardContent>
          </Card>
        ) : entries && entries.length > 0 ? (
          <Card className="max-w-3xl mx-auto bg-[#0F172A] border-dark-700">
            <CardContent className="p-0">
              <div className="divide-y divide-dark-700">
                {entries.map((entry) => (
                  <div
                    key={entry.address}
                    className="p-6 hover:bg-[#1E293B] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`text-2xl font-bold ${
                            entry.rank === 1
                              ? "text-[#2563EB]"
                              : "text-gray-400"
                          }`}
                        >
                          {entry.rank}
                        </div>
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            entry.rank === 1 ? "bg-[#2563EB]" : "bg-gray-600"
                          }`}
                        >
                          <span className="text-white font-bold">
                            {entry.initials}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold">{entry.username}</div>
                          <div className="text-sm text-gray-400">
                            {entry.wins} wins • {entry.accuracy}% accuracy
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-400">
                          {entry.earned}
                        </div>
                        <div className="text-xs text-gray-400">earned</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="max-w-3xl mx-auto bg-[#0F172A] border-dark-700">
            <CardContent className="p-12">
              <div className="text-center">
                <p className="text-gray-400 mb-2">No leaderboard data yet</p>
                <p className="text-gray-500 text-sm">
                  Start making predictions to see the top prophets!
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center mt-8">
          <Button className="bg-[#2563EB] text-white hover:bg-blue-700">
            View Full Leaderboard
          </Button>
        </div>
      </div>
    </section>
  );
}
