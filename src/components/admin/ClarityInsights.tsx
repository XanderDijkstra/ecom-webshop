"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, Empty } from "./ui";

// Shape returned by /api/admin/clarity (see the route for how it's built).
interface ClaritySummary {
  traffic: {
    sessions: number | null;
    botSessions: number | null;
    distinctUsers: number | null;
    pagesPerSession: number | null;
  };
  scrollDepth: number | null;
  activeTimePct: number | null;
  signals: { key: string; label: string; sessions: number | null }[];
}

interface ClarityResponse {
  configured: boolean;
  days?: number;
  cached?: boolean;
  fetchedAt?: string;
  summary?: ClaritySummary;
}

const fmtNum = (n: number | null) =>
  n === null ? "—" : Math.round(n).toLocaleString("en-GB");
const fmtPct = (n: number | null) =>
  n === null
    ? "—"
    : `${n.toLocaleString("en-GB", { maximumFractionDigits: 1 })}%`;
const fmtRatio = (n: number | null) =>
  n === null ? "—" : n.toLocaleString("en-GB", { maximumFractionDigits: 1 });

const DAY_OPTIONS = [1, 2, 3] as const;

/**
 * Microsoft Clarity metrics (heatmaps/session-recordings product). Clarity's
 * Data Export API only serves the last 1–3 days, so this panel has its own
 * day toggle and is independent of the admin's global date range.
 */
export function ClarityInsights({ token }: { token: string }) {
  const [days, setDays] = useState<number>(3);
  const [data, setData] = useState<ClarityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/clarity?days=${days}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Couldn't load Clarity data.");
      setData(json);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [days, token]);

  useEffect(() => {
    load();
  }, [load]);

  const s = data?.summary;

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-[15px] font-semibold text-ink">
            Microsoft Clarity
          </h2>
          <span className="text-[12px] text-[#a3a39c]">heatmaps & recordings</span>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-[#e2e2dd] p-0.5">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-md px-2.5 py-1 text-[12.5px] font-medium transition-colors ${
                days === d ? "bg-ink text-cream" : "text-[#6b6b66] hover:text-ink"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-[14px] text-[#8a8a84]">Loading …</div>
      ) : error ? (
        <Empty>{error}</Empty>
      ) : data && !data.configured ? (
        <Empty>
          Clarity metrics are not connected yet. Add a{" "}
          <code className="rounded bg-[#eee] px-1">CLARITY_API_TOKEN</code> (from
          clarity.microsoft.com → Settings → Data export) and redeploy.
        </Empty>
      ) : s ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Metric label="Sessions" value={fmtNum(s.traffic.sessions)} />
            <Metric label="Distinct users" value={fmtNum(s.traffic.distinctUsers)} />
            <Metric label="Pages / session" value={fmtRatio(s.traffic.pagesPerSession)} />
            <Metric label="Avg. scroll" value={fmtPct(s.scrollDepth)} />
            <Metric label="Active time" value={fmtPct(s.activeTimePct)} />
            <Metric label="Bot sessions" value={fmtNum(s.traffic.botSessions)} muted />
          </div>

          <div className="mt-5">
            <h3 className="mb-2 text-[12px] font-medium uppercase tracking-[0.06em] text-[#8a8a84]">
              Frustration signals — sessions affected
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
              {s.signals.map((sig) => (
                <div
                  key={sig.key}
                  className="flex items-center justify-between border-b border-[#f0f0ec] py-1.5 text-[13.5px]"
                >
                  <span className="text-[#5a5a55]">{sig.label}</span>
                  <span className="font-semibold text-ink">
                    {fmtNum(sig.sessions)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-4 text-[11.5px] text-[#a3a39c]">
            Last {data?.days ?? days} day(s)
            {data?.cached ? " · cached" : ""}
            {data?.fetchedAt
              ? ` · updated ${new Date(data.fetchedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`
              : ""}
            {" · "}
            <a
              href="https://clarity.microsoft.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-clay hover:underline"
            >
              Open Clarity
            </a>
          </p>
        </>
      ) : (
        <Empty>No Clarity data for this period yet.</Empty>
      )}
    </Card>
  );
}

function Metric({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="rounded-lg bg-[#f6f6f3] px-3 py-2.5">
      <div className="text-[11px] font-medium uppercase tracking-[0.05em] text-[#8a8a84]">
        {label}
      </div>
      <div
        className={`mt-1 text-[19px] font-semibold leading-none ${
          muted ? "text-[#a3a39c]" : "text-ink"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
