import { NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/supabase";
import {
  TRACKING_KEYS,
  getTrackingSettings,
  saveTrackingSettings,
  type TrackingKey,
} from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Current tracking settings (+ whether an env var overrides each). */
export async function GET(req: Request) {
  const auth = await authenticateAdmin(req);
  if (!auth.ok)
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  return NextResponse.json({ settings: await getTrackingSettings() });
}

/** Save pasted tracking IDs. Body: { meta_pixel_id?, google_tag_id?, clarity_id? } */
export async function PUT(req: Request) {
  const auth = await authenticateAdmin(req);
  if (!auth.ok)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const updates: Partial<Record<TrackingKey, string>> = {};
  for (const key of TRACKING_KEYS) {
    if (typeof body[key] === "string") updates[key] = body[key] as string;
  }

  const res = await saveTrackingSettings(updates);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 500 });
  return NextResponse.json({ ok: true, settings: await getTrackingSettings() });
}
