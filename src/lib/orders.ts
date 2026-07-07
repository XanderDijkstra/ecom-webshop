import { getSupabaseAdmin } from "./supabase";
import { sendCapiPurchase } from "./capi";
import { sendOrderEmails } from "./email";
import { sendTelegramOrder } from "./telegram";
import { createShopifyOrder } from "./shopify";
import { markCartConverted } from "./abandoned";
import { SITE } from "./site";

// Shared order-recording pipeline. Both the Stripe webhook and the Vipps flow
// normalise their provider payload into an OrderInput and call recordOrder().
// It persists the order (dedup + upsert), fires the Meta CAPI Purchase, and
// sends the admin + customer emails — exactly once per order.

/** Provider-agnostic delivery address (superset of Stripe.Address / Vipps). */
export interface OrderAddress {
  line1?: string | null;
  line2?: string | null;
  postal_code?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}

export interface OrderInput {
  /** Unique order reference (Stripe id or Vipps reference) — the dedup key. */
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  amountTotal: number | null;
  currency: string;
  paymentStatus: string | null;
  address: OrderAddress | null;
  cart: string | undefined;
  mc: string | undefined;
  fbp: string | null;
  fbc: string | null;
  /** "card" | "vipps" — surfaced in the admin email only (not persisted). */
  method?: string;
}

/** Persist a paid order (when a DB is configured) and fire CAPI + emails. */
export async function recordOrder(o: OrderInput) {
  const supabase = getSupabaseAdmin();
  const order = {
    stripe_session_id: o.id,
    email: o.email,
    customer_name: o.name,
    phone: o.phone,
    amount_total: o.amountTotal,
    currency: o.currency,
    payment_status: o.paymentStatus,
    shipping_address: o.address,
    items: safeParse(o.cart),
  };

  // Webhooks / return-URL finalisation can deliver more than once; only email
  // on the first sighting.
  let isNew = true;
  if (supabase) {
    const { data: existing } = await supabase
      .from("orders")
      .select("id")
      .eq("stripe_session_id", o.id)
      .maybeSingle();
    isNew = !existing;

    const { error } = await supabase
      .from("orders")
      .upsert(order, { onConflict: "stripe_session_id" });
    if (error) {
      console.error("[orders] insert failed:", error.message);
      // Swallow so the provider doesn't retry forever on a schema issue.
    }
  } else {
    console.log("[orders] paid order (no DB configured):", order);
  }

  // Meta Conversions API: server-side Purchase, deduplicated with the browser
  // pixel via the order id as event_id. Only when marketing cookies accepted.
  if (o.mc === "1" && order.payment_status === "paid") {
    await sendCapiPurchase({
      eventId: o.id,
      value: order.amount_total ?? 0,
      currency: order.currency,
      contentIds: cartSlugs(order.items),
      eventSourceUrl: `${SITE.url}/takk`,
      user: {
        email: order.email,
        phone: order.phone,
        fbp: o.fbp,
        fbc: o.fbc,
      },
    });
  }

  // A paid order clears any pending abandoned-checkout reminder for this email
  // (idempotent, so safe on webhook re-delivery).
  if (order.payment_status === "paid") {
    await markCartConverted(order.email);
  }

  // Notifications (admin email + customer confirmation + Telegram) — only on
  // the first sighting of a paid order, so retries never double-notify.
  if (isNew && order.payment_status === "paid") {
    const notification = {
      id: o.id,
      email: order.email,
      name: order.customer_name,
      amountTotal: order.amount_total,
      currency: order.currency,
      items: Array.isArray(order.items) ? order.items : null,
      address: o.address,
      phone: order.phone,
      method: o.method,
    };
    await sendOrderEmails(notification);
    await sendTelegramOrder(notification);

    // Fulfilment: mirror the paid order into the Shopify store TeamDrop is
    // connected to. Only on first sighting, so webhook retries can't create
    // duplicate Shopify orders. Best-effort — a sync failure never blocks the
    // pipeline (the order is already recorded + notified).
    const sync = await createShopifyOrder({
      reference: o.id,
      email: order.email,
      name: order.customer_name,
      phone: order.phone,
      amountTotal: order.amount_total,
      currency: order.currency,
      address: o.address,
      items: Array.isArray(order.items) ? order.items : [],
    });
    if (!sync.ok) {
      console.error("[shopify] order not synced:", JSON.stringify(sync));
    }
  }
}

/** Unique product slugs from the cart metadata, for Meta content_ids. */
function cartSlugs(items: unknown): string[] {
  if (!Array.isArray(items)) return ["baereslyngen"];
  const slugs = [
    ...new Set(
      items
        .map((i) =>
          i && typeof i === "object" ? (i as { slug?: string }).slug : null,
        )
        .filter((s): s is string => typeof s === "string"),
    ),
  ];
  return slugs.length ? slugs : ["baereslyngen"];
}

function safeParse(v: string | undefined) {
  if (!v) return null;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
}
