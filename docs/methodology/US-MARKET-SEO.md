# US-market SEO methodology

How to point a store built from this template at the American market. The
template ships as a Norwegian example (`nb-NO` / `NO` / `NOK`), but the whole
SEO surface — `html lang`, Open Graph locale, JSON-LD offers, shipping and
return-policy countries — is driven by one block in
[`src/lib/site.ts`](../../src/lib/site.ts):

```ts
export const SITE = {
  url: "https://www.yourshop.com",
  name: "YOUR BRAND",
  language: "en-US",
  country: "US",
  currency: "USD",
} as const;
```

Flip those three market fields and every structured-data surface follows.
Everything below is what does *not* flip automatically, plus the US-specific
opportunities worth building for.

## 1. Merchant listings: the schema is the product feed

In US results, Google renders **merchant listing experiences** (price, stock,
shipping cost, return window directly in the SERP and in the Shopping tab) for
product pages with sufficiently complete `Product` JSON-LD — no Merchant
Center feed required, though claiming your store in
[Google Merchant Center](https://merchants.google.com) and enabling free
listings is worth the hour it takes.

The template already emits the two fields most shops miss, on the product page
([`src/app/baereslyngen/page.tsx`](../../src/app/baereslyngen/page.tsx)):

- `offers.shippingDetails` (`OfferShippingDetails`) → powers the "Free
  shipping" and delivery-estimate annotations. Handling/transit times are
  encoded there; update them to your actual US fulfilment numbers.
- `offers.hasMerchantReturnPolicy` (`MerchantReturnPolicy`) → powers the
  "Free 90-day returns" annotation, a strong CTR lever against typical
  US 30-day policies.

Keep both truthful and in sync with the shipping/returns copy on the page —
Google cross-checks, and mismatches can drop the whole listing enhancement.

## 2. Reviews are a legal surface in the US, not just an SEO one

The template ships with placeholder social proof (`ratingValue: "4,9"`,
`ratingCount: "2 400+"` in [`src/lib/products.ts`](../../src/lib/products.ts))
that flows into `aggregateRating` JSON-LD. Before a US launch this must be
replaced with real, verifiable review data or removed entirely.

Since October 2024 the FTC's final rule on fake reviews (16 CFR Part 465)
makes buying, selling or publishing fabricated reviews and inflated
review counts a violation with civil penalties per instance — it is no longer
merely a Google-quality issue. If you have no reviews yet, ship without
`aggregateRating` and add it when the first real reviews exist.

## 3. Product-safety claims must be re-anchored to US standards

The Norwegian copy cites **EN 13209** (the European baby-carrier standard) in
the on-page FAQ. That claim means nothing to a US buyer and is the wrong
compliance regime: in the US, sling carriers fall under the CPSC's mandatory
rule **16 CFR Part 1228**, which incorporates **ASTM F2907** (Standard
Consumer Safety Specification for Sling Carriers). Framed carriers use ASTM
F2236.

For SEO this matters twice: "ASTM certified baby sling" is a real query with
buying intent, and safety-standard mentions are exactly the kind of
verifiable, citable claim AI search engines quote (see §6). Update the FAQ
entries (they mirror into `FAQPage` JSON-LD via
[`src/components/store/faq-data.ts`](../../src/components/store/faq-data.ts))
to cite the standard you actually test against.

## 4. Price display: tax-exclusive, and say so nowhere

Norwegian prices are VAT-inclusive; US prices are shown pre-tax and sales tax
is added at checkout per state. Practical consequences:

- The `price` in `offers` JSON-LD is the displayed pre-tax price — no change
  needed beyond the currency flip.
- Enable [Stripe Tax](https://stripe.com/tax) so checkout computes state/local
  sales tax; the template's server-priced checkout
  (`src/app/api/checkout/route.ts`) is where that hooks in. The same file's
  `shipping_address_collection.allowed_countries` must gain `"US"`.
- Free-shipping thresholds read as odd numbers when converted. "$49" or "$50"
  outperforms "$47.63" — set a native USD threshold in
  [`src/lib/shipping.ts`](../../src/lib/shipping.ts) and keep the storefront
  copy in sync.

## 5. Write for American search intent, not translated Norwegian

Keyword translation is not keyword research. The Norwegian market searches
"bæresele" vs "bæreslynge"; the US market splits across **baby sling**,
**ring sling**, **baby wrap** and **baby carrier for newborn** — each with
different volume and different expected products. Re-run research from zero.

US-specific intent patterns worth owning on-page and in the FAQ:

- **Registry intent** — "best baby sling for registry", driven by the
  Amazon/Target/Babylist registry culture. No Norwegian equivalent exists.
- **Travel/TSA intent** — "can I wear my baby through airport security".
  A one-question FAQ entry can own this.
- **Superlative + qualifier queries** — "best baby sling for newborns 2026",
  "hip healthy baby carrier". The "hip-healthy" phrasing comes from the
  International Hip Dysplasia Institute's acknowledgment program, the
  authority US parents actually check — the US analogue of the template's
  M-stilling messaging.
- **Units** — copy must speak lbs/inches ("birth to 55 lbs", not "til 25 kg").
  Mixed units read as a dropship red flag to US buyers and depress conversion
  even when rankings are fine.

Title-tag pattern that matches US SERP conventions:
`{Product} – {Primary keyword}, {Key spec} | {Brand}` — front-load the
keyword, keep under ~60 characters, and skip the Norwegian dash-dialect.

## 6. AI search: the US is where the robots.ts strategy pays off

AI-assistant search share is highest in the US market, so the crawler policy
in [`src/app/robots.ts`](../../src/app/robots.ts) — allow search-surface
crawlers (`OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`) for citation
upside, block training-only crawlers — has the most impact there. Keep it.

Two things feed AI answers disproportionately:

- **`FAQPage` JSON-LD.** Google stopped showing FAQ rich results for
  ordinary merchants in 2023, but the markup's second life is that answer
  engines lift Q&A pairs near-verbatim. Write FAQ answers as complete,
  self-contained statements (the template's FAQ pattern already does this) —
  they are your quotable surface.
- **Entity clarity.** The `Organization` node in
  [`src/app/page.tsx`](../../src/app/page.tsx) should gain `sameAs` links to
  real social profiles the moment they exist, so AI engines can resolve the
  brand as an entity instead of guessing.

## 7. Going bilingual instead of switching

Running the Norwegian store *and* a US storefront (subfolder `/en-us/` or a
separate domain) needs `hreflang` so the two don't cannibalize:

```ts
// per-page metadata
alternates: {
  canonical: "/",
  languages: { "nb-NO": "/", "en-US": "/en-us", "x-default": "/en-us" },
},
```

Each language version must self-reference and cross-reference symmetrically,
and `x-default` should point at the version for unmatched locales. This
template is deliberately single-locale — for a real dual-market store, prefer
two deployments with two `SITE` configs over in-app i18n; the template is
small enough that a fork per market is cheaper than a translation layer.

## Launch checklist (US)

- [ ] `SITE` flipped to `en-US` / `US` / `USD` in `src/lib/site.ts`
- [ ] All storefront copy natively rewritten in American English (lbs/inches)
- [ ] `allowed_countries` includes `US` in checkout + Stripe Tax enabled
- [ ] Native USD price points and free-shipping threshold
- [ ] Placeholder `ratingValue`/`ratingCount` replaced with real data or removed
- [ ] Safety claims re-anchored to ASTM F2907 / 16 CFR 1228 (verify testing!)
- [ ] FAQ rewritten for US intent (registry, TSA, hip-healthy)
- [ ] Store claimed in Google Merchant Center, free listings on
- [ ] Rich Results Test green for Product + shipping + returns
- [ ] `sameAs` social profiles added to Organization JSON-LD
