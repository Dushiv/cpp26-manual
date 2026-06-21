# Plan: Module 9 — Низкоуровневая конкурентность (3 lessons)

## Compiler status (verified 2026-06-21)

| Lesson | Feature | Compiler | Status |
|--------|---------|----------|--------|
| m9-l1 | `std::hazard_pointer` (P0566/P2530) | — | ❌ `<hazard_pointer>` not found on gsnapshot or clang_trunk |
| m9-l2 | `std::rcu` (P1122) | — | ❌ `<rcu>` not found on gsnapshot or clang_trunk |
| m9-l3 | Memory model + `<atomic>` | `gsnapshot` | ✅ `<atomic>` works — verified examples possible |

All three C++26 concurrency headers (`<hazard_pointer>`, `<rcu>`) are not yet implemented in any publicly available compiler. m9-l3 uses only `<atomic>` (C++11/C++20) which works on gsnapshot.

---

## Background prerequisites

Module 9 assumes:
- C++11 `std::thread`, `std::mutex` — learner knows these (C++14 baseline)
- C++11 `std::atomic<T>` — basic usage assumed; m9-l3 goes deeper
- Module 6 (std::execution): m9-l3 explicitly connects execution model to memory model

---

## Wave 1 (2 agents in parallel)

### m9-l1 — `std::hazard_pointer` — *средняя*

**`outputsVerified: false`**, **`challenge: null`**

> Note at top of theory: "`std::hazard_pointer` (`<hazard_pointer>`, P0566/P2530) is part of C++26 but not yet implemented by GCC or Clang. All examples are spec-based."

Theory must cover (thorough — this is medium depth):

1. **The ABA / dangling pointer problem in lock-free code**: In lock-free data structures, threads read a pointer, use it, and by the time they dereference it another thread may have deleted the object. Example: a lock-free stack where `pop()` reads `top`, then another thread pops and deletes the node, then the first thread dereferences the already-freed pointer.

2. **Why `std::shared_ptr` is not enough**: `shared_ptr` uses reference counting — but `load()` on an `atomic<shared_ptr>` still needs to atomically increment the refcount, which is itself a synchronization bottleneck under high contention. Hazard pointers are cheaper.

3. **The hazard pointer pattern** (conceptual before the API):
   - Before reading a pointer, a thread "registers" it as a hazard pointer — "I'm using this pointer, don't free it yet."
   - A reclaimer checks all registered hazard pointers before freeing — if a pointer is registered by any thread, defer the free.
   - After the thread finishes using the pointer, it clears the hazard pointer registration.
   - Guarantee: an object is never freed while any thread has it registered as hazardous.

4. **C++26 API** (spec-based):
   - `std::hazard_pointer_domain` — a domain that tracks registered hazardous objects. `std::hazard_pointer_default_domain()` returns the default global domain.
   - `std::hazard_pointer` — a guard object. One per thread per protected pointer.
   - `std::make_hazard_pointer(domain)` — returns a `hazard_pointer` guard.
   - `hp.protect(ptr)` — atomically loads from `ptr` (an `atomic<T*>`) and registers it as hazardous. Returns the loaded pointer. Must be used instead of `atomic::load()` directly.
   - `hp.reset_protection()` — clears the registration (pointer is no longer protected).
   - `std::hazard_pointer_obj_base<T, Deleter>` — base class for objects to be protected. Inherits `retire()` — schedule this object for deletion once no hazard pointers reference it.
   - `retire()` vs `delete`: `retire()` defers the actual deletion until all threads have cleared their hazard pointers to this object.

5. **Spec-based example**: a simplified lock-free stack node using hazard pointers.

6. **Performance model**: O(N) overhead per `retire()` call where N = number of threads. Much lower than `shared_ptr`'s atomic refcount under high concurrency. Best for read-heavy workloads.

7. **When to use**: lock-free queues, stacks, linked lists — anywhere you need safe reclamation without a garbage collector or reference counting.

Spec-based code examples (2, `expectedOutput: ""`):
- Example 1: reading a protected pointer safely with `hp.protect()`
- Example 2: `retire()` on `hazard_pointer_obj_base<T>`

Exercises: all `choice` or `find-bug`. 4 exercises.
Mastery: 4 `choice` questions.

---

### m9-l2 — `std::rcu` — *средняя*

**`outputsVerified: false`**, **`challenge: null`**

> Note at top of theory: "`std::rcu` (`<rcu>`, P1122) is part of C++26 but not yet implemented by GCC or Clang. All examples are spec-based."

Theory must cover:

1. **RCU (Read-Copy-Update) pattern**: A synchronization mechanism where reads are extremely cheap (no locking) and writes copy the data structure, make changes to the copy, then atomically swap. Originally from the Linux kernel.

2. **Core invariant**: No reader ever sees an object mid-update. Readers can always access a consistent snapshot. Writers don't block readers (readers don't even know a write happened).

3. **The "grace period"**: After a write swaps in a new version, the old version can't be freed immediately — existing readers may still be reading it. A "grace period" ends when all pre-swap readers have finished. Only then is the old version freed.

4. **C++26 API** (spec-based):
   - `std::rcu_obj_base<T, Deleter>` — base class for RCU-protected objects. Inherits `retire()` — schedule deletion after the next grace period.
   - `std::rcu_domain` — a domain tracking readers. `std::rcu_default_domain()` returns the global domain.
   - `std::rcu_reader` — a RAII guard that marks a thread as "in a read-side critical section." While any `rcu_reader` exists, no object that was `retire()`d before it was constructed will be freed.
   - `std::rcu_synchronize(domain)` — block until all pre-existing read-side critical sections end (wait for grace period). Callable from writers.
   - `std::rcu_retire(obj, deleter, domain)` — schedule `obj` for deletion after the next grace period (non-blocking, like retire() on rcu_obj_base).
   - `std::rcu_barrier(domain)` — wait for all pending retires to complete their deletions.

5. **Spec-based example**: a read-heavy config object updated by a writer thread using RCU.

6. **RCU vs hazard pointers**:
   | | `hazard_pointer` | `rcu` |
   |---|---|---|
   | Reader cost | O(1) per pointer | O(1) (enter/exit section) |
   | Reclamation | Per-object, immediate after all HPs clear | Per-domain, after grace period |
   | Memory overhead | O(threads × pointers per thread) | O(threads) |
   | Best for | Protecting individual pointers | Protecting whole data structure snapshots |

7. **Connection to Linux kernel RCU**: C++26's `rcu` is modeled on kernel RCU but with C++ memory model guarantees.

Spec-based code examples (2, `expectedOutput: ""`):
- Example 1: `rcu_reader` guard + reading protected data
- Example 2: writer path with `retire()` and `rcu_synchronize()`

Exercises: all `choice` or `find-bug`. 4 exercises.
Mastery: 4 `choice` questions.

---

## Wave 2 (1 agent)

### m9-l3 — Модель памяти и связь с модулем 6 — *мелкая*

**Header**: `#include <atomic>` (C++20, verified on gsnapshot)  
**Compiler**: `gsnapshot`, flags `-std=c++26 -O2`  
**`outputsVerified: true`** — `<atomic>` examples compile fine.  
**`challenge`**: include (small `<atomic>` example).

This is a conceptual integration lesson — it ties together the memory model (from C++11/20), hazard pointers and RCU (Module 9), and the async execution model (Module 6).

Theory must cover:

1. **Quick recap of the C++ memory model** (C++11 baseline):
   - Sequential consistency (`memory_order_seq_cst`) — strongest, every atomic operation has a total global order. Safe but potentially expensive.
   - Acquire/Release (`memory_order_acquire` / `memory_order_release`) — establish happens-before between threads without total order. The classic pattern: writer does `store(release)`, reader does `load(acquire)` — guaranteed to see the writer's prior stores.
   - Relaxed (`memory_order_relaxed`) — no synchronization, just atomicity. Use only when you don't need cross-thread visibility (e.g. per-thread counters).
   - `std::atomic_thread_fence(order)` — a standalone fence that can order non-atomic operations.

2. **How hazard pointers use the memory model** (connecting m9-l1):
   - `hp.protect(ptr)` internally does an acquire load + a release store of the hazard pointer register. This ensures that if the reclaimer doesn't see the HP registration, the reader will see the reclaimer's "please stop" signal.
   - The publish/subscribe pattern: the writer stores the new pointer with `release`; readers load with `acquire` — this guarantees readers see all data the writer wrote before the store.

3. **How RCU uses the memory model** (connecting m9-l2):
   - `rcu_reader` construction/destruction must be sequenced correctly to establish a grace period boundary.
   - The grace period check uses fences to ensure reads inside the critical section can't be reordered outside it.

4. **Connection to `std::execution` (Module 6)**:
   - Senders/receivers don't interact with raw atomic operations directly, but the completion channels (value/error/stopped) respect the C++ memory model — completions happen-before the next operation in the pipeline.
   - When a scheduler moves work to another thread, it ensures acquire/release fencing implicitly.
   - Rule: within a sender pipeline, you don't need manual atomics — the scheduler provides the synchronization. Outside sender pipelines (e.g. in shared state), you still need `std::atomic`.

5. **Practical advice**: When to use each tool:
   - `std::mutex` — when correctness is more important than performance, or the critical section is long
   - `std::atomic` with acquire/release — for simple flags, one-time initialization, producer/consumer handoff
   - Hazard pointers — for lock-free pointer-based structures needing safe reclamation
   - RCU — for read-heavy data structures where reads must never block
   - `std::execution` — for composable async pipelines where you don't want manual synchronization at all

Compileable examples using `<atomic>`:
- Example 1 (basic): acquire/release store/load pattern showing happens-before
- Example 2 (advanced): `atomic_thread_fence` + relaxed ops

Exercises: 3, with at least 1 predict-output (from `<atomic>` code).
Mastery: 3 `choice` questions.

---

## Launch order

```
Launch agents: m9-l1, m9-l2  (parallel, Wave 1)
  ↓ wait for both
Launch agent: m9-l3  (Wave 2)
  ↓ wait
Merge temp files → m9.json (both locales), parity check, e2e (update stub → m10-l1), commit+push
```

---

## Field name discipline (mandatory)
- Mastery questions: `"type": "choice"`, `"prompt"`, `"answerIndex"`, NO `"id"` field
- Choice exercises: `"prompt"` + `"answerIndex"`
- find-bug: `"code"` + `"answerLine"` + `"explanation"`
- predict-output: `"code"` + `"expectedOutput"`
- m9-l1, m9-l2: `"background": null`, `"outputsVerified": false`, `"challenge": null`
- m9-l3: `"background": null`, `"outputsVerified": true`, include `"challenge"`

## Risks
- **Both m9-l1 and m9-l2 are theory-only**: No `predict-output` exercises. All `choice`/`find-bug`. No challenge. Clearly mark examples as spec-based.
- **m9-l3 is small**: 2 examples, 3 exercises, 3 mastery questions. Don't pad.
- **Complexity**: Hazard pointers and RCU are genuinely hard. Theory must be very precise about the ordering guarantees. No hand-waving.
- **m9-l3 memory model**: `<atomic>` output can be non-deterministic in multithreaded code. Only use single-threaded `<atomic>` examples for predict-output to avoid flaky expected outputs.
