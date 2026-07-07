import { NextResponse } from "next/server";
import { finalizeVippsPayment } from "@/lib/vipps";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Vipps posts payment events here (authorized/captured). We deliberately do NOT
 * trust the request body: we take only the reference and re-fetch the
 * authoritative payment from Vipps before recording anything. So a forged POST
 * can't create a fake order — it just triggers a lookup that returns the real
 * (unpaid) state. Registration is optional; the /takk return URL finalises too.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const reference: unknown = body?.reference ?? body?.data?.reference;
  if (typeof reference !== "string" || !reference) {
    return NextResponse.json({ received: true });
  }

  try {
    await finalizeVippsPayment(reference);
  } catch (err) {
    console.error("[vipps/webhook] finalize failed:", (err as Error).message);
    // 200 anyway so Vipps doesn't retry forever; /takk will finalise as backup.
  }
  return NextResponse.json({ received: true });
}
