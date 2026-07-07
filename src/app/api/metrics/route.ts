import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Read-only revenue feed for the central BLANQ dashboard
 * (Omzet → Shop koppelen → Eigen REST API).
 *
 * GET /api/metrics with `Authorization: Bearer <BLANQ_METRICS_TOKEN>` returns
 * paid revenue per UTC day for the last 35 days:
 *
 *   { "currency": "NOK", "daily": [{ "date": "2026-07-01", "revenue": 590, "orders": 1 }] }
 *
 * Days without sales are omitted (the dashboard treats them as 0). Only orders
 * with payment_status "paid" count; amount_total is already stored in major
 * units (kroner). Refunds aren't tracked in the orders table, so they are not
 * subtracted.
 */

const WINDOW_DAYS = 35;

function authorized(req: Request): boolean {
  const token = process.env.BLANQ_METRICS_TOKEN?.trim();
  if (!token) return false; // fail closed until configured
  const auth = req.headers.get("authorization") ?? "";
  const bearer = /^bearer /i.test(auth) ? auth.slice(7).trim() : "";
  return bearer === token;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database isn't configured." },
      { status: 503 },
    );
  }

  const fromIso = new Date(
    Date.now() - WINDOW_DAYS * 86400000,
  ).toISOString();

  const { data, error } = await supabase
    .from("orders")
    .select("created_at,amount_total,payment_status,currency")
    .gte("created_at", fromIso)
    .order("created_at", { ascending: true })
    .limit(10000);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const byDay = new Map<string, { revenue: number; orders: number }>();
  let currency = "NOK";
  for (const o of data ?? []) {
    if ((o.payment_status ?? "").toLowerCase() !== "paid") continue;
    if (o.currency) currency = String(o.currency).toUpperCase();
    const date = new Date(o.created_at).toISOString().slice(0, 10); // UTC day
    const day = byDay.get(date) ?? { revenue: 0, orders: 0 };
    day.revenue += Number(o.amount_total) || 0;
    day.orders += 1;
    byDay.set(date, day);
  }

  const daily = [...byDay.entries()].map(([date, d]) => ({
    date,
    revenue: Math.round(d.revenue * 100) / 100,
    orders: d.orders,
  }));

  return NextResponse.json({ currency, daily });
}
