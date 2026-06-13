# C++26: From Zero to Full Understanding

A learning app for the **C++26 standard**. The app acts as a teacher: the
learner works through modules, reads theory with worked examples, solves
auto-checked exercises, and is expected to genuinely understand each topic by
the end.

The project is currently in the **content-design stage** — most of the repo
is planning docs (`docs/`) and lesson content authored as data
(`content/modules/`). The only runnable code is the `prototype/` app: a
no-build static site (CDN React + in-browser Babel) used to iterate on the
lesson format, navigation, and progress tracking.

## Repo layout

- `docs/` — planning & authoring guides. Start with `docs/PROJECT_OVERVIEW.md`.
- `content/modules/` — lesson content as JSON (one file per module).
- `prototype/` — the static prototype app (`index.html` + `cpp26-engine.jsx`).
- `e2e/` — Playwright end-to-end tests for the prototype.

## Prerequisites

- [Node.js](https://nodejs.org/) (includes `npm` and `npx`).

## Setup

```bash
npm install
```

This installs the dev tooling (`@playwright/test`, `http-server`). The
prototype app itself has no dependencies — it loads React, Babel, and other
libraries from a CDN at runtime.

The first time you run Playwright, also install its browser binaries:

```bash
npx playwright install chromium
```

## Running the prototype

The prototype must be served over `http://`, not opened via `file://`
(OAuth sign-in and the `.jsx` module loading both require a real server).

```bash
cd prototype
npx http-server -p 8901 --cors
```

Then open `http://127.0.0.1:8901/index.html`.

> Port 8901 is significant: Supabase/OAuth redirect URIs are registered for
> `http://127.0.0.1:8901` specifically. Using a different port breaks sign-in.

## Running the e2e tests

With the dev server running (or not — Playwright will start one for you via
`reuseExistingServer`):

```bash
npx playwright test
```

This runs the smoke and lesson-interaction tests in `e2e/` against
`http://127.0.0.1:8901`.
