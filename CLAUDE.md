# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A learning app for the **C++26 standard** ("C++26: от нуля до полного понимания"). The app acts as a *teacher*: the learner works through modules, reads theory with examples, solves auto-checked exercises, and is expected to genuinely understand each topic by the end — not just tick off a checklist.

The project is currently in the **content-design stage**: no build tooling or app skeleton exists yet beyond a single prototype React component. Most of the repo is planning docs and lesson content authored as data. Read `docs/PROJECT_OVERVIEW.md` first — it is the project's entry point and points to the other docs.

## Repo layout

- `docs/` — planning & authoring guides (the "how and why"):
  - `PROJECT_OVERVIEW.md` — entry point; what's being built, decisions already locked in, current status, open calibrations.
  - `MASTER_PLAN.md` — source of truth for the learning roadmap (module map, per-module content scope) and the implementation plan (content model, exercise system, mastery-gating, persistence, tech stack rationale).
  - `CONTENT_GUIDE.md` — rules for writing lessons: principles, depth calibration by feature size, the lesson JSON schema, and the Definition-of-Done checklist.
  - `LESSON_TEMPLATE.md` — empty prose skeleton for drafting a lesson before converting it to JSON.
- `content/modules/` — actual lesson content as data, one JSON file per module per locale: `content/modules/ru/mN.json` and `content/modules/en/mN.json`, both authored in the schema defined by `CONTENT_GUIDE.md`. This is what the engine renders (via `fetch()` per the active locale) and what content work mostly produces/edits. `prototype/check-i18n-parity.js` verifies the two locale trees stay structurally in sync.
- `prototype/` — the throwaway/iteration-stage app code:
  - `cpp26-engine.jsx` — prototype React component (rendering engine) used to iterate on lesson format/navigation/progress in-chat before the real PWA is built. It loads lesson content at runtime via `fetch()` from `content/modules/<locale>/*.json` — there is no inline copy of course data.
  - `check-i18n-parity.js` — Node script verifying `content/modules/ru/` and `content/modules/en/` stay structurally in sync.

All project docs are written in Russian; lesson content language is one of the open calibrations (see below).

## Locked-in decisions (do not revisit without explicit reason)

These come from `docs/PROJECT_OVERVIEW.md` §"Зафиксированные решения" — treat them as constraints, not suggestions:

- **Stack:** web app packaged as a **PWA** — React + Prism.js/highlight.js for code highlighting, no build tools required (React via CDN is acceptable). Runs in desktop browsers and installs to the Android home screen (offline, local storage).
- **Content is data.** Lessons live as structured JSON, separate from app code. The shell is a small "engine"; content is written and reviewed independently (see `prototype/cpp26-engine.jsx` + `content/modules/ru/m1.json` for the current split).
- **Learner baseline:** confident C++14 + knowledge of C++17. Anything below that is *not* explained (external link only). Background callouts cover **only** the C++17 → C++26 gap, and only what's load-bearing for the specific C++26 feature being taught.
- **Self-contained — nothing compiles.** The learner is not on a real machine and never compiles code. All example output is pre-verified by *us* once during content prep (Compiler Explorer / a real compiler) and stored as the expected reference; the learner checks their answer against it.
- **Exercise model:** auto-checkable types (`predict-output`, `find-bug`, `choice`) count toward progress; free-form "write it yourself" is an optional challenge with a reference solution + Compiler Explorer link and does *not* affect completion.
- **Skipping is allowed**: a skipped item gets status `Пропущено` (≠ `Выполнено`), accumulates in a "review zone", and the module surfaces "N skipped". An optional "strict mode" exists.
- **Mastery-gating:** a module closes only after passing its mastery check (draft threshold 80%, unconfirmed), built solely from auto-checkable exercises.
- **Compiler Explorer** is only ever an optional "try it live" link — never part of the required path.

## Content model & lesson anatomy

```
Course → Module (0..10) → Lesson
  ├── Background/prerequisites (optional, collapsible — C++20/23 callouts only)
  ├── Motivation (what pain the feature solves)
  ├── Theory (exhaustive explanation)
  ├── Examples (basic + advanced, each with a verified expectedOutput)
  ├── Exercises (basic + advanced; types: predict-output | find-bug | choice)
  └── Mastery check (auto-checkable questions only, pass threshold 0.8)
```

A lesson is considered incomplete without an advanced example or a mastery check. The "Background" block appears only when the lesson has C++20/23 prerequisite tags, and is collapsed by default.

The canonical JSON schema for a lesson (with all fields) is in `docs/CONTENT_GUIDE.md`; `content/modules/ru/m1.json` (and its `content/modules/en/m1.json` counterpart) show a filled-in real example (`m1-l1`, "Pack indexing"). Modules/lessons not yet written are present as stubs (`"stub": true` or empty `"lessons": []`).

## Authoring a lesson — workflow

From `docs/CONTENT_GUIDE.md`:

1. Draft the lesson in prose using `docs/LESSON_TEMPLATE.md`.
2. Run every example through a real compiler and record the verified output (`expectedOutput`). **Don't ask the user to copy-paste code back and forth — compile it yourself** via `prototype/run-on-godbolt.js`, which hits the public Compiler Explorer API directly (see "Compiling examples" below). Set `outputsVerified: true` once done — `m1-l1` currently has this `false`, meaning its outputs still need checking.
3. Convert the prose draft into the JSON schema from `docs/CONTENT_GUIDE.md`.
4. Run it against the Definition-of-Done checklist (motivation present; theory exhaustive; basic+advanced examples with verified output; ≥1 basic and ≥1 advanced auto-checkable exercise; background callout if C++20/23-dependent; mastery check present; bleeding-edge API names checked against cppreference).

Depth calibration by feature size (draft, to be confirmed): minor feature → 1 screen + 1–2 examples + 2 exercises; medium feature → 2–4 screens + 3–4 examples + 3–4 exercises; flagship feature (reflection, `std::execution`) → split into sub-lessons, each with the full template.

**Bleeding-edge APIs**: exact names for `std::meta::*` (static reflection) and `std::execution` must be checked against cppreference — their syntax was finalized late in the C++26 process.

## Compiling examples

No local C++26 toolchain exists (the only local compiler is MinGW GCC 4.8.1, far too old). To get a verified `expectedOutput`, compile and run examples yourself against the public Compiler Explorer API via `prototype/run-on-godbolt.js` — see the **`compiling-cpp26-examples`** skill for the workflow, compiler IDs (incl. the reflection fork for Module 5), and pitfalls. Don't relay code through the user, and never fabricate an output.

## Git conventions

Commit messages (subject and body) must be in **English**, even though project docs and lesson content are in Russian. Identifiers/titles that are inherently Russian (e.g. a lesson title like `m0-l1` "Контекст C++26") may appear quoted inside an otherwise-English message, but the message itself should read as English.

## Line endings

Tracked text files (`.md`, `.json`, `.jsx`, `.ts`) use **CRLF** in the working tree (Windows checkout, `core.autocrlf=true`, no `.gitattributes`). When writing a Node script/regex that parses one of these files, match `\r\n` or use a `\r?\n`-tolerant pattern — `\n`-only patterns will silently fail to match.

## Module roadmap (ordered by dependency, not alphabetically)

0 Context (intro) → 1 Core language ergonomics → 2 Core safety → 3 constexpr (foundation for reflection) → 4 Contracts *(flagship)* → 5 Static Reflection *(flagship #1)* → 6 std::execution / Senders-Receivers *(flagship)* → 7 New containers/types → 8 Numerics & performance → 9 Low-level concurrency → 10 Debugging/format/removed features.

Full per-module content scope is in `docs/MASTER_PLAN.md` Part A.

## Current status / open calibrations

- `m1-l1` ("Pack indexing") is finished and serves as the format reference: all examples, exercises, and the challenge solution are verified against GCC trunk (`outputsVerified: true`). The rest of module 1 (`m1-l2`…`m1-l6`) and module 2 are still stubs; module 0 is now complete, see below.
- Module 0 (`m0-l1`, "Контекст C++26") is complete — an orientation lesson with no examples/challenge, all-`choice` exercises and mastery check.
- The prototype has e2e coverage via Playwright (`e2e/`): navigation, all exercise types, skip/unskip, and progress persistence.
- Open calibrations to resolve when starting content work in earnest (see `docs/PROJECT_OVERVIEW.md` §"Открытые калибровки"): lesson content language (Russian/English/both — project docs themselves are Russian) and the depth-per-feature-size threshold. The reference compiler question is resolved — see `compiling-cpp26-examples` skill.
- Implementation milestones (M1–M6, see `docs/MASTER_PLAN.md` Part B8): M1 (data model + navigation + progress) is largely in place in the prototype; current work is M2 (content pipeline — filling out modules 0–2, of which module 0 is now done).
