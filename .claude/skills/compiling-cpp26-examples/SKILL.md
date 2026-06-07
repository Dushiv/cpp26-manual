---
name: compiling-cpp26-examples
description: Use when writing or verifying a lesson's C++26 code examples and need a real, compiled `expectedOutput` — covers compiling and executing C++26 (incl. static reflection, contracts) without a local toolchain, via the public Compiler Explorer API
---

# Compiling C++26 examples via Compiler Explorer

## Overview

Lesson examples must ship with a **verified** `expectedOutput` (per `docs/CONTENT_GUIDE.md` — the learner never compiles, only compares against your recorded reference). The only local compiler on this machine is MinGW GCC 4.8.1, far too old for C++26 — including bleeding-edge features like static reflection.

**Don't ask the user to copy-paste code back and forth.** Compile and run it yourself through the public Compiler Explorer (godbolt.org) API using `prototype/run-on-godbolt.js`. Never fabricate or guess an output.

## Workflow

1. Write the snippet to a temp `.cpp` file (e.g. `prototype/.tmp-example.cpp`).
2. Run it: `node prototype/run-on-godbolt.js <compilerId> <file.cpp> ["<flags>"]`
3. Confirm `=== compile ===` exit code is 0, then `=== execute ===` exit code is 0.
4. Copy `execResult.stdout` verbatim into `expectedOutput`.
5. Delete the temp file. Set `outputsVerified: true` on the lesson once all its examples are verified this way.

Default flags are `-std=c++26 -O2`. Pass a quoted override string as the third argument for anything else (e.g. reflection needs `-stdlib=libc++`).

## Compiler IDs (verified reachable)

| ID | Use for |
|---|---|
| `gsnapshot` | x86-64 GCC trunk — covers everything **except static reflection**: pack indexing, constexpr extensions, containers, numerics, and **contracts** (Module 4 — `pre`/`post`/`contract_assert` work fine here, just add `-fcontracts` to the flags: `-std=c++26 -O2 -fcontracts`) |
| `clang_trunk` | x86-64 Clang trunk — cross-check |
| `clang_bb_p2996` | Clang fork implementing P2996 static reflection (`^^`, `[: :]`, `<meta>`) — **the** compiler for Module 5, the one feature mainline trunk doesn't have yet; needs `-std=c++26 -stdlib=libc++` |
| `edg-experimental-reflection` | EDG's experimental reflection front end — alternative cross-check for Module 5 |

In practice you only need **two** reference setups: `gsnapshot` for everything (add `-fcontracts` for Module 4), and `clang_bb_p2996`/`edg-experimental-reflection` for Module 5 reflection. (`gcontracts-trunk` looked tempting for contracts but turned out to cap at `-std=c++20` — a stale/different-purpose branch; `gsnapshot -fcontracts` is the better, more current choice.)

To discover more: `curl -s "https://godbolt.org/api/compilers/c++?fields=id,name" -H "Accept: application/json"` and grep for keywords like `trunk`, `p2996`, `reflect`, `contract`.

## Common mistakes

- **Guessing the output instead of running it.** Even "obvious" output (e.g. a `static_assert` or simple `std::print`) must be run — that's the whole point of `outputsVerified`.
- **Using the local MinGW GCC 4.8.1.** It predates C++17 properly, let alone C++26. Always go through Compiler Explorer.
- **Wrong compiler for reflection.** Mainline GCC/Clang trunk do not yet implement `^^`/`[: :]`/`<meta>` — use `clang_bb_p2996` (or `edg-experimental-reflection`) with `-stdlib=libc++`.
- **Forgetting `-fcontracts` for Module 4 examples.** Without it `gsnapshot` won't recognize `pre`/`post`/`contract_assert`. (And remember: contract postconditions can only reference `const` parameters — that's a real language rule, not a compiler gap, if you see "a value parameter used in a postcondition must be const".)
- **Leaving temp `.cpp` files around.** Clean them up after capturing the output — they're scratch, not lesson assets.
- **Passing `--` before the flags string.** The script takes the flags as a single quoted argument, not a `--`-separated list — `node prototype/run-on-godbolt.js clang_bb_p2996 f.cpp "-std=c++26 -stdlib=libc++"`, no `--`.
