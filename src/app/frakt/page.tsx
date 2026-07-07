import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell } from "@/components/legal/LegalShell";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Frakt og retur",
  description:
    "Fri frakt over 500 kr, sporet levering til hele Norge på 7-10 dager, 14 dagers angrerett og 90 dagers åpent kjøp hos BÆRA.",
  alternates: { canonical: "/frakt" },
};

export default function FraktPage() {
  return (
    <LegalShell
      title="Frakt og retur"
      intro="Alt du trenger å vite om levering, angrerett og retur."
      updated="29. juni 2026"
    >
      <h2>Frakt</h2>
      <ul>
        <li>Vi leverer til hele Norge.</li>
        <li>Sporet levering, sendt innen 24 timer på virkedager.</li>
        <li>Normal leveringstid er 7–10 dager.</li>
        <li>Fri frakt på ordre over 500 kr. Under dette opplyses fraktprisen i kassen.</li>
      </ul>

      <h2>Angrerett</h2>
      <p>
        Du har 14 dagers angrerett etter angrerettloven, regnet fra du mottar
        varen. Gi oss beskjed på{" "}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> innen fristen, så
        ordner vi returen. Varen må sendes tilbake uten unødig opphold og senest
        14 dager etter at du har gitt melding. Se{" "}
        <Link href="/salgsvilkar">salgsvilkårene</Link> for alle detaljer.
      </p>

      <h2>90 dagers åpent kjøp</h2>
      <p>
        I tillegg til angreretten gir vi deg 90 dagers åpent kjøp. Er du ikke
        fornøyd, kan du returnere ubrukte varer i originalemballasje innen 90
        dager og få pengene tilbake, uten stress og uten spørsmål.
      </p>

      <h2>Slik returnerer du</h2>
      <ul>
        <li>
          Send oss en e-post til{" "}
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> med
          ordrenummeret ditt.
        </li>
        <li>Du får returinstruksjoner og adresse fra oss.</li>
        <li>
          Når vi har mottatt varen, tilbakebetaler vi kjøpesummen innen 14 dager.
        </li>
      </ul>
    </LegalShell>
  );
}
