"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Google tag (gtag.js) — accepts a GA4 measurement ID ("G-…"), a Google Ads
 * tag ("AW-…") or a Google tag ID ("GT-…"), pasted in the admin Settings tab.
 * Sends a page_view on mount and on every client-side route change
 * (send_page_view is disabled in the config so nothing double-counts).
 */
export function GoogleTag({ tagId }: { tagId: string }) {
  const pathname = usePathname();
  const trackedPath = useRef<string | null>(null);

  useEffect(() => {
    // The initial page_view is sent by the inline init script (which queues
    // even before the library loads); this effect only covers route changes.
    if (trackedPath.current === null) {
      trackedPath.current = pathname;
      return;
    }
    if (trackedPath.current !== pathname) {
      trackedPath.current = pathname;
      window.gtag?.("event", "page_view");
    }
  }, [pathname]);

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(tagId)}`}
        strategy="afterInteractive"
      />
      <Script id="google-tag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${tagId}', { send_page_view: false });
gtag('event', 'page_view');`}
      </Script>
    </>
  );
}
