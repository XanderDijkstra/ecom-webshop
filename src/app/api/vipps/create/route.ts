import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { priceCart, readCapiMeta, parseBump, PricingError } from "@/lib/pricing";
import { createVippsPayment, vippsConfigured } from "@/lib/vipps";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Starts a Vipps ePayment for the cart and returns the redirect URL. The cart
 * is priced on the SERVER (same as the Stripe flow); client amounts are never
 * trusted. CAPI context is stored on the payment metadata so the finaliser can
 * send a matching server-side Purchase.
 */
export async function POST(req: Request) {
  if (!vippsConfigured()) {
    return NextResponse.json(
      { error: "Vipps er ikke konfigurert ennå." },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => null);

  let priced;
  try {
    priced = priceCart(
      Array.isArray(body?.items) ? body.items : [],
      parseBump(body?.bump),
    );
  } catch (e) {
    const err = e as PricingError;
    return NextResponse.json(
      { error: err.message },
      { status: err.status ?? 400 },
    );
  }

  const reference = `baera-${randomUUID()}`;
  const metadata: Record<string, string> = {
    cart: JSON.stringify(priced.cartMeta).slice(0, 480),
    ...readCapiMeta(body),
  };

  try {
    const { redirectUrl } = await createVippsPayment({
      amountOre: priced.amountOre,
      reference,
      returnUrl: `${SITE.url}/takk?vipps=${encodeURIComponent(reference)}`,
      description: "Bæreslyngen",
      metadata,
    });
    return NextResponse.json({ redirectUrl });
  } catch (err) {
    console.error("[vipps/create] failed:", err);
    return NextResponse.json(
      { error: "Kunne ikke starte Vipps-betaling. Prøv igjen." },
      { status: 502 },
    );
  }
}
