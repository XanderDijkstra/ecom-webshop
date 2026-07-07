import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";

/** Shared page frame for the legal / info pages (terms, privacy, etc.). */
export function LegalShell({
  title,
  intro,
  updated,
  children,
}: {
  title: string;
  intro?: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[760px] px-7 pb-[80px] pt-[40px]">
        <h1 className="mb-3 font-serif text-[clamp(30px,4.5vw,46px)] font-normal leading-[1.08]">
          {title}
        </h1>
        {intro && (
          <p className="mb-2 max-w-[60ch] text-[17px] leading-[1.6] text-muted-2">
            {intro}
          </p>
        )}
        {updated && (
          <p className="mb-8 text-[13px] text-faint">Sist oppdatert {updated}</p>
        )}
        <div className="legal-prose">{children}</div>
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
