import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface LeaderboardEntry {
  rank: number;
  initials: string;
  username: string;
  wins: number;
  accuracy: number;
  earned: string;
}

const entries: LeaderboardEntry[] = [
  {
    rank: 1,
    initials: "PJ",
    username: "@philip.jr",
    wins: 23,
    accuracy: 87,
    earned: "$1,500",
  },
  {
    rank: 2,
    initials: "JL",
    username: "@jessica.lee",
    wins: 19,
    accuracy: 82,
    earned: "$1,200",
  },
  {
    rank: 3,
    initials: "TA",
    username: "@thomas.anderson",
    wins: 15,
    accuracy: 79,
    earned: "$890",
  },
];

export function LeaderboardSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#1E293B]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-2">Top Prophets</h2>
          <p className="text-gray-400">
            The most accurate predictors this month
          </p>
        </div>

        <Card className="max-w-3xl mx-auto bg-[#0F172A] border-[#334155]">
          <CardContent className="p-0">
            <div className="divide-y divide-[#334155]">
              {entries.map((entry) => (
                <div
                  key={entry.rank}
                  className="p-6 hover:bg-[#1E293B] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`text-2xl font-bold ${
                          entry.rank === 1 ? "text-[#2563EB]" : "text-gray-400"
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

        <div className="text-center mt-8">
          <Button className="bg-[#2563EB] text-white hover:bg-blue-700">
            View Full Leaderboard
          </Button>
        </div>
      </div>
    </section>
  );
}
