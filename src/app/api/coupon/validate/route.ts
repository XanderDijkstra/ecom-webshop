import { NextResponse } from "next/server";
import { findValidCoupon } from "@/lib/coupons";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Validate a coupon code for the checkout page. Public but harmless: it only
 * confirms a code exists and returns its percentage — the actual discount is
 * always re-applied server-side when the payment is created.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { code?: unknown };
  const coupon = await findValidCoupon(body.code);
  if (!coupon) {
    return NextResponse.json(
      { valid: false, error: "Ugyldig eller utløpt rabattkode." },
      { status: 404 },
    );
  }
  return NextResponse.json({
    valid: true,
    code: coupon.code,
    percentOff: coupon.percent_off,
  });
}
