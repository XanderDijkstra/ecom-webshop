import Link from "next/link";

/**
 * SEO/AEO "bæreguide": targets the three category head terms (bæresele,
 * bæresjal, bæreslynge) on one page, with a definitive opening answer for
 * answer-engine snippets, then positions Bæreslyngen as the best of all three.
 */
const TYPES = [
  {
    term: "Bæresele",
    desc: "Myk eller strukturert sele du tar på med stropper og spenne. Rask å bruke, fordeler vekten på skuldrene og vokser med barnet.",
    best: "Best for: hverdagsbruk fra nyfødt og oppover.",
  },
  {
    term: "Bæresjal",
    desc: "Ett langt, mykt stykke stoff du knytter rundt deg. Tett og koselig for de minste, men krever litt øving å knyte riktig.",
    best: "Best for: nyfødtkos og foreldre som liker tett bæring.",
  },
  {
    term: "Bæreslynge",
    desc: "Et bæreplagg du tar over én skulder, ofte med ring. Enkelt å justere og lett å ta av og på, men bæres på én side.",
    best: "Best for: korte løft og raske av- og påkledninger.",
  },
];

export function Comparison() {
  return (
    <section id="guide" className="mx-auto max-w-[1100px] px-7 py-[90px]">
      <div className="mb-4 text-center text-[12px] uppercase tracking-[0.16em] text-clay">
        Bæreguide
      </div>
      <h2 className="mx-auto mb-5 max-w-[18ch] text-center font-serif text-[clamp(28px,3.8vw,42px)] font-normal leading-[1.08]">
        Bæresele, bæresjal eller bæreslynge?
      </h2>
      <p className="mx-auto mb-[50px] max-w-[60ch] text-center text-[17px] leading-[1.6] text-muted-2">
        Kort fortalt: en bæresele tas på med stropper og spenne, et bæresjal
        knytes rundt deg, og en bæreslynge bæres over én skulder. Alle tre
        holder barnet ergonomisk i M-stilling. BÆRA Bæreslyngen kombinerer det
        beste fra alle tre, mykt bomullsstoff som et bæresjal, men like enkelt å
        ta på som en sele.
      </p>

      <div className="flex flex-wrap gap-6">
        {TYPES.map((t) => (
          <div
            key={t.term}
            className="min-w-[260px] flex-1 basis-[300px] rounded-lg border border-line bg-linen p-[30px]"
          >
            <h3 className="mb-3 font-serif text-[24px] font-normal">{t.term}</h3>
            <p className="m-0 mb-4 text-[15.5px] leading-[1.6] text-muted-2">
              {t.desc}
            </p>
            <p className="m-0 text-[14px] font-medium text-clay">{t.best}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/baereslyngen"
          className="inline-block rounded-full bg-ink px-9 py-[15px] text-[15px] font-semibold text-cream transition-colors hover:bg-clay"
        >
          Se Bæreslyngen
        </Link>
      </div>
    </section>
  );
}
