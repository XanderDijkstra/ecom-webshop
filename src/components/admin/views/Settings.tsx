"use client";

import { COMPANY, companyAddressLine, companyOrgNr } from "@/lib/company";
import { FB_PIXEL_ID } from "@/lib/fpixel";
import { Card } from "../ui";

export function Settings({
  email,
  onSignOut,
}: {
  email: string;
  onSignOut: () => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-6">
        <h2 className="mb-4 text-[15px] font-semibold text-ink">Store</h2>
        <dl className="space-y-3 text-[14px]">
          <Item label="Company" value={COMPANY.legalName} />
          <Item label="Org. no." value={companyOrgNr()} />
          <Item label="Address" value={companyAddressLine()} />
          <Item label="Email" value={COMPANY.email} />
          <Item label="Phone" value={COMPANY.phone} />
          <Item label="Website" value={COMPANY.url} />
        </dl>
        <p className="mt-4 text-[12px] text-[#a3a39c]">
          Edited in <code className="rounded bg-[#eee] px-1 py-0.5">src/lib/company.ts</code>.
        </p>
      </Card>

      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="mb-4 text-[15px] font-semibold text-ink">Integrations</h2>
          <div className="space-y-3">
            <Integration name="Stripe — payments" detail="Card, Klarna, Google Pay" />
            <Integration name="Supabase — database" detail="Order storage" />
            <Integration name="Meta Pixel" detail={FB_PIXEL_ID} />
            <Integration name="Meta Conversions API" detail="Server-side Purchase" />
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-3 text-[15px] font-semibold text-ink">Account</h2>
          <p className="text-[14px] text-[#6b6b66]">
            Signed in as <span className="font-medium text-ink">{email}</span>
          </p>
          <button
            onClick={onSignOut}
            className="mt-4 rounded-lg border border-[#e2e2dd] px-4 py-2 text-[13.5px] font-medium text-ink transition-colors hover:border-ink"
          >
            Sign out
          </button>
        </Card>
      </div>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-[#8a8a84]">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}

function Integration({ name, detail }: { name: string; detail: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[#eeeeea] px-3.5 py-2.5">
      <div className="min-w-0">
        <div className="text-[13.5px] font-medium text-ink">{name}</div>
        <div className="truncate text-[12px] text-[#8a8a84]">{detail}</div>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#d9f2e3] px-2.5 py-[3px] text-[11.5px] font-semibold text-[#1f7a4d]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#1f7a4d]" />
        Connected
      </span>
    </div>
  );
}
