# Local Progress Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist the learner's progress (current lesson, view, exercise statuses, mastery results, strict mode) to `localStorage` so it survives page reloads, with simple version-based invalidation for future schema changes.

**Architecture:** Add two small helper functions, `loadProgress()` and `saveProgress(data)`, that read/write a single versioned JSON blob (`{ version, data }`) under one `localStorage` key. Wire `loadProgress` into `App` to seed initial state on mount (Task 1), then wire `saveProgress` into a `useEffect` that persists on every relevant change (Task 2). Both helpers wrap their `localStorage` access in `try/catch` so the app keeps working (in-memory only) if storage is unavailable.

**Tech Stack:** React 18 (via CDN, no build step — see `prototype/index.html`), browser `localStorage`, `prototype/cpp26-engine.jsx`

**Design reference:** `docs/superpowers/specs/2026-06-08-local-progress-persistence-design.md`

---

## Background for the engineer

`prototype/cpp26-engine.jsx` is a single-file React prototype loaded via Babel-in-browser (no build tools — see the comments in `prototype/index.html`). There is no test framework or `package.json`; verification happens by serving the file over local HTTP and exercising it in a real browser (the `file://` protocol breaks the CDN scripts' CORS).

**To serve and open the prototype for manual verification:**
```bash
cd prototype
npx http-server -p 8901
```
Then open `http://127.0.0.1:8901/index.html` in a browser and use DevTools → Console for the verification snippets in each task (the `localStorage` global is directly accessible there; the helper functions you add are not, since they're module-scoped — verify them indirectly through the running app and `localStorage` contents, exactly as the steps below describe).

The five pieces of state to persist live in the `App` component (`prototype/cpp26-engine.jsx:539-543`):
```js
  const [cur, setCur] = useState("m1-l1");
  const [view, setView] = useState("lesson");
  const [exStatus, setExStatus] = useState({});
  const [mastery, setMastery] = useState({});
  const [strict, setStrict] = useState(false);
```
- `cur` — id of the current lesson (e.g. `"m1-l1"`)
- `view` — `"lesson"` or `"repetition"` (see `prototype/cpp26-engine.jsx:588,613-614,631`)
- `exStatus` — map of exercise id → `"correct" | "wrong" | "skipped"`
- `mastery` — map of lesson id → numeric score (e.g. `0.9`)
- `strict` — boolean

Existing helpers like `norm` live as plain top-level `const`/`function` declarations right after the `STATUS` constant (`prototype/cpp26-engine.jsx:236-237`). Add the new helpers in the same place, following that pattern.

---

### Task 1: Add `loadProgress` and seed initial state from it

**Files:**
- Modify: `prototype/cpp26-engine.jsx:237` (insert helpers after this line)
- Modify: `prototype/cpp26-engine.jsx:539-543` (seed `useState` calls from loaded data)

- [ ] **Step 1: Add the `PROGRESS_KEY`/`PROGRESS_VERSION` constants and `loadProgress` helper**

Insert immediately after line 237 (`const norm = (s) => (s || "").trim();`):

```js
const PROGRESS_KEY = "cpp26-progress";
const PROGRESS_VERSION = 1;

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
```

`loadProgress` returns `null` whenever there's nothing usable to restore — missing key, corrupt JSON, or a version mismatch (future-proofing: bumping `PROGRESS_VERSION` automatically discards incompatible old data, no migration code needed). Callers fall back to today's defaults in that case.

- [ ] **Step 2: Seed the five `useState` calls from `loadProgress()`**

Replace lines 539-543:
```js
  const [cur, setCur] = useState("m1-l1");
  const [view, setView] = useState("lesson");
  const [exStatus, setExStatus] = useState({});
  const [mastery, setMastery] = useState({});
  const [strict, setStrict] = useState(false);
```
with:
```js
  const [saved] = useState(loadProgress);
  const [cur, setCur] = useState(saved ? saved.cur : "m1-l1");
  const [view, setView] = useState(saved ? saved.view : "lesson");
  const [exStatus, setExStatus] = useState(saved ? saved.exStatus : {});
  const [mastery, setMastery] = useState(saved ? saved.mastery : {});
  const [strict, setStrict] = useState(saved ? saved.strict : false);
```

`useState(loadProgress)` is React's lazy-initializer form — it calls `loadProgress` exactly once, on first render, rather than on every render. The result is reused as the seed for all five fields.

- [ ] **Step 3: Verify default behavior is unchanged with empty storage**

Serve the prototype (see "Background" above) and open `http://127.0.0.1:8901/index.html`. In DevTools Console:
```js
localStorage.removeItem("cpp26-progress");
location.reload();
```
Expected: app loads exactly as before — lesson `m1-l1` shown, "lesson" view, strict-mode checkbox unchecked, no exercises marked. (This confirms the `saved ? ... : <default>` fallback path.)

- [ ] **Step 4: Verify a valid saved blob is restored on load**

In DevTools Console (with the app open):
```js
localStorage.setItem("cpp26-progress", JSON.stringify({
  version: 1,
  data: { cur: "m1-l1", view: "repetition", exStatus: { "m1-l1-ex1": "skipped" }, mastery: { "m1-l1": 0.5 }, strict: true }
}));
location.reload();
```
Expected after reload:
- The "Зона повторения" (repetition) view is shown (not the lesson view)
- The "Строгий режим" checkbox is checked
- The repetition zone counter shows 1 skipped item

This confirms `loadProgress` correctly parses a valid blob and `App` seeds its state from `saved.*`.

- [ ] **Step 5: Verify version mismatch and corrupt data both fall back to defaults**

In DevTools Console:
```js
localStorage.setItem("cpp26-progress", JSON.stringify({ version: 999, data: { view: "repetition", strict: true } }));
location.reload();
```
Expected: app shows defaults again (lesson view, strict unchecked) — the version mismatch caused `loadProgress` to return `null`.

Then:
```js
localStorage.setItem("cpp26-progress", "{not valid json");
location.reload();
```
Expected: app loads normally with defaults (no crash, no console error bubbling up to the user) — the `JSON.parse` throw was caught and `loadProgress` returned `null`.

Clean up afterwards:
```js
localStorage.removeItem("cpp26-progress");
location.reload();
```

- [ ] **Step 6: Commit**

```bash
git add prototype/cpp26-engine.jsx
git commit -m "$(cat <<'EOF'
Add loadProgress helper and seed App state from saved progress

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Add `saveProgress` and persist on every change

**Files:**
- Modify: `prototype/cpp26-engine.jsx:1` (add `useEffect` to the React destructure)
- Modify: `prototype/cpp26-engine.jsx` (insert `saveProgress` next to `loadProgress`, added in Task 1)
- Modify: `prototype/cpp26-engine.jsx` (add a `useEffect` inside `App`, after the five `useState` calls from Task 1)

- [ ] **Step 1: Add `useEffect` to the React destructure**

Line 1 currently reads:
```js
const { useState } = React;
```
Change it to:
```js
const { useState, useEffect } = React;
```

- [ ] **Step 2: Add the `saveProgress` helper**

Immediately after the `loadProgress` function added in Task 1 (so the load/save pair stays together), add:
```js
function saveProgress(data) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ version: PROGRESS_VERSION, data }));
  } catch (e) {
    // localStorage unavailable (private browsing, full quota) — keep running in-memory only
  }
}
```

- [ ] **Step 3: Add a `useEffect` in `App` that calls `saveProgress` on every relevant change**

Directly after the five `useState` lines from Task 1 Step 2 (i.e. right after the `strict` line, before the `allLessons` declaration), add:
```js

  useEffect(() => {
    saveProgress({ cur, view, exStatus, mastery, strict });
  }, [cur, view, exStatus, mastery, strict]);
```

This fires after the initial render and after every subsequent render where any of the five values changed, overwriting the whole blob each time — matching the design's "single versioned JSON blob, written in full" approach (the data is a few KB at most, so whole-blob writes are cheap).

- [ ] **Step 4: Verify round-trip persistence end-to-end**

Restart the static server if it isn't running (see "Background"), open `http://127.0.0.1:8901/index.html`, and in DevTools Console first clear any leftover state:
```js
localStorage.removeItem("cpp26-progress");
location.reload();
```

Now interact with the running app (no console needed for this part):
1. Toggle the "Строгий режим" checkbox on
2. Click "Зона повторения" to switch to the repetition view

Then in DevTools Console, inspect what got saved:
```js
JSON.parse(localStorage.getItem("cpp26-progress"))
```
Expected: an object shaped like `{ version: 1, data: { cur: "m1-l1", view: "repetition", exStatus: {...}, mastery: {...}, strict: true } }`, with `view: "repetition"` and `strict: true` reflecting your interactions.

Now reload the page:
```js
location.reload();
```
Expected: the app comes back up already in the repetition view with the strict-mode checkbox checked — i.e. it restored from what it had just saved itself (the full read-then-write loop now works without any manual `localStorage.setItem` from the console).

Clean up afterwards:
```js
localStorage.removeItem("cpp26-progress");
location.reload();
```

- [ ] **Step 5: Verify storage failures degrade gracefully**

In DevTools Console, simulate `localStorage` being unavailable by shadowing `setItem` so it throws (this mimics private-browsing/quota-exceeded conditions without needing special browser flags):
```js
const realSetItem = Storage.prototype.setItem;
Storage.prototype.setItem = function () { throw new DOMException("QuotaExceededError"); };
```
Then interact with the app (toggle strict mode, navigate between views). Expected: the UI keeps responding normally — no crash, no error overlay — because `saveProgress`'s `try/catch` swallows the thrown error.

Restore the original behavior afterward so you don't leave the page in a broken state:
```js
Storage.prototype.setItem = realSetItem;
localStorage.removeItem("cpp26-progress");
location.reload();
```

- [ ] **Step 6: Commit**

```bash
git add prototype/cpp26-engine.jsx
git commit -m "$(cat <<'EOF'
Add saveProgress helper and persist progress on every change

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```
