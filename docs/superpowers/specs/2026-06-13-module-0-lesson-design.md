# Module 0 lesson design: "Контекст C++26"

## Context

Module 0 ("Контекст C++26", вводный) is currently an empty stub (`lessons: []`)
in both `content/modules/m0.json` (does not exist yet) and the inline
`COURSE_DATA` in `prototype/cpp26-engine.jsx`. Per `MASTER_PLAN.md` Part A, its
scope is orientation, not a C++ feature: history/status of C++26, the three
flagship features, the cross-cutting safety theme, and how the course itself
works (module map, lesson anatomy, skip/review-zone, mastery-gating).

## Decisions

- **One lesson**, `m0-l1`, covering the full module-0 scope from
  `MASTER_PLAN.md` in theory sections — not split into multiple lessons.
- **No `examples`** (`examples: []`) and **no `challenge`** (`null`) — there is
  no C++ code to run or verify; this lesson is conceptual/orientation only.
  `verifiedWith` is omitted for the same reason.
- **All `exercises` and `masteryCheck` questions are `choice`-type**, testing
  recall/orientation on the theory just read (e.g. "which of these is a C++26
  flagship feature", "what does the 'Пропущено' status mean").
- `background: null` (no C++20/23 prerequisite dependency for orientation
  content).

## Lesson content outline

- `motivation`: why orientation matters before diving into features —
  understanding the module map, the three flagships, and how skip/mastery
  mechanics work helps the learner allocate effort and know what "done" means.
- `theory` (markdown, multiple sections):
  1. What the C++ standard is and how it evolves (brief, no deep history).
  2. C++26 status: approved by ISO 28.03.2026, edition N5046.
  3. The three flagships — Static Reflection, Contracts, `std::execution` —
     one paragraph each, conceptual, no code.
  4. The cross-cutting safety theme (teaser for Module 2).
  5. How the course works: module map (0–10), lesson anatomy, "Пропущено"
     status / review zone, mastery-gating.
- `exercises`: 2 `choice` questions (1 basic + 1 advanced) on the material
  above.
- `masteryCheck`: ~4–5 `choice` questions (pass threshold 0.8) covering C++26
  status, the three flagships, the safety theme, and skip/mastery mechanics.

## Engine change

`prototype/cpp26-engine.jsx` currently always renders:

```jsx
<section>
  <h2>Примеры</h2>
  {lesson.examples.map((ex, i) => <ExampleCard key={i} ex={ex} idx={i} />)}
</section>
```

This produces an empty "Примеры" heading with nothing under it when
`examples` is `[]`. Wrap the section in `lesson.examples.length > 0 && (...)`
so it's omitted entirely for lessons with no examples (m0-l1, and any future
lesson of this kind).

## Out of scope

- Content language calibration beyond what `m1-l1` already established
  (Russian) — not revisited here.
- Updating `content/modules/m0.json` to be loaded by the engine instead of
  duplicated inline (existing known divergence, tracked separately).
