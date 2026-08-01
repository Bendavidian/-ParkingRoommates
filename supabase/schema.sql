-- =============================================================================
-- Parking Roommates – Database Schema
-- Run this once in: Supabase Dashboard → SQL Editor → New Query → Run
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE / DROP IF EXISTS throughout.
--
-- Multi-tenant model: every household ("apartment") has its own parking
-- spot, queue, requests and history, isolated from every other apartment
-- sharing the same app/database. A user joins exactly one apartment either
-- by creating one (becomes owner) or by entering another owner's invite
-- code.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. APARTMENTS
--    One row per household. invite_code is the only way to join — it is
--    never guessable from the row's own id.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.apartments (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  invite_code  text        NOT NULL UNIQUE DEFAULT upper(encode(gen_random_bytes(4), 'hex')),
  owner_id     uuid        REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.apartments IS
  'One row per household sharing a parking spot. Joined via invite_code.';


-- ---------------------------------------------------------------------------
-- 2. PROFILES
--    One row per user, auto-created by the trigger below when auth.users
--    receives a new row from Supabase Auth sign-up. apartment_id starts
--    NULL — the app prompts new users to create or join an apartment.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id            uuid        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name     text        NOT NULL DEFAULT '',
  email         text        NOT NULL DEFAULT '',
  apartment_id  uuid        REFERENCES public.apartments (id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS
  'Public user data synced from auth.users on sign-up.';

-- profiles.apartment_id can only be set by the create_apartment /
-- join_apartment_by_invite_code functions below (SECURITY DEFINER, so they
-- bypass this grant). Without this, any signed-in client could UPDATE their
-- own row and set apartment_id to an arbitrary apartment id, joining any
-- household without ever knowing its invite code.
REVOKE UPDATE ON public.apartments FROM authenticated;
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name) ON public.profiles TO authenticated;

-- Now that apartments exists, apartments.owner_id can reference it too —
-- add the reciprocal FK from apartments back to profiles.
ALTER TABLE public.apartments DROP CONSTRAINT IF EXISTS apartments_owner_id_fkey;
ALTER TABLE public.apartments
  ADD CONSTRAINT apartments_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES public.profiles (id) ON DELETE SET NULL;


-- ---------------------------------------------------------------------------
-- 3. PARKING SESSIONS
--    One row = one time a roommate is actively using their apartment's spot.
--    The one-active-session-per-apartment constraint (section 8) prevents
--    overlap within an apartment, while letting every apartment run
--    independently of every other one.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.parking_sessions (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id      uuid        NOT NULL REFERENCES public.apartments (id) ON DELETE CASCADE,
  user_id           uuid        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  start_time        timestamptz NOT NULL DEFAULT now(),
  planned_end_time  timestamptz,
  actual_end_time   timestamptz,
  status            text        NOT NULL DEFAULT 'active',
  note              text,
  created_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT parking_sessions_status_check
    CHECK (status IN ('active', 'finished', 'cancelled'))
);

COMMENT ON TABLE public.parking_sessions IS
  'Each row represents one parking usage period within one apartment.';


-- ---------------------------------------------------------------------------
-- 4. PARKING QUEUE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.parking_queue (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id  uuid        NOT NULL REFERENCES public.apartments (id) ON DELETE CASCADE,
  user_id       uuid        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  joined_at     timestamptz NOT NULL DEFAULT now(),
  status        text        NOT NULL DEFAULT 'waiting',

  CONSTRAINT parking_queue_status_check
    CHECK (status IN ('waiting', 'served', 'cancelled'))
);

COMMENT ON TABLE public.parking_queue IS
  'Queue of roommates waiting for their apartment''s parking spot.';


-- ---------------------------------------------------------------------------
-- 5. PARKING REQUESTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.parking_requests (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id  uuid        NOT NULL REFERENCES public.apartments (id) ON DELETE CASCADE,
  user_id       uuid        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  start_time    timestamptz NOT NULL,
  end_time      timestamptz NOT NULL,
  note          text,
  status        text        NOT NULL DEFAULT 'planned',
  created_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT parking_requests_status_check
    CHECK (status IN ('planned', 'done', 'cancelled')),
  CONSTRAINT parking_requests_time_check
    CHECK (end_time > start_time)
);

COMMENT ON TABLE public.parking_requests IS
  'Pre-planned future parking bookings within one apartment.';


-- ---------------------------------------------------------------------------
-- 6. NOTIFICATIONS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id  uuid        NOT NULL REFERENCES public.apartments (id) ON DELETE CASCADE,
  user_id       uuid        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title         text        NOT NULL,
  message       text        NOT NULL,
  is_read       boolean     NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.notifications IS
  'Per-user notification inbox.';


-- =============================================================================
-- 7. INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_apartment_id ON public.profiles (apartment_id);

CREATE INDEX IF NOT EXISTS idx_parking_sessions_apartment_id ON public.parking_sessions (apartment_id);
CREATE INDEX IF NOT EXISTS idx_parking_sessions_status ON public.parking_sessions (status);
CREATE INDEX IF NOT EXISTS idx_parking_sessions_user_id ON public.parking_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_parking_sessions_start_time ON public.parking_sessions (start_time DESC);

CREATE INDEX IF NOT EXISTS idx_parking_queue_apartment_id ON public.parking_queue (apartment_id);
CREATE INDEX IF NOT EXISTS idx_parking_queue_status ON public.parking_queue (status);

CREATE INDEX IF NOT EXISTS idx_parking_requests_apartment_id ON public.parking_requests (apartment_id);
CREATE INDEX IF NOT EXISTS idx_parking_requests_start_time ON public.parking_requests (start_time);
CREATE INDEX IF NOT EXISTS idx_parking_requests_user_id ON public.parking_requests (user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id_unread
  ON public.notifications (user_id, is_read)
  WHERE is_read = false;


-- =============================================================================
-- 8. ONE ACTIVE PARKING SESSION PER APARTMENT
--    A partial unique index on apartment_id. Because only rows WHERE
--    status = 'active' enter the index, and it's unique per apartment_id,
--    each apartment can have at most one active session at a time — while
--    every other apartment runs completely independently.
-- =============================================================================
DROP INDEX IF EXISTS idx_one_active_session;

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_session_per_apartment
  ON public.parking_sessions (apartment_id)
  WHERE status = 'active';


-- =============================================================================
-- 9. HELPER FUNCTIONS
-- =============================================================================

-- Returns the caller's apartment_id. SECURITY DEFINER so RLS policies that
-- use it (including profiles' own policy) don't re-trigger RLS on profiles
-- and cause "infinite recursion detected in policy" errors.
CREATE OR REPLACE FUNCTION public.my_apartment_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT apartment_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Creates a new apartment owned by the caller and joins them to it
-- atomically. This is the only way apartments.owner_id / profiles.
-- apartment_id get set for a brand-new household.
CREATE OR REPLACE FUNCTION public.create_apartment(apartment_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.apartments (name, owner_id)
  VALUES (apartment_name, auth.uid())
  RETURNING id INTO new_id;

  UPDATE public.profiles SET apartment_id = new_id WHERE id = auth.uid();
  RETURN new_id;
END;
$$;

-- Joins the caller to an existing apartment. The invite code is the only
-- credential checked — this is the sole path that can set profiles.
-- apartment_id to an apartment the caller didn't create.
CREATE OR REPLACE FUNCTION public.join_apartment_by_invite_code(code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id INTO target_id FROM public.apartments WHERE invite_code = upper(code);
  IF target_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  UPDATE public.profiles SET apartment_id = target_id WHERE id = auth.uid();
  RETURN target_id;
END;
$$;


-- =============================================================================
-- 10. ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.apartments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_queue     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications     ENABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------------
-- apartments policies
-- No client-side INSERT/UPDATE policy on purpose — creation and ownership
-- changes only happen through the SECURITY DEFINER functions above.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "apartments: members can read own apartment" ON public.apartments;
CREATE POLICY "apartments: members can read own apartment"
  ON public.apartments FOR SELECT
  TO authenticated
  USING (id = public.my_apartment_id());


-- ---------------------------------------------------------------------------
-- profiles policies
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles: authenticated users can read all" ON public.profiles;
DROP POLICY IF EXISTS "profiles: members can read own apartment" ON public.profiles;
CREATE POLICY "profiles: members can read own apartment"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR apartment_id = public.my_apartment_id());

DROP POLICY IF EXISTS "profiles: users can insert own row" ON public.profiles;
CREATE POLICY "profiles: users can insert own row"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles: users can update own row" ON public.profiles;
CREATE POLICY "profiles: users can update own row"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- ---------------------------------------------------------------------------
-- parking_sessions policies
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "parking_sessions: authenticated users can read all" ON public.parking_sessions;
DROP POLICY IF EXISTS "parking_sessions: members can read own apartment" ON public.parking_sessions;
CREATE POLICY "parking_sessions: members can read own apartment"
  ON public.parking_sessions FOR SELECT
  TO authenticated
  USING (apartment_id = public.my_apartment_id());

DROP POLICY IF EXISTS "parking_sessions: users can insert own rows" ON public.parking_sessions;
CREATE POLICY "parking_sessions: users can insert own rows"
  ON public.parking_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND apartment_id = public.my_apartment_id());

DROP POLICY IF EXISTS "parking_sessions: users can update own rows" ON public.parking_sessions;
CREATE POLICY "parking_sessions: users can update own rows"
  ON public.parking_sessions FOR UPDATE
  TO authenticated
  USING (apartment_id = public.my_apartment_id())
  WITH CHECK (apartment_id = public.my_apartment_id());


-- ---------------------------------------------------------------------------
-- parking_queue policies
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "parking_queue: authenticated users can read all" ON public.parking_queue;
DROP POLICY IF EXISTS "parking_queue: members can read own apartment" ON public.parking_queue;
CREATE POLICY "parking_queue: members can read own apartment"
  ON public.parking_queue FOR SELECT
  TO authenticated
  USING (apartment_id = public.my_apartment_id());

DROP POLICY IF EXISTS "parking_queue: users can insert own rows" ON public.parking_queue;
CREATE POLICY "parking_queue: users can insert own rows"
  ON public.parking_queue FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND apartment_id = public.my_apartment_id());

DROP POLICY IF EXISTS "parking_queue: users can update own rows" ON public.parking_queue;
CREATE POLICY "parking_queue: users can update own rows"
  ON public.parking_queue FOR UPDATE
  TO authenticated
  USING (apartment_id = public.my_apartment_id())
  WITH CHECK (apartment_id = public.my_apartment_id());


-- ---------------------------------------------------------------------------
-- parking_requests policies
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "parking_requests: authenticated users can read all" ON public.parking_requests;
DROP POLICY IF EXISTS "parking_requests: members can read own apartment" ON public.parking_requests;
CREATE POLICY "parking_requests: members can read own apartment"
  ON public.parking_requests FOR SELECT
  TO authenticated
  USING (apartment_id = public.my_apartment_id());

DROP POLICY IF EXISTS "parking_requests: users can insert own rows" ON public.parking_requests;
CREATE POLICY "parking_requests: users can insert own rows"
  ON public.parking_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND apartment_id = public.my_apartment_id());

DROP POLICY IF EXISTS "parking_requests: users can update own rows" ON public.parking_requests;
CREATE POLICY "parking_requests: users can update own rows"
  ON public.parking_requests FOR UPDATE
  TO authenticated
  USING (apartment_id = public.my_apartment_id())
  WITH CHECK (apartment_id = public.my_apartment_id());


-- ---------------------------------------------------------------------------
-- notifications policies
-- Notifications are personal — users see only their own.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "notifications: users can read own" ON public.notifications;
CREATE POLICY "notifications: users can read own"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications: users can insert own" ON public.notifications;
CREATE POLICY "notifications: users can insert own"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND apartment_id = public.my_apartment_id());

DROP POLICY IF EXISTS "notifications: users can update own" ON public.notifications;
CREATE POLICY "notifications: users can update own"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- =============================================================================
-- 11. AUTO-CREATE PROFILE TRIGGER
--    Fires after every INSERT on auth.users (i.e. every new sign-up).
--    If the sign-up form supplied an invite_code (see RequestService /
--    LoginScreen), the new profile is joined to that apartment immediately
--    — no separate join_apartment_by_invite_code call needed for that case.
--    SECURITY DEFINER lets it bypass RLS so it can write to profiles even
--    though the session belongs to the brand-new (not yet "authenticated") user.
--    search_path is pinned to public to prevent search-path injection.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  matched_apartment_id uuid;
BEGIN
  IF NEW.raw_user_meta_data ->> 'invite_code' IS NOT NULL THEN
    SELECT id INTO matched_apartment_id
    FROM public.apartments
    WHERE invite_code = upper(NEW.raw_user_meta_data ->> 'invite_code');
  END IF;

  INSERT INTO public.profiles (id, full_name, email, apartment_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.email, ''),
    matched_apartment_id
  )
  ON CONFLICT (id) DO NOTHING;  -- idempotent: safe to re-run
  RETURN NEW;
END;
$$;

-- Drop and recreate so re-running the script is safe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- =============================================================================
-- 12. HISTORY RETENTION (optional)
--    The app itself only ever queries the last 30 days of parking_sessions
--    history (see ParkingRepository.getHistory), so nothing needs deleting
--    for the app to behave correctly. This function additionally purges
--    rows older than that from the database, for households that want to
--    actually free up storage / limit data retention rather than just hide
--    old rows from the UI.
--
--    Not scheduled automatically — enable the pg_cron block below only if
--    your Supabase project has the pg_cron extension available (Pro plan+).
-- =============================================================================
CREATE OR REPLACE FUNCTION public.purge_old_parking_history()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.parking_sessions
  WHERE status IN ('finished', 'cancelled')
    AND start_time < now() - interval '30 days';
$$;

-- To schedule this nightly, run once (requires the pg_cron extension):
--
--   CREATE EXTENSION IF NOT EXISTS pg_cron;
--   SELECT cron.schedule(
--     'purge-old-parking-history',
--     '0 3 * * *',
--     $$ SELECT public.purge_old_parking_history(); $$
--   );
