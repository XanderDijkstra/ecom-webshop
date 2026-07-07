import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only admin client (service-role key) used by the Stripe webhook to
// record orders and by the admin API to read/update them. NEVER import this
// into client components. Returns null when Supabase isn't configured, so the
// app runs without a DB (orders just won't persist; the webhook logs instead).
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Comma-separated allow-list of admin emails (server-only env). */
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export interface AdminAuthResult {
  ok: boolean;
  status: number;
  email?: string;
  error?: string;
}

/**
 * Verify the caller is a signed-in, allow-listed admin. Reads the Supabase
 * access token from the Authorization header, validates it against Supabase
 * Auth, then checks the email against ADMIN_EMAILS. The client is never
 * trusted: the token is verified server-side and the allow-list is the gate.
 */
export async function authenticateAdmin(
  req: Request,
): Promise<AdminAuthResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon)
    return { ok: false, status: 503, error: "Auth isn't configured." };

  const header = req.headers.get("authorization") ?? "";
  const token = /^bearer /i.test(header) ? header.slice(7).trim() : "";
  if (!token) return { ok: false, status: 401, error: "Not signed in." };

  const client = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user?.email)
    return { ok: false, status: 401, error: "Invalid session. Sign in again." };

  const email = data.user.email.toLowerCase();
  const allow = getAdminEmails();
  if (allow.length === 0)
    return { ok: false, status: 503, error: "No admin configured." };
  if (!allow.includes(email))
    return { ok: false, status: 403, error: "Not authorized." };

  return { ok: true, status: 200, email };
}
