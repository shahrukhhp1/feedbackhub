import { test, expect } from "@playwright/test";

const hasServer =
  Boolean(process.env.PLAYWRIGHT_BASE_URL) || Boolean(process.env.CI);

test.describe("Feedback Hub smoke tests", () => {
  test.skip(!hasServer, "Set PLAYWRIGHT_BASE_URL or run with the Playwright webServer enabled");

  test("live health endpoint responds", async ({ request }) => {
    const response = await request.get("/api/health/live");
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body).toEqual({ status: "ok" });
    expect(response.headers()["x-request-id"]).toBeTruthy();
  });

  test("ready health endpoint responds", async ({ request }) => {
    const response = await request.get("/api/health/ready");
    expect([200, 503]).toContain(response.status());

    const body = await response.json();
    expect(body).toHaveProperty("status");
  });

  test("home page loads", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible();
  });
});
