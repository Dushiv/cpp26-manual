import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/prototype/index.html");
  await expect(page.locator(".card.ex").first()).toBeVisible();
});

test("sidebar navigation switches between lessons", async ({ page }) => {
  await page.getByRole("listitem").filter({ hasText: "delete" }).click();
  await expect(page.locator("h1")).toContainText("delete");
  await expect(page.locator(".empty-big")).toContainText("ещё не написан");

  await page.getByRole("listitem").filter({ hasText: "Pack indexing" }).click();
  await expect(page.locator("h1")).toContainText("Pack indexing");
  await expect(page.getByRole("heading", { name: "Упражнения" })).toBeVisible();
});

test("predict-output exercise: correct answer shows verdict", async ({ page }) => {
  const exercise = page.locator(".card.ex").nth(0);
  await exercise.locator(".inp").fill("7");
  await exercise.getByRole("button", { name: "Проверить" }).click();
  await expect(exercise.locator(".verdict")).toHaveText("Верно");
  await expect(exercise.locator(".verdict")).toHaveClass(/ok/);
});

test("choice exercise: correct option is highlighted", async ({ page }) => {
  const exercise = page.locator(".card.ex").nth(2);
  const options = exercise.locator(".opts .opt");
  await options.nth(2).click();
  await expect(options.nth(2)).toHaveClass(/ok/);
});

test("skipping and unskipping an exercise updates the review zone", async ({ page }) => {
  const exercise = page.locator(".card.ex").nth(1);

  await expect(page.locator(".rep-n")).toHaveText("0");

  await exercise.getByRole("button", { name: "Пропустить" }).click();
  await expect(exercise.locator(".badge-skip")).toHaveText("Пропущено");
  await expect(page.locator(".rep-n")).toHaveText("1");

  await exercise.getByRole("button", { name: "Отменить пропуск" }).click();
  await expect(exercise.locator(".badge-skip")).toHaveCount(0);
  await expect(page.locator(".rep-n")).toHaveText("0");
});

test("progress persists across reload", async ({ page }) => {
  const exercise = page.locator(".card.ex").nth(1);
  await exercise.getByRole("button", { name: "Пропустить" }).click();
  await expect(page.locator(".rep-n")).toHaveText("1");

  await page.reload();
  await expect(page.locator(".card.ex").first()).toBeVisible();

  await expect(page.locator(".rep-n")).toHaveText("1");
  await expect(page.locator(".card.ex").nth(1).locator(".badge-skip")).toHaveText("Пропущено");
});
