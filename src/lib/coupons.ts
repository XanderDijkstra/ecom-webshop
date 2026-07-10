import { getSupabaseAdmin } from "./supabase";

// Server-side coupon lookup + math. Coupons live in the `coupons` table
// (admin-managed, Marketing tab). Codes are matched case-insensitively;
// the discount is a straight percentage off the server-priced total.

export interface Coupon {
  id: string;
  code: string;
  percent_off: number;
  active: boolean;
  expires_at: string | null;
  created_at: string;
}

export function normalizeCouponCode(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const code = v.trim().toUpperCase();
  return /^[A-Z0-9_-]{2,40}$/.test(code) ? code : null;
}

/** Look up a coupon that is active and not expired; null otherwise. */
export async function findValidCoupon(raw: unknown): Promise<Coupon | null> {
  const code = normalizeCouponCode(raw);
  if (!code) return null;
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  if (error || !data) return null;

  const c = data as Coupon;
  if (!c.active) return null;
  if (c.expires_at && new Date(c.expires_at).getTime() < Date.now()) return null;
  return c;
}

/** Apply a percentage discount to an øre amount (never negative). */
export function discountOre(amountOre: number, percentOff: number): number {
  const pct = Math.min(100, Math.max(0, Math.floor(percentOff)));
  return Math.max(0, Math.round((amountOre * (100 - pct)) / 100));
}
