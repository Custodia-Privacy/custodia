import type { ReactNode } from "react";
import Script from "next/script";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

/**
 * Marketing layout — wraps public pages (landing, pricing, etc.)
 * with shared header/footer navigation.
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main id="main-content" className="flex-1">{children}</main>
      <Footer />
      <Script src="/api/banner/7f65b367-fd9f-447e-8c4f-9cab96fc69b1" strategy="afterInteractive" />
    </>
  );
}
