// Captures README screenshots from a running server: `npm start` then `node scripts/screenshots.mjs`.
import { chromium } from "@playwright/test";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const shots = [
  ["landing", "/", { width: 1366, height: 900 }, "light"],
  ["dashboard", "/dashboard", { width: 1440, height: 1500 }, "light"],
  ["dashboard-dark", "/dashboard", { width: 1440, height: 1500 }, "dark"],
  ["ambassador", "/ambassador", { width: 1366, height: 900 }, "light"],
  ["plan", "/plan", { width: 1366, height: 1100 }, "light"],
  ["mobile-landing", "/", { width: 390, height: 844 }, "light"],
  ["mobile-dashboard", "/dashboard", { width: 390, height: 1400 }, "dark"],
];

const browser = await chromium.launch();
for (const [name, path, viewport, scheme] of shots) {
  const page = await browser.newPage({ viewport, colorScheme: scheme });
  await page.goto(base + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `docs/screenshots/${name}.png` });
  await page.close();
  console.log("saved", name);
}
await browser.close();
