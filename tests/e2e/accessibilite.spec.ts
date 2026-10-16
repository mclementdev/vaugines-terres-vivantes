import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { db, seConnecter, supprimerComptesTest } from "./outils";

test.afterAll(supprimerComptesTest);

/** Violations WCAG 2.1 AA relevées par axe sur une liste de pages. */
async function auditer(page: Page, urls: string[]) {
  const problemes: string[] = [];
  for (const url of urls) {
    await page.goto(url);
    await page.waitForLoadState("networkidle");
    const { violations } = await new AxeBuilder({ page })
      // Le logotype est exempté de l'exigence de contraste (WCAG 1.4.3).
      .exclude("[data-logotype]")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    for (const v of violations) {
      problemes.push(
        `${url} · ${v.id} (${v.impact}) · ${v.help}\n    ${v.nodes
          .slice(0, 3)
          .map((n) => n.target.join(" "))
          .join("\n    ")}`,
      );
    }
  }
  return problemes;
}

test("site public : aucune violation WCAG AA détectée par axe", async ({ page, request }) => {
  test.setTimeout(300_000);
  const xml = await (await request.get("/sitemap.xml")).text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  urls.push("/admin/connexion", "/page-qui-n-existe-pas");
  const problemes = await auditer(page, urls);
  expect(problemes, problemes.join("\n")).toEqual([]);
});

test("administration : aucune violation WCAG AA détectée par axe", async ({ page }) => {
  test.setTimeout(300_000);
  await seConnecter(page, "superadmin");
  const [{ data: m }, { data: e }, { data: a }] = await Promise.all([
    db.from("members").select("id").limit(1).single(),
    db.from("events").select("id").limit(1).single(),
    db.from("articles").select("id").limit(1).single(),
  ]);
  const urls = [
    "/admin",
    "/admin/accueil",
    "/admin/adherents",
    "/admin/adherents/nouveau",
    `/admin/adherents/${m!.id}`,
    "/admin/articles",
    `/admin/articles/${a!.id}`,
    "/admin/evenements",
    `/admin/evenements/${e!.id}`,
    "/admin/actions",
    "/admin/faq",
    "/admin/glossaire",
    "/admin/veille",
    "/admin/moderation",
    "/admin/moderation?vue=statuts",
    "/admin/moderation?vue=historique",
    "/admin/comptes",
  ];
  const problemes = await auditer(page, urls);
  expect(problemes, problemes.join("\n")).toEqual([]);
});

test("clavier : lien d'évitement vers le contenu", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Aller au contenu" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#contenu$/);
});

test("clavier : menu mobile (focus piégé, Échap)", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Menu en tiroir : mobile uniquement.");
  await page.goto("/");
  const bouton = page.getByRole("button", { name: "Ouvrir le menu" });
  await bouton.focus();
  await page.keyboard.press("Enter");
  const tiroir = page.getByRole("dialog");
  await expect(tiroir).toBeVisible();
  for (let i = 0; i < 15; i++) await page.keyboard.press("Tab");
  expect(await tiroir.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(tiroir).toBeHidden();
  await expect(bouton).toBeFocused();
});
