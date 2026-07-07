import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell } from "@/components/legal/LegalShell";
import { COMPANY, companyAddressLine, companyOrgNr } from "@/lib/company";

export const metadata: Metadata = {
  title: "Kontakt og firmainformasjon",
  description:
    "Kontakt BÆRA: e-post, telefon og firmaopplysninger inkludert organisasjonsnummer og adresse.",
  alternates: { canonical: "/kontakt" },
};

export default function KontaktPage() {
  return (
    <LegalShell
      title="Kontakt oss"
      intro={`Vi hjelper deg gjerne. Vi svarer ${COMPANY.responseTime}.`}
      updated="29. juni 2026"
    >
      <h2>Kundeservice</h2>
      <dl>
        <dt>E-post</dt>
        <p>
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
        </p>
        <dt>Telefon</dt>
        <p>{COMPANY.phone}</p>
        <dt>Svartid</dt>
        <p>Vi svarer normalt {COMPANY.responseTime} på virkedager.</p>
      </dl>

      <h2>Firmaopplysninger</h2>
      <dl>
        <dt>Foretak</dt>
        <p>{COMPANY.legalName}</p>
        <dt>Organisasjonsnummer</dt>
        <p>{companyOrgNr()}</p>
        <dt>Adresse</dt>
        <p>{companyAddressLine()}</p>
      </dl>

      <h2>Kjøp og retur</h2>
      <p>
        Se <Link href="/salgsvilkar">salgsvilkårene</Link>,{" "}
        <Link href="/frakt">frakt og retur</Link> og{" "}
        <Link href="/personvern">personvernerklæringen</Link> for mer
        informasjon om handel hos oss.
      </p>
    </LegalShell>
  );
}
