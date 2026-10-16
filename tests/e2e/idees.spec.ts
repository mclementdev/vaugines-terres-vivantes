import { expect, test } from "@playwright/test";

import { agentUnique } from "./outils";

test.use({ userAgent: agentUnique });

test("soutenir une idée, retrouver son soutien, le retirer", async ({ page }) => {
  await page.goto("/idees/grainotheque-bibliotheque");
  const bouton = page.getByRole("button", { name: /^Soutenir l'idée/ }).first();
  await expect(bouton).toHaveAttribute("aria-pressed", "false");
  const avant = Number((await bouton.getAttribute("aria-label"))!.match(/(\d+) soutien/)![1]);

  await bouton.click();
  const retirer = page.getByRole("button", { name: /^Retirer mon soutien/ }).first();
  await expect(retirer).toHaveAttribute("aria-pressed", "true");
  await expect(retirer).toHaveAttribute("aria-label", new RegExp(`${avant + 1} soutien`));

  // Le soutien est mémorisé (cookie) et compté côté serveur.
  await page.reload();
  await expect(page.getByRole("button", { name: /^Retirer mon soutien/ }).first()).toHaveAttribute("aria-label", new RegExp(`${avant + 1} soutien`));

  await page
    .getByRole("button", { name: /^Retirer mon soutien/ })
    .first()
    .click();
  await expect(page.getByRole("button", { name: /^Soutenir l'idée/ }).first()).toHaveAttribute("aria-label", new RegExp(`${avant} soutien`));
});
