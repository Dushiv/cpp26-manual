# Module 0 Lesson (m0-l1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the single Module 0 lesson "Контекст C++26" (orientation: C++26 status, the three flagships, the safety theme, and how the course works) as authored content, mirror it into the prototype's inline `COURSE_DATA`, and adjust the engine to omit the "Примеры" section for lessons with no examples.

**Architecture:** Content-only change (`content/modules/m0.json` is the authored source of truth, mirrored into `prototype/cpp26-engine.jsx`'s `COURSE_DATA` per the existing pattern documented in `CLAUDE.md`), plus a small conditional-rendering tweak in the engine, verified by Playwright e2e tests.

**Tech Stack:** JSON content, React (no-build, in `prototype/cpp26-engine.jsx`), Playwright (`e2e/`).

---

### Task 1: Author `content/modules/m0.json`

**Files:**
- Create: `content/modules/m0.json`

- [ ] **Step 1: Write the lesson content file**

Create `content/modules/m0.json` with exactly this content:

```json
{
  "id": "m0",
  "moduleNumber": 0,
  "title": "Контекст C++26",
  "significance": "вводный",
  "prerequisites": [],
  "lessons": [
    {
      "id": "m0-l1",
      "title": "Контекст C++26",
      "prerequisites": [],
      "background": null,
      "motivation": "Прежде чем читать про конкретные фичи C++26, стоит понять две вещи: что вообще изменилось в языке на этом витке стандарта и как устроен сам курс. Без первого сложно расставить приоритеты — например, понять, почему рефлексии и контрактам посвящены целые модули, а мелочам вроде `_` — один урок. Без второго легко перепутать «Пропущено» с «Выполнено» или не заметить, что прогресс модуля считается по проверке усвоения, а не по факту открытия уроков.",
      "theory": "C++ — это международный стандарт ISO/IEC, который определяет язык и стандартную библиотеку. Стандарт развивается итеративно: рабочая группа WG21 принимает предложения («papers», вида `PxxxxRN`, где `RN` — номер редакции предложения), которые проходят обсуждение, голосование и попадают в очередную редакцию языка. После C++23 следующая по графику редакция — **C++26**.\n\n**C++26 утверждён**: ISO ратифицировал стандарт 28.03.2026, итоговый текст — документ **N5046**. Это значит, что все фичи, о которых идёт речь в этом курсе, — не черновики и не «может быть войдёт», а зафиксированная часть языка.\n\nПервый флагман — **Static Reflection** (на основе предложения P2996). До C++26 язык не давал коду способа «посмотреть на себя»: узнать на этапе компиляции, какие поля есть у структуры, какие у функции параметры, как называется тип. Reflection вводит операторы `^^` (взять «отражение» сущности) и `[: :]` (превратить отражение обратно в код), а также библиотеку `<meta>` для работы с этими отражениями. Это открывает путь к генерации кода без макросов и внешних кодогенераторов — сериализация, ORM-подобные обёртки, автоматические тесты пишутся на самом C++. Этому посвящён Модуль 5.\n\nВторой флагман — **Contracts**. Раньше проверки предусловий и постусловий писали вручную через `assert` или `if`+`throw`, и они были частью реализации, а не интерфейса. C++26 добавляет в язык синтаксис `pre(...)`, `post(...)` и `contract_assert(...)` — контракты становятся видимой частью объявления функции, с настраиваемой политикой проверки (включить, выключить, аварийно завершить). Модуль 4 разбирает это подробно.\n\nТретий флагман — **`std::execution`** (Senders/Receivers, P2300). Это единая модель описания асинхронных и параллельных вычислений в стандартной библиотеке: вместо разрозненных API для потоков, futures и асинхронного I/O — общий словарь «отправитель»/«получатель», на котором строятся конкретные исполнители (executors). Подробно — в Модуле 6.\n\nЧерез несколько модулей курса проходит сквозная тема — **безопасность**: C++26 в ряде мест меняет поведение «было тихим UB» на «диагностируется при компиляции». Пример уже встречался в Модуле 1: индексация пака за границами раньше была бы undefined behavior, а в C++26 — ill-formed, то есть ошибка компиляции. Модуль 2 целиком посвящён таким изменениям.\n\nСам курс устроен так: 11 модулей (0–10), от вводного контекста до отладки и удалённых возможностей; порядок — по зависимостям, а не по номерам спецификации. Каждый написанный урок имеет одну и ту же анатомию: мотивация → теория → примеры → упражнения → проверка усвоения. Упражнения можно пропустить — пропущенное получает статус «Пропущено» (это не «Выполнено») и попадает в «зону повторения», откуда его можно закрыть в любой момент. Модуль считается пройденным после проверки усвоения с порогом **80%** правильных ответов.",
      "examples": [],
      "exercises": [
        {
          "id": "m0-l1-e1",
          "level": "basic",
          "type": "choice",
          "prompt": "Какая из перечисленных фич — один из трёх флагманов C++26?",
          "options": [
            "Static Reflection",
            "Modules",
            "Concepts",
            "Ranges"
          ],
          "answerIndex": 0,
          "explanation": "Три флагмана C++26 — Static Reflection (Модуль 5), Contracts (Модуль 4) и `std::execution` (Модуль 6). Modules, Concepts и Ranges — это фичи C++20, уже знакомые ученику по базовой планке курса."
        },
        {
          "id": "m0-l1-e2",
          "level": "advanced",
          "type": "choice",
          "prompt": "Ученик нажал «Пропустить» на задаче и больше к ней не возвращался. Что произойдёт с модулем?",
          "options": [
            "Модуль закроется как «Выполнено», потому что пропуск не считается ошибкой",
            "Модуль не закроется как «Выполнено» в строгом режиме, а в обычном — может закрыться, но задача останется в «зоне повторения» со статусом «Пропущено»",
            "Курс автоматически удалит этот урок из навигации",
            "Пропуск отменяет результаты проверки усвоения для всего модуля"
          ],
          "answerIndex": 1,
          "explanation": "«Пропущено» — отдельный статус, не равный «Выполнено». Задача копится в «зоне повторения»; в обычном режиме модуль может закрыться по проверке усвоения даже с пропусками, а в строгом режиме — нет."
        }
      ],
      "challenge": null,
      "masteryCheck": {
        "passThreshold": 0.8,
        "questions": [
          {
            "type": "choice",
            "prompt": "Когда был утверждён стандарт C++26?",
            "options": [
              "28.03.2026, документ N5046",
              "В 2023 году, вместе с C++23",
              "Дата ещё не назначена",
              "В 2029 году"
            ],
            "answerIndex": 0
          },
          {
            "type": "choice",
            "prompt": "Какие три фичи курс называет флагманами C++26?",
            "options": [
              "Static Reflection, Contracts и std::execution",
              "Modules, Concepts и Ranges",
              "Coroutines, Modules и Ranges",
              "Pack indexing, `_` и `#embed`"
            ],
            "answerIndex": 0
          },
          {
            "type": "choice",
            "prompt": "Какая сквозная тема проходит через несколько модулей курса (в первую очередь Модуль 2)?",
            "options": [
              "Производительность",
              "Безопасность — превращение бывшего UB в ошибки компиляции",
              "Совместимость с C",
              "Сокращение времени компиляции"
            ],
            "answerIndex": 1
          },
          {
            "type": "choice",
            "prompt": "Что означает статус «Пропущено» у задачи?",
            "options": [
              "То же самое, что «Выполнено»",
              "Задача провалена окончательно и больше не доступна",
              "Задача не засчитана как выполненная, попадает в «зону повторения», но её можно закрыть позже",
              "Модуль из-за этого будет навсегда заблокирован"
            ],
            "answerIndex": 2
          },
          {
            "type": "choice",
            "prompt": "Какой порог правильных ответов нужен для прохождения проверки усвоения модуля?",
            "options": [
              "50%",
              "100%",
              "80%",
              "Порог определяется самим учеником"
            ],
            "answerIndex": 2
          }
        ]
      }
    }
  ]
}
```

- [ ] **Step 2: Validate the JSON**

Run:
```bash
node -e "JSON.parse(require('fs').readFileSync('content/modules/m0.json','utf8')); console.log('valid')"
```
Expected: `valid`

- [ ] **Step 3: Commit**

```bash
git add content/modules/m0.json
git commit -m "Add m0-l1 lesson content: Контекст C++26"
```

---

### Task 2: Mirror the lesson into `prototype/cpp26-engine.jsx`'s `COURSE_DATA`

**Files:**
- Modify: `prototype/cpp26-engine.jsx` (the `m0` entry in `COURSE_DATA.modules`, currently `"lessons": []` around line 13)

- [ ] **Step 1: Replace the empty lessons array**

In `prototype/cpp26-engine.jsx`, find the `m0` module entry:

```js
    {
      "id": "m0",
      "moduleNumber": 0,
      "title": "Контекст C++26",
      "significance": "вводный",
      "prerequisites": [],
      "lessons": []
    },
```

Replace `"lessons": []` with `"lessons": [ <lesson object> ]`, where `<lesson object>` is **byte-for-byte the same JSON object** as the single element of the `lessons` array written to `content/modules/m0.json` in Task 1, Step 1 (the object whose `"id"` is `"m0-l1"`). Copy it directly from `content/modules/m0.json` — do not retype it.

- [ ] **Step 2: Sanity-check the file still parses as valid JS**

Run:
```bash
node -e "
const m = require('fs').readFileSync('prototype/cpp26-engine.jsx','utf8').match(/const COURSE_DATA = ([\s\S]*?);\r\n\r\nconst STATUS/);
require('node:vm').runInNewContext('(' + m[1] + ')');
console.log('valid');
"
```
Expected: `valid`

Note: the file uses CRLF line endings, and `COURSE_DATA` is followed by `const STATUS = {...}` (not a function), and the object literal must be wrapped in parentheses to evaluate as an expression rather than a block statement.

- [ ] **Step 3: Commit**

```bash
git add prototype/cpp26-engine.jsx
git commit -m "Mirror m0-l1 lesson content into prototype COURSE_DATA"
```

---

### Task 3: Hide the "Примеры" section when a lesson has no examples

**Files:**
- Modify: `prototype/cpp26-engine.jsx:864-867`
- Test: `e2e/module0.spec.ts` (new)

- [ ] **Step 1: Write the failing e2e test**

Create `e2e/module0.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/index.html");
  await page.getByRole("listitem").filter({ hasText: "Контекст C++26" }).click();
});

test("m0-l1 renders theory, exercises, and mastery check without an empty Примеры section", async ({ page }) => {
  await expect(page.locator("h1")).toContainText("Контекст C++26");
  await expect(page.getByRole("heading", { name: "Примеры" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Упражнения" })).toBeVisible();
  await expect(page.locator(".card.ex")).toHaveCount(2);
  await expect(page.getByRole("heading", { name: /Проверка усвоения/ })).toBeVisible();
});

test("m1-l1 still renders its Примеры section", async ({ page }) => {
  await page.getByRole("listitem").filter({ hasText: "Pack indexing" }).click();
  await expect(page.getByRole("heading", { name: "Примеры" })).toBeVisible();
});
```

- [ ] **Step 2: Run the new test to verify the first assertion fails**

Run:
```bash
npx playwright test e2e/module0.spec.ts
```
Expected: the first test fails on `toHaveCount(0)` for the "Примеры" heading (it currently renders empty), the second test passes.

- [ ] **Step 3: Make the "Примеры" section conditional**

In `prototype/cpp26-engine.jsx`, find:

```jsx
                    <section>
                      <h2>Примеры</h2>
                      {lesson.examples.map((ex, i) => <ExampleCard key={i} ex={ex} idx={i} />)}
                    </section>
```

Replace with:

```jsx
                    {lesson.examples.length > 0 && (
                      <section>
                        <h2>Примеры</h2>
                        {lesson.examples.map((ex, i) => <ExampleCard key={i} ex={ex} idx={i} />)}
                      </section>
                    )}
```

- [ ] **Step 4: Run the e2e tests again to verify they pass**

Run:
```bash
npx playwright test
```
Expected: all tests pass, including both new tests in `e2e/module0.spec.ts`.

- [ ] **Step 5: Commit**

```bash
git add prototype/cpp26-engine.jsx e2e/module0.spec.ts
git commit -m "Hide empty Примеры section; add e2e coverage for m0-l1"
```

---

### Task 4: Update project status docs

**Files:**
- Modify: `docs/PROJECT_OVERVIEW.md` (status section)
- Modify: `CLAUDE.md` (status section)

- [ ] **Step 1: Update `docs/PROJECT_OVERVIEW.md`**

In the "Текущий статус" section, add a line noting `m0-l1` ("Контекст C++26") is written, and that Module 0 is now complete (it has exactly one lesson per this plan's design).

- [ ] **Step 2: Update `CLAUDE.md`**

In the "Current status / open calibrations" section, add the same fact: Module 0 (`m0-l1`, "Контекст C++26") is complete — an orientation lesson with no examples/challenge, all-`choice` exercises and mastery check.

- [ ] **Step 3: Commit**

```bash
git add docs/PROJECT_OVERVIEW.md CLAUDE.md
git commit -m "Update status docs: Module 0 (m0-l1) complete"
```
