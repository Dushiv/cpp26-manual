# Runnable, auto-checked "напиши сам" challenge — design

**Date:** 2026-06-07
**Status:** approved by user, ready for implementation planning

## Context

The lesson exercise model (`docs/MASTER_PLAN.md` B4, `docs/CONTENT_GUIDE.md`) has four exercise types. The first three (`predict-output`, `find-bug`, `choice`) are auto-checkable against a stored reference answer. The fourth — the **"напиши сам" challenge** (free-form code) — was deliberately *not* auto-checkable: the rationale on record is "свободный код нельзя надёжно проверить без компилятора" (CONTENT_GUIDE.md), so it ships only with a reference solution and an optional "Open in Compiler Explorer" link, and never affects progress.

That rationale no longer holds: we've proven (via `prototype/run-on-godbolt.js` and the `compiling-cpp26-examples` skill) that we can compile and execute arbitrary C++26 code through the public Compiler Explorer API — including reflection and contracts — directly from a browser, since the API replies with `Access-Control-Allow-Origin: *` (no CORS issue, no backend proxy needed).

This spec covers giving the challenge **real, immediate feedback** by running the learner's own code the same way.

## Goals / non-goals

**Goal:** the learner can run their challenge solution and see how its output compares to the reference solution's verified output — without leaving the lesson or needing a separate tool.

**Explicitly NOT goals (YAGNI — keep the locked-in exercise model intact):**
- Does **not** affect progress, mastery-check, or the "review zone." The challenge remains optional and outside the pass/fail path — this is a richer feedback mechanism, not a new gating mechanism.
- No per-challenge test-case authoring. Comparison is a single stdout match against the existing `expectedOutput`, reusing data we already produce.
- No parsing/explaining of compiler diagnostics. Raw output, shown as-is.
- No retry queue / offline fallback for this feature. It requires network — acceptable, since the user has confirmed offline-first is not a hard constraint for this part of the experience.

## Architecture

```
Browser (React component)
   │  POST source + compiler options
   ▼
godbolt.org/api/compiler/<id>/compile   (CORS-open: Access-Control-Allow-Origin: *)
   │  JSON: { code, stdout[], stderr[], execResult: { code, stdout[], stderr[] } }
   ▼
Browser: render raw output, optionally diff against stored expectedOutput
```

No backend, no build step, no proxy — the call goes straight from the learner's browser to Compiler Explorer's public API, same as `prototype/run-on-godbolt.js` does from Node. This preserves the locked-in "static PWA, no server" stack decision (`docs/PROJECT_OVERVIEW.md` B9 / "Зафиксированные решения").

## Data model change

Add a `verifiedWith` field to the lesson JSON schema (documented in `docs/CONTENT_GUIDE.md`), recording which compiler+flags produced the lesson's verified outputs:

```json
"verifiedWith": { "compilerId": "gsnapshot", "flags": "-std=c++26 -O2" }
```

- Lives at the **lesson level** (lessons are single-topic; all examples/challenges in a lesson are verified the same way).
- The learner's challenge code is compiled with this *same* `compilerId` + `flags` — apples-to-apples comparison with the stored `expectedOutput`.
- In practice this resolves to just **two** setups across the whole course (per the `compiling-cpp26-examples` skill, which has the authoritative table): `gsnapshot` with `-std=c++26 -O2` for everything, plus `-fcontracts` for Module 4 (`-std=c++26 -O2 -fcontracts` — verified live: `gsnapshot` runs `pre`/`post`/`contract_assert` correctly with this flag); and `clang_bb_p2996` with `-std=c++26 -stdlib=libc++` for Module 5's static reflection — the one feature mainline GCC/Clang trunk doesn't implement yet, so it's the only lesson family that *can't* be aligned onto `gsnapshot`.
- `m1-l1` and future lessons get this field populated as part of the normal "run examples, set `outputsVerified: true`" authoring step — no extra authoring burden.

## UI / interaction

Extends the existing `challenge` block in `prototype/cpp26-engine.jsx` (and later the real PWA):

- **Code editor**: a `<textarea>` + `<pre>`/Prism highlight overlay — consistent with the existing `CodeBlock` rendering, no new heavy editor dependency. Starts empty; the learner writes their solution from scratch per the challenge prompt.
- **"Запустить"** button: compiles + executes via the lesson's `verifiedWith` compiler/flags, shows raw `stdout`/`stderr`/exit code. No verdict — purely "here's what your code did."
- **"Сверить"** button: same run, plus a ✓/✗ badge comparing the run's `stdout` against the challenge's `expectedOutput` (taken from its `referenceSolution` — already stored). On mismatch, show both outputs side by side so the learner spots the difference themselves — consistent with the project's "разбор почему" feedback philosophy (no bare verdicts, always show the comparison).
- The existing **"Открыть в Compiler Explorer"** link is kept as a secondary option for learners who want a full IDE/godbolt experience.

## Error handling

Per the locked decision to show raw output (no diagnostic parsing — that's a whole side-quest with real risk of misrepresenting the compiler):

| Situation | What the learner sees |
|---|---|
| Compile error | Raw compiler `stderr`, no ✓/✗ badge (nothing to compare) |
| Runtime crash / non-zero exit | Raw `stdout`/`stderr` + exit code, shown plainly |
| Network failure / Compiler Explorer timeout | A **visually distinct** "не получили ответ от Compiler Explorer, попробуйте ещё раз" message — kept separate from compile/runtime errors so learners don't mistake service flakiness for a bug in their own code |

## Known constraint (not a blocker)

Compiler Explorer is a shared free public service. Fine for personal/small-scale use; if this app ever saw wider distribution, rate limits would be Compiler Explorer's call, not ours to control. Worth remembering, not worth designing around now.

## Docs to update alongside implementation

- `docs/CONTENT_GUIDE.md` — document the `verifiedWith` field in the lesson JSON schema and DoD checklist.
- `docs/MASTER_PLAN.md` (B4) — note that the challenge now offers immediate run/compare feedback, while reaffirming it stays outside the mastery/progress path.
- `docs/PROJECT_OVERVIEW.md` — the "Compiler Explorer: только опциональные ссылки" decision should be refined to say the in-app run/compare experience is also optional/non-gating (the *spirit* of that decision — "not part of the required path" — is unchanged; only the *mechanism* available to the learner grows).
