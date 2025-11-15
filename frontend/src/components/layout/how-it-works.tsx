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
      className="py-20 px-4 sm:px-6 lg:px-8 bg-[#1E293B]"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Start predicting and earning in 3 simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-[#2563EB] text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                {step.number}
              </div>
              <h3 className="text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-gray-400 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <Card className="mt-16 bg-[#0F172A] border-[#334155]">
          <CardContent className="p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-3xl font-bold mb-4">
                  Example: How You Win
                </h3>
                <div className="space-y-4 text-gray-400">
                  {exampleSteps.map((step, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          index === exampleSteps.length - 1
                            ? "bg-green-500/20 border border-green-500/40"
                            : "bg-[#2563EB]/10 border border-[#2563EB]/20"
                        }`}
                      >
                        <Check
                          className={`w-3 h-3 ${
                            index === exampleSteps.length - 1
                              ? "text-green-400"
                              : "text-[#2563EB]"
                          }`}
                        />
                      </div>
                      <p
                        className={
                          index === exampleSteps.length - 1
                            ? "text-white font-semibold"
                            : ""
                        }
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

              <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-[#334155]">
                    <span className="text-gray-400 text-sm">Your Stake</span>
                    <span className="text-white font-semibold">$5.00</span>
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-[#334155]">
                    <span className="text-gray-400 text-sm">Total Pool</span>
                    <span className="text-white font-semibold">$890.00</span>
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-[#334155]">
                    <span className="text-gray-400 text-sm">
                      Your Share (YES wins)
                    </span>
                    <span className="text-white font-semibold">0.82%</span>
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-[#334155]">
                    <span className="text-gray-400 text-sm">
                      Platform Fee (5%)
                    </span>
                    <span className="text-white font-semibold">$44.50</span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-gray-400 text-sm font-semibold">
                      You Win
                    </span>
                    <span className="text-green-400 font-bold text-xl">
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
