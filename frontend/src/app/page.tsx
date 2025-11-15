import { Navigation } from "@/components/layout/navigation";
import { Hero } from "@/components/layout/hero";
import { WhyProphet } from "@/components/layout/why-prophet";
import { Features } from "@/components/layout/features";
import { HowItWorks } from "@/components/layout/how-it-works";
import { MarketsSection } from "@/components/markets/markets-section";
import { LeaderboardSection } from "@/components/leaderboard/leaderboard-section";
import { Footer } from "@/components/layout/footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <Hero />
      <WhyProphet />
      <Features />
      <HowItWorks />
      <MarketsSection />
      <LeaderboardSection />
      <Footer />
    </main>
  );
}
