# Spec: C++23 Course — Multi-Course Engine

**Date:** 2026-07-18
**Status:** approved

---

## Goal

Add a C++23 course (30 lessons, 11 modules) to the existing C++26 learning app. The engine becomes a multi-course platform; a course picker landing screen lets learners choose which standard to study. C++20 is reserved as a future course.

---

## Architecture

### Content directory restructure

```
content/
  courses/
    cpp26/
      ru/  m0.json … m10.json   ← moved from content/modules/ru/
      en/  m0.json … m10.json   ← moved from content/modules/en/
    cpp23/
      ru/  m0.json … m10.json   ← 11 new files (stubs → content over time)
      en/  m0.json … m10.json   ← 11 new files
```

The old `content/modules/` directory is deleted after the move.

### Engine changes (`cpp26-engine.jsx`)

**State**
- New top-level state: `courseId` (string: `"cpp26"` | `"cpp23"` | `"cpp20"` | `null`).
- Persisted in localStorage under key `"active-course"`.
- **First-launch logic** (in order):
  1. If `"active-course"` exists in localStorage → use it (returning user, go straight to course).
  2. Else if `"cpp26-progress"` exists in localStorage → set `"active-course"` to `"cpp26"` (existing user before the update, skip picker).
  3. Else → `courseId = null` → show CoursePicker (new user).

**Content loading**
- `fetch()` path changes from `../content/modules/${locale}/${id}.json` to `../content/courses/${courseId}/${locale}/${id}.json`.
- `MODULE_IDS` becomes a per-course map:
  ```js
  const MODULE_IDS = {
    cpp26: ["m0","m1","m2","m3","m4","m5","m6","m7","m8","m9","m10"],
    cpp23: ["m0","m1","m2","m3","m4","m5","m6","m7","m8","m9","m10"],
  };
  ```

**Progress isolation**
- `PROGRESS_KEY` changes from the hardcoded `"cpp26-progress"` to `"${courseId}-progress"`.
- C++26 key stays `"cpp26-progress"` → existing progress survives unchanged.
- C++23 key is `"cpp23-progress"` → starts empty.

**Supabase `progress` table**
- Add column `course_id TEXT NOT NULL DEFAULT 'cpp26'`.
- On first pull after deploy: existing rows without `course_id` are treated as `'cpp26'` (the DEFAULT handles this automatically).
- `pullProgress` and `pushProgress` filter by `user_id` AND `course_id`.

**New screen: `CoursePicker`**
- Rendered when `courseId` is null (first visit) or user clicks `← Все курсы`.
- Shows cards for C++20 (disabled, "скоро"), C++23, C++26.
- Each active card shows: name, tagline (key features), lesson count, progress bar from localStorage.
- Clicking a card sets `courseId` in state + localStorage and loads the course.

**Header change**
- Add `← Все курсы` link at the far left of the header.
- Clicking it sets `courseId` to null in state and removes `"active-course"` from localStorage → renders CoursePicker. Does not touch progress keys.
- Layout: `[ ← Все курсы ]  <course title>   RU | EN   👤`

### Infrastructure

**`check-i18n-parity.js`**
- Parameterise by `courseId`: compare `content/courses/${courseId}/ru/` vs `content/courses/${courseId}/en/`.
- Run for each course independently.

**e2e tests (`e2e/`)**
- Add a `beforeEach` (or fixture) that selects a course on the picker screen before navigating to lessons.
- Existing tests target C++26; new tests for C++23 mirror the structure with different module IDs.

---

## C++23 Content Plan

### Module map

| # | Module | Lessons | Priority |
|---|--------|---------|----------|
| 0 | Контекст C++23 | 1 | 1st — no code, choice-only |
| 1 | Языковые улучшения | 5 | 6th |
| 2 | Deducing this | 3 | 2nd — flagship |
| 3 | std::expected | 2 | 3rd — flagship |
| 4 | Ranges C++23 | 4 | 5th |
| 5 | std::mdspan | 2 | 7th |
| 6 | Форматирование / std::print | 2 | 4th — needed for examples |
| 7 | Новые контейнеры и утилиты | 4 | 8th |
| 8 | std::generator | 2 | 9th — flagship |
| 9 | Числа и low-level | 3 | 10th |
| 10 | Удалённое, итог | 2 | 11th |

**Total: 30 lessons.** Full per-lesson breakdown in `docs/cpp23-course-plan.md`.

### Stub files (Phase 1)

22 JSON files created immediately (11 ru + 11 en). Each is a valid module JSON with all lessons marked `"stub": true`. The engine already renders stubs as "this lesson isn't written yet".

### Content authoring (Phase 2)

- Tool: `compiling-cpp26-examples` skill for verified `expectedOutput`.
- Compiler: `g132` (`-std=c++23 -O2`) for most lessons; `g132 -fcoroutines` for module 8.
- Authoring order follows the priority column above.
- Each lesson must pass the Definition-of-Done checklist from `docs/CONTENT_GUIDE.md`.

---

## Progress preservation

| Storage | What happens |
|---------|-------------|
| localStorage `cpp26-progress` | Unchanged — key is identical under new scheme |
| localStorage `cpp23-progress` | New key, starts empty |
| localStorage `active-course` | New key, default `"cpp26"` on first visit |
| Supabase `progress.course_id` | Column added with `DEFAULT 'cpp26'`; existing rows auto-assigned |

No data migration script needed for localStorage. One SQL migration for Supabase.

---

## Task Breakdown

### Phase 1 — Infrastructure

1. **Move content**: rename `content/modules/` → `content/courses/cpp26/`
2. **Engine — courseId + fetch paths**: add `courseId` state, update `loadCourseData`, update `PROGRESS_KEY`, update `MODULE_IDS`
3. **Engine — CoursePicker screen**: new component, course cards with progress bars
4. **Engine — header link**: add `← Все курсы` link
5. **Create C++23 stubs**: 22 stub JSON files (`content/courses/cpp23/ru/m0…m10.json` + en)
6. **Supabase migration**: `ALTER TABLE progress ADD COLUMN course_id TEXT NOT NULL DEFAULT 'cpp26'`; update `pullProgress`/`pushProgress`
7. **Update `check-i18n-parity.js`**: parameterise by courseId
8. **Update e2e tests**: add course-picker step

### Phase 2 — C++23 Content (30 lessons, ordered by priority)

9. m0-l1 — Контекст C++23
10. m2-l1, m2-l2, m2-l3 — Deducing this
11. m3-l1, m3-l2 — std::expected
12. m6-l1, m6-l2 — std::print / std::format
13. m4-l1 … m4-l4 — Ranges C++23
14. m1-l1 … m1-l5 — Языковые улучшения
15. m5-l1, m5-l2 — std::mdspan
16. m7-l1 … m7-l4 — Контейнеры и утилиты
17. m8-l1, m8-l2 — std::generator
18. m9-l1 … m9-l3 — Числа и low-level
19. m10-l1, m10-l2 — Удалённое, итог
