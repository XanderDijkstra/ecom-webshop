import { getSupabaseAdmin } from "@/lib/supabase";

// Store settings stored in the `store_settings` table and editable from the
// admin Settings tab, so a new store can be configured by pasting IDs into the
// backend instead of touching env vars. Env vars (when set) ALWAYS win, so
// existing env-based setups keep working and ops can hard-override the DB.
// Server-only — never import from client components.

/** The tracking keys the admin can edit. */
export const TRACKING_KEYS = [
  "meta_pixel_id",
  "google_tag_id",
  "clarity_id",
] as const;
export type TrackingKey = (typeof TRACKING_KEYS)[number];

/** Env var that overrides each DB setting. */
const ENV_OVERRIDE: Record<TrackingKey, string | undefined> = {
  meta_pixel_id: process.env.NEXT_PUBLIC_META_PIXEL_ID,
  google_tag_id: process.env.NEXT_PUBLIC_GOOGLE_TAG_ID,
  clarity_id: process.env.NEXT_PUBLIC_CLARITY_ID,
};

export interface TrackingConfig {
  metaPixelId: string;
  googleTagId: string;
  clarityId: string;
}

// Tiny in-memory cache so webhook/CAPI paths don't hit the DB on every event.
// Serverless instances are short-lived, so 60s staleness is the worst case
// after changing a setting in the admin.
let cache: { at: number; values: Record<string, string> } | null = null;
const TTL_MS = 60_000;

async function dbValues(): Promise<Record<string, string>> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.values;
  const values: Record<string, string> = {};
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from("store_settings")
      .select("key,value");
    // A missing table (SQL not run yet) just means "no settings" — the store
    // must keep working, so any error resolves to empty values.
    if (!error) {
      for (const row of data ?? []) {
        if (row.key && row.value) values[row.key] = String(row.value).trim();
      }
    }
  }
  cache = { at: Date.now(), values };
  return values;
}

/** Invalidate the cache after an admin save so changes apply immediately. */
export function invalidateSettingsCache(): void {
  cache = null;
}

/** Resolve one tracking id: env override first, then the DB setting. */
export async function getTrackingId(key: TrackingKey): Promise<string> {
  const env = ENV_OVERRIDE[key]?.trim();
  if (env) return env;
  return (await dbValues())[key] ?? "";
}

/** All tracking ids at once (for /api/site-config and the layout). */
export async function getTrackingConfig(): Promise<TrackingConfig> {
  const db = await dbValues();
  const pick = (k: TrackingKey) => ENV_OVERRIDE[k]?.trim() || db[k] || "";
  return {
    metaPixelId: pick("meta_pixel_id"),
    googleTagId: pick("google_tag_id"),
    clarityId: pick("clarity_id"),
  };
}

/** Raw DB values + whether an env override is active (for the admin UI). */
export async function getTrackingSettings(): Promise<
  Record<TrackingKey, { value: string; envOverride: boolean }>
> {
  const db = await dbValues();
  const out = {} as Record<TrackingKey, { value: string; envOverride: boolean }>;
  for (const k of TRACKING_KEYS) {
    const env = ENV_OVERRIDE[k]?.trim();
    out[k] = { value: env || db[k] || "", envOverride: !!env };
  }
  return out;
}

/** Upsert admin-edited settings. Empty string deletes the row. */
export async function saveTrackingSettings(
  updates: Partial<Record<TrackingKey, string>>,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, error: "Database isn't configured." };

  for (const key of TRACKING_KEYS) {
    const raw = updates[key];
    if (typeof raw !== "string") continue;
    const value = raw.trim().slice(0, 200);
    const res = value
      ? await supabase
          .from("store_settings")
          .upsert({ key, value, updated_at: new Date().toISOString() })
      : await supabase.from("store_settings").delete().eq("key", key);
    if (res.error) return { ok: false, error: res.error.message };
  }
  invalidateSettingsCache();
  return { ok: true };
}
