import { expect, test } from "@playwright/test";

import { anonyme, seConnecter, supprimerComptesTest } from "./outils";

test.afterAll(supprimerComptesTest);

test("un visiteur n'accède ni à l'administration ni aux données personnelles", async ({ page, request }) => {
  await page.goto("/admin/adherents");
  await expect(page).toHaveURL(/\/admin\/connexion/);

  const csv = await request.get("/admin/adherents/export.csv", {
    maxRedirects: 0,
  });
  expect(csv.headers()["content-type"] ?? "").not.toContain("text/csv");

  // Lecture directe de la base avec la clé publique : rien ne sort (RLS).
  for (const table of ["members", "member_private", "contributions", "newsletter_subscribers", "event_registrations", "idea_followers", "profiles"]) {
    const { data } = await anonyme.from(table).select("*").limit(1);
    expect(data ?? [], `table ${table}`).toEqual([]);
  }
  // Idées : seules les idées publiées sont lisibles.
  const { data: idees } = await anonyme.from("ideas").select("moderation");
  expect((idees ?? []).every((i) => i.moderation === "published")).toBe(true);
});

test("un compte sans rôle est refusé", async ({ page }) => {
  await seConnecter(page, "aucun");
  await expect(page).toHaveURL(/\/admin\/connexion/);
  await page.goto("/admin/adherents");
  await expect(page).toHaveURL(/\/admin\/connexion/);
});

test("un admin gère les adhérents mais pas les comptes", async ({ page }) => {
  await seConnecter(page, "admin");
  await page.goto("/admin/adherents");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Adhérents");
  await page.goto("/admin/comptes");
  await expect(page).toHaveURL(/refus=superadmin/);
});

test("le superadmin accède aux comptes", async ({ page }) => {
  await seConnecter(page, "superadmin");
  await page.goto("/admin/comptes");
  await expect(page).toHaveURL(/\/admin\/comptes/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
