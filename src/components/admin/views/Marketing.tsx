"use client";

import { useCallback, useEffect, useState } from "react";
import { fmtDateTime } from "@/lib/admin-stats";
import { Card, Empty } from "../ui";

interface EmailRow {
  id: string;
  type: string;
  recipient: string;
  subject: string | null;
  status: string;
  error: string | null;
  created_at: string;
}

const TYPE_META: Record<string, { label: string; bg: string; fg: string }> = {
  cart_reminder: { label: "Cart reminder", bg: "#f6e3d9", fg: "#8a4a2e" },
  order_confirmation: { label: "Order confirmation", bg: "#d9f2e3", fg: "#1f7a4d" },
  order_admin: { label: "Admin alert", bg: "#eef0ee", fg: "#4a4a45" },
};

function TypeBadge({ type }: { type: string }) {
  const m = TYPE_META[type] ?? { label: type, bg: "#eef0ee", fg: "#4a4a45" };
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-[3px] text-[12px] font-semibold"
      style={{ background: m.bg, color: m.fg }}
    >
      {m.label}
    </span>
  );
}

export function Marketing({ token }: { token: string }) {
  const [emails, setEmails] = useState<EmailRow[]>([]);
  const [ready, setReady] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ id: string; html: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/emails", {
        headers: { authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't load the email log.");
      setReady(data.ready !== false);
      setEmails(data.emails ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(id: string) {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    if (preview?.id !== id) {
      setPreview(null);
      try {
        const res = await fetch(`/api/admin/emails?id=${encodeURIComponent(id)}`, {
          headers: { authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.email?.html) setPreview({ id, html: data.email.html });
      } catch {
        /* preview is best-effort */
      }
    }
  }

  if (error)
    return (
      <div className="rounded-xl border border-[#f0d9d7] bg-[#fdf6f5] px-5 py-4 text-[14px] text-[#9a2820]">
        {error}
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={load}
          disabled={loading}
          className="rounded-lg border border-[#e2e2dd] px-3 py-1.5 text-[13px] font-medium text-ink transition-colors hover:border-ink disabled:opacity-50"
        >
          {loading ? "Refreshing …" : "Refresh"}
        </button>
        <span className="text-[12.5px] text-[#8a8a84]">
          Every email the store sends — click a row to preview it exactly as the
          recipient sees it.
        </span>
      </div>

      {loading && emails.length === 0 ? (
        <div className="text-[14px] text-[#8a8a84]">Loading …</div>
      ) : !ready ? (
        <Empty>
          The email log isn&apos;t set up yet. Run the{" "}
          <code className="rounded bg-[#eee] px-1">email_log</code> SQL from{" "}
          <code className="rounded bg-[#eee] px-1">supabase/schema.sql</code> in
          Supabase, and every email sent from then on shows up here.
        </Empty>
      ) : emails.length === 0 ? (
        <Empty>
          No emails logged yet. The next order confirmation or cart reminder
          will appear here.
        </Empty>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-[#f0f0ec]">
            {emails.map((e) => (
              <div key={e.id}>
                <button
                  onClick={() => toggle(e.id)}
                  className="flex w-full flex-wrap items-center gap-3 px-5 py-3.5 text-left hover:bg-[#fafaf8]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-medium text-ink">
                      {e.subject || "(no subject)"}
                    </div>
                    <div className="truncate text-[12px] text-[#8a8a84]">
                      to {e.recipient} · {fmtDateTime(e.created_at)}
                    </div>
                  </div>
                  <TypeBadge type={e.type} />
                  {e.status === "sent" ? (
                    <span className="inline-flex items-center rounded-full bg-[#d9f2e3] px-2.5 py-[3px] text-[12px] font-semibold text-[#1f7a4d]">
                      Sent
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center rounded-full bg-[#f0d9d7] px-2.5 py-[3px] text-[12px] font-semibold text-[#9a2820]"
                      title={e.error ?? undefined}
                    >
                      Failed
                    </span>
                  )}
                  <span
                    className={`text-[#b3b3ac] transition-transform ${
                      openId === e.id ? "rotate-90" : ""
                    }`}
                  >
                    ›
                  </span>
                </button>
                {openId === e.id && (
                  <div className="border-t border-[#f0f0ec] bg-[#fbfbf9] px-5 py-4">
                    {e.error && (
                      <p className="mb-3 text-[13px] text-[#9a2820]">{e.error}</p>
                    )}
                    {preview?.id === e.id ? (
                      <iframe
                        title="Email preview"
                        sandbox=""
                        srcDoc={preview.html}
                        className="h-[520px] w-full rounded-lg border border-[#e8e8e4] bg-white"
                      />
                    ) : (
                      <div className="text-[13px] text-[#8a8a84]">Loading preview …</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
