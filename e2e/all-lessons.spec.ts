import { test, expect } from "@playwright/test";

// Guards against a single malformed lesson/exercise blanking the page (as a
// find-bug exercise missing its `code` field once did for m6-l4): click through
// every lesson in the sidebar and assert each renders its heading with no
// uncaught error.
test("every lesson opens without a runtime error", async ({ page }) => {
  const errs: string[] = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.addInitScript(() => { localStorage.setItem("active-course", "cpp26"); });
  await page.goto("/prototype/index.html");
  await expect(page.locator("main h1")).toBeVisible();

  const items = page.locator(".side nav li");
  const n = await items.count();
  expect(n).toBeGreaterThan(30); // sanity: the sidebar actually listed lessons

  for (let i = 0; i < n; i++) {
    const title = (await items.nth(i).innerText()).replace(/\s+/g, " ").trim();
    await items.nth(i).click();
    await expect(page.locator("main h1"), `lesson #${i} "${title}" should render a heading`).toBeVisible();
    if (errs.length) throw new Error(`runtime error after opening lesson #${i} "${title}": ${errs[0]}`);
  }
  expect(errs).toEqual([]);
});
