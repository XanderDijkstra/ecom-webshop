import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell } from "@/components/legal/LegalShell";
import { COMPANY, companyAddressLine, companyOrgNr } from "@/lib/company";

export const metadata: Metadata = {
  title: "Salgsvilkår",
  description:
    "Salgsbetingelser for kjøp hos BÆRA: parter, priser, betaling, levering, angrerett, retur, reklamasjon og konfliktløsning.",
  alternates: { canonical: "/salgsvilkar" },
};

export default function SalgsvilkarPage() {
  return (
    <LegalShell
      title="Salgsvilkår"
      intro="Disse salgsbetingelsene gjelder for alle kjøp av varer fra BÆRA gjennom nettbutikken baera.shop."
      updated="29. juni 2026"
    >
      <h2>1. Innledning</h2>
      <p>
        Dette kjøpet er regulert av de nedenstående standard salgsbetingelsene
        for forbrukerkjøp av varer over internett. Forbrukerkjøp over internett
        reguleres hovedsakelig av avtaleloven, forbrukerkjøpsloven,
        markedsføringsloven, angrerettloven og ehandelsloven, og disse lovene
        gir forbrukeren ufravikelige rettigheter. Vilkårene utgjør, sammen med
        din bestilling og bekreftet ordrebekreftelse, det samlede avtalegrunnlaget
        for kjøpet.
      </p>

      <h2>2. Parter</h2>
      <p>
        <strong>Selger</strong> er {COMPANY.legalName}, organisasjonsnummer{" "}
        {companyOrgNr()}, med adresse {companyAddressLine()}. E-post{" "}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>, telefon{" "}
        {COMPANY.phone}. Selger omtales i det følgende som «vi», «oss» eller
        «BÆRA».
      </p>
      <p>
        <strong>Kjøper</strong> er den forbrukeren som foretar bestillingen, og
        omtales i det følgende som «du», «deg» eller «kjøper».
      </p>

      <h2>3. Priser</h2>
      <p>
        Alle priser er oppgitt i norske kroner og inkluderer 25 % merverdiavgift.
        Eventuelle fraktkostnader kommer i tillegg og opplyses tydelig før du
        fullfører bestillingen. Vi tilbyr fri frakt på ordre over 500 kr.
      </p>

      <h2>4. Avtaleinngåelse</h2>
      <p>
        Avtalen er bindende for begge parter når bestillingen er sendt til oss og
        vi har bekreftet mottak av bestillingen med en ordrebekreftelse på
        e-post. Avtalen er likevel ikke bindende dersom det har forekommet skrive-
        eller tastefeil i tilbudet fra oss eller i bestillingen fra deg, og den
        annen part innså eller burde ha innsett at det forelå en slik feil.
      </p>

      <h2>5. Betaling</h2>
      <p>
        Du kan betale med Vipps MobilePay og de betalingskortene som til enhver
        tid tilbys i kassen. Betalingen håndteres av våre betalingspartnere på en
        sikker måte, og kjøpesummen reserveres eller trekkes ved bestilling. Vi
        oppbevarer ikke kortnummeret ditt.
      </p>

      <h2>6. Levering</h2>
      <p>
        Vi leverer til hele Norge. Bestillinger sendes som sporet pakke innen 24
        timer på virkedager, og normal leveringstid er 7–10 dager. Levering er
        skjedd når du, eller din representant, har overtatt varen. Risikoen for
        varen går over på deg når du har mottatt den.
      </p>

      <h2>7. Angrerett</h2>
      <p>
        Du har 14 dagers angrerett i henhold til angrerettloven. Angrefristen
        løper fra den dagen du mottar varen. Du kan gå fra avtalen uten å oppgi
        noen grunn ved å gi oss melding innen fristen, for eksempel på e-post til{" "}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>. Du kan benytte
        det{" "}
        <a
          href="https://www.forbrukertilsynet.no/angrerettskjema"
          target="_blank"
          rel="noopener noreferrer"
        >
          standardiserte angreskjemaet fra Forbrukertilsynet
        </a>
        , men det er ikke obligatorisk.
      </p>
      <p>
        Ved bruk av angreretten må varen returneres til oss uten unødig opphold,
        og senest 14 dager etter at du har gitt melding om at du benytter
        angreretten. Varen skal returneres i tilnærmet samme stand og mengde som
        du mottok den. Du betaler returkostnadene ved bruk av angreretten, med
        mindre annet er avtalt. Vi tilbakebetaler kjøpesummen uten unødig opphold,
        og senest 14 dager etter at vi har mottatt varen i retur, eller mottatt
        dokumentasjon på at varen er sendt tilbake.
      </p>

      <h2>8. Reklamasjon ved mangel</h2>
      <p>
        Etter forbrukerkjøpsloven har du reklamasjonsrett i inntil 5 år dersom
        varen er ment å vare vesentlig lengre enn 2 år, og ellers i 2 år. Dersom
        varen har en mangel, og dette ikke skyldes deg eller forhold på din side,
        kan du etter omstendighetene holde kjøpesummen tilbake, velge mellom
        retting og omlevering, kreve prisavslag, kreve avtalen hevet og/eller
        kreve erstatning. Reklamasjon må skje innen rimelig tid etter at du
        oppdaget eller burde oppdaget mangelen. Meld fra til oss på{" "}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.
      </p>

      <h2>9. Retur og bytte</h2>
      <p>
        I tillegg til den lovbestemte angreretten tilbyr vi 90 dagers åpent kjøp.
        Er du ikke fornøyd, kan du returnere ubrukte varer i originalemballasje
        innen 90 dager og få pengene tilbake. Ta kontakt med oss på{" "}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> før du returnerer,
        så hjelper vi deg videre. Se også <Link href="/frakt">frakt og retur</Link>.
      </p>

      <h2>10. Personopplysninger</h2>
      <p>
        Vi behandler personopplysningene dine i samsvar med personvernlovgivningen.
        Les mer i vår <Link href="/personvern">personvernerklæring</Link>.
      </p>

      <h2>11. Reklamasjonshåndtering og konfliktløsning</h2>
      <p>
        Klager rettes til oss innen rimelig tid på{" "}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>. Vi vil forsøke å
        løse eventuelle tvister i minnelighet. Dersom vi ikke kommer til enighet,
        kan du bringe saken inn for Forbrukertilsynet og Forbrukerklageutvalget
        (
        <a
          href="https://www.forbrukertilsynet.no"
          target="_blank"
          rel="noopener noreferrer"
        >
          forbrukertilsynet.no
        </a>
        ). Ved kjøp over landegrenser i EØS kan du også kontakte Forbruker Europa.
      </p>
    </LegalShell>
  );
}
