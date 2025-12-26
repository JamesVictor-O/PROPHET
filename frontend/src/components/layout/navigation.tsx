"use client";

import Link from "next/link";
import Image from "next/image";
import { WalletConnect } from "@/components/wallet/wallet-connect";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Add scroll listener to change opacity on scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#markets", label: "Markets" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  return (
    <nav
      className={cn(
        "fixed top-0 w-full z-[100] transition-all duration-500",
        scrolled
          ? "bg-[#020617]/80 backdrop-blur-md border-b border-white/5 py-3"
          : "bg-transparent py-5"
      )}
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="flex justify-between items-center h-10">
          {/* 1. Refined Logo Area */}
          <Link
            href="/"
            className="group flex items-center transition-transform active:scale-95"
          >
            <Image
              src="/Logo1.png"
              alt="PROPHET"
              width={110}
              height={28}
              className="h-7 w-auto md:hidden"
              priority
            />
            <Image
              src="/Logo2.png"
              alt="PROPHET"
              width={130}
              height={36}
              className="h-9 w-auto hidden md:block"
              priority
            />
          </Link>

          {/* 2. Professional Links - Smaller & Tracking-Widest */}
          <div className="hidden md:flex items-center space-x-10">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[11px] uppercase tracking-[0.2em] font-bold text-slate-400 hover:text-white transition-all hover:translate-y-[-1px]"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* 3. Wallet Area with High-End Padding */}
          <div className="hidden md:flex items-center gap-4">
            <WalletConnect showBalance={false} variant="default" />
          </div>

          {/* Mobile Menu Controls */}
          <div className="flex md:hidden items-center gap-4">
            <WalletConnect showBalance={false} variant="default" />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 stroke-[1.5px]" />
              ) : (
                <Menu className="w-5 h-5 stroke-[1.5px]" />
              )}
            </button>
          </div>
        </div>

        {/* 4. Slick Mobile Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-[#020617] border-b border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex flex-col p-8 space-y-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-light tracking-tight text-slate-300 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
