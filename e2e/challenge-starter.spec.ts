import { test, expect } from "@playwright/test";

test("challenge editor is pre-filled with the starter scaffold", async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("active-course", "cpp26"); });
  await page.goto("/prototype/index.html");
  await expect(page.locator(".card.ex").first()).toBeVisible();
  const editor = page.locator(".chal-editor");
  const value = await editor.inputValue();
  expect(value).toContain("int main()");      // driver present
  expect(value).toContain("// твой код");      // stub present
  expect(value.trim().length).toBeGreaterThan(0);
});

test("reset link restores the scaffold after edits", async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("active-course", "cpp26"); });
  await page.goto("/prototype/index.html");
  await expect(page.locator(".card.ex").first()).toBeVisible();
  const editor = page.locator(".chal-editor");
  const original = await editor.inputValue();
  await editor.fill("garbage");
  await page.getByRole("button", { name: "Сбросить к началу" }).click();
  expect(await editor.inputValue()).toBe(original);
});

test("filling m1-l1 with the reference solution matches via Сверить @network", async ({ page }) => {
  test.setTimeout(60000);
  await page.addInitScript(() => { localStorage.setItem("active-course", "cpp26"); });
  await page.goto("/prototype/index.html");
  await expect(page.locator(".card.ex").first()).toBeVisible();
  const ref =
    "#include <print>\n#include <cstddef>\n\ntemplate <std::size_t N, typename... Ts>\nconstexpr auto nth(Ts... ts) { return ts...[N]; }\n\nint main() {\n    std::print(\"{}\\n\", nth<1>(10, 20, 30));\n}";
  await page.locator(".chal-editor").fill(ref);
  await page.getByRole("button", { name: "Сверить" }).click();
  await expect(page.locator(".verdict.ok")).toBeVisible({ timeout: 45000 });
});
