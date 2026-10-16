import { defineConfig, devices } from "@playwright/test";

// Clés de la base locale, pour préparer et nettoyer les données de test.
try {
  process.loadEnvFile(".env.local");
} catch {}

/**
 * Tests de bout en bout, sur la base locale (npm run db:start) et le serveur de développement.
 * Les e-mails partent vers Mailpit, dont l'API sert à récupérer les liens envoyés.
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    locale: "fr-FR",
    timezoneId: "Europe/Paris",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    {
      name: "ordinateur",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /accessibilite/,
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
