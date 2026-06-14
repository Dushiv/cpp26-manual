import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/prototype/index.html");
  await expect(page.locator(".card.ex").first()).toBeVisible();
});

test("switching locale changes UI chrome and lesson content", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Упражнения" })).toBeVisible();

  await page.locator(".locale-btn", { hasText: "EN" }).click();

  // m1-l1 (the default lesson) is still a stub in content/modules/en/m1.json
  // at this point in the plan (Task 10 fills it in), so switching to EN
  // replaces the exercises with the "lesson not written yet" placeholder —
  // in English. The Russian "Упражнения" heading must disappear either way.
  await expect(page.getByRole("heading", { name: "Упражнения" })).toHaveCount(0);
  await expect(page.getByText("This lesson isn't written yet.")).toBeVisible();

  // its title "Pack indexing" is unchanged across locales, so check a string
  // that does change: the sidebar module title.
  await expect(page.locator(".mod-t").first()).toHaveText("C++26 context");
});

test("locale choice persists across reload", async ({ page }) => {
  await page.locator(".locale-btn", { hasText: "EN" }).click();
  await expect(page.getByText("This lesson isn't written yet.")).toBeVisible();

  await page.reload();
  await expect(page.getByText("This lesson isn't written yet.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Упражнения" })).toHaveCount(0);
});
