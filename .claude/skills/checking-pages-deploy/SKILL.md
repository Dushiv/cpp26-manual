---
name: checking-pages-deploy
description: Use when asked to check, verify, or debug the GitHub Pages deployment of the C++26 prototype (`.github/workflows/deploy-pages.yml`), e.g. after pushing changes or when the user reports the deployed page is broken/unavailable
---

# Checking the GitHub Pages deployment

## Overview

`.github/workflows/deploy-pages.yml` deploys the **repo root** (`path: .`)
as the Pages artifact, triggered on push to `master` for `prototype/**`,
`content/**`, or the workflow file itself (also `workflow_dispatch`).

Because the artifact root is the repo root, the deployed app lives at:

```
https://dushiv.github.io/cpp26-manual/prototype/index.html
```

The relative fetch `../content/modules/<locale>/mN.json` in
`loadCourseData()` (see `prototype/cpp26-engine.jsx`) resolves to
`https://dushiv.github.io/cpp26-manual/content/modules/<locale>/mN.json`,
which only exists because `content/` is included in the same artifact.

The repo root also has a tiny `index.html` (meta-refresh redirect to
`prototype/index.html`), so the bare URL GitHub Pages advertises —
`https://dushiv.github.io/cpp26-manual/` — also works and lands on the app.

## Step 1: Check the latest workflow run

```bash
curl -s "https://api.github.com/repos/Dushiv/cpp26-manual/actions/workflows/deploy-pages.yml/runs?per_page=3" \
  | grep -E '"head_sha"|"status"|"conclusion"|"created_at"|"event"'
```

Confirm the most recent run's `head_sha` matches the commit you expect
(`git rev-parse HEAD` / `git rev-parse origin/master`), and
`status: completed`, `conclusion: success`.

If no run has fired for a recent push that touched `prototype/**` or
`content/**`, trigger one manually:

```bash
curl -s -X POST \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/Dushiv/cpp26-manual/actions/workflows/deploy-pages.yml/dispatches" \
  -d '{"ref":"master"}'
```

(This requires an authenticated request — if it 404s/401s without a
token, ask the user to trigger it manually via the Actions tab, or wait
for the push-triggered run.)

## Step 2: Verify the deployed site actually serves the app

```bash
curl -sI "https://dushiv.github.io/cpp26-manual/"                       # expect 200 (redirect page)
curl -sI "https://dushiv.github.io/cpp26-manual/prototype/index.html"   # expect 200
curl -sI "https://dushiv.github.io/cpp26-manual/prototype/cpp26-engine.jsx"  # expect 200
```

## Step 3: Verify the content fetch path resolves

This is the part that silently breaks if the artifact path or the
relative fetch path in `cpp26-engine.jsx` ever drift apart again:

```bash
curl -sI "https://dushiv.github.io/cpp26-manual/content/modules/ru/m0.json"  # expect 200
curl -sI "https://dushiv.github.io/cpp26-manual/content/modules/en/m0.json"  # expect 200
```

A 404 here means the deployed app will show
"Не удалось загрузить контент урока..." even though `index.html` itself
loads fine.

## Common mistakes

- **Assuming a successful workflow run means the page works** — a green
  run only confirms the artifact was uploaded and deployed; it does not
  verify the relative `../content/...` fetch path still resolves inside
  that artifact. Always do Step 3.
- **Forgetting `content/**` triggers** — if someone narrows the workflow's
  `paths` filter back to `prototype/**` only, content-only edits won't
  redeploy.
