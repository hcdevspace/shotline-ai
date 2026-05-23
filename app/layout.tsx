// Root layout for ShotlineAI.
// Loads Inter from Google Fonts (self-hosted at build time by Next.js),
// applies design-system base classes, and wraps every page with Navbar.

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ShotlineAI — AI Photo Curation",
  description: "Upload your photos and let AI rank, tag, and curate your best shots.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased min-h-screen bg-canvas text-hi`}>
        <Navbar />
        <main className="min-h-[calc(100vh-56px)] animate-page-in">
          {children}
        </main>
      </body>
    </html>
  );
}
