"use client";

export interface Range {
  from: string; // yyyy-mm-dd (local)
  to: string; // yyyy-mm-dd (local)
}

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

/** Inclusive "last N days" range ending today. */
export function rangeForDays(days: number): Range {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  return { from: iso(from), to: iso(to) };
}

export function defaultRange(): Range {
  return rangeForDays(30);
}

const PRESETS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "1y", days: 365 },
];

export function DateRangePicker({
  value,
  onChange,
}: {
  value: Range;
  onChange: (r: Range) => void;
}) {
  const today = iso(new Date());
  const all: Range = { from: "2000-01-01", to: today };
  const isAll = value.from === all.from && value.to === all.to;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-lg border border-[#e8e8e4] bg-white p-1">
        {PRESETS.map((p) => {
          const r = rangeForDays(p.days);
          const active = r.from === value.from && r.to === value.to;
          return (
            <button
              key={p.label}
              onClick={() => onChange(r)}
              className={`rounded-md px-2.5 py-1.5 text-[12.5px] font-medium transition-colors ${
                active ? "bg-ink text-cream" : "text-[#6b6b66] hover:text-ink"
              }`}
            >
              {p.label}
            </button>
          );
        })}
        <button
          onClick={() => onChange(all)}
          className={`rounded-md px-2.5 py-1.5 text-[12.5px] font-medium transition-colors ${
            isAll ? "bg-ink text-cream" : "text-[#6b6b66] hover:text-ink"
          }`}
        >
          All
        </button>
      </div>
      <div className="flex items-center gap-1.5 text-[12.5px] text-[#8a8a84]">
        <input
          type="date"
          value={value.from}
          max={value.to}
          onChange={(e) => onChange({ ...value, from: e.target.value })}
          className="rounded-md border border-[#e8e8e4] bg-white px-2 py-1.5 outline-none focus:border-ink"
        />
        <span>–</span>
        <input
          type="date"
          value={value.to}
          min={value.from}
          max={today}
          onChange={(e) => onChange({ ...value, to: e.target.value })}
          className="rounded-md border border-[#e8e8e4] bg-white px-2 py-1.5 outline-none focus:border-ink"
        />
      </div>
    </div>
  );
}
