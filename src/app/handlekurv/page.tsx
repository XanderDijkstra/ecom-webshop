import type { Metadata } from "next";
import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartPageContent } from "@/components/cart/CartPageContent";

export const metadata: Metadata = {
  title: "Handlekurv",
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return (
    <>
      <Header />
      <CartPageContent />
      <Footer />
      <CartDrawer />
    </>
  );
}
