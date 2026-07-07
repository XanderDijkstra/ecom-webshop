import { NextResponse } from "next/server";
import { getSupabaseAdmin, authenticateAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Top-of-funnel stages counted from funnel_events. The Purchase stage is added
// client-side from the paid-orders count the admin already loads.
const STAGES = ["PageView", "AddToCart", "InitiateCheckout"] as const;

/**
 * Funnel-stage counts for a date range. Admin-only.
 *
 * Counts UNIQUE VISITORS per stage (distinct visitor_id), not raw events — a
 * shopper who reloads /checkout or comes back later is still one person, so
 * the funnel stays monotonic (you can't have more checkout-starters than
 * cart-adders). Raw event counting is what previously made "Started checkout"
 * exceed "Added to cart".
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

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const counts: Record<string, number> = {
    PageView: 0,
    AddToCart: 0,
    InitiateCheckout: 0,
  };
  // `ready` flips to false if the table is missing (SQL not run yet), so the UI
  // can show a "set this up" hint instead of an empty funnel.
  let ready = true;

  await Promise.all(
    STAGES.map(async (stage) => {
      // Distinct visitors via a row fetch + Set (PostgREST has no count
      // distinct). Capped at 10k rows per stage — ample at current traffic.
      let q = supabase
        .from("funnel_events")
        .select("visitor_id")
        .eq("name", stage)
        .limit(10000);
      if (from) q = q.gte("created_at", from);
      if (to) q = q.lte("created_at", to);

      const { data, error } = await q;
      if (error) {
        ready = false;
        counts[stage] = 0;
      } else {
        counts[stage] = new Set(
          (data ?? []).map((r) => r.visitor_id).filter(Boolean),
        ).size;
      }
    }),
  );

  return NextResponse.json({ ready, counts });
}
