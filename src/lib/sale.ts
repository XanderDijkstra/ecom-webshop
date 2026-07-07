// Sale window. When SALE_ENDS_AT (an ISO timestamp, server-only env) is set, the
// sale is only "live" before that instant — used to gate the abandoned-checkout
// reminder (never nudge with a dead offer) and to show the deadline in the email.
// Unset (or unparseable) = the sale is always live.

export interface SaleState {
  live: boolean;
  endsAt: Date | null;
}

export function saleState(now: Date = new Date()): SaleState {
  const raw = process.env.SALE_ENDS_AT?.trim();
  if (!raw) return { live: true, endsAt: null };
  const endsAt = new Date(raw);
  if (Number.isNaN(endsAt.getTime())) return { live: true, endsAt: null };
  return { live: now.getTime() < endsAt.getTime(), endsAt };
}

export function saleIsLive(now?: Date): boolean {
  return saleState(now).live;
}
