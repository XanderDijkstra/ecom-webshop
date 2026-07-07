import { NextResponse } from "next/server";
import { authenticateAdmin, getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Outbound-email log for the admin Marketing tab.
 * GET            → latest entries (without HTML, to keep the payload light)
 * GET ?id=<uuid> → one entry including the rendered HTML, for preview.
 * Returns { ready:false } when the email_log table hasn't been created yet.
 */
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

  const id = new URL(req.url).searchParams.get("id");
  if (id) {
    const { data, error } = await supabase
      .from("email_log")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ email: data });
  }

  const { data, error } = await supabase
    .from("email_log")
    .select("id,type,recipient,subject,status,error,created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    // Missing table (SQL not run yet) → tell the UI instead of erroring.
    if (/email_log/.test(error.message)) {
      return NextResponse.json({ ready: false, emails: [] });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ready: true, emails: data ?? [] });
}
