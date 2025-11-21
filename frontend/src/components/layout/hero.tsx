"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Wallet } from "lucide-react";
import { useAccount, useConnect } from "wagmi";
import { isMiniPayAvailable } from "@/lib/wallet-config";
import { toast } from "sonner";

export function Hero() {
  const { isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();

  const handleConnect = () => {
    const minipayConnector = connectors.find((c) => c.id === "injected");
    if (minipayConnector) {
      connect({ connector: minipayConnector });
    } else {
      toast.error(
        "MiniPay not detected. Please open in Opera browser with MiniPay enabled."
      );
    }
  };

  return (
    <section className="pt-20 sm:pt-24 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 h-screen overflow-hidden flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col justify-center items-center">
        {/* Text Content - Takes natural space */}
        <div className="text-center flex flex-col items-center justify-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight px-2">
            Turn Your Entertainment Knowledge
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            Into
            <span className="text-[#2563EB]"> Earnings.</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-6 sm:mb-8 leading-relaxed text-center max-w-4xl px-4">
            Monetize your cultural knowledge. Predict Afrobeats releases,
            Nollywood hits, and reality TV outcomes. Earn when
            you&apos;re right.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-12 w-full sm:w-auto px-4 sm:px-0">
            {typeof window !== "undefined" && isConnected ? (
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto bg-white text-black hover:bg-blue-700 rounded-full px-6 py-3 text-sm sm:text-base"
              >
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center"
                >
                  Start Predicting
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 ml-2 bg-black rounded-full p-1 text-white" />
                </Link>
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={handleConnect}
                disabled={isPending}
                className="w-full sm:w-auto bg-white text-black hover:bg-blue-700 rounded-full px-6 py-3 text-sm sm:text-base"
              >
                {isPending ? (
                  "Connecting..."
                ) : (
                  <>
                    {typeof window !== "undefined" && isMiniPayAvailable()
                      ? "Connect MiniPay"
                      : "Connect Wallet"}
                    <Wallet className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Visual Content - Takes remaining space */}
        <div className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl flex-1 border-2 sm:border-3 rounded-xl sm:rounded-2xl items-center justify-center border-[#7a9fed] bg-gradient-to-br from-[#1E293B] to-[#0F172A] h-64 sm:h-80 md:h-96 relative overflow-hidden mx-4 sm:mx-0">
          <div className="relative z-10 h-full flex items-center justify-center overflow-hidden">
            <Image
              width={1000}
              height={1000}
              src="/dashboard.png"
              alt="Dashboard Preview"
              className="w-full h-full object-contain rounded-xl sm:rounded-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
