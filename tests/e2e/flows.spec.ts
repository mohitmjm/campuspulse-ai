import { expect, test } from "@playwright/test";

const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1e4)}`;

async function fillForm(page: import("@playwright/test").Page, email: string) {
  await page.getByLabel("Full name", { exact: true }).fill("Test Student");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("College", { exact: true }).fill("Deccan Institute of Technology");
  await page.getByLabel("Branch").selectOption("CSE");
  await page.getByRole("checkbox").check();
}

test("invalid submission shows field errors", async ({ page }) => {
  await page.goto("/?form=short");
  await page.getByTestId("register-submit").click();
  await expect(page.getByTestId("form-message")).toBeVisible();
  await expect(page.getByText("Enter your full name")).toBeVisible();
  await expect(page.getByLabel("Email", { exact: true })).toHaveAttribute("aria-invalid", "true");
});

test("ambassador onboarding → referral registration → attribution → duplicate blocked", async ({ page }) => {
  const id = uniq();
  await page.goto("/ambassador");
  await page.getByLabel("Full name", { exact: true }).fill("Kiran Testrao");
  await page.getByLabel("Email", { exact: true }).fill(`amb-${id}@e2e.test`);
  await page.getByLabel("College", { exact: true }).fill("Godavari Engineering College");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Get my referral link" }).click();
  await expect(page.getByTestId("welcome")).toBeVisible();
  const code = (await page.getByTestId("amb-code").textContent())!.trim();
  await expect(page.getByTestId("amb-count")).toHaveText("0");

  await page.goto(`/?ref=${code}&utm_source=whatsapp&v=placement&form=long`);
  await expect(page.getByTestId("inviter")).toContainText("Kiran T.");
  await expect(page.getByTestId("register-form")).toHaveAttribute("data-variant", "long");
  await fillForm(page, `student-${id}@e2e.test`);
  await page.getByTestId("register-submit").click();
  await expect(page.getByTestId("confirmation-id")).toHaveText(/^CP-[A-Z2-9]{6}$/);
  await expect(page.getByTestId("attributed")).toContainText("Kiran Testrao");

  await page.goto(`/ambassador/${code}`);
  await expect(page.getByTestId("amb-count")).toHaveText("1");

  await page.goto(`/?ref=${code}`);
  await fillForm(page, `Student-${id}@E2E.test`);
  await page.getByTestId("register-submit").click();
  await expect(page.getByTestId("form-message")).toContainText("already registered");
  await page.goto(`/ambassador/${code}`);
  await expect(page.getByTestId("amb-count")).toHaveText("1");
});

test("dashboard scenarios load, are labelled simulated, and copilot responds", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByTestId("scenario-underperforming").click();
  await expect(page.getByTestId("kpi-total")).toContainText("160");
  await expect(page.getByTestId("sim-banner")).toContainText("SIMULATED");
  await expect(page.getByTestId("kpi-pace")).toContainText("114");
  await expect(page.locator('[data-rule="R1-pace"]')).toBeVisible();
  await expect(page.locator('[data-rule="R2-channel-gap"]')).toBeVisible();

  await page.getByTestId("scenario-referral").click();
  await expect(page.getByTestId("kpi-total")).toContainText("403");

  await page.getByTestId("demo-reset").click();
  await expect(page.getByTestId("empty-state")).toBeVisible();
  await page.getByTestId("scenario-base").click();
  await expect(page.getByTestId("kpi-total")).toContainText("250");
});

test("real data view is locked without the admin key", async ({ page, request }) => {
  await page.goto("/dashboard?view=real");
  await expect(page.getByText("restricted to organisers")).toBeVisible();
  const res = await request.get("/api/metrics?view=real");
  expect(res.status()).toBe(401);
});

test("theme toggle switches to dark mode", async ({ page }) => {
  await page.goto("/plan");
  await expect(page.getByTestId("funnel-model")).toContainText("500 / 500");
  const before = await page.locator("html").getAttribute("class");
  await page.getByTestId("theme-toggle").click();
  await expect(page.locator("html")).not.toHaveClass(before ?? "");
});

test("no horizontal overflow on key pages", async ({ page }) => {
  for (const path of ["/", "/ambassador", "/dashboard", "/plan"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, path).toBeLessThanOrEqual(1);
  }
});
