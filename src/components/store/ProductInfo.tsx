"use client";

import { useState } from "react";

const ITEMS = [
  {
    t: "Materialer",
    b: "Innerfôret som ligger mot barnet er 100 % bomull, mykt og pustende. Ytterstoffet er en slitesterk bomullsblanding som tåler hverdagsbruk, vask og mange turer.",
  },
  {
    t: "Vond rygg, nakke og håndledd",
    b: "Slyngen flytter vekten fra armer og håndledd over på skuldre og overkropp, og fordeler den jevnt. Slik kan du bære den lille lenge uten å bli støl, også på lange dager.",
  },
  {
    t: "For de klengete små",
    b: "Noen barn vil helst bæres hele tiden. Slyngen holder barnet tett og trygt inntil deg, samtidig som du får begge hender frie til alt det hverdagen krever.",
  },
  {
    t: "Alder & vekt",
    b: "Egnet fra nyfødt. Vektgrenser: minimum 4,5 kg, maksimum 25 kg. Slyngen justeres trinnløst og vokser med barnet.",
  },
  {
    t: "Frakt & retur",
    b: "Sporet frakt på alle ordrer, sendt innen 24 timer, levering på 7–10 dager. 90 dagers åpent kjøp. Er du ikke fornøyd, får du pengene tilbake, uten spørsmål.",
  },
];

export function ProductInfo() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div id="info" className="mt-9 border-t border-line pt-7">
      <h2 className="mb-3 font-serif text-[clamp(22px,2.6vw,28px)] font-normal">
        Produktinfo
      </h2>
      <div>
        {ITEMS.map((it, i) => {
          const isOpen = open === i;
          return (
            <div
              key={it.t}
              className="border-t border-line last:border-b last:border-line"
            >
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between py-[18px] text-left"
              >
                <span className="text-[15.5px] font-semibold text-ink">
                  {it.t}
                </span>
                <span
                  className="text-[20px] leading-none text-clay transition-transform duration-200"
                  style={{ transform: isOpen ? "rotate(45deg)" : "none" }}
                >
                  +
                </span>
              </button>
              {isOpen && (
                <p className="m-0 pb-5 text-[14.5px] leading-[1.65] text-muted-2">
                  {it.b}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
