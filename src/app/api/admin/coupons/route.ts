import { NextResponse } from "next/server";
import { authenticateAdmin, getSupabaseAdmin } from "@/lib/supabase";
import { normalizeCouponCode } from "@/lib/coupons";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Coupon management for the admin Marketing tab. */
export async function GET(req: Request) {
  const auth = await authenticateAdmin(req);
  if (!auth.ok)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = getSupabaseAdmin();
  if (!supabase)
    return NextResponse.json({ error: "Database isn't configured." }, { status: 503 });

  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  // Missing table (schema.sql not re-run) → setup hint instead of an error.
  if (error) return NextResponse.json({ ready: false, coupons: [] });
  return NextResponse.json({ ready: true, coupons: data ?? [] });
}

/** Create a coupon. Body: { code, percentOff, expiresAt? } */
export async function POST(req: Request) {
  const auth = await authenticateAdmin(req);
  if (!auth.ok)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = getSupabaseAdmin();
  if (!supabase)
    return NextResponse.json({ error: "Database isn't configured." }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as {
    code?: unknown;
    percentOff?: unknown;
    expiresAt?: unknown;
  };
  const code = normalizeCouponCode(body.code);
  if (!code)
    return NextResponse.json(
      { error: "Code must be 2–40 chars: letters, numbers, - or _." },
      { status: 400 },
    );
  const percentOff = Math.floor(Number(body.percentOff));
  if (!Number.isFinite(percentOff) || percentOff < 1 || percentOff > 100)
    return NextResponse.json(
      { error: "Percent off must be between 1 and 100." },
      { status: 400 },
    );
  const expiresAt =
    typeof body.expiresAt === "string" && body.expiresAt
      ? new Date(body.expiresAt).toISOString()
      : null;

  const { data, error } = await supabase
    .from("coupons")
    .insert({ code, percent_off: percentOff, expires_at: expiresAt })
    .select("*")
    .single();
  if (error) {
    const msg = /duplicate/i.test(error.message)
      ? `Coupon "${code}" already exists.`
      : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json({ ok: true, coupon: data });
}

/** Toggle a coupon on/off. Body: { id, active } */
export async function PATCH(req: Request) {
  const auth = await authenticateAdmin(req);
  if (!auth.ok)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = getSupabaseAdmin();
  if (!supabase)
    return NextResponse.json({ error: "Database isn't configured." }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as {
    id?: string;
    active?: boolean;
  };
  if (!body.id || typeof body.active !== "boolean")
    return NextResponse.json({ error: "id and active are required." }, { status: 400 });

  const { data, error } = await supabase
    .from("coupons")
    .update({ active: body.active })
    .eq("id", body.id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, coupon: data });
}

/** Delete a coupon. Body: { id } */
export async function DELETE(req: Request) {
  const auth = await authenticateAdmin(req);
  if (!auth.ok)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = getSupabaseAdmin();
  if (!supabase)
    return NextResponse.json({ error: "Database isn't configured." }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as { id?: string };
  if (!body.id)
    return NextResponse.json({ error: "id is required." }, { status: 400 });

  const { error } = await supabase.from("coupons").delete().eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
