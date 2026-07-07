import type { ReactNode } from "react";

// Shared admin UI primitives. Neutral, Shopify-like palette (white cards on a
// light grey canvas) with ink/clay brand accents.

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-[#e8e8e4] bg-white ${className}`}>
      {children}
    </div>
  );
}

export function Kpi({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="text-[12px] font-medium uppercase tracking-[0.06em] text-[#8a8a84]">
        {label}
      </div>
      <div
        className={`mt-2 text-[27px] font-semibold leading-none ${
          accent ? "text-clay" : "text-ink"
        }`}
      >
        {value}
      </div>
      {sub && <div className="mt-1.5 text-[12.5px] text-[#8a8a84]">{sub}</div>}
    </Card>
  );
}

const FULFIL: Record<string, { bg: string; fg: string; label: string }> = {
  new: { bg: "#fff3d6", fg: "#8a6300", label: "New" },
  shipped: { bg: "#d9f2e3", fg: "#1f7a4d", label: "Shipped" },
  cancelled: { bg: "#f0d9d7", fg: "#9a2820", label: "Cancelled" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = FULFIL[status] ?? FULFIL.new;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-[3px] text-[12px] font-semibold"
      style={{ background: s.bg, color: s.fg }}
    >
      {s.label}
    </span>
  );
}

export function PaymentBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const paid = status.toLowerCase() === "paid";
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-[3px] text-[12px] font-medium"
      style={
        paid
          ? { background: "#eef0ee", color: "#4a4a45" }
          : { background: "#f0d9d7", color: "#9a2820" }
      }
    >
      {paid ? "Paid" : status}
    </span>
  );
}

/** Lightweight SVG-free bar chart (CSS heights). */
export function BarChart({
  points,
  format,
}: {
  points: { label: string; value: number }[];
  format?: (v: number) => string;
}) {
  const max = Math.max(1, ...points.map((p) => p.value));
  const everyNth = points.length > 16 ? 4 : points.length > 8 ? 2 : 1;
  return (
    <div>
      <div className="flex h-[140px] items-end gap-1.5">
        {points.map((p, i) => (
          <div
            key={i}
            className="group relative flex flex-1 items-end justify-center"
            style={{ height: "100%" }}
          >
            <div
              className="w-full max-w-[26px] rounded-t-[3px] bg-ink/80 transition-colors group-hover:bg-ink"
              style={{
                height: `${(p.value / max) * 100}%`,
                minHeight: p.value > 0 ? 4 : 1,
              }}
            />
            <div className="pointer-events-none absolute -top-7 hidden whitespace-nowrap rounded bg-ink px-2 py-1 text-[11px] text-cream group-hover:block">
              {format ? format(p.value) : p.value}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5">
        {points.map((p, i) => (
          <div
            key={i}
            className="flex-1 text-center text-[10px] text-[#a3a39c]"
          >
            {i % everyNth === 0 ? p.label : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[#dcdcd6] bg-white/50 px-6 py-16 text-center text-[14px] text-[#8a8a84]">
      {children}
    </div>
  );
}
