// Shopify Admin API (GraphQL). Pushes paid web orders into a Shopify store so
// a dropship supplier (e.g. TeamDrop) can fulfil them. No-ops until BOTH
// SHOPIFY_ADMIN_TOKEN and SHOPIFY_STORE_DOMAIN are set. The token is a
// custom-app Admin API token (write_orders, read_products) — server-only,
// never exposed to the client.
//
// PER-STORE: update SHOPIFY_VARIANT_MAP and PRODUCT_GID below to match the
// product imported into the new Shopify store. Verify variants by IMAGE, not
// by name — supplier variant names are often wrong.

const API_VERSION = "2024-10";

function shopDomain(): string {
  return process.env.SHOPIFY_STORE_DOMAIN?.trim() || "";
}

export function shopifyConfigured(): boolean {
  return !!process.env.SHOPIFY_ADMIN_TOKEN?.trim() && !!shopDomain();
}

interface GqlResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  errors?: unknown;
}

export async function shopifyGraphql<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<GqlResult<T>> {
  const token = process.env.SHOPIFY_ADMIN_TOKEN?.trim();
  if (!token) {
    return { ok: false, status: 0, errors: "SHOPIFY_ADMIN_TOKEN not set" };
  }
  try {
    const res = await fetch(
      `https://${shopDomain()}/admin/api/${API_VERSION}/graphql.json`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "X-Shopify-Access-Token": token,
        },
        body: JSON.stringify({ query, variables }),
      },
    );
    const json = (await res.json().catch(() => ({}))) as {
      data?: T;
      errors?: unknown;
    };
    return {
      ok: res.ok && !json.errors,
      status: res.status,
      data: json.data,
      errors: json.errors,
    };
  } catch (err) {
    return { ok: false, status: 0, errors: (err as Error).message };
  }
}

/**
 * baera.shop colour id (src/lib/products.ts) → nordved variant GID.
 * FILL THIS after the Bæreslyngen is imported via TeamDrop (read the GIDs with
 * the ?shopify=catalog diagnostic). While a colour is missing, orders containing
 * it are skipped (logged) rather than synced half-wrong.
 */
// Mapped by VISUAL comparison of variant photos (2026-07-06) — several
// supplier names are misleading (our Blå is their "Bonsai blue", NOT
// "Denim blue"). Product: "Portable Baby Waist Carrier with Front Hug
// Design" (gid://shopify/Product/9246490853588).
export const SHOPIFY_VARIANT_MAP: Record<string, string> = {
  sort:       "gid://shopify/ProductVariant/48206189658324", // Pure black
  aztec:      "gid://shopify/ProductVariant/48206189953236", // Ethnic flower
  teddybear:  "gid://shopify/ProductVariant/48206190084308", // Baby bear
  bla:        "gid://shopify/ProductVariant/48206189756628", // Bonsai blue
  geometrisk: "gid://shopify/ProductVariant/48206190575828", // Starry sky
  rutete:     "gid://shopify/ProductVariant/48206189822164", // Checkered blue
  sebra:      "gid://shopify/ProductVariant/48206190117076", // Zebra print
};

export interface ShopifyOrderInput {
  /** Stripe/Vipps reference — used for the order note + idempotency tag. */
  reference: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  amountTotal: number | null;
  currency: string;
  address: {
    line1?: string | null;
    line2?: string | null;
    postal_code?: string | null;
    city?: string | null;
    country?: string | null;
  } | null;
  items: { slug?: string; colorId?: string; qty?: number; bump?: boolean }[];
}

export interface ShopifySyncResult {
  ok: boolean;
  orderId?: string;
  orderName?: string;
  skipped?: string;
  errors?: unknown;
}

/**
 * Create a paid order in the fulfilment Shopify (nordved) so TeamDrop ships it.
 * Customer notifications are OFF (baera.shop already confirmed the order); the
 * order is tagged `baera-web` and carries the payment reference in its note.
 */
export async function createShopifyOrder(
  o: ShopifyOrderInput,
): Promise<ShopifySyncResult> {
  if (!shopifyConfigured()) {
    return { ok: false, skipped: "SHOPIFY_ADMIN_TOKEN not set" };
  }
  if (Object.keys(SHOPIFY_VARIANT_MAP).length === 0) {
    return { ok: false, skipped: "variant map empty (sling not mapped yet)" };
  }

  const lineItems: { variantId: string; quantity: number }[] = [];
  for (const it of o.items) {
    const variantId = SHOPIFY_VARIANT_MAP[it.colorId ?? ""];
    if (!variantId) {
      return { ok: false, skipped: `no variant mapping for colour "${it.colorId}"` };
    }
    lineItems.push({
      variantId,
      quantity: Math.max(1, Math.floor(Number(it.qty) || 1)),
    });
  }
  if (lineItems.length === 0) return { ok: false, skipped: "no line items" };

  const nameParts = (o.name ?? "").trim().split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || "Kunde";
  const lastName = nameParts.slice(1).join(" ") || firstName;
  const shippingAddress = o.address
    ? {
        address1: o.address.line1 ?? undefined,
        address2: o.address.line2 ?? undefined,
        city: o.address.city ?? undefined,
        zip: o.address.postal_code ?? undefined,
        countryCode: o.address.country?.toUpperCase() || "NO",
        firstName,
        lastName,
        phone: o.phone ?? undefined,
      }
    : undefined;

  const amount = (o.amountTotal ?? 0).toFixed(2);
  const currency = (o.currency || "NOK").toUpperCase();

  const r = await shopifyGraphql<{
    orderCreate: {
      order: { id: string; name: string } | null;
      userErrors: { field: string[] | null; message: string }[];
    };
  }>(
    `mutation orderCreate($order: OrderCreateOrderInput!, $options: OrderCreateOptionsInput) {
      orderCreate(order: $order, options: $options) {
        order { id name }
        userErrors { field message }
      }
    }`,
    {
      order: {
        currency,
        email: o.email ?? undefined,
        lineItems,
        shippingAddress,
        billingAddress: shippingAddress,
        note: `baera.shop ${o.reference} — customer paid ${amount} ${currency}`,
        tags: ["baera-web"],
        transactions: [
          {
            kind: "SALE",
            status: "SUCCESS",
            gateway: "baera.shop (Stripe/Vipps)",
            amountSet: { shopMoney: { amount, currencyCode: currency } },
          },
        ],
      },
      options: {
        sendReceipt: false,
        sendFulfillmentReceipt: false,
        inventoryBehaviour: "DECREMENT_OBEYING_POLICY",
      },
    },
  );

  const payload = r.data?.orderCreate;
  if (r.ok && payload?.order && (payload.userErrors ?? []).length === 0) {
    return { ok: true, orderId: payload.order.id, orderName: payload.order.name };
  }
  const errors = payload?.userErrors?.length ? payload.userErrors : r.errors;
  console.error("[shopify] orderCreate failed:", JSON.stringify(errors));
  return { ok: false, errors };
}

/**
 * Products + variants (id, title, sku, option values) — for building the
 * colour→variant map and for the guarded catalog diagnostic.
 */
export async function listShopifyCatalog() {
  return shopifyGraphql<{
    products: {
      edges: {
        node: {
          id: string;
          title: string;
          handle: string;
          status: string;
          variants: {
            edges: {
              node: {
                id: string;
                title: string;
                sku: string | null;
                selectedOptions: { name: string; value: string }[];
                image: { url: string } | null;
              };
            }[];
          };
        };
      }[];
    };
  }>(`{
    products(first: 25) {
      edges {
        node {
          id
          title
          handle
          status
          variants(first: 40) {
            edges {
              node {
                id
                title
                sku
                selectedOptions { name value }
                image { url }
              }
            }
          }
        }
      }
    }
  }`);
}
