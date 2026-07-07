import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Top-of-funnel stages we accept from the client. Purchase is deliberately
// excluded: it's counted authoritatively from the orders table (paid orders),
// so it can't be inflated by a client-posted event.
const ALLOWED = new Set(["PageView", "AddToCart", "InitiateCheckout"]);

const str = (v: unknown, max = 200) =>
  typeof v === "string" ? v.slice(0, max) : null;

/** Cheap bot filter so crawlers/link-previews don't inflate visitor counts. */
const BOT = /bot|spider|crawl|slurp|headless|facebookexternalhit|preview|monitor|lighthouse|pingdom|uptime/i;

export async function POST(req: Request) {
  const ua = req.headers.get("user-agent") ?? "";
  if (BOT.test(ua)) return NextResponse.json({ ok: true });

  const body = await req.json().catch(() => null);
  const name = str(body?.name, 40);

  // Silently accept-and-drop anything invalid so the client never sees an error.
  if (!name || !ALLOWED.has(name)) return NextResponse.json({ ok: true });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: true });

  const value =
    typeof body?.value === "number" && Number.isFinite(body.value)
      ? body.value
      : null;

  try {
    await supabase.from("funnel_events").insert({
      name,
      visitor_id: str(body?.vid, 64),
      path: str(body?.path, 300),
      value,
      currency: str(body?.currency, 8) ?? "NOK",
    });
  } catch {
    /* never surface an analytics error to the visitor */
  }

  return NextResponse.json({ ok: true });
}
