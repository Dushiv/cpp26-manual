import { test, expect } from "@playwright/test";

test("challenge editor is pre-filled with the starter scaffold", async ({ page }) => {
  await page.goto("/prototype/index.html");
  await expect(page.locator(".card.ex").first()).toBeVisible();
  const editor = page.locator(".chal-editor");
  const value = await editor.inputValue();
  expect(value).toContain("int main()");      // driver present
  expect(value).toContain("// твой код");      // stub present
  expect(value.trim().length).toBeGreaterThan(0);
});

test("reset link restores the scaffold after edits", async ({ page }) => {
  await page.goto("/prototype/index.html");
  await expect(page.locator(".card.ex").first()).toBeVisible();
  const editor = page.locator(".chal-editor");
  const original = await editor.inputValue();
  await editor.fill("garbage");
  await page.getByRole("button", { name: "Сбросить к началу" }).click();
  expect(await editor.inputValue()).toBe(original);
});
