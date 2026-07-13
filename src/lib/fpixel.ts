// Meta (Facebook) Pixel helpers. The base loader lives in <MetaPixel> (pixel
// ID from the admin Settings tab via <TrackingScripts>); these helpers fire
// standard e-commerce events from anywhere on the client and no-op safely on
// the server.
//
// IMPORTANT: fbq is NOT available immediately — <TrackingScripts> first has to
// fetch /api/site-config before it injects the pixel stub. Events fired before
// that (notably Purchase on /takk, which fires on first render) are queued
// here and flushed as soon as fbq appears. Without this queue the Purchase
// event silently lost the race on every single order.

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

type QueuedEvent = [string, PixelParams | undefined, PixelOptions | undefined];

const pending: QueuedEvent[] = [];
let pollTimer: ReturnType<typeof setInterval> | null = null;

function fire(event: string, params?: PixelParams, options?: PixelOptions) {
  if (options) window.fbq!("track", event, params, options);
  else window.fbq!("track", event, params);
}

/** Flush queued events once fbq exists; give up after ~20s. */
function startPolling() {
  if (pollTimer) return;
  let attempts = 0;
  pollTimer = setInterval(() => {
    attempts += 1;
    if (typeof window.fbq === "function") {
      while (pending.length) {
        const [event, params, options] = pending.shift()!;
        fire(event, params, options);
      }
    }
    if (pending.length === 0 || attempts >= 80) {
      clearInterval(pollTimer!);
      pollTimer = null;
    }
  }, 250);
}

/** Fire a Meta standard event (e.g. AddToCart, Purchase). Queues until fbq loads. */
export function fbTrack(
  event: string,
  params?: PixelParams,
  options?: PixelOptions,
): void {
  if (typeof window === "undefined") return;
  if (typeof window.fbq === "function") {
    fire(event, params, options);
    return;
  }
  pending.push([event, params, options]);
  startPolling();
}
