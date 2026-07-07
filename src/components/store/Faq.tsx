"use client";

import { useState } from "react";
import type { FaqItem } from "./faq-data";

/**
 * Accordion FAQ used on both the homepage (category questions) and the product
 * page (buyer questions). The page builds matching FAQPage JSON-LD from the
 * same `items` array so the structured data always mirrors what's on screen.
 */
export function Faq({
  items,
  eyebrow = "Spørsmål og svar",
  heading = "Ofte stilte spørsmål",
}: {
  items: FaqItem[];
  eyebrow?: string;
  heading?: string;
}) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="border-t border-line bg-sand">
      <div className="mx-auto max-w-[760px] px-7 py-[80px]">
        <div className="mb-3 text-center text-[12px] uppercase tracking-[0.16em] text-clay">
          {eyebrow}
        </div>
        <h2 className="mb-[40px] text-center font-serif text-[clamp(28px,3.8vw,40px)] font-normal leading-[1.1]">
          {heading}
        </h2>
        <div>
          {items.map((it, i) => {
            const isOpen = open === i;
            return (
              <div key={it.q} className="border-t border-line last:border-b">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 py-[20px] text-left"
                >
                  <span className="text-[16px] font-semibold text-ink">
                    {it.q}
                  </span>
                  <span
                    className="shrink-0 text-[22px] leading-none text-clay transition-transform duration-200"
                    style={{ transform: isOpen ? "rotate(45deg)" : "none" }}
                  >
                    +
                  </span>
                </button>
                {isOpen && (
                  <p className="m-0 pb-6 text-[15.5px] leading-[1.7] text-muted-2">
                    {it.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
