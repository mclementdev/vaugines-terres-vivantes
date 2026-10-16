import { expect, test } from "@playwright/test";

import { adresseTest, agentUnique, attendreEmail, db, effacerEmails } from "./outils";

test.use({ userAgent: agentUnique });

const email = adresseTest("adhesion");

test.afterAll(async () => {
  await db.from("members").delete().eq("email", email);
  await effacerEmails(email);
});

test("adhésion en ligne de bout en bout", async ({ page }) => {
  await page.goto("/adherer");

  // Étape 1 : cotisation libre, 20 €.
  await page.getByRole("radio", { name: /cotisation de mon choix/ }).check();
  await page.getByRole("button", { name: "20 €" }).click();
  await page.getByRole("button", { name: "Continuer" }).click();

  // Étape 2 : coordonnées ; un champ obligatoire vide est signalé.
  await page.getByLabel("Nom", { exact: false }).first().fill("Testeur");
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page.getByLabel(/^Prénom/)).toHaveAttribute("aria-invalid", "true");
  await page.getByLabel(/^Prénom/).fill("Camille");
  await page.getByLabel(/^E-mail/).fill(email);
  await page.getByLabel(/^Téléphone/).fill("06 12 34 56 78");
  await page.getByLabel(/^Commune/).fill("Vaugines");
  await page.getByRole("button", { name: "Continuer" }).click();

  // Étape 3 : engagements obligatoires.
  await page.getByRole("button", { name: "Valider mon adhésion" }).click();
  await expect(page.getByRole("checkbox", { name: /statuts/ })).toHaveAttribute("aria-invalid", "true");
  await page.getByRole("checkbox", { name: /statuts/ }).check();
  await page.getByRole("checkbox", { name: /J'accepte que mes données/ }).check();
  await page.getByRole("button", { name: "Valider mon adhésion" }).click();

  await expect(page).toHaveURL(/\/adherer\/merci/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Bienvenue dans l'association, Camille");

  // Enregistrement : téléphone à part, jamais dans la table des adhérents.
  const { data: m } = await db.from("members").select("id, prenom, source").eq("email", email).single();
  expect(m).toMatchObject({ prenom: "Camille", source: "en_ligne" });
  const { data: c } = await db.from("contributions").select("amount_cents, status").eq("member_id", m!.id).single();
  expect(c).toMatchObject({ amount_cents: 2000 });

  // E-mail de bienvenue, statuts en pièce jointe.
  const bienvenue = await attendreEmail(email, /Bienvenue/);
  expect(bienvenue.Attachments.map((a) => a.FileName)).toContain("statuts-vtv.pdf");
});
