"use client";

import Script from "next/script";

// Microsoft Clarity (heatmaps + session recordings). Loads for ALL visitors
// (not consent-gated) — a deliberate small-shop choice. The project ID comes
// from <TrackingScripts> — pasted in the admin Settings tab (or the
// NEXT_PUBLIC_CLARITY_ID env override).
export function Clarity({ clarityId }: { clarityId: string }) {
  return (
    <Script id="ms-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){
c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window,document,"clarity","script","${clarityId}");`}
    </Script>
  );
}
