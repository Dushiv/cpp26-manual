import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("active-course", "cpp26"); });
  await page.goto("/prototype/index.html");
  await expect(page.locator(".card.ex").first()).toBeVisible();
});

test("sidebar navigation switches between lessons", async ({ page }) => {
  await page.getByRole("listitem").filter({ hasText: "Удалённые и устаревшие" }).click();
  await expect(page.locator("h1")).toContainText("Удалённые");
  await expect(page.getByRole("heading", { name: "Упражнения" })).toBeVisible();

  await page.getByRole("listitem").filter({ hasText: "Pack indexing" }).click();
  await expect(page.locator("h1")).toContainText("Pack indexing");
  await expect(page.getByRole("heading", { name: "Упражнения" })).toBeVisible();
});

test("scroll resets to top when switching lessons", async ({ page }) => {
  await page.evaluate(() => window.scrollTo(0, 500));
  const scrollBefore = await page.evaluate(() => window.scrollY);
  expect(scrollBefore).toBeGreaterThan(0);

  await page.getByRole("listitem").filter({ hasText: "Удалённые и устаревшие" }).click();
  await expect(page.locator("h1")).toContainText("Удалённые");
  const scrollAfter = await page.evaluate(() => window.scrollY);
  expect(scrollAfter).toBe(0);
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

test("mastery check highlights correct and wrong-picked options after submit", async ({ page }) => {
  const mastery = page.locator(".mastery");
  const questions = mastery.locator(".mq");
  const count = await questions.count();
  expect(count).toBeGreaterThan(0);

  // m1-l1: no question has its answer at index 0, so picking the first option
  // everywhere makes every pick wrong — yielding one .no (wrong pick) and one
  // .ok (the correct answer) per question after submit.
  for (let i = 0; i < count; i++) {
    await questions.nth(i).locator(".opt").first().click();
  }
  await mastery.getByRole("button", { name: "Завершить проверку" }).click();

  await expect(mastery.locator(".opt.ok")).toHaveCount(count);
  await expect(mastery.locator(".opt.no")).toHaveCount(count);
});

test("answered exercise restores its verdict after reload", async ({ page }) => {
  const exercise = page.locator(".card.ex").nth(0);
  await exercise.locator(".inp").fill("7");
  await exercise.getByRole("button", { name: "Проверить" }).click();
  await expect(exercise.locator(".verdict")).toHaveText("Верно");

  await page.reload();
  await expect(page.locator(".card.ex").first()).toBeVisible();

  await expect(page.locator(".card.ex").nth(0).locator(".verdict")).toHaveText("Верно");
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
