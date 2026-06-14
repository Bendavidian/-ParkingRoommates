# Supabase Setup Guide

## How to apply the schema

### Step 1 — Open the SQL Editor

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Select your **Parking Roommates** project.
3. In the left sidebar click **SQL Editor**.
4. Click **New query** (top-left of the editor panel).

### Step 2 — Paste and run

1. Open `supabase/schema.sql` from this repo.
2. Select all and copy the entire file.
3. Paste it into the Supabase SQL Editor.
4. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`).

You should see `Success. No rows returned` at the bottom — that is correct.  
The script creates tables, indexes, policies, and the trigger; it returns no rows.

### Step 3 — Verify the tables exist

In the left sidebar click **Table Editor**.  
You should see these five tables:

| Table | Purpose |
|---|---|
| `profiles` | One row per user, auto-created on sign-up |
| `parking_sessions` | Active and historical parking usage |
| `parking_queue` | Roommates waiting for the spot |
| `parking_requests` | Planned future bookings |
| `notifications` | Per-user notification inbox |

### Step 4 — Verify RLS is enabled

In **Table Editor**, click any table → click **RLS** in the top-right area.  
Each table should show **RLS enabled** with its policies listed.

---

## Re-running the script

The script is **idempotent** — safe to run more than once.  
All statements use `IF NOT EXISTS` or `CREATE OR REPLACE`, and the trigger
is dropped and recreated explicitly.

---

## Disable email confirmation (recommended for development)

By default Supabase requires users to click a confirmation link before they
can sign in. To skip this during development:

1. Supabase Dashboard → **Authentication** → **Providers** → **Email**
2. Toggle off **"Confirm email"**
3. Save.

Re-enable it before going to production.

---

## How the auto-profile trigger works

When a user signs up via Supabase Auth (`supabase.auth.signUp()`), Postgres
fires the `on_auth_user_created` trigger immediately after inserting into
`auth.users`. The trigger calls `handle_new_user()`, which inserts a matching
row into `public.profiles` using the `full_name` stored in the sign-up
metadata and the user's email.

This means you never need to create a profile row manually — it always exists
by the time the app reads it.

---

## One-active-session constraint

The schema enforces that **only one parking session can be `active` at a time**
across all users. This is done with a partial unique index:

```sql
CREATE UNIQUE INDEX idx_one_active_session
  ON parking_sessions ((1))
  WHERE status = 'active';
```

If the app tries to insert a second `active` session while one already exists,
Postgres will raise a unique-violation error. The app should catch this and
inform the user that the spot is already taken.
