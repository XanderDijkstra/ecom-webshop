"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

/** Fires a Meta Pixel ViewContent event once when a product page mounts. */
export function ViewContentTracker({
  id,
  name,
  value,
  currency = "NOK",
}: {
  id: string;
  name: string;
  value: number;
  currency?: string;
}) {
  useEffect(() => {
    track("ViewContent", {
      content_ids: [id],
      content_name: name,
      content_type: "product",
      value,
      currency,
    });
  }, [id, name, value, currency]);

  return null;
}
