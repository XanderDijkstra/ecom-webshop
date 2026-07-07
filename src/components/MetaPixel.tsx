"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { FB_PIXEL_ID } from "@/lib/fpixel";
import { track } from "@/lib/track";

/**
 * Loads the Meta Pixel base code for ALL visitors (the consent gate was
 * deliberately removed). Fires a PageView on first mount AND on every
 * client-side route change, routed through track() so the browser pixel and
 * the Conversions API share one event_id per view (dedup). The inline snippet
 * only initialises the pixel (no inline PageView), so nothing double-counts.
 */
export function MetaPixel() {
  const pathname = usePathname();
  const trackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!FB_PIXEL_ID) return;
    if (trackedPath.current !== pathname) {
      trackedPath.current = pathname;
      track("PageView");
    }
  }, [pathname]);

  if (!FB_PIXEL_ID) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${FB_PIXEL_ID}');`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
