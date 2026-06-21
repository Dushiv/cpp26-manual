# Plan: Module 6 — std::execution / Senders-Receivers (6 lessons)

## Technical constants

| | |
|---|---|
| **Compiler (primary)** | `gsnapshot` — GCC trunk; probe first with `#include <execution>` and `-std=c++26 -O2` |
| **Fallback** | `clang_trunk` — if gsnapshot lacks P2300 support |
| **Discovery step** | Every Wave 1 agent MUST probe the compiler first by compiling a minimal `std::execution::just` + `sync_wait` snippet before writing any theory |
| **Header** | `#include <execution>` (C++26 adds senders/receivers to the existing header) |
| **Namespace** | `std::execution::just`, `std::execution::then`, `std::execution::sync_wait`, etc. |
| **Probe snippet** | See below |

### Compiler discovery probe (run this before writing any lesson content)

```cpp
#include <execution>
#include <print>
int main() {
    auto result = std::execution::sync_wait(std::execution::just(42));
    std::println("{}", std::get<0>(*result));
}
```

Run: `node prototype/run-on-godbolt.js gsnapshot prototype/.tmp-probe.cpp "-std=c++26 -O2"`

- If exit 0 → use `gsnapshot` with `-std=c++26 -O2`; include `predict-output` exercises
- If compile error → try `clang_trunk` with `-std=c++26`
- If both fail → **write the full lesson anyway** with theory + choice/find-bug exercises; set `outputsVerified: false` and `"challenge": null`; note in theory that examples are spec-based but not yet runnable on any available compiler

---

## Background prerequisites (include in every lesson)

Learners have C++14 + C++17. The following C++20/C++23 concepts are load-bearing for Module 6:

- **C++20 Concepts**: used in `std::execution` constraints; background callout needed if referenced
- **C++20 Coroutines** (brief): mentioned as contrast; the lesson should compare sender pipelines to coroutine chains WITHOUT teaching coroutines (external link only)
- **C++23 `std::expected`**: used in error channel; background callout if referenced
- **C++20 stop tokens (`std::stop_source`/`std::stop_token`)**: needed for m6-l5

---

## Wave 1 (2 agents in parallel)

### m6-l1 — Концепции: sender, receiver, operation_state — *средняя*

Core mental model lesson. Must be written BEFORE the rest in spirit (other agents may write their lessons independently, but conceptually they depend on this).

Theory must cover:
- Why `std::async`/raw threads are broken: hidden allocations, exception-safety gaps, composition is hard
- The three core abstractions: **sender** (a description of work), **receiver** (what to do with result/error/cancellation), **operation_state** (the in-flight work)
- The three completion channels: value, error, done (cancellation)
- How `connect(sender, receiver)` creates `operation_state`; how `start(op)` launches it
- Why senders are lazy: nothing happens until `start()`
- Key invariant: `operation_state` never allocates on the heap (the whole point)
- Contrast: `std::future`/`std::async` (eager, allocate, exception-only error) vs senders (lazy, zero-alloc, three channels)
- DO NOT try to show working code for connect/receiver directly — too low-level; that's what `sync_wait`/`just` in l2 are for. Use conceptual diagrams in theory, then defer to l2 for actual runnable code.

Exercises: all `choice` (conceptual), since the raw connect/receiver API is not user-facing.

### m6-l2 — `just`, `sync_wait`, первые конвейеры — *средняя*

First runnable code lesson.

Theory must cover:
- `std::execution::just(v)` — sender that completes with value `v`
- `std::execution::sync_wait(s)` — blocking adapter; runs sender on current thread, returns `std::optional<value_tuple>`
- The pipe operator `|`: `sender | adaptor` is sugar for `adaptor(sender)` — show both forms
- Why `sync_wait` returns `optional`: cancellation → `nullopt`, value → `optional<tuple<...>>`
- First pipeline: `just(1) | then([](int x){ return x * 2; })` (preview of l3's `then`)
- `std::execution::just_error(e)` — sender that immediately errors
- `std::execution::just_stopped()` — sender that immediately cancels

---

## Wave 2 (2 agents in parallel) — after wave 1

### m6-l3 — `then` и планировщики — *средняя*

Theory must cover:
- `std::execution::then(sender, fn)` — transform the value channel; fn's return becomes the new value
- `std::execution::upon_error(sender, fn)` — handle error channel
- `std::execution::upon_stopped(sender, fn)` — handle done channel
- **Schedulers**: `std::execution::scheduler` concept; what a scheduler is (a factory for senders that run work on a specific execution context)
- `std::execution::schedule(sch)` — sender that, when started, transfers execution to the scheduler
- `std::execution::transfer(sender, sch)` — move to a scheduler mid-pipeline
- Standard schedulers: `std::execution::thread_pool::scheduler` (if available)
- Pipeline mental model: source → transforms → sink

### m6-l4 — `when_all` и пул потоков — *средняя*

Theory must cover:
- `std::execution::when_all(s1, s2, ...)` — parallel fan-out; completes when ALL complete; value is tuple of results
- Cancellation semantics of `when_all`: if one errors/cancels, all others get stop_requested
- `std::execution::thread_pool` — the standard thread pool; get a scheduler from it
- Example: two parallel computations → `when_all` → combine results
- Why no hidden allocation: `when_all` stores operation_states in its own state
- `std::execution::split(s)` — makes a multi-subscriber sender (one sender, many receivers)

---

## Wave 3 (2 agents in parallel) — after waves 1+2

### m6-l5 — Обработка ошибок и отмена — *средняя*

Theory must cover:
- The error channel: any type (not just `std::exception_ptr`) — error type is part of sender's type
- `std::execution::upon_error(s, fn)` — recover from error
- `std::execution::let_error(s, fn)` — fn returns a new sender (chaining on error)
- **Stop tokens**: `std::stop_source` / `std::stop_token` (C++20 — background callout)
- How cancellation propagates: receiver's `get_stop_token()` → senders check it
- `std::execution::stop_when(s, stop_token)` — cancel s when token fires
- Why three channels beat exception-only: errors are typed, cancellation is explicit, no overhead when unused
- Contrast with `std::future`: futures only have value/exception, no cancellation

### m6-l6 — `let_value`/`let_error`; гарантии; сравнение с async/threads — *продвинутый*

Advanced composition + design rationale.

Theory must cover:
- `std::execution::let_value(s, fn)` — fn receives values and returns a new sender; enables dependent chaining
- `std::execution::let_error(s, fn)` — same on error channel
- `std::execution::let_stopped(s, fn)` — same on done channel
- Why `let_*` is necessary when `then` isn't enough (fn returns a sender, not a value)
- The zero-hidden-allocation guarantee: how the type system encodes all storage in `operation_state`
- Why `std::async` can't give this guarantee (type erasure → heap alloc)
- Comparison table: `std::async` / raw threads / coroutines / senders — when to use each
- **Ongoing controversy** (like m4-l6 for contracts): P2300 is complex; some argue coroutines are simpler; what senders buy you

---

## Launch order

```
Launch agents: m6-l1, m6-l2  (parallel)
  ↓ wait for both
Launch agents: m6-l3, m6-l4  (parallel)
  ↓ wait for both
Launch agents: m6-l5, m6-l6  (parallel)
  ↓ wait for both
Merge temp files → m6.json, parity check, e2e (update stub to m7-l1), commit+push
```

---

## Risks

- **Compiler support unknown**: P2300 (`std::execution`) may have partial or no implementation in `gsnapshot` as of June 2026. Every Wave 1 agent must probe first. **If nothing compiles: write full theory anyway + choice/find-bug exercises only; no predict-output; set `outputsVerified: false`. Do NOT block on compiler — the theory is the primary deliverable for this module.**
- **Mental model complexity**: Senders/receivers is the hardest mental model in C++26. Theory must be extremely clear; agents should draw ASCII pipeline diagrams in the theory markdown.
- **m6-l1 is foundational**: If m6-l1's theory has errors, m6-l2 through m6-l6 inherit them. m6-l1 agent should be given the most thorough review.
- **m6-l6 (advanced)**: Strictly last; depends on l1–l5 being correct. If the session limit is hit, this is the one to re-launch.
- **Background callouts needed**: C++20 stop tokens (m6-l5), C++23 `std::expected` (m6-l5/l6), C++20 coroutines (m6-l6 comparison). Agents must add `background` callouts where these appear.
