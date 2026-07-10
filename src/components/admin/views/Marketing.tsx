"use client";

import { useCallback, useEffect, useState } from "react";
import { fmtDateTime } from "@/lib/admin-stats";
import { Card, Empty } from "../ui";
import { Coupons } from "./Coupons";

interface EmailRow {
  id: string;
  type: string;
  recipient: string;
  subject: string | null;
  status: string;
  error: string | null;
  created_at: string;
}

interface FlowStats {
  captured: number;
  unsubscribed: number;
  sent1: number;
  sent2: number;
  waitingFor1: number;
  waitingFor2: number;
  doneNoPurchase: number;
  converted: number;
  convertedBeforeEmail: number;
  convertedAfter1: number;
  convertedAfter2: number;
}

const TYPE_META: Record<string, { label: string; bg: string; fg: string }> = {
  cart_reminder: { label: "Cart reminder", bg: "#f6e3d9", fg: "#8a4a2e" },
  cart_reminder_2: { label: "Final reminder", bg: "#f0d9d7", fg: "#8a2e2e" },
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

  const [flow, setFlow] = useState<FlowStats | null>(null);
  const [flowReady, setFlowReady] = useState(true);
  const [templatePreview, setTemplatePreview] = useState<{
    key: string;
    subject: string;
    html: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [logRes, flowRes] = await Promise.all([
        fetch("/api/admin/emails", {
          headers: { authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/flow", {
          headers: { authorization: `Bearer ${token}` },
        }),
      ]);
      const logData = await logRes.json();
      if (!logRes.ok) throw new Error(logData.error || "Couldn't load the email log.");
      setReady(logData.ready !== false);
      setEmails(logData.emails ?? []);
      const flowData = await flowRes.json();
      if (flowRes.ok && flowData.ready) setFlow(flowData.stats);
      else setFlowReady(flowData?.ready !== false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleTemplate(key: "cart_reminder" | "cart_reminder_2") {
    if (templatePreview?.key === key) {
      setTemplatePreview(null);
      return;
    }
    try {
      const res = await fetch(`/api/admin/emails?template=${key}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.email?.html) {
        setTemplatePreview({ key, subject: data.email.subject, html: data.email.html });
      }
    } catch {
      /* preview is best-effort */
    }
  }

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
    <div className="space-y-6">
      {/* ---- Abandoned-cart email flow ---------------------------------- */}
      <Card className="p-6">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[15px] font-semibold text-ink">
            Abandoned-cart flow
          </h2>
          <span className="text-[12.5px] text-[#8a8a84]">
            Shoppers who left an email at checkout without paying — nudged
            twice, then left alone.
          </span>
        </div>

        {!flowReady ? (
          <Empty>
            The flow needs the new <code className="rounded bg-[#eee] px-1">reminder2_sent_at</code>{" "}
            column — re-run <code className="rounded bg-[#eee] px-1">supabase/schema.sql</code> in
            Supabase (it&apos;s safe to run the whole file again).
          </Empty>
        ) : !flow ? (
          <div className="text-[14px] text-[#8a8a84]">Loading …</div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
            <div>
              <FlowNode
                title="Cart captured"
                subtitle="Email entered at checkout, no payment"
                count={flow.captured}
                tone="#2A2622"
              />
              <FlowArrow label={`30 min later · ${flow.waitingFor1} waiting`} />
              <FlowNode
                title="Email 1 — Du glemte noe hos BÆRA 🧡"
                subtitle="The first nudge"
                count={flow.sent1}
                countLabel="sent"
                tone="#8a5a44"
                onPreview={() => toggleTemplate("cart_reminder")}
                previewOpen={templatePreview?.key === "cart_reminder"}
              />
              <FlowArrow label={`24 h later · ${flow.waitingFor2} waiting`} />
              <FlowNode
                title="Email 2 — Tilbudet ditt står fortsatt 🧡"
                subtitle="The final email; says so explicitly"
                count={flow.sent2}
                countLabel="sent"
                tone="#B84B36"
                onPreview={() => toggleTemplate("cart_reminder_2")}
                previewOpen={templatePreview?.key === "cart_reminder_2"}
              />
              <FlowArrow label="flow complete" />
              <FlowNode
                title="No purchase — left alone"
                subtitle="Went through the whole flow"
                count={flow.doneNoPurchase}
                tone="#8a8a84"
              />
            </div>

            <div className="space-y-3">
              <SideStat
                label="Recovered (purchased)"
                value={flow.converted}
                tone="#1f7a4d"
                detail={[
                  `${flow.convertedBeforeEmail} before any email`,
                  `${flow.convertedAfter1} after email 1`,
                  `${flow.convertedAfter2} after email 2`,
                ]}
              />
              <SideStat
                label="Unsubscribed"
                value={flow.unsubscribed}
                tone="#9a2820"
                detail={["Excluded from all emails"]}
              />
            </div>
          </div>
        )}

        {templatePreview && (
          <div className="mt-5 rounded-xl border border-[#e8e8e4] bg-[#fbfbf9] p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-[13px] font-medium text-ink">
                Template preview — “{templatePreview.subject}”
              </span>
              <button
                onClick={() => setTemplatePreview(null)}
                className="text-[12.5px] font-medium text-clay hover:underline"
              >
                Close
              </button>
            </div>
            <iframe
              title="Template preview"
              sandbox=""
              srcDoc={templatePreview.html}
              className="h-[520px] w-full rounded-lg border border-[#e8e8e4] bg-white"
            />
          </div>
        )}
      </Card>

      {/* ---- Coupons ----------------------------------------------------- */}
      <Coupons token={token} />

      {/* ---- Sent-email log --------------------------------------------- */}
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

function FlowNode({
  title,
  subtitle,
  count,
  countLabel,
  tone,
  onPreview,
  previewOpen,
}: {
  title: string;
  subtitle: string;
  count: number;
  countLabel?: string;
  tone: string;
  onPreview?: () => void;
  previewOpen?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-4 rounded-xl px-4 py-3.5 text-cream"
      style={{ background: tone }}
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-semibold">{title}</div>
        <div className="truncate text-[11.5px] text-cream/70">{subtitle}</div>
      </div>
      {onPreview && (
        <button
          onClick={onPreview}
          className="shrink-0 rounded-md border border-cream/30 px-2.5 py-1 text-[11.5px] font-medium text-cream/90 transition-colors hover:bg-cream/10"
        >
          {previewOpen ? "Hide" : "Preview"}
        </button>
      )}
      <div className="shrink-0 text-right">
        <div className="text-[18px] font-semibold leading-none">{count}</div>
        {countLabel && (
          <div className="text-[10.5px] uppercase tracking-wide text-cream/60">
            {countLabel}
          </div>
        )}
      </div>
    </div>
  );
}

function FlowArrow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-1.5 pl-6 text-[11.5px] text-[#a3a39c]">
      <span>↓</span>
      <span>{label}</span>
    </div>
  );
}

function SideStat({
  label,
  value,
  tone,
  detail,
}: {
  label: string;
  value: number;
  tone: string;
  detail: string[];
}) {
  return (
    <div className="rounded-xl border border-[#eeeeea] p-4">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-medium text-ink">{label}</span>
        <span className="text-[18px] font-semibold" style={{ color: tone }}>
          {value}
        </span>
      </div>
      <ul className="mt-1.5 space-y-0.5 text-[11.5px] text-[#8a8a84]">
        {detail.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
    </div>
  );
}
