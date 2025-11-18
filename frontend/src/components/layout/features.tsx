import { Card, CardContent } from "@/components/ui/card";
import { Music, Film, Tv, Zap, Award, Share2 } from "lucide-react";

export function Features() {
  const features = [
    {
      icon: Music,
      title: "Music Markets",
      description:
        "Predict album drops, streaming milestones, and chart positions for Afrobeats, Amapiano, and more.",
    },
    {
      icon: Film,
      title: "Movie Success",
      description:
        "Predict Nollywood box office, streaming views, and award nominations before they happen.",
    },
    {
      icon: Tv,
      title: "Reality TV",
      description:
        "BBNaija evictions, The Voice winners, and reality show outcomes. Weekly fresh markets.",
    },
    {
      icon: Zap,
      title: "Instant Payouts",
      description:
        "Win and get paid immediately. Smart contracts handle everything automatically.",
    },
    {
      icon: Award,
      title: "Reputation System",
      description:
        "Build your prophet score. Win streaks unlock bonuses and exclusive markets.",
    },
    {
      icon: Share2,
      title: "Social Sharing",
      description:
        "Share your predictions on Twitter. Challenge friends. Build your prophet brand.",
    },
  ];

  return (
    <section id="features" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">Features</h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto px-4">
            Everything you need to become a top prophet
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="feature-card bg-[#1E293B] border-[#334155]"
              >
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#2563EB]/10 border border-[#2563EB]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#2563EB]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold mb-1 sm:mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-400 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
