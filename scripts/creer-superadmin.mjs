// Crée (ou promeut) le premier superadmin et lui envoie une invitation.
// Usage : node --env-file=.env.local scripts/creer-superadmin.mjs prenom.nom@exemple.fr "Prénom" "Nom"
import { createClient } from "@supabase/supabase-js";

const [email, prenom = "", nom = ""] = process.argv.slice(2);
if (!email || !email.includes("@")) {
  console.error('Usage : node --env-file=.env.local scripts/creer-superadmin.mjs email@exemple.fr "Prénom" "Nom"');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const cle = process.env.SUPABASE_SECRET_KEY;
const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
if (!url || !cle) {
  console.error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SECRET_KEY sont requises.");
  process.exit(1);
}

const supabase = createClient(url, cle, { auth: { persistSession: false } });

let id;
const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, { redirectTo: `${site}/admin` });
if (error) {
  // Compte déjà existant : on le retrouve pour le promouvoir.
  const { data: liste, error: e2 } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (e2) throw e2;
  id = liste.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id;
  if (!id) {
    console.error("Invitation impossible :", error.message);
    process.exit(1);
  }
  console.log("Compte existant : promotion en superadmin.");
} else {
  id = data.user.id;
  console.log(`Invitation envoyée à ${email}.`);
}

const { error: e3 } = await supabase
  .from("profiles")
  .upsert({ id, email, prenom, nom, role: "superadmin", invited_at: new Date().toISOString() });
if (e3) throw e3;
console.log("Profil superadmin enregistré.");
