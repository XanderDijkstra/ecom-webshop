// Server-safe FAQ helpers (no "use client"): the type and the JSON-LD builder
// are imported by server components (pages) to emit FAQPage structured data,
// while the <Faq> client component renders the same items as an accordion.

export interface FaqItem {
  q: string;
  a: string;
}

/** Builds schema.org FAQPage JSON-LD from the same items rendered on the page. */
export function faqJsonLd(items: FaqItem[]) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
}
