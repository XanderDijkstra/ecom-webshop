"use client";

import Image from "next/image";
import { PRODUCTS } from "@/lib/products";
import { type AdminOrder, topVariants, fmtMoney } from "@/lib/admin-stats";
import { Card } from "../ui";

export function Products({ orders }: { orders: AdminOrder[] }) {
  const sold = topVariants(orders);
  const unitsFor = (slug: string, colorId: string) =>
    sold.find((v) => v.key === `${slug}::${colorId}`)?.units ?? 0;

  return (
    <div className="space-y-6">
      <p className="text-[13px] text-[#8a8a84]">
        The catalogue is coded in <code className="rounded bg-[#eee] px-1 py-0.5">src/lib/products.ts</code>.
        Price, patterns and copy are edited there. Sales figures below are from paid orders.
      </p>

      {PRODUCTS.map((p) => (
        <Card key={p.slug} className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-serif text-[24px] text-ink">{p.name}</h2>
              <p className="mt-1 max-w-[52ch] text-[13.5px] text-[#6b6b66]">{p.blurb}</p>
            </div>
            <div className="text-right">
              <div className="text-[22px] font-semibold text-ink">{fmtMoney(p.priceNok)}</div>
              {p.compareAtNok && (
                <div className="text-[13px] text-[#a3a39c] line-through">
                  {fmtMoney(p.compareAtNok)}
                </div>
              )}
              <div className="mt-1 text-[12.5px] text-[#8a8a84]">
                ★ {p.ratingValue} · {p.ratingCount}
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {p.colors.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-lg border border-[#eeeeea] p-2.5"
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-[#eeeeea] bg-linen">
                  <Image src={c.image} alt={c.name} fill className="object-contain p-1" sizes="48px" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-medium text-ink">{c.name}</div>
                  <div className="text-[12px] text-[#8a8a84]">
                    {unitsFor(p.slug, c.id)} solgt
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
