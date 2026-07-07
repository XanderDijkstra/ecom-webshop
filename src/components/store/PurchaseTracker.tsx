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
      // Same id as the server-side CAPI Purchase so Meta deduplicates them.
      { eventID: orderId },
    );
  }, [orderId, value, currency, contentIds]);

  return null;
}
