import { NextResponse } from "next/server";
import { authenticateAdmin, getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Live counts for the abandoned-cart email flow shown in the admin Marketing
 * tab: how many leads sit at each stage (captured → email 1 → email 2) and
 * where conversions/unsubscribes happened. Aggregated from abandoned_carts.
 * Returns { ready:false } until the reminder2_sent_at column exists (re-run
 * supabase/schema.sql).
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

  const { data, error } = await supabase
    .from("abandoned_carts")
    .select(
      "email,consent,reminder_sent_at,reminder2_sent_at,converted_at,created_at,updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) {
    // Missing column/table (schema.sql not re-run yet) → setup hint in the UI.
    return NextResponse.json({ ready: false, error: error.message });
  }

  const rows = data ?? [];
  const t = (s: string | null) => (s ? new Date(s).getTime() : null);

  const stats = {
    captured: rows.length,
    unsubscribed: 0,
    // step counts
    sent1: 0,
    sent2: 0,
    // currently waiting in each gap (active leads only: consented, unconverted)
    waitingFor1: 0,
    waitingFor2: 0,
    doneNoPurchase: 0, // full flow finished, still no purchase
    // conversions, attributed to the last email they received before paying
    converted: 0,
    convertedBeforeEmail: 0,
    convertedAfter1: 0,
    convertedAfter2: 0,
  };

  for (const r of rows) {
    const conv = t(r.converted_at);
    const s1 = t(r.reminder_sent_at);
    const s2 = t(r.reminder2_sent_at);

    if (!r.consent) stats.unsubscribed++;
    if (s1) stats.sent1++;
    if (s2) stats.sent2++;

    if (conv) {
      stats.converted++;
      if (s2 && conv > s2) stats.convertedAfter2++;
      else if (s1 && conv > s1) stats.convertedAfter1++;
      else stats.convertedBeforeEmail++;
      continue;
    }

    // Unconverted: where in the flow are they right now?
    if (!r.consent) continue; // out of the flow entirely
    if (!s1) stats.waitingFor1++;
    else if (!s2) stats.waitingFor2++;
    else stats.doneNoPurchase++;
  }

  return NextResponse.json({ ready: true, stats });
}
