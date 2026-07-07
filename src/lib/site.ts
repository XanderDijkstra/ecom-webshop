// Single source of truth for canonical site identity (used by metadata,
// robots, sitemap and JSON-LD). Keep the URL in sync with the connected domain.
export const SITE = {
  url: "https://www.baera.shop",
  name: "BÆRA",
  locale: "nb_NO",
} as const;
