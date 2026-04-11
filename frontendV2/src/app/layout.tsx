import React from "react";
import "./globals.css";
import { Web3Provider } from "./_components/web3-provider";

export const metadata = {
  title: "frontendV2",
  description: "A fresh Next.js/React scaffold for frontendV2",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
