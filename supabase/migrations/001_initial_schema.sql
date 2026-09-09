-- ============================================================
-- Kumo Habits by NotoshaDev: Initial Schema Migration
-- Supabase / PostgreSQL
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username     TEXT        UNIQUE,
  display_name TEXT,
  avatar_url   TEXT,
  level        INT         NOT NULL DEFAULT 1,
  xp           BIGINT      NOT NULL DEFAULT 0,
  timezone     TEXT        NOT NULL DEFAULT 'UTC',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: habits
-- ============================================================
CREATE TABLE IF NOT EXISTS public.habits (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        VARCHAR(80)  NOT NULL,
  category    VARCHAR(50),
  color_hex   VARCHAR(7)   NOT NULL DEFAULT '#10B981',
  icon_key    VARCHAR(50)  NOT NULL DEFAULT 'star',
  position    INT          NOT NULL DEFAULT 0,
  is_archived BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: habit_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id   UUID        NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date       DATE        NOT NULL,
  completed  BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Idempotent UPSERT guarantee: one log per habit per day
  CONSTRAINT habit_logs_habit_date_unique UNIQUE (habit_id, date)
);

-- ============================================================
-- TABLE: monthly_goals
-- ============================================================
CREATE TABLE IF NOT EXISTS public.monthly_goals (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  year      INT         NOT NULL,
  month     INT         NOT NULL CHECK (month BETWEEN 1 AND 12),
  title     TEXT        NOT NULL,
  completed BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES — B-Tree composite for high-volume reads
-- ============================================================

-- Primary query pattern: fetch all logs for a user in a date range
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date
  ON public.habit_logs (user_id, date DESC);

-- Secondary pattern: fetch logs for a specific habit over time
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date
  ON public.habit_logs (habit_id, date DESC);

-- Active habits per user (most common list query)
CREATE INDEX IF NOT EXISTS idx_habits_user_active
  ON public.habits (user_id, position)
  WHERE is_archived = FALSE;

-- Monthly goals lookup
CREATE INDEX IF NOT EXISTS idx_monthly_goals_user_year_month
  ON public.monthly_goals (user_id, year, month);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- profiles --
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: insert via trigger only"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- habits --
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "habits: users can view own habits"
  ON public.habits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "habits: users can insert own habits"
  ON public.habits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "habits: users can update own habits"
  ON public.habits FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "habits: users can delete own habits"
  ON public.habits FOR DELETE
  USING (auth.uid() = user_id);

-- habit_logs --
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "habit_logs: users can view own logs"
  ON public.habit_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "habit_logs: users can insert own logs"
  ON public.habit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "habit_logs: users can update own logs"
  ON public.habit_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "habit_logs: users can delete own logs"
  ON public.habit_logs FOR DELETE
  USING (auth.uid() = user_id);

-- monthly_goals --
ALTER TABLE public.monthly_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "monthly_goals: users can view own goals"
  ON public.monthly_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "monthly_goals: users can insert own goals"
  ON public.monthly_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "monthly_goals: users can update own goals"
  ON public.monthly_goals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "monthly_goals: users can delete own goals"
  ON public.monthly_goals FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: Auto-create profile and starter habits on new user
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Create User Profile
  INSERT INTO public.profiles (id, display_name, avatar_url, timezone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC')
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Seed Default Starter Habits
  INSERT INTO public.habits (user_id, name, category, color_hex, icon_key, position)
  VALUES
    (NEW.id, 'Meditación', 'Bienestar', '#10B981', 'brain', 0),
    (NEW.id, 'Ejercicio', 'Salud', '#EC4899', 'dumbbell', 1),
    (NEW.id, 'Lectura', 'Enfoque', '#06B6D4', 'book-open', 2)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users (fires after INSERT)
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- HELPER FUNCTION: updated_at auto-updater
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- PERMISSIONS & GRANTS
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated;
