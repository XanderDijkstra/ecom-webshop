"use client";

import { loadStripe, type Stripe } from "@stripe/stripe-js";

// Browser Stripe.js loader (publishable key). Used by the custom checkout page
// to mount the Payment Element. The publishable key is safe to expose.
let _promise: Promise<Stripe | null> | null = null;

export function getStripeBrowser(): Promise<Stripe | null> {
  const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!pk) return Promise.resolve(null);
  if (!_promise) _promise = loadStripe(pk);
  return _promise;
}
