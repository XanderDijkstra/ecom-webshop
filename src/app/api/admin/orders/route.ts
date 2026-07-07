import { NextResponse } from "next/server";
import { getSupabaseAdmin, authenticateAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_STATUS = ["new", "shipped", "cancelled"];

/** List the most recent orders. Admin-only. */
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
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ orders: data ?? [] });
}

/** Update fulfillment status / tracking / note for a single order. Admin-only. */
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

  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : null;
  if (!id)
    return NextResponse.json({ error: "Missing order id." }, { status: 400 });

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (typeof body.fulfillment_status === "string") {
    if (!ALLOWED_STATUS.includes(body.fulfillment_status))
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    update.fulfillment_status = body.fulfillment_status;
  }
  if (typeof body.tracking_number === "string")
    update.tracking_number = body.tracking_number.slice(0, 120) || null;
  if (typeof body.admin_note === "string")
    update.admin_note = body.admin_note.slice(0, 1000) || null;

  const { data, error } = await supabase
    .from("orders")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ order: data });
}

/** Permanently delete a single order. Admin-only, irreversible. */
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

  const id = new URL(req.url).searchParams.get("id");
  if (!id)
    return NextResponse.json({ error: "Missing order id." }, { status: 400 });

  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, id });
}
