"use client";

import Script from "next/script";

// Microsoft Clarity (heatmaps + session recordings). Loads for ALL visitors
// (not consent-gated) — a deliberate choice for this small shop. The project id
// is public (it ships in the client bundle), so it's baked in as a default;
// NEXT_PUBLIC_CLARITY_ID overrides it if ever needed. To make it consent-gated
// again, wrap the return in a useConsent() marketing===true check like MetaPixel.
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID || "xg4tca9ldu";

export function Clarity() {
  if (!CLARITY_ID) return null;

  return (
    <Script id="ms-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){
c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window,document,"clarity","script","${CLARITY_ID}");`}
    </Script>
  );
}
