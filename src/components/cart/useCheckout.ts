"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";
import { track } from "@/lib/track";
import { logFunnel } from "@/lib/analytics";

/**
 * Shared Stripe checkout flow used by both the cart drawer and the cart page.
 * Fires the Meta Pixel InitiateCheckout event, then redirects to Stripe.
 */
export function useCheckout() {
  const cart = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    if (cart.items.length === 0) return;
    setLoading(true);
    setError(null);
    track("InitiateCheckout", {
      content_ids: cart.items.map((i) => i.slug),
      content_type: "product",
      num_items: cart.count,
      value: cart.subtotal,
      currency: "NOK",
    });
    logFunnel("InitiateCheckout", { value: cart.subtotal, currency: "NOK" });
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: cart.items.map((i) => ({
            slug: i.slug,
            colorId: i.colorId,
            qty: i.qty,
            free: i.free,
          })),
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Noe gikk galt. Prøv igjen.");
        setLoading(false);
      }
    } catch {
      setError("Noe gikk galt. Prøv igjen.");
      setLoading(false);
    }
  }

  return { checkout, loading, error };
}
