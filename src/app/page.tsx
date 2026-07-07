import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/store/Header";
import {
  TrustStrip,
  Reviews,
  TrustBadges,
} from "@/components/store/Sections";
import { Comparison } from "@/components/store/Comparison";
import { Faq } from "@/components/store/Faq";
import { faqJsonLd, type FaqItem } from "@/components/store/faq-data";
import { Newsletter } from "@/components/store/Newsletter";
import { Footer } from "@/components/store/Footer";
import { COMPANY } from "@/lib/company";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { SLING } from "@/lib/products";
import { SITE } from "@/lib/site";

// Category-level FAQ (the buyer's research questions). Mirrored into JSON-LD.
const FAQ: FaqItem[] = [
  {
    q: "Hva er forskjellen på bæresele, bæresjal og bæreslynge?",
    a: "En bæresele tas på med stropper og spenne og er rask å bruke. Et bæresjal er ett langt stykke stoff du knytter rundt deg for tett bæring. En bæreslynge bæres over én skulder, ofte med ring. Alle tre kan holde barnet ergonomisk i M-stilling fra nyfødt.",
  },
  {
    q: "Fra hvilken alder kan baby bruke bæresele?",
    a: "En frisk, fullbåren baby kan bæres fra dag én i en bæresele som gir god støtte til hode, nakke og hofter. BÆRA Bæreslyngen passer fra nyfødt (fra 4,5 kg) og opp til 25 kg.",
  },
  {
    q: "Er bæresele bra for hoftene til babyen?",
    a: "Ja, så lenge bæreselen holder barnet i M-stilling (frøstilling) med knærne høyere enn rumpa. Denne stillingen støtter en sunn hofteutvikling og anbefales av helsepersonell. Unngå seler som lar beina henge rett ned.",
  },
  {
    q: "Hvilken bæresele er best for nyfødt?",
    a: "Den beste bæreselen for nyfødt gir god hodestøtte, holder barnet tett og høyt nok til at du kan kysse issen, og plasserer hoftene i M-stilling. Mykt, pustende stoff som bomull er behagelig mot nyfødt hud.",
  },
  {
    q: "Kan jeg bruke bæresele rett etter fødsel?",
    a: "Ja. Er både du og barnet friske, kan du bære fra de første dagene. Bæring kan roe nyfødte, gjøre amming enklere og gi deg frie hender. Begynn med korte økter og sørg alltid for frie luftveier.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE.url}/#organization`,
      name: SITE.name,
      legalName: COMPANY.legalName,
      url: SITE.url,
      logo: `${SITE.url}/opengraph-image`,
      email: COMPANY.email,
      telephone: COMPANY.phone,
      address: {
        "@type": "PostalAddress",
        streetAddress: COMPANY.address.line1,
        postalCode: COMPANY.address.postal,
        addressLocality: COMPANY.address.city,
        addressCountry: "NO",
      },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: COMPANY.email,
        telephone: COMPANY.phone,
        areaServed: "NO",
        availableLanguage: ["nb", "en"],
      },
      // sameAs: real Instagram/Facebook/TikTok profile URLs go here once live —
      // this is the biggest remaining AI-entity-clarity win.
    },
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      name: SITE.name,
      url: SITE.url,
      inLanguage: "nb-NO",
      publisher: { "@id": `${SITE.url}/#organization` },
    },
    faqJsonLd(FAQ),
  ],
};

function Hero() {
  return (
    <section className="mx-auto max-w-[1200px] px-7 pb-[60px] pt-[24px]">
      <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-[60px]">
        <div className="w-full lg:w-1/2">
          <div className="mb-5 text-[12px] uppercase tracking-[0.16em] text-clay">
            Ergonomisk bæring · fra nyfødt til 25 kg
          </div>
          <h1 className="mb-5 font-serif text-[clamp(36px,5.2vw,60px)] font-normal leading-[1.04] tracking-[-0.01em]">
            Bæresele for nyfødt, hold den lille tett inntil deg
          </h1>
          <p className="mb-8 max-w-[52ch] text-[18px] leading-[1.6] text-muted-2">
            BÆRA Bæreslyngen er en ergonomisk bæresele i pustende bomull, mykt
            som et bæresjal og like enkelt å ta på som en sele. Den holder barnet
            i naturlig M-stilling fra de første dagene og helt opp til 25 kg, så
            du får frie hender uten såre armer eller vond rygg.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/baereslyngen"
              className="rounded-full bg-ink px-9 py-[16px] text-[16px] font-semibold text-cream transition-colors hover:bg-clay"
            >
              Se Bæreslyngen
            </Link>
            <a
              href="#guide"
              className="text-[15px] font-medium text-ink underline-offset-4 hover:underline"
            >
              Les bæreguiden
            </a>
          </div>
        </div>

        <div className="w-full lg:w-1/2">
          <div className="relative aspect-[4/5] overflow-hidden rounded-md border-2 border-line bg-white">
            <Image
              src={SLING.colors[0].image}
              alt="BÆRA Bæreslyngen ergonomisk bæresele for nyfødt i pustende bomull"
              fill
              className="object-contain p-8"
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="w-full overflow-x-clip">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main>
        <Hero />
        <TrustStrip />
        <Comparison />
        <Reviews />
        <TrustBadges />
        <Faq
          items={FAQ}
          eyebrow="Bæresele, spørsmål og svar"
          heading="Det foreldre lurer på om bæring"
        />
        <Newsletter />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
