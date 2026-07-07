"use client";

import { useCart } from "@/components/cart/CartProvider";
import { fmtKr } from "@/lib/format";
import type { Product } from "@/lib/products";

/** Adds the product (first colourway) to the cart (for secondary CTAs). */
export function BuyButton({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const cart = useCart();
  const c = product.colors[0];
  return (
    <button
      onClick={() =>
        cart.add({
          slug: product.slug,
          colorId: c.id,
          colorName: c.name,
          colorImage: c.image,
          name: product.name,
          priceNok: product.priceNok,
        })
      }
      className={
        className ??
        "rounded-full bg-ink px-11 py-[18px] text-[16px] font-semibold text-cream transition-colors hover:bg-clay"
      }
    >
      Legg i handlekurv · {fmtKr(product.priceNok)}
    </button>
  );
}
