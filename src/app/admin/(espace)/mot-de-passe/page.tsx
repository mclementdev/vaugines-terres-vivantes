import { FormulaireMotDePasse } from "@/components/admin/FormulaireMotDePasse";
import { CarteAdmin, EnTeteAdmin } from "@/components/admin/ui";
import { exigerAdmin } from "@/lib/auth";

export const metadata = { title: "Mot de passe" };
export const instant = false;

export default async function MotDePasse() {
  const admin = await exigerAdmin();
  return (
    <>
      <EnTeteAdmin titre="Mon mot de passe" surtitre={admin.email} />
      <CarteAdmin titre="Choisir un mot de passe" className="max-w-[560px]">
        <p className="mb-4 text-[15px] text-encre-2">
          12 caractères au minimum. Une phrase de quelques mots est plus facile à retenir et plus sûre qu&apos;un mot compliqué.
        </p>
        <FormulaireMotDePasse email={admin.email} />
      </CarteAdmin>
    </>
  );
}
