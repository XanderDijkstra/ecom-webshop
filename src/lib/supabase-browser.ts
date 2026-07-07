"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Browser Supabase client (anon key). Used ONLY for admin authentication
// (sign in / out, reading the current session token). All order data goes
// through the server admin API, never directly from the browser.
let _client: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  if (!_client) _client = createClient(url, anon);
  return _client;
}
