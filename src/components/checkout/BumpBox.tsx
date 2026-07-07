"use client";

import Image from "next/image";
import { getProduct } from "@/lib/products";
import { ORDER_BUMP, bumpUnitPriceNok, bumpCompareAtNok } from "@/lib/offers";
import { fmtKr } from "@/lib/format";

/**
 * Pre-purchase order-bump box. Ticking it adds one discounted extra unit to the
 * same single payment (card and Vipps both). Classic dashed, highlighted style
 * so it stands out from the summary without looking like a scam.
 */
export function BumpBox({
  on,
  colorId,
  onToggle,
  onColorChange,
}: {
  on: boolean;
  colorId: string;
  onToggle: (on: boolean) => void;
  onColorChange: (colorId: string) => void;
}) {
  const product = getProduct(ORDER_BUMP.slug);
  if (!product) return null;
  const color =
    product.colors.find((c) => c.id === colorId) ?? product.colors[0];

  return (
    <div
      className={`rounded-xl border-2 border-dashed p-3.5 transition-colors ${
        on ? "border-clay bg-clay/[0.06]" : "border-line bg-linen/40"
      }`}
    >
      <label className="flex cursor-pointer gap-3">
        <input
          type="checkbox"
          checked={on}
          onChange={(e) => onToggle(e.target.checked)}
          className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-clay"
        />
        <div className="h-[52px] w-[52px] shrink-0 overflow-hidden rounded-lg border border-line bg-white">
          {color?.image && (
            <Image
              src={color.image}
              alt={color.name}
              width={52}
              height={52}
              className="h-full w-full object-contain p-1"
              sizes="52px"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[13.5px] font-semibold leading-tight text-ink">
              {ORDER_BUMP.title}
            </span>
            <span className="rounded-full bg-clay px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] text-cream">
              −{ORDER_BUMP.discountPct}%
            </span>
          </div>
          <p className="mt-0.5 text-[12px] leading-snug text-muted">
            {ORDER_BUMP.blurb}
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[14px] font-semibold text-ink">
              {fmtKr(bumpUnitPriceNok())}
            </span>
            <span className="text-[12.5px] text-faint line-through">
              {fmtKr(bumpCompareAtNok())}
            </span>
          </div>
        </div>
      </label>

      {on && (
        <div className="mt-3 flex items-center gap-2 pl-[30px]">
          <span className="text-[12px] text-muted">Farge:</span>
          <select
            value={color?.id}
            onChange={(e) => onColorChange(e.target.value)}
            className="h-[32px] flex-1 rounded-lg border border-line bg-white px-2.5 text-[13px] text-ink outline-none focus:border-ink"
          >
            {product.colors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
