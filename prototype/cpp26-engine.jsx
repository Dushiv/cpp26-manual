const { useState, useEffect, useRef } = React;
const { Check, SkipForward, Circle, CircleDot, Repeat, ChevronRight, BookOpen, LogIn, LogOut, User } = window.lucideReact || window.LucideReact;

const COURSE_DATA = {
  "courseTitle": "C++26 — от нуля до полного понимания",
  "modules": [
    {
      "id": "m0",
      "moduleNumber": 0,
      "title": "Контекст C++26",
      "significance": "вводный",
      "prerequisites": [],
      "lessons": []
    },
    {
      "id": "m1",
      "moduleNumber": 1,
      "title": "Core language ergonomics",
      "significance": "базовый",
      "prerequisites": [],
      "lessons": [
        {
          "id": "m1-l1",
          "title": "Pack indexing",
          "prerequisites": [],
          "background": null,
          "motivation": "До C++26 достать из пака один конкретный элемент было на удивление неудобно. Прямого способа сказать «дай N-й элемент пака» язык не давал, поэтому приходилось идти окольными путями: рекурсией по паку (отщипывая по элементу на каждый инстанс шаблона), упаковкой всего в `std::tuple` ради `std::get<N>` или трюками с fold-expression. Любой из этих путей многословен, бьёт по времени компиляции и заслоняет само намерение — «мне нужен элемент номер N».\n\n**Pack indexing** убирает эту возню: он добавляет к пакам обычный subscript, и обращение к элементу — что по значению, что по типу — становится однострочником, читаемым ровно так, как читается мысль.",
          "theory": "Pack indexing (предложение P2662) — это subscript-синтаксис, который выбирает из пака один элемент по индексу, известному на этапе компиляции. Раньше пак можно было только «развернуть целиком» через `...`; теперь к нему допустимо обратиться точечно, почти как к массиву.\n\nУ синтаксиса две формы, и различаются они лишь контекстом. Когда `pack...[N]` стоит там, где ожидается выражение, это **pack-index-expression**, и оно даёт N-е значение. Когда та же запись стоит там, где ожидается тип, это **pack-index-specifier**, и она даёт N-й тип. Один и тот же `...[N]` несёт два смысла в зависимости от позиции, и какой из них в силе, компилятор понимает сам.\n\nИндекс отсчитывается с нуля. Главное требование: `N` обязан быть **constant expression** — значением, которое компилятор знает заранее, поэтому проиндексировать пак runtime-переменной нельзя, и попытка обернётся ошибкой компиляции. При этом `N` может зависеть от параметров шаблона: `sizeof...(Ts) - 1` тоже constant expression — так берут последний элемент. Если индекс выходит за границы (у пака из `k` элементов валидны индексы от `0` до `k-1`), программа становится **ill-formed**: снова диагностика при компиляции, без undefined behavior. Это осознанная линия C++26 — то, что в старом языке стало бы тихим UB, здесь ловит компилятор (подробнее в Модуле 2).\n\nИндексировать можно любой пак: function parameter pack, template parameter pack (и type, и non-type), пак из generic-лямбды, а также structured-binding pack (последнее — через P1061, отдельный урок). Важна и value category: при индексации function parameter pack выражение `args...[i]` именует конкретный параметр, то есть это lvalue — на него можно сослаться или взять адрес.\n\nНаконец, границы: pack indexing не даёт ни срезов (slicing), ни выбора по runtime-значению — это прямое следствие требования constant expression. Если выбор нужен в рантайме, по-прежнему строят массив или tuple и индексируют его.",
          "outputsVerified": false,
          "verifiedWith": { "compilerId": "gsnapshot", "flags": "-std=c++26 -O2" },
          "examples": [
            {
              "title": "Выбор N-го значения",
              "code": "#include <print>\n\ntemplate <typename... Args>\nconstexpr auto second(Args... args) {\n    return args...[1];          // 0-based: элемент #1\n}\n\nint main() {\n    std::print(\"{}\\n\", second(10, 20, 30));\n}",
              "expectedOutput": "20",
              "explanation": "Запись `args...[1]` напрямую достаёт второе значение пака — без рекурсии и без промежуточного tuple."
            },
            {
              "title": "Последний элемент + обе формы",
              "code": "#include <print>\n#include <type_traits>\n\ntemplate <typename... Ts>\nconstexpr auto last(Ts... xs) {\n    return xs...[sizeof...(Ts) - 1];        // value-форма\n}\n\ntemplate <typename... Ts>\nusing last_t = Ts...[sizeof...(Ts) - 1];    // type-форма\n\nint main() {\n    static_assert(std::is_same_v<last_t<int, double, char>, char>);\n    std::print(\"{}\\n\", last(1, 2, 3));\n}",
              "expectedOutput": "3",
              "explanation": "Индекс `sizeof...(Ts) - 1` сам по себе constant expression, поэтому легален. Один и тот же `...[N]` обслуживает и value pack `xs`, и type pack `Ts`; то, что `static_assert` компилируется, доказывает, что `last_t<int, double, char>` — это `char`."
            },
            {
              "title": "Тип-форма прямо в сигнатуре",
              "code": "#include <print>\n\ntemplate <typename... Ts>\nTs...[0] first_of(Ts... xs) {       // тип возврата — первый тип пака\n    return xs...[0];\n}\n\nint main() {\n    std::print(\"{}\\n\", first_of(3.14, 1, 'x'));\n}",
              "expectedOutput": "3.14",
              "explanation": "Здесь `Ts...[0]` стоит ровно там, где обычно пишут тип возврата — это и есть суть pack-index-specifier: он годится в любую позицию, где ожидается тип. Первый тип пака — `double`, поэтому функция возвращает `double`."
            },
            {
              "title": "Элемент пака — это lvalue",
              "code": "#include <print>\n\ntemplate <typename... Ts>\nconstexpr int tweak(Ts... xs) {\n    auto& r = xs...[0];      // xs...[0] именует первый параметр -> lvalue\n    r += 5;                  // меняем через ссылку\n    return xs...[0];\n}\n\nint main() {\n    std::print(\"{}\\n\", tweak(10, 20, 30));\n}",
              "expectedOutput": "15",
              "explanation": "`xs...[0]` — не копия, а имя первого параметра, поэтому к нему можно привязать `auto&` и изменить значение. `10` становится `15`, и второе обращение возвращает уже изменённое значение."
            }
          ],
          "exercises": [
            {
              "id": "m1-l1-e1",
              "level": "basic",
              "type": "predict-output",
              "code": "#include <print>\ntemplate <int... Ns>\nconstexpr int pick() { return Ns...[2]; }\nint main() { std::print(\"{}\\n\", pick<5, 6, 7, 8>()); }",
              "answer": "7",
              "explanation": "Индекс 2 с нуля → третий элемент `5, 6, 7, 8`, то есть `7`. Non-type template parameter pack индексируется так же, как пак значений."
            },
            {
              "id": "m1-l1-e2",
              "level": "advanced",
              "type": "find-bug",
              "code": "#include <print>\ntemplate <typename... T>\nauto at(int i, T... v) {\n    return v...[i];\n}\nint main() { std::print(\"{}\\n\", at(1, 10, 20, 30)); }",
              "answerLine": 4,
              "explanation": "Индекс пака обязан быть constant expression, а `i` — runtime-параметр. Поэтому `v...[i]` не скомпилируется: у pack indexing нет runtime-формы. Для выбора по runtime-значению элементы кладут в массив/tuple."
            },
            {
              "id": "m1-l1-e3",
              "level": "advanced",
              "type": "choice",
              "prompt": "`f(1, 2, 3)` инстанцируется, где `f` определена как `constexpr auto f(T... v) { return v...[3]; }`. Что произойдёт?",
              "options": [
                "Вернёт последний элемент, 3",
                "Вернёт 0",
                "Ошибка компиляции: индекс вне диапазона (ill-formed)",
                "Undefined behavior в рантайме"
              ],
              "answerIndex": 2,
              "explanation": "У пака из трёх элементов валидны индексы 0..2, поэтому `[3]` выходит за границу → ill-formed, ловится при компиляции. Никакого UB — линия безопасности C++26 (Модуль 2)."
            }
          ],
          "challenge": {
            "prompt": "Классический до-C++26 способ достать N-й элемент пака — рекурсивный хелпер. Перепиши его в одну строку через pack indexing.\n\n```cpp\ntemplate <std::size_t N, typename T0, typename... Ts>\nauto nth(T0 t0, Ts... ts) {\n    if constexpr (N == 0) return t0; else return nth<N - 1>(ts...);\n}\n```",
            "referenceSolution": "```cpp\ntemplate <std::size_t N, typename... Ts>\nconstexpr auto nth(Ts... ts) { return ts...[N]; }\n```",
            "expectedOutput": "20",
            "godboltUrl": null
          },
          "masteryCheck": {
            "passThreshold": 0.8,
            "questions": [
              {
                "type": "choice",
                "prompt": "Чем должен быть `N` в `pack...[N]`?",
                "options": [
                  "runtime-значением",
                  "constant expression",
                  "указателем",
                  "любым int"
                ],
                "answerIndex": 1
              },
              {
                "type": "choice",
                "prompt": "Для пака размера 4 валидные индексы — это:",
                "options": [
                  "1–4",
                  "0–4",
                  "0–3",
                  "1–3"
                ],
                "answerIndex": 2
              },
              {
                "type": "choice",
                "prompt": "Индексация пака вне диапазона — это:",
                "options": [
                  "UB в рантайме",
                  "значение по умолчанию",
                  "зацикливание",
                  "ill-formed на этапе компиляции"
                ],
                "answerIndex": 3
              }
            ]
          }
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
          "title": "Прочие мелочи (variadic friend, static_assert message)",
          "stub": true
        }
      ]
    },
    {
      "id": "m2",
      "moduleNumber": 2,
      "title": "Безопасность ядра",
      "significance": "важный",
      "prerequisites": [],
      "lessons": []
    },
    {
      "id": "m3",
      "moduleNumber": 3,
      "title": "constexpr: всё на этапе компиляции",
      "significance": "фундамент",
      "prerequisites": [],
      "lessons": []
    },
    {
      "id": "m4",
      "moduleNumber": 4,
      "title": "Contracts",
      "significance": "флагман",
      "prerequisites": [],
      "lessons": []
    },
    {
      "id": "m5",
      "moduleNumber": 5,
      "title": "Static Reflection",
      "significance": "флагман №1",
      "prerequisites": [],
      "lessons": []
    },
    {
      "id": "m6",
      "moduleNumber": 6,
      "title": "std::execution (Senders/Receivers)",
      "significance": "флагман",
      "prerequisites": [],
      "lessons": []
    },
    {
      "id": "m7",
      "moduleNumber": 7,
      "title": "Новые контейнеры и типы",
      "significance": "важный",
      "prerequisites": [],
      "lessons": []
    },
    {
      "id": "m8",
      "moduleNumber": 8,
      "title": "Числа и производительность",
      "significance": "важный",
      "prerequisites": [],
      "lessons": []
    },
    {
      "id": "m9",
      "moduleNumber": 9,
      "title": "Низкоуровневая конкурентность",
      "significance": "специальный",
      "prerequisites": [],
      "lessons": []
    },
    {
      "id": "m10",
      "moduleNumber": 10,
      "title": "Отладка, формат, удалённое",
      "significance": "завершающий",
      "prerequisites": [],
      "lessons": []
    }
  ]
};

const STATUS = { NOT_STARTED: "not-started", PROGRESS: "in-progress", SKIPPED: "skipped", DONE: "done" };
const norm = (s) => (s || "").trim();

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

function saveProgress(data) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ version: PROGRESS_VERSION, data }));
  } catch (e) {
    // localStorage unavailable (private browsing, full quota) — keep running in-memory only
  }
}

const SUPABASE_URL = "https://jqkgywgvubecdmimskat.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impxa2d5d2d2dWJlY2RtaW1za2F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMjMxNjgsImV4cCI6MjA5NjU5OTE2OH0.MZvtQLGJEJ8X4BU8vzu2OycG7JWTO2ubpnxv5WNpBSY";

let supabaseClient = null;
function getSupabaseClient() {
  if (!window.supabase || !SUPABASE_URL.startsWith("https://")) return null;
  if (!supabaseClient) supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return supabaseClient;
}

async function pullProgress(client, userId) {
  try {
    const { data, error } = await client.from("progress").select("blob").eq("user_id", userId).maybeSingle();
    if (error) return { ok: false };
    return { ok: true, blob: data ? data.blob : null };
  } catch (e) {
    return { ok: false };
  }
}

async function pushProgress(client, userId, blob) {
  try {
    await client.from("progress").upsert({ user_id: userId, blob, updated_at: new Date().toISOString() });
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
    if (m.index > last) segs.push({ t: "p", c: text.slice(last, m.index) });
    segs.push({ t: "code", c: m[2].replace(/\n$/, "") });
    last = fence.lastIndex;
  }
  if (last < text.length) segs.push({ t: "p", c: text.slice(last) });
  return <>{segs.map((s, si) => s.t === "code"
    ? <CodeBlock key={si} code={s.c} />
    : s.c.split(/\n\n+/).filter((p) => p.trim()).map((p, pi) =>
        <p key={si + "-" + pi} className="lp">{renderInline(p, si + "-" + pi + "-")}</p>))}</>;
}

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

function Challenge({ ch, verifiedWith }) {
  const [show, setShow] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingMode, setPendingMode] = useState(null); // "run" | "check" | null — which button is in flight
  const [run, setRun] = useState(null); // { mode: "run" | "check", ...godboltVerdict result } | { mode, kind: "network-error" }

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

function Mastery({ lesson, onPass }) {
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

function StatusIcon({ kind }) {
  if (kind === STATUS.DONE) return <Check size={15} className="i-done" />;
  if (kind === STATUS.SKIPPED) return <SkipForward size={15} className="i-skip" />;
  if (kind === STATUS.PROGRESS) return <CircleDot size={15} className="i-prog" />;
  return <Circle size={15} className="i-none" />;
}

const KIND_LABEL = {
  "done": "Выполнено", "skipped": "Пройдено с пропусками",
  "in-progress": "В процессе", "not-started": "Не начато",
};

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

function App() {
  const modules = COURSE_DATA.modules;
  const [saved] = useState(loadProgress);
  const [cur, setCur] = useState(saved ? saved.cur : "m1-l1");
  const [view, setView] = useState(saved ? saved.view : "lesson");
  const [exStatus, setExStatus] = useState(saved ? saved.exStatus : {});
  const [mastery, setMastery] = useState(saved ? saved.mastery : {});
  const [strict, setStrict] = useState(saved ? saved.strict : false);
  const [session, setSession] = useState(null);
  const lastSyncedBlob = useRef(null);
  const pulledForUserId = useRef(null);

  useEffect(() => {
    saveProgress({ cur, view, exStatus, mastery, strict });
  }, [cur, view, exStatus, mastery, strict]);

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
    return loadProgress() || { cur: "m1-l1", view: "lesson", exStatus: {}, mastery: {}, strict: false };
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
    return pushProgress(client, userId, blob);
  }

  function applyProgress(blob) {
    setCur(blob.cur);
    setView(blob.view);
    setExStatus(blob.exStatus);
    setMastery(blob.mastery);
    setStrict(blob.strict);
    saveProgress(blob);
  }

  async function syncOnLogin(userId) {
    const client = getSupabaseClient();
    if (!client) return;
    const result = await pullProgress(client, userId);
    if (!result.ok) {
      lastSyncedBlob.current = currentLocalBlob();
      return;
    }
    if (result.blob) {
      applyProgress(result.blob);
      lastSyncedBlob.current = result.blob;
    } else {
      const localBlob = currentLocalBlob();
      pushProgress(client, userId, localBlob);
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

  const allLessons = modules.flatMap((m) => (m.lessons || []).map((l) => ({ ...l, mod: m })));
  const findLesson = (id) => allLessons.find((l) => l.id === id);
  const lesson = findLesson(cur);

  function lessonStatus(l) {
    if (!l || l.stub) return { kind: STATUS.NOT_STARTED, skipped: 0 };
    const exs = l.exercises || [];
    const skipped = exs.filter((e) => exStatus[e.id] === "skipped").length;
    const touched = exs.some((e) => exStatus[e.id]) || mastery[l.id] !== undefined;
    const ms = mastery[l.id];
    const passed = ms !== undefined && ms >= l.masteryCheck.passThreshold;
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

                    <section>
                      <h2>Примеры</h2>
                      {lesson.examples.map((ex, i) => <ExampleCard key={i} ex={ex} idx={i} />)}
                    </section>

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
.sig { font-size:10px; text-transform:uppercase; letter-spacing:.04em; padding:1px 6px; border-radius:99px; }
.sig-base { color:var(--mut); border:1px solid var(--line); }
.sig-flag { color:var(--amber); border:1px solid var(--amber); }
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
.pend { font-size:11px; color:var(--amber); font-style:italic; }

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
`;

window.CPP26Engine = App;
