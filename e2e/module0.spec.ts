import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/prototype/index.html");
  await page.getByRole("listitem").filter({ hasText: "Контекст C++26" }).click();
});

test("m0-l1 renders theory, exercises, and mastery check without an empty Примеры section", async ({ page }) => {
  await expect(page.locator("h1")).toContainText("Контекст C++26");
  await expect(page.getByRole("heading", { name: "Примеры" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Упражнения" })).toBeVisible();
  await expect(page.locator(".card.ex")).toHaveCount(2);
  await expect(page.getByRole("heading", { name: /Проверка усвоения/ })).toBeVisible();
});

test("m1-l1 still renders its Примеры section", async ({ page }) => {
  await page.getByRole("listitem").filter({ hasText: "Pack indexing" }).click();
  await expect(page.getByRole("heading", { name: "Примеры" })).toBeVisible();
});
