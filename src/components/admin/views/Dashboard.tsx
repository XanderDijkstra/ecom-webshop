"use client";

import {
  type AdminOrder,
  computeKpis,
  revenueSeries,
  topVariants,
  fmtMoney,
  fmtDateTime,
  orderUnits,
  fulfillment,
} from "@/lib/admin-stats";
import { Card, Kpi, BarChart, StatusBadge, Empty } from "../ui";
import { Funnel, type FunnelCounts } from "../Funnel";

export function Dashboard({
  orders,
  from,
  to,
  funnel,
  funnelLoading,
  onOpenOrders,
}: {
  orders: AdminOrder[];
  from: Date;
  to: Date;
  funnel: { ready: boolean; counts: FunnelCounts } | null;
  funnelLoading: boolean;
  onOpenOrders: () => void;
}) {
  const k = computeKpis(orders);
  const series = revenueSeries(orders, from, to);
  const top = topVariants(orders).slice(0, 5);
  const recent = [...orders].slice(0, 6);
  const periodRevenue = series.reduce((s, d) => s + d.revenue, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Revenue" value={fmtMoney(k.revenue)} sub={`${k.paid} paid orders`} accent />
        <Kpi label="Orders" value={String(k.orders)} sub={`${k.units} units sold`} />
        <Kpi label="Avg. order" value={fmtMoney(k.aov)} sub={`${k.customers} customers`} />
        <Kpi label="To fulfill" value={String(k.toFulfill)} sub="awaiting packing" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-[15px] font-semibold text-ink">Revenue</h2>
            <span className="text-[13px] text-[#8a8a84]">{fmtMoney(periodRevenue)}</span>
          </div>
          <BarChart points={series.map((d) => ({ label: d.label, value: d.revenue }))} format={fmtMoney} />
        </Card>

        <Funnel
          counts={funnel?.counts ?? null}
          purchases={k.paid}
          ready={funnel?.ready ?? true}
          loading={funnelLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-ink">Recent orders</h2>
            <button onClick={onOpenOrders} className="text-[13px] font-medium text-clay hover:underline">
              See all →
            </button>
          </div>
          {recent.length === 0 ? (
            <Empty>No orders yet.</Empty>
          ) : (
            <div className="divide-y divide-[#f0f0ec]">
              {recent.map((o) => (
                <button
                  key={o.id}
                  onClick={onOpenOrders}
                  className="flex w-full items-center justify-between gap-3 py-3 text-left hover:opacity-80"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-medium text-ink">
                      {o.customer_name || o.email || "Unknown customer"}
                    </div>
                    <div className="text-[12px] text-[#8a8a84]">
                      {fmtDateTime(o.created_at)} · {orderUnits(o)} units
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <StatusBadge status={fulfillment(o)} />
                    <span className="w-[80px] text-right text-[14px] font-semibold text-ink">
                      {fmtMoney(o.amount_total || 0)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 text-[15px] font-semibold text-ink">Best-selling patterns</h2>
          {top.length === 0 ? (
            <Empty>No sales yet.</Empty>
          ) : (
            <div className="space-y-3">
              {top.map((v) => (
                <div key={v.key} className="flex items-center gap-3">
                  <span
                    className="h-4 w-4 shrink-0 rounded-full border border-black/10"
                    style={{ background: v.hex ?? "#ccc" }}
                  />
                  <span className="flex-1 truncate text-[13.5px] text-ink">{v.variant}</span>
                  <span className="text-[13.5px] font-semibold text-ink">{v.units}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
