"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { SLING, type ProductColor } from "@/lib/products";

interface ThemeCtx {
  color: ProductColor;
  setColor: (c: ProductColor) => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

/** color-mix helper: tint `base` with `pct`% of the variant `hex`. */
const mix = (hex: string, base: string, pct: number) =>
  `color-mix(in srgb, ${hex} ${pct}%, ${base})`;

/**
 * Holds the currently-selected variant and retints the whole product page to
 * match it. The design is built on Tailwind colour tokens (--color-cream,
 * --color-sand, --color-clay …); overriding those custom properties on this
 * wrapper cascades the new palette to every descendant: backgrounds, accents,
 * buttons and badges shift together.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [color, setColor] = useState<ProductColor>(SLING.colors[0]);
  const value = useMemo(() => ({ color, setColor }), [color]);

  const hex = color.hex;
  const style = {
    "--color-cream": mix(hex, "#F4EFE6", 24), // page background
    "--color-sand": mix(hex, "#EDE3D2", 38), // alternating bands
    "--color-linen": mix(hex, "#FBF8F1", 16), // cards
    "--color-line": mix(hex, "#E1D8C8", 30), // hairline borders
    "--color-clay": hex, // primary accent → the variant colour
    "--color-clay-soft": mix(hex, "#FBF8F1", 45),
    backgroundColor: "var(--color-cream)",
  } as React.CSSProperties;

  return (
    <Ctx.Provider value={value}>
      <div className="bara-themed w-full overflow-x-clip" style={style}>
        {children}
      </div>
    </Ctx.Provider>
  );
}

export function useTheme(): ThemeCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useTheme must be used within ThemeProvider");
  return c;
}
