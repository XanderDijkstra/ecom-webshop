"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { useTheme } from "@/components/store/ThemeProvider";
import { ProductInfo } from "@/components/store/ProductInfo";
import { fmtKr } from "@/lib/format";
import type { Product, ProductColor } from "@/lib/products";

const HIGHLIGHTS = [
  "Frie hender, barnet sitter trygt og tett inntil deg",
  "Ergonomisk M-posisjon som støtter hoftene",
  "Polstret skulderstøtte fordeler vekten jevnt",
  "100 % pustende bomull, fra nyfødt til 25 kg",
  "Bretter seg sammen og får plass i veska",
  "Sikkerhetstestet etter EN 13209",
];

// Placeholder customer portraits for the social-proof card (swap for real ones).
const AVATARS = [
  "/images/avatars/p1.jpg",
  "/images/avatars/p2.jpg",
  "/images/avatars/p3.jpg",
  "/images/avatars/p4.jpg",
  "/images/avatars/p5.jpg",
];

/**
 * A pattern swatch: a zoomed-in crop of the product photo so you see the
 * fabric motif (not the whole sling), mirroring the reference store.
 */
function PatternSwatch({
  color,
  active,
  onClick,
}: {
  color: ProductColor;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={color.name}
      aria-label={color.name}
      className="aspect-square w-[58px] shrink-0 rounded-full border-2 bg-no-repeat transition-all"
      style={{
        borderColor: active ? color.hex : "#E1D8C8",
        boxShadow: active
          ? `0 0 0 2px var(--color-cream), 0 0 0 3.5px ${color.hex}`
          : "none",
        opacity: active ? 1 : 0.8,
        // Zoomed crop of the fabric (lower-left outer band) so the swatch shows
        // the pattern/motif, not the whole sling. Background crop is precise
        // regardless of aspect ratio (object-cover can't crop a square-in-square).
        backgroundImage: `url(${color.image})`,
        backgroundSize: "300%",
        backgroundPosition: "26% 82%",
      }}
    />
  );
}

export function ProductHero({ product }: { product: Product }) {
  const cart = useCart();
  const { color: selected, setColor } = useTheme();
  const [qty, setQty] = useState(1);
  const [offer, setOffer] = useState<"single" | "bogo">("single");
  const [freeColorId, setFreeColorId] = useState(product.colors[0].id);
  // Gallery: `null` shows the selected variant photo; a number shows that
  // shared explainer/lifestyle shot. Picking a variant snaps back to null.
  const [activeExtra, setActiveExtra] = useState<number | null>(null);

  // Horizontal thumbnail bar: track how far it's scrolled so we can dim the
  // chevron on whichever end has run out of room (same behaviour PC + mobile).
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  function updateEdges() {
    const el = scrollerRef.current;
    if (!el) return;
    setEdges({
      left: el.scrollLeft > 4,
      right: el.scrollLeft < el.scrollWidth - el.clientWidth - 4,
    });
  }

  function scrollThumbs(dir: 1 | -1) {
    const el = scrollerRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  }

  const gallery = product.gallery ?? [];
  const viewingExtra = activeExtra !== null && gallery[activeExtra] != null;
  const mainSrc = viewingExtra ? gallery[activeExtra].src : selected.image;
  const mainAlt = viewingExtra
    ? gallery[activeExtra].alt
    : `${product.name} ergonomisk bæresele i pustende bomull, mønster ${selected.name}, fra nyfødt til 25 kg`;

  const thumbs: {
    src: string;
    extra: number | null;
    fit: string;
    alt: string;
  }[] = [
    {
      src: selected.image,
      extra: null,
      fit: "object-contain bg-white p-1",
      alt: `${product.name}, mønster ${selected.name}`,
    },
    ...gallery.map((g, i) => ({
      src: g.src,
      extra: i as number | null,
      fit: "object-cover",
      alt: g.alt,
    })),
  ];

  // Recompute chevron state on mount, when the thumb set changes, and on resize.
  useEffect(() => {
    updateEdges();
    window.addEventListener("resize", updateEdges);
    return () => window.removeEventListener("resize", updateEdges);
  }, [thumbs.length]);

  function pickColor(c: ProductColor) {
    setColor(c);
    setActiveExtra(null); // snap the main image back to the variant photo
  }

  const freeColor =
    product.colors.find((c) => c.id === freeColorId) ?? product.colors[0];
  const save =
    product.compareAtNok && product.compareAtNok > product.priceNok
      ? product.compareAtNok - product.priceNok
      : 0;
  const total = offer === "bogo" ? product.priceNok : product.priceNok * qty;

  function add() {
    cart.add(
      {
        slug: product.slug,
        colorId: selected.id,
        colorName: selected.name,
        colorImage: selected.image,
        name: product.name,
        priceNok: product.priceNok,
      },
      offer === "bogo" ? 1 : qty,
    );

    if (offer === "bogo") {
      cart.add(
        {
          slug: product.slug,
          colorId: freeColor.id,
          colorName: freeColor.name,
          colorImage: freeColor.image,
          name: product.name,
          priceNok: 0,
          free: true,
        },
        1,
      );
    }
  }

  return (
    <section
      id="produkt"
      className="mx-auto max-w-[1200px] px-7 pb-[70px] pt-[18px]"
    >
      <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-[54px]">
        {/* LEFT: sticky gallery */}
        <div className="w-full lg:sticky lg:top-6 lg:w-[52%] lg:self-start">
          <div
            className="relative aspect-[4/5] overflow-hidden rounded-md border-2 transition-colors duration-300"
            style={{
              borderColor: viewingExtra ? "#E1D8C8" : selected.hex,
              background: viewingExtra ? "var(--color-cream)" : "#fff",
            }}
          >
            <Image
              key={mainSrc}
              src={mainSrc}
              alt={mainAlt}
              fill
              className={`transition-opacity duration-200 ${
                viewingExtra ? "object-contain" : "object-contain p-6"
              }`}
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </div>

          {/* Thumbnails: one slidable row (identical on desktop + mobile),
              variant photo first, then shared explainer/lifestyle shots. */}
          <div className="mt-3 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scrollThumbs(-1)}
              aria-label="Forrige bilder"
              disabled={!edges.left}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-white/70 text-muted transition-opacity hover:text-ink disabled:pointer-events-none disabled:opacity-25"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
                <path
                  d="M15 6l-6 6 6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <div
              ref={scrollerRef}
              onScroll={updateEdges}
              className="flex flex-1 gap-2 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {thumbs.map((t) => {
                const isActive = activeExtra === t.extra;
                return (
                  <button
                    key={`${t.extra}-${t.src}`}
                    onClick={() => setActiveExtra(t.extra)}
                    aria-label={t.alt}
                    aria-pressed={isActive}
                    className="relative aspect-square w-[54px] shrink-0 overflow-hidden rounded-md border-2 transition-all"
                    style={{ borderColor: isActive ? "#2A2622" : "#E1D8C8" }}
                  >
                    <Image
                      src={t.src}
                      alt=""
                      fill
                      className={t.fit}
                      sizes="54px"
                    />
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => scrollThumbs(1)}
              aria-label="Flere bilder"
              disabled={!edges.right}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-white/70 text-muted transition-opacity hover:text-ink disabled:pointer-events-none disabled:opacity-25"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
                <path
                  d="M9 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* RIGHT: scrolling buy column */}
        <div className="w-full lg:w-[48%]">
          {/* Social-proof card: customer photos + rating */}
          <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-line bg-white/60 px-2.5 py-1.5">
            <div className="flex -space-x-2">
              {AVATARS.map((src) => (
                <span
                  key={src}
                  className="relative h-6 w-6 overflow-hidden rounded-full border border-white"
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="24px"
                  />
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1.5 pr-1 text-[12px]">
              <span className="tracking-[0.05em] text-clay">★★★★★</span>
              <span className="font-semibold text-ink">
                {product.ratingValue}
              </span>
              <span className="text-faint">· 100 000+ fornøyde</span>
            </div>
          </div>

          {/* Urgency / sale ribbon */}
          {save > 0 && (
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-clay/12 px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-clay">
              🔥 Sommersalg, avsluttes snart
            </div>
          )}

          <h1 className="mb-3.5 font-serif text-[clamp(34px,4.5vw,52px)] font-normal leading-[1.02] tracking-[-0.01em]">
            {product.name}
            <span className="mt-2 block font-sans text-[15px] font-medium uppercase tracking-[0.14em] text-clay">
              Ergonomisk bæresele for nyfødt · 0–25 kg
            </span>
          </h1>
          <p className="mb-[22px] max-w-[46ch] text-[16px] leading-[1.55] text-muted-2">
            {product.tagline}
          </p>

          <div className="mb-[22px] flex items-baseline gap-3">
            <span className="text-[28px] font-semibold">
              {fmtKr(product.priceNok)}
            </span>
            {product.compareAtNok && (
              <span className="text-[17px] text-faint line-through">
                {fmtKr(product.compareAtNok)}
              </span>
            )}
            {save > 0 && (
              <span className="rounded-full border border-clay-soft px-[9px] py-1 text-[12px] uppercase tracking-[0.08em] text-clay">
                Spar {fmtKr(save)}
              </span>
            )}
          </div>

          {/* Offer selector: Buy 1 vs Buy 1 Get 1 Free */}
          <div className="mb-[26px] flex flex-col gap-2.5">
            <button
              onClick={() => setOffer("single")}
              className="flex items-center gap-3 rounded-xl border-2 bg-white/40 px-4 py-3 text-left transition-colors"
              style={{ borderColor: offer === "single" ? "#2A2622" : "#E1D8C8" }}
            >
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
                style={{
                  borderColor: offer === "single" ? "#2A2622" : "#C9C0B2",
                }}
              >
                {offer === "single" && (
                  <span className="h-2.5 w-2.5 rounded-full bg-ink" />
                )}
              </span>
              <span className="flex-1">
                <span className="block text-[15px] font-semibold text-ink">
                  Kjøp 1
                </span>
                <span className="block text-[12.5px] text-faint">
                  Én slynge i valgt mønster
                </span>
              </span>
              <span className="text-[15px] font-semibold text-ink">
                {fmtKr(product.priceNok)}
              </span>
            </button>

            <button
              onClick={() => setOffer("bogo")}
              className="relative flex items-center gap-3 rounded-xl border-2 bg-white/40 px-4 py-3 text-left transition-colors"
              style={{ borderColor: offer === "bogo" ? "#2A2622" : "#E1D8C8" }}
            >
              <span className="absolute -top-2.5 right-3 rounded-full bg-clay px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-white">
                Mest populær
              </span>
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
                style={{
                  borderColor: offer === "bogo" ? "#2A2622" : "#C9C0B2",
                }}
              >
                {offer === "bogo" && (
                  <span className="h-2.5 w-2.5 rounded-full bg-ink" />
                )}
              </span>
              <span className="flex-1">
                <span className="block text-[15px] font-semibold text-ink">
                  Kjøp 1, få 1 gratis
                </span>
                <span className="block text-[12.5px] text-faint">
                  Velg begge mønstrene under
                </span>
              </span>
              <span className="text-right">
                <span className="block text-[15px] font-semibold text-clay">
                  {fmtKr(product.priceNok)}
                </span>
                <span className="block text-[12.5px] text-faint line-through">
                  {fmtKr(product.priceNok * 2)}
                </span>
              </span>
            </button>
          </div>

          {/* Variant picker: your sling */}
          <div className="mb-2.5 text-[13.5px] text-muted">
            {offer === "bogo" ? "Din slynge:" : "Mønster:"}{" "}
            <span className="font-medium text-ink">{selected.name}</span>
          </div>
          <div className="mb-[26px] flex flex-wrap gap-3">
            {product.colors.map((c) => (
              <PatternSwatch
                key={c.id}
                color={c}
                active={c.id === selected.id}
                onClick={() => pickColor(c)}
              />
            ))}
          </div>

          {/* Second visual picker: the FREE sling (BOGO only) */}
          {offer === "bogo" && (
            <>
              <div className="mb-2.5 flex items-center gap-2 text-[13.5px] text-muted">
                Din gratis slynge:{" "}
                <span className="font-medium text-ink">{freeColor.name}</span>
                <span className="rounded-full bg-clay/15 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.06em] text-clay">
                  Gratis
                </span>
              </div>
              <div className="mb-[26px] flex flex-wrap gap-3">
                {product.colors.map((c) => (
                  <PatternSwatch
                    key={c.id}
                    color={c}
                    active={c.id === freeColorId}
                    onClick={() => setFreeColorId(c.id)}
                  />
                ))}
              </div>
            </>
          )}

          {/* Quantity + add to cart */}
          <div className="mb-3 flex items-stretch gap-3">
            {offer === "single" && (
              <div className="flex items-center rounded-full border border-line">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Færre"
                  className="px-4 text-[18px] text-muted hover:text-ink"
                >
                  −
                </button>
                <span className="min-w-7 text-center text-[15px] font-medium">
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => Math.min(99, q + 1))}
                  aria-label="Flere"
                  className="px-4 text-[18px] text-muted hover:text-ink"
                >
                  +
                </button>
              </div>
            )}
            <button
              onClick={add}
              className="flex-1 rounded-full bg-ink py-[17px] text-[16px] font-semibold tracking-[0.01em] text-cream transition-colors hover:bg-clay"
            >
              Legg i handlekurv · {fmtKr(total)}
            </button>
          </div>

          {/* Fast shipping to Norway callout */}
          <div className="mb-[26px] flex items-center gap-3 rounded-xl border border-line bg-white/40 px-4 py-3">
            <svg
              viewBox="0 0 22 16"
              className="h-4 w-[22px] shrink-0 rounded-[2px]"
              aria-hidden
            >
              <rect width="22" height="16" fill="#BA0C2F" />
              <rect x="6" width="4" height="16" fill="#fff" />
              <rect y="6" width="22" height="4" fill="#fff" />
              <rect x="7" width="2" height="16" fill="#00205B" />
              <rect y="7" width="22" height="2" fill="#00205B" />
            </svg>
            <div className="leading-tight">
              <div className="text-[14px] font-semibold text-ink">
                Rask frakt til Norge
              </div>
              <div className="text-[12.5px] text-faint">
                Sporet levering på 7–10 dager · sendes innen 24 timer
              </div>
            </div>
          </div>

          {/* USPs with checkmarks */}
          <ul className="mt-1 flex list-none flex-col gap-3 border-t border-line p-0 pt-[26px]">
            {HIGHLIGHTS.map((t) => (
              <li
                key={t}
                className="flex items-start gap-[11px] text-[15px] text-ink-soft"
              >
                <span className="mt-[2px] text-clay">✓</span> {t}
              </li>
            ))}
          </ul>

          {/* Collapsible product information */}
          <ProductInfo />
        </div>
      </div>
    </section>
  );
}
