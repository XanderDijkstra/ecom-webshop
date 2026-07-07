"use client";

import { useCallback, useEffect, useState } from "react";
import { fmtMoney, fmtDateTime } from "@/lib/admin-stats";
import { getProduct } from "@/lib/products";
import { Card, Empty } from "../ui";

interface CustomerRow {
  email: string;
  name: string | null;
  phone: string | null;
  orders: number;
  totalSpent: number;
  lastOrderAt: string;
}

interface LeadItem {
  slug?: string;
  colorId?: string;
  qty?: number;
  bump?: boolean;
}

interface LeadRow {
  email: string;
  items: LeadItem[] | null;
  subtotal: number | null;
  consent: boolean;
  reminder_sent_at: string | null;
  updated_at: string;
}

function cartSummary(items: LeadRow["items"]): string {
  const rows = (Array.isArray(items) ? items : []).map((it) => {
    const p = getProduct(it.slug ?? "");
    const c = p?.colors.find((x) => x.id === it.colorId);
    return `${it.qty ?? 1} × ${c?.name ?? it.colorId ?? "?"}`;
  });
  return rows.join(", ") || "—";
}

export function Customers({ token }: { token: string }) {
  const [tab, setTab] = useState<"customers" | "leads">("customers");
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/customers", {
        headers: { authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't load customers.");
      setCustomers(data.customers ?? []);
      setLeads(data.leads ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  if (error)
    return (
      <div className="rounded-xl border border-[#f0d9d7] bg-[#fdf6f5] px-5 py-4 text-[14px] text-[#9a2820]">
        {error}
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-[#e8e8e4] bg-white p-1">
          {(
            [
              { key: "customers", label: `Customers (${customers.length})` },
              { key: "leads", label: `Leads (${leads.length})` },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                tab === t.key ? "bg-ink text-cream" : "text-[#6b6b66] hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="rounded-lg border border-[#e2e2dd] px-3 py-1.5 text-[13px] font-medium text-ink transition-colors hover:border-ink disabled:opacity-50"
        >
          {loading ? "Refreshing …" : "Refresh"}
        </button>
        <span className="text-[12.5px] text-[#8a8a84]">
          Leads are shoppers who entered their email at checkout but haven&apos;t
          bought (yet).
        </span>
      </div>

      {loading && customers.length === 0 && leads.length === 0 ? (
        <div className="text-[14px] text-[#8a8a84]">Loading …</div>
      ) : tab === "customers" ? (
        customers.length === 0 ? (
          <Empty>No customers yet.</Empty>
        ) : (
          <Card className="overflow-hidden">
            <div className="hidden items-center gap-3 border-b border-[#f0f0ec] px-5 py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#a3a39c] sm:flex">
              <span className="flex-1">Customer</span>
              <span className="w-[110px]">Phone</span>
              <span className="w-[60px] text-right">Orders</span>
              <span className="w-[100px] text-right">Total spent</span>
              <span className="w-[150px] text-right">Last order</span>
            </div>
            <div className="divide-y divide-[#f0f0ec]">
              {customers.map((c) => (
                <div key={c.email} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-medium text-ink">
                      {c.name || c.email}
                    </div>
                    <div className="truncate text-[12px] text-[#8a8a84]">{c.email}</div>
                  </div>
                  <span className="w-[110px] text-[13px] text-[#6b6b66]">
                    {c.phone || "—"}
                  </span>
                  <span className="w-[60px] text-right text-[14px] text-ink">
                    {c.orders}
                  </span>
                  <span className="w-[100px] text-right text-[14px] font-semibold text-ink">
                    {fmtMoney(c.totalSpent)}
                  </span>
                  <span className="w-[150px] text-right text-[12.5px] text-[#8a8a84]">
                    {fmtDateTime(c.lastOrderAt)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )
      ) : leads.length === 0 ? (
        <Empty>No leads yet — they appear when a shopper enters an email at checkout without completing the purchase.</Empty>
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden items-center gap-3 border-b border-[#f0f0ec] px-5 py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#a3a39c] sm:flex">
            <span className="flex-1">Lead</span>
            <span className="w-[200px]">Cart</span>
            <span className="w-[80px] text-right">Value</span>
            <span className="w-[120px] text-center">Reminder</span>
            <span className="w-[150px] text-right">Last activity</span>
          </div>
          <div className="divide-y divide-[#f0f0ec]">
            {leads.map((l) => (
              <div key={l.email} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-medium text-ink">{l.email}</div>
                  <div className="text-[12px] text-[#8a8a84]">
                    {l.consent ? "Marketing consent" : "No marketing consent"}
                  </div>
                </div>
                <span className="w-[200px] truncate text-[13px] text-[#6b6b66]">
                  {cartSummary(l.items)}
                </span>
                <span className="w-[80px] text-right text-[14px] font-semibold text-ink">
                  {fmtMoney(l.subtotal || 0)}
                </span>
                <span className="w-[120px] text-center">
                  {l.reminder_sent_at ? (
                    <span className="inline-flex items-center rounded-full bg-[#d9f2e3] px-2.5 py-[3px] text-[12px] font-semibold text-[#1f7a4d]">
                      Sent
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-[#fff3d6] px-2.5 py-[3px] text-[12px] font-semibold text-[#8a6300]">
                      Pending
                    </span>
                  )}
                </span>
                <span className="w-[150px] text-right text-[12.5px] text-[#8a8a84]">
                  {fmtDateTime(l.updated_at)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
