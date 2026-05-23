// Root layout for ShotlineAI.
// Wraps every page with the top navigation bar and global styles.
// Will later include a Zustand StoreProvider once state is wired up.

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ShotlineAI — AI Photo Curation",
  description: "Upload your photos and let AI rank, tag, and curate your best shots.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}>
        <Navbar />
        <main className="min-h-[calc(100vh-56px)]">
          {children}
        </main>
      </body>
    </html>
  );
}
