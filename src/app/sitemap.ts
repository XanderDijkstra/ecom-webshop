import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Only canonical, indexable, 200-status URLs belong here.
// /takk is intentionally excluded — it is a noindex thank-you page.
// Anchor lastModified to a real content date so it does not churn every deploy.
const LAST_MODIFIED = "2026-06-26";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE.url,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE.url}/baereslyngen`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...["salgsvilkar", "personvern", "frakt", "kontakt"].map((path) => ({
      url: `${SITE.url}/${path}`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
