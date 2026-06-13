# RU/EN i18n Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Russian/English language switcher covering both UI chrome and lesson content, per `docs/superpowers/specs/2026-06-13-i18n-design.md`.

**Architecture:** Lesson content moves to per-locale directories (`content/modules/ru/`, `content/modules/en/`), loaded at runtime via `fetch()` (replacing the stale inline `COURSE_DATA`). UI chrome strings move into a small `UI_STRINGS` dictionary accessed via a `t()` helper through a `LocaleContext`. Locale is persisted in `localStorage` and synced into the existing Supabase `progress` blob.

**Tech Stack:** Plain React (Babel-standalone, no build step), Playwright e2e, Node (for the parity-check script and http-server).

---

## File structure overview

- Move: `content/modules/m0.json` → `content/modules/ru/m0.json`
- Move: `content/modules/m1.json` → `content/modules/ru/m1.json`
- Create: `content/modules/ru/m2.json` … `content/modules/ru/m10.json` (stub modules, extracted from the current inline `COURSE_DATA`)
- Create: `content/modules/en/m0.json` … `content/modules/en/m10.json` (English tree; m0/m1 start as stubs and get filled in by Tasks 9–10)
- Modify: `prototype/cpp26-engine.jsx` (remove inline `COURSE_DATA`, add content loader, `UI_STRINGS`/`t()`/`LocaleContext`, locale switcher, persistence)
- Modify: `playwright.config.ts` (serve repo root so `fetch("../content/...")` resolves)
- Modify: `e2e/smoke.spec.ts`, `e2e/module0.spec.ts`, `e2e/lesson.spec.ts` (update `page.goto` path)
- Create: `e2e/i18n.spec.ts`
- Create: `prototype/check-i18n-parity.js`
- Modify: `docs/CONTENT_GUIDE.md`, `CLAUDE.md`

---

### Task 1: Restructure content into `ru/` + scaffold `en/` tree

**Files:**
- Move: `content/modules/m0.json` → `content/modules/ru/m0.json`
- Move: `content/modules/m1.json` → `content/modules/ru/m1.json`
- Create: `content/modules/ru/m2.json` through `content/modules/ru/m10.json`
- Create: `content/modules/en/m0.json` through `content/modules/en/m10.json`

- [ ] **Step 1: Move the two existing module files into `ru/`**

```bash
mkdir -p "content/modules/ru" "content/modules/en"
git mv content/modules/m0.json content/modules/ru/m0.json
git mv content/modules/m1.json content/modules/ru/m1.json
```

- [ ] **Step 2: Create the Russian stub module files `m2`–`m10`**

These are extracted verbatim from the current inline `COURSE_DATA` in `prototype/cpp26-engine.jsx` (lines 262-334).

`content/modules/ru/m2.json`:
```json
{
  "id": "m2",
  "moduleNumber": 2,
  "title": "Безопасность ядра",
  "significance": "важный",
  "prerequisites": [],
  "lessons": []
}
```

`content/modules/ru/m3.json`:
```json
{
  "id": "m3",
  "moduleNumber": 3,
  "title": "constexpr: всё на этапе компиляции",
  "significance": "фундамент",
  "prerequisites": [],
  "lessons": []
}
```

`content/modules/ru/m4.json`:
```json
{
  "id": "m4",
  "moduleNumber": 4,
  "title": "Contracts",
  "significance": "флагман",
  "prerequisites": [],
  "lessons": []
}
```

`content/modules/ru/m5.json`:
```json
{
  "id": "m5",
  "moduleNumber": 5,
  "title": "Static Reflection",
  "significance": "флагман №1",
  "prerequisites": [],
  "lessons": []
}
```

`content/modules/ru/m6.json`:
```json
{
  "id": "m6",
  "moduleNumber": 6,
  "title": "std::execution (Senders/Receivers)",
  "significance": "флагман",
  "prerequisites": [],
  "lessons": []
}
```

`content/modules/ru/m7.json`:
```json
{
  "id": "m7",
  "moduleNumber": 7,
  "title": "Новые контейнеры и типы",
  "significance": "важный",
  "prerequisites": [],
  "lessons": []
}
```

`content/modules/ru/m8.json`:
```json
{
  "id": "m8",
  "moduleNumber": 8,
  "title": "Числа и производительность",
  "significance": "важный",
  "prerequisites": [],
  "lessons": []
}
```

`content/modules/ru/m9.json`:
```json
{
  "id": "m9",
  "moduleNumber": 9,
  "title": "Низкоуровневая конкурентность",
  "significance": "специальный",
  "prerequisites": [],
  "lessons": []
}
```

`content/modules/ru/m10.json`:
```json
{
  "id": "m10",
  "moduleNumber": 10,
  "title": "Отладка, формат, удалённое",
  "significance": "завершающий",
  "prerequisites": [],
  "lessons": []
}
```

- [ ] **Step 3: Create the English module tree, `m0`/`m1` as stubs for now**

`content/modules/en/m0.json` (full lesson content is added in Task 9 — for now `m0-l1` is a stub so the loader/e2e infra can be built and tested first):
```json
{
  "id": "m0",
  "moduleNumber": 0,
  "title": "C++26 context",
  "significance": "intro",
  "prerequisites": [],
  "lessons": [
    {
      "id": "m0-l1",
      "title": "C++26 context",
      "stub": true
    }
  ]
}
```

`content/modules/en/m1.json` (full `m1-l1` content is added in Task 10; stub lessons get their final titles now since they don't change):
```json
{
  "id": "m1",
  "moduleNumber": 1,
  "title": "Core language ergonomics",
  "significance": "basic",
  "prerequisites": [],
  "lessons": [
    {
      "id": "m1-l1",
      "title": "Pack indexing",
      "stub": true
    },
    {
      "id": "m1-l2",
      "title": "Placeholder `_`",
      "stub": true
    },
    {
      "id": "m1-l3",
      "title": "= delete(\"reason\")",
      "stub": true
    },
    {
      "id": "m1-l4",
      "title": "Structured bindings as pack (P1061)",
      "stub": true
    },
    {
      "id": "m1-l5",
      "title": "#embed",
      "stub": true
    },
    {
      "id": "m1-l6",
      "title": "Miscellaneous (variadic friend, static_assert message)",
      "stub": true
    }
  ]
}
```

`content/modules/en/m2.json`:
```json
{
  "id": "m2",
  "moduleNumber": 2,
  "title": "Core safety",
  "significance": "important",
  "prerequisites": [],
  "lessons": []
}
```

`content/modules/en/m3.json`:
```json
{
  "id": "m3",
  "moduleNumber": 3,
  "title": "constexpr: everything at compile time",
  "significance": "foundation",
  "prerequisites": [],
  "lessons": []
}
```

`content/modules/en/m4.json`:
```json
{
  "id": "m4",
  "moduleNumber": 4,
  "title": "Contracts",
  "significance": "flagship",
  "prerequisites": [],
  "lessons": []
}
```

`content/modules/en/m5.json`:
```json
{
  "id": "m5",
  "moduleNumber": 5,
  "title": "Static Reflection",
  "significance": "flagship #1",
  "prerequisites": [],
  "lessons": []
}
```

`content/modules/en/m6.json`:
```json
{
  "id": "m6",
  "moduleNumber": 6,
  "title": "std::execution (Senders/Receivers)",
  "significance": "flagship",
  "prerequisites": [],
  "lessons": []
}
```

`content/modules/en/m7.json`:
```json
{
  "id": "m7",
  "moduleNumber": 7,
  "title": "New containers and types",
  "significance": "important",
  "prerequisites": [],
  "lessons": []
}
```

`content/modules/en/m8.json`:
```json
{
  "id": "m8",
  "moduleNumber": 8,
  "title": "Numerics and performance",
  "significance": "important",
  "prerequisites": [],
  "lessons": []
}
```

`content/modules/en/m9.json`:
```json
{
  "id": "m9",
  "moduleNumber": 9,
  "title": "Low-level concurrency",
  "significance": "special",
  "prerequisites": [],
  "lessons": []
}
```

`content/modules/en/m10.json`:
```json
{
  "id": "m10",
  "moduleNumber": 10,
  "title": "Debugging, formatting, removed features",
  "significance": "final",
  "prerequisites": [],
  "lessons": []
}
```

- [ ] **Step 4: Commit**

```bash
git add content/modules
git commit -m "Restructure lesson content into per-locale ru/en directories"
```

---

### Task 2: Serve the repo root so the engine can `fetch()` content files

The engine will `fetch("../content/modules/<locale>/<id>.json")` relative to
`prototype/index.html`. `http-server` currently serves only `prototype/` as
root, so `content/` is unreachable. Serve the repo root instead and adjust the
URL the tests open.

**Files:**
- Modify: `playwright.config.ts`
- Modify: `e2e/smoke.spec.ts`
- Modify: `e2e/module0.spec.ts`
- Modify: `e2e/lesson.spec.ts`

- [ ] **Step 1: Update `playwright.config.ts`**

```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://127.0.0.1:8901",
  },
  webServer: {
    command: "npx http-server . -p 8901 --cors",
    url: "http://127.0.0.1:8901/prototype/index.html",
    reuseExistingServer: true,
  },
});
```

- [ ] **Step 2: Update `page.goto` calls in the three existing spec files**

In `e2e/smoke.spec.ts`, `e2e/module0.spec.ts`, and `e2e/lesson.spec.ts`,
replace:

```typescript
  await page.goto("/index.html");
```

with:

```typescript
  await page.goto("/prototype/index.html");
```

(`e2e/module0.spec.ts` and `e2e/lesson.spec.ts` use this inside
`test.beforeEach`; `e2e/smoke.spec.ts` uses it inside the single `test(...)`.)

- [ ] **Step 3: Run the existing e2e suite to confirm serving still works**

The engine still has its inline `COURSE_DATA` at this point (Task 3 removes
it), so these tests should still pass unchanged — this step only validates
the new serving path.

Run: `npm run test:e2e`
Expected: all existing tests in `smoke.spec.ts`, `module0.spec.ts`,
`lesson.spec.ts` PASS.

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts e2e/smoke.spec.ts e2e/module0.spec.ts e2e/lesson.spec.ts
git commit -m "Serve repo root in e2e so the engine can fetch content/ files"
```

---

### Task 3: Replace inline `COURSE_DATA` with a per-locale content loader

**Files:**
- Modify: `prototype/cpp26-engine.jsx`

- [ ] **Step 1: Delete the inline `COURSE_DATA` object**

Delete lines 4-335 of `prototype/cpp26-engine.jsx` — the entire
`const COURSE_DATA = { ... };` block (from `const COURSE_DATA = {` through
the matching `};`).

- [ ] **Step 2: Add the module id list and async loader in its place**

Insert at the same location (top of file, after the lucide-react import line):

```javascript
const MODULE_IDS = ["m0", "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10"];

async function loadCourseData(locale) {
  const modules = await Promise.all(MODULE_IDS.map(async (id) => {
    const res = await fetch(`../content/modules/${locale}/${id}.json`);
    if (!res.ok) throw new Error(`failed to load ${locale}/${id}.json: ${res.status}`);
    return res.json();
  }));
  return { modules };
}
```

- [ ] **Step 3: Load course data in `App()` and gate rendering on it**

In `App()`, find:

```javascript
function App() {
  const modules = COURSE_DATA.modules;
  const [saved] = useState(loadProgress);
```

Replace with:

```javascript
function App() {
  const [saved] = useState(loadProgress);
  const [locale, setLocale] = useState(saved && saved.locale ? saved.locale : "ru");
  const [courseData, setCourseData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setCourseData(null);
    loadCourseData(locale).then((data) => { if (!cancelled) setCourseData(data); });
    return () => { cancelled = true; };
  }, [locale]);
```

- [ ] **Step 4: Guard the rest of `App()` on `courseData` being loaded**

Still in `App()`, find the line:

```javascript
  const allLessons = modules.flatMap((m) => (m.lessons || []).map((l) => ({ ...l, mod: m })));
```

and insert immediately before it:

```javascript
  if (!courseData) {
    return <div className="app"><style>{CSS}</style><div className="empty-big">Loading…</div></div>;
  }
  const modules = courseData.modules;
```

(The hardcoded "Loading…" string is replaced with `t("loading")` in Task 6
once `UI_STRINGS`/`t()` exist — left as a literal here so this task is
independently testable.)

- [ ] **Step 5: Run the e2e suite**

Run: `npm run test:e2e`
Expected: all tests PASS — content now loads from
`content/modules/ru/*.json` instead of the inline object, and the rendered
output is identical (since `ru/m0.json`/`ru/m1.json` are the same files that
were inlined, just moved).

- [ ] **Step 6: Commit**

```bash
git add prototype/cpp26-engine.jsx
git commit -m "Load course content from content/modules/<locale>/ via fetch"
```

---

### Task 4: Add `UI_STRINGS`, `t()`, and `LocaleContext`

**Files:**
- Modify: `prototype/cpp26-engine.jsx`

- [ ] **Step 1: Add the `UI_STRINGS` dictionary, `t()`, and `LocaleContext`**

Insert after the `loadCourseData` function added in Task 3:

```javascript
const UI_STRINGS = {
  ru: {
    courseTitle: "C++26 — от нуля до полного понимания",
    loading: "Загрузка…",
    lessonsProgress: (done, total) => `${done} / ${total} уроков`,
    repetitionZone: "Зона повторения",
    strictMode: "Строгий режим (закрытие без пропусков)",
    lessonsComingSoon: "уроки появятся позже",
    soon: "скоро",
    modSkipped: (n) => `${n} задач пропущено`,
    selectLesson: "Выбери урок слева.",
    stubLesson: "Этот урок ещё не написан. Каркас движка готов его принять — контент подставляется из JSON.",
    module: "Модуль",
    background: "Фон / предпосылки",
    motivation: "Мотивация",
    theory: "Теория",
    examples: "Примеры",
    example: "Пример",
    predictThenReveal: "Сначала предскажи вывод — потом раскрой",
    output: "Вывод",
    pendingRun: "ждёт прогона",
    exercises: "Упражнения",
    check: "Проверить",
    checkLine: (n) => (n ? `Проверить строку #${n}` : "Проверить"),
    yourPredictedOutput: "ваш предсказанный вывод",
    correct: "Верно",
    correctAnswerIs: (a) => `Правильный ответ: ${a}`,
    correctBugAt: (n) => `баг в строке ${n}`,
    correctPrefix: "Верно — ",
    skip: "Пропустить",
    unskip: "Отменить пропуск",
    skipped: "Пропущено",
    tryAgain: "Попробовать снова",
    challengeOptional: "Челлендж · необязательно",
    yourSolution: "Твоё решение",
    solutionPlaceholder: "// напиши свой вариант здесь — компилируется и исполняется по кнопке ниже",
    run: "Запустить",
    compareWithReference: "Сверить",
    compiling: "Компилирую…",
    networkError: "Не получили ответ от Compiler Explorer — попробуйте ещё раз.",
    compileError: "Ошибка компиляции",
    runtimeError: "Программа завершилась с ошибкой",
    exitCode: (n) => `код возврата: ${n}`,
    matchesExpected: "Совпадает с эталонным выводом",
    differsFromExpected: "Отличается от эталонного вывода",
    yourOutput: "Твой вывод",
    referenceOutput: "Эталонный вывод",
    showReferenceSolution: "Показать эталонное решение",
    referenceSolutionLabel: "Эталонное решение",
    openInCompilerExplorer: "Открыть в Compiler Explorer",
    godboltPending: "godbolt-ссылка появится после прогона",
    masteryCheckTitle: "Проверка усвоения",
    threshold: (pct) => `порог ${pct}%`,
    finishCheck: "Завершить проверку",
    retake: "Пройти заново",
    masteryResult: (score, passed, thr) => `Результат: ${score}% — ${passed ? "зачёт, урок пройден" : `ниже порога ${thr}% — повтори теорию и пройди заново`}`,
    repetitionTitle: "Зона повторения",
    repetitionSubtitle: "Сюда автоматически попадают пропущенные задачи. Статус «Пропущено» — это не «Выполнено»; вернись и закрой пробел в любой момент.",
    noSkippedItems: "Пропущенных задач нет.",
    signInGoogle: "Google",
    signInGithub: "GitHub",
    signOut: "Выйти",
    defaultLearnerName: "Ученик",
    statusDone: "Выполнено",
    statusSkipped: "Пройдено с пропусками",
    statusInProgress: "В процессе",
    statusNotStarted: "Не начато",
    outputsPending: "выводы ждут прогона на GCC 16.1",
  },
  en: {
    courseTitle: "C++26 — from zero to full understanding",
    loading: "Loading…",
    lessonsProgress: (done, total) => `${done} / ${total} lessons`,
    repetitionZone: "Review zone",
    strictMode: "Strict mode (no completion with skips)",
    lessonsComingSoon: "lessons coming later",
    soon: "soon",
    modSkipped: (n) => `${n} skipped`,
    selectLesson: "Pick a lesson on the left.",
    stubLesson: "This lesson isn't written yet. The engine is ready to render it once the content lands in the JSON.",
    module: "Module",
    background: "Background / prerequisites",
    motivation: "Motivation",
    theory: "Theory",
    examples: "Examples",
    example: "Example",
    predictThenReveal: "Predict the output first — then reveal",
    output: "Output",
    pendingRun: "awaiting run",
    exercises: "Exercises",
    check: "Check",
    checkLine: (n) => (n ? `Check line #${n}` : "Check"),
    yourPredictedOutput: "your predicted output",
    correct: "Correct",
    correctAnswerIs: (a) => `Correct answer: ${a}`,
    correctBugAt: (n) => `bug is on line ${n}`,
    correctPrefix: "Correct — ",
    skip: "Skip",
    unskip: "Undo skip",
    skipped: "Skipped",
    tryAgain: "Try again",
    challengeOptional: "Challenge · optional",
    yourSolution: "Your solution",
    solutionPlaceholder: "// write your solution here — it compiles and runs via the button below",
    run: "Run",
    compareWithReference: "Compare",
    compiling: "Compiling…",
    networkError: "No response from Compiler Explorer — try again.",
    compileError: "Compile error",
    runtimeError: "The program exited with an error",
    exitCode: (n) => `exit code: ${n}`,
    matchesExpected: "Matches the reference output",
    differsFromExpected: "Differs from the reference output",
    yourOutput: "Your output",
    referenceOutput: "Reference output",
    showReferenceSolution: "Show reference solution",
    referenceSolutionLabel: "Reference solution",
    openInCompilerExplorer: "Open in Compiler Explorer",
    godboltPending: "the godbolt link appears after a run",
    masteryCheckTitle: "Mastery check",
    threshold: (pct) => `threshold ${pct}%`,
    finishCheck: "Finish check",
    retake: "Retake",
    masteryResult: (score, passed, thr) => `Result: ${score}% — ${passed ? "passed, lesson complete" : `below the ${thr}% threshold — review the theory and try again`}`,
    repetitionTitle: "Review zone",
    repetitionSubtitle: "Skipped exercises land here automatically. “Skipped” is not “Done” — come back and close the gap whenever you like.",
    noSkippedItems: "No skipped exercises.",
    signInGoogle: "Google",
    signInGithub: "GitHub",
    signOut: "Sign out",
    defaultLearnerName: "Learner",
    statusDone: "Done",
    statusSkipped: "Done with skips",
    statusInProgress: "In progress",
    statusNotStarted: "Not started",
    outputsPending: "outputs await a run on GCC 16.1",
  },
};

const LocaleContext = React.createContext("ru");

function t(locale, key, ...args) {
  const dict = UI_STRINGS[locale] || UI_STRINGS.ru;
  const entry = dict[key] !== undefined ? dict[key] : UI_STRINGS.ru[key];
  return typeof entry === "function" ? entry(...args) : entry;
}

function useT() {
  const locale = React.useContext(LocaleContext);
  return (key, ...args) => t(locale, key, ...args);
}
```

- [ ] **Step 2: Run the e2e suite**

Run: `npm run test:e2e`
Expected: all tests still PASS (nothing references `UI_STRINGS`/`t()`/
`LocaleContext` yet, so this is purely additive).

- [ ] **Step 3: Commit**

```bash
git add prototype/cpp26-engine.jsx
git commit -m "Add UI_STRINGS dictionary, t() helper, and LocaleContext"
```

---

### Task 5: Wire `t()` into the leaf components

Each component below currently has hardcoded Russian strings. Replace them
with `t()` calls via the `useT()` hook from Task 4. Apply the diffs in order;
each is independent and the file stays valid React after each one.

**Files:**
- Modify: `prototype/cpp26-engine.jsx`

- [ ] **Step 1: `ExampleCard`**

Replace:

```javascript
function ExampleCard({ ex, idx }) {
  const [show, setShow] = useState(false);
  return (
    <div className="card">
      <div className="card-h"><span className="tag tag-ex">Пример {idx + 1}</span><span className="card-t">{ex.title}</span></div>
      <CodeBlock code={ex.code} />
      {!show
        ? <button className="btn ghost" onClick={() => setShow(true)}>Сначала предскажи вывод — потом раскрой</button>
        : <>
            <div className="out"><span className="out-l">Вывод</span><code className="out-v">{ex.expectedOutput}</code><span className="pend">ждёт прогона</span></div>
            <div className="exp"><Markdown text={ex.explanation} /></div>
          </>}
    </div>
  );
}
```

with:

```javascript
function ExampleCard({ ex, idx }) {
  const [show, setShow] = useState(false);
  const t = useT();
  return (
    <div className="card">
      <div className="card-h"><span className="tag tag-ex">{t("example")} {idx + 1}</span><span className="card-t">{ex.title}</span></div>
      <CodeBlock code={ex.code} />
      {!show
        ? <button className="btn ghost" onClick={() => setShow(true)}>{t("predictThenReveal")}</button>
        : <>
            <div className="out"><span className="out-l">{t("output")}</span><code className="out-v">{ex.expectedOutput}</code><span className="pend">{t("pendingRun")}</span></div>
            <div className="exp"><Markdown text={ex.explanation} /></div>
          </>}
    </div>
  );
}
```

- [ ] **Step 2: `Exercise`**

Replace:

```javascript
function Exercise({ ex, idx, status, onResolve, onSkip, onUnskip }) {
  const [picked, setPicked] = useState(null);
  const [val, setVal] = useState("");
  const [done, setDone] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [skipped, setSkipped] = useState(() => status === "skipped");

  const lvl = ex.level === "advanced" ? "advanced" : "basic";
  const lvlLabel = ex.level === "advanced" ? "Advanced" : "Basic";

  function finish(isCorrect) { setDone(true); setCorrect(isCorrect); setSkipped(false); onResolve(isCorrect); }
  function reset() { setDone(false); setCorrect(false); setPicked(null); setVal(""); }
  function skip() { setSkipped(true); onSkip(); }
  function unskip() { setSkipped(false); onUnskip(); }

  let body = null;
  if (ex.type === "predict-output") {
    body = <>
      <CodeBlock code={ex.code} />
      {!done
        ? <div className="row">
            <input className="inp" value={val} onChange={(e) => setVal(e.target.value)} placeholder="ваш предсказанный вывод" />
            <button className="btn" onClick={() => finish(norm(val) === norm(ex.answer))} disabled={!val.trim()}>Проверить</button>
          </div>
        : <div className={"verdict " + (correct ? "ok" : "no")}>{correct ? "Верно" : ("Правильный ответ: " + ex.answer)}</div>}
    </>;
  } else if (ex.type === "find-bug") {
    const lines = ex.code.split("\n");
    body = <>
      <pre className="cb linecode">
        {lines.map((ln, i) => {
          const n = i + 1;
          const cls = done
            ? (n === ex.answerLine ? "buggy" : (n === picked && picked !== ex.answerLine ? "wrong" : ""))
            : (n === picked ? "sel" : "");
          return <div key={n} className={"cl " + cls} onClick={() => !done && setPicked(n)}>
            <span className="ln">{n}</span><span className="lc">{ln || " "}</span></div>;
        })}
      </pre>
      {!done
        ? <div className="row"><button className="btn" disabled={!picked} onClick={() => finish(picked === ex.answerLine)}>Проверить{picked ? " строку #" + picked : ""}</button></div>
        : <div className={"verdict " + (correct ? "ok" : "no")}>{(correct ? "Верно — " : "") + "баг в строке " + ex.answerLine}</div>}
    </>;
  } else {
    body = <>
      {ex.code && <CodeBlock code={ex.code} />}
      {ex.prompt && <p className="prompt">{renderInline(ex.prompt, "pr" + idx + "-")}</p>}
      <div className="opts">
        {ex.options.map((o, i) => {
          const cls = done
            ? (i === ex.answerIndex ? "ok" : (i === picked && picked !== ex.answerIndex ? "no" : ""))
            : (i === picked ? "sel" : "");
          return <button key={i} className={"opt " + cls} onClick={() => { if (done) return; setPicked(i); finish(i === ex.answerIndex); }}>{renderInline(o, "o" + idx + "-" + i + "-")}</button>;
        })}
      </div>
    </>;
  }

  const showSkipped = skipped && !done;

  return (
    <div className={"card ex" + (showSkipped ? " ex-skipped" : "")}>
      <div className="card-h">
        <span className={"tag tag-" + lvl}>{lvlLabel}</span>
        <span className="tag tag-type">{ex.type}</span>
        {showSkipped && <span className="badge-skip">Пропущено</span>}
        {!done && (showSkipped
          ? <button className="btn skip" onClick={unskip}>Отменить пропуск</button>
          : <button className="btn skip" onClick={skip}>Пропустить</button>)}
      </div>
      {body}
      {done && <div className="exp"><Markdown text={ex.explanation} /></div>}
      {done && <button className="btn ghost sm" onClick={reset}>Попробовать снова</button>}
    </div>
  );
}
```

with:

```javascript
function Exercise({ ex, idx, status, onResolve, onSkip, onUnskip }) {
  const [picked, setPicked] = useState(null);
  const [val, setVal] = useState("");
  const [done, setDone] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [skipped, setSkipped] = useState(() => status === "skipped");
  const t = useT();

  const lvl = ex.level === "advanced" ? "advanced" : "basic";
  const lvlLabel = ex.level === "advanced" ? "Advanced" : "Basic";

  function finish(isCorrect) { setDone(true); setCorrect(isCorrect); setSkipped(false); onResolve(isCorrect); }
  function reset() { setDone(false); setCorrect(false); setPicked(null); setVal(""); }
  function skip() { setSkipped(true); onSkip(); }
  function unskip() { setSkipped(false); onUnskip(); }

  let body = null;
  if (ex.type === "predict-output") {
    body = <>
      <CodeBlock code={ex.code} />
      {!done
        ? <div className="row">
            <input className="inp" value={val} onChange={(e) => setVal(e.target.value)} placeholder={t("yourPredictedOutput")} />
            <button className="btn" onClick={() => finish(norm(val) === norm(ex.answer))} disabled={!val.trim()}>{t("check")}</button>
          </div>
        : <div className={"verdict " + (correct ? "ok" : "no")}>{correct ? t("correct") : t("correctAnswerIs", ex.answer)}</div>}
    </>;
  } else if (ex.type === "find-bug") {
    const lines = ex.code.split("\n");
    body = <>
      <pre className="cb linecode">
        {lines.map((ln, i) => {
          const n = i + 1;
          const cls = done
            ? (n === ex.answerLine ? "buggy" : (n === picked && picked !== ex.answerLine ? "wrong" : ""))
            : (n === picked ? "sel" : "");
          return <div key={n} className={"cl " + cls} onClick={() => !done && setPicked(n)}>
            <span className="ln">{n}</span><span className="lc">{ln || " "}</span></div>;
        })}
      </pre>
      {!done
        ? <div className="row"><button className="btn" disabled={!picked} onClick={() => finish(picked === ex.answerLine)}>{t("checkLine", picked)}</button></div>
        : <div className={"verdict " + (correct ? "ok" : "no")}>{(correct ? t("correctPrefix") : "") + t("correctBugAt", ex.answerLine)}</div>}
    </>;
  } else {
    body = <>
      {ex.code && <CodeBlock code={ex.code} />}
      {ex.prompt && <p className="prompt">{renderInline(ex.prompt, "pr" + idx + "-")}</p>}
      <div className="opts">
        {ex.options.map((o, i) => {
          const cls = done
            ? (i === ex.answerIndex ? "ok" : (i === picked && picked !== ex.answerIndex ? "no" : ""))
            : (i === picked ? "sel" : "");
          return <button key={i} className={"opt " + cls} onClick={() => { if (done) return; setPicked(i); finish(i === ex.answerIndex); }}>{renderInline(o, "o" + idx + "-" + i + "-")}</button>;
        })}
      </div>
    </>;
  }

  const showSkipped = skipped && !done;

  return (
    <div className={"card ex" + (showSkipped ? " ex-skipped" : "")}>
      <div className="card-h">
        <span className={"tag tag-" + lvl}>{lvlLabel}</span>
        <span className="tag tag-type">{ex.type}</span>
        {showSkipped && <span className="badge-skip">{t("skipped")}</span>}
        {!done && (showSkipped
          ? <button className="btn skip" onClick={unskip}>{t("unskip")}</button>
          : <button className="btn skip" onClick={skip}>{t("skip")}</button>)}
      </div>
      {body}
      {done && <div className="exp"><Markdown text={ex.explanation} /></div>}
      {done && <button className="btn ghost sm" onClick={reset}>{t("tryAgain")}</button>}
    </div>
  );
}
```

Note: `t("checkLine", picked)` — `picked` is `null` until a line is clicked,
and the `UI_STRINGS.*.checkLine` function falls back to the plain "Check"/
"Проверить" label when its argument is falsy, matching the old
`"Проверить" + (picked ? " строку #" + picked : "")` behavior.

- [ ] **Step 3: `ChallengeResult`**

Replace:

```javascript
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
}
```

with:

```javascript
function ChallengeResult({ run, expectedOutput }) {
  const t = useT();
  if (run.kind === "network-error") {
    return <div className="chal-result chal-network">{t("networkError")}</div>;
  }
  if (run.kind === "compile-error") {
    return (
      <div className="chal-result">
        <div className="chal-result-h">{t("compileError")}</div>
        <pre className="cb chal-raw"><code>{run.compilerStderr}</code></pre>
      </div>
    );
  }
  const verdict = run.mode === "check" && run.kind === "ok"
    ? norm(run.stdout) === norm(expectedOutput)
    : null;

  return (
    <div className="chal-result">
      <div className="chal-result-h">{run.kind === "runtime-error" ? t("runtimeError") : t("output")}</div>
      {run.stdout && <pre className="cb chal-raw"><code>{run.stdout}</code></pre>}
      {run.stderr && <pre className="cb chal-raw chal-stderr"><code>{run.stderr}</code></pre>}
      <div className="chal-exit">{t("exitCode", run.exitCode)}</div>
      {verdict !== null && (
        <div className={"verdict " + (verdict ? "ok" : "no")}>
          {verdict ? t("matchesExpected") : t("differsFromExpected")}
        </div>
      )}
      {verdict === false && (
        <div className="chal-diff">
          <div><span className="chal-diff-l">{t("yourOutput")}</span><pre className="cb chal-raw"><code>{run.stdout}</code></pre></div>
          <div><span className="chal-diff-l">{t("referenceOutput")}</span><pre className="cb chal-raw"><code>{expectedOutput}</code></pre></div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: `Challenge`**

Replace:

```javascript
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
          {pendingMode === "run" ? "Компилирую…" : "Запустить"}
        </button>
        <button className="btn" disabled={busy || !code.trim()} onClick={() => execute("check")}>
          {pendingMode === "check" ? "Компилирую…" : "Сверить"}
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

with:

```javascript
  const t = useT();
  return (
    <div className="card challenge">
      <div className="card-h"><span className="tag tag-opt">{t("challengeOptional")}</span></div>
      <Markdown text={ch.prompt} />

      <div className="chal-editor-label">{t("yourSolution")}</div>
      <textarea
        className="chal-editor"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={t("solutionPlaceholder")}
        spellCheck={false}
      />
      <div className="row">
        <button className="btn" disabled={busy || !code.trim()} onClick={() => execute("run")}>
          {pendingMode === "run" ? t("compiling") : t("run")}
        </button>
        <button className="btn" disabled={busy || !code.trim()} onClick={() => execute("check")}>
          {pendingMode === "check" ? t("compiling") : t("compareWithReference")}
        </button>
      </div>

      {run && <ChallengeResult run={run} expectedOutput={ch.expectedOutput} />}

      {!show
        ? <button className="btn ghost" onClick={() => setShow(true)}>{t("showReferenceSolution")}</button>
        : <><div className="ref-label">{t("referenceSolutionLabel")}</div><Markdown text={ch.referenceSolution} /></>}
      <div className="ce">{ch.godboltUrl
        ? <a href={ch.godboltUrl} target="_blank" rel="noreferrer">{t("openInCompilerExplorer")}</a>
        : <span className="pend">{t("godboltPending")}</span>}</div>
    </div>
  );
}
```

This `const t = useT();` line goes right after the `function Challenge({ ch, verifiedWith }) {` opening and the existing `const [show, setShow] = useState(false);` etc. — place it alongside the other hook declarations at the top of the function, not where the `return` starts. Adjust placement accordingly: add `const t = useT();` immediately after the existing `useState`/`async function execute` block, before `return (`.

- [ ] **Step 5: `Background`**

Replace:

```javascript
function Background({ text }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  return (
    <div className="bg">
      <button className="bg-toggle" onClick={() => setOpen((o) => !o)}>{open ? "▾" : "▸"} Фон / предпосылки</button>
      {open && <div className="bg-body"><Markdown text={text} /></div>}
    </div>
  );
}
```

with:

```javascript
function Background({ text }) {
  const [open, setOpen] = useState(false);
  const t = useT();
  if (!text) return null;
  return (
    <div className="bg">
      <button className="bg-toggle" onClick={() => setOpen((o) => !o)}>{open ? "▾" : "▸"} {t("background")}</button>
      {open && <div className="bg-body"><Markdown text={text} /></div>}
    </div>
  );
}
```

- [ ] **Step 6: `Mastery`**

Replace:

```javascript
  return (
    <div className="mastery">
      {qs.map((q, i) => (
        <div key={i} className="mq">
          <div className="mq-p"><span className="mq-n">{i + 1}</span>{renderInline(q.prompt, "mq" + i + "-")}</div>
          <div className="opts">
            {q.options.map((o, oi) => {
              const cls = submitted
                ? (oi === q.answerIndex ? "ok" : (ans[i] === oi && ans[i] !== q.answerIndex ? "no" : ""))
                : (ans[i] === oi ? "sel" : "");
              return <button key={oi} className={"opt " + cls} onClick={() => !submitted && setAns((s) => ({ ...s, [i]: oi }))}>{renderInline(o, "mo" + i + "-" + oi + "-")}</button>;
            })}
          </div>
        </div>
      ))}
      {!submitted
        ? <button className="btn primary" disabled={!allAnswered} onClick={submit}>Завершить проверку</button>
        : <div className={"mres " + (passed ? "ok" : "no")}>
            Результат: {Math.round(score * 100)}% — {passed ? "зачёт, урок пройден" : ("ниже порога " + Math.round(thr * 100) + "% — повтори теорию и пройди заново")}
            <button className="btn ghost sm" onClick={() => { setSubmitted(false); setAns({}); }}>Пройти заново</button>
          </div>}
    </div>
  );
}
```

with:

```javascript
  const t = useT();
  return (
    <div className="mastery">
      {qs.map((q, i) => (
        <div key={i} className="mq">
          <div className="mq-p"><span className="mq-n">{i + 1}</span>{renderInline(q.prompt, "mq" + i + "-")}</div>
          <div className="opts">
            {q.options.map((o, oi) => {
              const cls = submitted
                ? (oi === q.answerIndex ? "ok" : (ans[i] === oi && ans[i] !== q.answerIndex ? "no" : ""))
                : (ans[i] === oi ? "sel" : "");
              return <button key={oi} className={"opt " + cls} onClick={() => !submitted && setAns((s) => ({ ...s, [i]: oi }))}>{renderInline(o, "mo" + i + "-" + oi + "-")}</button>;
            })}
          </div>
        </div>
      ))}
      {!submitted
        ? <button className="btn primary" disabled={!allAnswered} onClick={submit}>{t("finishCheck")}</button>
        : <div className={"mres " + (passed ? "ok" : "no")}>
            {t("masteryResult", Math.round(score * 100), passed, Math.round(thr * 100))}
            <button className="btn ghost sm" onClick={() => { setSubmitted(false); setAns({}); }}>{t("retake")}</button>
          </div>}
    </div>
  );
}
```

Place `const t = useT();` as the first line inside `function Mastery({ lesson, onPass }) {`, alongside the other hooks (before `const qs = ...`).

- [ ] **Step 7: `StatusIcon` / `KIND_LABEL`**

Delete the `KIND_LABEL` constant:

```javascript
const KIND_LABEL = {
  "done": "Выполнено", "skipped": "Пройдено с пропусками",
  "in-progress": "В процессе", "not-started": "Не начато",
};
```

It's replaced by a locale-independent key map (added in Task 6, used where
`KIND_LABEL[st.kind]` was used):

```javascript
const STATUS_KEY = {
  "done": "statusDone", "skipped": "statusSkipped",
  "in-progress": "statusInProgress", "not-started": "statusNotStarted",
};
```

Add `STATUS_KEY` where `KIND_LABEL` was. `StatusIcon` itself is unchanged
(icon-only, no text).

- [ ] **Step 8: `AccountWidget`**

Replace:

```javascript
function AccountWidget({ session, onSignIn, onSignOut }) {
  if (!session) {
    return (
      <div className="account">
        <button className="acct-btn" onClick={() => onSignIn("google")}><LogIn size={14} /> Google</button>
        <button className="acct-btn" onClick={() => onSignIn("github")}><LogIn size={14} /> GitHub</button>
      </div>
    );
  }
  const meta = session.user.user_metadata || {};
  const name = meta.full_name || meta.user_name || session.user.email || "Ученик";
  return (
    <div className="account">
      {meta.avatar_url ? <img className="acct-av" src={meta.avatar_url} alt="" /> : <User size={16} />}
      <span className="acct-name">{name}</span>
      <button className="acct-btn" onClick={onSignOut}><LogOut size={14} /> Выйти</button>
    </div>
  );
}
```

with:

```javascript
function AccountWidget({ session, onSignIn, onSignOut }) {
  const t = useT();
  if (!session) {
    return (
      <div className="account">
        <button className="acct-btn" onClick={() => onSignIn("google")}><LogIn size={14} /> {t("signInGoogle")}</button>
        <button className="acct-btn" onClick={() => onSignIn("github")}><LogIn size={14} /> {t("signInGithub")}</button>
      </div>
    );
  }
  const meta = session.user.user_metadata || {};
  const name = meta.full_name || meta.user_name || session.user.email || t("defaultLearnerName");
  return (
    <div className="account">
      {meta.avatar_url ? <img className="acct-av" src={meta.avatar_url} alt="" /> : <User size={16} />}
      <span className="acct-name">{name}</span>
      <button className="acct-btn" onClick={onSignOut}><LogOut size={14} /> {t("signOut")}</button>
    </div>
  );
}
```

- [ ] **Step 9: Run the e2e suite**

Run: `npm run test:e2e`
Expected: all tests still PASS — `App` doesn't yet provide `LocaleContext`, so
`useT()` falls back to the default context value `"ru"`, and `UI_STRINGS.ru`
matches the strings that were there before, so rendered output is unchanged.

- [ ] **Step 10: Commit**

```bash
git add prototype/cpp26-engine.jsx
git commit -m "Replace hardcoded Russian UI strings with t() in leaf components"
```

---

### Task 6: Wire `t()` into `App`'s header/sidebar/main, fix flagship check, provide `LocaleContext`

**Files:**
- Modify: `prototype/cpp26-engine.jsx`

- [ ] **Step 1: Provide `LocaleContext` and translate the top-level render**

In `App()`, find the final `return (...)` block:

```javascript
  return (
    <div className="app">
      <style>{CSS}</style>
      <header className="topbar">
        <div className="brand"><BookOpen size={18} /><span>{COURSE_DATA.courseTitle}</span></div>
        <div className="prog">
          <div className="prog-bar"><div className="prog-fill" style={{ width: (real.length ? (doneCount / real.length * 100) : 0) + "%" }} /></div>
          <span className="prog-txt">{doneCount} / {real.length} уроков</span>
        </div>
        <AccountWidget session={session} onSignIn={signIn} onSignOut={signOut} />
      </header>

      <div className="body">
        <aside className="side">
          <button className={"rep " + (view === "repetition" ? "active" : "")} onClick={() => setView("repetition")}>
            <Repeat size={15} /> Зона повторения <span className="rep-n">{skippedItems.length}</span>
          </button>
          <label className="strict">
            <input type="checkbox" checked={strict} onChange={(e) => setStrict(e.target.checked)} />
            Строгий режим (закрытие без пропусков)
          </label>

          <nav>
            {modules.map((m) => {
              const sk = moduleSkips(m);
              return (
                <div key={m.id} className="mod">
                  <div className="mod-h">
                    <span className="mod-n">{m.moduleNumber}</span>
                    <span className="mod-t">{m.title}</span>
                    <span className={"sig sig-" + (m.significance.includes("флагман") ? "flag" : "base")}>{m.significance}</span>
                  </div>
                  {sk > 0 && <div className="mod-skip">{sk} задач пропущено</div>}
                  {(m.lessons && m.lessons.length > 0)
                    ? <ul>
                        {m.lessons.map((l) => {
                          const ls = lessonStatus(l);
                          return (
                            <li key={l.id}
                                className={(cur === l.id && view === "lesson" ? "cur " : "") + (l.stub ? "stub" : "")}
                                onClick={() => { setCur(l.id); setView("lesson"); }}>
                              <StatusIcon kind={ls.kind} />
                              <span className="ltitle">{renderInline(l.title, l.id + "-")}</span>
                              {l.stub && <span className="soon">скоро</span>}
                              {ls.skipped > 0 && <span className="ldot">{ls.skipped}</span>}
                            </li>
                          );
                        })}
                      </ul>
                    : <div className="empty">уроки появятся позже</div>}
                </div>
              );
            })}
          </nav>
        </aside>

        <main className="main">
          {view === "repetition"
            ? <div className="repview">
                <h1>Зона повторения</h1>
                <p className="sub">Сюда автоматически попадают пропущенные задачи. Статус «Пропущено» — это не «Выполнено»; вернись и закрой пробел в любой момент.</p>
                {skippedItems.length === 0
                  ? <div className="empty-big">Пропущенных задач нет.</div>
                  : skippedItems.map(({ l, e }) => (
                      <div key={e.id} className="repitem" onClick={() => { setCur(l.id); setView("lesson"); }}>
                        <div><span className="tag tag-type">{e.type}</span> <span className="repl">{l.title}</span></div>
                        <ChevronRight size={16} />
                      </div>
                    ))}
              </div>
            : !lesson
              ? <div className="empty-big">Выбери урок слева.</div>
              : lesson.stub
                ? <div className="lesson">
                    <div className="lhead"><div className="lhead-top">Модуль {lesson.mod.moduleNumber} · {lesson.mod.title}</div>
                      <h1>{renderInline(lesson.title, "h-")}</h1></div>
                    <div className="empty-big">Этот урок ещё не написан. Каркас движка готов его принять — контент подставляется из JSON.</div>
                  </div>
                : <div className="lesson">
                    <div className="lhead">
                      <div className="lhead-top">Модуль {lesson.mod.moduleNumber} · {lesson.mod.title}</div>
                      <h1>{lesson.title}</h1>
                      <div className="lmeta">
                        <span className={"badge badge-" + st.kind}>{KIND_LABEL[st.kind]}{st.skipped > 0 ? " · " + st.skipped + " пропущено" : ""}</span>
                        {lesson.outputsVerified === false && <span className="badge badge-pending">выводы ждут прогона на GCC 16.1</span>}
                      </div>
                    </div>

                    <Background text={lesson.background} />

                    <section><h2>Мотивация</h2><Markdown text={lesson.motivation} /></section>
                    <section><h2>Теория</h2><Markdown text={lesson.theory} /></section>

                    {lesson.examples.length > 0 && (
                      <section>
                        <h2>Примеры</h2>
                        {lesson.examples.map((ex, i) => <ExampleCard key={i} ex={ex} idx={i} />)}
                      </section>
                    )}

                    <section>
                      <h2>Упражнения</h2>
                      {lesson.exercises.map((ex, i) => (
                        <Exercise key={ex.id} ex={ex} idx={i}
                          status={exStatus[ex.id]}
                          onResolve={(ok) => resolveEx(ex.id, ok)}
                          onSkip={() => skipEx(ex.id)}
                          onUnskip={() => unskipEx(ex.id)} />
                      ))}
                    </section>

                    {lesson.challenge && <section><h2>Челлендж</h2><Challenge ch={lesson.challenge} verifiedWith={lesson.verifiedWith} /></section>}

                    <section>
                      <h2>Проверка усвоения <span className="thr">порог {Math.round(lesson.masteryCheck.passThreshold * 100)}%</span></h2>
                      <Mastery lesson={lesson} onPass={(sc) => passMastery(lesson.id, sc)} />
                    </section>
                  </div>}
        </main>
      </div>
    </div>
  );
}
```

with (note: this also fixes the flagship-significance check to match both
languages, and replaces `KIND_LABEL[st.kind]` with `t(STATUS_KEY[st.kind])`):

```javascript
  return (
    <LocaleContext.Provider value={locale}>
      <App_ locale={locale} setLocale={setLocale} modules={modules} cur={cur} setCur={setCur}
        view={view} setView={setView} exStatus={exStatus} mastery={mastery} strict={strict}
        setStrict={setStrict} session={session} signIn={signIn} signOut={signOut}
        lesson={lesson} st={st} doneCount={doneCount} real={real} skippedItems={skippedItems}
        moduleSkips={moduleSkips} lessonStatus={lessonStatus} resolveEx={resolveEx}
        skipEx={skipEx} unskipEx={unskipEx} passMastery={passMastery} />
    </LocaleContext.Provider>
  );
}

function App_({ locale, setLocale, modules, cur, setCur, view, setView, exStatus, mastery,
  strict, setStrict, session, signIn, signOut, lesson, st, doneCount, real, skippedItems,
  moduleSkips, lessonStatus, resolveEx, skipEx, unskipEx, passMastery }) {
  const t = useT();
  const isFlagship = (sig) => /флагман|flagship/i.test(sig);
  return (
    <div className="app">
      <style>{CSS}</style>
      <header className="topbar">
        <div className="brand"><BookOpen size={18} /><span>{t("courseTitle")}</span></div>
        <div className="prog">
          <div className="prog-bar"><div className="prog-fill" style={{ width: (real.length ? (doneCount / real.length * 100) : 0) + "%" }} /></div>
          <span className="prog-txt">{t("lessonsProgress", doneCount, real.length)}</span>
        </div>
        <LocaleSwitcher locale={locale} setLocale={setLocale} />
        <AccountWidget session={session} onSignIn={signIn} onSignOut={signOut} />
      </header>

      <div className="body">
        <aside className="side">
          <button className={"rep " + (view === "repetition" ? "active" : "")} onClick={() => setView("repetition")}>
            <Repeat size={15} /> {t("repetitionZone")} <span className="rep-n">{skippedItems.length}</span>
          </button>
          <label className="strict">
            <input type="checkbox" checked={strict} onChange={(e) => setStrict(e.target.checked)} />
            {t("strictMode")}
          </label>

          <nav>
            {modules.map((m) => {
              const sk = moduleSkips(m);
              return (
                <div key={m.id} className="mod">
                  <div className="mod-h">
                    <span className="mod-n">{m.moduleNumber}</span>
                    <span className="mod-t">{m.title}</span>
                    <span className={"sig sig-" + (isFlagship(m.significance) ? "flag" : "base")}>{m.significance}</span>
                  </div>
                  {sk > 0 && <div className="mod-skip">{t("modSkipped", sk)}</div>}
                  {(m.lessons && m.lessons.length > 0)
                    ? <ul>
                        {m.lessons.map((l) => {
                          const ls = lessonStatus(l);
                          return (
                            <li key={l.id}
                                className={(cur === l.id && view === "lesson" ? "cur " : "") + (l.stub ? "stub" : "")}
                                onClick={() => { setCur(l.id); setView("lesson"); }}>
                              <StatusIcon kind={ls.kind} />
                              <span className="ltitle">{renderInline(l.title, l.id + "-")}</span>
                              {l.stub && <span className="soon">{t("soon")}</span>}
                              {ls.skipped > 0 && <span className="ldot">{ls.skipped}</span>}
                            </li>
                          );
                        })}
                      </ul>
                    : <div className="empty">{t("lessonsComingSoon")}</div>}
                </div>
              );
            })}
          </nav>
        </aside>

        <main className="main">
          {view === "repetition"
            ? <div className="repview">
                <h1>{t("repetitionTitle")}</h1>
                <p className="sub">{t("repetitionSubtitle")}</p>
                {skippedItems.length === 0
                  ? <div className="empty-big">{t("noSkippedItems")}</div>
                  : skippedItems.map(({ l, e }) => (
                      <div key={e.id} className="repitem" onClick={() => { setCur(l.id); setView("lesson"); }}>
                        <div><span className="tag tag-type">{e.type}</span> <span className="repl">{l.title}</span></div>
                        <ChevronRight size={16} />
                      </div>
                    ))}
              </div>
            : !lesson
              ? <div className="empty-big">{t("selectLesson")}</div>
              : lesson.stub
                ? <div className="lesson">
                    <div className="lhead"><div className="lhead-top">{t("module")} {lesson.mod.moduleNumber} · {lesson.mod.title}</div>
                      <h1>{renderInline(lesson.title, "h-")}</h1></div>
                    <div className="empty-big">{t("stubLesson")}</div>
                  </div>
                : <div className="lesson">
                    <div className="lhead">
                      <div className="lhead-top">{t("module")} {lesson.mod.moduleNumber} · {lesson.mod.title}</div>
                      <h1>{lesson.title}</h1>
                      <div className="lmeta">
                        <span className={"badge badge-" + st.kind}>{t(STATUS_KEY[st.kind])}{st.skipped > 0 ? " · " + t("modSkipped", st.skipped) : ""}</span>
                        {lesson.outputsVerified === false && <span className="badge badge-pending">{t("outputsPending")}</span>}
                      </div>
                    </div>

                    <Background text={lesson.background} />

                    <section><h2>{t("motivation")}</h2><Markdown text={lesson.motivation} /></section>
                    <section><h2>{t("theory")}</h2><Markdown text={lesson.theory} /></section>

                    {lesson.examples.length > 0 && (
                      <section>
                        <h2>{t("examples")}</h2>
                        {lesson.examples.map((ex, i) => <ExampleCard key={i} ex={ex} idx={i} />)}
                      </section>
                    )}

                    <section>
                      <h2>{t("exercises")}</h2>
                      {lesson.exercises.map((ex, i) => (
                        <Exercise key={ex.id} ex={ex} idx={i}
                          status={exStatus[ex.id]}
                          onResolve={(ok) => resolveEx(ex.id, ok)}
                          onSkip={() => skipEx(ex.id)}
                          onUnskip={() => unskipEx(ex.id)} />
                      ))}
                    </section>

                    {lesson.challenge && <section><h2>{t("challengeOptional").split(" ·")[0]}</h2><Challenge ch={lesson.challenge} verifiedWith={lesson.verifiedWith} /></section>}

                    <section>
                      <h2>{t("masteryCheckTitle")} <span className="thr">{t("threshold", Math.round(lesson.masteryCheck.passThreshold * 100))}</span></h2>
                      <Mastery lesson={lesson} onPass={(sc) => passMastery(lesson.id, sc)} />
                    </section>
                  </div>}
        </main>
      </div>
    </div>
  );
}
```

Two notes on this step:

1. The `<section><h2>Челлендж</h2>...` heading was a plain "Челлендж", not
   "Челлендж · необязательно" (that longer string is the `Challenge` card's
   own tag, handled in Task 5 Step 4). Reusing `t("challengeOptional")` and
   splitting off the `" · необязательно"`/`" · optional"` suffix keeps a
   single dictionary entry instead of adding a near-duplicate one. If this
   feels too clever during implementation, add a separate `challenge: "Челлендж"/"Challenge"`
   key to `UI_STRINGS` instead and use that directly — either is fine,
   prefer whichever reads more clearly in the diff.
2. Splitting `App` into `App` (data/effects) + `App_` (render) is required so
   `App_` and everything it renders can call `useT()` — `useT()` reads
   `LocaleContext` via `React.useContext`, which only sees the
   `LocaleContext.Provider` if it's an ancestor in the tree, not the same
   component that creates the provider.

- [ ] **Step 2: Run the e2e suite**

Run: `npm run test:e2e`
Expected: all tests still PASS — `locale` defaults to `"ru"`,
`UI_STRINGS.ru` reproduces the original Russian strings, and `isFlagship`
still matches "флагман"/"флагман №1" for module significance.

- [ ] **Step 3: Commit**

```bash
git add prototype/cpp26-engine.jsx
git commit -m "Translate App shell strings via t(), provide LocaleContext"
```

---

### Task 7: Locale switcher UI + persistence

**Files:**
- Modify: `prototype/cpp26-engine.jsx`

- [ ] **Step 1: Add the `LocaleSwitcher` component**

Add near `AccountWidget`:

```javascript
function LocaleSwitcher({ locale, setLocale }) {
  return (
    <div className="locale-switch">
      {["ru", "en"].map((l) => (
        <button key={l} className={"locale-btn" + (locale === l ? " active" : "")} onClick={() => setLocale(l)}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
```

Add CSS for it in the `CSS` template literal, near `.account`:

```css
.locale-switch { display:flex; gap:4px; }
.locale-btn { background:var(--panel2); color:var(--mut); border:1px solid var(--line); border-radius:8px;
  padding:6px 10px; cursor:pointer; font-size:12px; font-weight:600; font-family:inherit; }
.locale-btn:hover { border-color:var(--amber); }
.locale-btn.active { color:var(--amber); border-color:var(--amber); }
```

- [ ] **Step 2: Persist `locale` in the progress blob and sync `<html lang>`**

In `App()`, find:

```javascript
  useEffect(() => {
    saveProgress({ cur, view, exStatus, mastery, strict });
  }, [cur, view, exStatus, mastery, strict]);
```

Replace with:

```javascript
  useEffect(() => {
    saveProgress({ cur, view, exStatus, mastery, strict, locale });
  }, [cur, view, exStatus, mastery, strict, locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
```

- [ ] **Step 3: Include `locale` in the Supabase-synced blob**

`currentLocalBlob`, `applyProgress`, and `syncOnLogin` all read/write the same
blob shape that `saveProgress`/`loadProgress` use. Update the default blob in
`currentLocalBlob` and make `applyProgress` restore `locale`:

Find:

```javascript
  function currentLocalBlob() {
    return loadProgress() || { cur: "m1-l1", view: "lesson", exStatus: {}, mastery: {}, strict: false };
  }
```

Replace with:

```javascript
  function currentLocalBlob() {
    return loadProgress() || { cur: "m1-l1", view: "lesson", exStatus: {}, mastery: {}, strict: false, locale: "ru" };
  }
```

Find:

```javascript
  function applyProgress(blob) {
    setCur(blob.cur);
    setView(blob.view);
    setExStatus(blob.exStatus);
    setMastery(blob.mastery);
    setStrict(blob.strict);
    saveProgress(blob);
  }
```

Replace with:

```javascript
  function applyProgress(blob) {
    setCur(blob.cur);
    setView(blob.view);
    setExStatus(blob.exStatus);
    setMastery(blob.mastery);
    setStrict(blob.strict);
    if (blob.locale) setLocale(blob.locale);
    saveProgress(blob);
  }
```

`pushIfChanged`/`pushProgress`/`pullProgress` are unchanged — they already
push/pull `currentLocalBlob()`/`blob` as opaque JSON, so `locale` rides along
for free once it's part of the blob shape.

- [ ] **Step 4: Pass `locale`/`setLocale` through to `App_`**

This was already included in the `<App_ ... />` props list in Task 6 Step 1
(`locale={locale} setLocale={setLocale}`) and in the `LocaleSwitcher` usage in
the header. Confirm both are wired — no further code change if Task 6 was
applied as written.

- [ ] **Step 5: Run the e2e suite**

Run: `npm run test:e2e`
Expected: all existing tests PASS. The new switcher renders "RU"/"EN" buttons
in the header but doesn't change rendered Russian text yet for `ru` (default,
active).

- [ ] **Step 6: Commit**

```bash
git add prototype/cpp26-engine.jsx
git commit -m "Add locale switcher with localStorage/Supabase persistence"
```

---

### Task 8: e2e test for the locale switcher

**Files:**
- Create: `e2e/i18n.spec.ts`

- [ ] **Step 1: Write the test**

```typescript
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/prototype/index.html");
  await expect(page.locator(".card.ex").first()).toBeVisible();
});

test("switching locale changes UI chrome and lesson content", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Упражнения" })).toBeVisible();

  await page.locator(".locale-btn", { hasText: "EN" }).click();

  await expect(page.getByRole("heading", { name: "Exercises" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Упражнения" })).toHaveCount(0);

  // m1-l1 is a stub in content/modules/en/m1.json at this point in the plan
  // (Task 10 fills it in) — its title "Pack indexing" is unchanged across
  // locales, so check a string that does change: the sidebar module title.
  await expect(page.locator(".mod-t").first()).toHaveText("C++26 context");
});

test("locale choice persists across reload", async ({ page }) => {
  await page.locator(".locale-btn", { hasText: "EN" }).click();
  await expect(page.getByRole("heading", { name: "Exercises" })).toBeVisible();

  await page.reload();
  await expect(page.locator(".card.ex").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Exercises" })).toBeVisible();
});
```

- [ ] **Step 2: Run the new test**

Run: `npx playwright test e2e/i18n.spec.ts`
Expected: PASS. If the first test fails on the `.mod-t` assertion, check
whether `content/modules/en/m0.json`'s module-level `title` is exactly
`"C++26 context"` (Task 1, Step 3) — adjust the assertion or the JSON to
match, whichever is the actual typo.

- [ ] **Step 3: Run the full e2e suite**

Run: `npm run test:e2e`
Expected: all tests across all spec files PASS.

- [ ] **Step 4: Commit**

```bash
git add e2e/i18n.spec.ts
git commit -m "Add e2e coverage for the locale switcher"
```

---

### Task 9: Translate `m0-l1` into English

**Files:**
- Modify: `content/modules/en/m0.json`

- [ ] **Step 1: Replace the stub `m0-l1` with a full English translation**

Read `content/modules/ru/m0.json` and translate it into
`content/modules/en/m0.json`, replacing the current stub. Rules:

- Preserve the JSON structure, key order, `id`s, `level`/`type` values, and
  every `answerIndex` exactly as in the Russian source — only translate
  human-readable prose.
- Translate: module `title` (already done: `"C++26 context"`), lesson
  `title`, `motivation`, `theory` (markdown — preserve `**bold**`,
  `` `code` ``, and paragraph breaks), every `exercises[].prompt`/`options[]`/
  `explanation`, and every `masteryCheck.questions[].prompt`/`options[]`.
- Do not translate C++ identifiers, standard names (`std::execution`,
  `<meta>`, `pre(...)`, `post(...)`, `contract_assert(...)`, operators `^^`
  and `[: :]`), paper numbers (`P2996`, `N5046`), or the date `28.03.2026`.
- `examples: []`, `challenge: null` stay as-is (this lesson has no code).
- Keep `exercises[].id` values (`m0-l1-e1`, `m0-l1-e2`) and all
  `answerIndex`/`level`/`type` fields unchanged.

The result must have the same shape as `content/modules/ru/m0.json`: same
number of `exercises` (2) and `masteryCheck.questions` (5), in the same
order, with matching `id`, `level`, `type`, and `answerIndex` values — only
the prose strings differ.

- [ ] **Step 2: Run the e2e suite**

Run: `npm run test:e2e`
Expected: all tests PASS, including `e2e/i18n.spec.ts`. The EN locale now
shows the full translated `m0-l1` lesson when selected.

- [ ] **Step 3: Commit**

```bash
git add content/modules/en/m0.json
git commit -m "Translate m0-l1 (C++26 context) to English"
```

---

### Task 10: Translate `m1-l1` into English

**Files:**
- Modify: `content/modules/en/m1.json`

- [ ] **Step 1: Replace the stub `m1-l1` with a full English translation**

Read `content/modules/ru/m1.json` and translate `m1-l1` into
`content/modules/en/m1.json`, replacing the current stub entry (the other
five stub lessons `m1-l2`..`m1-l6` already have their final titles from Task
1 and don't change). Rules:

- Same structural-preservation rules as Task 9: same `id`s,
  `level`/`type`/`answerIndex`/`answerLine` values, same counts of
  `examples` (4), `exercises` (3), and `masteryCheck.questions` (3), in the
  same order.
- Translate: lesson `title` (stays `"Pack indexing"` — it's already an
  English term), `motivation`, `theory`, every `examples[].title`/
  `explanation`, every `exercises[].explanation`/`prompt`/`options[]`, the
  `challenge.prompt`, and every `masteryCheck.questions[].prompt`/`options[]`.
- **Translate Russian comments inside `code` and `referenceSolution`
  fields** (e.g. `// 0-based: элемент #1` → `// 0-based: element #1`,
  `// value-форма` → `// value form`, `// тип-форма` → `// type form`,
  `// меняем через ссылку` → `// mutate through the reference`,
  `// xs...[0] именует первый параметр -> lvalue` → `// xs...[0] names the
  first parameter -> lvalue`, `// тип возврата — первый тип пака` → `//
  return type is the pack's first type`). Do not change any non-comment
  code — the C++ itself, `expectedOutput`, and `answer`/`answerLine` values
  must stay byte-identical to the Russian version, since they describe
  compiled/executed behavior, not language.
- `outputsVerified` and `verifiedWith` stay exactly as in the Russian source
  (`true` / `{ "compilerId": "gsnapshot", "flags": "-std=c++26 -O2" }`) — the
  underlying code didn't change, only comments, so the verified output is
  still valid.
- Do not translate C++ identifiers/keywords (`pack...[N]`,
  `pack-index-expression`, `pack-index-specifier`, `constexpr`, `lvalue`,
  `sizeof...`, etc.) or the paper reference `P2662`/`P1061`.

- [ ] **Step 2: Run the e2e suite**

Run: `npm run test:e2e`
Expected: all tests PASS.

- [ ] **Step 3: Commit**

```bash
git add content/modules/en/m1.json
git commit -m "Translate m1-l1 (Pack indexing) to English"
```

---

### Task 11: Cross-locale parity check script

**Files:**
- Create: `prototype/check-i18n-parity.js`

- [ ] **Step 1: Write the script**

```javascript
#!/usr/bin/env node
// Verifies that content/modules/ru/*.json and content/modules/en/*.json
// stay structurally in sync: same modules, same lessons, same exercise/
// mastery-check shapes. Prose strings are intentionally NOT compared (that's
// the part that's supposed to differ between locales).
// Usage: node prototype/check-i18n-parity.js

const fs = require("fs");
const path = require("path");

const CONTENT_DIR = path.join(__dirname, "..", "content", "modules");
const MODULE_IDS = ["m0", "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10"];

let errors = [];

function load(locale, id) {
  const file = path.join(CONTENT_DIR, locale, `${id}.json`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function describeExercise(ex) {
  return {
    id: ex.id,
    level: ex.level,
    type: ex.type,
    answerIndex: ex.answerIndex,
    answerLine: ex.answerLine,
    answer: ex.answer,
    optionCount: ex.options ? ex.options.length : null,
  };
}

function describeQuestion(q) {
  return { type: q.type, answerIndex: q.answerIndex, optionCount: q.options ? q.options.length : null };
}

function describeLesson(l) {
  if (l.stub) return { id: l.id, stub: true };
  return {
    id: l.id,
    stub: false,
    exampleCount: (l.examples || []).length,
    exercises: (l.exercises || []).map(describeExercise),
    hasChallenge: !!l.challenge,
    masteryQuestions: l.masteryCheck.questions.map(describeQuestion),
  };
}

for (const id of MODULE_IDS) {
  const ru = load("ru", id);
  const en = load("en", id);

  if (ru.id !== en.id || ru.moduleNumber !== en.moduleNumber) {
    errors.push(`${id}: module id/number mismatch (ru=${ru.id}/${ru.moduleNumber}, en=${en.id}/${en.moduleNumber})`);
  }

  const ruLessons = (ru.lessons || []).map(describeLesson);
  const enLessons = (en.lessons || []).map(describeLesson);

  if (ruLessons.length !== enLessons.length) {
    errors.push(`${id}: lesson count mismatch (ru=${ruLessons.length}, en=${enLessons.length})`);
    continue;
  }

  for (let i = 0; i < ruLessons.length; i++) {
    const a = JSON.stringify(ruLessons[i]);
    const b = JSON.stringify(enLessons[i]);
    if (a !== b) {
      errors.push(`${id}: lesson #${i} (${ruLessons[i].id} vs ${enLessons[i].id}) shape mismatch:\n  ru: ${a}\n  en: ${b}`);
    }
  }
}

if (errors.length > 0) {
  console.error("i18n parity check FAILED:\n" + errors.join("\n"));
  process.exit(1);
}
console.log(`i18n parity check OK (${MODULE_IDS.length} modules)`);
```

- [ ] **Step 2: Run the script**

Run: `node prototype/check-i18n-parity.js`
Expected: `i18n parity check OK (11 modules)`. If it fails, the error message
names the module/lesson and the mismatching shape — fix the `en/` (or `ru/`)
file accordingly and rerun.

- [ ] **Step 3: Commit**

```bash
git add prototype/check-i18n-parity.js
git commit -m "Add cross-locale content parity check script"
```

---

### Task 12: Update docs

**Files:**
- Modify: `docs/CONTENT_GUIDE.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update `docs/CONTENT_GUIDE.md`**

In the section describing the data format (around the JSON schema block),
add a short paragraph above "## Формат данных урока (JSON)" explaining the
per-locale layout:

```markdown
## Языки контента

Контент хранится отдельно для каждой локали: `content/modules/ru/mN.json` и
`content/modules/en/mN.json`. Схема одинаковая для обоих языков (см. ниже);
переводятся только текстовые поля (`title`, `motivation`, `theory`,
`exercises[].*`, `masteryCheck.questions[].*`, комментарии внутри `code`).
Идентификаторы, `answerIndex`/`answerLine`/`answer`, `expectedOutput`,
`verifiedWith` и сама структура C++-кода должны быть одинаковы между
локалями — это проверяет `prototype/check-i18n-parity.js`.
```

Add a new line to the Definition-of-Done checklist (after the existing
"Bleeding-edge API сверены по cppreference" item):

```markdown
- [ ] Урок переведён на оба языка (`content/modules/ru/...` и
      `content/modules/en/...`), `node prototype/check-i18n-parity.js`
      проходит без ошибок.
```

- [ ] **Step 2: Update `CLAUDE.md`**

In the "Repo layout" section, find the bullet describing `content/modules/`:

```markdown
- `content/modules/` — actual lesson content as data, one JSON file per module (e.g. `m1.json`), authored in the schema defined by `CONTENT_GUIDE.md`. This is what the engine renders and what content work mostly produces/edits.
```

Replace with:

```markdown
- `content/modules/` — actual lesson content as data, one JSON file per module per locale: `content/modules/ru/mN.json` and `content/modules/en/mN.json`, both authored in the schema defined by `CONTENT_GUIDE.md`. This is what the engine renders (via `fetch()` per the active locale) and what content work mostly produces/edits. `prototype/check-i18n-parity.js` verifies the two locale trees stay structurally in sync.
```

Also update the note about `prototype/cpp26-engine.jsx`'s inline `COURSE_DATA`
in the same section — find:

```markdown
- `prototype/` — the throwaway/iteration-stage app code:
  - `cpp26-engine.jsx` — prototype React component (rendering engine + an inlined copy of the course data) used to iterate on lesson format/navigation/progress in-chat before the real PWA is built. Note: its inline `COURSE_DATA` currently duplicates `content/modules/m1.json` rather than loading it — when the two diverge, `content/modules/m1.json` is the authored source of truth.
```

Replace with:

```markdown
- `prototype/` — the throwaway/iteration-stage app code:
  - `cpp26-engine.jsx` — prototype React component (rendering engine) used to iterate on lesson format/navigation/progress in-chat before the real PWA is built. It loads lesson content at runtime via `fetch()` from `content/modules/<locale>/*.json` — there is no inline copy of course data.
  - `check-i18n-parity.js` — Node script verifying `content/modules/ru/` and `content/modules/en/` stay structurally in sync.
```

- [ ] **Step 3: Commit**

```bash
git add docs/CONTENT_GUIDE.md CLAUDE.md
git commit -m "Document per-locale content layout and i18n parity check"
```

---

### Task 13: Final full-suite verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full e2e suite**

Run: `npm run test:e2e`
Expected: every test in `e2e/smoke.spec.ts`, `e2e/module0.spec.ts`,
`e2e/lesson.spec.ts`, and `e2e/i18n.spec.ts` PASSES.

- [ ] **Step 2: Run the parity check**

Run: `node prototype/check-i18n-parity.js`
Expected: `i18n parity check OK (11 modules)`.

- [ ] **Step 3: Manual smoke check**

Start the dev server (per the `running-dev-server` skill) and in a browser:
- Confirm the default locale is Russian and the page renders as before.
- Click "EN" — confirm UI chrome (buttons, statuses, headings) and `m0-l1`/
  `m1-l1` content switch to English, and `<html lang>` becomes `en`.
- Reload — confirm the locale choice (EN) persisted.
- Click "RU" — confirm everything switches back.

- [ ] **Step 4: Update `docs/PROJECT_OVERVIEW.md` open calibrations**

Remove item 1 ("Язык контента уроков — русский / английский / оба") from
"Открытые калибровки" in `docs/PROJECT_OVERVIEW.md`, since this plan resolves
it (both, with a switcher). Renumber the remaining item(s) if needed.

- [ ] **Step 5: Commit**

```bash
git add docs/PROJECT_OVERVIEW.md
git commit -m "Resolve content-language calibration: RU/EN with switcher"
```
