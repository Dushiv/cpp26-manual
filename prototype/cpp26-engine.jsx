const { useState, useEffect, useRef } = React;
const { Check, SkipForward, Circle, CircleDot, Repeat, ChevronRight, BookOpen, LogIn, LogOut, User } = window.lucideReact || window.LucideReact;

const MODULE_IDS = {
  cpp26: ["m0", "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10"],
  cpp23: ["m0", "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10"],
};

async function loadCourseData(courseId, locale) {
  const modules = await Promise.all(MODULE_IDS[courseId].map(async (id) => {
    // no-cache: always revalidate against the server (conditional GET → 304 if
    // unchanged) so freshly-deployed lesson content shows up without waiting for
    // the GitHub Pages max-age=600 window to expire.
    const res = await fetch(`../content/courses/${courseId}/${locale}/${id}.json`, { cache: "no-cache" });
    if (!res.ok) throw new Error(`failed to load ${courseId}/${locale}/${id}.json: ${res.status}`);
    return res.json();
  }));
  return { modules };
}

const COURSE_TITLES = {
  cpp26: { ru: "C++26 — от нуля до полного понимания", en: "C++26 — from zero to full understanding" },
  cpp23: { ru: "C++23 — для разработчиков на C++17/20", en: "C++23 — for C++17/20 developers" },
};

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
    resetToStarter: "Сбросить к началу",
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
    loadError: "Не удалось загрузить контент урока. Обновите страницу или попробуйте позже.",
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
    resetToStarter: "Reset to start",
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
    loadError: "Failed to load lesson content. Please reload or try again later.",
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

const STATUS = { NOT_STARTED: "not-started", PROGRESS: "in-progress", SKIPPED: "skipped", DONE: "done" };
const norm = (s) => (s || "").trim();

// CSS class for a multiple-choice option button, shared by Exercise (choice) and
// Mastery. `resolved` = the question has been answered/submitted; `selected` =
// the index the learner picked (undefined/null if none).
function optionClass(resolved, idx, answerIndex, selected) {
  if (!resolved) return selected === idx ? "sel" : "";
  if (idx === answerIndex) return "ok";
  return selected === idx ? "no" : "";
}

const progressKey = (courseId) => `${courseId}-progress`;
const PROGRESS_VERSION = 1;

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

// Merge two progress blobs without losing earned progress. Mastery scores and
// exercise statuses only ever accumulate (you don't un-pass a lesson), so we
// keep the "best" of each side instead of letting one blob overwrite the other.
// This is the fix for two bugs: (1) a stale cloud copy wiping a local pass that
// hadn't been pushed yet (the cloud push is debounced), and (2) a partial/legacy
// blob injecting `undefined` into state and blanking the app — the result here
// is always a complete blob with object fields.
function mergeProgress(local, cloud) {
  local = local || {};
  cloud = cloud || {};
  const lm = local.mastery || {}, cm = cloud.mastery || {};
  const mastery = {};
  for (const k of new Set([...Object.keys(lm), ...Object.keys(cm)]))
    mastery[k] = Math.max(lm[k] ?? -Infinity, cm[k] ?? -Infinity);
  const rank = { correct: 3, wrong: 2, skipped: 1 };
  const le = local.exStatus || {}, ce = cloud.exStatus || {};
  const exStatus = {};
  for (const k of new Set([...Object.keys(le), ...Object.keys(ce)]))
    exStatus[k] = (rank[le[k]] || 0) >= (rank[ce[k]] || 0) ? le[k] : ce[k];
  const lv = local.viewed || {}, cv = cloud.viewed || {};
  const viewed = {};
  for (const k of new Set([...Object.keys(lv), ...Object.keys(cv)]))
    viewed[k] = lv[k] || cv[k];
  return {
    cur: local.cur || cloud.cur || "m1-l1",
    view: local.view || cloud.view || "lesson",
    exStatus, mastery, viewed,
    strict: local.strict ?? cloud.strict ?? false,
    locale: local.locale || cloud.locale || "ru",
  };
}

const SUPABASE_URL = "https://jqkgywgvubecdmimskat.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impxa2d5d2d2dWJlY2RtaW1za2F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMjMxNjgsImV4cCI6MjA5NjU5OTE2OH0.MZvtQLGJEJ8X4BU8vzu2OycG7JWTO2ubpnxv5WNpBSY";

let supabaseClient = null;
function getSupabaseClient() {
  if (!window.supabase || !SUPABASE_URL.startsWith("https://")) return null;
  if (!supabaseClient) supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return supabaseClient;
}

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

function renderInline(text, kp) {
  const parts = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let last = 0, m, i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const t = m[0];
    if (t[0] === "`") parts.push(<code key={kp + "c" + i} className="ic">{t.slice(1, -1)}</code>);
    else parts.push(<strong key={kp + "b" + i}>{t.slice(2, -2)}</strong>);
    last = re.lastIndex; i++;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function CodeBlock({ code }) {
  return <pre className="cb"><code>{code}</code></pre>;
}

function Markdown({ text }) {
  if (!text) return null;
  const segs = [];
  const fence = /```(\w*)\n([\s\S]*?)```/g;
  let last = 0, m;
  while ((m = fence.exec(text)) !== null) {
    if (m.index > last) segs.push({ t: "text", c: text.slice(last, m.index) });
    segs.push({ t: "code", c: m[2].replace(/\n$/, "") });
    last = fence.lastIndex;
  }
  if (last < text.length) segs.push({ t: "text", c: text.slice(last) });

  const isSep = l => l.includes("-") && /^\|?[\s:|-]+\|?$/.test(l.trim());
  const isPipe = l => l.trim().startsWith("|");

  function block(b, key) {
    const lines = b.split("\n").filter(l => l.trim());
    if (!lines.length) return null;
    // heading
    const hm = lines.length === 1 && lines[0].match(/^(#{1,4}) (.+)/);
    if (hm) {
      const Tag = hm[1].length <= 2 ? "h3" : "h4";
      return <Tag key={key} className={"md-h" + hm[1].length}>{renderInline(hm[2].trim(), key)}</Tag>;
    }
    // table
    if (lines.some(isPipe)) {
      const rows = lines.filter(l => !isSep(l) && isPipe(l));
      if (rows.length >= 1) {
        const cells = l => l.replace(/^\||\|$/g, "").split("|").map(c => c.trim());
        const [hdr, ...body] = rows;
        return (
          <table key={key} className="md-tbl">
            <thead><tr>{cells(hdr).map((c, i) => <th key={i}>{renderInline(c, key + "h" + i)}</th>)}</tr></thead>
            {body.length > 0 && <tbody>{body.map((r, ri) => <tr key={ri}>{cells(r).map((c, ci) => <td key={ci}>{renderInline(c, key + ri + ci)}</td>)}</tr>)}</tbody>}
          </table>
        );
      }
    }
    // unordered list
    if (lines.every(l => /^[-*] /.test(l.trim())))
      return <ul key={key} className="md-ul">{lines.map((l, i) => <li key={i}>{renderInline(l.trim().slice(2), key + i)}</li>)}</ul>;
    // ordered list
    if (lines.every(l => /^\d+[.)]\s/.test(l.trim())))
      return <ol key={key} className="md-ol">{lines.map((l, i) => <li key={i}>{renderInline(l.trim().replace(/^\d+[.)]\s/, ""), key + i)}</li>)}</ol>;
    // paragraph
    return <p key={key} className="lp">{renderInline(lines.join(" "), key)}</p>;
  }

  return <>{segs.map((s, si) => s.t === "code"
    ? <CodeBlock key={si} code={s.c} />
    : s.c.split(/\n\n+/).filter(b => b.trim()).map((b, bi) => block(b, si + "-" + bi)))}</>;
}

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
            <div className="out"><span className="out-l">{t("output")}</span><code className="out-v">{ex.expectedOutput}</code></div>
            <div className="exp"><Markdown text={ex.explanation} /></div>
          </>}
    </div>
  );
}

function Exercise({ ex, idx, status, onResolve, onSkip, onUnskip }) {
  const [picked, setPicked] = useState(null);
  const [val, setVal] = useState("");
  // A persisted "correct"/"wrong" status means the learner already resolved this
  // exercise; restore the verdict on mount so a reload doesn't reset it to blank
  // (mirrors how "skipped" is already restored below).
  const [done, setDone] = useState(() => status === "correct" || status === "wrong");
  const [correct, setCorrect] = useState(() => status === "correct");
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
    const lines = (ex.code || "").split("\n");
    body = <>
      {ex.prompt && <div className="prompt"><Markdown text={ex.prompt} /></div>}
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
      {ex.prompt && <div className="prompt"><Markdown text={ex.prompt} /></div>}
      <div className="opts">
        {ex.options.map((o, i) => {
          const cls = optionClass(done, i, ex.answerIndex, picked);
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

function Challenge({ ch, verifiedWith }) {
  const [show, setShow] = useState(false);
  const [code, setCode] = useState(ch.starterCode || "");
  const [busy, setBusy] = useState(false);
  const [pendingMode, setPendingMode] = useState(null); // "run" | "check" | null — which button is in flight
  const [run, setRun] = useState(null); // { mode: "run" | "check", ...godboltVerdict result } | { mode, kind: "network-error" }
  const t = useT();

  async function execute(mode) {
    setBusy(true);
    setPendingMode(mode);
    setRun(null);
    try {
      const data = await compileOnGodbolt(verifiedWith.compilerId, code, verifiedWith.flags);
      setRun({ mode, ...godboltVerdict(data) });
    } catch (e) {
      setRun({ mode, kind: "network-error" });
    } finally {
      setBusy(false);
      setPendingMode(null);
    }
  }

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
        {ch.starterCode && (
          <button className="btn ghost sm" disabled={busy || code === ch.starterCode}
            onClick={() => setCode(ch.starterCode)}>{t("resetToStarter")}</button>
        )}
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

function Mastery({ lesson, onPass }) {
  const t = useT();
  const qs = lesson.masteryCheck.questions;
  const [ans, setAns] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const allAnswered = qs.every((_, i) => ans[i] !== undefined);
  const score = qs.reduce((a, q, i) => a + (ans[i] === q.answerIndex ? 1 : 0), 0) / qs.length;
  const thr = lesson.masteryCheck.passThreshold;
  const passed = score >= thr;
  function submit() { setSubmitted(true); onPass(score); }
  return (
    <div className="mastery">
      {qs.map((q, i) => (
        <div key={i} className="mq">
          <div className="mq-p"><span className="mq-n">{i + 1}</span><span>{renderInline(q.prompt, "mq" + i + "-")}</span></div>
          <div className="opts">
            {q.options.map((o, oi) => {
              const cls = optionClass(submitted, oi, q.answerIndex, ans[i]);
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

function StatusIcon({ kind }) {
  if (kind === STATUS.DONE) return <Check size={15} className="i-done" />;
  if (kind === STATUS.SKIPPED) return <SkipForward size={15} className="i-skip" />;
  if (kind === STATUS.PROGRESS) return <CircleDot size={15} className="i-prog" />;
  return <Circle size={15} className="i-none" />;
}

const STATUS_KEY = {
  "done": "statusDone", "skipped": "statusSkipped",
  "in-progress": "statusInProgress", "not-started": "statusNotStarted",
};

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

function CourseView({ courseId, onBackToPicker }) {
  const [saved] = useState(() => loadProgress(courseId));
  const [locale, setLocale] = useState(saved && saved.locale ? saved.locale : "ru");
  const tr = (key, ...args) => t(locale, key, ...args);
  const [courseData, setCourseData] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setCourseData(null);
    setLoadError(null);
    loadCourseData(courseId, locale)
      .then((data) => { if (!cancelled) setCourseData(data); })
      .catch((err) => { if (!cancelled) { console.error(err); setLoadError(err); } });
    return () => { cancelled = true; };
  }, [courseId, locale]);
  const [cur, setCur] = useState(saved && saved.cur ? saved.cur : "m1-l1");
  const [view, setView] = useState(saved && saved.view ? saved.view : "lesson");
  const [exStatus, setExStatus] = useState(saved && saved.exStatus ? saved.exStatus : {});
  const [mastery, setMastery] = useState(saved && saved.mastery ? saved.mastery : {});
  const [viewed, setViewed] = useState(saved && saved.viewed ? saved.viewed : {});
  const [strict, setStrict] = useState(saved ? !!saved.strict : false);
  const [session, setSession] = useState(null);
  const lastSyncedBlob = useRef(null);
  const pulledForUserId = useRef(null);

  useEffect(() => {
    saveProgress(courseId, { cur, view, exStatus, mastery, viewed, strict, locale });
  }, [courseId, cur, view, exStatus, mastery, strict, locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => { window.scrollTo(0, 0); }, [cur]);

  function signIn(provider) {
    const client = getSupabaseClient();
    if (!client) return;
    client.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin + window.location.pathname } })
      .then(({ error }) => { if (error) console.error("signInWithOAuth error:", error); })
      .catch(console.error);
  }
  async function signOut() {
    const client = getSupabaseClient();
    if (!client) return;
    if (session) await pushIfChanged(session.user.id);
    client.auth.signOut().catch(() => {});
  }

  function currentLocalBlob() {
    return loadProgress(courseId) || { cur: "m1-l1", view: "lesson", exStatus: {}, mastery: {}, strict: false, locale: "ru" };
  }

  // lastSyncedBlob.current is null until syncOnLogin establishes a baseline;
  // pushing before that could overwrite the cloud row with pre-pull local state.
  function pushIfChanged(userId) {
    if (lastSyncedBlob.current === null) return Promise.resolve();
    const client = getSupabaseClient();
    if (!client) return Promise.resolve();
    const blob = currentLocalBlob();
    if (JSON.stringify(blob) === JSON.stringify(lastSyncedBlob.current)) return Promise.resolve();
    lastSyncedBlob.current = blob;
    return pushProgress(client, userId, courseId, blob);
  }

  function applyProgress(blob) {
    setCur(blob.cur || "m1-l1");
    setView(blob.view || "lesson");
    setExStatus(blob.exStatus || {});
    setMastery(blob.mastery || {});
    setViewed(blob.viewed || {});
    setStrict(!!blob.strict);
    if (blob.locale) setLocale(blob.locale);
    saveProgress(courseId, blob);
  }

  // On sign-out, wipe the signed-in user's progress from this browser so the
  // next person (or anonymous session) starts clean and a subsequent login
  // can't inherit it via mergeProgress. The cloud copy is preserved (pushed
  // before sign-out), so re-login restores it. UI locale is kept.
  function resetProgress() {
    setCur("m1-l1");
    setView("lesson");
    setExStatus({});
    setMastery({});
    setViewed({});
    setStrict(false);
    lastSyncedBlob.current = null;
    const prev = loadProgress(courseId);
    saveProgress(courseId, { cur: "m1-l1", view: "lesson", exStatus: {}, mastery: {}, strict: false, locale: (prev && prev.locale) || locale });
  }

  async function syncOnLogin(userId) {
    const client = getSupabaseClient();
    if (!client) return;
    const result = await pullProgress(client, userId, courseId);
    if (!result.ok) {
      lastSyncedBlob.current = currentLocalBlob();
      return;
    }
    if (result.blob) {
      // Merge cloud with local instead of overwriting: the learner may have
      // earned progress locally that the debounced push hasn't sent up yet.
      const merged = mergeProgress(currentLocalBlob(), result.blob);
      applyProgress(merged);
      pushProgress(client, userId, courseId, merged);
      lastSyncedBlob.current = merged;
    } else {
      const localBlob = currentLocalBlob();
      pushProgress(client, userId, courseId, localBlob);
      lastSyncedBlob.current = localBlob;
    }
  }

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) return;
    function handleSession(newSession) {
      setSession(newSession);
      if (newSession && pulledForUserId.current !== newSession.user.id) {
        pulledForUserId.current = newSession.user.id;
        syncOnLogin(newSession.user.id);
      }
      if (!newSession) {
        // Only a real sign-out (we had pulled for a user) clears progress;
        // a null session on initial load = anonymous, must NOT wipe local data.
        if (pulledForUserId.current !== null) resetProgress();
        pulledForUserId.current = null;
      }
    }
    client.auth.getSession().then(({ data }) => handleSession(data.session)).catch(() => {});
    const { data: sub } = client.auth.onAuthStateChange((_event, newSession) => handleSession(newSession));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    const userId = session.user.id;

    function push() {
      pushIfChanged(userId);
    }
    function onVisibilityChange() {
      if (document.visibilityState === "hidden") push();
    }

    const interval = setInterval(push, 3 * 60 * 1000);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("beforeunload", push);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("beforeunload", push);
    };
  }, [session?.user?.id]);

  // Debounced push: ~5s after the learner stops changing progress, sync to
  // the cloud without waiting for the 3-minute timer or a tab-visibility change.
  useEffect(() => {
    if (!session) return;
    const userId = session.user.id;
    const timer = setTimeout(() => pushIfChanged(userId), 5000);
    return () => clearTimeout(timer);
  }, [cur, view, exStatus, mastery, strict, session?.user?.id]);

  if (loadError) {
    return <div className="app"><style>{CSS}</style><div className="empty-big">{tr("loadError")}</div></div>;
  }
  if (!courseData) {
    return <div className="app"><style>{CSS}</style><div className="empty-big">{tr("loading")}</div></div>;
  }
  const modules = courseData.modules;
  const allLessons = modules.flatMap((m) => (m.lessons || []).map((l) => ({ ...l, mod: m })));
  const findLesson = (id) => allLessons.find((l) => l.id === id);
  const lesson = findLesson(cur);

  function lessonStatus(l) {
    if (!l || l.stub) return { kind: STATUS.NOT_STARTED, skipped: 0 };
    const exs = l.exercises || [];
    const skipped = exs.filter((e) => exStatus[e.id] === "skipped").length;
    const touched = exs.some((e) => exStatus[e.id]) || mastery[l.id] !== undefined || !!viewed[l.id];
    const ms = mastery[l.id];
    const hasMastery = !!l.masteryCheck;
    const passed = hasMastery
      ? ms !== undefined && ms >= l.masteryCheck.passThreshold
      : exs.length > 0
        ? exs.every((e) => exStatus[e.id] === "correct" || exStatus[e.id] === "skipped")
        : !!viewed[l.id];
    if (passed && (!strict || skipped === 0)) return { kind: STATUS.DONE, skipped };
    if (touched) return { kind: skipped > 0 ? STATUS.SKIPPED : STATUS.PROGRESS, skipped };
    return { kind: STATUS.NOT_STARTED, skipped: 0 };
  }

  const resolveEx = (id, ok) => setExStatus((s) => ({ ...s, [id]: ok ? "correct" : "wrong" }));
  const skipEx = (id) => setExStatus((s) => ({ ...s, [id]: "skipped" }));
  const unskipEx = (id) => setExStatus((s) => {
    const next = { ...s };
    delete next[id];
    return next;
  });
  const passMastery = (id, sc) => setMastery((s) => ({ ...s, [id]: sc }));

  const real = allLessons.filter((l) => !l.stub);
  const doneCount = real.filter((l) => lessonStatus(l).kind === STATUS.DONE).length;
  const skippedItems = allLessons.flatMap((l) => (l.exercises || []).filter((e) => exStatus[e.id] === "skipped").map((e) => ({ l, e })));

  function moduleSkips(m) {
    return (m.lessons || []).reduce((a, l) => a + lessonStatus(l).skipped, 0);
  }

  const st = lessonStatus(lesson);

  return (
    <LocaleContext.Provider value={locale}>
    <div className="app">
      <style>{CSS}</style>
      <header className="topbar">
        <div className="topbar-left">
          <button className="back-btn" onClick={onBackToPicker}>← {locale === "ru" ? "Все курсы" : "All courses"}</button>
          <div className="brand"><BookOpen size={18} /><span>{COURSE_TITLES[courseId][locale]}</span></div>
        </div>
        <div className="prog">
          <div className="prog-bar"><div className="prog-fill" style={{ width: (real.length ? (doneCount / real.length * 100) : 0) + "%" }} /></div>
          <span className="prog-txt">{tr("lessonsProgress", doneCount, real.length)}</span>
        </div>
        <LocaleSwitcher locale={locale} setLocale={setLocale} />
        <AccountWidget session={session} onSignIn={signIn} onSignOut={signOut} />
      </header>

      <div className="body">
        <aside className="side">
          <button className={"rep " + (view === "repetition" ? "active" : "")} onClick={() => setView("repetition")}>
            <Repeat size={15} /> {tr("repetitionZone")} <span className="rep-n">{skippedItems.length}</span>
          </button>
          <label className="strict">
            <input type="checkbox" checked={strict} onChange={(e) => setStrict(e.target.checked)} />
            {tr("strictMode")}
          </label>

          <nav>
            {modules.map((m) => {
              const sk = moduleSkips(m);
              return (
                <div key={m.id} className="mod">
                  <div className="mod-h">
                    <span className="mod-n">{m.moduleNumber}</span>
                    <span className="mod-t">{m.title}</span>
                    <span className="sig">{m.significance}</span>
                  </div>
                  {sk > 0 && <div className="mod-skip">{tr("modSkipped", sk)}</div>}
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
                              {l.stub && <span className="soon">{tr("soon")}</span>}
                              {ls.skipped > 0 && <span className="ldot">{ls.skipped}</span>}
                            </li>
                          );
                        })}
                      </ul>
                    : <div className="empty">{tr("lessonsComingSoon")}</div>}
                </div>
              );
            })}
          </nav>
        </aside>

        <main className="main">
          {view === "repetition"
            ? <div className="repview">
                <h1>{tr("repetitionTitle")}</h1>
                <p className="sub">{tr("repetitionSubtitle")}</p>
                {skippedItems.length === 0
                  ? <div className="empty-big">{tr("noSkippedItems")}</div>
                  : skippedItems.map(({ l, e }) => (
                      <div key={e.id} className="repitem" onClick={() => { setCur(l.id); setView("lesson"); }}>
                        <div><span className="tag tag-type">{e.type}</span> <span className="repl">{l.title}</span></div>
                        <ChevronRight size={16} />
                      </div>
                    ))}
              </div>
            : !lesson
              ? <div className="empty-big">{tr("selectLesson")}</div>
              : lesson.stub
                ? <div className="lesson">
                    <div className="lhead"><div className="lhead-top">{tr("module")} {lesson.mod.moduleNumber} · {lesson.mod.title}</div>
                      <h1>{renderInline(lesson.title, "h-")}</h1></div>
                    <div className="empty-big">{tr("stubLesson")}</div>
                  </div>
                : <div className="lesson">
                    <div className="lhead">
                      <div className="lhead-top">{tr("module")} {lesson.mod.moduleNumber} · {lesson.mod.title}</div>
                      <h1>{lesson.title}</h1>
                      <div className="lmeta">
                        <span className={"badge badge-" + st.kind}>{tr(STATUS_KEY[st.kind])}{st.skipped > 0 ? " · " + tr("modSkipped", st.skipped) : ""}</span>
                        {lesson.outputsVerified === false && <span className="badge badge-pending">{tr("outputsPending")}</span>}
                      </div>
                    </div>

                    <Background text={lesson.background} />

                    <section><h2>{tr("motivation")}</h2><Markdown text={lesson.motivation} /></section>
                    <section><h2>{tr("theory")}</h2><Markdown text={lesson.theory} /></section>

                    {lesson.examples.length > 0 && (
                      <section>
                        <h2>{tr("examples")}</h2>
                        {lesson.examples.map((ex, i) => <ExampleCard key={i} ex={ex} idx={i} />)}
                      </section>
                    )}

                    {lesson.exercises && lesson.exercises.length > 0 && (
                    <section>
                      <h2>{tr("exercises")}</h2>
                      {lesson.exercises.map((ex, i) => (
                        <Exercise key={ex.id} ex={ex} idx={i}
                          status={exStatus[ex.id]}
                          onResolve={(ok) => resolveEx(ex.id, ok)}
                          onSkip={() => skipEx(ex.id)}
                          onUnskip={() => unskipEx(ex.id)} />
                      ))}
                    </section>
                    )}

                    {lesson.challenge && <section><h2>{tr("challengeOptional").split(" ·")[0]}</h2><Challenge ch={lesson.challenge} verifiedWith={lesson.verifiedWith} /></section>}

                    {lesson.masteryCheck && (
                    <section>
                      <h2>{tr("masteryCheckTitle")} <span className="thr">{tr("threshold", Math.round(lesson.masteryCheck.passThreshold * 100))}</span></h2>
                      <Mastery lesson={lesson} onPass={(sc) => passMastery(lesson.id, sc)} />
                    </section>
                    )}

                    {!lesson.masteryCheck && (!lesson.exercises || lesson.exercises.length === 0) && (
                      <div className="mark-read-bar">
                        {viewed[lesson.id]
                          ? <span className="mark-read-done">✓ {locale === "ru" ? "Прочитано" : "Done"}</span>
                          : <button className="mark-read-btn" onClick={() => setViewed((s) => ({ ...s, [lesson.id]: true }))}>
                              {locale === "ru" ? "Отметить как прочитанное" : "Mark as read"}
                            </button>
                        }
                      </div>
                    )}
                  </div>}
        </main>
      </div>
    </div>
    </LocaleContext.Provider>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:wght@500;600&family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
* { box-sizing: border-box; }
.app {
  --bg:#14110f; --panel:#1c1916; --panel2:#211d19; --ink:#ece6dd; --mut:#9a9085;
  --line:#2c2723; --amber:#d9a441; --green:#6fae7a; --red:#cf6a5a; --codebg:#100d0b;
  font-family:'IBM Plex Sans',system-ui,sans-serif; color:var(--ink); background:var(--bg);
  min-height:100vh; font-size:15px; line-height:1.6;
}
h1,h2,.brand span,.mod-t { font-family:'IBM Plex Serif',Georgia,serif; }
.ic, code, pre, .out-v, .inp { font-family:'JetBrains Mono',ui-monospace,monospace; }

.topbar { display:flex; align-items:center; justify-content:space-between; gap:16px;
  padding:14px 22px; border-bottom:1px solid var(--line); background:linear-gradient(180deg,#1a1714,#14110f); position:sticky; top:0; z-index:5; }
.brand { display:flex; align-items:center; gap:10px; font-size:17px; font-weight:600; color:var(--amber); }
.brand span { color:var(--ink); }
.prog { display:flex; align-items:center; gap:10px; }
.prog-bar { width:160px; height:6px; background:var(--line); border-radius:99px; overflow:hidden; }
.prog-fill { height:100%; background:var(--amber); transition:width .3s; }
.prog-txt { font-size:12px; color:var(--mut); white-space:nowrap; }
.account { display:flex; align-items:center; gap:8px; }
.acct-btn { display:flex; align-items:center; gap:6px; background:var(--panel2); color:var(--ink);
  border:1px solid var(--line); border-radius:8px; padding:6px 10px; cursor:pointer; font-size:12px; }
.acct-btn:hover { border-color:var(--amber); }
.acct-name { font-size:13px; color:var(--ink); white-space:nowrap; }
.acct-av { width:24px; height:24px; border-radius:50%; object-fit:cover; }
.locale-switch { display:flex; gap:4px; }
.locale-btn { background:var(--panel2); color:var(--mut); border:1px solid var(--line); border-radius:8px;
  padding:6px 10px; cursor:pointer; font-size:12px; font-weight:600; font-family:inherit; }
.locale-btn:hover { border-color:var(--amber); }
.locale-btn.active { color:var(--amber); border-color:var(--amber); }

.body { display:flex; align-items:flex-start; }
.side { width:288px; flex-shrink:0; border-right:1px solid var(--line); padding:16px 12px;
  position:sticky; top:57px; height:calc(100vh - 57px); overflow-y:auto; background:var(--panel); }
.rep { width:100%; display:flex; align-items:center; gap:8px; background:var(--panel2); color:var(--ink);
  border:1px solid var(--line); border-radius:9px; padding:9px 11px; cursor:pointer; font-size:13px; }
.rep:hover { border-color:var(--amber); }
.rep.active { border-color:var(--amber); color:var(--amber); }
.rep-n { margin-left:auto; background:var(--amber); color:#1a1714; border-radius:99px; padding:0 7px; font-size:11px; font-weight:600; }
.strict { display:flex; gap:8px; align-items:flex-start; font-size:12px; color:var(--mut); margin:12px 2px 16px; cursor:pointer; }
.strict input { margin-top:3px; accent-color:var(--amber); }

.mod { margin-bottom:14px; }
.mod-h { display:flex; align-items:baseline; gap:7px; padding:4px 4px; }
.mod-n { font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--amber); background:var(--codebg); border:1px solid var(--line); border-radius:5px; padding:1px 6px; }
.mod-t { font-size:13px; font-weight:600; flex:1; }
.sig { font-size:10px; text-transform:uppercase; letter-spacing:.04em; padding:1px 6px; border-radius:99px; color:var(--mut); border:1px solid var(--line); }
.mod-skip { font-size:11px; color:var(--amber); margin:2px 0 4px 30px; }
.mod ul { list-style:none; margin:2px 0 0; padding:0; }
.mod li { display:flex; align-items:center; gap:8px; padding:6px 8px 6px 10px; border-radius:7px; cursor:pointer; font-size:13px; color:var(--ink); }
.mod li:hover { background:var(--panel2); }
.mod li.cur { background:var(--panel2); box-shadow:inset 2px 0 0 var(--amber); }
.mod li.stub { color:var(--mut); }
.ltitle { flex:1; }
.soon { font-size:10px; color:var(--mut); border:1px solid var(--line); border-radius:99px; padding:0 6px; }
.ldot { font-size:10px; background:var(--amber); color:#1a1714; border-radius:99px; padding:0 6px; font-weight:600; }
.empty { font-size:12px; color:var(--mut); padding:2px 10px 4px 30px; font-style:italic; }
.i-done { color:var(--green); } .i-skip { color:var(--amber); } .i-prog { color:var(--amber); } .i-none { color:#4a443d; }

.main { flex:1; min-width:0; padding:28px 36px 80px; max-width:840px; }
.lhead { margin-bottom:24px; }
.lhead-top { font-size:12px; color:var(--mut); text-transform:uppercase; letter-spacing:.05em; }
.lhead h1 { font-size:30px; margin:6px 0 10px; }
.lmeta { display:flex; gap:8px; flex-wrap:wrap; }
.badge { font-size:11px; padding:3px 9px; border-radius:99px; border:1px solid var(--line); color:var(--mut); }
.badge-done { color:var(--green); border-color:var(--green); }
.badge-skipped, .badge-in-progress { color:var(--amber); border-color:var(--amber); }
.badge-pending { color:var(--amber); background:rgba(217,164,65,.08); }

section { margin:26px 0; }
section h2 { font-size:19px; margin:0 0 12px; padding-bottom:7px; border-bottom:1px solid var(--line); display:flex; align-items:baseline; gap:10px; }
.thr { font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--amber); font-weight:400; }
.lp { margin:0 0 13px; }
.ic { background:var(--codebg); border:1px solid var(--line); border-radius:5px; padding:1px 5px; font-size:.9em; color:#e3c98c; }
.md-h2 { font-size:17px; font-weight:700; margin:22px 0 8px; }
.md-h3, .md-h4 { font-size:14px; font-weight:700; margin:18px 0 6px; color:var(--ink); }
.md-ul, .md-ol { margin:0 0 13px 22px; padding:0; }
.md-ul li, .md-ol li { margin-bottom:5px; line-height:1.55; }
.md-tbl { border-collapse:collapse; width:100%; margin:0 0 16px; font-size:13px; }
.md-tbl th, .md-tbl td { border:1px solid var(--line); padding:6px 12px; text-align:left; vertical-align:top; }
.md-tbl th { background:var(--panel2); font-weight:600; }
.md-tbl tr:nth-child(even) td { background:rgba(255,255,255,.02); }

.cb { background:var(--codebg); border:1px solid var(--line); border-radius:10px; padding:14px 16px; overflow-x:auto; margin:0 0 12px; font-size:13px; line-height:1.55; }
.cb code { color:#dcd5ca; white-space:pre; }
.linecode { padding:10px 0; }
.cl { display:flex; gap:0; padding:0 16px; cursor:pointer; }
.cl:hover .lc { background:rgba(217,164,65,.07); }
.cl .ln { width:26px; flex-shrink:0; text-align:right; padding-right:12px; color:#5b554c; user-select:none; }
.cl .lc { flex:1; white-space:pre; padding-left:6px; }
.cl.sel .lc { background:rgba(217,164,65,.18); box-shadow:inset 2px 0 0 var(--amber); }
.cl.buggy .lc { background:rgba(111,174,122,.18); box-shadow:inset 2px 0 0 var(--green); }
.cl.wrong .lc { background:rgba(207,106,90,.16); box-shadow:inset 2px 0 0 var(--red); }

.card { background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:16px; margin:0 0 14px; }
.card.ex-skipped { opacity:.6; border-style:dashed; border-color:var(--amber); }
.card-h { display:flex; align-items:center; gap:8px; margin-bottom:11px; }
.card-t { font-family:'IBM Plex Serif',serif; font-size:15px; }
.tag { font-size:10px; text-transform:uppercase; letter-spacing:.05em; padding:2px 8px; border-radius:99px; border:1px solid var(--line); color:var(--mut); }
.tag-ex { color:var(--amber); border-color:var(--amber); }
.tag-basic { color:var(--green); border-color:var(--green); }
.tag-advanced { color:var(--amber); border-color:var(--amber); }
.tag-type { font-family:'JetBrains Mono',monospace; text-transform:none; letter-spacing:0; }
.tag-opt { color:var(--mut); }
.badge-skip { font-size:10px; text-transform:uppercase; letter-spacing:.05em; padding:2px 8px; border-radius:99px; border:1px solid var(--amber); color:var(--amber); }

.btn { background:var(--amber); color:#1a1714; border:none; border-radius:8px; padding:8px 14px; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; }
.btn:hover { filter:brightness(1.07); }
.btn:disabled { opacity:.4; cursor:not-allowed; }
.btn.ghost { background:transparent; color:var(--amber); border:1px solid var(--line); }
.btn.ghost:hover { border-color:var(--amber); }
.btn.primary { background:var(--amber); }
.btn.skip { margin-left:auto; background:transparent; color:var(--mut); border:1px solid var(--line); padding:5px 11px; font-weight:500; }
.btn.skip:hover { color:var(--amber); border-color:var(--amber); }
.btn.sm { padding:5px 11px; font-size:12px; margin-top:10px; }

.row { display:flex; gap:9px; align-items:center; }
.inp { flex:1; background:var(--codebg); border:1px solid var(--line); border-radius:8px; padding:8px 11px; color:var(--ink); font-size:13px; }
.inp:focus { outline:none; border-color:var(--amber); }
.verdict { margin-top:10px; padding:9px 12px; border-radius:8px; font-size:13px; }
.verdict.ok { color:var(--green); background:rgba(111,174,122,.1); border:1px solid rgba(111,174,122,.3); }
.verdict.no { color:var(--red); background:rgba(207,106,90,.1); border:1px solid rgba(207,106,90,.3); }
.prompt { margin:0 0 11px; }
.opts { display:flex; flex-direction:column; gap:8px; }
.opt { text-align:left; background:var(--panel2); border:1px solid var(--line); border-radius:9px; padding:10px 13px; color:var(--ink); cursor:pointer; font-family:inherit; font-size:13px; }
.opt:hover { border-color:var(--amber); }
.opt.sel { border-color:var(--amber); }
.opt.ok { border-color:var(--green); background:rgba(111,174,122,.12); color:var(--green); }
.opt.no { border-color:var(--red); background:rgba(207,106,90,.1); color:var(--red); }
.exp { margin-top:11px; padding-top:11px; border-top:1px dashed var(--line); font-size:14px; color:#cfc7bb; }
.out { display:flex; align-items:center; gap:9px; margin-top:4px; }
.out-l { font-size:11px; text-transform:uppercase; letter-spacing:.05em; color:var(--mut); }
.out-v { background:var(--codebg); border:1px solid var(--green); color:var(--green); border-radius:6px; padding:2px 9px; font-size:13px; }

.challenge { border-style:dashed; }
.ref-label { font-size:11px; text-transform:uppercase; letter-spacing:.05em; color:var(--amber); margin:8px 0 6px; }
.ce { margin-top:8px; font-size:13px; }
.ce a { color:var(--amber); }

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

.chal-diff { display:flex; gap:14px; margin-top:10px; flex-wrap:wrap; }
.chal-diff > div { flex:1; min-width:200px; }
.chal-diff-l { display:block; font-size:11px; text-transform:uppercase; letter-spacing:.05em; color:var(--mut); margin-bottom:5px; }

.bg { margin:0 0 18px; }
.bg-toggle { background:var(--panel); border:1px solid var(--line); border-radius:8px; padding:8px 12px; color:var(--mut); cursor:pointer; font-family:inherit; font-size:13px; }
.bg-body { margin-top:10px; padding:14px; background:var(--panel); border:1px solid var(--line); border-radius:10px; }

.mastery { background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:18px; }
.mq { margin-bottom:16px; }
.mq-p { display:flex; gap:9px; margin-bottom:9px; font-weight:500; }
.mq-n { font-family:'JetBrains Mono',monospace; color:var(--amber); }
.mres { margin-top:12px; padding:11px 14px; border-radius:9px; font-size:14px; display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
.mres.ok { color:var(--green); background:rgba(111,174,122,.1); border:1px solid rgba(111,174,122,.3); }
.mres.no { color:var(--red); background:rgba(207,106,90,.1); border:1px solid rgba(207,106,90,.3); }

.repview h1 { font-size:26px; margin:0 0 6px; }
.repview .sub { color:var(--mut); font-size:13px; margin:0 0 18px; max-width:560px; }
.repitem { display:flex; align-items:center; justify-content:space-between; background:var(--panel); border:1px solid var(--line); border-radius:10px; padding:12px 14px; margin-bottom:9px; cursor:pointer; }
.repitem:hover { border-color:var(--amber); }
.repl { font-family:'IBM Plex Serif',serif; }
.empty-big { color:var(--mut); font-style:italic; padding:30px 0; }

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

.topbar-left { display:flex; align-items:center; gap:14px; }
.back-btn { background:none; border:none; color:var(--mut); cursor:pointer; font-size:13px;
  padding:0; white-space:nowrap; }
.back-btn:hover { color:var(--ink); }
.mark-read-bar { margin-top:32px; padding-top:24px; border-top:1px solid var(--line); }
.mark-read-btn { background:var(--amber); color:#14110f; border:none; border-radius:8px;
  padding:10px 20px; font-size:14px; font-weight:600; cursor:pointer; }
.mark-read-btn:hover { opacity:0.85; }
.mark-read-done { color:var(--green); font-size:14px; font-weight:600; }
`;

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
