import type { Metadata } from "next";
import { Instrument_Serif, Schibsted_Grotesk } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart/CartProvider";
import { FunnelTracker } from "@/components/FunnelTracker";
import { MetaPixel } from "@/components/MetaPixel";
import { Clarity } from "@/components/Clarity";
import { SITE } from "@/lib/site";

const grotesk = Schibsted_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

const DESCRIPTION =
  "Bæresele og bæreslynge for nyfødt fra BÆRA. Ergonomisk bæring i pustende bomull, M-stilling for sunne hofter, fra dag én til 25 kg. Fri frakt over 500 kr.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Bæresele & bæreslynge for nyfødt - ergonomisk bæring | BÆRA",
    template: "%s | BÆRA",
  },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: SITE.locale,
    url: SITE.url,
    title: "Bæresele & bæreslynge for nyfødt - BÆRA",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Bæresele & bæreslynge for nyfødt - BÆRA",
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nb" className={`${grotesk.variable} ${instrument.variable}`}>
      <body>
        {/* Tracking runs for all visitors — the cookie banner/consent gate was
            deliberately removed (small-shop decision, 2026-07-06). */}
        <FunnelTracker />
        <MetaPixel />
        <Clarity />
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
