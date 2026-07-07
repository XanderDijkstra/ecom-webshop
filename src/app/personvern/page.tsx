import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/LegalShell";
import { COMPANY, companyAddressLine, companyOrgNr } from "@/lib/company";

export const metadata: Metadata = {
  title: "Personvernerklæring",
  description:
    "Slik behandler BÆRA personopplysninger og informasjonskapsler, hvilke tredjeparter vi bruker, og hvilke rettigheter du har.",
  alternates: { canonical: "/personvern" },
};

export default function PersonvernPage() {
  return (
    <LegalShell
      title="Personvernerklæring"
      intro="Vi er opptatt av å beskytte personvernet ditt. Her forklarer vi hvilke personopplysninger vi samler inn, hvorfor, og hvilke rettigheter du har."
      updated="29. juni 2026"
    >
      <h2>1. Behandlingsansvarlig</h2>
      <p>
        {COMPANY.legalName} (org.nr {companyOrgNr()}), {companyAddressLine()}, er
        behandlingsansvarlig for personopplysningene som behandles via baera.shop.
        Spørsmål om personvern kan rettes til{" "}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.
      </p>

      <h2>2. Hvilke opplysninger vi behandler</h2>
      <ul>
        <li>
          <strong>Ordre- og kontaktopplysninger:</strong> navn, leverings- og
          fakturaadresse, e-postadresse, telefonnummer og ordrehistorikk.
        </li>
        <li>
          <strong>Betalingsopplysninger:</strong> håndteres av vår
          betalingsleverandør. Vi lagrer ikke fullstendige kortnumre.
        </li>
        <li>
          <strong>Bruksdata:</strong> informasjon om hvordan nettsiden brukes,
          via informasjonskapsler (se punkt 5), dersom du samtykker.
        </li>
      </ul>

      <h2>3. Formål og behandlingsgrunnlag</h2>
      <ul>
        <li>
          Gjennomføre kjøp og levere bestillingen din – grunnlaget er oppfyllelse
          av avtalen.
        </li>
        <li>
          Kundeservice og håndtering av retur, angrerett og reklamasjon –
          oppfyllelse av avtale og rettslig forpliktelse.
        </li>
        <li>
          Bokføring – rettslig forpliktelse etter bokføringsloven.
        </li>
        <li>
          Markedsføring og måling av annonser – grunnlaget er ditt samtykke, som
          du når som helst kan trekke tilbake.
        </li>
      </ul>

      <h2>4. Tredjeparter og databehandlere</h2>
      <p>
        Vi deler opplysninger med leverandører som behandler data på våre vegne,
        kun i den grad det er nødvendig:
      </p>
      <ul>
        <li>
          <strong>Betalingsleverandører</strong> (Vipps MobilePay og Stripe) for
          å gjennomføre betaling.
        </li>
        <li>
          <strong>Transport-/fraktpartner</strong> for å levere varene.
        </li>
        <li>
          <strong>Meta Platforms (Facebook)</strong> via Meta-pikselen for måling
          og markedsføring – kun dersom du har samtykket til
          markedsføringskapsler.
        </li>
        <li>
          <strong>Leverandør av nettbutikk og e-post</strong> for drift av
          tjenesten.
        </li>
      </ul>

      <h2>5. Informasjonskapsler (cookies)</h2>
      <p>
        Vi bruker informasjonskapsler for at nettsiden skal fungere og, dersom du
        samtykker, for markedsføring og statistikk.
      </p>
      <ul>
        <li>
          <strong>Nødvendige kapsler</strong> kreves for at handlekurv og kjøp
          skal fungere. Disse kan ikke slås av.
        </li>
        <li>
          <strong>Markedsføringskapsler</strong> (Meta-pikselen) settes bare hvis
          du trykker «Godta» i samtykkebanneret. Du kan når som helst endre eller
          trekke tilbake samtykket ditt ved å tømme nettleserens lagring for
          dette nettstedet, eller ved å kontakte oss.
        </li>
      </ul>

      <h2>6. Lagringstid</h2>
      <p>
        Vi lagrer personopplysninger så lenge det er nødvendig for formålet de ble
        samlet inn for. Ordre- og bokføringsopplysninger oppbevares så lenge
        regnskapslovgivningen krever (som hovedregel 5 år).
      </p>

      <h2>7. Dine rettigheter</h2>
      <p>
        Du har rett til innsyn i, retting av og sletting av dine
        personopplysninger, samt rett til å begrense eller protestere mot
        behandlingen og til dataportabilitet. Du kan også trekke tilbake samtykke
        til markedsføring når som helst. For å bruke rettighetene dine, kontakt
        oss på <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>. Mener du
        at vi behandler opplysninger i strid med regelverket, kan du klage til
        Datatilsynet (
        <a
          href="https://www.datatilsynet.no"
          target="_blank"
          rel="noopener noreferrer"
        >
          datatilsynet.no
        </a>
        ).
      </p>
    </LegalShell>
  );
}
