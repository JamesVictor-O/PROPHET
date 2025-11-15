import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users } from "lucide-react";

export function Hero() {
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <div className="inline-block bg-[#1E293B] border border-[#334155] rounded-full px-4 py-1.5 mb-6">
              <span className="text-sm text-gray-300">
                🎯 Built on Celo • Powered by MiniPay
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Predict.
              <br />
              Earn.
              <br />
              <span className="text-[#2563EB]">Win.</span>
            </h1>

            <p className="text-xl text-gray-400 mb-8 leading-relaxed">
              Turn your entertainment knowledge into earnings. Predict music
              drops, movie success, and pop culture moments. Get rewarded for
              being right.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button
                size="lg"
                className="bg-[#2563EB] text-white hover:bg-blue-700"
              >
                Start Predicting
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-[#1E293B] border-[#334155] text-white hover:bg-[#334155]"
              >
                Watch Demo
              </Button>
            </div>

          </div>

          {/* Right Content - Featured Market */}
          <div className="lg:pl-12">
            <Card className="bg-[#1E293B] border-[#334155]">
              {/* Market Header */}
              <div className="bg-[#2563EB] p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge
                    variant="secondary"
                    className="bg-white/20 text-white border-0"
                  >
                    MUSIC
                  </Badge>
                  <span className="text-sm font-medium">Ends in 3 days</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">
                  Will Burna Boy drop an album in Q4 2024?
                </h3>
                <p className="text-sm opacity-90">
                  Official announcement on social media counts as confirmation
                </p>
              </div>

              {/* Market Stats */}
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-4">
                    <div className="text-4xl font-bold text-green-400 mb-1">
                      68%
                    </div>
                    <div className="text-sm text-gray-400 mb-3">YES</div>
                    <Button className="w-full bg-green-600 text-white hover:bg-green-700">
                      Predict YES
                    </Button>
                  </div>
                  <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-4">
                    <div className="text-4xl font-bold text-red-400 mb-1">
                      32%
                    </div>
                    <div className="text-sm text-gray-400 mb-3">NO</div>
                    <Button
                      variant="outline"
                      className="w-full bg-dark-700 border-dark-700 text-white hover:bg-dark-600"
                    >
                      Predict NO
                    </Button>
                  </div>
                </div>

                {/* Pool Info */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>1,234 predictions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-[#2563EB] rounded-full"></div>
                    <span className="text-gray-400">Pool: $890</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
