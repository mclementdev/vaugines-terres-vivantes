import { expect, test } from "@playwright/test";

import { adresseTest, agentUnique, attendreEmail, db, effacerEmails, seConnecter, supprimerComptesTest } from "./outils";

test.use({ userAgent: agentUnique });

const email = adresseTest("e2e-nouveau");
const motDePasse = "une phrase assez longue pour tester";

test.afterAll(async () => {
  const { data } = await db.auth.admin.listUsers({ perPage: 1000 });
  const u = data.users.find((x) => x.email === email);
  if (u) await db.auth.admin.deleteUser(u.id);
  await effacerEmails(email);
  await supprimerComptesTest();
});

test("le superadmin crée un compte ; la personne choisit son mot de passe puis se connecte", async ({ page, browser }) => {
  await seConnecter(page, "superadmin");
  await page.goto("/admin/comptes");
  await page.getByLabel("E-mail *").fill(email);
  await page.getByLabel("Prénom *").fill("Dominique");
  await page.getByRole("button", { name: "Créer le compte" }).click();
  const champLien = page.getByLabel("Lien de connexion");
  await expect(champLien).toBeVisible();
  const lienAffiche = new URL(await champLien.inputValue());

  // Le même lien part par e-mail.
  const courriel = await attendreEmail(email, /accès à l'administration/);
  expect(courriel.HTML).toContain("type=recovery");

  // Nouvelle session : la personne ouvre son lien et choisit son mot de passe.
  const autre = await browser.newContext();
  const p = await autre.newPage();
  await p.goto(lienAffiche.pathname + lienAffiche.search);
  await expect(p).toHaveURL(/\/admin\/mot-de-passe/);
  await p.getByLabel("Nouveau mot de passe").fill("court");
  await p.getByLabel("Confirmation").fill("court");
  await p.getByRole("button", { name: "Enregistrer le mot de passe" }).click();
  await expect(p.getByText("12 caractères au minimum.").last()).toBeVisible();
  await p.getByLabel("Nouveau mot de passe").fill(motDePasse);
  await p.getByLabel("Confirmation").fill(motDePasse);
  await p.getByRole("button", { name: "Enregistrer le mot de passe" }).click();
  await expect(p.getByText("Mot de passe enregistré")).toBeVisible();

  // Le lien ne sert qu'une fois.
  const p2 = await (await browser.newContext()).newPage();
  await p2.goto(lienAffiche.pathname + lienAffiche.search);
  await expect(p2).toHaveURL(/erreur=lien/);
  await p2.waitForLoadState("networkidle");

  // Connexion par mot de passe : erreur, puis succès.
  await p2.getByLabel(/^Adresse e-mail/).fill(email);
  await p2.getByLabel(/^Mot de passe/).fill("pas le bon mot de passe");
  await p2.getByRole("button", { name: "Se connecter" }).click();
  await expect(p2.getByText("Adresse e-mail ou mot de passe incorrect.")).toBeVisible();
  await p2.getByLabel(/^Mot de passe/).fill(motDePasse);
  await p2.getByRole("button", { name: "Se connecter" }).click();
  await expect(p2).toHaveURL(/\/admin$/);
  await autre.close();
});
