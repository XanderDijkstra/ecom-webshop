"use client";

import {
  type AdminOrder,
  computeKpis,
  revenueSeries,
  topVariants,
  fmtMoney,
  fulfillment,
} from "@/lib/admin-stats";
import { Card, Kpi, BarChart, Empty } from "../ui";
import { Funnel, type FunnelCounts } from "../Funnel";
import { ClarityInsights } from "../ClarityInsights";

export function Insights({
  orders,
  from,
  to,
  funnel,
  funnelLoading,
  token,
}: {
  orders: AdminOrder[];
  from: Date;
  to: Date;
  funnel: { ready: boolean; counts: FunnelCounts } | null;
  funnelLoading: boolean;
  token: string;
}) {
  const k = computeKpis(orders);
  const series = revenueSeries(orders, from, to);
  const variants = topVariants(orders);
  const maxUnits = Math.max(1, ...variants.map((v) => v.units));

  const fulfil = { new: 0, shipped: 0, cancelled: 0 } as Record<string, number>;
  for (const o of orders) {
    if (o.payment_status?.toLowerCase() === "paid")
      fulfil[fulfillment(o)] = (fulfil[fulfillment(o)] ?? 0) + 1;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Total revenue" value={fmtMoney(k.revenue)} accent />
        <Kpi label="Avg. order" value={fmtMoney(k.aov)} />
        <Kpi label="Units sold" value={String(k.units)} />
        <Kpi label="Unique customers" value={String(k.customers)} />
      </div>

      <Funnel
        counts={funnel?.counts ?? null}
        purchases={k.paid}
        ready={funnel?.ready ?? true}
        loading={funnelLoading}
      />

      <ClarityInsights token={token} />

      <Card className="p-5">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold text-ink">Revenue</h2>
          <span className="text-[13px] text-[#8a8a84]">
            {fmtMoney(series.reduce((s, d) => s + d.revenue, 0))}
          </span>
        </div>
        <BarChart points={series.map((d) => ({ label: d.label, value: d.revenue }))} format={fmtMoney} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card className="p-5">
          <h2 className="mb-4 text-[15px] font-semibold text-ink">Patterns by units sold</h2>
          {variants.length === 0 ? (
            <Empty>No sales yet.</Empty>
          ) : (
            <div className="space-y-3">
              {variants.map((v) => (
                <div key={v.key} className="flex items-center gap-3">
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/10"
                    style={{ background: v.hex ?? "#ccc" }}
                  />
                  <span className="w-[120px] shrink-0 truncate text-[13.5px] text-ink">
                    {v.variant}
                  </span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#f0f0ec]">
                    <div
                      className="h-full rounded-full bg-clay"
                      style={{ width: `${(v.units / maxUnits) * 100}%` }}
                    />
                  </div>
                  <span className="w-[36px] shrink-0 text-right text-[13.5px] font-semibold text-ink">
                    {v.units}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-[15px] font-semibold text-ink">Order status</h2>
          <div className="space-y-3 text-[14px]">
            <Row label="To fulfill" value={fulfil.new} color="#8a6300" />
            <Row label="Shipped" value={fulfil.shipped} color="#1f7a4d" />
            <Row label="Cancelled" value={fulfil.cancelled} color="#9a2820" />
          </div>
          <div className="mt-4 border-t border-[#f0f0ec] pt-4 text-[13px] text-[#8a8a84]">
            {k.paid} paid of {k.orders} total
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-ink">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        {label}
      </span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}
