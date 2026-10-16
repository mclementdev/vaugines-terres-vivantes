// Crée (ou promeut) un superadmin et affiche son lien personnel pour choisir un mot de passe.
// Usage : node --env-file=.env.local scripts/creer-superadmin.mjs prenom.nom@exemple.fr "Prénom" "Nom"
// (production : --env-file=.env.production.local)
import { createClient } from "@supabase/supabase-js";

const [saisie, prenom = "", nom = ""] = process.argv.slice(2);
const email = saisie?.trim().toLowerCase();
if (!email || !email.includes("@")) {
  console.error('Usage : node --env-file=.env.local scripts/creer-superadmin.mjs email@exemple.fr "Prénom" "Nom"');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const cle = process.env.SUPABASE_SECRET_KEY;
const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
if (!url || !cle) {
  console.error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SECRET_KEY sont requises.");
  process.exit(1);
}

const supabase = createClient(url, cle, { auth: { persistSession: false } });

let id;
const { data, error } = await supabase.auth.admin.createUser({ email, email_confirm: true });
if (error) {
  // Compte déjà existant : on le retrouve pour le promouvoir.
  const { data: liste, error: e2 } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (e2) throw e2;
  id = liste.users.find((u) => u.email?.toLowerCase() === email)?.id;
  if (!id) {
    console.error("Création impossible :", error.message);
    process.exit(1);
  }
  console.log("Compte existant : promotion en superadmin.");
} else {
  id = data.user.id;
  console.log(`Compte créé pour ${email}.`);
}

const { error: e3 } = await supabase.from("profiles").upsert({ id, email, prenom, nom, role: "superadmin", invited_at: new Date().toISOString() });
if (e3) throw e3;
console.log("Profil superadmin enregistré.");

const { data: lien, error: e4 } = await supabase.auth.admin.generateLink({ type: "recovery", email });
if (e4) throw e4;
console.log("\nOuvrez ce lien pour choisir votre mot de passe (valable une heure, une seule fois) :\n");
console.log(`${site}/auth/confirm?token_hash=${lien.properties.hashed_token}&type=recovery&next=/admin/mot-de-passe\n`);
