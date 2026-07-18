# C++23 Multi-Course Engine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the single-course C++26 app into a multi-course platform, add C++23 (30 stub lessons), and build a course-picker landing screen — all while preserving existing C++26 user progress.

**Architecture:** The engine gains a `courseId` state layer that sits above the existing lesson/progress logic. A new `AppShell` component owns `courseId` and renders either `CoursePicker` (null courseId) or `CourseView` (renamed from `App`) with the chosen course. Content moves from `content/modules/` to `content/courses/cpp26/` with C++23 stubs landing in `content/courses/cpp23/`.

**Tech Stack:** React 18 (CDN UMD), no bundler, Playwright for e2e, Supabase (progress cloud sync), Node.js for tooling scripts.

---

## File Map

| File | Change |
|------|--------|
| `prototype/cpp26-engine.jsx` | Major: add `courseId` state, split `App`→`AppShell`+`CourseView`, add `CoursePicker`, update fetch paths, progress keys, Supabase calls, CSS |
| `prototype/check-i18n-parity.js` | Minor: accept `--course` CLI arg, update CONTENT_DIR |
| `content/modules/` | Delete after move |
| `content/courses/cpp26/ru/*.json` | Moved from `content/modules/ru/` |
| `content/courses/cpp26/en/*.json` | Moved from `content/modules/en/` |
| `content/courses/cpp23/ru/m0–m10.json` | Create (stubs, 11 files) |
| `content/courses/cpp23/en/m0–m10.json` | Create (stubs, 11 files) |
| `scripts/create-cpp23-stubs.js` | Create: one-shot generation script |
| `e2e/*.spec.ts` (all 8 files) | Add `addInitScript` to inject `active-course` before each test |

---

## Task 1: Move content directory and update fetch path

**Files:**
- Rename: `content/modules/` → `content/courses/cpp26/`
- Modify: `prototype/cpp26-engine.jsx` line 11
- Modify: `prototype/check-i18n-parity.js` line 11

- [ ] **Step 1: Create new directory structure and move files**

```bash
mkdir -p "content/courses/cpp26"
git mv content/modules/ru content/courses/cpp26/ru
git mv content/modules/en content/courses/cpp26/en
git rm -r content/modules
```

- [ ] **Step 2: Update fetch path in engine (one line)**

In `prototype/cpp26-engine.jsx`, change line 11:
```js
// OLD:
    const res = await fetch(`../content/modules/${locale}/${id}.json`, { cache: "no-cache" });
// NEW:
    const res = await fetch(`../content/courses/cpp26/${locale}/${id}.json`, { cache: "no-cache" });
```

*(We hardcode `cpp26` for now — Task 2 will make this dynamic.)*

- [ ] **Step 3: Update check-i18n-parity.js path (line 11)**

```js
// OLD:
const CONTENT_DIR = path.join(__dirname, "..", "content", "modules");
// NEW:
const CONTENT_DIR = path.join(__dirname, "..", "content", "courses", "cpp26");
```

- [ ] **Step 4: Run e2e to verify nothing broke**

```bash
npx playwright test --reporter=line
```

Expected: all tests pass (same JSON files, same content, only path changed).

- [ ] **Step 5: Commit**

```bash
git add content/courses prototype/cpp26-engine.jsx prototype/check-i18n-parity.js
git commit -m "refactor: move content/modules → content/courses/cpp26"
```

---

## Task 2: Add courseId state + dynamic fetch + fix e2e

**Files:**
- Modify: `prototype/cpp26-engine.jsx` (lines 1–16, 186–207, 649–665)
- Modify: all 8 `e2e/*.spec.ts` files

After this task the app still boots directly into C++26 for existing users but has `courseId` wired up internally.

- [ ] **Step 1: Replace `MODULE_IDS` constant (line 4)**

```js
// OLD:
const MODULE_IDS = ["m0", "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10"];

// NEW:
const MODULE_IDS = {
  cpp26: ["m0","m1","m2","m3","m4","m5","m6","m7","m8","m9","m10"],
  cpp23: ["m0","m1","m2","m3","m4","m5","m6","m7","m8","m9","m10"],
};
```

- [ ] **Step 2: Update `loadCourseData` signature and fetch path (lines 6–16)**

```js
// OLD:
async function loadCourseData(locale) {
  const modules = await Promise.all(MODULE_IDS.map(async (id) => {
    const res = await fetch(`../content/courses/cpp26/${locale}/${id}.json`, { cache: "no-cache" });
    if (!res.ok) throw new Error(`failed to load ${locale}/${id}.json: ${res.status}`);
    return res.json();
  }));
  return { modules };
}

// NEW:
async function loadCourseData(courseId, locale) {
  const modules = await Promise.all(MODULE_IDS[courseId].map(async (id) => {
    const res = await fetch(`../content/courses/${courseId}/${locale}/${id}.json`, { cache: "no-cache" });
    if (!res.ok) throw new Error(`failed to load ${courseId}/${locale}/${id}.json: ${res.status}`);
    return res.json();
  }));
  return { modules };
}
```

- [ ] **Step 3: Replace `PROGRESS_KEY` with a function (line 186)**

```js
// OLD:
const PROGRESS_KEY = "cpp26-progress";

// NEW:
const progressKey = (courseId) => `${courseId}-progress`;
```

- [ ] **Step 4: Update `loadProgress` and `saveProgress` (lines 189–207)**

```js
// OLD:
function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== PROGRESS_VERSION) return null;
    return parsed.data;
  } catch (e) {
    return null;
  }
}

function saveProgress(data) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ version: PROGRESS_VERSION, data }));
  } catch (e) {
    // localStorage unavailable (private browsing, full quota) — keep running in-memory only
  }
}

// NEW:
function loadProgress(courseId) {
  try {
    const raw = localStorage.getItem(progressKey(courseId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== PROGRESS_VERSION) return null;
    return parsed.data;
  } catch (e) {
    return null;
  }
}

function saveProgress(courseId, data) {
  try {
    localStorage.setItem(progressKey(courseId), JSON.stringify({ version: PROGRESS_VERSION, data }));
  } catch (e) {
    // localStorage unavailable (private browsing, full quota) — keep running in-memory only
  }
}
```

- [ ] **Step 5: Update App component — initial saved state + loadCourseData call (lines 649–664)**

```js
// OLD (inside App function):
  const [saved] = useState(loadProgress);
  ...
  useEffect(() => {
    let cancelled = false;
    setCourseData(null);
    setLoadError(null);
    loadCourseData(locale)

// NEW (inside App function — courseId hardcoded to "cpp26" temporarily):
  const [saved] = useState(() => loadProgress("cpp26"));
  ...
  useEffect(() => {
    let cancelled = false;
    setCourseData(null);
    setLoadError(null);
    loadCourseData("cpp26", locale)
```

- [ ] **Step 6: Update `saveProgress` call in useEffect (line 675)**

```js
// OLD:
  useEffect(() => {
    saveProgress({ cur, view, exStatus, mastery, strict, locale });
  }, [cur, view, exStatus, mastery, strict, locale]);

// NEW:
  useEffect(() => {
    saveProgress("cpp26", { cur, view, exStatus, mastery, strict, locale });
  }, [cur, view, exStatus, mastery, strict, locale]);
```

- [ ] **Step 7: Update `saveProgress` call in `resetProgress` (line 736)**

```js
// OLD:
    saveProgress({ cur: "m1-l1", view: "lesson", exStatus: {}, mastery: {}, strict: false, locale: (prev && prev.locale) || locale });

// NEW:
    saveProgress("cpp26", { cur: "m1-l1", view: "lesson", exStatus: {}, mastery: {}, strict: false, locale: (prev && prev.locale) || locale });
```

- [ ] **Step 8: Add `addInitScript` to every e2e spec**

For each of these 8 files — `e2e/smoke.spec.ts`, `e2e/lesson.spec.ts`, `e2e/module0.spec.ts`, `e2e/i18n.spec.ts`, `e2e/all-lessons.spec.ts`, `e2e/challenge-starter.spec.ts`, `e2e/cloud-sync.spec.ts`, `e2e/logout.spec.ts` — add `addInitScript` before `page.goto`.

Pattern: every `beforeEach` that calls `page.goto` needs this line immediately before `goto`:

```ts
await page.addInitScript(() => {
  localStorage.setItem("active-course", "cpp26");
});
```

For specs that don't have `beforeEach` (e.g., `smoke.spec.ts`), add it inside the test body before `goto`:

```ts
// smoke.spec.ts
test("engine loads and renders course title", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("active-course", "cpp26");
  });
  await page.goto("/prototype/index.html");
  await expect(page.locator("#root")).toContainText("C++26", { timeout: 15000 });
});
```

- [ ] **Step 9: Run e2e to verify all tests pass**

```bash
npx playwright test --reporter=line
```

Expected: all tests pass.

- [ ] **Step 10: Commit**

```bash
git add prototype/cpp26-engine.jsx e2e/
git commit -m "feat: add courseId plumbing — dynamic MODULE_IDS, progressKey, loadCourseData"
```

---

## Task 3: Split App into AppShell + CourseView

**Files:**
- Modify: `prototype/cpp26-engine.jsx` (rename `App` to `CourseView`, add new `App`, update all Supabase calls inside CourseView)

After this task the app still works identically — `CourseView` is just `App` with `courseId` passed as a prop.

- [ ] **Step 1: Update `pullProgress` to accept courseId (lines 247–255)**

```js
// OLD:
async function pullProgress(client, userId) {
  try {
    const { data, error } = await client.from("progress").select("blob").eq("user_id", userId).maybeSingle();
    if (error) return { ok: false };
    return { ok: true, blob: data ? data.blob : null };
  } catch (e) {
    return { ok: false };
  }
}

// NEW:
async function pullProgress(client, userId, courseId) {
  try {
    const { data, error } = await client.from("progress").select("blob")
      .eq("user_id", userId).eq("course_id", courseId).maybeSingle();
    if (error) return { ok: false };
    return { ok: true, blob: data ? data.blob : null };
  } catch (e) {
    return { ok: false };
  }
}
```

- [ ] **Step 2: Update `pushProgress` to accept courseId (lines 257–263)**

```js
// OLD:
async function pushProgress(client, userId, blob) {
  try {
    await client.from("progress").upsert({ user_id: userId, blob, updated_at: new Date().toISOString() });
  } catch (e) {
    // network/Supabase unavailable — caller retries on the next sync tick
  }
}

// NEW:
async function pushProgress(client, userId, courseId, blob) {
  try {
    await client.from("progress").upsert(
      { user_id: userId, course_id: courseId, blob, updated_at: new Date().toISOString() },
      { onConflict: "user_id,course_id" }
    );
  } catch (e) {
    // network/Supabase unavailable — caller retries on the next sync tick
  }
}
```

- [ ] **Step 3: Add `COURSE_TITLES` constant (add after `UI_STRINGS` definition, around line 159)**

```js
const COURSE_TITLES = {
  cpp26: { ru: "C++26 — от нуля до полного понимания", en: "C++26 — from zero to full understanding" },
  cpp23: { ru: "C++23 — для разработчиков на C++17/20", en: "C++23 — for C++17/20 developers" },
};
```

- [ ] **Step 4: Rename `function App()` to `function CourseView({ courseId, onBackToPicker })` (line 649)**

```js
// OLD:
function App() {

// NEW:
function CourseView({ courseId, onBackToPicker }) {
```

- [ ] **Step 5: Replace hardcoded `"cpp26"` in CourseView with the `courseId` prop**

Inside `CourseView`, change every `"cpp26"` literal that was added in Task 2 back to the `courseId` variable:

```js
// Line ~651: useState init
const [saved] = useState(() => loadProgress(courseId));

// Line ~660: loadCourseData call
loadCourseData(courseId, locale)

// Line ~675: saveProgress in useEffect
saveProgress(courseId, { cur, view, exStatus, mastery, strict, locale });

// Line ~736: saveProgress in resetProgress
saveProgress(courseId, { cur: "m1-l1", ... });

// All pullProgress calls:
pullProgress(client, userId, courseId)

// All pushProgress calls (4 occurrences):
pushProgress(client, userId, courseId, blob)
pushProgress(client, userId, courseId, merged)
pushProgress(client, userId, courseId, localBlob)
```

- [ ] **Step 6: Update header `courseTitle` to use `COURSE_TITLES` (around line 859)**

```jsx
// OLD:
        <div className="brand"><BookOpen size={18} /><span>{tr("courseTitle")}</span></div>

// NEW:
        <div className="brand"><BookOpen size={18} /><span>{COURSE_TITLES[courseId][locale]}</span></div>
```

- [ ] **Step 7: Replace `function App()` export at line 1158 with new AppShell + new App**

Replace the final line `window.CPP26Engine = App;` and add the new `App` function right before it:

```jsx
function App() {
  const [courseId, setCourseId] = useState(() => {
    const active = localStorage.getItem("active-course");
    if (active) return active;
    if (localStorage.getItem("cpp26-progress")) {
      localStorage.setItem("active-course", "cpp26");
      return "cpp26";
    }
    return null;
  });

  function selectCourse(id) {
    localStorage.setItem("active-course", id);
    setCourseId(id);
  }

  function backToPicker() {
    localStorage.removeItem("active-course");
    setCourseId(null);
  }

  if (!courseId) return <CoursePicker onSelect={selectCourse} />;
  return <CourseView key={courseId} courseId={courseId} onBackToPicker={backToPicker} />;
}

window.CPP26Engine = App;
```

- [ ] **Step 8: Run e2e to verify all tests still pass**

```bash
npx playwright test --reporter=line
```

Expected: all pass (CourseView behaves identically to old App with cpp26).

- [ ] **Step 9: Commit**

```bash
git add prototype/cpp26-engine.jsx
git commit -m "refactor: split App into AppShell + CourseView, wire courseId prop"
```

---

## Task 4: Add CoursePicker component + CSS

**Files:**
- Modify: `prototype/cpp26-engine.jsx` (add component before `CourseView`, add CSS)

- [ ] **Step 1: Add `CoursePicker` component** — insert it immediately before `function CourseView`

```jsx
function CoursePicker({ onSelect }) {
  const COURSES = [
    { id: "cpp20", label: "C++20", disabled: true,
      tagline: "концепты · ranges · coroutines", lessons: null },
    { id: "cpp23", label: "C++23",
      tagline: "deducing this · expected · generator", lessons: 30 },
    { id: "cpp26", label: "C++26",
      tagline: "reflection · contracts · execution", lessons: 33 },
  ];

  function hasStarted(cid) {
    try {
      return !!localStorage.getItem(progressKey(cid));
    } catch (e) { return false; }
  }

  return (
    <div className="app">
      <style>{CSS}</style>
      <div className="picker">
        <div className="picker-hero">
          <h1 className="picker-title">C++ Learning Path</h1>
          <p className="picker-sub">Выбери стандарт для изучения</p>
        </div>
        <div className="picker-cards">
          {COURSES.map((c) => (
            <div
              key={c.id}
              className={"picker-card" + (c.disabled ? " picker-card-disabled" : "")}
              onClick={() => !c.disabled && onSelect(c.id)}
            >
              <div className="picker-card-label">{c.label}</div>
              <div className="picker-card-tagline">{c.tagline}</div>
              {c.disabled
                ? <span className="picker-soon">скоро</span>
                : <div className="picker-card-lessons">{c.lessons} уроков</div>}
              {!c.disabled && hasStarted(c.id) && (
                <div className="picker-card-started">● начато</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add CoursePicker CSS** — append to the end of the `CSS` template literal, before the closing backtick

```css
/* CoursePicker */
.picker { display:flex; flex-direction:column; align-items:center; justify-content:center;
  min-height:100vh; padding:40px 20px; }
.picker-hero { text-align:center; margin-bottom:40px; }
.picker-title { font-family:'IBM Plex Serif',Georgia,serif; font-size:28px; color:var(--ink); margin:0 0 8px; }
.picker-sub { color:var(--mut); margin:0; }
.picker-cards { display:flex; gap:20px; flex-wrap:wrap; justify-content:center; }
.picker-card { background:var(--panel); border:2px solid var(--line); border-radius:14px;
  padding:28px 24px; min-width:180px; max-width:220px; flex:1; cursor:pointer;
  transition:border-color .2s, transform .15s; }
.picker-card:hover:not(.picker-card-disabled) { border-color:var(--amber); transform:translateY(-3px); }
.picker-card-disabled { opacity:0.45; cursor:not-allowed; }
.picker-card-label { font-family:'IBM Plex Serif',Georgia,serif; font-size:24px;
  font-weight:700; color:var(--amber); margin-bottom:8px; }
.picker-card-tagline { font-size:12px; color:var(--mut); margin-bottom:14px; line-height:1.5; }
.picker-card-lessons { font-size:11px; color:var(--mut); }
.picker-soon { font-size:11px; color:var(--mut); background:var(--panel2);
  border:1px solid var(--line); border-radius:6px; padding:2px 8px; }
.picker-card-started { font-size:11px; color:var(--green); margin-top:6px; }
```

- [ ] **Step 3: Write e2e test for CoursePicker** — create `e2e/course-picker.spec.ts`

```ts
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

test("clicking C++23 card enters the C++23 course", async ({ page }) => {
  await page.goto("/prototype/index.html");
  await page.locator(".picker-card").filter({ hasText: "C++23" }).click();
  await expect(page.locator(".topbar")).toBeVisible({ timeout: 15000 });
  await expect(page.locator(".topbar")).toContainText("C++23");
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
```

- [ ] **Step 4: Run new e2e tests (will fail until stubs exist for C++23)**

```bash
npx playwright test e2e/course-picker.spec.ts --reporter=line
```

Expected: "clicking C++23 card" test fails because `content/courses/cpp23/` doesn't exist yet — that's fine, note the failure and proceed to Task 6.

- [ ] **Step 5: Run all other e2e tests to confirm no regressions**

```bash
npx playwright test --ignore=e2e/course-picker.spec.ts --reporter=line
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add prototype/cpp26-engine.jsx e2e/course-picker.spec.ts
git commit -m "feat: add CoursePicker component with C++20/23/26 cards"
```

---

## Task 5: Add ← Все курсы link in CourseView header

**Files:**
- Modify: `prototype/cpp26-engine.jsx` (header section of CourseView, CSS)

- [ ] **Step 1: Wrap brand + add back button in header (around line 858)**

```jsx
// OLD:
      <header className="topbar">
        <div className="brand"><BookOpen size={18} /><span>{COURSE_TITLES[courseId][locale]}</span></div>

// NEW:
      <header className="topbar">
        <div className="topbar-left">
          <button className="back-btn" onClick={onBackToPicker}>← Все курсы</button>
          <div className="brand"><BookOpen size={18} /><span>{COURSE_TITLES[courseId][locale]}</span></div>
        </div>
```

- [ ] **Step 2: Add CSS for `.topbar-left` and `.back-btn`** — append to CSS string before closing backtick

```css
.topbar-left { display:flex; align-items:center; gap:14px; }
.back-btn { background:none; border:none; color:var(--mut); cursor:pointer; font-size:13px;
  padding:0; white-space:nowrap; }
.back-btn:hover { color:var(--ink); }
```

- [ ] **Step 3: Write e2e test for the back link** — add to `e2e/course-picker.spec.ts`

```ts
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
```

- [ ] **Step 4: Run e2e**

```bash
npx playwright test e2e/course-picker.spec.ts --reporter=line
```

Expected: new back-link test passes; "clicking C++23 card" still fails (no stubs yet).

- [ ] **Step 5: Run full suite to confirm no regressions**

```bash
npx playwright test --ignore=e2e/course-picker.spec.ts --reporter=line
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add prototype/cpp26-engine.jsx e2e/course-picker.spec.ts
git commit -m "feat: add ← Все курсы back link in CourseView header"
```

---

## Task 6: Create C++23 stub files (22 JSON files)

**Files:**
- Create: `scripts/create-cpp23-stubs.js`
- Create: `content/courses/cpp23/ru/m0.json` … `m10.json`
- Create: `content/courses/cpp23/en/m0.json` … `m10.json`

- [ ] **Step 1: Create the generation script** — `scripts/create-cpp23-stubs.js`

```js
#!/usr/bin/env node
// One-shot: generates content/courses/cpp23/{ru,en}/m0-m10.json stub files.
// Run: node scripts/create-cpp23-stubs.js

const fs = require("fs");
const path = require("path");

const MODULES = [
  { id: "m0", n: 0, sig: "вводный",    sigEn: "introductory",
    ru: "Контекст C++23",                en: "C++23 Context",
    lessons: [
      { id: "m0-l1", ru: "Контекст C++23", en: "C++23 Context" },
    ]
  },
  { id: "m1", n: 1, sig: "базовый",    sigEn: "basic",
    ru: "Языковые улучшения",            en: "Language improvements",
    lessons: [
      { id: "m1-l1", ru: "if consteval и auto в параметрах функций", en: "if consteval and auto in function parameters" },
      { id: "m1-l2", ru: "Многомерный оператор []",                  en: "Multidimensional subscript operator []" },
      { id: "m1-l3", ru: "auto(x)/auto{x} и улучшения лямбд",        en: "auto(x)/auto{x} and lambda improvements" },
      { id: "m1-l4", ru: "#elifdef, [[assume]], [[nodiscard]]",       en: "#elifdef, [[assume]], [[nodiscard]]" },
      { id: "m1-l5", ru: "static_assert со строкой, size_t literals", en: "static_assert with string, size_t literals" },
    ]
  },
  { id: "m2", n: 2, sig: "флагманский", sigEn: "flagship",
    ru: "Deducing this (Explicit Object Parameter)", en: "Deducing this (Explicit Object Parameter)",
    lessons: [
      { id: "m2-l1", ru: "Синтаксис: explicit object parameter",       en: "Syntax: explicit object parameter" },
      { id: "m2-l2", ru: "Рекурсивные лямбды и CRTP без шаблонного базового класса", en: "Recursive lambdas and CRTP without template base" },
      { id: "m2-l3", ru: "Продвинутые паттерны: chain builders, variant visitor", en: "Advanced patterns: chain builders, variant visitor" },
    ]
  },
  { id: "m3", n: 3, sig: "флагманский", sigEn: "flagship",
    ru: "Обработка ошибок: std::expected", en: "Error handling: std::expected",
    lessons: [
      { id: "m3-l1", ru: "std::expected: синтаксис и основные паттерны", en: "std::expected: syntax and basic patterns" },
      { id: "m3-l2", ru: "Монадические операции: and_then, transform, or_else", en: "Monadic operations: and_then, transform, or_else" },
    ]
  },
  { id: "m4", n: 4, sig: "важный",     sigEn: "important",
    ru: "Ranges C++23: новые адаптеры и алгоритмы", en: "Ranges C++23: new adapters and algorithms",
    lessons: [
      { id: "m4-l1", ru: "std::ranges::to<C>() — материализация диапазонов", en: "std::ranges::to<C>() — materialising ranges" },
      { id: "m4-l2", ru: "chunk, slide, stride, chunk_by",               en: "chunk, slide, stride, chunk_by" },
      { id: "m4-l3", ru: "zip, enumerate, cartesian_product, join_with",  en: "zip, enumerate, cartesian_product, join_with" },
      { id: "m4-l4", ru: "fold_left, fold_right, repeat, iota, contains", en: "fold_left, fold_right, repeat, iota, contains" },
    ]
  },
  { id: "m5", n: 5, sig: "важный",     sigEn: "important",
    ru: "std::mdspan: многомерные представления данных", en: "std::mdspan: multidimensional data views",
    lessons: [
      { id: "m5-l1", ru: "std::mdspan: синтаксис, extents, mappings",    en: "std::mdspan: syntax, extents, mappings" },
      { id: "m5-l2", ru: "accessor policies, submdspan, практические паттерны", en: "accessor policies, submdspan, practical patterns" },
    ]
  },
  { id: "m6", n: 6, sig: "базовый",    sigEn: "basic",
    ru: "Форматирование и вывод: std::print и std::format", en: "Formatting and output: std::print and std::format",
    lessons: [
      { id: "m6-l1", ru: "std::print и std::println: безопасный типизированный вывод", en: "std::print and std::println: type-safe output" },
      { id: "m6-l2", ru: "std::format для диапазонов и пользовательских типов", en: "std::format for ranges and custom types" },
    ]
  },
  { id: "m7", n: 7, sig: "важный",     sigEn: "important",
    ru: "Новые контейнеры и утилиты", en: "New containers and utilities",
    lessons: [
      { id: "m7-l1", ru: "std::flat_map и std::flat_set",                en: "std::flat_map and std::flat_set" },
      { id: "m7-l2", ru: "std::move_only_function и std::spanstream",     en: "std::move_only_function and std::spanstream" },
      { id: "m7-l3", ru: "std::stacktrace: трассировка стека",            en: "std::stacktrace: stack traces" },
      { id: "m7-l4", ru: "string::contains, resize_and_overwrite, invoke_r", en: "string::contains, resize_and_overwrite, invoke_r" },
    ]
  },
  { id: "m8", n: 8, sig: "флагманский", sigEn: "flagship",
    ru: "std::generator и coroutines C++23", en: "std::generator and C++23 coroutines",
    lessons: [
      { id: "m8-l1", ru: "std::generator: синтаксис и базовые паттерны",  en: "std::generator: syntax and basic patterns" },
      { id: "m8-l2", ru: "Рекурсивные генераторы, производительность",    en: "Recursive generators, performance" },
    ]
  },
  { id: "m9", n: 9, sig: "специальный", sigEn: "special",
    ru: "Числа, бит-операции и низкоуровневые утилиты", en: "Numbers, bitops, and low-level utilities",
    lessons: [
      { id: "m9-l1", ru: "<stdfloat>: фиксированные типы с плавающей точкой", en: "<stdfloat>: fixed-width floating-point types" },
      { id: "m9-l2", ru: "std::byteswap, std::to_underlying, std::unreachable", en: "std::byteswap, std::to_underlying, std::unreachable" },
      { id: "m9-l3", ru: "std::out_ptr, size_t literals, ranges::shift",   en: "std::out_ptr, size_t literals, ranges::shift" },
    ]
  },
  { id: "m10", n: 10, sig: "завершающий", sigEn: "concluding",
    ru: "Удалённое, устаревшее, итог", en: "Removed, deprecated, wrap-up",
    lessons: [
      { id: "m10-l1", ru: "Удалённые и устаревшие возможности C++23", en: "Removed and deprecated features in C++23" },
      { id: "m10-l2", ru: "C++23 в контексте: место между C++20 и C++26", en: "C++23 in context: between C++20 and C++26" },
    ]
  },
];

for (const locale of ["ru", "en"]) {
  const dir = path.join(__dirname, "..", "content", "courses", "cpp23", locale);
  fs.mkdirSync(dir, { recursive: true });

  for (const m of MODULES) {
    const json = {
      id: m.id,
      moduleNumber: m.n,
      title: locale === "ru" ? m.ru : m.en,
      significance: locale === "ru" ? m.sig : m.sigEn,
      prerequisites: [],
      lessons: m.lessons.map((l) => ({
        id: l.id,
        title: locale === "ru" ? l.ru : l.en,
        stub: true,
      })),
    };
    const out = path.join(dir, `${m.id}.json`);
    fs.writeFileSync(out, JSON.stringify(json, null, 2) + "\n");
    console.log("created", out);
  }
}
console.log("done — 22 stub files");
```

- [ ] **Step 2: Run the script**

```bash
node scripts/create-cpp23-stubs.js
```

Expected output: 22 lines "created content/courses/cpp23/{ru,en}/mN.json", then "done — 22 stub files".

- [ ] **Step 3: Run i18n parity for cpp23**

```bash
node prototype/check-i18n-parity.js
```

*(This still checks cpp26 only — it will pass. Task 8 updates it for cpp23 too.)*

- [ ] **Step 4: Run full e2e suite**

```bash
npx playwright test --reporter=line
```

Expected: all course-picker tests now pass (C++23 card loads stubs, engine renders "stub lesson" placeholder). All other tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/create-cpp23-stubs.js content/courses/cpp23/
git commit -m "feat: add C++23 stub files (22 modules, 30 lesson stubs)"
```

---

## Task 7: Supabase — add course_id to progress table

**Files:**
- Modify: Supabase dashboard (SQL migration — no local files change)
- The `pullProgress`/`pushProgress` code was already updated in Task 3.

- [ ] **Step 1: Run SQL migration in Supabase dashboard**

Open the Supabase project SQL editor and run:

```sql
-- Add course_id column; existing rows get DEFAULT 'cpp26'
ALTER TABLE progress
  ADD COLUMN IF NOT EXISTS course_id TEXT NOT NULL DEFAULT 'cpp26';

-- Drop old single-column unique constraint (if named differently, adjust)
-- First find the constraint name:
SELECT constraint_name
FROM information_schema.table_constraints
WHERE table_name = 'progress' AND constraint_type IN ('PRIMARY KEY', 'UNIQUE');

-- Then replace it with composite unique constraint:
-- (Adjust constraint name below to match what the query above returned)
ALTER TABLE progress DROP CONSTRAINT progress_user_id_key;
ALTER TABLE progress ADD CONSTRAINT progress_user_id_course_id_key UNIQUE (user_id, course_id);
```

- [ ] **Step 2: Verify in Supabase table editor**

Check that:
- `course_id` column exists with `NOT NULL DEFAULT 'cpp26'`
- All existing rows show `course_id = 'cpp26'`
- The unique constraint is on `(user_id, course_id)` not just `user_id`

- [ ] **Step 3: Manual smoke test — sign in, check sync still works**

Open the app in a browser, sign in with Google/GitHub, verify progress loads from cloud (no errors in browser console).

- [ ] **Step 4: Commit (note only — no code changed in this task)**

```bash
git commit --allow-empty -m "chore: supabase progress table — added course_id column (migration applied)"
```

---

## Task 8: Update check-i18n-parity.js for multi-course

**Files:**
- Modify: `prototype/check-i18n-parity.js`

- [ ] **Step 1: Update the script to accept a `--course` argument**

Replace the entire file content:

```js
#!/usr/bin/env node
// Verifies that content/courses/<courseId>/ru/*.json and .../en/*.json
// stay structurally in sync: same modules, same lessons, same exercise/
// mastery-check shapes. Prose strings are intentionally NOT compared.
// Usage:
//   node prototype/check-i18n-parity.js                  (checks cpp26)
//   node prototype/check-i18n-parity.js --course cpp23   (checks cpp23)
//   node prototype/check-i18n-parity.js --course all     (checks all)

const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const courseArg = args.includes("--course") ? args[args.indexOf("--course") + 1] : "cpp26";

const MODULE_IDS = ["m0", "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10"];
const COURSES = courseArg === "all" ? ["cpp26", "cpp23"] : [courseArg];

let totalErrors = [];

function load(courseId, locale, id) {
  const file = path.join(__dirname, "..", "content", "courses", courseId, locale, `${id}.json`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function describeExercise(ex) {
  return {
    id: ex.id, level: ex.level, type: ex.type,
    answerIndex: ex.answerIndex, answerLine: ex.answerLine,
    answer: ex.answer, optionCount: ex.options ? ex.options.length : null,
  };
}

function describeQuestion(q) {
  return { type: q.type, answerIndex: q.answerIndex, optionCount: q.options ? q.options.length : null };
}

function describeLesson(l) {
  if (l.stub) return { id: l.id, stub: true };
  return {
    id: l.id, stub: false,
    exampleCount: (l.examples || []).length,
    exercises: (l.exercises || []).map(describeExercise),
    hasChallenge: !!l.challenge,
    challengeHasStarter: !!(l.challenge && l.challenge.starterCode),
    masteryQuestions: l.masteryCheck.questions.map(describeQuestion),
  };
}

for (const courseId of COURSES) {
  const errors = [];
  for (const id of MODULE_IDS) {
    const ru = load(courseId, "ru", id);
    const en = load(courseId, "en", id);
    if (ru.id !== en.id || ru.moduleNumber !== en.moduleNumber)
      errors.push(`${id}: module id/number mismatch`);
    const ruL = (ru.lessons || []).map(describeLesson);
    const enL = (en.lessons || []).map(describeLesson);
    if (ruL.length !== enL.length) { errors.push(`${id}: lesson count mismatch`); continue; }
    for (let i = 0; i < ruL.length; i++) {
      if (JSON.stringify(ruL[i]) !== JSON.stringify(enL[i]))
        errors.push(`${id}: lesson #${i} shape mismatch`);
    }
  }
  if (errors.length > 0) {
    console.error(`[${courseId}] i18n parity FAILED:\n` + errors.join("\n"));
    totalErrors.push(...errors);
  } else {
    console.log(`[${courseId}] i18n parity OK (${MODULE_IDS.length} modules)`);
  }
}

if (totalErrors.length > 0) process.exit(1);
```

- [ ] **Step 2: Run for both courses**

```bash
node prototype/check-i18n-parity.js --course cpp26
node prototype/check-i18n-parity.js --course cpp23
node prototype/check-i18n-parity.js --course all
```

Expected: all three commands print `[courseId] i18n parity OK`.

- [ ] **Step 3: Commit**

```bash
git add prototype/check-i18n-parity.js
git commit -m "feat: check-i18n-parity.js supports --course arg (cpp26/cpp23/all)"
```

---

## Phase 1 Complete — Verification

- [ ] **Run full e2e suite one final time**

```bash
npx playwright test --reporter=line
```

Expected: all tests pass, including `e2e/course-picker.spec.ts`.

- [ ] **Manual walkthrough:**
  1. Open `prototype/index.html` in a private/incognito window (no localStorage)
  2. Verify CoursePicker appears with 3 cards
  3. Click C++26 → course loads, header shows "C++26 — от нуля до полного понимания"
  4. Click `← Все курсы` → picker reappears
  5. Click C++23 → course loads with 11 stub modules, all lessons show "скоро"
  6. Click `← Все курсы` → picker reappears
  7. Reload page → picker shows again (active-course was cleared)
  8. Open a normal window (with existing C++26 progress in localStorage) → goes directly to C++26, no picker

---

## Phase 2: C++23 Content (separate sessions)

Content work is done lesson-by-lesson using the `compiling-cpp26-examples` skill for verified output. Priority order:

| Priority | Lessons | Module |
|----------|---------|--------|
| 1 | m0-l1 | Контекст C++23 — no code, choice-only |
| 2 | m2-l1, m2-l2, m2-l3 | Deducing this — flagship |
| 3 | m3-l1, m3-l2 | std::expected — flagship |
| 4 | m6-l1, m6-l2 | std::print / std::format |
| 5 | m4-l1 … m4-l4 | Ranges C++23 |
| 6 | m1-l1 … m1-l5 | Языковые улучшения |
| 7 | m5-l1, m5-l2 | std::mdspan |
| 8 | m7-l1 … m7-l4 | Контейнеры и утилиты |
| 9 | m8-l1, m8-l2 | std::generator (compiler: `g132 -fcoroutines`) |
| 10 | m9-l1 … m9-l3 | Числа и low-level |
| 11 | m10-l1, m10-l2 | Удалённое, итог |

Each lesson replaces `{ "stub": true }` with the full lesson JSON per `docs/CONTENT_GUIDE.md`. After each lesson, run `node prototype/check-i18n-parity.js --course cpp23` and commit.
