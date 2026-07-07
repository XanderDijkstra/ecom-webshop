// Pure helpers that turn the raw orders list (from /api/admin/orders) into the
// numbers shown across the admin: KPIs, revenue-over-time, top variants. Kept
// framework-free so any view can import it.
import { getProduct } from "./products";

export interface AdminOrder {
  id: string;
  stripe_session_id: string;
  email: string | null;
  customer_name: string | null;
  phone: string | null;
  amount_total: number | null;
  currency: string | null;
  payment_status: string | null;
  shipping_address: Record<string, string | null> | null;
  items: { slug?: string; colorId?: string; qty?: number; bump?: boolean }[] | null;
  fulfillment_status: string | null;
  tracking_number: string | null;
  admin_note: string | null;
  created_at: string;
}

export const isPaid = (o: AdminOrder) =>
  (o.payment_status ?? "").toLowerCase() === "paid";

export const fulfillment = (o: AdminOrder) => o.fulfillment_status ?? "new";

export const orderItems = (o: AdminOrder) =>
  Array.isArray(o.items) ? o.items : [];

export const orderUnits = (o: AdminOrder) =>
  orderItems(o).reduce((s, it) => s + (Number(it.qty) || 0), 0);

export interface Kpis {
  revenue: number;
  orders: number;
  paid: number;
  aov: number;
  units: number;
  toFulfill: number;
  customers: number;
}

export function computeKpis(orders: AdminOrder[]): Kpis {
  const paid = orders.filter(isPaid);
  const revenue = paid.reduce((s, o) => s + (o.amount_total || 0), 0);
  const units = paid.reduce((s, o) => s + orderUnits(o), 0);
  const toFulfill = paid.filter(
    (o) => fulfillment(o) !== "shipped" && fulfillment(o) !== "cancelled",
  ).length;
  const customers = new Set(
    paid.map((o) => (o.email || "").toLowerCase()).filter(Boolean),
  ).size;
  return {
    revenue,
    orders: orders.length,
    paid: paid.length,
    aov: paid.length ? revenue / paid.length : 0,
    units,
    toFulfill,
    customers,
  };
}

export interface SeriesPoint {
  label: string;
  revenue: number;
}

const DM = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit" });
const MON = new Intl.DateTimeFormat("en-GB", { month: "short", year: "2-digit" });

/**
 * Paid revenue bucketed across [from, to]. Granularity adapts to the span so the
 * chart stays readable: daily up to ~2 months, weekly up to ~1 year, else
 * monthly. Buckets are built on the LOCAL calendar.
 */
export function revenueSeries(
  orders: AdminOrder[],
  from: Date,
  to: Date,
): SeriesPoint[] {
  const f = new Date(from);
  f.setHours(0, 0, 0, 0);
  const t = new Date(to);
  t.setHours(0, 0, 0, 0);
  const spanDays = Math.max(
    1,
    Math.round((t.getTime() - f.getTime()) / 86400000) + 1,
  );
  const gran = spanDays <= 62 ? "day" : spanDays <= 372 ? "week" : "month";

  const buckets: { start: number; label: string; revenue: number }[] = [];
  if (gran === "day" || gran === "week") {
    const step = gran === "day" ? 1 : 7;
    const d = new Date(f);
    while (d.getTime() <= t.getTime()) {
      buckets.push({ start: d.getTime(), label: DM.format(d), revenue: 0 });
      d.setDate(d.getDate() + step);
    }
  } else {
    const d = new Date(f.getFullYear(), f.getMonth(), 1);
    const end = new Date(t.getFullYear(), t.getMonth(), 1);
    while (d.getTime() <= end.getTime()) {
      buckets.push({ start: d.getTime(), label: MON.format(d), revenue: 0 });
      d.setMonth(d.getMonth() + 1);
    }
  }

  for (const o of orders) {
    if (!isPaid(o)) continue;
    const od = new Date(o.created_at).getTime();
    let idx = -1;
    for (let i = 0; i < buckets.length; i++) {
      if (buckets[i].start <= od) idx = i;
      else break;
    }
    if (idx >= 0) buckets[idx].revenue += o.amount_total || 0;
  }
  return buckets.map((b) => ({ label: b.label, revenue: b.revenue }));
}

export interface VariantStat {
  key: string;
  product: string;
  variant: string;
  hex?: string;
  units: number;
  revenue: number;
}

/** Units sold per product variant (paid orders). Revenue is approximate
 * (qty × list price) since free BOGO units aren't flagged in order metadata. */
export function topVariants(orders: AdminOrder[]): VariantStat[] {
  const map = new Map<string, VariantStat>();
  for (const o of orders) {
    if (!isPaid(o)) continue;
    for (const it of orderItems(o)) {
      const product = getProduct(it.slug ?? "");
      const color = product?.colors.find((c) => c.id === it.colorId);
      const key = `${it.slug}::${it.colorId}`;
      const units = Number(it.qty) || 0;
      const cur =
        map.get(key) ??
        ({
          key,
          product: product?.name ?? it.slug ?? "Unknown",
          variant: color?.name ?? it.colorId ?? "—",
          hex: color?.hex,
          units: 0,
          revenue: 0,
        } as VariantStat);
      cur.units += units;
      cur.revenue += (product?.priceNok ?? 0) * units;
      map.set(key, cur);
    }
  }
  return [...map.values()].sort((a, b) => b.units - a.units);
}

export const fmtMoney = (n: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "NOK",
    maximumFractionDigits: 0,
  }).format(Math.round(n || 0));

export const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(iso));

export const fmtDateTime = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));

export function addressLine(a: AdminOrder["shipping_address"]): string {
  if (!a) return "—";
  return (
    [
      a.line1,
      a.line2,
      [a.postal_code, a.city].filter(Boolean).join(" "),
      a.country,
    ]
      .filter(Boolean)
      .join(", ") || "—"
  );
}
