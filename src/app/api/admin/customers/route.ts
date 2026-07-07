import { NextResponse } from "next/server";
import { authenticateAdmin, getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface CustomerRow {
  email: string;
  name: string | null;
  phone: string | null;
  orders: number;
  totalSpent: number;
  lastOrderAt: string;
}

export interface LeadRow {
  email: string;
  items: unknown;
  subtotal: number | null;
  consent: boolean;
  reminder_sent_at: string | null;
  updated_at: string;
}

/**
 * Customer base for the admin: paying customers aggregated from orders, and
 * leads (entered an email at checkout but never paid) from abandoned_carts.
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

  // Customers: aggregate paid orders per email.
  const { data: orders, error: ordersErr } = await supabase
    .from("orders")
    .select("email,customer_name,phone,amount_total,payment_status,created_at")
    .order("created_at", { ascending: false })
    .limit(2000);
  if (ordersErr)
    return NextResponse.json({ error: ordersErr.message }, { status: 500 });

  const byEmail = new Map<string, CustomerRow>();
  for (const o of orders ?? []) {
    if ((o.payment_status ?? "").toLowerCase() !== "paid") continue;
    const email = (o.email ?? "").toLowerCase();
    if (!email) continue;
    const cur = byEmail.get(email);
    if (cur) {
      cur.orders += 1;
      cur.totalSpent += Number(o.amount_total) || 0;
      // orders are newest-first, so name/phone/lastOrderAt are already set
      // from the most recent order.
      if (!cur.name && o.customer_name) cur.name = o.customer_name;
      if (!cur.phone && o.phone) cur.phone = o.phone;
    } else {
      byEmail.set(email, {
        email,
        name: o.customer_name ?? null,
        phone: o.phone ?? null,
        orders: 1,
        totalSpent: Number(o.amount_total) || 0,
        lastOrderAt: o.created_at,
      });
    }
  }
  const customers = [...byEmail.values()].sort(
    (a, b) => b.totalSpent - a.totalSpent,
  );

  // Leads: unconverted abandoned carts, minus anyone who is now a customer.
  let leads: LeadRow[] = [];
  const { data: carts, error: cartsErr } = await supabase
    .from("abandoned_carts")
    .select("email,items,subtotal,consent,reminder_sent_at,updated_at")
    .is("converted_at", null)
    .order("updated_at", { ascending: false })
    .limit(1000);
  if (!cartsErr && carts) {
    leads = (carts as LeadRow[]).filter(
      (c) => !byEmail.has((c.email ?? "").toLowerCase()),
    );
  }

  return NextResponse.json({ customers, leads });
}
