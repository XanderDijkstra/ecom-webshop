"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";

/**
 * Express Vipps checkout button. Prices the cart on the server, creates a Vipps
 * payment, and redirects the customer to the Vipps app / landing page. Contact
 * and shipping details come back from Vipps (profile sharing), so no address
 * form is needed for this flow.
 */
export function VippsButton({
  bump,
}: {
  bump: { colorId: string } | null;
}) {
  const cart = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    if (busy || cart.items.length === 0) return;
    setBusy(true);
    setError(null);

    // No InitiateCheckout here: the checkout page already fired it (pixel +
    // first-party funnel) on mount, and this button only exists on that page —
    // firing again double-counted every Vipps buyer.

    try {
      const res = await fetch("/api/vipps/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: cart.items.map((i) => ({
            slug: i.slug,
            colorId: i.colorId,
            qty: i.qty,
            free: i.free,
          })),
          bump,
          mc: "1",
          fbp: readCookie("_fbp"),
          fbc: readCookie("_fbc"),
        }),
      });
      const data = await res.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return; // keep the button busy through the redirect
      }
      setError(data.error || "Kunne ikke starte Vipps. Prøv igjen.");
      setBusy(false);
    } catch {
      setError("Noe gikk galt. Prøv igjen.");
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={pay}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-[#ff5b24] py-[16px] text-[16px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {busy ? (
          "Åpner Vipps …"
        ) : (
          <>
            Betal med <span className="font-bold tracking-tight">Vipps</span>
          </>
        )}
      </button>
      {error && (
        <p className="mt-2 text-[13px] text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Read a browser cookie by name (client-side only). */
function readCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}
