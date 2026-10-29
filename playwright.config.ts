import { defineConfig, devices } from "@playwright/test";

// E2E runs against its own SQLite file so test registrations never touch dev/demo data.
const env = { ...process.env, DATABASE_URL: "file:./e2e.db", ADMIN_KEY: "" } as Record<string, string>;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60000,
  workers: 1,
  use: { baseURL: "http://localhost:3100" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npx prisma db push --skip-generate --force-reset && npx next start -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 120000,
    env,
  },
});
