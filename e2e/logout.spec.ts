import { test, expect } from "@playwright/test";

// Mock Supabase: starts signed-in with an empty cloud blob; signOut() fires the
// auth-change callback with null (as real Supabase does) so the app's
// handleSession(null) path runs. __cloudSynced flips true after the login sync.
async function installSignedInMock(page) {
  await page.route("**/@supabase/**", (r) => r.abort());
  await page.addInitScript(() => {
    (window as any).__cloudSynced = false;
    let authCb: any = null;
    let currentSession: any = { user: { id: "test-user" } };
    const emptyBlob = { cur: "m1-l1", view: "lesson", exStatus: {}, mastery: {}, strict: false, locale: "ru" };
    Object.defineProperty(window, "supabase", {
      configurable: false, writable: false,
      value: {
        createClient() {
          return {
            auth: {
              getSession: () => Promise.resolve({ data: { session: currentSession } }),
              onAuthStateChange: (cb: any) => { authCb = cb; return { data: { subscription: { unsubscribe() {} } } }; },
              signInWithOAuth: () => Promise.resolve({ error: null }),
              signOut: () => { currentSession = null; if (authCb) authCb("SIGNED_OUT", null); return Promise.resolve({ error: null }); },
            },
            from() {
              const qb: any = {
                select: () => qb, eq: () => qb,
                maybeSingle: () => Promise.resolve({ data: { blob: emptyBlob }, error: null }),
                upsert: () => { (window as any).__cloudSynced = true; return Promise.resolve({}); },
              };
              return qb;
            },
          };
        },
      },
    });
  });
}

test("signing out clears local progress", async ({ page }) => {
  await installSignedInMock(page);
  await page.goto("/prototype/index.html");
  await expect(page.locator(".card.ex").first()).toBeVisible();
  await page.waitForFunction(() => (window as any).__cloudSynced === true); // login sync settled

  // earn a pass on m1-l1
  const mastery = page.locator(".mastery");
  const correct = [1, 2, 3, 1];
  for (let i = 0; i < 4; i++) await mastery.locator(".mq").nth(i).locator(".opt").nth(correct[i]).click();
  await mastery.getByRole("button", { name: "Завершить проверку" }).click();
  const pack = page.getByRole("listitem").filter({ hasText: "Pack indexing" });
  await expect(pack.locator("svg.i-done")).toHaveCount(1);

  // sign out
  await page.getByRole("button", { name: "Выйти" }).click();

  // progress must be cleared: lesson no longer done, localStorage mastery empty
  await expect(pack.locator("svg.i-done")).toHaveCount(0);
  const mref = await page.evaluate(() => {
    const raw = localStorage.getItem("cpp26-progress");
    return raw ? JSON.parse(raw).data.mastery : null;
  });
  expect(mref).toEqual({});
});
