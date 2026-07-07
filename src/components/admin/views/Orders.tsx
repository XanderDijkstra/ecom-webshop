"use client";

import { useMemo, useState } from "react";
import {
  type AdminOrder,
  fmtMoney,
  fmtDateTime,
  addressLine,
  fulfillment,
  orderItems,
} from "@/lib/admin-stats";
import { getProduct } from "@/lib/products";
import { Card, StatusBadge, PaymentBadge, Empty } from "../ui";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "shipped", label: "Shipped" },
  { key: "cancelled", label: "Cancelled" },
];

export function Orders({
  orders,
  token,
  onUpdated,
  onDeleted,
}: {
  orders: AdminOrder[];
  token: string;
  onUpdated: (o: AdminOrder) => void;
  onDeleted: (id: string) => void;
}) {
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter !== "all" && fulfillment(o) !== filter) return false;
      if (!term) return true;
      return [o.customer_name, o.email, o.phone, o.stripe_session_id]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(term));
    });
  }, [orders, filter, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-[#e8e8e4] bg-white p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                filter === f.key ? "bg-ink text-cream" : "text-[#6b6b66] hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, phone …"
          className="h-[38px] flex-1 rounded-lg border border-[#e8e8e4] bg-white px-3.5 text-[14px] outline-none focus:border-ink"
        />
        <span className="text-[13px] text-[#8a8a84]">{filtered.length} orders</span>
        <button
          onClick={() => downloadCsv(filtered)}
          disabled={filtered.length === 0}
          className="rounded-lg border border-[#e2e2dd] px-3 py-1.5 text-[13px] font-medium text-ink transition-colors hover:border-ink disabled:opacity-50"
        >
          Export CSV
        </button>
      </div>

      {filtered.length === 0 ? (
        <Empty>No orders here.</Empty>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-[#f0f0ec]">
            {filtered.map((o) => (
              <OrderRow
                key={o.id}
                order={o}
                open={openId === o.id}
                onToggle={() => setOpenId(openId === o.id ? null : o.id)}
                token={token}
                onUpdated={onUpdated}
                onDeleted={onDeleted}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function OrderRow({
  order,
  open,
  onToggle,
  token,
  onUpdated,
  onDeleted,
}: {
  order: AdminOrder;
  open: boolean;
  onToggle: () => void;
  token: string;
  onUpdated: (o: AdminOrder) => void;
  onDeleted: (id: string) => void;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-[#fafaf8]"
      >
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-medium text-ink">
            {order.customer_name || order.email || "Unknown customer"}
          </div>
          <div className="truncate text-[12px] text-[#8a8a84]">
            {fmtDateTime(order.created_at)} · {order.email || "—"}
          </div>
        </div>
        <PaymentBadge status={order.payment_status} />
        <StatusBadge status={fulfillment(order)} />
        <span className="w-[88px] text-right text-[14px] font-semibold text-ink">
          {fmtMoney(order.amount_total || 0)}
        </span>
        <span className={`text-[#b3b3ac] transition-transform ${open ? "rotate-90" : ""}`}>›</span>
      </button>
      {open && (
        <OrderDetail
          order={order}
          token={token}
          onUpdated={onUpdated}
          onDeleted={onDeleted}
        />
      )}
    </div>
  );
}

function OrderDetail({
  order,
  token,
  onUpdated,
  onDeleted,
}: {
  order: AdminOrder;
  token: string;
  onUpdated: (o: AdminOrder) => void;
  onDeleted: (id: string) => void;
}) {
  const [status, setStatus] = useState(fulfillment(order));
  const [tracking, setTracking] = useState(order.tracking_number ?? "");
  const [note, setNote] = useState(order.admin_note ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [delBusy, setDelBusy] = useState(false);

  async function remove() {
    setDelBusy(true);
    setErr(null);
    try {
      const res = await fetch(
        `/api/admin/orders?id=${encodeURIComponent(order.id)}`,
        {
          method: "DELETE",
          headers: { authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't delete the order.");
      onDeleted(order.id); // row disappears from the list
    } catch (e) {
      setErr((e as Error).message);
      setDelBusy(false);
      setConfirmDel(false);
    }
  }

  const dirty =
    status !== fulfillment(order) ||
    tracking !== (order.tracking_number ?? "") ||
    note !== (order.admin_note ?? "");

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id: order.id,
          fulfillment_status: status,
          tracking_number: tracking,
          admin_note: note,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't save.");
      onUpdated(data.order);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 border-t border-[#f0f0ec] bg-[#fbfbf9] px-5 py-5 lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-4 text-[13.5px]">
        <Field label="Customer">
          <div className="font-medium text-ink">{order.customer_name || "—"}</div>
          <div className="text-[#6b6b66]">{order.email || "—"}</div>
          <div className="text-[#6b6b66]">{order.phone || "—"}</div>
        </Field>
        <Field label="Shipping address">
          <div className="text-[#3a3a36]">{addressLine(order.shipping_address)}</div>
        </Field>
        <Field label="Items">
          <div className="space-y-1">
            {orderItems(order).map((it, i) => {
              const p = getProduct(it.slug ?? "");
              const c = p?.colors.find((x) => x.id === it.colorId);
              return (
                <div key={i} className="text-[#3a3a36]">
                  {it.qty ?? 1} × {p?.name ?? it.slug} — {c?.name ?? it.colorId}
                  {it.bump && (
                    <span className="ml-1.5 rounded bg-clay/15 px-1.5 py-0.5 text-[11px] font-semibold text-clay">
                      deal −30%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Field>
        <div className="text-[11.5px] text-[#a3a39c]">Stripe: {order.stripe_session_id}</div>
      </div>

      <div className="space-y-3">
        <label className="block text-[12px] font-medium text-[#8a8a84]">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#e8e8e4] bg-white px-3 py-2 text-[14px] text-ink outline-none focus:border-ink"
          >
            <option value="new">New</option>
            <option value="shipped">Shipped</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <label className="block text-[12px] font-medium text-[#8a8a84]">
          Tracking number
          <input
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="—"
            className="mt-1 w-full rounded-lg border border-[#e8e8e4] bg-white px-3 py-2 text-[14px] text-ink outline-none focus:border-ink"
          />
        </label>
        <label className="block text-[12px] font-medium text-[#8a8a84]">
          Note
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="—"
            className="mt-1 w-full resize-none rounded-lg border border-[#e8e8e4] bg-white px-3 py-2 text-[14px] text-ink outline-none focus:border-ink"
          />
        </label>
        {err && <p className="text-[13px] text-red-700">{err}</p>}
        <button
          onClick={save}
          disabled={!dirty || busy}
          className="w-full rounded-lg bg-ink py-2.5 text-[14px] font-semibold text-cream transition-colors hover:bg-clay disabled:opacity-50"
        >
          {busy ? "Saving …" : "Save changes"}
        </button>

        {/* Danger zone: permanent, irreversible delete with an inline confirm */}
        <div className="mt-1 border-t border-[#f0d9d7] pt-3">
          {!confirmDel ? (
            <button
              onClick={() => setConfirmDel(true)}
              className="text-[13px] font-medium text-[#9a2820] hover:underline"
            >
              Delete order
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-[13px] text-[#9a2820]">
                Delete this order permanently? This can't be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={remove}
                  disabled={delBusy}
                  className="rounded-lg bg-[#9a2820] px-3.5 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {delBusy ? "Deleting …" : "Yes, delete"}
                </button>
                <button
                  onClick={() => setConfirmDel(false)}
                  disabled={delBusy}
                  className="rounded-lg border border-[#e2e2dd] px-3.5 py-2 text-[13px] font-medium text-ink transition-colors hover:border-ink disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function downloadCsv(rows: AdminOrder[]) {
  const header = [
    "Date", "Name", "Email", "Phone", "Amount", "Currency",
    "Payment", "Status", "Tracking", "Address", "Items", "Stripe id",
  ];
  const esc = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((o) =>
    [
      fmtDateTime(o.created_at),
      o.customer_name ?? "",
      o.email ?? "",
      o.phone ?? "",
      String(o.amount_total ?? ""),
      o.currency ?? "",
      o.payment_status ?? "",
      fulfillment(o),
      o.tracking_number ?? "",
      addressLine(o.shipping_address),
      orderItems(o)
        .map((it) => `${it.qty ?? 1}x ${it.slug ?? ""}/${it.colorId ?? ""}`)
        .join("; "),
      o.stripe_session_id,
    ]
      .map((v) => esc(String(v)))
      .join(","),
  );
  const csv = [header.map(esc).join(","), ...lines].join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#a3a39c]">
        {label}
      </div>
      {children}
    </div>
  );
}
