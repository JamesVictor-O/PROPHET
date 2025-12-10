import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, Shield, Smartphone } from "lucide-react";

export function WhyProphet() {
  const features = [
    {
      icon: DollarSign,
      title: "Low Entry, High Rewards",
      description:
        "Start predicting with as little as $0.0025. No huge stakes required. Everyone can play and win.",
    },
    {
      icon: Shield,
      title: "Fair & Transparent",
      description:
        "Smart contracts ensure automatic payouts. No middlemen. No manipulation. Just pure prediction markets.",
    },
    {
      icon: Smartphone,
      title: "Mobile-First",
      description:
        "Built for MiniPay. Predict anywhere, anytime. Native mobile experience that just works.",
    },
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-[#1E293B]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">Why Prophet?</h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto px-4">
            The first prediction market built for African entertainment and
            culture
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="bg-[#0F172A] border-[#334155]">
                <CardHeader className="p-4 sm:p-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#2563EB]/10 border border-[#2563EB]/20 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#2563EB]" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <CardDescription className="text-sm sm:text-base text-gray-400 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
