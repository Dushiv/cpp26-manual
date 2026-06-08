# Cloud Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional, opt-in layer on top of the existing localStorage progress persistence that lets a learner sign in with Google/GitHub (via Supabase Auth) and have their progress sync to the cloud, so the same learner sees the same progress across devices — without ever requiring login or breaking offline use.

**Architecture:** A new `cloudSync`-style set of helpers (`getSupabaseClient`, `pullProgress`, `pushProgress`) wraps the Supabase JS client (loaded via CDN, no build step). `App` gains a `session` state populated by `supabase.auth.onAuthStateChange`, an `AccountWidget` in the header for sign-in/sign-out, a pull-on-login effect that makes the cloud the source of truth (seeding it from local data on first login), and a periodic push effect that uploads the local blob — the very same `{version, data}` shape `saveProgress` already writes — whenever it changes.

**Tech Stack:** React 18 (via CDN, no build step — see `prototype/index.html`), Supabase (Auth + Postgres, via `@supabase/supabase-js` UMD CDN bundle), browser `localStorage`, `prototype/cpp26-engine.jsx`

**Design reference:** `docs/superpowers/specs/2026-06-08-cloud-sync-design.md`

---

## Background for the engineer

`prototype/cpp26-engine.jsx` is a single-file React prototype loaded via Babel-in-browser (see `prototype/index.html`). There is no build step, package.json, or test framework — verification happens by serving the file over local HTTP and exercising it in a real browser (the `file://` protocol breaks the CDN scripts' CORS).

**To serve and open the prototype for manual verification:**
```bash
cd prototype
npx http-server -p 8901
```
Then open `http://127.0.0.1:8901/index.html`.

**Important — top-level `const`/`function` are NOT directly callable from the DevTools console.** Babel-standalone evaluates `text/babel` scripts in their own function scope, so helpers like `loadProgress`, `getSupabaseClient`, etc. aren't visible as globals. Verify everything *indirectly*: through the running app's UI, `localStorage` contents, the Network tab, and the Supabase dashboard's Table Editor (Authentication → Users, and the `progress` table).

**The local persistence layer this builds on (already shipped, do not modify its behavior):**
- `PROGRESS_KEY = "cpp26-progress"`, `PROGRESS_VERSION = 1` (`prototype/cpp26-engine.jsx:239-240`)
- `loadProgress()` / `saveProgress(data)` (`prototype/cpp26-engine.jsx:242-260`) — read/write the versioned `{ version, data }` blob, where `data` is `{ cur, view, exStatus, mastery, strict }`
- `App`'s five `useState` calls seeded from `loadProgress()`, and a `useEffect` that calls `saveProgress` on every change (`prototype/cpp26-engine.jsx:562-571`)

This plan adds a *parallel* cloud layer that reuses this exact blob shape — it never changes `PROGRESS_VERSION`, `loadProgress`, or `saveProgress`.

---

### Task 1: Provision the Supabase backend

**This task is manual setup in external dashboards — there is no code to write or commit.** It produces two values (a project URL and an API key) that Task 2 needs. Nobody but the project owner can do this (it requires creating accounts and registering OAuth apps).

- [ ] **Step 1: Create a Supabase project**

Go to https://supabase.com/dashboard, sign in (or create a free account), and create a new project (free tier is enough for "a handful of people you know"). Note its **Project URL** — you'll need it in Step 5.

- [ ] **Step 2: Register a Google OAuth app**

In the [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → "Create Credentials" → "OAuth client ID" → Application type "Web application". Add this **Authorized redirect URI** (replace `<project-ref>` with your project's reference, visible in its URL/settings):
```
https://<project-ref>.supabase.co/auth/v1/callback
```
Copy the resulting **Client ID** and **Client Secret**.

- [ ] **Step 3: Register a GitHub OAuth app**

In GitHub → Settings → Developer settings → OAuth Apps → "New OAuth App". Set **Authorization callback URL** to the same URL as Step 2:
```
https://<project-ref>.supabase.co/auth/v1/callback
```
Copy the resulting **Client ID** and **Client Secret**.

- [ ] **Step 4: Enable both providers in Supabase**

In the Supabase dashboard → Authentication → Providers:
- Enable **Google**, paste the Client ID and Client Secret from Step 2
- Enable **GitHub**, paste the Client ID and Client Secret from Step 3

- [ ] **Step 5: Create the `progress` table with row-level security**

In the Supabase dashboard → SQL Editor, run:
```sql
create table progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  blob jsonb not null,
  updated_at timestamptz not null default now()
);

alter table progress enable row level security;

create policy "Users can read own progress"
  on progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on progress for update
  using (auth.uid() = user_id);
```
Expected: the editor reports success and a `progress` table appears in the Table Editor with the three policies listed under its "RLS policies".

- [ ] **Step 6: Copy the Project URL and anon key**

In the Supabase dashboard → Settings → API, copy:
- **Project URL** (e.g. `https://abcdefgh.supabase.co`)
- **anon / public** API key (a long JWT-looking string)

Keep these two values at hand — Task 2 Step 4 asks you to paste them into the code.

---

### Task 2: Load the Supabase client and add a logged-out account widget wired to sign-in

**Files:**
- Modify: `prototype/index.html:18` (insert CDN script tag)
- Modify: `prototype/cpp26-engine.jsx:1` (add `useRef` to the React destructure)
- Modify: `prototype/cpp26-engine.jsx:2` (add `LogIn`, `LogOut`, `User` icons)
- Modify: `prototype/cpp26-engine.jsx:260` (insert Supabase config + client getter after `saveProgress`)
- Modify: `prototype/cpp26-engine.jsx` (add `AccountWidget` component before `function App()`)
- Modify: `prototype/cpp26-engine.jsx:560-612` (add `session` state, `signIn`/`signOut`, render `AccountWidget`)
- Modify: `prototype/cpp26-engine.jsx:741` (add `.account`/`.acct-*` CSS rules)

- [ ] **Step 1: Add the Supabase UMD CDN script tag**

In `prototype/index.html`, line 18 currently reads:
```html
  <script crossorigin src="https://unpkg.com/lucide-react@0.344.0/dist/umd/lucide-react.js"></script>
```
Add this line directly after it (it must load *before* `cpp26-engine.jsx` on line 23, since the engine references `window.supabase` at module-evaluation time):
```html
  <script crossorigin src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

- [ ] **Step 2: Add `useRef` to the React destructure**

Line 1 currently reads:
```js
const { useState, useEffect } = React;
```
Change it to:
```js
const { useState, useEffect, useRef } = React;
```

- [ ] **Step 3: Add account-related lucide icons**

Line 2 currently reads:
```js
const { Check, SkipForward, Circle, CircleDot, Repeat, ChevronRight, BookOpen } = window.lucideReact || window.LucideReact;
```
Change it to:
```js
const { Check, SkipForward, Circle, CircleDot, Repeat, ChevronRight, BookOpen, LogIn, LogOut, User } = window.lucideReact || window.LucideReact;
```

- [ ] **Step 4: Add Supabase config constants and a client getter**

Insert immediately after line 260 (the closing brace of `saveProgress`):
```js

const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";

let supabaseClient = null;
function getSupabaseClient() {
  if (!window.supabase || !SUPABASE_URL.startsWith("https://")) return null;
  if (!supabaseClient) supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return supabaseClient;
}
```
Replace `YOUR-PROJECT-REF` and `YOUR-ANON-PUBLIC-KEY` with the exact **Project URL** and **anon key** you copied in Task 1 Step 6. (The `SUPABASE_URL.startsWith("https://")` check makes `getSupabaseClient` return `null` — and the whole feature silently inert — if someone runs the prototype without ever filling these in.)

- [ ] **Step 5: Add the `AccountWidget` component**

Insert it directly before `function App() {` (currently line 560):
```js
function AccountWidget({ session, onSignIn, onSignOut }) {
  if (!session) {
    return (
      <div className="account">
        <button className="acct-btn" onClick={() => onSignIn("google")}><LogIn size={14} /> Google</button>
        <button className="acct-btn" onClick={() => onSignIn("github")}><LogIn size={14} /> GitHub</button>
      </div>
    );
  }
  const meta = session.user.user_metadata || {};
  const name = meta.full_name || meta.user_name || session.user.email || "Ученик";
  return (
    <div className="account">
      {meta.avatar_url ? <img className="acct-av" src={meta.avatar_url} alt="" /> : <User size={16} />}
      <span className="acct-name">{name}</span>
      <button className="acct-btn" onClick={onSignOut}><LogOut size={14} /> Выйти</button>
    </div>
  );
}

```

- [ ] **Step 6: Add `session` state, `signIn`/`signOut`, and render the widget**

In `App` (currently starting at line 560), the five progress `useState` calls and the save effect look like this (lines 562-571):
```js
  const [saved] = useState(loadProgress);
  const [cur, setCur] = useState(saved ? saved.cur : "m1-l1");
  const [view, setView] = useState(saved ? saved.view : "lesson");
  const [exStatus, setExStatus] = useState(saved ? saved.exStatus : {});
  const [mastery, setMastery] = useState(saved ? saved.mastery : {});
  const [strict, setStrict] = useState(saved ? saved.strict : false);

  useEffect(() => {
    saveProgress({ cur, view, exStatus, mastery, strict });
  }, [cur, view, exStatus, mastery, strict]);
```
Add a `session` state line directly after the `strict` line (before the `saveProgress` effect):
```js
  const [session, setSession] = useState(null);
```
Then, anywhere after that (e.g. directly after the `saveProgress` effect), add the sign-in/sign-out functions:
```js

  function signIn(provider) {
    const client = getSupabaseClient();
    if (!client) return;
    client.auth.signInWithOAuth({ provider }).catch(() => {});
  }
  function signOut() {
    const client = getSupabaseClient();
    if (!client) return;
    client.auth.signOut().catch(() => {});
  }
```
Finally, render `AccountWidget` in the header. The `<header className="topbar">` block (currently lines 606-612) reads:
```jsx
      <header className="topbar">
        <div className="brand"><BookOpen size={18} /><span>{COURSE_DATA.courseTitle}</span></div>
        <div className="prog">
          <div className="prog-bar"><div className="prog-fill" style={{ width: (real.length ? (doneCount / real.length * 100) : 0) + "%" }} /></div>
          <span className="prog-txt">{doneCount} / {real.length} уроков</span>
        </div>
      </header>
```
Add `<AccountWidget .../>` after the closing `</div>` of `.prog`, still inside `<header>`:
```jsx
      <header className="topbar">
        <div className="brand"><BookOpen size={18} /><span>{COURSE_DATA.courseTitle}</span></div>
        <div className="prog">
          <div className="prog-bar"><div className="prog-fill" style={{ width: (real.length ? (doneCount / real.length * 100) : 0) + "%" }} /></div>
          <span className="prog-txt">{doneCount} / {real.length} уроков</span>
        </div>
        <AccountWidget session={session} onSignIn={signIn} onSignOut={signOut} />
      </header>
```

- [ ] **Step 7: Add CSS for the account widget**

Line 741 currently reads:
```css
.prog-txt { font-size:12px; color:var(--mut); white-space:nowrap; }
```
Add directly after it:
```css
.account { display:flex; align-items:center; gap:8px; }
.acct-btn { display:flex; align-items:center; gap:6px; background:var(--panel2); color:var(--ink);
  border:1px solid var(--line); border-radius:8px; padding:6px 10px; cursor:pointer; font-size:12px; }
.acct-btn:hover { border-color:var(--amber); }
.acct-name { font-size:13px; color:var(--ink); white-space:nowrap; }
.acct-av { width:24px; height:24px; border-radius:50%; object-fit:cover; }
```

- [ ] **Step 8: Verify sign-in buttons trigger the OAuth redirect**

Serve the prototype (see "Background") and open `http://127.0.0.1:8901/index.html`. You should see "Google" and "GitHub" buttons in the header (with a `LogIn` icon).

Click "Google". Expected: the browser navigates away to a Google sign-in/consent screen (or directly to a `https://<project-ref>.supabase.co/auth/v1/authorize?...` URL that then redirects to Google) — this confirms `getSupabaseClient()` built a real client and `signInWithOAuth` fired. Complete the Google login if you want, or just navigate back — session handling comes in Task 3, so the widget will still show the logged-out buttons after returning for now.

Repeat for "GitHub" — expected: redirect to GitHub's authorize screen.

If clicking does nothing at all, open the console and check for errors — the most likely cause is `SUPABASE_URL`/`SUPABASE_ANON_KEY` still containing the placeholder strings (re-check Step 4).

- [ ] **Step 9: Commit**

```bash
git add prototype/index.html prototype/cpp26-engine.jsx
git commit -m "$(cat <<'EOF'
Add Supabase client and account widget wired to OAuth sign-in

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Restore session on load, listen for auth changes, complete sign-out

**Files:**
- Modify: `prototype/cpp26-engine.jsx` (add a session-restoration `useEffect` in `App`, simplify `signOut`)

- [ ] **Step 1: Add the session-restoration and auth-listener effect**

In `App`, directly after the `signIn`/`signOut` functions added in Task 2 Step 6, add:
```js

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) return;
    client.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = client.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
```
This runs once on mount: `getSession()` restores any existing session (covers both "reload while logged in" and "just got redirected back from the OAuth provider" — `supabase-js` auto-detects the auth tokens in the URL and establishes a session before this resolves). `onAuthStateChange` then keeps `session` up to date for every subsequent login/logout/token-refresh event.

- [ ] **Step 2: Verify the full sign-in → restore → sign-out cycle**

Serve the prototype and open it fresh (clear any existing Supabase session first: DevTools → Application → Local Storage → delete any `sb-...-auth-token` keys, then reload).

1. Click "Google" (or "GitHub"), complete the provider's login screen.
2. Expected: redirected back to the app, and the header now shows your name/avatar and a "Выйти" button instead of the login buttons.
3. Reload the page. Expected: still logged in — same name/avatar shown (this confirms `getSession()` restores the session from Supabase's own `localStorage` key).
4. Click "Выйти". Expected: header reverts to the "Google"/"GitHub" login buttons.
5. Reload again. Expected: still logged out.

- [ ] **Step 3: Commit**

```bash
git add prototype/cpp26-engine.jsx
git commit -m "$(cat <<'EOF'
Restore Supabase session on load and complete sign-out flow

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Pull progress on login — seed the cloud on first login, let the cloud win afterwards

**Files:**
- Modify: `prototype/cpp26-engine.jsx` (add `pullProgress`/`pushProgress` cloud helpers near `loadProgress`/`saveProgress`; add `applyProgress`, `currentLocalBlob`, `syncOnLogin`, refs, and wire them into the auth-listener effect from Task 3)

- [ ] **Step 1: Add `pullProgress` and `pushProgress` helpers**

Insert immediately after the `getSupabaseClient` function added in Task 2 Step 4:
```js

async function pullProgress(client, userId) {
  try {
    const { data, error } = await client.from("progress").select("blob").eq("user_id", userId).maybeSingle();
    if (error) return { ok: false };
    return { ok: true, blob: data ? data.blob : null };
  } catch (e) {
    return { ok: false };
  }
}

async function pushProgress(client, userId, blob) {
  try {
    await client.from("progress").upsert({ user_id: userId, blob, updated_at: new Date().toISOString() });
  } catch (e) {
    // network/Supabase unavailable — caller retries on the next sync tick
  }
}
```
`pullProgress` returns `{ ok: false }` when the fetch itself failed (network error, RLS issue, etc.) — the caller must NOT treat that as "no row exists," or it would overwrite the learner's cloud data with a fresh seed on every transient network blip. `{ ok: true, blob: null }` means the request succeeded and genuinely found no row (first login). `{ ok: true, blob: {...} }` means a cloud blob exists and should win.

- [ ] **Step 2: Add `currentLocalBlob`, refs, `applyProgress`, and `syncOnLogin` inside `App`**

Directly after the `const [session, setSession] = useState(null);` line added in Task 2 Step 6, add two refs:
```js
  const lastSyncedBlob = useRef(null);
  const pulledForUserId = useRef(null);
```
Then, directly after the `signIn`/`signOut` functions (and before the auth-listener `useEffect` from Task 3), add:
```js

  function currentLocalBlob() {
    return loadProgress() || { cur: "m1-l1", view: "lesson", exStatus: {}, mastery: {}, strict: false };
  }

  function applyProgress(blob) {
    setCur(blob.cur);
    setView(blob.view);
    setExStatus(blob.exStatus);
    setMastery(blob.mastery);
    setStrict(blob.strict);
    saveProgress(blob);
  }

  async function syncOnLogin(userId) {
    const client = getSupabaseClient();
    if (!client) return;
    const result = await pullProgress(client, userId);
    if (!result.ok) return;
    if (result.blob) {
      applyProgress(result.blob);
      lastSyncedBlob.current = result.blob;
    } else {
      const localBlob = currentLocalBlob();
      pushProgress(client, userId, localBlob);
      lastSyncedBlob.current = localBlob;
    }
  }
```
`currentLocalBlob` reads the freshest local state via `loadProgress()` rather than closing over `cur`/`view`/etc. — those would otherwise be stale inside a callback set up once on mount (the classic stale-closure trap with `useEffect(..., [])`). By the time a learner can click a login button, the existing `saveProgress` effect (`prototype/cpp26-engine.jsx:569-571`) has already run at least once, so `loadProgress()` reliably returns the current blob; the literal fallback only matters in a hypothetical race and mirrors the five `useState` defaults already used at lines 563-567.

- [ ] **Step 3: Wire `syncOnLogin` into the auth-listener effect**

The effect added in Task 3 Step 1 currently reads:
```js
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) return;
    client.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = client.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
```
Replace it with a version that also triggers `syncOnLogin` exactly once per signed-in user (guarding with `pulledForUserId` so a `TOKEN_REFRESHED` event — which also carries a session — doesn't re-trigger a pull and clobber progress made since login):
```js
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) return;
    function handleSession(newSession) {
      setSession(newSession);
      if (newSession && pulledForUserId.current !== newSession.user.id) {
        pulledForUserId.current = newSession.user.id;
        syncOnLogin(newSession.user.id);
      }
      if (!newSession) {
        pulledForUserId.current = null;
      }
    }
    client.auth.getSession().then(({ data }) => handleSession(data.session));
    const { data: sub } = client.auth.onAuthStateChange((_event, newSession) => handleSession(newSession));
    return () => sub.subscription.unsubscribe();
  }, []);
```

- [ ] **Step 4: Verify first-login seeding**

In the Supabase dashboard → Table Editor → `progress`, delete any existing rows (clean slate). In the browser, log out if logged in, then clear local progress:
```js
localStorage.removeItem("cpp26-progress");
location.reload();
```
Now interact with the app a bit (toggle strict mode, switch to "Зона повторения") so there's a distinctive local blob, then log in with Google or GitHub.

Expected: within a couple seconds, the Supabase Table Editor shows a new row for your user with `blob` matching what you just set locally (e.g. `"strict": true`, `"view": "repetition"`).

- [ ] **Step 5: Verify cloud-wins on subsequent logins**

While still logged in, in the Supabase Table Editor, edit that row's `blob` column directly — change `"strict"` to the opposite of whatever the app currently shows, and change `"view"` to `"lesson"` if it's `"repetition"` (or vice versa). Save the edit.

Now reload the app page (still logged in — this fires `getSession` → `handleSession` → since `pulledForUserId.current` already equals your user id, `syncOnLogin` won't re-fire on reload... so instead: log out, then log back in). Expected after logging back in: the app's `strict` checkbox and view match what you just typed into the Supabase row, **not** what the app showed before — confirming the cloud blob overwrote local state and `localStorage`.

- [ ] **Step 6: Clean up and commit**

```js
localStorage.removeItem("cpp26-progress");
location.reload();
```
```bash
git add prototype/cpp26-engine.jsx
git commit -m "$(cat <<'EOF'
Pull progress from cloud on login — seed on first login, cloud wins after

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Push progress periodically, flush on tab-hide/unload, and verify offline degradation

**Files:**
- Modify: `prototype/cpp26-engine.jsx` (add a periodic-push `useEffect` in `App`)

- [ ] **Step 1: Add the periodic-push effect**

Directly after the auth-listener `useEffect` (the one modified in Task 4 Step 3), add:
```js

  useEffect(() => {
    if (!session) return;
    const client = getSupabaseClient();
    if (!client) return;
    const userId = session.user.id;

    function maybePush() {
      const blob = currentLocalBlob();
      if (JSON.stringify(blob) === JSON.stringify(lastSyncedBlob.current)) return;
      lastSyncedBlob.current = blob;
      pushProgress(client, userId, blob);
    }
    function onVisibilityChange() {
      if (document.visibilityState === "hidden") maybePush();
    }

    const interval = setInterval(maybePush, 3 * 60 * 1000);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("beforeunload", maybePush);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("beforeunload", maybePush);
    };
  }, [session]);
```
The `JSON.stringify` comparison against `lastSyncedBlob.current` (set both by `syncOnLogin` in Task 4 and by `maybePush` here) ensures we only `upsert` when something actually changed since the last successful sync — matching the design's "push only on change" rule. `beforeunload` is inherently best-effort: browsers don't guarantee async work started there completes, so this is a courtesy flush, not a guarantee — exactly the "best-effort, never blocks the UI" framing from the design doc.

- [ ] **Step 2: Verify the instant flush paths (visibility change / unload)**

Log in, serve the app, and open the Supabase Table Editor for `progress` in a second browser tab/window so you can refresh and watch the row.

1. In the app, toggle the "Строгий режим" checkbox.
2. Switch away to the Supabase tab (this fires `visibilitychange` with `visibilityState === "hidden"` on the app tab).
3. Refresh the Table Editor. Expected: the row's `blob.strict` and `updated_at` reflect your toggle within moments.
4. Back in the app, switch the view to "Зона повторения", then close the app's browser tab entirely.
5. Reopen the app, log in again. Expected: it restores in the "Зона повторения" view — confirming the `beforeunload` flush (or the visibility flush that fired just before closing) saved it.

- [ ] **Step 3: Verify the timer path (temporarily, then revert)**

Temporarily change `3 * 60 * 1000` to `10 * 1000` (10 seconds) so you don't have to wait minutes:
1. Make a change in the app (e.g. flip strict mode again).
2. Wait ~10 seconds without switching tabs or reloading.
3. Refresh the Table Editor. Expected: the row updates on its own, without any tab-switch or close.

**Revert the interval back to `3 * 60 * 1000` before committing** — the 10-second value was for testing only.

- [ ] **Step 4: Verify graceful degradation when offline**

Open DevTools → Network tab → set throttling to "Offline".

1. Reload the app. Expected: it loads and works exactly as before (lesson navigation, exercises, strict mode) — purely on local data, no error overlay, no visible difference from being logged out.
2. If currently logged out, click "Google"/"GitHub". Expected: nothing dramatic happens — at most a network error in the console (caught by the `.catch(() => {})` in `signIn`); the app stays fully usable.
3. If currently logged in, make a few changes (toggle strict, switch views, answer an exercise). Expected: everything works locally; no errors surface to the UI; `pushProgress`'s try/catch swallows the failed `upsert` calls silently.
4. Set throttling back to "Online" (or "No throttling").
5. Trigger a flush (switch tabs, or wait for the next timer tick). Expected: the Table Editor shows the accumulated changes land in the next successful push — nothing was lost, it just queued up locally (in `localStorage`, as always) until connectivity returned.

- [ ] **Step 5: Commit**

```bash
git add prototype/cpp26-engine.jsx
git commit -m "$(cat <<'EOF'
Push progress to cloud periodically and on tab-hide/unload

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```
