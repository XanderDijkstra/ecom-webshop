import { fmtKr } from "@/lib/format";
import { amountToFreeShipping, freeShippingProgress } from "@/lib/shipping";

/**
 * Visual free-shipping progress bar. Shows how far the cart is from the free
 * shipping threshold, or a celebratory "unlocked" state once reached.
 */
export function FreeShippingBar({ subtotal }: { subtotal: number }) {
  const remaining = amountToFreeShipping(subtotal);
  const reached = remaining <= 0;
  const pct = Math.round(freeShippingProgress(subtotal) * 100);

  return (
    <div className="rounded-xl border border-line bg-white/50 px-4 py-3">
      <div className="mb-2 flex items-center gap-2 text-[13px] font-medium">
        <span aria-hidden className="text-[15px] leading-none">
          {reached ? "🎉" : "🚚"}
        </span>
        {reached ? (
          <span className="text-clay">Du har fri frakt!</span>
        ) : (
          <span className="text-ink">
            Handle for{" "}
            <span className="font-semibold">{fmtKr(remaining)}</span> til og få{" "}
            <span className="font-semibold">fri frakt</span>
          </span>
        )}
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Fremgang mot fri frakt"
      >
        <div
          className="h-full rounded-full bg-clay transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
