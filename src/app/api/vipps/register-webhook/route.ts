import { NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/supabase";
import { registerVippsWebhook, listVippsWebhooks } from "@/lib/vipps";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin-only helper to register (POST) or inspect (GET) the Vipps webhook.
// One-time setup: sign in to /admin, then POST here. Optional — the /takk
// return URL already finalises payments; the webhook just adds reliability for
// customers who close the Vipps app without returning.

export async function POST(req: Request) {
  const auth = await authenticateAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const result = await registerVippsWebhook(`${SITE.url}/api/vipps/webhook`);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}

export async function GET(req: Request) {
  const auth = await authenticateAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    return NextResponse.json({ webhooks: await listVippsWebhooks() });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
