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
The script creates tables, indexes, policies, functions, and the trigger; it returns no rows.

### Step 3 — Verify the tables exist

In the left sidebar click **Table Editor**.  
You should see these six tables:

| Table | Purpose |
|---|---|
| `apartments` | One row per household sharing a parking spot |
| `profiles` | One row per user, auto-created on sign-up |
| `parking_sessions` | Active and historical parking usage, per apartment |
| `parking_queue` | Roommates waiting for the spot, per apartment |
| `parking_requests` | Planned future bookings, per apartment |
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

## Multi-apartment model

Every household ("apartment") gets its own parking spot, queue, requests,
and history — completely isolated from every other apartment in the same
database. A user belongs to at most one apartment at a time
(`profiles.apartment_id`), which starts `NULL` right after sign-up.

### Creating a household

The first person signs up normally, then calls the `create_apartment` RPC
(wired up in the app's "Create apartment" screen):

```ts
const { data: apartmentId } = await supabase.rpc('create_apartment', {
  apartment_name: 'הבית של בן',
});
```

This inserts the `apartments` row (`owner_id` = the caller) **and** sets
`profiles.apartment_id` for the caller in one atomic call. The apartment's
`invite_code` (an 8-character code, e.g. `A3F9K2B1`) is generated
automatically — the owner can see and share it from the Profile screen.

### Inviting roommates

There is no admin API that creates accounts with a chosen password for
someone else — Supabase Auth doesn't allow that from a client app, and
adding one would require a separate server (an Edge Function with the
service-role key), which is more infrastructure than this app needs.

Instead, whoever is filling in the sign-up form — the roommate themselves,
or the owner typing it in on their behalf and handing over the password
afterwards — enters the apartment's invite code in the optional "קוד הזמנה"
field on the sign-up screen. The `handle_new_user` trigger reads that code
from the sign-up metadata and joins the new profile to the matching
apartment immediately, no separate step required.

Already have an account and want to join a different apartment later? Use
the "הצטרף עם קוד הזמנה" flow, which calls:

```ts
await supabase.rpc('join_apartment_by_invite_code', { code: 'A3F9K2B1' });
```

### Why this can't be bypassed client-side

`profiles.apartment_id` and `apartments.owner_id` can **only** be written
by the `create_apartment` / `join_apartment_by_invite_code` /
`handle_new_user` functions (all `SECURITY DEFINER`). Direct `UPDATE`
access to those columns is revoked from the `authenticated` role, so a
client can't just set their own `apartment_id` to another household's id
without going through the invite-code check.

---

## One-active-session-per-apartment constraint

The schema enforces that **only one parking session can be `active` at a
time within each apartment** — other apartments are unaffected. This is
done with a partial unique index:

```sql
CREATE UNIQUE INDEX idx_one_active_session_per_apartment
  ON parking_sessions (apartment_id)
  WHERE status = 'active';
```

If the app tries to insert a second `active` session for the same
apartment while one already exists, Postgres will raise a unique-violation
error. The app catches this and tells the user the spot is already taken.

---

## History retention

`ParkingRepository.getHistory()` only ever asks for sessions from the last
30 days, so the app naturally only shows a rolling month of history no
matter how much data accumulates.

If you also want old rows actually deleted from the database (not just
hidden from the UI), the schema includes a `purge_old_parking_history()`
function that deletes `finished`/`cancelled` sessions older than 30 days.
It is **not** scheduled automatically. To run it nightly, your project
needs the `pg_cron` extension (Supabase Pro plan and above):

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule(
  'purge-old-parking-history',
  '0 3 * * *',
  $$ SELECT public.purge_old_parking_history(); $$
);
```

On the free plan, you can instead just call
`select public.purge_old_parking_history();` manually from the SQL Editor
whenever you want to clean up.

---

## How the auto-profile trigger works

When a user signs up via Supabase Auth (`supabase.auth.signUp()`), Postgres
fires the `on_auth_user_created` trigger immediately after inserting into
`auth.users`. The trigger calls `handle_new_user()`, which inserts a matching
row into `public.profiles` using the `full_name` stored in the sign-up
metadata, the user's email, and — if an `invite_code` was also passed in
the sign-up metadata — the matching apartment's id.

This means you never need to create a profile row manually — it always exists
by the time the app reads it.
