-- =============================================================================
-- Parking Roommates – Database Schema
-- Run this once in: Supabase Dashboard → SQL Editor → New Query → Run
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE / DROP IF EXISTS throughout.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. PROFILES
--    One row per user, auto-created by the trigger below when auth.users
--    receives a new row from Supabase Auth sign-up.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name   text        NOT NULL DEFAULT '',
  email       text        NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS
  'Public user data synced from auth.users on sign-up.';


-- ---------------------------------------------------------------------------
-- 2. PARKING SESSIONS
--    One row = one time a roommate is actively using the parking spot.
--    The one-active-session constraint (section 7) prevents overlap.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.parking_sessions (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
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
  'Each row represents one parking usage period.';


-- ---------------------------------------------------------------------------
-- 3. PARKING QUEUE
--    Roommates waiting for the spot to become free join this queue.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.parking_queue (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  joined_at  timestamptz NOT NULL DEFAULT now(),
  status     text        NOT NULL DEFAULT 'waiting',

  CONSTRAINT parking_queue_status_check
    CHECK (status IN ('waiting', 'served', 'cancelled'))
);

COMMENT ON TABLE public.parking_queue IS
  'Queue of roommates waiting for the parking spot.';


-- ---------------------------------------------------------------------------
-- 4. PARKING REQUESTS
--    Pre-planned future bookings (e.g. "I need the spot Thursday 8-10am").
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.parking_requests (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  start_time  timestamptz NOT NULL,
  end_time    timestamptz NOT NULL,
  note        text,
  status      text        NOT NULL DEFAULT 'planned',
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT parking_requests_status_check
    CHECK (status IN ('planned', 'done', 'cancelled')),
  CONSTRAINT parking_requests_time_check
    CHECK (end_time > start_time)
);

COMMENT ON TABLE public.parking_requests IS
  'Pre-planned future parking bookings.';


-- ---------------------------------------------------------------------------
-- 5. NOTIFICATIONS
--    Per-user notification feed (e.g. "Your turn in the queue!").
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title       text        NOT NULL,
  message     text        NOT NULL,
  is_read     boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.notifications IS
  'Per-user notification inbox.';


-- =============================================================================
-- 6. INDEXES
-- =============================================================================

-- parking_sessions
CREATE INDEX IF NOT EXISTS idx_parking_sessions_status
  ON public.parking_sessions (status);

CREATE INDEX IF NOT EXISTS idx_parking_sessions_user_id
  ON public.parking_sessions (user_id);

CREATE INDEX IF NOT EXISTS idx_parking_sessions_start_time
  ON public.parking_sessions (start_time DESC);

-- parking_queue
CREATE INDEX IF NOT EXISTS idx_parking_queue_status
  ON public.parking_queue (status);

-- parking_requests
CREATE INDEX IF NOT EXISTS idx_parking_requests_start_time
  ON public.parking_requests (start_time);

CREATE INDEX IF NOT EXISTS idx_parking_requests_user_id
  ON public.parking_requests (user_id);

-- notifications (most common read pattern: all unread for a user)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_unread
  ON public.notifications (user_id, is_read)
  WHERE is_read = false;


-- =============================================================================
-- 7. ONE ACTIVE PARKING SESSION CONSTRAINT
--    A partial unique index on a constant expression.
--    Only rows WHERE status = 'active' enter the index. Because every such row
--    maps to the same constant value (1), the UNIQUE constraint allows at most
--    one row in that set → only one active session can exist at any time.
-- =============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_session
  ON public.parking_sessions ((1))
  WHERE status = 'active';


-- =============================================================================
-- 8. ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_queue     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications     ENABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------------
-- profiles policies
-- DROP IF EXISTS before each CREATE makes the script idempotent.
-- PostgreSQL does not support CREATE POLICY IF NOT EXISTS.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles: authenticated users can read all" ON public.profiles;
CREATE POLICY "profiles: authenticated users can read all"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

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
CREATE POLICY "parking_sessions: authenticated users can read all"
  ON public.parking_sessions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "parking_sessions: users can insert own rows" ON public.parking_sessions;
CREATE POLICY "parking_sessions: users can insert own rows"
  ON public.parking_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "parking_sessions: users can update own rows" ON public.parking_sessions;
CREATE POLICY "parking_sessions: users can update own rows"
  ON public.parking_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- parking_queue policies
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "parking_queue: authenticated users can read all" ON public.parking_queue;
CREATE POLICY "parking_queue: authenticated users can read all"
  ON public.parking_queue FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "parking_queue: users can insert own rows" ON public.parking_queue;
CREATE POLICY "parking_queue: users can insert own rows"
  ON public.parking_queue FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "parking_queue: users can update own rows" ON public.parking_queue;
CREATE POLICY "parking_queue: users can update own rows"
  ON public.parking_queue FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- parking_requests policies
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "parking_requests: authenticated users can read all" ON public.parking_requests;
CREATE POLICY "parking_requests: authenticated users can read all"
  ON public.parking_requests FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "parking_requests: users can insert own rows" ON public.parking_requests;
CREATE POLICY "parking_requests: users can insert own rows"
  ON public.parking_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "parking_requests: users can update own rows" ON public.parking_requests;
CREATE POLICY "parking_requests: users can update own rows"
  ON public.parking_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


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
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications: users can update own" ON public.notifications;
CREATE POLICY "notifications: users can update own"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- =============================================================================
-- 9. AUTO-CREATE PROFILE TRIGGER
--    Fires after every INSERT on auth.users (i.e. every new sign-up).
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
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.email, '')
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
