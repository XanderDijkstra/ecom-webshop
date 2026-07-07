import { NextResponse } from "next/server";
import { getTrackingConfig } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public, cacheable tracking config for the storefront. The client
 * <TrackingScripts> component fetches this once per page load to know which
 * pixels to inject — that's what lets tracking IDs be pasted in the admin
 * instead of baked into the build as env vars. IDs here are public by nature
 * (they'd ship in the client bundle anyway); nothing secret ever goes in this
 * response. CDN-cached for 5 minutes so it adds no meaningful load.
 */
export async function GET() {
  const config = await getTrackingConfig();
  return NextResponse.json(config, {
    headers: {
      "cache-control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
