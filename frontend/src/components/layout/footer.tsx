"use client";

import Link from "next/link";
import Image from "next/image";
import { Twitter, Github, Send, MessageSquare, ArrowUp } from "lucide-react";

export function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const sections = [
    {
      title: "Protocol",
      links: [
        { label: "Markets", href: "#markets" },
        { label: "Leaderboard", href: "#" },
        { label: "How It Works", href: "#how-it-works" },
        { label: "Prediction API", href: "#" },
      ],
    },
    {
      title: "Governance",
      links: [
        { label: "Documentation", href: "#" },
        { label: "Whitepaper", href: "#" },
        { label: "Smart Contracts", href: "#" },
        { label: "Security Audit", href: "#" },
      ],
    },
  ];

  const socials = [
    { icon: <Twitter className="w-4 h-4" />, href: "#" },
    { icon: <MessageSquare className="w-4 h-4" />, href: "#" },
    { icon: <Send className="w-4 h-4" />, href: "#" },
    { icon: <Github className="w-4 h-4" />, href: "#" },
  ];

  return (
    <footer className="relative bg-[#020617] pt-24 pb-12 overflow-hidden border-t border-white/5">
      {/* Massive Background Watermark */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 select-none pointer-events-none opacity-[0.02]">
        <h2 className="text-[20vw] font-black uppercase tracking-tighter italic leading-none">
          PROPHET
        </h2>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-20">
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-8">
            <Link
              href="/"
              className="inline-block transition-transform active:scale-95"
            >
              <Image
                src="/Logo2.png"
                alt="PROPHET"
                width={140}
                height={40}
                className="h-10 w-auto brightness-110"
              />
            </Link>
            <p className="text-slate-500 font-bold text-lg max-w-sm italic leading-tight">
              The first decentralized intelligence layer for the pulse of
              African culture.
            </p>
            <div className="flex gap-4">
              {socials.map((social, i) => (
                <Link
                  key={i}
                  href={social.href}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-600 transition-all"
                >
                  {social.icon}
                </Link>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div className="md:col-span-6 grid grid-cols-2 gap-8">
            {sections.map((section) => (
              <div key={section.title} className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">
                  {section.title}
                </h4>
                <ul className="space-y-4">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-slate-400 hover:text-white text-sm font-medium transition-colors tracking-tight"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Scroll Up Control */}
          <div className="md:col-span-1 flex justify-end items-start">
            <button
              onClick={scrollToTop}
              className="group w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all duration-500"
            >
              <ArrowUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-600">
            <p>© 2025 PROPHET PROTOCOL</p>
            <div className="h-1 w-1 rounded-full bg-slate-800" />
            <p>BUILT FOR MINIPAY</p>
          </div>

          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-slate-600">
            <Link href="#" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
