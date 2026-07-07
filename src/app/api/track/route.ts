import { NextResponse } from "next/server";
import { sendCapiEvent } from "@/lib/capi";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Browser-pixel events we mirror server-side (Conversions API). Purchase is
// deliberately excluded: it's sent authoritatively from the order pipeline
// (real paid amount, verified with Stripe/Vipps), so accepting a client-posted
// Purchase here would let anyone inflate sales in Events Manager.
const ALLOWED = new Set([
  "PageView",
  "ViewContent",
  "AddToCart",
  "InitiateCheckout",
]);

const str = (v: unknown, max = 200) =>
  typeof v === "string" ? v.slice(0, max) : undefined;

/** First hop's client IP from the proxy chain (Vercel sets x-forwarded-for). */
function clientIp(req: Request): string | undefined {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? undefined;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const event = str(body?.event, 40);
  const eventId = str(body?.eventId, 100);

  // Silently accept-and-drop anything invalid so the client never sees an error.
  if (!event || !eventId || !ALLOWED.has(event)) {
    return NextResponse.json({ ok: true });
  }

  const custom = (body?.custom ?? {}) as Record<string, unknown>;
  const contentIds = Array.isArray(custom.content_ids)
    ? (custom.content_ids as unknown[])
        .filter((x): x is string => typeof x === "string")
        .slice(0, 20)
    : undefined;

  await sendCapiEvent({
    eventName: event,
    eventId,
    eventSourceUrl: str(body?.url, 500) || SITE.url,
    value: typeof custom.value === "number" ? custom.value : undefined,
    currency: str(custom.currency, 8),
    contentIds,
    contentName: str(custom.content_name, 200),
    numItems: typeof custom.num_items === "number" ? custom.num_items : undefined,
    user: {
      fbp: str(body?.fbp, 200),
      fbc: str(body?.fbc, 200),
      clientIpAddress: clientIp(req),
      clientUserAgent: str(req.headers.get("user-agent") ?? undefined, 500),
    },
  });

  return NextResponse.json({ ok: true });
}
