import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      number: "1",
      title: "Connect Wallet",
      description:
        "Open Prophet in MiniPay. Connect with one tap. No complex setup required.",
    },
    {
      number: "2",
      title: "Choose & Predict",
      description:
        "Browse active markets. Pick your prediction. Stake from $0.25 to $20 per market.",
    },
    {
      number: "3",
      title: "Win & Earn",
      description:
        "When you're right, you win a share of the pool. Paid out automatically to your wallet.",
    },
  ];

  const exampleSteps = [
    'You predict "YES, Burna Boy will drop an album" with a $5 stake',
    "Total pool reaches $890 from 1,234 predictions",
    'Burna announces album → Market resolves to "YES"',
    "You win $7.35 (47% profit!) paid instantly to your wallet",
  ];

  return (
    <section
      id="how-it-works"
      className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-[#1E293B]"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">How It Works</h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto px-4">
            Start predicting and earning in 3 simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-[#2563EB] text-white rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-bold mx-auto mb-4 sm:mb-6">
                {step.number}
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">{step.title}</h3>
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed px-2">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <Card className="mt-8 sm:mt-12 md:mt-16 bg-[#0F172A] border-[#334155]">
          <CardContent className="p-4 sm:p-6 md:p-8 lg:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start md:items-center">
              <div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6">
                  Example: How You Win
                </h3>
                <div className="space-y-3 sm:space-y-4 text-gray-400">
                  {exampleSteps.map((step, index) => (
                    <div key={index} className="flex items-start space-x-2 sm:space-x-3">
                      <div
                        className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          index === exampleSteps.length - 1
                            ? "bg-green-500/20 border border-green-500/40"
                            : "bg-[#2563EB]/10 border border-[#2563EB]/20"
                        }`}
                      >
                        <Check
                          className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${
                            index === exampleSteps.length - 1
                              ? "text-green-400"
                              : "text-[#2563EB]"
                          }`}
                        />
                      </div>
                      <p
                        className={`text-sm sm:text-base ${
                          index === exampleSteps.length - 1
                            ? "text-white font-semibold"
                            : ""
                        }`}
                      >
                        {index === exampleSteps.length - 1 ? (
                          <strong className="text-white">{step}</strong>
                        ) : (
                          step
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#334155]">
                    <span className="text-gray-400 text-xs sm:text-sm">Your Stake</span>
                    <span className="text-white font-semibold text-sm sm:text-base">$5.00</span>
                  </div>
                  <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#334155]">
                    <span className="text-gray-400 text-xs sm:text-sm">Total Pool</span>
                    <span className="text-white font-semibold text-sm sm:text-base">$890.00</span>
                  </div>
                  <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#334155]">
                    <span className="text-gray-400 text-xs sm:text-sm">
                      Your Share (YES wins)
                    </span>
                    <span className="text-white font-semibold text-sm sm:text-base">0.82%</span>
                  </div>
                  <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#334155]">
                    <span className="text-gray-400 text-xs sm:text-sm">
                      Platform Fee (5%)
                    </span>
                    <span className="text-white font-semibold text-sm sm:text-base">$44.50</span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-gray-400 text-xs sm:text-sm font-semibold">
                      You Win
                    </span>
                    <span className="text-green-400 font-bold text-lg sm:text-xl">
                      $7.35
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
