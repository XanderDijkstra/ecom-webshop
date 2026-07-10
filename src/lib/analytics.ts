// First-party, cookieless funnel analytics. Unlike track() (Meta pixel),
// this fires for EVERY visitor with no marketing-consent gate, and stores
// nothing personal: just a random, first-party visitor id (localStorage), the
// event name and the current path. It mirrors the top of the funnel into our
// own DB (/api/analytics) so the admin can show a real PageView → AddToCart →
// InitiateCheckout → Purchase breakdown, independent of Meta and of whether the
// visitor accepted cookies. Safe to call anywhere on the client; no-ops on the
// server.

const VID_KEY = "bara_vid";

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

/** A stable, anonymous, first-party id for this browser (not shared anywhere). */
function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VID_KEY);
    if (!id) {
      id = genId();
      localStorage.setItem(VID_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

export type FunnelStage = "PageView" | "AddToCart" | "InitiateCheckout";

/**
 * Record one funnel event first-party. Fire-and-forget (keepalive so it
 * survives navigation) and never surfaces an error to the UI.
 */
export function logFunnel(
  name: FunnelStage,
  data: { value?: number; currency?: string; path?: string } = {},
): void {
  if (typeof window === "undefined") return;

  const payload = {
    name,
    vid: getVisitorId(),
    path: data.path ?? location.pathname,
    value: typeof data.value === "number" ? data.value : undefined,
    currency: data.currency,
  };

  try {
    void fetch("/api/analytics", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      /* analytics must never surface an error to the user */
    });
  } catch {
    /* ignore */
  }
}
