import type { Metadata } from "next";
import { Header } from "@/components/store/Header";
import { ProductHero } from "@/components/store/ProductHero";
import {
  BenefitRo,
  BenefitKomfort,
  BenefitAllsidig,
  FeatureBand,
  Testimonials,
  Guarantee,
} from "@/components/store/Sections";
import { Faq } from "@/components/store/Faq";
import { faqJsonLd, type FaqItem } from "@/components/store/faq-data";
import { ViewContentTracker } from "@/components/store/ViewContentTracker";
import { Newsletter } from "@/components/store/Newsletter";
import { Footer } from "@/components/store/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ThemeProvider } from "@/components/store/ThemeProvider";
import { SLING } from "@/lib/products";
import { SITE, ogLocale } from "@/lib/site";

const DESCRIPTION =
  "Bæreslyngen er en ergonomisk bæresele i pustende bomull, fra nyfødt til 25 kg. Ett enkelt grep, ingen spenner. Fri frakt over 500 kr og 90 dagers åpent kjøp.";

export const metadata: Metadata = {
  title: "Bæreslyngen - ergonomisk bæresele for nyfødt, 0-25 kg",
  description: DESCRIPTION,
  alternates: { canonical: "/baereslyngen" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: ogLocale(),
    url: `${SITE.url}/baereslyngen`,
    title: "Bæreslyngen - ergonomisk bæresele for nyfødt | BÆRA",
    description: DESCRIPTION,
  },
};

// Buyer-intent FAQ. Rendered on-page and mirrored into FAQPage JSON-LD.
const FAQ: FaqItem[] = [
  {
    q: "Fra hvilken alder kan jeg bruke bæreselen?",
    a: "Bæreslyngen kan brukes fra nyfødt (minimum 4,5 kg) og helt opp til 25 kg. Den justeres trinnløst og vokser med barnet, så den samme bæreselen følger dere fra de første ukene til småbarnsalder.",
  },
  {
    q: "Er bæreselen ergonomisk for barnet?",
    a: "Ja. Bæreslyngen holder barnet i en naturlig M-stilling (frøstilling) med knærne høyere enn rumpa, som støtter en sunn hofteutvikling. Polstret skulderstøtte fordeler vekten jevnt, og slyngen er sikkerhetstestet etter EN 13209.",
  },
  {
    q: "Hvordan vasker jeg bæreselen?",
    a: "Bæreslyngen tåler maskinvask på 30 grader. Bruk et mildt vaskemiddel uten blekemiddel, og la den lufttørke. Den pustende bomullen blir bare mykere for hver vask.",
  },
  {
    q: "Passer bæreselen begge foreldre?",
    a: "Ja. Stroppene justeres trinnløst, så mor og far kan dele på den samme bæreselen uten å knytte om. Ett enkelt grep, ingen spenner å lure på.",
  },
  {
    q: "Hva koster frakt, og kan jeg returnere?",
    a: "Vi sender sporet innen 24 timer, med levering på 7-10 dager, og fri frakt over 500 kr. Du har 90 dagers åpent kjøp: er du ikke fornøyd, får du pengene tilbake uten spørsmål.",
  },
];

// Schema requires numeric, dot-decimal values - convert the display strings
// ("4,9", "2 400+") into machine-readable numbers.
const ratingValue = SLING.ratingValue.replace(",", ".");
const reviewCount = SLING.ratingCount.replace(/\D/g, "");

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Product",
      name: SLING.name,
      description: SLING.blurb,
      brand: { "@type": "Brand", name: SITE.name },
      category: "Bæresele",
      image: SLING.colors.map((c) => `${SITE.url}${c.image}`),
      offers: {
        "@type": "Offer",
        url: `${SITE.url}/baereslyngen`,
        priceCurrency: SITE.currency,
        price: SLING.priceNok,
        availability: "https://schema.org/InStock",
        priceValidUntil: "2026-12-31",
        itemCondition: "https://schema.org/NewCondition",
        // Truthful, matches the site: 90-day free returns + free shipping
        // (the product is 590 kr, above the 500 kr free-shipping threshold).
        hasMerchantReturnPolicy: {
          "@type": "MerchantReturnPolicy",
          applicableCountry: SITE.country,
          returnPolicyCategory:
            "https://schema.org/MerchantReturnFiniteReturnWindow",
          merchantReturnDays: 90,
          returnMethod: "https://schema.org/ReturnByMail",
          returnFees: "https://schema.org/FreeReturn",
        },
        shippingDetails: {
          "@type": "OfferShippingDetails",
          shippingRate: {
            "@type": "MonetaryAmount",
            value: 0,
            currency: SITE.currency,
          },
          shippingDestination: {
            "@type": "DefinedRegion",
            addressCountry: SITE.country,
          },
          deliveryTime: {
            "@type": "ShippingDeliveryTime",
            handlingTime: {
              "@type": "QuantitativeValue",
              minValue: 0,
              maxValue: 1,
              unitCode: "DAY",
            },
            transitTime: {
              "@type": "QuantitativeValue",
              minValue: 7,
              maxValue: 10,
              unitCode: "DAY",
            },
          },
        },
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue,
        reviewCount,
        bestRating: "5",
      },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Hjem", item: SITE.url },
        {
          "@type": "ListItem",
          position: 2,
          name: SLING.name,
          item: `${SITE.url}/baereslyngen`,
        },
      ],
    },
    faqJsonLd(FAQ),
  ],
};

export default function ProductPage() {
  return (
    <ThemeProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <ViewContentTracker
        id={SLING.slug}
        name={SLING.name}
        value={SLING.priceNok}
      />
      <main>
        <ProductHero product={SLING} />
        <BenefitRo />
        <BenefitKomfort />
        <BenefitAllsidig />
        <FeatureBand />
        <Testimonials />
        <Guarantee product={SLING} />
        <Faq
          items={FAQ}
          eyebrow="Om Bæreslyngen"
          heading="Vanlige spørsmål om bæreselen"
        />
        <Newsletter />
      </main>
      <Footer />
      <CartDrawer />
    </ThemeProvider>
  );
}
