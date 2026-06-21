# Plan: Module 7 — Новые контейнеры и типы (3 lessons)

## Compiler status (verified 2026-06-21)

| Lesson | Feature | Compiler | Flags | Status |
|--------|---------|----------|-------|--------|
| m7-l1 | `std::inplace_vector` (P0843R10) | `gsnapshot` | `-std=c++26 -O2` | ✅ compiles, `outputsVerified: true` |
| m7-l2 | `std::hive` (P0447) | — | — | ❌ not implemented anywhere — theory-only |
| m7-l3 | `std::text_encoding` (P1885R4) | `gsnapshot` | `-std=c++26 -O2` | ✅ compiles, `outputsVerified: true` |

Probe results:
- `std::inplace_vector`: `#include <inplace_vector>` compiles on gsnapshot, `v.push_back(1); v.size()` → `2` ✅
- `std::hive`: `#include <hive>` → fatal error on both `gsnapshot` and `clang_trunk` ❌
- `std::text_encoding`: `#include <text_encoding>`, `std::text_encoding::literal().name()` → `"UTF-8"` ✅

---

## Background prerequisites

Learners have C++14 + C++17. No significant C++20/23 prerequisites for Module 7 — these are library additions.

- **m7-l1**: No prerequisites. Pure C++26 addition.
- **m7-l2**: No prerequisites. (P0447 is a post-C++26 proposal; warn the learner that this feature was proposed for C++26 but not yet standardized/implemented — cover the design and expected API.)
- **m7-l3**: No prerequisites. Mention Unicode briefly as needed.

---

## Wave 1 (2 agents in parallel)

### m7-l1 — `std::inplace_vector` — *средняя*

**Header**: `#include <inplace_vector>`  
**Compiler**: `gsnapshot`, flags `-std=c++26 -O2`  
**`outputsVerified: true`** — compile all examples before writing `expectedOutput`.

Theory must cover:
- Motivation: `std::vector` always heap-allocates; sometimes you know the max size at compile time (embedded, hot loops, stack-local buffers) and want no allocation
- `std::inplace_vector<T, N>`: vector with compile-time capacity `N`, stored inline (no heap)
- Key difference from `std::array<T, N>`: `inplace_vector` has dynamic size (`.size()` ≤ N); `array` has fixed size == N
- Construction: default (empty), initializer_list, range
- `push_back(v)` / `emplace_back(...)` — throws `std::bad_alloc` if full; `try_push_back` returns `nullptr` on overflow
- `resize(n)` / `resize(n, val)` — throws if n > N
- Iterators: same as `std::vector` (contiguous)
- `capacity()` always == N; `max_size()` == N
- Exception safety: same as `std::vector` element operations
- `std::is_trivially_relocatable` (C++26): `inplace_vector` is trivially relocatable if T is
- Use cases: fixed-size buffers, parser token lists, SIMD batches, embedded systems
- Contrast table: `inplace_vector` vs `array` vs `vector` vs `std::span`

Examples to verify and record:
1. Basic usage — push_back, size, iteration
2. `try_push_back` / overflow handling
3. Comparison with `std::array` showing dynamic size

Exercises:
- Basic `predict-output` (size after a sequence of push_back/pop_back)
- Basic `choice` (what happens when push_back exceeds N)
- Advanced `find-bug` (using capacity() thinking it's current size, or resizing beyond N)
- Advanced `predict-output` (try_push_back return value)

Mastery check: 3–4 `choice` questions on behavior, exception policy, and contrast with array/vector.

---

### m7-l2 — `std::hive` — *средняя*

**Compiler**: ❌ NO compiler support anywhere (P0447 not yet merged into any trunk as of 2026-06-21).  
**`outputsVerified: false`** — all examples are spec-based. No `predict-output` exercises. No `challenge`. Set `"challenge": null`.

IMPORTANT NOTE FOR LEARNER (include in motivation/theory):
> `std::hive` is proposed for C++26 via P0447 but has not yet been implemented by GCC or Clang. All examples below show the expected API per the proposal — they cannot yet be compiled on any publicly available compiler.

Theory must cover:
- Motivation: `std::list` has O(1) insert/erase and stable references but terrible cache performance (pointer-chasing). `std::vector` is cache-friendly but references/pointers invalidate on insert. `std::hive` aims to give both: cache-friendly storage blocks + stable references + O(1) insert/erase anywhere.
- Core property: **pointer stability** — existing elements' addresses never change on insert/erase
- Internal structure: segmented array of fixed-size blocks; erased slots marked with a "skipfield" bitmask; active elements packed via skipfield traversal
- API: `insert(v)`, `emplace(...)`, `erase(it)` — all O(1) amortized
- Iteration: forward-only (skips erased slots); roughly cache-friendly per block
- No `push_back` / `operator[]` — not a sequence container, not random-access
- `std::hive::iterator` → pointer stability guarantee (unlike `std::vector`)
- `capacity()`, `block_capacity_limits()` — tuning the block size
- When to use: particle systems, ECS (entity-component-system), object pools — scenarios with frequent mid-sequence insert/delete and pointer stability needed
- Contrast table: `hive` vs `list` vs `vector` vs `deque`

Exercises: all `choice` or `find-bug` (no `predict-output` since nothing compiles):
- Basic `choice`: which operations are O(1) for hive
- Basic `choice`: which property hive guarantees that vector does not
- Advanced `find-bug`: code that uses `erase` and then dereferences an iterator to a different element (this is safe — find the actual bug which is assuming pointer invalidation)
- Advanced `choice`: when would you choose hive over list

Mastery check: 3–4 `choice` questions on hive properties.

---

## Wave 2 (1 agent)

### m7-l3 — `std::text_encoding` — *мелкая*

**Header**: `#include <text_encoding>`  
**Compiler**: `gsnapshot`, flags `-std=c++26 -O2`  
**`outputsVerified: true`** — compile all examples.

Theory must cover:
- Motivation: C++ lacked a standard way to identify/query the current character encoding. `char`-based APIs depend on locale; `wchar_t` is platform-specific. P1885 adds a proper type to name and query encodings.
- `std::text_encoding` — a class representing a character encoding (wraps an IANA charset name)
- Key static factories:
  - `std::text_encoding::literal()` — encoding of narrow string literals (UTF-8 on most modern platforms)
  - `std::text_encoding::environment()` — current locale's encoding
  - `std::text_encoding::utf8()` — the UTF-8 sentinel
- `std::text_encoding::id` — enum of well-known encodings (IANA codes): `id::UTF_8`, `id::ISO_8859_1`, etc.
- Methods: `.name()` (IANA name string), `.mib()` (IANA MIBenum), comparison with `operator==`
- `std::text_encoding::aliases_contains(str)` — check if a string is a valid alias for this encoding
- Relationship with `std::locale` and char8_t string literals (`u8"..."`)
- `char8_t` is always UTF-8; `char` is `literal()` encoding — they may differ on Windows

Examples to verify:
1. Print `literal()` and `environment()` encoding names
2. Compare literal encoding to `utf8()` sentinel
3. Check `mib()` value

Exercises:
- Basic `predict-output` (on a UTF-8 platform: what does `text_encoding::literal().name()` print)
- Basic `choice` (what `environment()` returns vs `literal()`)
- Advanced `find-bug` (code that assumes `literal() == environment()` — they can differ on Windows with legacy code page)

Mastery check: 3 `choice` questions.

---

## Launch order

```
Launch agents: m7-l1, m7-l2  (parallel, Wave 1)
  ↓ wait for both
Launch agent: m7-l3  (Wave 2)
  ↓ wait
Merge temp files → m7.json (both locales), parity check, e2e (update stub → m8-l1), commit+push
```

---

## Merge instructions

After all agents complete:

1. Read `prototype/.tmp-m7-l1-ru.json`, `.tmp-m7-l1-en.json`, `.tmp-m7-l2-ru.json`, `.tmp-m7-l2-en.json`, `.tmp-m7-l3-ru.json`, `.tmp-m7-l3-en.json`
2. Build `content/modules/ru/m7.json`:
   ```json
   { "id": "m7", "moduleNumber": 7, "title": "Новые контейнеры и типы",
     "significance": "важный", "prerequisites": [],
     "lessons": [ <l1>, <l2>, <l3> ] }
   ```
3. Build `content/modules/en/m7.json` analogously with English title "New containers and types"
4. Run `node prototype/check-i18n-parity.js` — must be 0 errors
5. Update e2e stub selector: find the first stub lesson in m8.json (m8-l1 = `std::simd`) and update `e2e/lesson.spec.ts` `"std::inplace_vector"` → `"std::simd"`; also update the m8.json files to add the stub entry
6. Run Playwright: `npx playwright test --reporter=line` — must be 10/10
7. Delete all `.tmp-m7-*.json` temp files
8. Commit: `git add content/modules e2e/content && git commit -m "Add Module 7 content (3 lessons) and m8-l1 stub"`
9. Push

---

## Risks

- **m7-l2 (`std::hive`) is theory-only**: P0447 has no compiler implementation as of 2026-06-21. Write the lesson as if it's coming — the design is well-documented in the proposal. All exercises must be `choice`/`find-bug`; no `predict-output`; no `challenge`; `outputsVerified: false`.
- **m7-l3 is small**: Only 3 exercises + 3 mastery questions. Don't pad; depth-per-feature-size rule says "small = 1 screen + 2 examples + 2-3 exercises."
- **predict-output platform dependency**: `text_encoding::literal().name()` always returns `"UTF-8"` on Godbolt (Linux). Learner exercises should note "(on a UTF-8 platform)" to avoid confusion.
- **Field name discipline** (learned from m6): mastery questions must have `"type": "choice"`, use `"prompt"` not `"question"`, `"answerIndex"` not `"correctIndex"`, NO `"id"` field in mastery questions.
