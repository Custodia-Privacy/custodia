import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Custodia — AI-Powered Privacy Compliance for Small Business",
  description:
    "The AI-native privacy platform built for small businesses. Full compliance stack — not just a cookie banner — at a price that makes sense.",
  keywords: [
    "privacy compliance",
    "GDPR",
    "CCPA",
    "cookie consent",
    "privacy policy generator",
    "data mapping",
    "small business compliance",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Privacy-friendly analytics by Plausible */}
        <Script
          src="https://plausible.io/js/pa-iuii92DSfy39fqR6JJQPq.js"
          strategy="afterInteractive"
        />
        <Script id="plausible-init" strategy="afterInteractive">{`
          window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)};
        `}</Script>
        <a href="#main-content" className="sr-only">
          Skip to main content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
