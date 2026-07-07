// Transactional email via Resend (https://resend.com). Plain fetch, no SDK.
// No-ops when RESEND_API_KEY is unset, so the store runs without email until
// you add the key + a verified sending domain.
import { COMPANY } from "./company";
import { getProduct } from "./products";
import type { ProductColor } from "./products";
import { getSupabaseAdmin } from "./supabase";
import { unsubToken, type AbandonedItem } from "./abandoned";

export interface OrderEmailData {
  id: string;
  email: string | null;
  name: string | null;
  amountTotal: number | null;
  currency: string;
  items: { slug?: string; colorId?: string; qty?: number; bump?: boolean }[] | null;
  address: {
    line1?: string | null;
    line2?: string | null;
    postal_code?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
  } | null;
  phone: string | null;
  /** "card" | "vipps" — shown in the admin alert. */
  method?: string;
}

/** Human label for the payment method used. */
function methodLabel(method?: string): string {
  if (method === "vipps") return "Vipps";
  if (method === "card") return "Kort";
  return "—";
}

const money = (n: number, ccy: string) =>
  new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: ccy || "NOK",
    maximumFractionDigits: 0,
  }).format(n || 0);

const dateNo = (d: Date) =>
  new Intl.DateTimeFormat("nb-NO", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);

/** Absolute URL for a /public asset, so email clients can load it.
 *  WebP is swapped for JPEG: the site serves .webp, but Outlook on Windows
 *  can't render it, so email points at the .jpg twin generated alongside it. */
function emailImageUrl(path: string): string {
  if (!path) return "";
  const jpg = path.replace(/\.webp$/i, ".jpg");
  if (/^https?:\/\//i.test(jpg)) return jpg;
  return `${COMPANY.url}${jpg.startsWith("/") ? "" : "/"}${jpg}`;
}

/** Thumbnail cell for a variant, or an empty spacer when no image is known.
 *  Width/height are set as attributes AND inline styles for Outlook, which
 *  ignores CSS sizing on <img>. */
function thumbCell(c: ProductColor | undefined, alt: string): string {
  if (!c?.image) {
    return `<td width="56" style="width:56px"></td>`;
  }
  return `<td width="56" style="width:56px;vertical-align:top">
    <img src="${emailImageUrl(c.image)}" width="56" height="56" alt="${alt}"
      style="width:56px;height:56px;object-fit:cover;border-radius:8px;display:block;border:1px solid #eee" />
  </td>`;
}

/** Order/cart line items as table rows, each with the variant thumbnail.
 *  Rows are dropped into a `<table><tbody>…</tbody></table>` by the caller. */
function itemLines(items: OrderEmailData["items"]): string {
  const rows = (Array.isArray(items) ? items : []).map((it) => {
    const p = getProduct(it.slug ?? "");
    const c = p?.colors.find((x) => x.id === it.colorId);
    const name = p?.name ?? it.slug ?? "Produkt";
    const variant = c?.name ?? it.colorId ?? "";
    return `<tr>
      ${thumbCell(c, `${name} — ${variant}`)}
      <td style="padding:8px 0 8px 12px;vertical-align:top">
        <div style="font-weight:600">${name}</div>
        <div style="color:#8a8a84;font-size:13px">${variant}${
          it.bump ? " · tilbud −30%" : ""
        }</div>
      </td>
      <td style="padding:8px 0;text-align:right;vertical-align:top;white-space:nowrap;color:#8a8a84">× ${
        it.qty ?? 1
      }</td>
    </tr>`;
  });
  return rows.join("") || `<tr><td style="padding:8px 0">—</td></tr>`;
}

function addressBlock(a: OrderEmailData["address"]): string {
  if (!a) return "—";
  return [
    a.line1,
    a.line2,
    [a.postal_code, a.city].filter(Boolean).join(" "),
    a.country,
  ]
    .filter(Boolean)
    .join("<br>");
}

function shell(title: string, body: string): string {
  return `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#1c1c1a">
    <div style="font-size:22px;letter-spacing:.04em;font-weight:600;padding:8px 0 16px">BÆRA</div>
    <h1 style="font-size:19px;margin:0 0 16px">${title}</h1>
    ${body}
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
    <p style="font-size:12px;color:#8a8a84">${COMPANY.legalName} · Org.nr ${COMPANY.orgNr} · ${COMPANY.email}</p>
  </div>`;
}

// --- Plain-text alternatives -------------------------------------------------
// Every email ships a hand-written text/plain part alongside the HTML. Letting
// Resend auto-derive it from the HTML tables produced run-on garbage, which
// spam filters penalise; a clean text part improves inbox placement.

/** Line items as plain text, one per line: "1 × Bæreslyngen — Sort". */
function itemLinesText(items: OrderEmailData["items"]): string {
  const rows = (Array.isArray(items) ? items : []).map((it) => {
    const p = getProduct(it.slug ?? "");
    const c = p?.colors.find((x) => x.id === it.colorId);
    const name = p?.name ?? it.slug ?? "Produkt";
    const variant = c?.name ?? it.colorId ?? "";
    return `${it.qty ?? 1} × ${name}${variant ? ` — ${variant}` : ""}${
      it.bump ? " (tilbud −30%)" : ""
    }`;
  });
  return rows.join("\n") || "—";
}

function addressText(a: OrderEmailData["address"]): string {
  if (!a) return "—";
  return [
    a.line1,
    a.line2,
    [a.postal_code, a.city].filter(Boolean).join(" "),
    a.country,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Wrap a plain-text body with the same brand header + legal footer as shell(). */
function textShell(title: string, body: string): string {
  return `BÆRA\n\n${title}\n\n${body}\n\n—\n${COMPANY.legalName} · Org.nr ${COMPANY.orgNr} · ${COMPANY.email}`;
}

export interface SendResult {
  ok: boolean;
  status?: number;
  error?: string;
}

/** Email categories recorded in the admin's Marketing log. */
export type EmailType = "order_confirmation" | "order_admin" | "cart_reminder";

/** Record every outbound email in email_log for the admin Marketing tab.
 *  Best-effort: a missing table or DB hiccup must never block sending. */
async function logEmail(
  type: EmailType,
  p: { to: string; subject: string; html: string },
  r: SendResult,
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return;
    await supabase.from("email_log").insert({
      type,
      recipient: p.to,
      subject: p.subject,
      html: p.html,
      status: r.ok ? "sent" : "failed",
      error: r.error ?? null,
    });
  } catch {
    /* never interfere with delivery */
  }
}

async function send(
  key: string,
  payload: {
    from: string;
    to: string;
    subject: string;
    html: string;
    /** Plain-text alternative — always set, for deliverability. */
    text?: string;
    /** Where replies should go (we send from ordre@, replies want hei@). */
    replyTo?: string;
    /** Extra SMTP headers, e.g. List-Unsubscribe on marketing mail. */
    headers?: Record<string, string>;
  },
  type: EmailType,
): Promise<SendResult> {
  let result: SendResult;
  try {
    // Resend uses snake_case for reply_to; map our camelCase payload to it.
    const { replyTo, ...rest } = payload;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(replyTo ? { ...rest, reply_to: replyTo } : rest),
    });
    if (!res.ok) {
      const error = (await res.text()).slice(0, 300);
      console.error("[email] resend failed:", res.status, error);
      result = { ok: false, status: res.status, error };
    } else {
      result = { ok: true, status: res.status };
    }
  } catch (err) {
    const error = (err as Error).message;
    console.error("[email] resend error:", error);
    result = { ok: false, error };
  }
  await logEmail(type, payload, result);
  return result;
}

/** Send the admin new-order alert and the customer confirmation (best-effort). */
export async function sendOrderEmails(o: OrderEmailData): Promise<void> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return;

  const from = process.env.ORDER_FROM?.trim() || `BÆRA <onboarding@resend.dev>`;
  // Order alerts default to the company inbox (hei@baera.shop, now a real
  // mailbox); ORDER_NOTIFY_TO overrides it.
  const notifyTo = process.env.ORDER_NOTIFY_TO?.trim() || COMPANY.email;
  const total = money(o.amountTotal ?? 0, o.currency);
  const items = itemLines(o.items);
  const itemsText = itemLinesText(o.items);
  // Replies to ordre@ would vanish; send them to the monitored inbox instead.
  const replyTo = COMPANY.email;

  // Admin notification
  await send(key, {
    from,
    to: notifyTo,
    replyTo,
    subject: `Ny ordre · ${total}${o.name ? ` · ${o.name}` : ""}`,
    text: textShell(
      "Ny ordre 🎉",
      `Kunde: ${o.name ?? "—"}\nE-post: ${o.email ?? "—"}\nTelefon: ${
        o.phone ?? "—"
      }\nBetaling: ${methodLabel(o.method)}\nBeløp: ${total}\n\nVarer:\n${itemsText}\n\nLeveringsadresse:\n${addressText(
        o.address,
      )}\n\nÅpne admin: ${COMPANY.url}/admin`,
    ),
    html: shell(
      "Ny ordre 🎉",
      `<table style="font-size:14px;width:100%"><tbody>
        <tr><td style="color:#8a8a84;padding:3px 0">Kunde</td><td style="text-align:right">${o.name ?? "—"}</td></tr>
        <tr><td style="color:#8a8a84;padding:3px 0">E-post</td><td style="text-align:right">${o.email ?? "—"}</td></tr>
        <tr><td style="color:#8a8a84;padding:3px 0">Telefon</td><td style="text-align:right">${o.phone ?? "—"}</td></tr>
        <tr><td style="color:#8a8a84;padding:3px 0">Betaling</td><td style="text-align:right">${methodLabel(o.method)}</td></tr>
        <tr><td style="color:#8a8a84;padding:3px 0">Beløp</td><td style="text-align:right;font-weight:600">${total}</td></tr>
      </tbody></table>
      <p style="font-size:13px;color:#8a8a84;margin:16px 0 4px">Varer</p>
      <table style="font-size:14px;width:100%"><tbody>${items}</tbody></table>
      <p style="font-size:13px;color:#8a8a84;margin:16px 0 4px">Leveringsadresse</p>
      <p style="font-size:14px;margin:0">${addressBlock(o.address)}</p>
      <p style="margin:20px 0 0"><a href="${COMPANY.url}/admin" style="display:inline-block;background:#1c1c1a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px">Åpne admin</a></p>`,
    ),
  }, "order_admin");

  // Customer confirmation
  if (o.email) {
    const firstName = o.name ? o.name.split(" ")[0] : "";
    await send(key, {
      from,
      to: o.email,
      replyTo,
      subject: "Takk for bestillingen din hos BÆRA",
      text: textShell(
        "Takk for bestillingen!",
        `Hei ${firstName}, vi har mottatt bestillingen din og pakker den snart. Du får sporing på e-post når den sendes.\n\nDin bestilling:\n${itemsText}\n\nFrakt: Gratis\nTotalt: ${total}\n\nSpørsmål? Svar på denne e-posten eller kontakt ${COMPANY.email}.`,
      ),
      html: shell(
        "Takk for bestillingen!",
        `<p style="font-size:14px;line-height:1.6">Hei ${
          o.name ? o.name.split(" ")[0] : ""
        }, vi har mottatt bestillingen din og pakker den snart. Du får sporing på e-post når den sendes.</p>
        <p style="font-size:13px;color:#8a8a84;margin:16px 0 4px">Din bestilling</p>
        <table style="font-size:14px;width:100%"><tbody>${items}</tbody></table>
        <table style="font-size:14px;width:100%;margin-top:8px"><tbody>
          <tr><td style="color:#8a8a84;padding:3px 0">Frakt</td><td style="text-align:right">Gratis</td></tr>
          <tr><td style="padding:3px 0;font-weight:600">Totalt</td><td style="text-align:right;font-weight:600">${total}</td></tr>
        </tbody></table>
        <p style="font-size:13px;color:#8a8a84;margin-top:20px">Spørsmål? Svar på denne e-posten eller kontakt ${COMPANY.email}.</p>`,
      ),
    }, "order_confirmation");
  }
}

export interface AbandonedEmailData {
  email: string;
  items: AbandonedItem[] | null;
  subtotal: number | null;
  currency: string;
  /** Sale deadline (adds truthful urgency) or null when the sale is open-ended. */
  saleEndsAt: Date | null;
}

/**
 * The abandoned-checkout reminder: a single nudge to a shopper who entered their
 * email at /kasse but didn't pay. Best-effort; returns whether it was sent so
 * the cron only stamps reminder_sent_at on success. Always carries an
 * unsubscribe link (markedsføringsloven), and only the cron decides who is
 * eligible (consent + live sale).
 */
export async function sendAbandonedCartEmail(
  o: AbandonedEmailData,
): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return { ok: false, error: "RESEND_API_KEY not set" };
  if (!o.email) return { ok: false, error: "no recipient" };

  const from = process.env.ORDER_FROM?.trim() || `BÆRA <onboarding@resend.dev>`;
  const items = itemLines(o.items);
  const total = money(o.subtotal ?? 0, o.currency);
  const checkoutUrl = `${COMPANY.url}/kasse`;
  const unsubUrl = `${COMPANY.url}/api/email/unsubscribe?e=${encodeURIComponent(
    o.email,
  )}&t=${unsubToken(o.email)}`;

  const urgencyText = o.saleEndsAt
    ? `🔥 Sommersalget varer bare til ${dateNo(
        o.saleEndsAt,
      )}. Fullfør nå for å sikre deg tilbudsprisen.`
    : `Slyngene våre selges raskt — sikre din før favorittmønsteret blir utsolgt.`;
  const urgency = `<p style="font-size:14px;line-height:1.6;background:#f7f1e8;border-radius:8px;padding:12px 14px;margin:16px 0">${
    o.saleEndsAt
      ? urgencyText.replace(
          dateNo(o.saleEndsAt),
          `<strong>${dateNo(o.saleEndsAt)}</strong>`,
        )
      : urgencyText
  }</p>`;

  return send(key, {
    from,
    to: o.email,
    subject: "Du glemte noe hos BÆRA 🧡",
    // Replies go to the monitored inbox; and one-click unsubscribe (RFC 8058)
    // so Gmail/Apple show a native "Unsubscribe" and trust the mail more.
    replyTo: COMPANY.email,
    headers: {
      "List-Unsubscribe": `<${unsubUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
    text: textShell(
      "Handlekurven venter på deg",
      `Hei! Vi tok vare på handlekurven din. Den ligger klar – fullfør bestillingen når det passer deg.\n\nI handlekurven din:\n${itemLinesText(
        o.items,
      )}\n\nFrakt: Gratis\nSum: ${total}\n\n${urgencyText}\n\nFullfør bestillingen: ${checkoutUrl}\n\nDu får denne e-posten fordi du la igjen e-postadressen din i kassen hos BÆRA. Meld deg av: ${unsubUrl}`,
    ),
    html: shell(
      "Handlekurven venter på deg",
      `<p style="font-size:14px;line-height:1.6">Hei! Vi tok vare på handlekurven din. Den ligger klar – fullfør bestillingen når det passer deg.</p>
      <p style="font-size:13px;color:#8a8a84;margin:16px 0 4px">I handlekurven din</p>
      <table style="font-size:14px;width:100%"><tbody>${items}</tbody></table>
      <table style="font-size:14px;width:100%;margin-top:8px"><tbody>
        <tr><td style="color:#8a8a84;padding:3px 0">Frakt</td><td style="text-align:right">Gratis</td></tr>
        <tr><td style="padding:3px 0;font-weight:600">Sum</td><td style="text-align:right;font-weight:600">${total}</td></tr>
      </tbody></table>
      ${urgency}
      <p style="margin:22px 0 0"><a href="${checkoutUrl}" style="display:inline-block;background:#1c1c1a;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:15px;font-weight:600">Fullfør bestillingen</a></p>
      <p style="font-size:11px;color:#8a8a84;margin-top:24px">Du får denne e-posten fordi du la igjen e-postadressen din i kassen hos BÆRA. Vil du ikke ha flere påminnelser? <a href="${unsubUrl}" style="color:#8a8a84">Meld deg av her</a>.</p>`,
    ),
  }, "cart_reminder");
}
