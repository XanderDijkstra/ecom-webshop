import { NextResponse } from "next/server";
import { getSupabaseAdmin, authenticateAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The standard new-store checklist (mirrors docs/SETUP.md). Loaded into the
// table via POST { seed: true } so each store manages its own live copy.
const SETUP_CHECKLIST = [
  "Edit src/lib/company.ts — brand, legal entity, org.nr, address, support email/phone, URL",
  "Edit src/lib/products.ts + offers.ts — product, variants, prices, order bump",
  "Replace public/images/ and rewrite storefront copy (homepage, PDP, FAQ, emails)",
  "Supabase: new project, run all of supabase/schema.sql",
  "Stripe: keys in env; webhook → /api/webhooks/stripe with checkout.session.completed AND payment_intent.succeeded",
  "Vercel: import repo, paste env vars, deploy (no vercel.json crons on Hobby!)",
  "GitHub: gh variable set SITE_URL + gh secret set CRON_SECRET (Actions crons)",
  "Resend: verify domain, set ORDER_FROM + ORDER_NOTIFY_TO, create a real support mailbox",
  "Paste Meta Pixel / Google Tag / Clarity IDs in Settings → Tracking",
  "Meta CAPI: set META_CAPI_ACCESS_TOKEN in Vercel + redeploy",
  "Optional: Vipps (VIPPS_* env + NEXT_PUBLIC_VIPPS_ENABLED=1)",
  "Optional: Telegram order alerts (TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID)",
  "Optional: Shopify fulfilment — token + domain in env, update SHOPIFY_VARIANT_MAP by IMAGE",
  "Legal pages match company.ts (vilkår, personvern, angrerett)",
  "Grep for leftover template brand strings",
  "Test order end-to-end: admin, emails, Telegram, Shopify — then cancel the test order",
  "Go live: real payment keys, live webhook, 1 kr test order + refund",
];

/** List todos (setup checklist + custom items). */
export async function GET(req: Request) {
  const auth = await authenticateAdmin(req);
  if (!auth.ok)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = getSupabaseAdmin();
  if (!supabase)
    return NextResponse.json(
      { error: "Database isn't configured." },
      { status: 503 },
    );

  const { data, error } = await supabase
    .from("store_todos")
    .select("id,label,done,sort,created_at,done_at")
    .order("sort", { ascending: true })
    .order("created_at", { ascending: true });
  // Missing table (SQL not run yet) → tell the UI so it can show a hint.
  if (error) return NextResponse.json({ ready: false, todos: [] });
  return NextResponse.json({ ready: true, todos: data ?? [] });
}

/** Add a todo ({ label }) or seed the setup checklist ({ seed: true }). */
export async function POST(req: Request) {
  const auth = await authenticateAdmin(req);
  if (!auth.ok)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = getSupabaseAdmin();
  if (!supabase)
    return NextResponse.json(
      { error: "Database isn't configured." },
      { status: 503 },
    );

  const body = (await req.json().catch(() => ({}))) as {
    label?: string;
    seed?: boolean;
  };

  if (body.seed) {
    const rows = SETUP_CHECKLIST.map((label, i) => ({ label, sort: i }));
    const { error } = await supabase.from("store_todos").insert(rows);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, seeded: rows.length });
  }

  const label = (body.label ?? "").trim().slice(0, 300);
  if (!label)
    return NextResponse.json({ error: "Label is required." }, { status: 400 });

  // New custom items go to the end.
  const { data: last } = await supabase
    .from("store_todos")
    .select("sort")
    .order("sort", { ascending: false })
    .limit(1);
  const sort = (last?.[0]?.sort ?? -1) + 1;

  const { data, error } = await supabase
    .from("store_todos")
    .insert({ label, sort })
    .select("id,label,done,sort,created_at,done_at")
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, todo: data });
}

/** Toggle/rename a todo. Body: { id, done? , label? } */
export async function PATCH(req: Request) {
  const auth = await authenticateAdmin(req);
  if (!auth.ok)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = getSupabaseAdmin();
  if (!supabase)
    return NextResponse.json(
      { error: "Database isn't configured." },
      { status: 503 },
    );

  const body = (await req.json().catch(() => ({}))) as {
    id?: string;
    done?: boolean;
    label?: string;
  };
  if (!body.id)
    return NextResponse.json({ error: "id is required." }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (typeof body.done === "boolean") {
    update.done = body.done;
    update.done_at = body.done ? new Date().toISOString() : null;
  }
  if (typeof body.label === "string") {
    const label = body.label.trim().slice(0, 300);
    if (!label)
      return NextResponse.json({ error: "Label can't be empty." }, { status: 400 });
    update.label = label;
  }
  if (Object.keys(update).length === 0)
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });

  const { data, error } = await supabase
    .from("store_todos")
    .update(update)
    .eq("id", body.id)
    .select("id,label,done,sort,created_at,done_at")
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, todo: data });
}

/** Delete a todo. Body: { id } */
export async function DELETE(req: Request) {
  const auth = await authenticateAdmin(req);
  if (!auth.ok)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = getSupabaseAdmin();
  if (!supabase)
    return NextResponse.json(
      { error: "Database isn't configured." },
      { status: 503 },
    );

  const body = (await req.json().catch(() => ({}))) as { id?: string };
  if (!body.id)
    return NextResponse.json({ error: "id is required." }, { status: 400 });

  const { error } = await supabase
    .from("store_todos")
    .delete()
    .eq("id", body.id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
