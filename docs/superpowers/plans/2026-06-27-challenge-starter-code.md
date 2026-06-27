# Challenge Starter Code Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pre-fill the challenge editor with a runnable scaffold (includes + `main` + driver) so the learner writes only the asked-for part and "Сверить" can match `expectedOutput`.

**Architecture:** Add a per-challenge `starterCode` field (raw code = the verified `referenceSolution` program with only the answer region replaced by a `// твой код` stub). The engine seeds the editor from it and offers a reset link. A scaffold-integrity script guarantees `starterCode` is the reference program minus the answer, so a correctly filled stub reproduces `expectedOutput` by construction.

**Tech Stack:** React (CDN, no build), Node scripts for content checks, Playwright e2e. No new dependencies.

---

## Important context for the implementer

- The prototype `prototype/cpp26-engine.jsx` is a single self-contained file with two locale string objects (`ru` ~line 30-100, `en` ~line 100-165), components, and a `CSS` template string at the bottom. Follow that pattern; no build step.
- Content lives as JSON: `content/modules/{ru,en}/mN.json`. The 23 challenges (per locale) are: `m1-l1, m1-l4, m3-l1, m3-l2, m3-l3, m4-l1, m4-l2, m4-l3, m4-l4, m4-l5, m5-l1, m5-l2, m5-l3, m5-l4, m5-l5, m5-l7, m7-l1, m7-l3, m8-l1, m8-l3, m8-l4, m9-l3, m10-l2`. (m0/m2/m6 have no challenges.) Confirm with the snippet in Task 5 Step 1.
- `referenceSolution` is a **fenced** markdown string (```` ```cpp\n…\n``` ````). `starterCode` is **raw code** (no fence) because it goes into a `<textarea>`, like `examples[].code`.
- Line endings are CRLF in the working tree; JSON is edited via targeted string replacement to preserve formatting (don't `JSON.stringify` whole files).
- Tracked-file edits: commit messages in English. Lesson content/comments in Russian (ru) / English (en).
- Run e2e with `npx playwright test --reporter=line --workers=1`. The dev server is auto-started by the Playwright config (`npx http-server . -p 8901`).

---

## Task 1: Engine — seed the editor from `starterCode` + reset link + i18n

**Files:**
- Modify: `prototype/cpp26-engine.jsx` (`Challenge` component ~484-525; CSS string; both locale objects ~50 and ~119)

- [ ] **Step 1: Seed the editor state from `ch.starterCode`**

In `Challenge` (currently `const [code, setCode] = useState("");`), replace with:

```jsx
  const [code, setCode] = useState(ch.starterCode || "");
```

- [ ] **Step 2: Add a "reset to starter" button to the button row**

Replace the `<div className="row">…</div>` block (lines ~518-525) with:

```jsx
      <div className="row">
        <button className="btn" disabled={busy || !code.trim()} onClick={() => execute("run")}>
          {pendingMode === "run" ? t("compiling") : t("run")}
        </button>
        <button className="btn" disabled={busy || !code.trim()} onClick={() => execute("check")}>
          {pendingMode === "check" ? t("compiling") : t("compareWithReference")}
        </button>
        {ch.starterCode && (
          <button className="btn ghost sm" disabled={busy || code === ch.starterCode}
            onClick={() => setCode(ch.starterCode)}>{t("resetToStarter")}</button>
        )}
      </div>
```

- [ ] **Step 3: Add the `resetToStarter` string to both locale objects**

In the `ru` object, after `solutionPlaceholder: "…",` (line ~50) add:

```jsx
    resetToStarter: "Сбросить к началу",
```

In the `en` object, after its `solutionPlaceholder: "…",` line add:

```jsx
    resetToStarter: "Reset to start",
```

- [ ] **Step 4: Confirm the file still parses (no JSON/JSX syntax break)**

Run: `node -e "const s=require('fs').readFileSync('prototype/cpp26-engine.jsx','utf8'); if(!s.includes('resetToStarter')) throw new Error('missing'); console.log('engine edit OK')"`
Expected: `engine edit OK`

- [ ] **Step 5: Commit**

```bash
git add prototype/cpp26-engine.jsx
git commit -m "Seed challenge editor from starterCode and add a reset link"
```

---

## Task 2: Extend the i18n parity checker to cover `starterCode`

**Files:**
- Modify: `prototype/check-i18n-parity.js` (`describeLesson`, ~37-47)

- [ ] **Step 1: Add `starterCode` presence to the lesson shape**

In `describeLesson`, replace `hasChallenge: !!l.challenge,` with:

```js
    hasChallenge: !!l.challenge,
    challengeHasStarter: !!(l.challenge && l.challenge.starterCode),
```

This fails parity if one locale has `starterCode` for a challenge and the other doesn't. (Code text itself legitimately differs by comments, so only presence is compared — same policy as `referenceSolution`.)

- [ ] **Step 2: Run it (must still pass before any starterCode exists)**

Run: `node prototype/check-i18n-parity.js`
Expected: `i18n parity check OK (11 modules)`

- [ ] **Step 3: Commit**

```bash
git add prototype/check-i18n-parity.js
git commit -m "Check starterCode presence parity across locales"
```

---

## Task 3: Scaffold-integrity check script

**Files:**
- Create: `prototype/check-starter-scaffold.js`

**Why:** Guarantees the output-match invariant mechanically: `starterCode` must be the verified `referenceSolution` program with exactly the answer region blanked. The check: stripping the stub line(s) from `starterCode` leaves a line-subsequence of `referenceSolution` (order preserved). If someone alters an include/`main`/driver line in `starterCode`, a line won't match and the check fails.

- [ ] **Step 1: Write the script**

```js
#!/usr/bin/env node
// Verifies every challenge.starterCode is the challenge.referenceSolution
// program with only the answer region replaced by a `// твой код` stub:
// removing stub/blank lines from starterCode must leave an in-order
// subsequence of the reference program's lines. Usage: node prototype/check-starter-scaffold.js
const fs = require("fs");
const path = require("path");
const CONTENT_DIR = path.join(__dirname, "..", "content", "modules");
const MODULE_IDS = ["m0","m1","m2","m3","m4","m5","m6","m7","m8","m9","m10"];

function unfence(s) {
  return (s || "").replace(/^```\w*\n/, "").replace(/\n```\s*$/, "");
}
const isStub = (l) => /\/\/\s*твой код/i.test(l) || l.trim() === "";

// returns true if `needles` (in order) all appear in `hay` preserving order
function isSubsequence(needles, hay) {
  let i = 0;
  for (const line of hay) { if (i < needles.length && line === needles[i]) i++; }
  return i === needles.length;
}

let errors = [];
for (const id of MODULE_IDS) {
  for (const loc of ["ru", "en"]) {
    const file = path.join(CONTENT_DIR, loc, `${id}.json`);
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    for (const l of (data.lessons || [])) {
      const ch = l.challenge;
      if (!ch) continue;
      if (!ch.starterCode) { errors.push(`${loc}/${id} ${l.id}: missing starterCode`); continue; }
      const refLines = unfence(ch.referenceSolution).split("\n");
      const starterKept = ch.starterCode.split("\n").filter((x) => !isStub(x));
      if (!isSubsequence(starterKept, refLines))
        errors.push(`${loc}/${id} ${l.id}: starterCode scaffold lines are not a subsequence of referenceSolution (a driver/include line was altered?)`);
      if (!/\/\/\s*твой код/i.test(ch.starterCode))
        errors.push(`${loc}/${id} ${l.id}: starterCode has no \`// твой код\` stub`);
    }
  }
}
if (errors.length) { console.error("starter scaffold check FAILED:\n" + errors.join("\n")); process.exit(1); }
console.log("starter scaffold check OK");
```

- [ ] **Step 2: Run it — expect FAIL listing every challenge as missing starterCode**

Run: `node prototype/check-starter-scaffold.js`
Expected: FAIL, lines like `ru/m1 m1-l1: missing starterCode` for all 23 challenges (×2 locales). This proves the check detects absence.

- [ ] **Step 3: Commit**

```bash
git add prototype/check-starter-scaffold.js
git commit -m "Add scaffold-integrity check for challenge starterCode"
```

---

## Task 4: Document `starterCode` in CONTENT_GUIDE

**Files:**
- Modify: `docs/CONTENT_GUIDE.md` (challenge schema ~124-129; DoD ~152)

- [ ] **Step 1: Add `starterCode` to the schema block**

In the `"challenge": { … }` example, add `starterCode` above `referenceSolution`:

```json
      "challenge": {
        "prompt": "markdown: свободное задание",
        "starterCode": "сырой код: полный каркас (#include + main + драйвер) с заглушкой `// твой код` на месте ответа",
        "referenceSolution": "```cpp\n…самодостаточная программа: #include + main, печатает expectedOutput…\n```",
        "expectedOutput": "...",
        "godboltUrl": "https://godbolt.org/..."
      },
```

- [ ] **Step 2: Add a DoD item after the existing `referenceSolution` item (~line 153)**

```markdown
- [ ] У челленджа есть `starterCode` — **сырой** (без ```-ограждения) запускаемый каркас с заглушкой `// твой код` на месте ответа; всё, кроме области ответа (инклюды, `main`, драйвер), побайтово совпадает с `referenceSolution`, чтобы корректно заполненный каркас воспроизводил `expectedOutput`. Проверяется `node prototype/check-starter-scaffold.js`.
```

- [ ] **Step 3: Commit**

```bash
git add docs/CONTENT_GUIDE.md
git commit -m "Document the challenge starterCode field and its DoD"
```

---

## Task 5: Author `starterCode` for module 1 (m1-l1, m1-l4)

**Files:**
- Modify: `content/modules/ru/m1.json`, `content/modules/en/m1.json`

**Authoring rule (applies to every content task below):** for each challenge, read its `referenceSolution`, identify the region the `prompt` asks to write/rewrite, and produce `starterCode` = the reference program (unfenced) with ONLY that region replaced by a single `// твой код` line (keep indentation). Copy every other line — includes, `main`, driver, signatures — verbatim. Insert `starterCode` as a sibling key immediately before `referenceSolution`. The ru and en `starterCode` are identical except comments may be localized (e.g. `// your code` in en).

- [ ] **Step 1: Confirm the challenge inventory**

Run:
```bash
node -e "const fs=require('fs');for(const f of fs.readdirSync('content/modules/ru')){const d=JSON.parse(fs.readFileSync('content/modules/ru/'+f));for(const l of (d.lessons||[]))if(l.challenge)console.log(f,l.id)}"
```
Expected: the 23 ids listed in "Important context". If different, adjust later tasks accordingly.

- [ ] **Step 2: Add `starterCode` to m1-l1 (worked example) in BOTH locales**

The `referenceSolution` program for m1-l1 is the `nth` one-liner + `main`. The prompt asks to write the `nth` body. Insert this key before `"referenceSolution"` in both `ru/m1.json` and `en/m1.json` (en may use `// your code`):

```json
        "starterCode": "#include <print>\n#include <cstddef>\n\ntemplate <std::size_t N, typename... Ts>\nconstexpr auto nth(Ts... ts) {\n    // твой код\n}\n\nint main() {\n    std::print(\"{}\\n\", nth<1>(10, 20, 30));\n}",
```

- [ ] **Step 3: Add `starterCode` to m1-l4** (the `sum_tail` challenge) in both locales, stubbing the function body, keeping includes + `main` driver verbatim from its `referenceSolution`.

- [ ] **Step 4: Validate JSON + scaffold + parity**

Run:
```bash
node -e "JSON.parse(require('fs').readFileSync('content/modules/ru/m1.json','utf8'));JSON.parse(require('fs').readFileSync('content/modules/en/m1.json','utf8'));console.log('json ok')"
node prototype/check-starter-scaffold.js 2>&1 | grep "m1 "
node prototype/check-i18n-parity.js
```
Expected: `json ok`; no `m1 ` failures from the scaffold check (other modules still fail as missing — that's fine until their tasks); parity OK.

- [ ] **Step 5: Commit**

```bash
git add content/modules/ru/m1.json content/modules/en/m1.json
git commit -m "Add starterCode scaffolds for module 1 challenges"
```

---

## Task 6: e2e — editor is pre-filled with the scaffold

**Files:**
- Create: `e2e/challenge-starter.spec.ts`

- [ ] **Step 1: Write the deterministic pre-fill test (no network)**

```ts
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
```

- [ ] **Step 2: Run it**

Run: `npx playwright test challenge-starter --reporter=line --workers=1`
Expected: 2 passed. (m1-l1 is the default lesson and now has `starterCode`.)

- [ ] **Step 3: Commit**

```bash
git add e2e/challenge-starter.spec.ts
git commit -m "e2e: challenge editor pre-fills with scaffold and reset restores it"
```

---

## Task 7: Author `starterCode` for module 3 (m3-l1, m3-l2, m3-l3)

**Files:** `content/modules/ru/m3.json`, `content/modules/en/m3.json`

- [ ] **Step 1:** For each of m3-l1, m3-l2, m3-l3, apply the authoring rule (Task 5 intro): `starterCode` = unfenced `referenceSolution` with the prompt's target region replaced by `// твой код`, inserted before `referenceSolution`, both locales.
- [ ] **Step 2:** Validate: `node prototype/check-starter-scaffold.js 2>&1 | grep "m3 "` (no failures) and `node prototype/check-i18n-parity.js` (OK) and JSON parses for both files.
- [ ] **Step 3:** Commit: `git add content/modules/ru/m3.json content/modules/en/m3.json && git commit -m "Add starterCode scaffolds for module 3 challenges"`

---

## Task 8: Author `starterCode` for module 4 (m4-l1..m4-l5)

**Files:** `content/modules/ru/m4.json`, `content/modules/en/m4.json`

**Note:** m4 challenges are contract programs; some are "write several functions/the program" — the scaffold keeps includes + `main` (with its print/driver) + function signatures and stubs the bodies with `// твой код`. The stub may appear more than once if multiple bodies are written; the scaffold check tolerates multiple stub lines.

- [ ] **Step 1:** Apply the authoring rule to m4-l1, m4-l2, m4-l3, m4-l4, m4-l5, both locales.
- [ ] **Step 2:** Validate: `node prototype/check-starter-scaffold.js 2>&1 | grep "m4 "` (no failures); parity OK; JSON parses.
- [ ] **Step 3:** Commit: `git add content/modules/ru/m4.json content/modules/en/m4.json && git commit -m "Add starterCode scaffolds for module 4 challenges"`

---

## Task 9: Author `starterCode` for module 5 (m5-l1,l2,l3,l4,l5,l7)

**Files:** `content/modules/ru/m5.json`, `content/modules/en/m5.json`

**Note:** m5 are reflection (`std::meta`) programs. Keep includes (`<meta>` etc.) + `main` + driver verbatim; stub the part the prompt asks for.

- [ ] **Step 1:** Apply the authoring rule to m5-l1, m5-l2, m5-l3, m5-l4, m5-l5, m5-l7, both locales.
- [ ] **Step 2:** Validate: `node prototype/check-starter-scaffold.js 2>&1 | grep "m5 "` (no failures); parity OK; JSON parses.
- [ ] **Step 3:** Commit: `git add content/modules/ru/m5.json content/modules/en/m5.json && git commit -m "Add starterCode scaffolds for module 5 challenges"`

---

## Task 10: Author `starterCode` for module 7 (m7-l1, m7-l3)

**Files:** `content/modules/ru/m7.json`, `content/modules/en/m7.json`

- [ ] **Step 1:** Apply the authoring rule to m7-l1, m7-l3, both locales.
- [ ] **Step 2:** Validate: `node prototype/check-starter-scaffold.js 2>&1 | grep "m7 "` (no failures); parity OK; JSON parses.
- [ ] **Step 3:** Commit: `git add content/modules/ru/m7.json content/modules/en/m7.json && git commit -m "Add starterCode scaffolds for module 7 challenges"`

---

## Task 11: Author `starterCode` for module 8 (m8-l1, m8-l3, m8-l4)

**Files:** `content/modules/ru/m8.json`, `content/modules/en/m8.json`

- [ ] **Step 1:** Apply the authoring rule to m8-l1, m8-l3, m8-l4, both locales.
- [ ] **Step 2:** Validate: `node prototype/check-starter-scaffold.js 2>&1 | grep "m8 "` (no failures); parity OK; JSON parses.
- [ ] **Step 3:** Commit: `git add content/modules/ru/m8.json content/modules/en/m8.json && git commit -m "Add starterCode scaffolds for module 8 challenges"`

---

## Task 12: Author `starterCode` for module 9 (m9-l3) and module 10 (m10-l2)

**Files:** `content/modules/ru/m9.json`, `content/modules/en/m9.json`, `content/modules/ru/m10.json`, `content/modules/en/m10.json`

- [ ] **Step 1:** Apply the authoring rule to m9-l3 and m10-l2, both locales.
- [ ] **Step 2:** Validate: `node prototype/check-starter-scaffold.js` now prints `starter scaffold check OK` (ALL challenges covered); parity OK; both JSON files parse.
- [ ] **Step 3:** Commit: `git add content/modules/ru/m9.json content/modules/en/m9.json content/modules/ru/m10.json content/modules/en/m10.json && git commit -m "Add starterCode scaffolds for module 9 and 10 challenges"`

---

## Task 13: Matching guard + full verification

**Files:**
- Modify: `e2e/challenge-starter.spec.ts`

- [ ] **Step 1: Add one real-run match test (hits Compiler Explorer)**

Append to `e2e/challenge-starter.spec.ts`. It fills the m1-l1 editor with the full reference solution and asserts "Сверить" reports a match — guarding that the stored driver + expectedOutput agree end-to-end:

```ts
test("filling m1-l1 with the reference solution matches via Сверить @network", async ({ page }) => {
  test.setTimeout(60000);
  await page.goto("/prototype/index.html");
  await expect(page.locator(".card.ex").first()).toBeVisible();
  const ref =
    "#include <print>\n#include <cstddef>\n\ntemplate <std::size_t N, typename... Ts>\nconstexpr auto nth(Ts... ts) { return ts...[N]; }\n\nint main() {\n    std::print(\"{}\\n\", nth<1>(10, 20, 30));\n}";
  await page.locator(".chal-editor").fill(ref);
  await page.getByRole("button", { name: "Сверить" }).click();
  await expect(page.locator(".verdict.ok")).toBeVisible({ timeout: 45000 });
});
```

- [ ] **Step 2: Run the new test**

Run: `npx playwright test challenge-starter --reporter=line --workers=1`
Expected: 3 passed (the third needs network to godbolt; if godbolt is unreachable in CI, this test may be skipped/quarantined — keep the deterministic two green).

- [ ] **Step 3: Run all checks and the full e2e suite**

Run:
```bash
node prototype/check-starter-scaffold.js
node prototype/check-i18n-parity.js
npx playwright test --reporter=line --workers=1
```
Expected: scaffold OK; parity OK; all e2e pass.

- [ ] **Step 4: Commit**

```bash
git add e2e/challenge-starter.spec.ts
git commit -m "e2e: guard that the m1-l1 reference solution matches via Сверить"
```

---

## Self-review notes

- **Spec coverage:** data model `starterCode` (Tasks 5,7-12); raw-not-fenced (authoring rule + scaffold check unfences only the reference); engine seed + reset link + ephemeral draft (Task 1 — local component state re-seeds on remount, no persistence code); scaffold-integrity check (Task 3); i18n parity for starterCode (Task 2); e2e pre-fill + reset + match (Tasks 6,13); CONTENT_GUIDE schema + DoD (Task 4). All spec sections map to tasks.
- **No placeholders in mechanical tasks:** Tasks 1-4, 6, 13 contain exact code. Content tasks (5,7-12) intentionally specify a precise authoring *procedure* + a fully-worked example (m1-l1) + automated gates (scaffold subsequence check + parity), rather than pre-writing 23 scaffolds — the gates make a wrong scaffold fail CI.
- **Type/name consistency:** `resetToStarter` (string key) used in Task 1 Steps 2-3; `ch.starterCode` used in Task 1 Steps 1-2; `challengeHasStarter` in Task 2; `check-starter-scaffold.js` referenced consistently in Tasks 3,5,7-13; `.chal-editor`/`.verdict.ok` selectors match existing engine CSS.
