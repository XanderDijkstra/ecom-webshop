// ============================================================================
// EDIT THIS FILE FIRST when spinning up a new store (see docs/SETUP.md).
// ============================================================================
// Single source of truth for the brand + legally required company / contact
// details shown across the site (footer, contact page, terms, privacy). Vipps
// website verification requires org. name, organisasjonsnummer, address,
// phone and email to be prominently available.
export const COMPANY = {
  /** Public brand name. */
  brand: "YOUR BRAND",
  /** Registered legal entity name (foretaksnavn). */
  legalName: "YOUR COMPANY AS",
  /** Organisasjonsnummer (9 digits). */
  orgNr: "000 000 000",
  /** Whether the org is VAT-registered ("MVA" suffix on org.nr). */
  vatRegistered: true,
  /** Registered/visiting address. */
  address: {
    line1: "Gateadresse 1",
    postal: "0000",
    city: "Poststed",
    country: "Norge",
  },
  /** Customer support email (must exist — order emails use it as fallback). */
  email: "hei@yourshop.example",
  /** Customer support phone (Vipps requires a reachable number). */
  phone: "+47 000 00 000",
  /** Stated support response time. */
  responseTime: "innen 24 timer",
  /** Canonical site URL. */
  url: "https://www.yourshop.example",
} as const;

/** One-line postal address, e.g. "Gateadresse, 0000 Poststed, Norge". */
export function companyAddressLine(): string {
  const a = COMPANY.address;
  return `${a.line1}, ${a.postal} ${a.city}, ${a.country}`;
}

/** Org.nr with the MVA suffix where applicable, e.g. "000 000 000 MVA". */
export function companyOrgNr(): string {
  return COMPANY.vatRegistered ? `${COMPANY.orgNr} MVA` : COMPANY.orgNr;
}
