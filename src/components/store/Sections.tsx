import Image from "next/image";
import { BuyButton } from "./BuyButton";
import type { Product } from "@/lib/products";

export function TrustStrip() {
  const stats = [
    { n: "100 000+", l: "foreldre verden over" },
    { n: "4,9 ★", l: "snitt av 2 400 omtaler" },
    { n: "90 dager", l: "åpent kjøp, ingen spørsmål" },
    { n: "6 farger", l: "dempede, naturlige toner" },
  ];
  return (
    <div className="border-y border-line bg-sand">
      <div className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-5 px-7 py-[26px] text-center">
        {stats.map((s) => (
          <div key={s.n} className="flex-1 basis-[160px]">
            <div className="font-serif text-[30px]">{s.n}</div>
            <div className="text-[13px] text-muted">{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MediaPanel({
  src,
  alt,
  borderColor = "#E1D8C8",
  ratio = "5/4",
}: {
  src: string;
  alt: string;
  borderColor?: string;
  ratio?: string;
}) {
  return (
    <div
      className="relative min-w-[280px] flex-1 basis-[320px] overflow-hidden rounded-md border-2 bg-white"
      style={{ borderColor, aspectRatio: ratio }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-contain p-8"
        sizes="(min-width: 1024px) 45vw, (min-width: 640px) 50vw, 100vw"
      />
    </div>
  );
}

export function BenefitRo() {
  return (
    <section
      id="bruk"
      className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-[60px] px-7 py-[90px]"
    >
      <MediaPanel
        src="/images/sling-aztec.webp"
        alt="Bæreslyngen i Aztec-mønster"
        borderColor="#B84B36"
      />
      <div className="min-w-[280px] flex-1 basis-[320px]">
        <div className="mb-4 text-[12px] uppercase tracking-[0.16em] text-clay">
          Hverdagsro
        </div>
        <h2 className="mb-[18px] font-serif text-[clamp(30px,4vw,42px)] font-normal leading-[1.08]">
          Frie hender, rolig barn
        </h2>
        <p className="m-0 max-w-[46ch] text-[17px] leading-[1.6] text-muted-2">
          Når den lille vil bæres, men livet ikke kan settes på pause. Slyngen
          holder barnet tett inntil deg mens du lager mat, handler eller bare
          drikker kaffen mens den fortsatt er varm.
        </p>
      </div>
    </section>
  );
}

export function BenefitKomfort() {
  return (
    <section className="mx-auto flex max-w-[1100px] flex-wrap-reverse items-center gap-[60px] px-7 pb-[90px]">
      <div className="min-w-[280px] flex-1 basis-[320px]">
        <div className="mb-4 text-[12px] uppercase tracking-[0.16em] text-clay">
          Komfort hele dagen
        </div>
        <h2 className="mb-[18px] font-serif text-[clamp(30px,4vw,42px)] font-normal leading-[1.08]">
          Lett for deg, lunt for dem
        </h2>
        <p className="mb-6 max-w-[46ch] text-[17px] leading-[1.6] text-muted-2">
          Polstret skulderstøtte og pustende bomull fordeler vekten jevnt, så
          rygg og armer slipper å ta støyten, fra nyfødt til 25 kilos småbarn.
        </p>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {[
            "Ergonomisk M-posisjon for hoftene",
            "Sikkerhetsspenne og justerbare stropper",
            "Bretter seg ned i en hvilken som helst veske",
          ].map((t) => (
            <li
              key={t}
              className="flex items-start gap-[11px] text-[15.5px] text-ink-soft"
            >
              <span className="text-clay">•</span> {t}
            </li>
          ))}
        </ul>
      </div>
      <MediaPanel
        src="/images/sling-teddybear.webp"
        alt="Bæreslyngen i Teddybjørn-mønster"
        borderColor="#A8896A"
      />
    </section>
  );
}

export function FeatureBand() {
  return (
    <section className="bg-ink text-cream-text">
      <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-[60px] px-7 py-[90px]">
        <div className="min-w-[280px] flex-1 basis-[340px]">
          <h2 className="mb-5 font-serif text-[clamp(32px,4.5vw,48px)] font-normal leading-[1.05]">
            Slutt på såre armer
            <br />
            og vond rygg
          </h2>
          <p className="m-0 max-w-[44ch] text-[17px] leading-[1.6] text-[#C7BDAC]">
            Å holde et klengete barn hele dagen sliter deg ut. Slyngen fordeler
            vekten jevnt, så du kan bevege deg fritt, og være nær, smertefritt.
          </p>
        </div>
        <div className="relative aspect-square min-w-[280px] flex-1 basis-[320px] overflow-hidden rounded-md border-2 border-[#C7BDAC] bg-white">
          <Image
            src="/images/sling-sort.webp"
            alt="Bæreslyngen i Sort"
            fill
            className="object-contain p-8"
            sizes="(min-width: 1024px) 45vw, (min-width: 640px) 50vw, 100vw"
          />
        </div>
      </div>
    </section>
  );
}

/* ── Customer reviews ──────────────────────────────────────────────────
 * On-brand review cards (clay stars, matching the rest of the site). Copy is
 * illustrative; the featured quote is a real BÆRA testimonial. The 4,9 / 2 400
 * aggregate mirrors the figure used elsewhere across the site. */

function Stars({ className = "text-[15px]" }: { className?: string }) {
  return (
    <span
      className={`tracking-[0.12em] text-clay ${className}`}
      aria-label="5 av 5 stjerner"
    >
      ★★★★★
    </span>
  );
}

export function Reviews() {
  const reviews = [
    {
      title: "Endelig en jeg faktisk bruker",
      body: "«Endelig en bæresele jeg faktisk bruker. På i fem sekunder – og den er nydelig.»",
      name: "Ingrid",
      tag: "mamma til Olivia",
    },
    {
      title: "Redder ryggen min",
      body: "Jeg bruker slyngen hver eneste dag, og ryggen takker meg. Datteren sovner på et blunk når hun ligger tett inntil meg.",
      name: "Henrik S.",
      tag: "Bergen",
    },
    {
      title: "Så enkel å ta på",
      body: "Ingen spenner å lure på, og pappa skjønte den på første forsøk. Stoffet er mykt og pustende, akkurat som lovet.",
      name: "Karoline T.",
      tag: "Trondheim",
    },
    {
      title: "Verdt hver krone",
      body: "Jeg bretter den sammen i veska og har den alltid med. Skulle bare ønske jeg kjøpte den da han var nyfødt.",
      name: "Marte L.",
      tag: "Stavanger",
    },
  ];
  return (
    <section className="border-y border-line bg-sand py-[70px]">
      <div className="mx-auto max-w-[1200px] px-7">
        <div className="mb-9 flex flex-col items-center gap-2.5 text-center">
          <div className="text-[12px] uppercase tracking-[0.16em] text-clay">
            Omtaler
          </div>
          <h2 className="font-serif text-[clamp(26px,3.4vw,38px)] font-normal">
            Elsket av foreldre
          </h2>
          <div className="flex items-center gap-2.5">
            <Stars className="text-[18px]" />
            <span className="text-[15px] text-muted">
              4,9 av 5 · 2 400+ omtaler
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-5">
          {reviews.map((r) => (
            <div
              key={r.name}
              className="flex min-w-[260px] flex-1 basis-[300px] flex-col rounded-lg border border-line bg-linen p-[26px]"
            >
              <Stars />
              <h3 className="mb-2 mt-3 text-[16px] font-semibold text-ink">
                {r.title}
              </h3>
              <p className="m-0 mb-5 flex-1 text-[15px] leading-[1.6] text-muted-2">
                {r.body}
              </p>
              <div className="flex items-center gap-2 border-t border-line pt-3.5 text-[13.5px]">
                <span className="font-medium text-ink">{r.name}</span>
                <span className="text-faint">· {r.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Why BÆRA — trust badges ───────────────────────────────────────────
 * Seal medallions rendered fully in-brand (no external images). Labels are
 * truthful product attributes, NOT third-party awards. If BÆRA genuinely wins
 * an award, swap a badge's title/note for the real award + issuer. */

const BADGE_ICON = {
  star: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z",
  heart:
    "M12 21s-6.8-4.35-9.3-8.6C1.1 9.6 2.4 5.9 5.8 5.9c2 0 3.4 1.35 4.2 2.75.8-1.4 2.2-2.75 4.2-2.75 3.4 0 4.7 3.7 3.1 6.5C18.8 16.65 12 21 12 21z",
  sparkle: "M12 2c1 5 4 8 9 10-5 2-8 5-9 10-1-5-4-8-9-10 5-2 8-5 9-10z",
  leaf: "M4 20C4 10 11 4 21 4c0 10-7 16-17 16z",
} as const;

function SealFrame() {
  // Scalloped "certificate seal" edge: small dots evenly around the rim.
  const dots = Array.from({ length: 32 }, (_, i) => {
    const a = (i / 32) * Math.PI * 2;
    return { cx: 60 + Math.cos(a) * 50, cy: 60 + Math.sin(a) * 50 };
  });
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
      {dots.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={4.4} fill="#be7e5e" />
      ))}
      <circle cx="60" cy="60" r="48" fill="#fbf8f1" />
      <circle cx="60" cy="60" r="42" fill="none" stroke="#be7e5e" strokeWidth="1.4" />
      <circle
        cx="60"
        cy="60"
        r="38.5"
        fill="none"
        stroke="#be7e5e"
        strokeWidth="0.6"
        opacity="0.5"
      />
    </svg>
  );
}

function Seal({ icon }: { icon: keyof typeof BADGE_ICON }) {
  return (
    <div className="relative h-[128px] w-[128px]">
      <SealFrame />
      <div className="absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 24 24" width="44" height="44" fill="#be7e5e" aria-hidden="true">
          <path d={BADGE_ICON[icon]} />
        </svg>
      </div>
    </div>
  );
}

export function TrustBadges() {
  const badges = [
    { icon: "heart", title: "Ergonomisk", note: "Støtter M-stillingen" },
    { icon: "sparkle", title: "På 5 sekunder", note: "Ingen spenner å lure på" },
    { icon: "leaf", title: "Pustende", note: "100 % myk bomull" },
    { icon: "star", title: "Trygt kjøp", note: "90 dagers åpent kjøp" },
  ] as const;
  return (
    <section className="bg-ink text-cream-text">
      <div className="mx-auto max-w-[1100px] px-7 py-[80px]">
        <div className="mb-2 text-center text-[12px] uppercase tracking-[0.16em] text-clay-soft">
          Derfor BÆRA
        </div>
        <h2 className="mx-auto mb-3 max-w-[20ch] text-center font-serif text-[clamp(28px,3.8vw,42px)] font-normal leading-[1.08] text-cream">
          Skapt for komfort som varer hele dagen
        </h2>
        <p className="mx-auto mb-[54px] max-w-[54ch] text-center text-[16px] leading-[1.6] text-[#C7BDAC]">
          Hver detalj er gjennomtenkt for ergonomi, komfort og enkelhet – fra de
          første dagene til småbarnsalder.
        </p>
        <div className="flex flex-wrap justify-center gap-x-10 gap-y-12">
          {badges.map((b) => (
            <figure
              key={b.title}
              className="flex w-[150px] flex-col items-center gap-4 text-center"
            >
              <Seal icon={b.icon} />
              <figcaption>
                <div className="font-serif text-[18px] text-cream">{b.title}</div>
                <div className="mt-1 text-[13px] text-[#C7BDAC]">{b.note}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BenefitAllsidig() {
  return (
    <section className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-[60px] px-7 py-[90px]">
      <MediaPanel
        src="/images/sling-bla.webp"
        alt="Bæreslyngen i Blå"
        borderColor="#6A8EAF"
      />
      <div className="min-w-[280px] flex-1 basis-[320px]">
        <div className="mb-4 text-[12px] uppercase tracking-[0.16em] text-clay">
          Allsidig
        </div>
        <h2 className="mb-[18px] font-serif text-[clamp(30px,4vw,42px)] font-normal leading-[1.08]">
          Én slynge, utallige øyeblikk
        </h2>
        <p className="m-0 mb-6 max-w-[46ch] text-[17px] leading-[1.6] text-muted-2">
          På tur i skogen, på kafé, i butikken eller på besøk hos besteforeldre.
          Den samme slyngen følger dere overalt, og når den lille endelig
          sovner, bretter du den enkelt sammen og legger den i veska.
        </p>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {[
            "Lett å ta av og på alene",
            "Brettbar, får plass i en hvilken som helst veske",
            "Like fin ute som inne, sommer som vinter",
          ].map((t) => (
            <li
              key={t}
              className="flex items-start gap-[11px] text-[15.5px] text-ink-soft"
            >
              <span className="text-clay">•</span> {t}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function CommunityCTA() {
  return (
    <section className="border-y border-line bg-linen">
      <div className="mx-auto max-w-[680px] px-7 py-[70px] text-center">
        <div className="mb-[14px] text-[12px] uppercase tracking-[0.16em] text-clay">
          Fellesskap
        </div>
        <h2 className="mb-[16px] font-serif text-[clamp(28px,3.8vw,40px)] font-normal leading-[1.08]">
          Bli med i BÆRA-familien
        </h2>
        <p className="mb-7 text-[17px] leading-[1.6] text-muted-2">
          Tusenvis av norske foreldre deler hverdagsøyeblikkene sine med
          slyngen. Del ditt med <span className="text-ink">#bæra</span> og bli en
          del av et varmt fellesskap av mammaer og pappaer.
        </p>
        <a
          href="#produkt"
          className="inline-block rounded-full bg-ink px-9 py-[15px] text-[15px] font-semibold text-cream transition-colors hover:bg-clay"
        >
          Velg ditt mønster
        </a>
      </div>
    </section>
  );
}

export function Testimonials() {
  const reviews = [
    {
      q: "«Den eneste slyngen datteren min faktisk sovner i. Og ryggen min takker meg etter en hel dag på beina.»",
      name: "Ingrid M.",
      city: "Oslo",
      dot: "#E4D6BC",
    },
    {
      q: "«Så enkel at pappa skjønte den på første forsøk. Fargen Salvie er enda finere i virkeligheten.»",
      name: "Henrik & Sofie",
      city: "Bergen",
      dot: "#A9B39B",
    },
    {
      q: "«Får plass i veska og redder oss på hver eneste tur. Skulle kjøpt den måneder tidligere.»",
      name: "Karoline T.",
      city: "Trondheim",
      dot: "#C99B82",
    },
  ];
  return (
    <section id="om" className="mx-auto max-w-[1100px] px-7 py-[90px]">
      <h2 className="m-0 mb-2 text-center font-serif text-[clamp(30px,4vw,42px)] font-normal">
        Elsket av foreldre
      </h2>
      <p className="m-0 mb-[50px] text-center text-[15px] text-faint">
        Et utvalg av 2 400+ omtaler
      </p>
      <div className="flex flex-wrap gap-6">
        {reviews.map((r) => (
          <div
            key={r.name}
            className="min-w-[260px] flex-1 basis-[280px] rounded-lg border border-[#ECE3D2] bg-linen p-[30px]"
          >
            <div className="mb-3.5 text-[14px] tracking-[0.05em] text-clay">
              ★★★★★
            </div>
            <p className="m-0 mb-[22px] text-[16px] leading-[1.6] text-ink-soft">
              {r.q}
            </p>
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-full"
                style={{ background: r.dot }}
              />
              <div>
                <div className="text-[14px] font-semibold">{r.name}</div>
                <div className="text-[12.5px] text-faint">{r.city}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Guarantee({ product }: { product: Product }) {
  return (
    <section className="border-t border-line bg-sand">
      <div className="mx-auto max-w-[680px] px-7 py-[80px] text-center">
        <div className="mb-[18px] text-[12px] uppercase tracking-[0.16em] text-clay">
          90 dagers garanti
        </div>
        <h2 className="mb-[18px] font-serif text-[clamp(30px,4.2vw,44px)] font-normal leading-[1.08]">
          Elsk den, eller få pengene tilbake
        </h2>
        <p className="mb-8 text-[17px] leading-[1.6] text-muted-2">
          Prøv slyngen risikofritt i 90 dager. Faller den ikke i smak, gir vi
          deg full refusjon, uten stress og uten spørsmål.
        </p>
        <BuyButton product={product} />
      </div>
    </section>
  );
}
