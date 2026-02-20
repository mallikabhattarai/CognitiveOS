import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { AuthCodeRedirect } from "@/components/AuthCodeRedirect";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CognitiveOS",
  description: "Protect and optimize your cognitive performance through sleep intelligence",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="min-h-screen">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Suspense fallback={null}>
          <AuthCodeRedirect />
        </Suspense>
        <div className="mx-auto min-h-screen max-w-[428px] bg-bg-base pb-16 sm:border-x sm:border-[var(--border-subtle)]">
          {children}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
