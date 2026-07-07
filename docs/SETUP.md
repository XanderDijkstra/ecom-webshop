# New store in 10 steps

How to go from this template to a live, selling store. Budget ~1–2 hours of
setup plus however long the storefront copy/images take. Everything integrates
lazily: each feature is dead until its env vars are set, so you can launch with
just Stripe + Supabase and light the rest up later.

For the full war stories behind these steps (what broke and why), read
[PLAYBOOK.md](./PLAYBOOK.md).

## 1. Create the repo

Use this template on GitHub ("Use this template" → new repo), clone it, and
`npm install`.

## 2. Brand & product — the only real editing work

| File | What |
|---|---|
| `src/lib/company.ts` | Brand name, legal entity, org.nr, address, support email/phone, canonical URL. **Marked EDIT FIRST.** |
| `src/lib/products.ts` | Product(s), colours/variants, prices, images. |
| `src/lib/offers.ts` | Order bump / BOGO offer config. |
| `public/images/` | Replace all product + explainer images. |
| Storefront copy | Homepage, product page, FAQ, emails — per-store work; the template ships the Norwegian single-product example. |

Grep for the old brand before launch: `grep -ri "yourbrand" src/` should be
the only thing left.

## 3. Supabase

New project → SQL editor → paste **all of `supabase/schema.sql`** → run.
That creates `orders`, `abandoned_carts`, `funnel_events`, `email_log` (RLS on,
no policies — service-role only). Copy URL + anon key + service-role key into
env.

## 4. Stripe

- API keys → env (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`).
- Webhook endpoint → `https://<domain>/api/webhooks/stripe`, subscribed to
  **`checkout.session.completed` AND `payment_intent.succeeded`** — get this
  wrong and orders silently never record. Verify the subscribed events on the
  destination itself, not just that the endpoint exists.
- Signing secret → `STRIPE_WEBHOOK_SECRET`.

## 5. Vercel

Import the repo, paste every var from `.env.example`, deploy.

- **Never add sub-daily crons to `vercel.json` on Hobby** — it silently blocks
  ALL deploys (no deployment records at all). Scheduling lives in GitHub
  Actions instead (already included).
- Env vars snapshot at deploy time: change a var → redeploy.

## 6. GitHub Actions (crons)

The two workflows (`abandoned-cart` every 15 min, `weekly-report` Fridays)
need, per repo:

```
gh variable set SITE_URL    --body "https://www.yourshop.com"
gh secret   set CRON_SECRET --body "<same value as the Vercel CRON_SECRET>"
```

Actions run on pushes automatically; check the Actions tab shows green after
the first scheduled run.

## 7. Email (Resend)

Verify the sending domain, set `RESEND_API_KEY` + `ORDER_FROM` (must be on the
verified domain) + `ORDER_NOTIFY_TO`. Until the domain is verified, Resend is
in test mode and only mails your own address. Send-only domains can't
*receive* — create a real mailbox (or forwarding) for the support address.

## 8. Tracking (optional, per store)

- **Meta**: `NEXT_PUBLIC_META_PIXEL_ID` + `META_CAPI_ACCESS_TOKEN`. Browser
  pixel + server CAPI share event IDs, so Events Manager shows deduplicated
  Browser+Server pairs. Purchase fires server-side from the webhooks.
- **Clarity**: `NEXT_PUBLIC_CLARITY_ID`.
- Both no-op while unset. `NEXT_PUBLIC_*` vars need a redeploy to take effect.

## 9. Payments beyond cards (optional)

- **Vipps**: the four `VIPPS_*` vars + `NEXT_PUBLIC_VIPPS_ENABLED=1`. Requires
  the company details from `company.ts` visible on the site for verification.
- **Telegram order alerts**: `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`
  (message the bot once first; group IDs are negative).

## 10. Fulfilment via Shopify (optional, dropship suppliers)

If the supplier only fulfils through Shopify (e.g. TeamDrop):

1. Import the product into the Shopify store **via the supplier's app** (keeps
   the supplier link).
2. Custom app (Settings → Apps and sales channels → Develop apps) with
   `write_orders` + `read_products` → `shpat_` Admin token → env
   (`SHOPIFY_ADMIN_TOKEN`, `SHOPIFY_STORE_DOMAIN`).
3. Update `SHOPIFY_VARIANT_MAP` + `PRODUCT_GID` in `src/lib/shopify.ts`.
   **Match variants by image, not by name** — supplier variant names lie.
4. Test with `?shopify=testorder`, then cancel the test order in Shopify
   before the supplier ships it.

## Launch checklist

- [ ] Test purchase with Stripe test keys end-to-end: order in admin, both
      customer + owner emails, Telegram ping, (Shopify order if configured)
- [ ] `?orders=1` and `?emails=1` diagnostics return sane data
      (`/api/cron/abandoned-cart?key=<CRON_SECRET>&...`)
- [ ] Swap Stripe to live keys, live webhook, redeploy
- [ ] Real 1 kr test order (refund it after)
- [ ] Legal pages match `company.ts` (vilkår, personvern, angrerett)
- [ ] `grep -ri` for leftover template brand strings
