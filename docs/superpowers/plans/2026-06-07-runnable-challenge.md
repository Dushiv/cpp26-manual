# Runnable, Auto-Checked "Напиши сам" Challenge — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the learner run their own "напиши сам" challenge code against the public Compiler Explorer API directly from the browser, see raw output, and optionally compare it against a verified reference output — without leaving the lesson.

**Architecture:** Pure front-end addition to the existing `prototype/cpp26-engine.jsx` single-file React prototype. A new `compileOnGodbolt()` helper POSTs straight to `https://godbolt.org/api/compiler/<id>/compile` (CORS-open, no proxy). The `Challenge` component grows a code editor + "Запустить"/"Сверить" buttons that call the helper and render raw stdout/stderr, with a ✓/✗ comparison against a newly-added `challenge.expectedOutput` field for "Сверить". A minimal static HTML harness is added so the prototype can actually run in a browser for testing (none currently exists — the prototype has been reviewed as code only).

**Tech Stack:** React (via CDN, no build step), `fetch`, Compiler Explorer public API. No new dependencies.

---

## Important context for the implementer

- Read the approved spec first: `docs/superpowers/specs/2026-06-07-runnable-challenge-design.md`. This plan implements it task-by-task; if anything here seems to contradict the spec, the spec wins and you should flag it.
- The prototype `prototype/cpp26-engine.jsx` is a **single self-contained file**: it has its own inline `COURSE_DATA`, all components, and a CSS string at the bottom (`const CSS = ...`). Follow that pattern — do not introduce a build step, bundler, or split into modules. React is loaded via `<script>` CDN tags (see Task 1, which creates the loader since none exists yet).
- `content/modules/m1.json` is the **authored source of truth**; `COURSE_DATA` in the prototype currently duplicates it by hand. Whenever you change lesson data, update **both** files identically (this is an existing, known divergence risk called out in `CLAUDE.md` — don't make it worse).
- The Compiler Explorer response shape (confirmed via `prototype/run-on-godbolt.js`):
  ```jsonc
  {
    "code": 0,                 // compiler exit code; non-zero = compile error
    "stdout": [{ "text": "..." }],   // compiler diagnostics (e.g. warnings)
    "stderr": [{ "text": "..." }],   // compiler errors go here when code != 0
    "execResult": {
      "code": 0,               // program exit code; -1 if execution didn't happen (e.g. build failed)
      "stdout": [{ "text": "20" }],
      "stderr": [{ "text": "..." }],
      "buildResult": { "code": 0, ... }
    }
  }
  ```
- Spec's `verifiedWith` field (lesson-level): `{ "compilerId": "gsnapshot", "flags": "-std=c++26 -O2" }`. The learner's code is compiled with this exact compiler+flags so the comparison is apples-to-apples with the stored `expectedOutput`.
- **Schema decision this plan makes concrete** (the spec says comparison reuses "the existing `expectedOutput`... data we already produce" but the current `challenge` schema in `docs/CONTENT_GUIDE.md` has no `expectedOutput` field — only `prompt`, `referenceSolution`, `godboltUrl`). Resolution: add an `expectedOutput` string field to `challenge`, populated the *same way* lesson example outputs are — Claude writes a complete runnable program based on the reference solution, verifies it via the `compiling-cpp26-examples` skill, and stores the real output. This is the natural reading of "reusing the process we already have," not a new test-authoring burden. Task 2 below does this for `m1-l1` concretely (verified output: `20`, from running the reference `nth` wrapped in a `main` that calls `nth<1>(10, 20, 30)` and prints it via `gsnapshot -std=c++26 -O2`).

---

## Task 1: Static HTML harness so the prototype can run in a browser

**Why:** No HTML file exists anywhere in the repo — the prototype has only ever been reviewed as source. To build and test a feature that calls a live network API from inside React state/effects, you need to actually run it in a browser (per the project's UI-testing expectations). This harness is the minimal thing that makes that possible, using the already-locked-in "React via CDN, no build tools" stack.

**Files:**
- Create: `prototype/index.html`

- [ ] **Step 1: Create the harness file**

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>C++26 — engine prototype</title>
</head>
<body>
  <div id="root"></div>

  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script crossorigin src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script crossorigin src="https://unpkg.com/lucide-react@0.344.0/dist/umd/lucide-react.js"></script>

  <script type="text/babel" data-type="module" data-presets="react" src="./cpp26-engine.jsx"></script>
  <script type="text/babel" data-presets="react">
    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(React.createElement(window.CPP26Engine));
  </script>
</body>
</html>
```

- [ ] **Step 2: Adapt the engine file's exports/imports for the CDN/Babel-standalone setup**

`prototype/cpp26-engine.jsx` currently does `import React, { useState } from "react"` and `import { Check, ... } from "lucide-react"` and `export default function App()`. Babel-standalone with `data-presets="react"` transpiles JSX but does **not** resolve ES module imports against CDN globals. Replace the import lines and the export so the file works as a plain script that exposes itself on `window`:

Replace (around line 1-2):
```jsx
import React, { useState } from "react";
import { Check, SkipForward, Circle, CircleDot, Repeat, ChevronRight, BookOpen } from "lucide-react";
```
with:
```jsx
const { useState } = React;
const { Check, SkipForward, Circle, CircleDot, Repeat, ChevronRight, BookOpen } = window.lucideReact || window.LucideReact;
```

Replace (around line 432):
```jsx
export default function App() {
```
with:
```jsx
function App() {
```

And at the very end of the file, after the `const CSS = ...` block, add:
```jsx
window.CPP26Engine = App;
```

- [ ] **Step 3: Run it and confirm the lesson renders**

Open `prototype/index.html` directly in a browser (e.g. `file:///c:/WORK/myProjects/с++26/prototype/index.html`, or serve the folder with `npx serve prototype` if `file://` blocks the CDN scripts via CORS — Chrome usually allows `file://` + cross-origin `<script src>` for this kind of static page, but if you see a blank page check the console for module/CORS errors and fall back to `npx serve`).

Expected: the "Pack indexing" (`m1-l1`) lesson loads, sidebar navigation works, examples/exercises/challenge/mastery sections all render exactly as they did when reviewed as source. This confirms the harness is correct *before* you start changing behavior — if something is broken here, it's the harness, not your feature work.

- [ ] **Step 4: Commit**

```bash
git add prototype/index.html prototype/cpp26-engine.jsx
git commit -m "Add static HTML harness so the engine prototype can run in a browser"
```

---

## Task 2: Add `expectedOutput` and `verifiedWith` to the lesson/challenge data

**Why:** The "Сверить" button needs something to compare the learner's output against (`challenge.expectedOutput`), and both buttons need to know which compiler+flags to use (`lesson.verifiedWith`). Both fields must exist in the data **before** the UI can use them. Per CLAUDE.md, `content/modules/m1.json` is the source of truth and `COURSE_DATA` in the prototype is a hand-kept duplicate — update both identically.

**Files:**
- Modify: `content/modules/m1.json` (lesson `m1-l1`, fields `verifiedWith` at lesson level and `expectedOutput` inside `challenge`)
- Modify: `prototype/cpp26-engine.jsx` (same fields, inside `COURSE_DATA.modules[1].lessons[0]`)

- [ ] **Step 1: Add `verifiedWith` to the `m1-l1` lesson object**

In `content/modules/m1.json`, the lesson object starts at line 8 with `"id": "m1-l1"`. Add `verifiedWith` as a sibling of `"outputsVerified"` (which is `false` at line 15):

```json
      "outputsVerified": false,
      "verifiedWith": { "compilerId": "gsnapshot", "flags": "-std=c++26 -O2" },
```

Make the identical edit in `prototype/cpp26-engine.jsx` at the equivalent spot (line 29, inside `COURSE_DATA`).

- [ ] **Step 2: Add `expectedOutput` to the `challenge` object**

The `challenge` object (line 74-78 in `content/modules/m1.json`, line 88-92 in the prototype) currently is:

```json
"challenge": {
  "prompt": "Классический до-C++26 способ достать N-й элемент пака — рекурсивный хелпер. Перепиши его в одну строку через pack indexing.\n\n```cpp\ntemplate <std::size_t N, typename T0, typename... Ts>\nauto nth(T0 t0, Ts... ts) {\n    if constexpr (N == 0) return t0; else return nth<N - 1>(ts...);\n}\n```",
  "referenceSolution": "```cpp\ntemplate <std::size_t N, typename... Ts>\nconstexpr auto nth(Ts... ts) { return ts...[N]; }\n```",
  "godboltUrl": null
}
```

This was already verified by running the reference `nth` wrapped in a complete program through `gsnapshot -std=c++26 -O2` (the same compiler+flags as `verifiedWith` above):

```cpp
#include <print>
#include <cstddef>

template <std::size_t N, typename... Ts>
constexpr auto nth(Ts... ts) { return ts...[N]; }

int main() {
    std::print("{}\n", nth<1>(10, 20, 30));
}
```

— exit code 0, stdout `20`. Add `expectedOutput` to the JSON (in both files):

```json
"challenge": {
  "prompt": "Классический до-C++26 способ достать N-й элемент пака — рекурсивный хелпер. Перепиши его в одну строку через pack indexing.\n\n```cpp\ntemplate <std::size_t N, typename T0, typename... Ts>\nauto nth(T0 t0, Ts... ts) {\n    if constexpr (N == 0) return t0; else return nth<N - 1>(ts...);\n}\n```",
  "referenceSolution": "```cpp\ntemplate <std::size_t N, typename... Ts>\nconstexpr auto nth(Ts... ts) { return ts...[N]; }\n```",
  "expectedOutput": "20",
  "godboltUrl": null
}
```

- [ ] **Step 3: Sanity-check both JSON files still parse**

```bash
node -e "JSON.parse(require('fs').readFileSync('content/modules/m1.json', 'utf8')); console.log('m1.json OK')"
node -e "const src = require('fs').readFileSync('prototype/cpp26-engine.jsx', 'utf8'); const m = src.match(/const COURSE_DATA = (\{[\s\S]*?\});\n\nconst STATUS/); JSON.parse(m[1]); console.log('COURSE_DATA OK')"
```

Expected: both print `OK`. If the second one fails to match, the `COURSE_DATA` block boundaries shifted — adjust the regex to the current line range, don't skip the check.

- [ ] **Step 4: Commit**

```bash
git add content/modules/m1.json prototype/cpp26-engine.jsx
git commit -m "Add verifiedWith and challenge.expectedOutput to m1-l1 for runnable-challenge feature"
```

---

## Task 3: `compileOnGodbolt` helper + manual smoke test from the browser console

**Why:** This is the one piece of new logic that talks to the network. Build and verify it in isolation — from the browser's console, against the live API — before wiring it into UI state, so that when the UI misbehaves later you already know the network call itself is solid.

**Files:**
- Modify: `prototype/cpp26-engine.jsx` (add a top-level helper function, near the other top-level helpers like `norm` at line 235)

- [ ] **Step 1: Add the helper function**

Insert after the `norm` line (`const norm = (s) => (s || "").trim();`):

```jsx
async function compileOnGodbolt(compilerId, source, flags) {
  const res = await fetch(`https://godbolt.org/api/compiler/${compilerId}/compile`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({
      source,
      options: { userArguments: flags, filters: { execute: true }, tools: [] },
    }),
  });
  if (!res.ok) throw new Error("godbolt-http-" + res.status);
  return res.json();
}

function godboltVerdict(data) {
  const join = (lines) => (lines || []).map((l) => l.text).join("\n");
  const compileOk = data.code === 0;
  const execOk = compileOk && data.execResult && data.execResult.code === 0;
  return {
    kind: !compileOk ? "compile-error" : !execOk ? "runtime-error" : "ok",
    compilerStderr: join(data.stderr),
    stdout: compileOk ? join(data.execResult && data.execResult.stdout) : "",
    stderr: compileOk ? join(data.execResult && data.execResult.stderr) : "",
    exitCode: compileOk ? (data.execResult ? data.execResult.code : null) : data.code,
  };
}
```

`godboltVerdict` is a pure function separated from the network call specifically so it can be smoke-tested with canned JSON (no network) in Step 2, and reused identically by both "Запустить" and "Сверить" in Task 4/5.

- [ ] **Step 2: Smoke-test `godboltVerdict` with canned data (no network) in the browser console**

With the Task 1 harness open in a browser, open the devtools console and paste:

```js
// compile error shape (code != 0, message in top-level stderr)
console.log(godboltVerdict({ code: 1, stderr: [{ text: "error: expected ';'" }], stdout: [] }));
// expect: { kind: "compile-error", compilerStderr: "error: expected ';'", stdout: "", stderr: "", exitCode: 1 }

// runtime crash shape (compiles fine, execResult.code != 0)
console.log(godboltVerdict({ code: 0, stdout: [], stderr: [], execResult: { code: 139, stdout: [{text:"partial"}], stderr: [{text:"Segmentation fault"}] } }));
// expect: { kind: "runtime-error", compilerStderr: "", stdout: "partial", stderr: "Segmentation fault", exitCode: 139 }

// success shape
console.log(godboltVerdict({ code: 0, stdout: [], stderr: [], execResult: { code: 0, stdout: [{text:"20"}], stderr: [] } }));
// expect: { kind: "ok", compilerStderr: "", stdout: "20", stderr: "", exitCode: 0 }
```

Expected: all three log lines match the comments. This locks down the classification logic against the exact response shapes from the "Error handling" table in the spec, before any UI exists to obscure bugs in it.

- [ ] **Step 3: Smoke-test `compileOnGodbolt` against the live API in the browser console**

```js
compileOnGodbolt("gsnapshot",
  '#include <print>\nint main(){ std::print("{}\\n", 1+1); }',
  "-std=c++26 -O2"
).then((d) => console.log(godboltVerdict(d)));
```

Expected: after a few seconds, logs `{ kind: "ok", compilerStderr: "", stdout: "2", stderr: "", exitCode: 0 }`. This confirms the CORS-open call works end-to-end from a real browser context (not just Node), which is the load-bearing assumption of the whole spec.

- [ ] **Step 4: Commit**

```bash
git add prototype/cpp26-engine.jsx
git commit -m "Add compileOnGodbolt helper and godboltVerdict classifier for the runnable challenge"
```

---

## Task 4: Code editor + "Запустить" in the `Challenge` component

**Why:** Build the run path first (simpler — no comparison logic) and verify it renders raw output correctly, before adding the compare path on top in Task 5.

**Files:**
- Modify: `prototype/cpp26-engine.jsx` (`Challenge` component, currently lines 359-373; also needs `lesson` passed in so it can read `verifiedWith`)

- [ ] **Step 1: Pass `lesson` into `Challenge` and add editor + run state**

The component is currently invoked at line 576 as `<Challenge ch={lesson.challenge} />`. Change that call site to:

```jsx
{lesson.challenge && <section><h2>Челлендж</h2><Challenge ch={lesson.challenge} verifiedWith={lesson.verifiedWith} /></section>}
```

Replace the `Challenge` function (lines 359-373) with:

```jsx
function Challenge({ ch, verifiedWith }) {
  const [show, setShow] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [run, setRun] = useState(null); // { mode: "run" | "check", ...godboltVerdict result } | { mode, kind: "network-error" }

  async function execute(mode) {
    setBusy(true);
    setRun(null);
    try {
      const data = await compileOnGodbolt(verifiedWith.compilerId, code, verifiedWith.flags);
      setRun({ mode, ...godboltVerdict(data) });
    } catch (e) {
      setRun({ mode, kind: "network-error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card challenge">
      <div className="card-h"><span className="tag tag-opt">Челлендж · необязательно</span></div>
      <Markdown text={ch.prompt} />

      <div className="chal-editor-label">Твоё решение</div>
      <textarea
        className="chal-editor"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="// напиши свой вариант здесь — компилируется и исполняется по кнопке ниже"
        spellCheck={false}
      />
      <div className="row">
        <button className="btn" disabled={busy || !code.trim()} onClick={() => execute("run")}>
          {busy && run === null ? "Компилирую…" : "Запустить"}
        </button>
        <button className="btn" disabled={busy || !code.trim()} onClick={() => execute("check")}>
          {busy && run === null ? "Компилирую…" : "Сверить"}
        </button>
      </div>

      {run && <ChallengeResult run={run} expectedOutput={ch.expectedOutput} />}

      {!show
        ? <button className="btn ghost" onClick={() => setShow(true)}>Показать эталонное решение</button>
        : <><div className="ref-label">Эталонное решение</div><Markdown text={ch.referenceSolution} /></>}
      <div className="ce">{ch.godboltUrl
        ? <a href={ch.godboltUrl} target="_blank" rel="noreferrer">Открыть в Compiler Explorer</a>
        : <span className="pend">godbolt-ссылка появится после прогона</span>}</div>
    </div>
  );
}
```

(`ChallengeResult` is added in Step 2 below — the component won't compile/render correctly until then, that's expected and fine for this intermediate step.)

- [ ] **Step 2: Add the `ChallengeResult` component, handling only the "run" mode for now**

Insert immediately above `Challenge`:

```jsx
function ChallengeResult({ run, expectedOutput }) {
  if (run.kind === "network-error") {
    return <div className="chal-result chal-network">Не получили ответ от Compiler Explorer — попробуйте ещё раз.</div>;
  }
  if (run.kind === "compile-error") {
    return (
      <div className="chal-result">
        <div className="chal-result-h">Ошибка компиляции</div>
        <pre className="cb chal-raw"><code>{run.compilerStderr}</code></pre>
      </div>
    );
  }
  // "runtime-error" or "ok": show raw stdout/stderr/exit code
  return (
    <div className="chal-result">
      <div className="chal-result-h">{run.kind === "runtime-error" ? "Программа завершилась с ошибкой" : "Вывод"}</div>
      {run.stdout && <pre className="cb chal-raw"><code>{run.stdout}</code></pre>}
      {run.stderr && <pre className="cb chal-raw chal-stderr"><code>{run.stderr}</code></pre>}
      <div className="chal-exit">код возврата: {run.exitCode}</div>
    </div>
  );
}
```

This intentionally ignores `run.mode` and `expectedOutput` for now — Task 5 adds the ✓/✗ branch for `mode === "check"`.

- [ ] **Step 3: Add CSS for the new elements**

In the `CSS` template string (starts at line 589), add after the existing `.challenge` / `.ref-label` / `.ce` rules (around line 706-709):

```css
.chal-editor-label { font-size:11px; text-transform:uppercase; letter-spacing:.05em; color:var(--mut); margin:14px 0 6px; }
.chal-editor { width:100%; min-height:140px; background:var(--codebg); border:1px solid var(--line); border-radius:10px;
  padding:12px 14px; color:var(--ink); font-size:13px; line-height:1.55; resize:vertical; margin-bottom:10px; }
.chal-editor:focus { outline:none; border-color:var(--amber); }
.chal-result { margin-top:12px; }
.chal-result-h { font-size:12px; text-transform:uppercase; letter-spacing:.05em; color:var(--mut); margin-bottom:7px; }
.chal-raw { margin-bottom:8px; }
.chal-stderr code { color:var(--red); }
.chal-exit { font-size:12px; color:var(--mut); }
.chal-network { padding:11px 14px; border-radius:9px; font-size:13px; color:var(--amber);
  background:rgba(217,164,65,.08); border:1px solid rgba(217,164,65,.3); }
```

- [ ] **Step 4: Run in the browser and verify "Запустить"**

Reload `prototype/index.html`, open `m1-l1`, scroll to the challenge. Type this into the editor:

```cpp
#include <print>
int main() { std::print("{}\n", 1 + 1); }
```

Click **Запустить**. Expected: button shows "Компилирую…" briefly, then a "Вывод" block appears showing `2` and "код возврата: 0".

Now replace the editor contents with deliberately broken code:

```cpp
#include <print>
int main() { std::print("{}\n" 1 + 1) }
```

Click **Запустить**. Expected: an "Ошибка компиляции" block appears with raw GCC diagnostics (no ✓/✗, per the spec's error-handling table — there's nothing to compare against a compile error).

- [ ] **Step 5: Commit**

```bash
git add prototype/cpp26-engine.jsx
git commit -m "Add code editor and Запустить to the challenge — raw run feedback"
```

---

## Task 5: "Сверить" — comparison against `expectedOutput`

**Why:** Layer the ✓/✗ verdict on top of the now-working run path, reusing the exact same `execute()`/`ChallengeResult` plumbing from Task 4 — only the rendering for `mode === "check"` and `kind === "ok"` changes.

**Files:**
- Modify: `prototype/cpp26-engine.jsx` (`ChallengeResult`, from Task 4)

- [ ] **Step 1: Extend `ChallengeResult` to render a verdict for `mode === "check"`**

Replace the final `return` block of `ChallengeResult` (the `"runtime-error" or "ok"` branch from Task 4 Step 2) with:

```jsx
  const verdict = run.mode === "check" && run.kind === "ok"
    ? norm(run.stdout) === norm(expectedOutput)
    : null;

  return (
    <div className="chal-result">
      <div className="chal-result-h">{run.kind === "runtime-error" ? "Программа завершилась с ошибкой" : "Вывод"}</div>
      {run.stdout && <pre className="cb chal-raw"><code>{run.stdout}</code></pre>}
      {run.stderr && <pre className="cb chal-raw chal-stderr"><code>{run.stderr}</code></pre>}
      <div className="chal-exit">код возврата: {run.exitCode}</div>
      {verdict !== null && (
        <div className={"verdict " + (verdict ? "ok" : "no")}>
          {verdict ? "Совпадает с эталонным выводом" : "Отличается от эталонного вывода"}
        </div>
      )}
      {verdict === false && (
        <div className="chal-diff">
          <div><span className="chal-diff-l">Твой вывод</span><pre className="cb chal-raw"><code>{run.stdout}</code></pre></div>
          <div><span className="chal-diff-l">Эталонный вывод</span><pre className="cb chal-raw"><code>{expectedOutput}</code></pre></div>
        </div>
      )}
    </div>
  );
```

(`norm` is the same trim helper already used by `Exercise` for `predict-output` comparison at line 309 — reuse it for consistency, don't reimplement string normalization.)

- [ ] **Step 2: Add CSS for the side-by-side diff**

Append to the CSS additions from Task 4 Step 3:

```css
.chal-diff { display:flex; gap:14px; margin-top:10px; flex-wrap:wrap; }
.chal-diff > div { flex:1; min-width:200px; }
.chal-diff-l { display:block; font-size:11px; text-transform:uppercase; letter-spacing:.05em; color:var(--mut); margin-bottom:5px; }
```

- [ ] **Step 3: Run in the browser and verify "Сверить" — match case**

Reload, open `m1-l1`'s challenge. Enter a correct solution, e.g.:

```cpp
#include <print>
#include <cstddef>
template <std::size_t N, typename... Ts>
constexpr auto nth(Ts... ts) { return ts...[N]; }
int main() { std::print("{}\n", nth<1>(10, 20, 30)); }
```

Click **Сверить**. Expected: "Вывод" shows `20`, then a green "Совпадает с эталонным выводом" badge — no diff block.

- [ ] **Step 4: Verify "Сверить" — mismatch case**

Change the program to print something else, e.g. `nth<0>(10, 20, 30)` (prints `10`). Click **Сверить**. Expected: a red "Отличается от эталонным выводом" badge, followed by a side-by-side "Твой вывод" (`10`) / "Эталонный вывод" (`20`) diff block.

- [ ] **Step 5: Verify "Сверить" on a compile error**

Re-paste the broken snippet from Task 4 Step 4 and click **Сверить**. Expected: same "Ошибка компиляции" block as for "Запустить" — no verdict badge, since `verdict` stays `null` whenever `run.kind !== "ok"`.

- [ ] **Step 6: Commit**

```bash
git add prototype/cpp26-engine.jsx
git commit -m "Add Сверить — compare challenge run output against verified expectedOutput"
```

---

## Task 6: Update docs to describe the new schema fields and capability

**Why:** The spec's "Docs to update" section lists exactly these three files. `verifiedWith` and `challenge.expectedOutput` are now real schema fields — `CONTENT_GUIDE.md` is the canonical schema doc and must show them so future lesson authoring includes them by default.

**Files:**
- Modify: `docs/CONTENT_GUIDE.md`
- Modify: `docs/MASTER_PLAN.md`
- Modify: `docs/PROJECT_OVERVIEW.md`

- [ ] **Step 1: Document the new fields in `CONTENT_GUIDE.md`'s JSON schema**

In the schema example (the fenced block starting around line 27), add `verifiedWith` as a sibling of `"prerequisites"` at the lesson level (after line 38, the lesson's `"background": null,`):

```json
      "background": null,
      "verifiedWith": { "compilerId": "gsnapshot", "flags": "-std=c++26 -O2" },
```

And add `expectedOutput` to the `challenge` block (currently lines 71-75):

```json
      "challenge": {
        "prompt": "markdown: свободное задание",
        "referenceSolution": "...",
        "expectedOutput": "...",
        "godboltUrl": "https://godbolt.org/..."
      },
```

Immediately below the schema's closing fence, after the existing sentence about optional fields (around line 87: "Поля `background` и `challenge` опциональны..."), add:

> `verifiedWith` записывает компилятор и флаги, которыми проверены выводы урока (см. скилл `compiling-cpp26-examples` — в большинстве уроков это `gsnapshot` с `-std=c++26 -O2`, опционально `-fcontracts` для Модуля 4). Тем же компилятором и флагами движок компилирует код ученика в челлендже, чтобы сравнение с `expectedOutput` было корректным (см. `docs/superpowers/specs/2026-06-07-runnable-challenge-design.md`). `challenge.expectedOutput` — это проверенный вывод эталонного решения, полученный тем же прогоном через Compiler Explorer, что и для примеров; без него кнопка «Сверить» не сможет показать вердикт.

- [ ] **Step 2: Add a Definition-of-Done item**

In the DoD checklist (lines 89-97), add a new line after the "проверенный `expectedOutput`" item (line 93):

```markdown
- [ ] Если в уроке есть `challenge`, у него заполнены `expectedOutput` (проверенный прогоном эталонного решения) и `verifiedWith` на уровне урока — иначе «Сверить» не сможет дать вердикт.
```

- [ ] **Step 3: Note the new capability in `MASTER_PLAN.md` B4**

Find the section documenting the exercise model / challenge in Part B4 (the section the spec references as already mentioning that "код компилирует... Claude"). Add a short note that the challenge can now offer immediate run/compare feedback in-app, while staying outside the mastery/progress path — e.g.:

> Челлендж теперь не только статичен (эталонное решение + ссылка на Compiler Explorer): ученик может скомпилировать и исполнить свой вариант прямо в приложении («Запустить») и сверить вывод с проверенным эталоном («Сверить») — см. `docs/superpowers/specs/2026-06-07-runnable-challenge-design.md`. Это остаётся опциональной обратной связью и не влияет на mastery-gating и прохождение модуля — только автопроверяемые задачи (`predict-output`/`find-bug`/`choice`) считаются для прогресса.

Place it directly after whatever sentence currently describes the challenge's "reference solution + Compiler Explorer link, doesn't affect progress" status, so the "doesn't affect progress" framing stays adjacent and unambiguous.

- [ ] **Step 4: Refine the "Compiler Explorer: только опциональные ссылки" line in `PROJECT_OVERVIEW.md`**

Replace line 24:
```
- **Compiler Explorer:** только опциональные ссылки «попробовать вживую», не часть прохождения.
```
with:
```
- **Compiler Explorer:** в уроке — только опциональные ссылки «попробовать вживую». В челлендже ученик дополнительно может скомпилировать и исполнить свой код прямо в приложении («Запустить»/«Сверить» — см. `docs/superpowers/specs/2026-06-07-runnable-challenge-design.md`); оба варианта остаются опциональными и не входят в прохождение/mastery-gating.
```

- [ ] **Step 5: Commit**

```bash
git add docs/CONTENT_GUIDE.md docs/MASTER_PLAN.md docs/PROJECT_OVERVIEW.md
git commit -m "Document verifiedWith/challenge.expectedOutput schema fields and in-app run/compare capability"
```

---

## Self-review notes (already applied above)

- **Spec coverage:** Architecture (Task 3), data model `verifiedWith` (Task 2), UI editor + Запустить/Сверить (Tasks 4-5), error-handling table's three cases — compile error / runtime crash / network failure (Task 4 Step 2 `ChallengeResult`, exercised in Task 4 Step 4 and Task 5 Step 5), "Открыть в Compiler Explorer" link kept (Task 4 Step 1 keeps it verbatim), docs to update (Task 6). The one schema gap in the spec (`challenge.expectedOutput` not previously defined) is called out and resolved explicitly in "Important context" + Task 2.
- **Type/name consistency check:** `compileOnGodbolt(compilerId, source, flags)` and `godboltVerdict(data)` (Task 3) are called identically in `Challenge.execute` (Task 4) with the same argument order and the same returned shape (`kind`, `compilerStderr`, `stdout`, `stderr`, `exitCode`) consumed by `ChallengeResult` (Tasks 4 and 5). `lesson.verifiedWith` / `ch.expectedOutput` field names match Task 2's JSON additions exactly.
- **No placeholders:** every step has literal code, exact file/line anchors, and concrete expected browser behavior to check against.
