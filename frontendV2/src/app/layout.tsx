import React from "react";
import "./globals.css";
import { Web3Provider } from "./_components/web3-provider";

export const metadata = {
  title: "Prophet — AI Prediction Markets",
  description: "Autonomous, private, verifiable prediction markets powered by 0G",
  icons: {
    icon: "/ProphateLogo1.png",
    apple: "/ProphateLogo1.png",
  },
  openGraph: {
    title: "Prophet — AI Prediction Markets",
    description: "Autonomous, private, verifiable prediction markets powered by 0G",
    images: [{ url: "/ProphateLogo1.png", width: 512, height: 512, alt: "Prophet" }],
  },
  twitter: {
    card: "summary",
    title: "Prophet — AI Prediction Markets",
    description: "Autonomous, private, verifiable prediction markets powered by 0G",
    images: ["/ProphateLogo1.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
