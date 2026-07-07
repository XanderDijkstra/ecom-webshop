"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { FreeShippingBar } from "./FreeShippingBar";
import { fmtKr } from "@/lib/format";

export function CartDrawer() {
  const cart = useCart();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={cart.close}
        aria-hidden
        className={`fixed inset-0 z-40 bg-black/35 transition-opacity duration-300 ${
          cart.isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      {/* Panel */}
      <aside
        aria-label="Handlekurv"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[420px] flex-col bg-cream shadow-2xl transition-transform duration-300 ${
          cart.isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="font-serif text-[24px] leading-none">Handlekurv</h2>
          <button
            onClick={cart.close}
            aria-label="Lukk"
            className="text-[22px] leading-none text-muted transition-colors hover:text-ink"
          >
            ×
          </button>
        </div>

        {cart.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-[15px] text-muted">Handlekurven er tom.</p>
            <button
              onClick={cart.close}
              className="text-[14px] font-semibold text-clay hover:underline"
            >
              Fortsett å handle
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto px-6 py-4">
              {cart.items.map((i) => (
                <div
                  key={`${i.slug}-${i.colorId}-${i.free ? "free" : "paid"}`}
                  className="flex gap-4 border-b border-line py-4 last:border-b-0"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-line bg-white">
                    {i.colorImage && (
                      <Image
                        src={i.colorImage}
                        alt={i.colorName}
                        fill
                        className="object-contain p-1"
                        sizes="64px"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2">
                      <div className="text-[14.5px] font-semibold">
                        {i.name}
                        {i.free && (
                          <span className="ml-1.5 rounded-full bg-clay/15 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.06em] text-clay">
                            Gratis
                          </span>
                        )}
                      </div>
                      <div className="text-[14.5px] font-semibold">
                        {i.free ? "Gratis" : fmtKr(i.priceNok * i.qty)}
                      </div>
                    </div>
                    <div className="mt-0.5 text-[13px] text-muted">
                      Farge: {i.colorName}
                    </div>
                    <div className="mt-2.5 flex items-center justify-between">
                      {i.free ? (
                        <span className="text-[12.5px] text-faint">
                          Følger med kjøpet
                        </span>
                      ) : (
                        <div className="flex items-center rounded-full border border-line">
                          <button
                            onClick={() =>
                              cart.setQty(i.slug, i.colorId, i.qty - 1)
                            }
                            aria-label="Færre"
                            className="px-3 py-1 text-muted hover:text-ink"
                          >
                            −
                          </button>
                          <span className="min-w-6 text-center text-[14px]">
                            {i.qty}
                          </span>
                          <button
                            onClick={() =>
                              cart.setQty(i.slug, i.colorId, i.qty + 1)
                            }
                            aria-label="Flere"
                            className="px-3 py-1 text-muted hover:text-ink"
                          >
                            +
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => cart.remove(i.slug, i.colorId, i.free)}
                        className="text-[12.5px] text-faint hover:text-ink"
                      >
                        Fjern
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-line px-6 py-5">
              <div className="mb-4">
                <FreeShippingBar subtotal={cart.subtotal} />
              </div>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[14px] text-muted">Subtotal</span>
                <span className="text-[18px] font-semibold">
                  {fmtKr(cart.subtotal)}
                </span>
              </div>
              <Link
                href="/kasse"
                onClick={cart.close}
                className="block w-full rounded-full bg-ink py-4 text-center text-[15px] font-semibold text-cream transition-colors hover:bg-clay"
              >
                Til kassen
              </Link>
              <Link
                href="/handlekurv"
                onClick={cart.close}
                className="mt-2.5 block w-full rounded-full border border-line py-[13px] text-center text-[14.5px] font-semibold text-ink transition-colors hover:border-ink"
              >
                Gå til handlekurv
              </Link>
              <p className="mt-3 text-center text-[12px] text-faint">
                Trygg og kryptert betaling
              </p>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
