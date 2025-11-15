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
        "Start predicting with as little as $0.25. No huge stakes required. Everyone can play and win.",
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
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#1E293B]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">Why Prophet?</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            The first prediction market built for African entertainment and
            culture
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="bg-[#0F172A] border-[#334155]">
                <CardHeader>
                  <div className="w-12 h-12 bg-[#2563EB]/10 border border-[#2563EB]/20 rounded-lg flex items-center justify-center mb-6">
                    <Icon className="w-6 h-6 text-[#2563EB]" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-400 leading-relaxed">
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
