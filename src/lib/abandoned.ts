import { createHmac, timingSafeEqual } from "node:crypto";
import { getSupabaseAdmin } from "./supabase";
import { getProduct } from "./products";
import { ORDER_BUMP, bumpUnitPriceNok } from "./offers";

// Server-only data layer for the abandoned-checkout reminder. A row is written
// when a shopper types their email at /kasse (see /api/cart/track). A cron
// (/api/cron/abandoned-cart) later finds rows that are ≥30 min old, unconverted
// and un-reminded, and sends one nudge. recordOrder() marks a row converted when
// the matching email pays. The table is service-role only (RLS on, no policies).

export interface AbandonedItem {
  slug?: string;
  colorId?: string;
  qty?: number;
  free?: boolean;
  bump?: boolean;
}

export interface AbandonedCartRow {
  id: string;
  email: string;
  items: AbandonedItem[] | null;
  subtotal: number | null;
  currency: string | null;
  consent: boolean;
  reminder_sent_at: string | null;
  /** Second (final) flow email — "Tilbudet ditt står fortsatt". */
  reminder2_sent_at: string | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function isEmail(s: unknown): s is string {
  return typeof s === "string" && s.length <= 254 && EMAIL_RE.test(s);
}

const clampQty = (q: unknown) =>
  Math.max(1, Math.min(99, Math.floor(Number(q) || 1)));

/**
 * Re-price a raw cart from the SERVER catalogue into a stored item list +
 * subtotal (client prices are never trusted). Unknown products are dropped.
 */
export function summarizeCart(
  rawItems: unknown,
  bump?: { colorId?: unknown } | null,
): { items: AbandonedItem[]; subtotal: number } {
  const list = Array.isArray(rawItems) ? rawItems : [];
  const items: AbandonedItem[] = [];
  let subtotal = 0;

  for (const raw of list.slice(0, 20)) {
    const it = (raw ?? {}) as Record<string, unknown>;
    const slug = typeof it.slug === "string" ? it.slug : "";
    const colorId = typeof it.colorId === "string" ? it.colorId : "";
    const qty = clampQty(it.qty);
    const free = it.free === true;
    const product = getProduct(slug);
    const color = product?.colors.find((c) => c.id === colorId);
    if (!product || !color) continue;
    items.push({ slug, colorId, qty, ...(free ? { free: true } : {}) });
    if (!free) subtotal += product.priceNok * qty;
  }

  if (bump && typeof bump.colorId === "string") {
    const product = getProduct(ORDER_BUMP.slug);
    const color = product?.colors.find((c) => c.id === bump.colorId);
    if (product && color) {
      items.push({ slug: product.slug, colorId: bump.colorId, qty: 1, bump: true });
      subtotal += bumpUnitPriceNok();
    }
  }

  return { items, subtotal };
}

/** Upsert a shopper's in-progress cart, refreshing the 30-minute timer. */
export async function upsertAbandonedCart(input: {
  email: string;
  items: AbandonedItem[];
  subtotal: number;
  consent: boolean;
}): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !isEmail(input.email) || input.items.length === 0) return false;
  const email = input.email.trim().toLowerCase();

  // onConflict:"email" — new activity resets reminder_sent_at (eligible again)
  // and updated_at (restarts the timer); created_at / converted_at are omitted
  // so an already-converted cart stays converted and the cron keeps skipping it.
  const { error } = await supabase.from("abandoned_carts").upsert(
    {
      email,
      items: input.items,
      subtotal: input.subtotal,
      currency: "NOK",
      consent: !!input.consent,
      reminder_sent_at: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "email" },
  );
  if (error) {
    console.error("[abandoned] upsert failed:", error.message);
    return false;
  }

  // New activity restarts the WHOLE flow, so also clear the step-2 stamp.
  // Separate best-effort update: if the reminder2_sent_at column doesn't exist
  // yet (schema.sql not re-run), the capture above must still succeed.
  await supabase
    .from("abandoned_carts")
    .update({ reminder2_sent_at: null })
    .eq("email", email)
    .then(({ error: e2 }) => {
      if (e2) console.error("[abandoned] reminder2 reset skipped:", e2.message);
    });

  return true;
}

/** Mark a shopper's cart converted (called from recordOrder on a paid order). */
export async function markCartConverted(email: string | null): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !isEmail(email)) return;
  const { error } = await supabase
    .from("abandoned_carts")
    .update({ converted_at: new Date().toISOString() })
    .eq("email", email.trim().toLowerCase())
    .is("converted_at", null);
  if (error) console.error("[abandoned] markConverted failed:", error.message);
}

/** Carts eligible for a reminder: ≥`minutes` old, unconverted, un-reminded. */
export async function dueAbandonedCarts(
  minutes = 30,
  limit = 100,
): Promise<AbandonedCartRow[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  const cutoff = new Date(Date.now() - minutes * 60_000).toISOString();
  const { data, error } = await supabase
    .from("abandoned_carts")
    .select("*")
    .is("reminder_sent_at", null)
    .is("converted_at", null)
    .lte("updated_at", cutoff)
    .order("updated_at", { ascending: true })
    .limit(limit);
  if (error) {
    console.error("[abandoned] due query failed:", error.message);
    return [];
  }
  return (data ?? []) as AbandonedCartRow[];
}

/**
 * Carts due the SECOND (final) flow email: first reminder sent ≥`hours` ago,
 * still unconverted, step 2 not yet sent. Consent is checked by the caller.
 * Returns [] (with a log line) until the reminder2_sent_at column exists.
 */
export async function dueSecondReminders(
  hours = 24,
  limit = 100,
): Promise<AbandonedCartRow[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  const cutoff = new Date(Date.now() - hours * 3_600_000).toISOString();
  const { data, error } = await supabase
    .from("abandoned_carts")
    .select("*")
    .is("reminder2_sent_at", null)
    .is("converted_at", null)
    .not("reminder_sent_at", "is", null)
    .lte("reminder_sent_at", cutoff)
    .order("reminder_sent_at", { ascending: true })
    .limit(limit);
  if (error) {
    console.error("[abandoned] due2 query failed:", error.message);
    return [];
  }
  return (data ?? []) as AbandonedCartRow[];
}

/** Stamp a cart's second (final) email as sent. */
export async function markReminder2Sent(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  const { error } = await supabase
    .from("abandoned_carts")
    .update({ reminder2_sent_at: new Date().toISOString() })
    .eq("id", id);
  if (error) console.error("[abandoned] markReminder2Sent failed:", error.message);
}

/** Stamp a cart as reminded so it's never nudged twice. */
export async function markReminderSent(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  const { error } = await supabase
    .from("abandoned_carts")
    .update({ reminder_sent_at: new Date().toISOString() })
    .eq("id", id);
  if (error) console.error("[abandoned] markReminderSent failed:", error.message);
}

/** Turn off further reminders for an email (one-click unsubscribe). */
export async function suppressEmail(email: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !isEmail(email)) return;
  await supabase
    .from("abandoned_carts")
    .update({ consent: false })
    .eq("email", email.trim().toLowerCase());
}

// --- One-click unsubscribe token (HMAC of the lowercased email) ---------------

function unsubSecret(): string {
  return (
    process.env.EMAIL_UNSUB_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    ""
  );
}

export function unsubToken(email: string): string {
  return createHmac("sha256", unsubSecret())
    .update(email.trim().toLowerCase())
    .digest("hex")
    .slice(0, 32);
}

export function verifyUnsub(email: string, token: string): boolean {
  if (!token) return false;
  const expected = unsubToken(email);
  if (token.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}
