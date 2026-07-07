import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { priceCart, parseBump, PricingError } from "@/lib/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Re-prices the cart (incl. the optional order bump) on the SERVER and updates
 * the pending PaymentIntent's amount + cart metadata before the client confirms
 * it. This keeps the same clientSecret/Element mounted, so toggling the bump
 * doesn't reset the card form. The amount is never taken from the client.
 */
export async function POST(req: Request) {
  let stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json(
      { error: "Betaling er ikke konfigurert." },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => null);
  const id =
    typeof body?.paymentIntentId === "string" ? body.paymentIntentId : null;
  if (!id) {
    return NextResponse.json({ error: "Mangler betalings-id." }, { status: 400 });
  }

  let priced;
  try {
    priced = priceCart(
      Array.isArray(body?.items) ? body.items : [],
      parseBump(body?.bump),
    );
  } catch (e) {
    const err = e as PricingError;
    return NextResponse.json({ error: err.message }, { status: err.status ?? 400 });
  }

  try {
    // Metadata is merged key-wise, so the CAPI context set at create survives.
    await stripe.paymentIntents.update(id, {
      amount: priced.amountOre,
      metadata: { cart: JSON.stringify(priced.cartMeta).slice(0, 480) },
    });
  } catch (err) {
    console.error("[payment-intent/update] failed:", err);
    return NextResponse.json(
      { error: "Kunne ikke oppdatere beløp. Prøv igjen." },
      { status: 502 },
    );
  }

  return NextResponse.json({ amount: priced.amountOre / 100 });
}
