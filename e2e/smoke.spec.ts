import { test, expect } from "@playwright/test";

test("engine loads and renders course title", async ({ page }) => {
  await page.goto("/index.html");
  await expect(page.locator("#root")).toContainText("C++26", { timeout: 15000 });
});
