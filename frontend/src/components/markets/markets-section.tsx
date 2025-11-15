import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Market {
  category: string;
  categoryColor: string;
  timeLeft: string;
  question: string;
  yesPercent: number;
  noPercent: number;
  predictions: number;
  pool: string;
}

const markets: Market[] = [
  {
    category: "MUSIC",
    categoryColor: "bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20",
    timeLeft: "3 days left",
    question: "Will Wizkid's new single hit 5M streams in week 1?",
    yesPercent: 73,
    noPercent: 27,
    predictions: 456,
    pool: "$342",
  },
  {
    category: "REALITY TV",
    categoryColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    timeLeft: "2 days left",
    question: "Will Sarah be evicted from BBNaija this week?",
    yesPercent: 58,
    noPercent: 42,
    predictions: 1023,
    pool: "$678",
  },
  {
    category: "MOVIES",
    categoryColor: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    timeLeft: "5 days left",
    question: "Will 'King of Thieves 2' make ₦50M opening weekend?",
    yesPercent: 65,
    noPercent: 35,
    predictions: 789,
    pool: "$523",
  },
];

export function MarketsSection() {
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
          <Button
            variant="outline"
            className="hidden md:block bg-[#1E293B] border-[#334155] text-white hover:bg-[#334155]"
          >
            View All Markets
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {markets.map((market, index) => (
            <Card
              key={index}
              className="bg-[#1E293B] border-[#334155] hover:border-[#2563EB] transition-colors"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge
                    className={`text-xs font-semibold ${market.categoryColor}`}
                  >
                    {market.category}
                  </Badge>
                  <span className="text-xs text-gray-400">
                    {market.timeLeft}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-3 leading-snug">
                  {market.question}
                </h3>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-400 mb-1">
                      {market.yesPercent}%
                    </div>
                    <div className="text-xs text-gray-400">YES</div>
                  </div>
                  <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-red-400 mb-1">
                      {market.noPercent}%
                    </div>
                    <div className="text-xs text-gray-400">NO</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                  <span>{market.predictions.toLocaleString()} predictions</span>
                  <span>Pool: {market.pool}</span>
                </div>

                <Button className="w-full bg-[#2563EB] text-white hover:bg-blue-700">
                  Place Prediction
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8 md:hidden">
          <Button
            variant="outline"
            className="bg-[#1E293B] border-[#334155] text-white hover:bg-[#334155]"
          >
            View All Markets
          </Button>
        </div>
      </div>
    </section>
  );
}
