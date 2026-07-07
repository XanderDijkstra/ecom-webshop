"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";

export function Header() {
  const cart = useCart();
  return (
    <>
      <div className="bg-ink px-4 py-[11px] text-center text-[12.5px] font-medium uppercase tracking-[0.14em] text-cream-text">
        Fri frakt over 500 kr · 90 dagers åpent kjøp
      </div>

      <header className="mx-auto flex max-w-[1200px] items-center justify-between gap-6 px-7 py-[22px]">
        <nav className="flex flex-1 items-center gap-[26px] text-[14px] text-muted">
          <Link href="/baereslyngen" className="hover:text-ink">Bæreslyngen</Link>
          <Link href="/#guide" className="hidden hover:text-ink sm:inline">Bæreguide</Link>
          <Link href="/#faq" className="hidden hover:text-ink sm:inline">Spørsmål og svar</Link>
        </nav>

        <Link
          href="/"
          className="shrink-0 font-serif text-[30px] leading-none tracking-[0.04em] text-ink"
        >
          BÆRA
        </Link>

        <div className="flex flex-1 items-center justify-end gap-[18px] text-[14px] text-muted">
          <Link href="/#faq" className="hidden hover:text-ink sm:inline">Hjelp</Link>
          <button
            onClick={cart.open}
            className="relative flex items-center gap-[7px] text-ink"
          >
            Handlekurv
            {cart.count > 0 && (
              <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-clay px-[5px] text-[11px] font-semibold text-white">
                {cart.count}
              </span>
            )}
          </button>
        </div>
      </header>
    </>
  );
}
