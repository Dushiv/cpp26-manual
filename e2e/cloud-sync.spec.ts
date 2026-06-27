import { test, expect } from "@playwright/test";

// These tests mock window.supabase so the cloud-sync path runs deterministically
// with a controllable "cloud" blob. They guard two regressions in syncOnLogin:
// a stale cloud copy wiping just-earned local progress, and a partial cloud blob
// blanking the app. See the merge fix in cpp26-engine.jsx (mergeProgress).

// window.__cloudSynced flips true once syncOnLogin has pulled, merged, and
// pushed back — a deterministic signal to wait on instead of arbitrary sleeps.
// addInitScript re-runs on every navigation, so it resets across reloads.
async function installMockSupabase(page, cloudBlob: any) {
  await page.route("**/@supabase/**", (r) => r.abort());
  await page.addInitScript((blob) => {
    (window as any).__cloudSynced = false;
    const session = { user: { id: "test-user" } };
    Object.defineProperty(window, "supabase", {
      configurable: false, writable: false,
      value: {
        createClient() {
          return {
            auth: {
              getSession: () => Promise.resolve({ data: { session } }),
              onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
              signInWithOAuth: () => Promise.resolve({ error: null }),
              signOut: () => Promise.resolve(),
            },
            from() {
              const qb: any = {
                select: () => qb, eq: () => qb,
                maybeSingle: () => Promise.resolve({ data: { blob }, error: null }),
                upsert: () => { (window as any).__cloudSynced = true; return Promise.resolve({}); },
              };
              return qb;
            },
          };
        },
      },
    });
  }, cloudBlob);
}

const waitForSync = (page) => page.waitForFunction(() => (window as any).__cloudSynced === true);

async function passMastery(page) {
  const mastery = page.locator(".mastery");
  const correct = [1, 2, 3, 1]; // m1-l1 answer indices -> score 1.0 (passes 0.8)
  for (let i = 0; i < 4; i++) await mastery.locator(".mq").nth(i).locator(".opt").nth(correct[i]).click();
  await mastery.getByRole("button", { name: "Завершить проверку" }).click();
  await expect(mastery.locator(".mres")).toBeVisible();
}

test("a stale cloud blob must not wipe a just-earned local pass on reload", async ({ page }) => {
  // Cloud has NO mastery (older than what the learner is about to do locally).
  await installMockSupabase(page, { cur: "m1-l1", view: "lesson", exStatus: {}, mastery: {}, strict: false, locale: "ru" });

  await page.goto("/prototype/index.html");
  await expect(page.locator(".card.ex").first()).toBeVisible();
  await waitForSync(page); // initial login pull has settled, can't race the pass
  await passMastery(page);

  const pack = page.getByRole("listitem").filter({ hasText: "Pack indexing" });
  await expect(pack.locator("svg.i-done")).toHaveCount(1); // done locally

  await page.reload();
  await expect(page.locator(".card.ex").first()).toBeVisible();
  await waitForSync(page); // post-reload pull + merge has applied

  // Progress survives the merge: still done, still in localStorage.
  await expect(pack.locator("svg.i-done")).toHaveCount(1);
  await expect
    .poll(async () => JSON.parse((await page.evaluate(() => localStorage.getItem("cpp26-progress")))!).data.mastery["m1-l1"])
    .toBeGreaterThanOrEqual(0.8);
});

test("a partial cloud blob (missing mastery) must not blank the app", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  await installMockSupabase(page, { cur: "m1-l1", view: "lesson", exStatus: {}, strict: false, locale: "ru" }); // no mastery field

  await page.goto("/prototype/index.html");
  await waitForSync(page); // login pull + merge has applied (would have crashed pre-fix)

  await expect(page.locator(".card.ex").first()).toBeVisible(); // content still renders
  await expect(page.locator("main h1")).toBeVisible();
  expect(pageErrors).toEqual([]);
});
