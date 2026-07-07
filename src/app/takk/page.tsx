import Link from "next/link";
import { getStripe } from "@/lib/stripe";
import { finalizeVippsPayment } from "@/lib/vipps";
import { PurchaseTracker } from "@/components/store/PurchaseTracker";

export const metadata = {
  title: "Takk for bestillingen",
  robots: { index: false, follow: true },
};

interface Purchase {
  orderId: string;
  value: number;
  currency: string;
  contentIds: string[];
}

function slugsFrom(cartMeta?: string): string[] {
  try {
    const cart = JSON.parse(cartMeta ?? "[]") as { slug?: string }[];
    const ids = [...new Set(cart.map((i) => i.slug).filter(Boolean))] as string[];
    return ids.length ? ids : ["baereslyngen"];
  } catch {
    return ["baereslyngen"];
  }
}

// Look up the completed order (hosted Checkout Session OR custom Payment
// Element PaymentIntent) so the Meta Pixel Purchase reports the real value.
// Fails soft: if Stripe isn't configured or the id is missing/invalid, the page
// still renders without tracking.
async function getPurchase(args: {
  sessionId?: string;
  paymentIntent?: string;
  vipps?: string;
}): Promise<Purchase | null> {
  // Vipps: finalise (capture + record) on return, in case the webhook hasn't
  // fired yet. Idempotent, so a duplicate with the webhook is harmless.
  if (args.vipps) {
    try {
      const r = await finalizeVippsPayment(args.vipps);
      if (r.recorded && r.amountOre > 0) {
        return {
          orderId: args.vipps,
          value: r.amountOre / 100,
          currency: r.currency,
          contentIds: slugsFrom(r.cartRaw),
        };
      }
    } catch {
      /* fall through to no-tracking render */
    }
    return null;
  }

  if (!args.sessionId && !args.paymentIntent) return null;
  try {
    const stripe = getStripe();

    if (args.paymentIntent) {
      const pi = await stripe.paymentIntents.retrieve(args.paymentIntent);
      if (!pi || pi.amount == null) return null;
      return {
        orderId: pi.id,
        value: pi.amount / 100,
        currency: (pi.currency ?? "nok").toUpperCase(),
        contentIds: slugsFrom(pi.metadata?.cart),
      };
    }

    const session = await stripe.checkout.sessions.retrieve(args.sessionId!);
    if (!session || session.amount_total == null) return null;
    return {
      orderId: session.id,
      value: session.amount_total / 100,
      currency: (session.currency ?? "nok").toUpperCase(),
      contentIds: slugsFrom(session.metadata?.cart),
    };
  } catch {
    return null;
  }
}

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{
    session_id?: string;
    payment_intent?: string;
    vipps?: string;
  }>;
}) {
  const { session_id, payment_intent, vipps } = await searchParams;
  const purchase = await getPurchase({
    sessionId: session_id,
    paymentIntent: payment_intent,
    vipps,
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-6 text-center">
      {purchase && (
        <PurchaseTracker
          orderId={purchase.orderId}
          value={purchase.value}
          currency={purchase.currency}
          contentIds={purchase.contentIds}
        />
      )}
      <div className="mb-5 font-serif text-[34px] tracking-[0.04em]">BÆRA</div>
      <div className="mb-3 text-[12px] uppercase tracking-[0.16em] text-clay">
        Bestilling bekreftet
      </div>
      <h1 className="mb-4 max-w-[16ch] font-serif text-[clamp(30px,5vw,46px)] font-normal leading-[1.08]">
        Takk for bestillingen
      </h1>
      <p className="mb-8 max-w-[44ch] text-[16px] leading-[1.6] text-muted-2">
        Vi har mottatt bestillingen din og sender deg en bekreftelse på e-post.
        Pakken er på vei innen 7–10 dager.
      </p>
      <Link
        href="/"
        className="rounded-full bg-ink px-9 py-[15px] text-[15px] font-semibold text-cream transition-colors hover:bg-clay"
      >
        Tilbake til butikken
      </Link>
    </div>
  );
}
