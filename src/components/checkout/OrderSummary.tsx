"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { fmtKr } from "@/lib/format";
import { bumpUnitPriceNok } from "@/lib/offers";
import { BumpBox } from "./BumpBox";

/** Read-only order summary shown alongside the checkout form (Shopify-style). */
export function OrderSummary({
  bumpOn,
  bumpColorId,
  onBumpToggle,
  onBumpColorChange,
}: {
  bumpOn: boolean;
  bumpColorId: string;
  onBumpToggle: (on: boolean) => void;
  onBumpColorChange: (colorId: string) => void;
}) {
  const cart = useCart();
  const bumpPrice = bumpOn ? bumpUnitPriceNok() : 0;
  const total = cart.subtotal + bumpPrice;

  return (
    <div className="rounded-2xl border border-line bg-white p-6">
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="font-serif text-[22px] font-normal">Din bestilling</h2>
        <Link
          href="/handlekurv"
          className="text-[12.5px] font-medium text-clay hover:underline"
        >
          Rediger
        </Link>
      </div>

      <div className="space-y-4">
        {cart.items.map((i) => (
          <div
            key={`${i.slug}-${i.colorId}-${i.free ? "free" : "paid"}`}
            className="flex gap-4"
          >
            {/* relative wrapper does NOT clip, so the qty pill stays visible */}
            <div className="relative shrink-0">
              <div className="h-[72px] w-[72px] overflow-hidden rounded-xl border border-line bg-linen">
                {i.colorImage && (
                  <Image
                    src={i.colorImage}
                    alt={i.colorName}
                    width={72}
                    height={72}
                    className="h-full w-full object-contain p-1.5"
                    sizes="72px"
                  />
                )}
              </div>
              <span className="absolute -right-2.5 -top-2.5 flex h-[26px] min-w-[26px] items-center justify-center rounded-full bg-ink px-1.5 text-[12.5px] font-semibold text-cream ring-2 ring-white">
                {i.qty}
              </span>
            </div>
            <div className="flex min-w-0 flex-1 items-start justify-between gap-2 pt-1">
              <div className="min-w-0">
                <div className="text-[14.5px] font-semibold leading-snug">
                  {i.name}
                  {i.free && (
                    <span className="ml-1.5 rounded-full bg-clay/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-clay">
                      Gratis
                    </span>
                  )}
                </div>
                <div className="mt-1 text-[13px] text-muted">{i.colorName}</div>
              </div>
              <div className="shrink-0 text-[14.5px] font-semibold">
                {i.free ? "Gratis" : fmtKr(i.priceNok * i.qty)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <BumpBox
          on={bumpOn}
          colorId={bumpColorId}
          onToggle={onBumpToggle}
          onColorChange={onBumpColorChange}
        />
      </div>

      <div className="mt-6 space-y-2.5 border-t border-line pt-5 text-[14px]">
        <div className="flex items-center justify-between text-muted">
          <span>Delsum</span>
          <span className="font-medium text-ink">{fmtKr(cart.subtotal)}</span>
        </div>
        {bumpOn && (
          <div className="flex items-center justify-between text-muted">
            <span>Ekstra Bæreslyng (−30 %)</span>
            <span className="font-medium text-ink">{fmtKr(bumpPrice)}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-muted">
          <span>Frakt</span>
          <span className="font-medium text-ink">Gratis</span>
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
        <span className="text-[15px] font-semibold">Totalt</span>
        <span className="font-serif text-[24px]">{fmtKr(total)}</span>
      </div>

      <p className="mt-4 text-center text-[12px] leading-relaxed text-faint">
        Fri frakt · 90 dagers åpent kjøp · Trygg, kryptert betaling
      </p>
    </div>
  );
}
