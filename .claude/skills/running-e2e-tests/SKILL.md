---
name: running-e2e-tests
description: Use when asked to run, check, or debug the Playwright e2e test suite (`e2e/`) for the C++26 prototype, including the first run in a fresh checkout/worktree
---

# Running the Playwright e2e suite

## Overview

The suite lives in `e2e/` and is driven by `playwright.config.ts`. It spins up
`npx http-server` itself (via `webServer`), so you normally do **not** need to
start the dev server manually before running tests — see
`running-dev-server` if you need the server for manual browsing instead.

## First run in a fresh checkout / worktree

A fresh `npm install` does not download browser binaries. Before the first
`test:e2e` run in a new checkout or worktree, install the Chromium browser
Playwright needs:

```bash
npx playwright install chromium
```

This is a one-time step per machine/worktree cache location — if Chromium is
already installed (shared cache), the command is a fast no-op.

## Run the suite

```bash
npm run test:e2e
```

Equivalent to `npx playwright test`. Runs all specs in `e2e/` headless
against `http://127.0.0.1:8901`, using the `webServer` block in
`playwright.config.ts` to serve the app (`reuseExistingServer: true`, so it
won't conflict if `running-dev-server` already has port 8901 up).

## Run a single spec / test

```bash
npx playwright test e2e/i18n.spec.ts
npx playwright test e2e/i18n.spec.ts -g "persists across reload"
```

## Common mistakes

- **Skipping `npx playwright install chromium` on first run** — tests fail
  with a "browser not found" / executable-doesn't-exist error, not a useful
  app-level failure.
- **Assuming a long-running install/test command finished** — `playwright
  install` and `test:e2e` can take well over a minute; don't cut them off
  early or assume a timeout means failure without checking output.
