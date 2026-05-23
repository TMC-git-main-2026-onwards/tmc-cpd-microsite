-- ============================================================
-- TMC CPD Platform — initial schema
-- Run this in the Supabase SQL editor (dashboard → SQL Editor)
-- ============================================================


-- ============================================================
-- Tables
-- ============================================================

CREATE TABLE public.profiles (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                TEXT NOT NULL,
  full_name            TEXT,
  profession           TEXT,
  workplace            TEXT,
  hcpc_number          TEXT,
  marketing_consent    BOOLEAN NOT NULL DEFAULT false,
  marketing_consent_at TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.modules (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT UNIQUE NOT NULL,
  order_index      INT NOT NULL,
  title            TEXT NOT NULL,
  summary          TEXT,
  video_url        TEXT,
  duration_minutes INT,
  published        BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.module_completions (
  user_id      UUID        NOT NULL REFERENCES auth.users(id)     ON DELETE CASCADE,
  module_id    UUID        NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  quiz_score   NUMERIC(5,2),
  PRIMARY KEY (user_id, module_id)
);


-- ============================================================
-- Triggers
-- ============================================================

-- Auto-update profiles.updated_at on every row update
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();


-- Auto-create a profiles row when a new auth.users row is inserted.
-- Reads profession + marketing_consent out of raw_user_meta_data,
-- which is populated by the options.data payload in signUp / signInWithOtp.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    profession,
    marketing_consent,
    marketing_consent_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'profession',
    COALESCE((NEW.raw_user_meta_data->>'marketing_consent')::boolean, false),
    CASE
      WHEN (NEW.raw_user_meta_data->>'marketing_consent')::boolean = true THEN now()
      ELSE NULL
    END
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_completions ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- modules
CREATE POLICY "authenticated users read published modules"
  ON public.modules FOR SELECT
  USING (auth.role() = 'authenticated' AND published = true);

-- module_completions
CREATE POLICY "users read own completions"
  ON public.module_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users insert own completions"
  ON public.module_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
