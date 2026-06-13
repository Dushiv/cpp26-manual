---
name: running-dev-server
description: Use when asked to start, run, launch, restart, stop, or check the local dev server for the C++26 prototype app in `prototype/`
---

# Running the prototype dev server

## Overview

`prototype/` is a no-build static site (CDN React + Babel-in-browser, see `index.html`). It must be served over `http://`, not opened via `file://`:
- Supabase OAuth (Google/GitHub sign-in) redirects back to a registered `http://127.0.0.1:8901` origin — `file://` breaks that round trip.
- The `.jsx` engine is loaded via `<script src="./cpp26-engine.jsx">`, which needs CORS headers from a real server.

## Check if it's already running first

```bash
netstat -ano | grep ':8901'
# or
curl -sI http://127.0.0.1:8901/index.html | head -1
```

If it answers `200 OK` / shows a `LISTENING` socket, it's already up — open the URL directly, don't start a second instance.

## Start (background)

```bash
cd prototype
npx http-server -p 8901 --cors
```

Run this with a background launch (e.g. `run_in_background`). Then open `http://127.0.0.1:8901/index.html`.

## Stop

Find the PID from `netstat -ano | grep ':8901'`, then:

```bash
kill <pid>          # bash
```
```powershell
Stop-Process -Id <pid> -Force   # PowerShell
```

## Common mistakes

- **Opening `index.html` via `file://`** — OAuth sign-in redirects away but never restores a valid session, and the `.jsx` may fail to load.
- **Using a different port** — the OAuth redirect URIs (Google/GitHub app + Supabase) are registered for `http://127.0.0.1:8901` specifically. A different port breaks sign-in.
- **Starting a second instance** — always check port 8901 first; `http-server` doesn't warn loudly if the port is taken.
