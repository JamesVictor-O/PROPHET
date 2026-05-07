import React from "react";
import "./globals.css";
import { Web3Provider } from "./_components/web3-provider";

export const metadata = {
  title: "Prophet — AI Prediction Markets",
  description: "Autonomous, private, verifiable prediction markets powered by 0G",
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
