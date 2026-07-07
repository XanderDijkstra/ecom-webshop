"use client";

import { Card, Empty } from "./ui";

export interface FunnelCounts {
  PageView: number;
  AddToCart: number;
  InitiateCheckout: number;
}

// Each stage counts unique visitors (distinct visitor_id), not raw events, so
// the funnel can only narrow downwards.
const STAGES: { label: string; hint: string }[] = [
  { label: "Visitors", hint: "visited the shop" },
  { label: "Added to cart", hint: "added to cart" },
  { label: "Started checkout", hint: "went to checkout" },
  { label: "Purchase", hint: "completed purchase" },
];

// Ink → clay taper across the four stages.
const BAR = ["#2A2622", "#5b4a3f", "#8a5a44", "#B84B36"];

const pct = (n: number, d: number) => (d > 0 ? (n / d) * 100 : 0);
const fmtPct = (v: number) =>
  `${v.toLocaleString("en-GB", { maximumFractionDigits: 1 })}%`;
const fmtNum = (n: number) => n.toLocaleString("en-GB");

/**
 * PageView → AddToCart → InitiateCheckout → Purchase, drawn as a tapering
 * funnel. Bar width tapers with volume (with a floor so every stage stays
 * readable); each stage shows its count, its share of visits, and the
 * step-conversion from the stage above.
 */
export function Funnel({
  counts,
  purchases,
  ready = true,
  loading,
}: {
  counts: FunnelCounts | null;
  purchases: number;
  ready?: boolean;
  loading?: boolean;
}) {
  const values = [
    counts?.PageView ?? 0,
    counts?.AddToCart ?? 0,
    counts?.InitiateCheckout ?? 0,
    purchases,
  ];
  const top = values[0];
  const scaleBase = Math.max(...values, 1);
  const hasData = values.some((v) => v > 0);

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-[15px] font-semibold text-ink">Conversion funnel</h2>
        <span className="text-[13px] text-[#8a8a84]">
          {top > 0 ? `${fmtPct(pct(purchases, top))} visit → purchase` : "—"}
        </span>
      </div>

      {loading ? (
        <div className="text-[14px] text-[#8a8a84]">Loading …</div>
      ) : !ready ? (
        <Empty>
          The funnel isn't set up yet. Run the{" "}
          <code className="rounded bg-[#eee] px-1">funnel_events</code> SQL in
          Supabase and data will start collecting.
        </Empty>
      ) : !hasData ? (
        <Empty>No visitor data for this period yet.</Empty>
      ) : (
        <div>
          {STAGES.map((s, i) => {
            const v = values[i];
            const width = 28 + 72 * (v / scaleBase); // %, floored for readability
            const stepPct = i > 0 ? pct(v, values[i - 1]) : 100;
            return (
              <div key={s.label}>
                {i > 0 && (
                  <div className="flex items-center justify-center py-1.5 text-[11.5px] text-[#a3a39c]">
                    ↓ {fmtPct(stepPct)} {s.hint}
                  </div>
                )}
                <div
                  className="mx-auto rounded-lg px-4 py-3 text-cream"
                  style={{ width: `${width}%`, background: BAR[i] }}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-[13px] font-medium">
                      {s.label}
                    </span>
                    <span className="shrink-0 text-[16px] font-semibold">
                      {fmtNum(v)}
                    </span>
                  </div>
                  {top > 0 && (
                    <div className="text-[11px] text-cream/70">
                      {fmtPct(pct(v, top))} of visits
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
