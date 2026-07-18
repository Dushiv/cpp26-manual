import { test, expect } from "@playwright/test";

test("course picker shows when no active-course set", async ({ page }) => {
  await page.goto("/prototype/index.html");
  await expect(page.locator(".picker")).toBeVisible({ timeout: 5000 });
  await expect(page.locator(".picker-card")).toHaveCount(3);
});

test("clicking C++26 card enters the course", async ({ page }) => {
  await page.goto("/prototype/index.html");
  await page.locator(".picker-card").filter({ hasText: "C++26" }).click();
  await expect(page.locator(".topbar")).toBeVisible({ timeout: 15000 });
  await expect(page.locator(".topbar")).toContainText("C++26");
});

test("clicking C++23 card attempts to load the course", async ({ page }) => {
  await page.goto("/prototype/index.html");
  await page.locator(".picker-card").filter({ hasText: "C++23" }).click();
  // Either loads successfully or shows a load error (stubs created in Task 6)
  await expect(
    page.locator(".topbar, .empty-big").first()
  ).toBeVisible({ timeout: 15000 });
});

test("C++20 card is disabled (click does nothing)", async ({ page }) => {
  await page.goto("/prototype/index.html");
  await page.locator(".picker-card").filter({ hasText: "C++20" }).click();
  await expect(page.locator(".picker")).toBeVisible();
});

test("existing C++26 user skips picker", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("active-course", "cpp26");
  });
  await page.goto("/prototype/index.html");
  await expect(page.locator(".topbar")).toBeVisible({ timeout: 15000 });
  await expect(page.locator(".picker")).toHaveCount(0);
});

test("← Все курсы link returns to picker and clears active-course", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("active-course", "cpp26");
  });
  await page.goto("/prototype/index.html");
  await expect(page.locator(".topbar")).toBeVisible({ timeout: 15000 });

  await page.locator(".back-btn").click();
  await expect(page.locator(".picker")).toBeVisible();

  const storedCourse = await page.evaluate(() => localStorage.getItem("active-course"));
  expect(storedCourse).toBeNull();
});
