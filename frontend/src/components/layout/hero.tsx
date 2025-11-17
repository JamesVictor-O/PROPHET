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
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 h-screen flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col justify-center items-center">
        {/* Text Content - Takes natural space */}
        <div className="text-center flex flex-col items-center justify-center mb-8">
          <h1 className="text-5xl sm:text-6xl text-center lg:text-5xl font-bold mb-6 leading-tight">
            Turn Your Entertainment Knowledge
            <br />
            Into
            <span className="text-[#2563EB]"> Earnings.</span>
          </h1>
          <p className="text-2xl text-gray-400 mb-8 leading-relaxed text-center max-w-4xl">
            Turn your entertainment knowledge into earnings. Predict music
            drops, movie success, and pop culture moments. Get rewarded for
            being right.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-12 ">
            {isConnected ? (
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="bg-white text-black hover:bg-blue-700 rounded-full px-6 py-3"
                >
                  Start Predicting
                  <ArrowRight className="w-7 h-7 ml-2 bg-black rounded-full p-1 text-white" />
                </Button>
              </Link>
            ) : (
              <Button
                size="lg"
                onClick={handleConnect}
                disabled={isPending}
                className="bg-white text-black hover:bg-blue-700 rounded-full px-6 py-3"
              >
                {isPending ? (
                  "Connecting..."
                ) : (
                  <>
                    {isMiniPayAvailable()
                      ? "Connect MiniPay"
                      : "Connect Wallet"}
                    <Wallet className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Visual Content - Takes remaining space */}
        <div className="flex-1 border-3 rounded-2xl items-center justify-center  border-[#7a9fed] bg-linear-to-br from-[#1E293B] to-[#0F172A] h-80 md:w-96  relative overflow-hidden">
          <div className="relative z-10  h-full flex items-center justify-center   overflow-hidden">
            <Image
              width={1000}
              height={1000}
              src="/dashboard.png"
              alt="Dashboard Preview"
              className="w-full h-full object-contain rounded-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
