import Link from "next/link";
import { COMPANY, companyAddressLine, companyOrgNr } from "@/lib/company";

export function Footer() {
  return (
    <footer className="bg-ink text-[#C7BDAC]">
      <div className="mx-auto flex max-w-[1100px] flex-wrap justify-between gap-12 px-7 pb-[30px] pt-16">
        <div className="flex-1 basis-[260px]">
          <Link
            href="/"
            className="mb-3.5 inline-block font-serif text-[34px] tracking-[0.04em] text-cream"
          >
            BÆRA
          </Link>
          <p className="m-0 mb-5 max-w-[34ch] text-[14.5px] leading-[1.6]">
            Vi lager bæreutstyr som følger deg gjennom foreldrelivets travle,
            vakre øyeblikk, fra nyfødtkos til springske småbarn.
          </p>
          {/* Vipps requires org. name, org.nr and address to be visible. */}
          <div className="text-[12.5px] leading-[1.7] text-faint">
            <div>{COMPANY.legalName}</div>
            <div>Org.nr {companyOrgNr()}</div>
            <div>{companyAddressLine()}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-14">
          <FooterCol
            title="Handle"
            links={[
              { label: "Bæreslyngen", href: "/baereslyngen" },
              { label: "Bæreguide", href: "/#guide" },
              { label: "Spørsmål og svar", href: "/#faq" },
            ]}
          />
          <FooterCol
            title="Kundeservice"
            links={[
              { label: "Kontakt oss", href: "/kontakt" },
              { label: "Frakt og retur", href: "/frakt" },
              { label: "Salgsvilkår", href: "/salgsvilkar" },
              { label: "Personvern", href: "/personvern" },
            ]}
          />
          <div>
            <div className="mb-4 text-[12px] uppercase tracking-[0.12em] text-faint">
              Kontakt
            </div>
            <div className="flex flex-col gap-[11px] text-[14.5px]">
              <a
                href={`mailto:${COMPANY.email}`}
                className="text-[#C7BDAC] hover:text-cream"
              >
                {COMPANY.email}
              </a>
              <a
                href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}
                className="text-[#C7BDAC] hover:text-cream"
              >
                {COMPANY.phone}
              </a>
              <span className="text-[#C7BDAC]">
                Vi svarer {COMPANY.responseTime}
              </span>
              <div className="mt-1 flex gap-4 text-[13px]">
                <a href="#" className="text-[#C7BDAC] hover:text-cream">
                  Instagram
                </a>
                <a href="#" className="text-[#C7BDAC] hover:text-cream">
                  Facebook
                </a>
                <a href="#" className="text-[#C7BDAC] hover:text-cream">
                  TikTok
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1100px] flex-wrap justify-between gap-3 border-t border-[#3C3833] px-7 py-[22px] text-[12.5px] text-faint">
        <span>
          © 2026 {COMPANY.legalName} · Org.nr {companyOrgNr()}
        </span>
        <span className="flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/personvern" className="hover:text-cream">
            Personvern
          </Link>
          <Link href="/salgsvilkar" className="hover:text-cream">
            Salgsvilkår
          </Link>
          <Link href="/frakt" className="hover:text-cream">
            Frakt og retur
          </Link>
          <Link href="/kontakt" className="hover:text-cream">
            Kontakt
          </Link>
        </span>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <div className="mb-4 text-[12px] uppercase tracking-[0.12em] text-faint">
        {title}
      </div>
      <div className="flex flex-col gap-[11px] text-[14.5px]">
        {links.map((l) => (
          <Link
            key={l.label}
            href={l.href}
            className="text-[#C7BDAC] hover:text-cream"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
