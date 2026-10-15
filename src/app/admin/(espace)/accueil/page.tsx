import Link from "next/link";

import { EditeurBloc, LigneMembre, type ChampBloc } from "@/components/admin/EditeursAccueil";
import { EnTeteAdmin, LienAdmin } from "@/components/admin/ui";
import type { CleBloc } from "@/app/admin/actions/parametres";
import { exigerAdmin } from "@/lib/auth";
import { clientSession } from "@/lib/supabase/serveur";

export const metadata = { title: "Textes de l'accueil" };
export const instant = false;

const BLOCS: { cle: CleBloc; titre: string; champs: ChampBloc[] }[] = [
  {
    cle: "hero",
    titre: "En-tête (photo du village)",
    champs: [
      { cle: "surtitre", libelle: "Surtitre", type: "texte" },
      { cle: "titre", libelle: "Titre", type: "texte" },
      { cle: "titre_accent", libelle: "Fin du titre (en couleur)", type: "texte" },
      { cle: "texte", libelle: "Texte", type: "zone" },
      { cle: "note", libelle: "Petite note sous les boutons", type: "texte" },
    ],
  },
  {
    cle: "association",
    titre: "L'association",
    champs: [
      { cle: "surtitre", libelle: "Surtitre", type: "texte" },
      { cle: "titre", libelle: "Titre", type: "zone" },
      { cle: "paragraphes", libelle: "Paragraphes", type: "liste" },
    ],
  },
  {
    cle: "nom",
    titre: "Pourquoi ce nom ?",
    champs: [
      { cle: "surtitre", libelle: "Surtitre", type: "texte" },
      { cle: "terres", libelle: "« terres »", type: "liste" },
      { cle: "vivantes", libelle: "« vivantes »", type: "liste" },
    ],
  },
  {
    cle: "gouvernance",
    titre: "Gouvernance",
    champs: [
      { cle: "surtitre", libelle: "Surtitre", type: "texte" },
      { cle: "titre", libelle: "Titre", type: "texte" },
      { cle: "texte", libelle: "Texte", type: "zone" },
      { cle: "commissions", libelle: "Phrase sur les commissions", type: "texte" },
      { cle: "titre_conseil", libelle: "Titre de la liste du conseil", type: "texte" },
      { cle: "note_portraits", libelle: "Note sous les portraits", type: "texte" },
    ],
  },
  {
    cle: "idees",
    titre: "Boîte à idées",
    champs: [
      { cle: "surtitre", libelle: "Surtitre", type: "texte" },
      { cle: "titre", libelle: "Titre", type: "texte" },
      { cle: "texte", libelle: "Texte", type: "zone" },
    ],
  },
  {
    cle: "appel",
    titre: "Appel à adhérer",
    champs: [
      { cle: "titre", libelle: "Titre", type: "texte" },
      { cle: "titre_suite", libelle: "Suite du titre", type: "texte" },
      { cle: "texte", libelle: "Texte", type: "zone" },
      { cle: "bouton", libelle: "Texte du bouton", type: "texte" },
    ],
  },
  {
    cle: "lettre",
    titre: "Lettre d'information",
    champs: [
      { cle: "titre", libelle: "Titre", type: "texte" },
      { cle: "texte", libelle: "Texte", type: "texte" },
      { cle: "mention", libelle: "Mention sous le formulaire", type: "texte" },
    ],
  },
];

export default async function AdminAccueil() {
  await exigerAdmin();
  const supabase = await clientSession();
  const [{ data: blocs }, { data: conseil }] = await Promise.all([
    supabase.from("home_blocks").select("key, content"),
    supabase.from("council_members").select("id, prenom, nom, role, position").order("position"),
  ]);
  const contenu = Object.fromEntries((blocs ?? []).map((b) => [b.key, b.content as Record<string, unknown>]));

  return (
    <>
      <EnTeteAdmin
        titre="Textes de l'accueil"
        actions={
          <LienAdmin href="/" target="_blank" variante="secondaire">
            Voir l&apos;accueil<span className="sr-only"> (nouvel onglet)</span>
          </LienAdmin>
        }
      />
      <nav aria-label="Blocs de l'accueil" className="mb-5 flex flex-wrap gap-2 text-[15px]">
        {BLOCS.map((b) => (
          <Link key={b.cle} href={`#bloc-${b.cle}`} className="rounded-full border-[1.5px] border-bordure-douce bg-white px-3 py-1.5 font-bold text-encre no-underline">
            {b.titre}
          </Link>
        ))}
        <Link href="#conseil" className="rounded-full border-[1.5px] border-bordure-douce bg-white px-3 py-1.5 font-bold text-encre no-underline">
          Conseil collégial
        </Link>
      </nav>
      <p className="mb-5 max-w-[760px] text-encre-2">
        Les actions, l&apos;agenda, les actualités, les idées et la FAQ de l&apos;accueil se gèrent dans leurs rubriques. Les chiffres
        clés se règlent dans « Comptes &amp; paramètres ».
      </p>
      <div className="flex max-w-[1100px] flex-col gap-5">
        {BLOCS.map((b) => (
          <EditeurBloc key={b.cle} cle={b.cle} titre={b.titre} champs={b.champs} initial={contenu[b.cle] ?? {}} />
        ))}
        <section id="conseil" className="scroll-mt-6 rounded-[20px] bg-white px-6 py-6">
          <h2 className="mb-1 font-titre text-xl font-semibold">Conseil collégial</h2>
          <p className="mb-2 text-sm text-encre-3">Affiché sur l&apos;accueil avec les initiales (portraits à venir).</p>
          {(conseil ?? []).map((m) => (
            <LigneMembre key={m.id} id={m.id} prenom={m.prenom} nom={m.nom} role={m.role} position={m.position} />
          ))}
          <h3 className="mt-4 font-bold">Ajouter un membre</h3>
          <LigneMembre id={null} position={(conseil?.length ?? 0) + 1} />
        </section>
      </div>
    </>
  );
}
