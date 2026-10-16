import { expect, test } from "@playwright/test";

import { adresseTest, agentUnique, attendreEmail, db, effacerEmails, lien } from "./outils";

test.use({ userAgent: agentUnique });

const email = adresseTest("inscription");
const slug = "balade-decouverte-participative-de-vaugines";

test.afterAll(async () => {
  await db.from("event_registrations").delete().eq("email", email);
  await effacerEmails(email);
});

test("inscription à un événement, puis modification et annulation", async ({ page }) => {
  // Places déjà prises, lues en base (la page peut être en cache après un test interrompu).
  const { data: e } = await db.from("events").select("id").eq("slug", slug).single();
  const { data: avant } = await db.rpc("places_prises", { p_event_id: e!.id });

  await page.goto(`/evenements/${slug}`);

  await page.getByLabel("Prénom et nom").fill("Camille Testeur");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Nombre de personnes").selectOption("2");
  await page.getByRole("button", { name: "Valider mon inscription" }).click();
  await expect(page.getByRole("status").filter({ hasText: "C'est noté" })).toBeVisible();

  // Jauge à jour au rechargement.
  await page.reload();
  await expect(page.getByText(`${avant! + 2} /`).first()).toBeVisible();

  // Une seule inscription enregistrée, pour 2 personnes.
  const { data: inscrits } = await db.from("event_registrations").select("places").eq("email", email);
  expect(inscrits).toEqual([{ places: 2 }]);

  // Lien de gestion reçu par e-mail : passage à 1 personne, puis annulation.
  const confirmation = await attendreEmail(email, /inscription|C'est noté/i);
  await page.goto(lien(confirmation.HTML, "/evenements/inscription/"));
  await page.getByLabel("Nombre de personnes").selectOption("1");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Inscrit·e · 1 personne")).toBeVisible();
  await page.getByRole("button", { name: "Annuler mon inscription" }).click();
  await expect(page.getByText("Inscription annulée")).toBeVisible();
  await attendreEmail(email, /annul/i);

  await page.goto(`/evenements/${slug}`);
  await expect(page.getByText(`${avant} /`).first()).toBeVisible();
});
