"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";

/**
 * Order completion for a 100%-coupon (0 kr) checkout — Stripe/Vipps can't
 * charge zero, so this collects contact + delivery details and posts to
 * /api/free-order, which validates everything server-side and records the
 * order through the normal pipeline. Redirects to /takk like a paid order.
 */
export function FreeOrderForm({
  bump,
  coupon,
}: {
  bump: { colorId: string } | null;
  coupon: string;
}) {
  const cart = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({
    name: "",
    email: "",
    phone: "",
    line1: "",
    postal: "",
    city: "",
  });

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/free-order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: cart.items.map((i) => ({
            slug: i.slug,
            colorId: i.colorId,
            qty: i.qty,
            free: i.free,
          })),
          bump,
          coupon,
          customer: f,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.reference) {
        setError(data.error || "Noe gikk galt. Prøv igjen.");
        setBusy(false);
        return;
      }
      window.location.href = `/takk?free=${encodeURIComponent(data.reference)}`;
    } catch {
      setError("Noe gikk galt. Prøv igjen.");
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-xl border border-line px-3.5 py-3 text-[15px] outline-none transition-colors focus:border-ink";

  return (
    <form onSubmit={submit}>
      <p className="mb-5 rounded-xl bg-[#e9f4ec] px-4 py-3 text-[13.5px] leading-relaxed text-[#1f7a4d]">
        Rabattkoden dekker hele bestillingen — ingen betaling nødvendig. Fyll
        inn leveringsdetaljene og fullfør.
      </p>

      <div className="space-y-3.5">
        <input required placeholder="Fullt navn" value={f.name} onChange={set("name")} className={field} />
        <input required type="email" placeholder="E-post" value={f.email} onChange={set("email")} className={field} />
        <input placeholder="Telefon (valgfritt)" value={f.phone} onChange={set("phone")} className={field} />
        <input required placeholder="Gateadresse" value={f.line1} onChange={set("line1")} className={field} />
        <div className="flex gap-3.5">
          <input required placeholder="Postnr." value={f.postal} onChange={set("postal")} className={`${field} w-32`} />
          <input required placeholder="Poststed" value={f.city} onChange={set("city")} className={field} />
        </div>
      </div>

      {error && (
        <p className="mt-4 text-[13.5px] text-red-700" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-6 flex w-full items-center justify-center rounded-full bg-ink py-[17px] text-[15.5px] font-semibold text-cream transition-colors hover:bg-clay disabled:opacity-60"
      >
        {busy ? "Fullfører …" : "Fullfør bestilling · 0 kr"}
      </button>
    </form>
  );
}
