"use client";

import { useEffect } from "react";
import { fbTrack } from "@/lib/fpixel";

/**
 * Fires a Meta Pixel Purchase event on the thank-you page. Deduped per Stripe
 * session via sessionStorage so a page refresh doesn't double-count the sale.
 */
export function PurchaseTracker({
  orderId,
  value,
  currency,
  contentIds,
}: {
  orderId: string;
  value: number;
  currency: string;
  contentIds: string[];
}) {
  useEffect(() => {
    try {
      const key = `bara_purchase_tracked_${orderId}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* ignore: still fire below if storage is unavailable */
    }
    fbTrack(
      "Purchase",
      {
        content_ids: contentIds,
        content_type: "product",
        value,
        currency,
      },
      // Stable per-order event id so Meta dedupes any double-fire (this is
      // the ONLY Purchase source — the server-side CAPI copy was removed).
      { eventID: orderId },
    );
  }, [orderId, value, currency, contentIds]);

  return null;
}
