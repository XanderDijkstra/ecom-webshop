import { NextResponse } from "next/server";
import {
  dueAbandonedCarts,
  markReminderSent,
  isEmail,
} from "@/lib/abandoned";
import { sendAbandonedCartEmail, sendOrderEmails } from "@/lib/email";
import { sendTelegramOrder } from "@/lib/telegram";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";
import { recordOrder } from "@/lib/orders";
import { saleState } from "@/lib/sale";
import { COMPANY } from "@/lib/company";
import {
  listShopifyCatalog,
  shopifyConfigured,
  createShopifyOrder,
  SHOPIFY_VARIANT_MAP,
} from "@/lib/shopify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sends the abandoned-checkout reminder. Meant to run every ~15 min: Vercel Cron
 * (see vercel.json) sends `Authorization: Bearer <CRON_SECRET>` automatically;
 * an external scheduler must send the same header, or `?key=<CRON_SECRET>`.
 * Idempotent — each cart is stamped reminder_sent_at so it's nudged at most once.
 */
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false; // fail closed until configured
  const auth = req.headers.get("authorization") ?? "";
  const bearer = /^bearer /i.test(auth) ? auth.slice(7).trim() : "";
  const key = new URL(req.url).searchParams.get("key") ?? "";
  return bearer === secret || key === secret;
}

async function run() {
  // Never nudge with a dead offer.
  const { live, endsAt } = saleState();
  if (!live) return { skipped: "sale ended", due: 0, sent: 0 };

  const due = await dueAbandonedCarts(30, 100);
  let sent = 0;
  for (const c of due) {
    // Consented recipients only; retire the rest so they aren't re-scanned.
    if (!c.consent) {
      await markReminderSent(c.id);
      continue;
    }
    const res = await sendAbandonedCartEmail({
      email: c.email,
      items: c.items,
      subtotal: c.subtotal,
      currency: c.currency ?? "NOK",
      saleEndsAt: endsAt,
    });
    if (res.ok) {
      await markReminderSent(c.id);
      sent++;
    }
  }
  return { due: due.length, sent };
}

/**
 * Send one real reminder to `email` immediately with a sample cart — bypasses
 * the DB, the 30-min age gate and consent. For previewing the live email; still
 * guarded by CRON_SECRET.
 */
async function testSend(email: string) {
  const { endsAt } = saleState();
  const res = await sendAbandonedCartEmail({
    email,
    items: [{ slug: "baereslyngen", colorId: "aztec", qty: 1 }],
    subtotal: 590,
    currency: "NOK",
    saleEndsAt: endsAt,
  });
  return { test: email, ...res };
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const tg = url.searchParams.get("telegram");

  // Push an EXISTING recorded order (any provider — Stripe or Vipps) into the
  // fulfilment Shopify, reading straight from our orders table. No emails or
  // Telegram are re-sent. Usage: ?shopify=pushref&ref=<stripe_session_id>
  if (url.searchParams.get("shopify") === "pushref") {
    const ref = url.searchParams.get("ref") ?? "";
    const supabase = getSupabaseAdmin();
    if (!ref || !supabase) {
      return NextResponse.json(
        { error: "pass ?ref=… (and DB required)" },
        { status: 400 },
      );
    }
    const { data: row, error } = await supabase
      .from("orders")
      .select("*")
      .eq("stripe_session_id", ref)
      .maybeSingle();
    if (error || !row) {
      return NextResponse.json(
        { error: error?.message ?? "order not found" },
        { status: 404 },
      );
    }
    if ((row.payment_status ?? "").toLowerCase() !== "paid") {
      return NextResponse.json({ skipped: `payment_status=${row.payment_status}` });
    }
    const r = await createShopifyOrder({
      reference: ref,
      email: row.email,
      name: row.customer_name,
      phone: row.phone,
      amountTotal: row.amount_total != null ? Number(row.amount_total) : null,
      currency: row.currency ?? "NOK",
      address: row.shipping_address,
      items: Array.isArray(row.items) ? row.items : [],
    });
    return NextResponse.json({ shopifyPushRef: ref, ...r });
  }

  // Push an EXISTING paid order (by Stripe PaymentIntent id) into the
  // fulfilment Shopify — for orders that predate the sync. Reads the intent
  // from Stripe and calls createShopifyOrder directly; no emails/Telegram are
  // re-sent. Usage: ?shopify=push&pi=pi_xxx
  if (url.searchParams.get("shopify") === "push") {
    const pi_id = url.searchParams.get("pi") ?? "";
    if (!/^pi_[A-Za-z0-9]+$/.test(pi_id)) {
      return NextResponse.json({ error: "pass ?pi=pi_…" }, { status: 400 });
    }
    try {
      const pi = await getStripe().paymentIntents.retrieve(pi_id);
      if (pi.status !== "succeeded") {
        return NextResponse.json({ skipped: `status=${pi.status}` });
      }
      let items: { slug?: string; colorId?: string; qty?: number }[] = [];
      try {
        items = JSON.parse(pi.metadata?.cart ?? "[]");
      } catch {
        /* fall through to empty */
      }
      const r = await createShopifyOrder({
        reference: pi.id,
        email: pi.receipt_email ?? null,
        name: pi.shipping?.name ?? null,
        phone: pi.shipping?.phone ?? null,
        amountTotal: pi.amount != null ? pi.amount / 100 : null,
        currency: (pi.currency ?? "nok").toUpperCase(),
        address: pi.shipping?.address ?? null,
        items,
      });
      return NextResponse.json({ shopifyPush: pi_id, ...r });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
  }

  // Push one sample order into the fulfilment Shopify to verify the sync +
  // watch TeamDrop react. Uses the first mapped colour.
  if (url.searchParams.get("shopify") === "testorder") {
    const colorId = Object.keys(SHOPIFY_VARIANT_MAP)[0];
    if (!colorId) {
      return NextResponse.json({ error: "variant map is empty — map the sling first" });
    }
    const r = await createShopifyOrder({
      reference: "shopify_sync_test",
      email: "hei@baera.shop",
      name: "Test Testesen",
      phone: "+47 400 00 000",
      amountTotal: 590,
      currency: "NOK",
      address: {
        line1: "Testveien 1",
        postal_code: "7655",
        city: "Verdal",
        country: "NO",
      },
      items: [{ slug: "baereslyngen", colorId, qty: 1 }],
    });
    return NextResponse.json({ shopifyTestOrder: true, colorId, ...r });
  }

  // Diagnostic: read the Shopify (nordved) catalog so we can build the
  // colour→variant map for the order sync. Guarded by CRON_SECRET.
  if (url.searchParams.get("shopify") === "catalog") {
    if (!shopifyConfigured()) {
      return NextResponse.json({ error: "SHOPIFY_ADMIN_TOKEN not set" });
    }
    const r = await listShopifyCatalog();
    const products = (r.data?.products.edges ?? []).map((p) => ({
      id: p.node.id,
      title: p.node.title,
      handle: p.node.handle,
      status: p.node.status,
      variants: p.node.variants.edges.map((v) => ({
        id: v.node.id,
        title: v.node.title,
        sku: v.node.sku,
        options: v.node.selectedOptions,
        image: v.node.image?.url ?? null,
      })),
    }));
    return NextResponse.json({ ok: r.ok, errors: r.errors ?? null, products });
  }

  // Backfill: pull PaymentIntents straight from Stripe and run them through the
  // SAME recordOrder pipeline the webhook uses (orders + emails + CAPI +
  // Telegram, deduped by stripe_session_id). For orders whose webhook delivery
  // never reached this app. Usage: ?backfill=pi_xxx,pi_yyy
  const backfill = url.searchParams.get("backfill");
  if (backfill) {
    const ids = backfill
      .split(",")
      .map((s) => s.trim())
      .filter((s) => /^pi_[A-Za-z0-9]+$/.test(s))
      .slice(0, 10);
    const results: Record<string, unknown>[] = [];
    for (const id of ids) {
      try {
        const pi = await getStripe().paymentIntents.retrieve(id);
        if (pi.status !== "succeeded") {
          results.push({ id, skipped: `status=${pi.status}` });
          continue;
        }
        await recordOrder({
          id: pi.id,
          email: pi.receipt_email ?? null,
          name: pi.shipping?.name ?? null,
          phone: pi.shipping?.phone ?? null,
          amountTotal: pi.amount != null ? pi.amount / 100 : null,
          currency: (pi.currency ?? "nok").toUpperCase(),
          paymentStatus: "paid",
          address: pi.shipping?.address ?? null,
          cart: pi.metadata?.cart,
          mc: pi.metadata?.mc,
          fbp: pi.metadata?.fbp ?? null,
          fbc: pi.metadata?.fbc ?? null,
          method: "card",
        });
        results.push({ id, recorded: true, email: pi.receipt_email });
      } catch (e) {
        results.push({ id, error: (e as Error).message });
      }
    }
    return NextResponse.json({ backfill: results });
  }

  // Diagnostic: read straight from the orders table so we know whether the
  // Stripe webhook is actually persisting orders (guarded by CRON_SECRET).
  if (url.searchParams.get("orders")) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({
        ordersCount: null,
        note: "getSupabaseAdmin() returned null — SUPABASE_SERVICE_ROLE_KEY not set in this runtime",
      });
    }
    const { data, error, count } = await supabase
      .from("orders")
      .select("id,stripe_session_id,email,amount_total,payment_status,created_at", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .limit(10);
    return NextResponse.json({
      ordersCount: count,
      dbError: error?.message ?? null,
      recent: data,
    });
  }

  // Helper: list the chats that have messaged the bot, so we can read the right
  // TELEGRAM_CHAT_ID. Message the bot first, then call ?telegram=updates.
  // Also reports what chat id THIS runtime actually has, to catch env typos.
  if (tg === "updates") {
    const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
    const configured = process.env.TELEGRAM_CHAT_ID ?? null;
    if (!token) {
      return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not set", configured });
    }
    try {
      const r = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
      const d = (await r.json()) as {
        ok?: boolean;
        result?: Array<Record<string, { chat?: Record<string, unknown> }>>;
      };
      const seen = new Map<unknown, unknown>();
      for (const u of d.result ?? []) {
        const chat =
          u.message?.chat ?? u.channel_post?.chat ?? u.my_chat_member?.chat;
        if (chat && !seen.has(chat.id)) seen.set(chat.id, chat);
      }
      return NextResponse.json({
        botOk: d.ok,
        configured,
        chats: [...seen.values()],
      });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message, configured });
    }
  }

  // Diagnostic: recent outbound-email log + which email env vars this runtime
  // actually has (presence only, never values). For chasing missing emails.
  if (url.searchParams.get("emails")) {
    const supabase = getSupabaseAdmin();
    const env = {
      RESEND_API_KEY: !!process.env.RESEND_API_KEY?.trim(),
      ORDER_FROM: process.env.ORDER_FROM?.trim() || "(unset → onboarding@resend.dev)",
      ORDER_NOTIFY_TO: process.env.ORDER_NOTIFY_TO?.trim() || "(unset → hei@baera.shop)",
      META_CAPI_ACCESS_TOKEN: !!process.env.META_CAPI_ACCESS_TOKEN?.trim(),
      META_CAPI_TEST_EVENT_CODE: !!process.env.META_CAPI_TEST_EVENT_CODE?.trim(),
    };
    if (!supabase) return NextResponse.json({ env, log: null });
    const { data, error } = await supabase
      .from("email_log")
      .select("type,recipient,subject,status,error,created_at")
      .order("created_at", { ascending: false })
      .limit(15);
    return NextResponse.json({
      env,
      logError: error?.message ?? null,
      log: data,
    });
  }

  // Fire the full order-email pipeline (admin alert + customer confirmation)
  // with a sample order, so both land where they can be inspected. By default
  // the customer confirmation goes to the same inbox as the admin alert; pass
  // ?orderemail=<address> to send the confirmation to a specific address.
  const orderEmailParam = url.searchParams.get("orderemail");
  if (orderEmailParam) {
    const inbox = process.env.ORDER_NOTIFY_TO?.trim() || COMPANY.email;
    const customerTo = isEmail(orderEmailParam) ? orderEmailParam : inbox;
    await sendOrderEmails({
      id: "test_order_email",
      email: customerTo,
      name: "Test Testesen",
      amountTotal: 590,
      currency: "NOK",
      items: [
        { slug: "baereslyngen", colorId: "aztec", qty: 1 },
        { slug: "baereslyngen", colorId: "sort", qty: 1, bump: true },
      ],
      address: {
        line1: "Testveien 1",
        postal_code: "7655",
        city: "Verdal",
        country: "NO",
      },
      phone: "+47 400 00 000",
      method: "card",
    });
    return NextResponse.json({
      orderEmailTest: true,
      adminAlertTo: inbox,
      customerConfirmationTo: customerTo,
      note: "admin alert + customer confirmation sent; check the inbox + Marketing tab",
    });
  }

  // Fire a sample order to Telegram to verify the bot token + chat id are live.
  if (tg) {
    const r = await sendTelegramOrder({
      id: "telegram_test",
      email: "test@baera.shop",
      name: "Test Testesen",
      amountTotal: 590,
      currency: "NOK",
      items: [{ slug: "baereslyngen", colorId: "aztec", qty: 1 }],
      address: {
        line1: "Testveien 1",
        postal_code: "7655",
        city: "Verdal",
        country: "NO",
      },
      phone: "+47 400 00 000",
      method: "card",
    });
    return NextResponse.json({ telegramTest: true, ...r });
  }

  const test = url.searchParams.get("test");
  if (test) {
    if (!isEmail(test)) {
      return NextResponse.json({ error: "Invalid test email" }, { status: 400 });
    }
    return NextResponse.json(await testSend(test));
  }
  return NextResponse.json(await run());
}

// Allow POST too, for schedulers that prefer it.
export const POST = GET;
