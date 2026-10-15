import { BandeauVie } from "@/components/site/BandeauVie";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";

export default function LayoutPublic({ children }: LayoutProps<"/">) {
  return (
    <>
      <BandeauVie />
      <Header />
      <main id="contenu" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
