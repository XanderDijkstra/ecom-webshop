// Client-side event tracking. Fires a Meta event on BOTH the browser pixel and
// (server-side) the Conversions API, sharing one event_id so Meta deduplicates
// the pair. The CAPI copy survives ad blockers / cookie loss that eat the pixel.
// Safe to call anywhere on the client; no-ops on the server.
import { fbTrack } from "@/lib/fpixel";

type Params = Record<string, unknown>;

/** A per-event id, shared between the pixel and the CAPI copy for dedup. */
function genId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through */
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

/**
 * Fire a Meta standard event on the browser pixel and mirror it to the
 * Conversions API for every visitor (the consent gate was deliberately
 * removed). Never blocks the UI (fire-and-forget, keepalive so it survives
 * navigation).
 */
export function track(event: string, params: Params = {}): void {
  const eventId = genId();
  fbTrack(event, params, { eventID: eventId });

  const payload = {
    event,
    eventId,
    url: typeof location !== "undefined" ? location.href : undefined,
    fbp: readCookie("_fbp"),
    fbc: readCookie("_fbc"),
    custom: params,
  };

  try {
    void fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      /* tracking must never surface an error to the user */
    });
  } catch {
    /* ignore */
  }
}
