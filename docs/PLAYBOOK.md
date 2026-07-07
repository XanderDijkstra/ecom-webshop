---
tags: [claude, ecommerce, playbook, nextjs, stripe, supabase, SOP, reusable]
project: "[[Bæra]]"
stack: Next.js (App Router) + Stripe + Supabase + Vercel + Resend
status: live
created: 2026-07-01
url: https://www.baera.shop
---

# Bæra — E-commerce Build Playbook

> **What this is.** The complete build record *and* a reusable blueprint for a self-hosted, single-product (or small-catalog) e-commerce store with a custom on-domain checkout and a Shopify-style admin — **without Shopify**. Everything here is stack-agnostic enough to lift into the next store. The live reference implementation is **[[Bæra]]** (`baera.shop`), a Norwegian ergonomic baby-carrier store run by **FX MEDIA AS**.
>
> If you're starting a new store: read **§1 Architecture** and **§9 Reusable blueprint**, then copy the file map in **§10**.

Related: [[Xander - Context Profile]] · [[Project URL and Supabase Registry]] · [[Claude Command Center]]

---

## 0. The core insight (why this exists)

Xander's first instinct was: *"How could I manage orders? No way without a DB."* Correct — Stripe alone gives you payments, not an order book, not fulfillment tracking, not customer records. So the architecture is:

```
Customer → custom checkout (our domain) → Stripe (charges card)
                                              │
                                    webhook (source of truth)
                                              │
                              ┌───────────────┼────────────────┐
                              ▼               ▼                ▼
                         Supabase        Resend email     Meta CAPI
                        (orders DB)    (you + customer)   (ad tracking)
                              │
                              ▼
                        /admin (read/write the DB)
```

**The webhook is the source of truth, not the browser.** The customer's browser redirecting to a "thank you" page is *not* proof of payment — it can be faked, closed, or lost. Stripe's server-to-server webhook firing `payment_intent.succeeded` / `checkout.session.completed` is the only trustworthy "money arrived" signal. Everything downstream (save order, email, track conversion) hangs off the webhook.

**Why not just use Shopify?** Cost per sale, no control over checkout UX/domain, template lock-in. This stack is ~€0 fixed cost (Vercel/Supabase/Resend free tiers) + Stripe's 1.4–2.9% + a fixed fee. You own the code and the data.

---

## 1. Architecture & stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router)** on Vercel | Route Handlers give you serverless API endpoints (checkout, webhook, admin) next to the storefront. Auto-deploy from `main`. |
| Payments | **Stripe** (Payment Element, custom) | On-domain checkout, all payment methods (card, Klarna, Google/Apple Pay, Vipps later) with zero per-method code. |
| Database | **Supabase** (Postgres) | Free, hosted Postgres + Auth. Orders table + admin login in one. |
| Admin auth | **Supabase Auth** (email/password) | Reuse the same project. Gate `/admin` by email allowlist. |
| Email | **Resend** | Dead-simple transactional email via one `fetch`. No-ops until configured, so nothing breaks pre-launch. |
| Ad tracking | **Meta Pixel + Conversions API** | Full funnel (PageView, ViewContent, AddToCart, InitiateCheckout, Purchase) on browser pixel **and** server-side CAPI, deduped by shared `event_id`, for iOS-/ad-blocker-proof tracking. |
| Hosting/env | **Vercel** | Env vars, auto-deploy, runtime logs. |

**Key mental model — three trust tiers of keys:**
- `pk_...` **publishable** → public, safe in the browser and in client bundles. Claude may handle these.
- `sk_...` **secret** / `rk_...` **restricted** → server-only. Live ONLY in Vercel env. Claude must **never** type these into a field — hand off to the user.
- `SUPABASE_SERVICE_ROLE_KEY` → server-only god key, bypasses RLS. Never prefix `NEXT_PUBLIC_`.

---

## 2. Stripe integration

### 2.1 Two checkout styles (we built both, kept the custom one)
1. **Hosted Checkout Session** (`stripe.checkout.sessions.create`) — redirect to `checkout.stripe.com`. Fastest to ship, but off-domain and Stripe-branded. We built this first to validate the pipeline.
2. **Custom Payment Element** (`/kasse`) — **the one we shipped.** On our domain, Shopify-style split layout, our fonts/brand. Built on a **PaymentIntent** + Stripe Elements.

### 2.2 The custom checkout flow
1. Client hits `POST /api/payment-intent` with the cart.
2. **Server re-prices the cart** (never trust client prices — recompute from the product catalog, incl. BOGO/discount logic) and creates a PaymentIntent with `automatic_payment_methods: { enabled: true }`, `currency: "nok"`, and `metadata: { cart, mc, fbp, fbc }` (mc = Meta consent, fbp/fbc = pixel cookies for CAPI dedup).
3. Returns `{ clientSecret, amount }`.
4. Client renders `<Elements stripe={stripePromise} options={{ clientSecret, locale:"nb", appearance, fonts }}>` → `<PaymentElement>` + `<AddressElement>` + `<LinkAuthenticationElement>`.
5. On submit: `stripe.confirmPayment({ elements, confirmParams: { return_url: origin + "/takk", receipt_email } })`.
6. Stripe charges, redirects to `/takk`, and **independently fires the webhook** (the real record).

### 2.3 The webhook (`/api/webhooks/stripe`)
- Verify signature with `stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET)`.
- Handle **both** `checkout.session.completed` (hosted) and `payment_intent.succeeded` (custom) → normalize into one `recordOrder(o)` helper.
- `recordOrder` does: **dedup** (check existing by `stripe_session_id`, then `upsert onConflict`), fire **Meta CAPI** if consented + paid, fire **emails** only if new + paid.
- Must read raw body (Next.js App Router: the route reads `await req.text()` for signature verification).

### 2.4 Test mode / Sandboxes
Stripe replaced the old test-mode toggle with **Sandboxes**. Create a sandbox, use its test keys. Test card **4242 4242 4242 4242**, any future expiry, any CVC. Verified the whole pipeline end-to-end (order landed in Supabase with a `cs_test_` id, showed in admin).

---

## 3. Supabase backend

### 3.1 The `orders` table (run this SQL manually in Supabase SQL editor)
```sql
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text unique not null,   -- dedup key (session OR payment_intent id)
  email text, customer_name text, phone text,
  amount_total numeric, currency text, payment_status text,
  shipping_address jsonb, items jsonb,      -- flexible; no schema migration per product
  fulfillment_status text not null default 'new',  -- new | shipped | cancelled
  tracking_number text, admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.orders enable row level security;   -- locked, NO policies
```

**RLS is on with zero policies** → the table is unreachable by the anon/public key. Only the **service-role key** (server-side, in the webhook + admin API) can read/write it. That's deliberate: orders never touch the browser except through our authenticated `/admin` API.

> **The "add function" question.** Xander's friend suggested "add a function in Supabase for Stripe." That's the Supabase-native pattern (Edge Function as the webhook). We didn't need it — the webhook lives in the **Next.js app** (`/api/webhooks/stripe`) because the app already runs on Vercel. One less moving part. A Supabase Edge Function would only make sense if there were no app server.

### 3.2 Admin auth pattern
- Browser: `getSupabaseBrowser()` singleton (anon key) → `signInWithPassword`, persisted session.
- Server: `authenticateAdmin(req)` reads `Authorization: Bearer <token>`, verifies via `client.auth.getUser(token)`, then checks the email against `ADMIN_EMAILS` (comma-separated allowlist). Returns `{ ok, status, email }`.
- Every `/api/admin/*` route is gated by this. The service-role key is only used *after* the admin is verified.

---

## 4. The custom checkout UX (`/kasse`)

Shopify-style split: **order summary on one side, form on the other**, sticky summary on desktop, stacked on mobile (summary first via `order-` classes).

Conversion & polish decisions that mattered:
- **Distraction-free header/footer** — just the logo + a "🔒 Sikker betaling" lock. No nav to leak clicks.
- **Brand font inside Stripe's iframe** — Stripe's Elements run in an iframe and **can't see your CSS variables**. Fix: pass `fonts: [{ cssSrc: "<Google Fonts URL>" }]` in the `Elements` options + set `appearance.variables.fontFamily`. Without this the payment fields fall back to a system font and look "off."
- **Qty pill on cart thumbnails wasn't showing** — it was clipped by `overflow-hidden` on the image container. Fix: outer `relative` wrapper (no overflow) → inner `overflow-hidden` image div → pill as a **sibling** with `ring-2 ring-white`.
- Bigger product images (72px thumbs), visible "Gratis frakt", trust badges (lock / truck / return), price on the CTA ("Betal nå · 590 kr").
- `locale: "nb"` so Stripe's own strings are Norwegian.

**Gotcha:** create the PaymentIntent **once**. Guard with a `startedRef` + only fire after the cart has hydrated (`cart.hydrated` flag), or React StrictMode / re-renders spawn duplicate intents. This also dodges the ESLint `react-hooks/set-state-in-effect` rule.

---

## 5. Shopify-style admin (`/admin`)

Full backend, sidebar + views — not a table dump. Structure:

```
AdminApp (auth gate + login form)
  └─ AdminShell (sidebar nav, topbar with DateRangePicker + Oppdater, fetches orders)
       ├─ Dashboard   KPIs + revenue chart + recent orders + top patterns
       ├─ Orders      filter tabs + search + expandable rows → edit status/tracking/note + CSV export
       ├─ Products    catalog with per-variant units sold
       ├─ Insights    revenue series + units-by-variant + order-status breakdown
       └─ Settings    company info, integration status, sign out
```

- **`src/lib/admin-stats.ts`** is the analytics brain: `computeKpis` (revenue/orders/AOV/units/toFulfill/customers), `topVariants`, `revenueSeries(orders, from, to)`, formatters. All pure functions over the orders array — trivially testable and reusable.
- **Adaptive chart bucketing** — `revenueSeries` picks day / week / month granularity from the span (`≤62d → day`, `≤372d → week`, else `month`) so "I år" and "Alt" stay readable.
- **Date-range filter** is global (topbar) and drives every view via a `filtered` memo + `from`/`to` props.
- **CSV export** — build with a UTF-8 BOM (`"﻿"`) so Excel reads Norwegian characters correctly; filename `ordrer-YYYY-MM-DD.csv`.
- **Fulfillment editing** — `PATCH /api/admin/orders` updates `fulfillment_status` / `tracking_number` / `admin_note`, sets `updated_at`. `ALLOWED_STATUS = ["new","shipped","cancelled"]`.

---

## 6. Email (Resend)

`src/lib/email.ts` — plain `fetch` to `https://api.resend.com/emails`, no SDK. **No-ops when `RESEND_API_KEY` is unset**, so the store runs email-free until you're ready. On each *new + paid* order (fired from the webhook) it sends:
1. **Admin alert** → `ORDER_NOTIFY_TO` (or company email): "Ny ordre · 2 360 kr · Navn", with customer/items/address + a button to `/admin`.
2. **Customer confirmation** → their email: branded receipt.

**To activate (user's side):** sign up at resend.com → **verify the sending domain** (add DNS records) → create API key → set in Vercel: `RESEND_API_KEY`, `ORDER_FROM` (e.g. `BÆRA <ordre@baera.shop>`), `ORDER_NOTIFY_TO`. Before domain verification Resend only sends from `onboarding@resend.dev` to your own account email.

---

## 7. Meta Pixel + Conversions API (full-funnel, server-mirrored)

The whole funnel runs on **both** the browser pixel and server-side CAPI, deduped by a shared `event_id`. This recovers the ~20–40 % of events lost to ad-blockers / iOS / cookie rejection.

**Events tracked (pixel + CAPI, deduped):** `PageView`, `ViewContent`, `AddToCart`, `InitiateCheckout`, `Purchase`.

**Architecture:**
- `src/lib/capi.ts` — `sendCapiEvent(...)` sends *any* event to the Graph `/events` endpoint (`user_data` w/ hashed em/ph + raw `fbp`/`fbc` + `client_ip_address`/`client_user_agent` for match quality; `custom_data` w/ value/currency/content_ids/etc.). `sendCapiPurchase` is a thin wrapper.
- `src/lib/track.ts` — **client** helper `track(event, params)`: generates one `event_id`, fires the pixel with `{ eventID }`, then fire-and-forget POSTs to `/api/track` (consent-gated via `bara_consent_v1`, `keepalive:true` so it survives the redirect to Stripe/Vipps). Never blocks or throws into the UI.
- `src/app/api/track/route.ts` — receives client events, **allowlisted** to the 4 pre-purchase events. **`Purchase` is deliberately excluded** so a client can't spoof sales — Purchase stays authoritative from the order pipeline (real captured amount). Server attaches IP + user-agent from request headers.
- **PageView**: fired from the React effect in `MetaPixel.tsx` on first mount + every route change via `track()`. The inline snippet only `init`s the pixel (no inline `PageView`) so browser + CAPI share an id and nothing double-counts.
- **Purchase**: still fired from the order pipeline (`recordOrder` → `sendCapiPurchase`, `event_id` = order/Stripe id) on paid+consented orders; browser copy on `/takk` via `PurchaseTracker`.
- Consent (`mc`), `fbp`, `fbc` are stashed in PaymentIntent/session/Vipps metadata at checkout so the server has them at webhook/finalise time for the Purchase event.

**Verify:** Events Manager → Test Events (set `META_CAPI_TEST_EVENT_CODE` env to route there) — each event should show a **Browser + Server** pair marked *Deduplicated*. Requires `META_CAPI_ACCESS_TOKEN` env; no-ops silently without it.

---

## 8. Gotchas & fixes (the expensive lessons)

| Symptom | Root cause | Fix |
|---|---|---|
| Stripe 500, `ERR_INVALID_CHAR` in Authorization header | An invisible **zero-width / non-printable char** pasted into the secret key. `.trim()` doesn't catch it. | `key.replace(/[^\x21-\x7e]/g, "")` before use, on both `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. |
| "Invalid API Key provided" (401) after encoding fixed | The key itself was rolled/invalid. | Use a fresh **restricted key (`rk_`) with write access** — worked. |
| `vercel env add` fails from a non-interactive shell | The `!`/CLI runner can't answer interactive prompts. | Use `vercel env add NAME production --value <v>` (non-interactive form), or add via the Vercel Dashboard. |
| `NEXT_PUBLIC_*` change not taking effect | These are **inlined at build time**, not read at runtime. | Force a redeploy after changing them (`vercel deploy --prod --yes`). |
| Stripe fields wrong font | Elements iframe can't see your CSS vars. | `Elements` `fonts: [{ cssSrc }]` + `appearance.fontFamily`. |
| Qty pill invisible | Clipped by `overflow-hidden`. | Restructure: relative wrapper → inner overflow div → pill sibling. |
| Admin revenue chart shows 0 kr | Timezone bug — local-midnight iteration mixed with `toISOString()` **UTC** date keys. | Bucket by start-timestamp comparison in local time (`revenueSeries`). |
| `react-hooks/set-state-in-effect` lint errors | Setting state in an effect. | Gate on hydration + `useRef` guards. Non-blocking — `next build` doesn't gate on ESLint. |
| `TS2322 Stripe.Address not assignable` | An index-signature type rejected `Stripe.Address`. | Type the email address param with explicit optional fields. |
| winget install failed | Wrong package id. | Stripe CLI id is `Stripe.StripeCli` (not `StripeCLI`). |

---

## 9. Reusable blueprint — spinning up the NEXT store

1. **Scaffold** a Next.js (App Router) app; deploy to Vercel from `main`.
2. **Product catalog** — a typed `src/lib/products.ts` (slug, price, compareAt, variants with hex+image). Single source of truth for pricing (server re-prices from this).
3. **Company config** — `src/lib/company.ts` (legal name, org nr, VAT, address, email, phone, url). Used in emails, footer, legal pages.
4. **Stripe** — create sandbox → build `/api/payment-intent` (server-priced) + `/api/webhooks/stripe` (both event types, `recordOrder` helper with dedup). Sanitize keys with the `\x21-\x7e` regex.
5. **Supabase** — new project → run the `orders` SQL (RLS on, no policies) → set service-role + anon keys.
6. **Custom checkout** `/kasse` — Elements with `appearance` + `fonts`, split layout, `locale`. Create PI once (hydration guard).
7. **Admin** — copy `admin-stats.ts` + the `AdminShell`/views structure. Gate with `authenticateAdmin` + `ADMIN_EMAILS`.
8. **Email** — copy `email.ts` (Resend), verify a domain, set the 3 env vars.
9. **Tracking** — Pixel + CAPI with `event_id` dedup if running ads.
10. **Legal** — Norwegian stores need org nr / VAT display, return policy, terms; wire from `company.ts`.

**The 4 files that are ~100% portable between stores:** `src/lib/email.ts`, `src/lib/admin-stats.ts`, `src/lib/supabase.ts` (auth helpers), and the whole `src/components/admin/` tree. Swap `products.ts` + `company.ts` + brand tokens and you have a new store's backend.

---

## 10. File map (reference implementation)

```
src/
  lib/
    stripe.ts              getStripe() — sanitizes secret key
    stripe-browser.ts      getStripeBrowser() — loadStripe singleton (pk_)
    supabase.ts            getAdminEmails(), authenticateAdmin(req)
    supabase-browser.ts    getSupabaseBrowser() — anon, admin login only
    email.ts               Resend; sendOrderEmails() [PORTABLE]
    admin-stats.ts         KPIs, revenueSeries, topVariants, formatters [PORTABLE]
    products.ts            product catalog (swap per store)
    company.ts             company/legal info (swap per store)
  app/
    kasse/page.tsx         custom checkout page shell
    takk/page.tsx          thank-you (reads session_id OR payment_intent)
    admin/                 admin route
    api/
      checkout/route.ts        hosted checkout (kept as fallback)
      payment-intent/route.ts  custom checkout PI (server-priced)
      webhooks/stripe/route.ts source of truth → recordOrder()
      admin/orders/route.ts    GET list + PATCH fulfillment (auth-gated)
  components/
    checkout/  CheckoutPage · CheckoutForm · OrderSummary
    cart/      CartProvider (hydrated flag) · CartDrawer · CartPageContent
    admin/     AdminApp · AdminShell · DateRange · ui.tsx · views/*  [PORTABLE tree]
.env.example                 documents every env var
```

### Environment variables (full list)
```
NEXT_PUBLIC_SITE_URL
STRIPE_SECRET_KEY                    # server only
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY   # public, browser
STRIPE_WEBHOOK_SECRET                # server only; webhook sends checkout.session.completed + payment_intent.succeeded
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY        # public; admin login only
SUPABASE_SERVICE_ROLE_KEY            # server only; god key
ADMIN_EMAILS                         # comma-separated allowlist for /admin
RESEND_API_KEY                       # optional; email no-ops without it
ORDER_FROM                           # "BÆRA <ordre@baera.shop>"
ORDER_NOTIFY_TO                      # where new-order alerts land
```

---

## 11. Guardrails observed during this build (for future Claude sessions)

- **Claude never types secret keys** (`sk_`/`rk_`/service-role/webhook secret) into any field — always hand off to Xander. Publishable `pk_` keys are fine.
- **Claude never enters card numbers** — user does the test-card entry.
- **Supabase SQL is pasted in chat for the user to run**, never applied directly, unless the user names the project ref + grants permission.
- **Push finished work straight to `main`** (solo repos, Vercel auto-deploy), no branches/PRs.
- **Norwegian (`nb`)** for all storefront/UI/email copy; English when talking to Xander.
- This project's `AGENTS.md`: *"This is NOT the Next.js you know"* — a modified build; read `node_modules/next/dist/docs/` before writing Next code.

---

*Reference build: commits `c40abfa` (custom checkout) → `d598ab8` (checkout polish) → `3720f20` (admin rebuild) → `959aa11` (chart TZ fix) → `d85e300` (date filter, emails, CSV). Store live at [www.baera.shop](https://www.baera.shop).*

---

## 12. Additions 2026-07-04 → 07-06 (automation, notifications, CRM)

> The store went from "records orders" to "runs itself and reports back". Everything below is portable to the next store.

### 12.1 Abandoned-checkout reminder (email recovery)
- **Capture**: when a shopper types a valid email at `/kasse`, `CheckoutForm` debounce-POSTs to `/api/cart/track`, which **verifies the PaymentIntent is live** (anti-injection) and upserts `abandoned_carts` (one row per email; new activity resets the timer + re-arms the reminder).
- **Send**: `/api/cron/abandoned-cart` (guarded by `CRON_SECRET` as `Authorization: Bearer` or `?key=`) emails carts ≥30 min old, unconverted, un-reminded, **marketing-consented**, and only **while the sale is live** (`SALE_ENDS_AT` env, see `lib/sale.ts`). Max one reminder per cart.
- **Converted**: `recordOrder()` stamps `converted_at` on payment (card *and* Vipps), so buyers never get nudged.
- **Unsubscribe**: `/api/email/unsubscribe?e=&t=` — HMAC token (`EMAIL_UNSUB_SECRET`, falls back to `CRON_SECRET`), one click flips consent off. Required by markedsføringsloven.

### 12.2 Telegram notifications (`lib/telegram.ts`)
- `sendTelegramMessage(html)` — generic sender (HTML parse mode); `sendTelegramOrder(order)` — instant "New order" card (customer, contact, payment method, items, address, admin link) fired from `recordOrder` alongside the emails, only on first sighting.
- Env: `TELEGRAM_BOT_TOKEN` (from @BotFather) + `TELEGRAM_CHAT_ID`.
- **Gotchas**: a bot can't DM you until you message it first; "chat not found" = wrong chat id; read real ids via the guarded helper `?telegram=updates`; test a sample card with `?telegram=1` (both on the abandoned-cart cron route).

### 12.3 Weekly store report (Fridays → Telegram)
- `/api/cron/weekly-report` (CRON_SECRET-guarded): trailing-7-days **unique visitors, page views, add-to-carts, checkouts started, paid orders, revenue, visit→purchase %** — funnel stages from first-party `funnel_events`, money from `orders`. Manual call = instant test.
- Scheduled by `.github/workflows/weekly-report.yml`, Fridays 07:00 UTC (~09:00 NO).

### 12.4 Scheduling on the Hobby plan — THE big lesson
- **A sub-daily cron in `vercel.json` makes EVERY deploy fail validation on Hobby** — silently: no deployment record at all, so it looks like the GitHub webhook broke or the project is paused. Production freezes on the last good commit while `main` races ahead. Diagnose: newest Vercel deployment's commit ≠ `main` HEAD → run `vercel --prod` locally to see the hidden validation error.
- **Pattern**: keep `vercel.json` cron-free; schedule with **GitHub Actions** (`schedule:` cron → `curl` the endpoint with `Bearer CRON_SECRET`). Endpoints are idempotent so overlapping/late runs are safe.
- **The `CRON_SECRET` value must exist in three places**: Vercel env, GitHub repo secret (`gh secret set CRON_SECRET`), and your own calls. A missing repo secret = Actions run green-looking schedules that 401 forever — check `gh run list`.

### 12.5 Stripe webhook lessons (cost a full evening)
1. **Event subscriptions are per-destination.** Each webhook destination has its own event list; "the event fired" ≠ "your endpoint got it". Our destination was subscribed to 91 billing events but NOT `payment_intent.succeeded` — so DataFast (separate destination) received the sales and baera.shop never did. Fix: destination → Edit → include `payment_intent.succeeded` (+ `checkout.session.completed`), or "All events" (unhandled types just get `{received:true}`).
2. **An event's delivery list is frozen at creation time.** Old events never deliver (or Resend) to endpoints subscribed later. Backfill instead: `?backfill=pi_x,pi_y` on the cron route retrieves the PaymentIntents from Stripe's API and replays them through `recordOrder` (dedup-safe).
3. **Schema drift fails silently.** `recordOrder` swallows insert errors (so Stripe doesn't retry forever) — if the `orders` table is missing columns, the webhook 200s and nothing persists. The guarded `?orders=1` diagnostic reads count + latest rows straight from the table; trust it over logs.
4. Vercel Hobby runtime logs retain **1 hour** — diagnose fast or instrument the DB.

### 12.6 Admin upgrades
- **Whole admin is English** now (UI + admin API errors, `en-GB` Intl); storefront + customer emails stay Norwegian.
- **Delete order**: `DELETE /api/admin/orders?id=` + inline-confirm "Delete order" in the detail panel (hard delete; consider bookkeeping before using).
- **Customers tab** (`views/Customers.tsx`, `/api/admin/customers`): *Customers* = paid orders aggregated per email (orders, total spent, last order); *Leads* = unconverted `abandoned_carts` (cart, value, consent, reminder Sent/Pending) minus anyone who became a customer.
- **Marketing tab** (`views/Marketing.tsx`, `/api/admin/emails`): outbound-email log — every send recorded in **`email_log`** by `lib/email.ts` (type/recipient/subject/status/error + full HTML). Click a row → iframe preview of the exact email. Best-effort logging; never blocks delivery.
- **Funnel chart note**: funnel stages come from `funnel_events`, Purchase from `orders` — backfilled orders can make Purchase exceed earlier stages; synthetic `InitiateCheckout` inserts fix the history.

### 12.7 Tracking & misc
- **Microsoft Clarity** in `components/Clarity.tsx` — loads for **all** visitors. Project id baked in, `NEXT_PUBLIC_CLARITY_ID` overrides.
- **Cookie banner REMOVED entirely (2026-07-06)** — deliberate small-shop decision after Meta tracking gaps: the consent gate meant only "Godta alle"-clickers were tracked at all (pixel load, CAPI mirror, `mc` flag on purchases), so Ads Manager saw a fraction of the funnel. Now Meta Pixel + CAPI + Clarity fire for everyone; checkouts always send `mc=1` + `_fbp`/`_fbc`; abandoned-cart capture no longer reads the (deleted) consent flag. GDPR trade-off accepted; the reminder-email unsubscribe link remains. Re-introduce via a proper CMP if the store scales.
- The card `/kasse` flow now logs `InitiateCheckout` to the first-party funnel (was Meta-pixel-only — admin funnel undercounted card checkouts).
- SEO: Organization schema enriched (legalName, address, contactPoint; `sameAs` pending real social URLs); Product Offer has `hasMerchantReturnPolicy` (90d free) + `shippingDetails` (free, 7–10d NO). **No Review markup until real reviews exist** (review-spam risk). Homepage reviews/badges kept truthful — no invented awards, no Trustpilot mimicry.
- **Vercel env vars snapshot at deploy time** — adding/changing one does nothing until the next deploy.
- Resend stays in **test mode until the domain is verified** (only emails the account owner; dashboards can mislead — trust the API error).
- **Send-only domain trap**: a Resend-verified domain can SEND but not RECEIVE — `hei@`/`ordre@baera.shop` have no mailboxes, so anything sent *to* them (incl. customer replies to confirmations) vanishes. The admin order-alert email therefore only sends when `ORDER_NOTIFY_TO` is explicitly set (owner alerts are Telegram-first). For a real store, add DNS-level forwarding (e.g. Cloudflare Email Routing, free) for `hei@` → a monitored inbox.

### 12.8 New env vars (adds to §10's list)
```
CRON_SECRET            # guards all cron/diagnostic endpoints; ALSO a GitHub repo secret
SALE_ENDS_AT           # optional ISO deadline; gates reminders + email urgency copy
EMAIL_UNSUB_SECRET     # optional; unsubscribe-link HMAC (falls back to CRON_SECRET)
TELEGRAM_BOT_TOKEN     # @BotFather
TELEGRAM_CHAT_ID       # DM or group id (read via ?telegram=updates)
NEXT_PUBLIC_CLARITY_ID # optional override; id baked in
META_CAPI_ACCESS_TOKEN # server-side Conversions API (funnel + Purchase)
```

### 12.9 Ops endpoints (all `CRON_SECRET`-guarded, on `/api/cron/abandoned-cart`)
`?test=<email>` sample reminder · `?telegram=1` sample order card · `?telegram=updates` bot chats + configured id · `?orders=1` orders-table truth · `?backfill=pi_…` replay orders from Stripe. Plus `/api/cron/weekly-report` = send report now.

### 12.10 New tables (full DDL in `supabase/schema.sql`)
`abandoned_carts` (email-unique, consent, reminder/converted stamps, partial index on due rows) · `funnel_events` (anonymous first-party funnel) · `email_log` (every outbound email incl. HTML). All RLS-on, zero policies.

### 12.11 Shopify fulfilment sync (TeamDrop dropshipping)
- **Pattern**: custom checkout keeps payments/brand; a Shopify store (nordved) is purely the *fulfilment queue* for the TeamDrop supplier app (which only fulfils Shopify orders — its raw API didn't work).
- `lib/shopify.ts`: Admin GraphQL client (custom-app token `SHOPIFY_ADMIN_TOKEN`, scopes write_orders/read_products) + `createShopifyOrder` via the `orderCreate` mutation — line items from `SHOPIFY_VARIANT_MAP`, shipping address, manual SALE transaction (shows paid), `sendReceipt:false` (no double customer emails), tag `baera-web`, payment ref in the note. Fired from `recordOrder` on first sighting (both Stripe + Vipps), best-effort.
- **Variant mapping is the danger zone**: supplier variant NAMES lie — Bæra "Blå" = supplier "Bonsai blue" (NOT "Denim blue"); "Geometrisk" = "Starry sky". Map by **visually comparing variant images** (`?shopify=catalog` returns image URLs), never by name.
- Product must be **imported into Shopify via the TeamDrop app** (that creates the supplier link); a manually created product would never ship.
- Shopify custom app must be created at `admin.shopify.com/store/<store>/settings/apps/development` (store-level, token `shpat_…`). A Partner-dashboard app gives only `shpss_` OAuth creds — wrong kind.
- Ops: `?shopify=testorder` (sample order — CANCEL it in Shopify before TeamDrop ships it), `?shopify=push&pi=…` (backfill from Stripe), `?shopify=pushref&ref=…` (backfill any recorded order incl. Vipps).
