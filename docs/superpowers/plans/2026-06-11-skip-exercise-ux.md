# Skip Exercise UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current "skip = fake wrong answer" behavior in `Exercise` with a distinct "Пропущено" badge state that keeps the exercise interactive and reversible, per `docs/superpowers/specs/2026-06-11-skip-exercise-ux-design.md`.

**Architecture:** Single-file change to `prototype/cpp26-engine.jsx`. Add an `unskipEx` state-update function alongside the existing `skipEx`/`resolveEx`, pass `status`/`onUnskip` into `Exercise`, rework `Exercise`'s skip/unskip local state and header rendering, and add two small CSS rules for the greyed-out card and the "Пропущено" badge.

**Tech Stack:** React (via CDN, no build step), plain CSS-in-JS template string (`CSS` constant). No test framework exists in this prototype — verification is manual via the dev server in a browser, using the `running-dev-server` skill.

---

### Task 1: Add `unskipEx` and wire new props into `<Exercise>`

**Files:**
- Modify: `prototype/cpp26-engine.jsx:743-744`
- Modify: `prototype/cpp26-engine.jsx:858-860`

- [ ] **Step 1: Add `unskipEx` next to `skipEx`**

In `prototype/cpp26-engine.jsx`, find:

```js
  const resolveEx = (id, ok) => setExStatus((s) => ({ ...s, [id]: ok ? "correct" : "wrong" }));
  const skipEx = (id) => setExStatus((s) => ({ ...s, [id]: "skipped" }));
  const passMastery = (id, sc) => setMastery((s) => ({ ...s, [id]: sc }));
```

Replace with:

```js
  const resolveEx = (id, ok) => setExStatus((s) => ({ ...s, [id]: ok ? "correct" : "wrong" }));
  const skipEx = (id) => setExStatus((s) => ({ ...s, [id]: "skipped" }));
  const unskipEx = (id) => setExStatus((s) => {
    const next = { ...s };
    delete next[id];
    return next;
  });
  const passMastery = (id, sc) => setMastery((s) => ({ ...s, [id]: sc }));
```

- [ ] **Step 2: Pass `status` and `onUnskip` to `<Exercise>`**

Find:

```jsx
                      {lesson.exercises.map((ex, i) => (
                        <Exercise key={ex.id} ex={ex} idx={i}
                          onResolve={(ok) => resolveEx(ex.id, ok)}
                          onSkip={() => skipEx(ex.id)} />
                      ))}
```

Replace with:

```jsx
                      {lesson.exercises.map((ex, i) => (
                        <Exercise key={ex.id} ex={ex} idx={i}
                          status={exStatus[ex.id]}
                          onResolve={(ok) => resolveEx(ex.id, ok)}
                          onSkip={() => skipEx(ex.id)}
                          onUnskip={() => unskipEx(ex.id)} />
                      ))}
```

- [ ] **Step 3: Commit**

```bash
git add prototype/cpp26-engine.jsx
git commit -m "Add unskipEx and wire skip status into Exercise props"
```

---

### Task 2: Rework `Exercise` skip/unskip state and header

**Files:**
- Modify: `prototype/cpp26-engine.jsx:368-435`

- [ ] **Step 1: Replace the `Exercise` function signature, state, and handlers**

Find:

```jsx
function Exercise({ ex, idx, onResolve, onSkip }) {
  const [picked, setPicked] = useState(null);
  const [val, setVal] = useState("");
  const [done, setDone] = useState(false);
  const [correct, setCorrect] = useState(false);

  const lvl = ex.level === "advanced" ? "advanced" : "basic";
  const lvlLabel = ex.level === "advanced" ? "Advanced" : "Basic";

  function finish(isCorrect) { setDone(true); setCorrect(isCorrect); onResolve(isCorrect); }
  function reset() { setDone(false); setCorrect(false); setPicked(null); setVal(""); }
  function skip() { setDone(true); setCorrect(false); onSkip(); }
```

Replace with:

```jsx
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
```

The `body` block (predict-output / find-bug / choice rendering, lines ~381-422) is unchanged — leave it exactly as-is.

- [ ] **Step 2: Replace the returned JSX (card wrapper + header)**

Find:

```jsx
  return (
    <div className="card ex">
      <div className="card-h">
        <span className={"tag tag-" + lvl}>{lvlLabel}</span>
        <span className="tag tag-type">{ex.type}</span>
        {!done && <button className="btn skip" onClick={skip}>Пропустить</button>}
      </div>
      {body}
      {done && <div className="exp"><Markdown text={ex.explanation} /></div>}
      {done && <button className="btn ghost sm" onClick={reset}>Попробовать снова</button>}
    </div>
  );
```

Replace with:

```jsx
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
```

- [ ] **Step 3: Commit**

```bash
git add prototype/cpp26-engine.jsx
git commit -m "Replace skip-as-wrong-answer with reversible Пропущено badge state"
```

---

### Task 3: Add CSS for the greyed-out card and "Пропущено" badge

**Files:**
- Modify: `prototype/cpp26-engine.jsx` (CSS template string, near line 961 and line 969)

- [ ] **Step 1: Add `.card.ex-skipped` next to the `.card` rule**

Find:

```css
.card { background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:16px; margin:0 0 14px; }
.card-h { display:flex; align-items:center; gap:8px; margin-bottom:11px; }
```

Replace with:

```css
.card { background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:16px; margin:0 0 14px; }
.card.ex-skipped { opacity:.6; border-style:dashed; border-color:var(--amber); }
.card-h { display:flex; align-items:center; gap:8px; margin-bottom:11px; }
```

- [ ] **Step 2: Add `.badge-skip` next to the tag rules**

Find:

```css
.tag-type { font-family:'JetBrains Mono',monospace; text-transform:none; letter-spacing:0; }
.tag-opt { color:var(--mut); }
```

Replace with:

```css
.tag-type { font-family:'JetBrains Mono',monospace; text-transform:none; letter-spacing:0; }
.tag-opt { color:var(--mut); }
.badge-skip { font-size:10px; text-transform:uppercase; letter-spacing:.05em; padding:2px 8px; border-radius:99px; border:1px solid var(--amber); color:var(--amber); }
```

- [ ] **Step 3: Commit**

```bash
git add prototype/cpp26-engine.jsx
git commit -m "Style skipped-exercise card and Пропущено badge"
```

---

### Task 4: Manual verification in the browser

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Use the `running-dev-server` skill to start (or confirm running) the local dev server for `prototype/`, and open it in a browser.

- [ ] **Step 2: Verify the skip flow on a `predict-output` exercise**

Navigate to lesson `m1-l1` ("Pack indexing"). On its first exercise:
1. Click "Пропустить".
   - Expected: card dims and gets a dashed amber border (`ex-skipped`); a "Пропущено" badge appears next to the type tag; the input field and "Проверить" button remain visible and usable; no answer/explanation is revealed; the button changes to "Отменить пропуск".
2. Click "Отменить пропуск".
   - Expected: dimming, dashed border, and badge disappear; button reverts to "Пропустить".

- [ ] **Step 3: Verify answering a skipped exercise**

1. Click "Пропустить" again on the same exercise.
2. Type the correct answer and click "Проверить".
   - Expected: normal "Верно" verdict and explanation appear, "Пропущено" badge and dashed styling are gone, "Попробовать снова" button is shown (standard answered state).

- [ ] **Step 4: Verify `find-bug` and `choice` exercise types**

Repeat step 2 (skip → grey out + badge + "Отменить пропуск", body still interactive without revealing the buggy line / correct option) on a `find-bug` and a `choice` exercise in the same lesson.

- [ ] **Step 5: Verify "Зона повторения" and module skip counts**

1. Skip one exercise and check the sidebar "Зона повторения" counter and the module's "N задач пропущено" line both increment by 1, and the lesson's status badge shows "· 1 пропущено".
2. Click "Отменить пропуск" on that exercise — confirm both counters decrement back and the lesson badge no longer shows "пропущено".
3. Skip the exercise again, then answer it correctly — confirm the counters drop back to 0 (the answered exercise is no longer counted as skipped).

---

### Task 5: Final review pass

**Files:** none

- [ ] **Step 1: Re-read the diff**

```bash
git diff bb7d7ee..HEAD -- prototype/cpp26-engine.jsx
```

Confirm only the intended sections changed (Exercise component, App's `exStatus` helpers, `<Exercise>` props, and the two new CSS rules).

- [ ] **Step 2: Use the `code-review` skill**

Run a quick review of the diff at the default effort level to catch any leftover issues before wrapping up.
