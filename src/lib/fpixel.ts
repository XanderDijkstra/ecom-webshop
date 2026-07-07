// Meta (Facebook) Pixel helpers. The base loader lives in <MetaPixel>; these
// helpers fire standard e-commerce events from anywhere on the client and
// no-op safely on the server or before fbq has loaded.

// Per-store: set NEXT_PUBLIC_META_PIXEL_ID in the env (inlined at build time,
// so redeploy after changing it). All pixel + CAPI code no-ops while unset.
export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

type PixelParams = Record<string, unknown>;

/** Optional event options, e.g. { eventID } for Conversions API deduplication. */
interface PixelOptions {
  eventID?: string;
}

/** Fire a Meta standard event (e.g. AddToCart, Purchase). */
export function fbTrack(
  event: string,
  params?: PixelParams,
  options?: PixelOptions,
): void {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    if (options) window.fbq("track", event, params, options);
    else window.fbq("track", event, params);
  }
}
