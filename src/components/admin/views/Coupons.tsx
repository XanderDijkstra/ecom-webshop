"use client";

import { useCallback, useEffect, useState } from "react";
import { fmtDateTime } from "@/lib/admin-stats";
import { Card, Empty } from "../ui";

interface CouponRow {
  id: string;
  code: string;
  percent_off: number;
  active: boolean;
  expires_at: string | null;
  created_at: string;
}

/**
 * Coupon management (Marketing tab): create percentage codes, toggle them
 * on/off, delete them. A 100% code makes checkout free — shoppers complete
 * via the free-order flow (no Stripe/Vipps involved).
 */
export function Coupons({ token }: { token: string }) {
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [ready, setReady] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState("");

  const headers = useCallback(
    (json = false) => ({
      authorization: `Bearer ${token}`,
      ...(json ? { "content-type": "application/json" } : {}),
    }),
    [token],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/coupons", { headers: headers() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't load coupons.");
      setReady(data.ready !== false);
      setCoupons(data.coupons ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    load();
  }, [load]);

  async function create() {
    const pct = Math.floor(Number(percent));
    if (!code.trim() || !pct) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: headers(true),
        body: JSON.stringify({ code: code.trim(), percentOff: pct }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't create the coupon.");
      setCoupons((c) => [data.coupon, ...c]);
      setCode("");
      setPercent("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(c: CouponRow) {
    setCoupons((all) =>
      all.map((x) => (x.id === c.id ? { ...x, active: !c.active } : x)),
    );
    const res = await fetch("/api/admin/coupons", {
      method: "PATCH",
      headers: headers(true),
      body: JSON.stringify({ id: c.id, active: !c.active }),
    });
    if (!res.ok) {
      setCoupons((all) =>
        all.map((x) => (x.id === c.id ? { ...x, active: c.active } : x)),
      );
    }
  }

  async function remove(id: string) {
    const prev = coupons;
    setCoupons((all) => all.filter((x) => x.id !== id));
    const res = await fetch("/api/admin/coupons", {
      method: "DELETE",
      headers: headers(true),
      body: JSON.stringify({ id }),
    });
    if (!res.ok) setCoupons(prev);
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[15px] font-semibold text-ink">Coupons</h2>
        <span className="text-[12.5px] text-[#8a8a84]">
          Percentage off the whole order · 100% = free order (no payment step)
        </span>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <input
          type="text"
          value={code}
          placeholder="CODE (e.g. PIXELTEST)"
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="min-w-0 flex-1 rounded-lg border border-[#e2e2dd] px-3 py-2 text-[13.5px] uppercase text-ink outline-none transition-colors focus:border-ink"
        />
        <input
          type="number"
          min={1}
          max={100}
          value={percent}
          placeholder="% off"
          onChange={(e) => setPercent(e.target.value)}
          className="w-24 rounded-lg border border-[#e2e2dd] px-3 py-2 text-[13.5px] text-ink outline-none transition-colors focus:border-ink"
        />
        <button
          onClick={create}
          disabled={busy || !code.trim() || !Number(percent)}
          className="rounded-lg bg-ink px-4 py-2 text-[13.5px] font-semibold text-cream transition-colors hover:bg-clay disabled:opacity-50"
        >
          {busy ? "Creating …" : "Create coupon"}
        </button>
      </div>

      {error && <p className="mb-3 text-[13px] text-[#9a2820]">{error}</p>}

      {loading ? (
        <p className="text-[13.5px] text-[#8a8a84]">Loading …</p>
      ) : !ready ? (
        <Empty>
          Coupons need the new <code className="rounded bg-[#eee] px-1">coupons</code> table —
          re-run <code className="rounded bg-[#eee] px-1">supabase/schema.sql</code> in Supabase.
        </Empty>
      ) : coupons.length === 0 ? (
        <Empty>No coupons yet — create the first one above.</Empty>
      ) : (
        <div className="divide-y divide-[#f0f0ec]">
          {coupons.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-3 py-2.5">
              <code className="rounded bg-[#f3f3ef] px-2 py-1 text-[13px] font-semibold text-ink">
                {c.code}
              </code>
              <span className="text-[13.5px] font-medium text-ink">
                −{c.percent_off} %
              </span>
              <span className="flex-1 truncate text-[12px] text-[#8a8a84]">
                created {fmtDateTime(c.created_at)}
              </span>
              <button
                onClick={() => toggle(c)}
                className={`rounded-full px-2.5 py-[3px] text-[11.5px] font-semibold ${
                  c.active
                    ? "bg-[#d9f2e3] text-[#1f7a4d]"
                    : "bg-[#eee] text-[#8a8a84]"
                }`}
              >
                {c.active ? "Active" : "Off"}
              </button>
              <button
                onClick={() => remove(c.id)}
                className="text-[12px] font-medium text-[#c0c0b8] hover:text-[#9a2820]"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
