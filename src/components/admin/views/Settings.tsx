"use client";

import { useCallback, useEffect, useState } from "react";
import { COMPANY, companyAddressLine, companyOrgNr } from "@/lib/company";
import { Card } from "../ui";

type TrackingKey = "meta_pixel_id" | "google_tag_id" | "clarity_id";

const TRACKING_FIELDS: {
  key: TrackingKey;
  label: string;
  placeholder: string;
  hint: string;
}[] = [
  {
    key: "meta_pixel_id",
    label: "Meta Pixel ID",
    placeholder: "1234567890123456",
    hint: "Events Manager → your pixel → Settings. Loads the browser pixel (PageView, ViewContent, AddToCart, InitiateCheckout, Purchase) for every visitor.",
  },
  {
    key: "google_tag_id",
    label: "Google tag ID",
    placeholder: "G-XXXXXXXXXX or AW-XXXXXXXXX",
    hint: "GA4 measurement ID, Google Ads tag or Google tag ID. Loads gtag.js with page views on every route change.",
  },
  {
    key: "clarity_id",
    label: "Microsoft Clarity ID",
    placeholder: "abcde12345",
    hint: "clarity.microsoft.com → Settings → Overview (the 10-char id in the snippet). Heatmaps + session recordings.",
  },
];

interface SettingState {
  value: string;
  envOverride: boolean;
}

export function Settings({
  email,
  token,
  onSignOut,
}: {
  email: string;
  token: string;
  onSignOut: () => void;
}) {
  const [settings, setSettings] = useState<Record<
    TrackingKey,
    SettingState
  > | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings", {
        headers: { authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't load settings.");
      setSettings(data.settings);
      setDraft(
        Object.fromEntries(
          Object.entries(data.settings as Record<string, SettingState>).map(
            ([k, v]) => [k, v.value],
          ),
        ),
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't save.");
      setSettings(data.settings);
      setMessage("Saved — live within a few minutes (config is edge-cached).");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="mb-1 text-[15px] font-semibold text-ink">Tracking</h2>
          <p className="mb-4 text-[12.5px] text-[#8a8a84]">
            Paste the IDs and save — no code or redeploy needed. Leave a field
            empty to disable that script.
          </p>
          {error && (
            <p className="mb-3 text-[13px] text-[#9a2820]">{error}</p>
          )}
          {!settings && !error ? (
            <p className="text-[13.5px] text-[#8a8a84]">Loading …</p>
          ) : settings ? (
            <div className="space-y-4">
              {TRACKING_FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="mb-1 block text-[13px] font-medium text-ink">
                    {f.label}
                    {settings[f.key]?.envOverride && (
                      <span className="ml-2 rounded bg-[#f3ead9] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#8a6a2f]">
                        set by env var — field disabled
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={draft[f.key] ?? ""}
                    placeholder={f.placeholder}
                    disabled={settings[f.key]?.envOverride}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, [f.key]: e.target.value }))
                    }
                    className="w-full rounded-lg border border-[#e2e2dd] px-3 py-2 text-[13.5px] text-ink outline-none transition-colors focus:border-ink disabled:bg-[#f3f3ef] disabled:text-[#8a8a84]"
                  />
                  <p className="mt-1 text-[11.5px] text-[#a3a39c]">{f.hint}</p>
                </div>
              ))}
              <div className="flex items-center gap-3">
                <button
                  onClick={save}
                  disabled={saving}
                  className="rounded-lg bg-ink px-4 py-2 text-[13.5px] font-semibold text-cream transition-colors hover:bg-clay disabled:opacity-50"
                >
                  {saving ? "Saving …" : "Save tracking settings"}
                </button>
                {message && (
                  <span className="text-[12.5px] text-[#1f7a4d]">{message}</span>
                )}
              </div>
            </div>
          ) : null}
        </Card>

        <Card className="p-6">
          <h2 className="mb-3 text-[15px] font-semibold text-ink">Account</h2>
          <p className="text-[14px] text-[#6b6b66]">
            Signed in as <span className="font-medium text-ink">{email}</span>
          </p>
          <button
            onClick={onSignOut}
            className="mt-4 rounded-lg border border-[#e2e2dd] px-4 py-2 text-[13.5px] font-medium text-ink transition-colors hover:border-ink"
          >
            Sign out
          </button>
        </Card>
      </div>

      <Card className="h-fit p-6">
        <h2 className="mb-4 text-[15px] font-semibold text-ink">Store</h2>
        <dl className="space-y-3 text-[14px]">
          <Item label="Company" value={COMPANY.legalName} />
          <Item label="Org. no." value={companyOrgNr()} />
          <Item label="Address" value={companyAddressLine()} />
          <Item label="Email" value={COMPANY.email} />
          <Item label="Phone" value={COMPANY.phone} />
          <Item label="Website" value={COMPANY.url} />
        </dl>
        <p className="mt-4 text-[12px] text-[#a3a39c]">
          Edited in <code className="rounded bg-[#eee] px-1 py-0.5">src/lib/company.ts</code>.
        </p>
      </Card>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-[#8a8a84]">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}
