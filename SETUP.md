# Deep Waters RTC — Coaching Ledger · Setup & Deploy

A private session/payment tracker for Jesse Vasquez (Deep Waters RTC), built as a
Shopify **Hydrogen** app (React Router v7 + Vite) that hosts free on **Oxygen**, with
data stored in **Supabase** (Postgres). The app lives at the site root (`/`).

```
Browser (phone/desktop)
   │  logs in with a magic link
   ▼
Hydrogen app on Oxygen  ──(free hosting, auto-deploys from GitHub)
   │  reads/writes with the PUBLIC anon key
   ▼
Supabase Postgres + Row Level Security  ──(the data; survives any device wipe)
```

**Two independent safety nets:** the Git repo backs up the *code*; Supabase backs up the
*data*. Clearing a browser, losing a phone, or wiping the laptop loses nothing.

---

## 1. Create the Supabase database (~5 min)

1. Go to https://supabase.com → **New project** (free tier, no card). Pick a name and a
   strong database password. Wait ~2 min for it to provision.
2. Left sidebar → **SQL Editor** → **New query**. Paste the entire contents of
   [`supabase/schema.sql`](./supabase/schema.sql) and click **Run**. This creates the
   `athletes`, `sessions`, and `session_athletes` tables with Row Level Security
   (each user only ever sees their own rows).
3. Left sidebar → **Authentication → Providers → Email**: make sure **Email** is enabled.
   Leave "Confirm email" on. (This powers the magic-link login.)
4. **Authentication → URL Configuration**: add your site URLs to **Redirect URLs** so
   the magic link can return to the app. Add both:
   - `http://localhost:3000/` (local dev)
   - `https://YOUR-OXYGEN-URL/` (added after step 3 below)
5. **Project Settings → API**: copy the **Project URL** and the **anon public** key.
   You'll paste these into env vars below. (The anon key is meant to be public — RLS is
   what keeps data private.)

## 2. Run it locally (optional, to preview before deploying)

```bash
npm install
cp .env.example .env      # then paste your Supabase URL + anon key into .env
npm run dev
```

Open the printed URL and add the site root URL `/`. Sign in with your email, click the magic link,
and you're in. Use **Load sample data** on the empty dashboard to explore.

## 3. Put it on GitHub + deploy to Oxygen (free, ~10 min)

Oxygen is Shopify's free edge hosting; it auto-deploys every time you push to GitHub.

1. Create a new repo on GitHub and push this project:
   ```bash
   git add -A && git commit -m "Deep Waters RTC coaching ledger"
   git branch -M main
   git remote add origin https://github.com/YOU/deepwaters-app.git
   git push -u origin main
   ```
2. In the **Deep Waters Shopify admin** → **Sales channels → Hydrogen** → **Create
   storefront** → **Connect existing repository** → pick this GitHub repo. Shopify opens
   a PR adding an Oxygen deploy workflow — **merge it**. Oxygen builds and gives you a
   URL like `https://deepwaters-rtc-xxxx.myshopify.dev`.
3. In the Hydrogen channel → your storefront → **Environments and variables**, add:
   - `PUBLIC_SUPABASE_URL` = your Supabase Project URL
   - `PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon public key
   - `SESSION_SECRET` = any long random string
   Redeploy (push any commit, or use the redeploy button).
4. Go back to Supabase → **Authentication → URL Configuration** and add
   `https://YOUR-OXYGEN-URL/` to the Redirect URLs.

Send Jesse: **`https://YOUR-OXYGEN-URL/`**. He logs in with his email — done.

### Optional: link the real store / custom domain
- To show real Deep Waters data on the storefront routes (not needed for the tracker):
  `npx shopify hydrogen link` then `npx shopify hydrogen env pull`.
- Oxygen gives a free `*.myshopify.dev` URL. A custom domain is optional and separate.

## 4. Backups & data safety
- Data is server-side in Supabase, so a browser wipe / new phone loses nothing.
- The sidebar **Export backup** button downloads a JSON + CSV snapshot anytime.
- Supabase free tier includes automatic daily backups; you can also enable
  **Database → Backups** and schedule your own.
- Every delete asks for confirmation, and there is no "delete everything" button.

## How it's wired (for future you)
- `app/routes/.jsx` — the route; server loader passes the public Supabase env to
  the client, then mounts the app.
- `app/lib/-app.js` — the whole UI + Supabase CRUD, scoped under `.dwroot` so it
  never touches the storefront theme.
- `supabase/schema.sql` — tables + RLS policies.
- `app/root.jsx` — patched to render `/` without storefront header/footer.

To add a coach later: each Supabase user automatically gets their own private data via
RLS — just have them sign in with a different email. (No code change needed.)
