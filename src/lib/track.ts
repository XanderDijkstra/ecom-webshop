// Client-side Meta event tracking — browser pixel ONLY. The Conversions API
// mirror was deliberately removed (2026-07-09) in favour of a simple,
// single-source setup: what the pixel sees is what Meta gets. Safe to call
// anywhere on the client; no-ops on the server or before fbq has loaded.
import { fbTrack } from "@/lib/fpixel";

type Params = Record<string, unknown>;

/** Fire a Meta standard event on the browser pixel. */
export function track(event: string, params: Params = {}): void {
  fbTrack(event, params);
}
