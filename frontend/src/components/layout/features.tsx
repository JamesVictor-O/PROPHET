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
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">Features</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Everything you need to become a top prophet
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="feature-card bg-[#1E293B] border-[#334155]"
              >
                <CardContent className="p-8">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-[#2563EB]/10 border border-[#2563EB]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-[#2563EB]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-400">{feature.description}</p>
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
