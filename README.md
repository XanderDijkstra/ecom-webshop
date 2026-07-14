# ecom-webshop — single-product store template

Battle-tested template for a conversion-focused single-product webshop,
extracted from a live Norwegian store. Next.js (App Router) + TypeScript +
Tailwind v4, Stripe + Vipps payments, Supabase persistence, Resend email,
full admin backend, first-party funnel analytics, Meta Pixel + Conversions
API, Telegram notifications, abandoned-cart recovery, weekly reports and
optional Shopify dropship fulfilment.

**Everything is env-gated**: each integration no-ops until its keys are set,
so a new store can launch with just Stripe + Supabase and enable the rest
incrementally.

**→ Spin up a new store with [docs/SETUP.md](docs/SETUP.md)** (10 steps,
~1–2 h). The build history and pitfalls behind it live in
[docs/PLAYBOOK.md](docs/PLAYBOOK.md).

**→ Structure the landing page per
[docs/methodology/LANDING-PAGE.md](docs/methodology/LANDING-PAGE.md)** —
the conversion blueprint every new store's copy, image cadence, offer and
section order must follow.

**→ Targeting the US? Follow
[docs/methodology/US-MARKET-SEO.md](docs/methodology/US-MARKET-SEO.md)** —
market config lives in `src/lib/site.ts`; the doc covers merchant listings,
FTC review rules, ASTM safety claims, US search intent and AI-search strategy.

## What's included

- **Storefront** — PDP with image gallery + variant switcher, cart drawer,
  order-bump checkout (Stripe Payment Element, embedded) and express Vipps,
  review/USP sections. Ships as a working Norwegian example — replace copy,
  images and `src/lib/{company,products,offers}.ts` per store.
- **Orders pipeline** — Stripe/Vipps webhooks → `recordOrder()` (dedup,
  Supabase) → customer + owner email (Resend), Telegram alert, Meta pixel
  Purchase, optional Shopify order for dropship fulfilment (per-line prices
  reconciled to the paid total, so BOGO/coupon orders show fully PAID).
- **Admin** (`/admin`, Supabase Auth) — dashboard with a unique-visitor
  conversion funnel, orders (fulfilment status, tracking, delete), customers
  & leads, a marketing tab with the **email-flow chart** (live counts per
  stage + template previews), **coupons** (percentage codes; 100% = free
  order via its own no-payment flow), the sent-email log, insights with a
  **Microsoft Clarity panel** (sessions, scroll, frustration signals), a
  **store to-do list** (seeds the setup checklist) and **settings where
  tracking IDs (Meta Pixel, Google tag, Clarity) are pasted in** — stored in
  the DB, live without a redeploy.
- **Automation** — a two-step abandoned-checkout flow (reminder ~30 min after
  abandon + a final "offer still stands" email 24 h later; GitHub Actions,
  every 15 min) and a Friday Telegram store report. No Vercel crons
  (Hobby-plan trap — see SETUP §5).
- **Metrics feed** — read-only `/api/metrics` (paid revenue per day) for an
  external dashboard, bearer-token guarded.

## Getting started

```bash
npm install
cp .env.example .env.local   # every var documented inline; all optional except Stripe+Supabase for checkout
npm run dev                  # http://localhost:3000
```

The storefront and cart work with zero keys.

## Structure

```
src/
  app/
    page.tsx                  # storefront (PDP)
    kasse/  takk/             # checkout + thank-you
    admin/                    # admin backend
    api/
      checkout/  payment-intent/  vipps/     # server-priced payments
      webhooks/stripe/  webhooks/vipps/      # order recording (source of truth)
      cron/abandoned-cart/                   # reminder cron + ops diagnostics (?orders=1, ?emails=1, ?shopify=…)
      cron/weekly-report/                    # Friday Telegram report
      metrics/                               # external revenue feed
      admin/                                 # admin data APIs
  components/  store/  cart/  checkout/  admin/
  lib/
    company.ts   # ← EDIT FIRST: brand + legal details
    products.ts  # ← catalogue (product, variants, prices)
    offers.ts    # ← order bump / BOGO
    orders.ts  email.ts  telegram.ts  shopify.ts  capi.ts  fpixel.ts  analytics.ts
supabase/schema.sql           # all tables — run once per store
.github/workflows/            # cron replacements (need SITE_URL var + CRON_SECRET secret)
docs/SETUP.md                 # new-store checklist
docs/PLAYBOOK.md              # full build log + lessons learned
```

Prices are always computed server-side from the catalogue — never trusted
from the client.
