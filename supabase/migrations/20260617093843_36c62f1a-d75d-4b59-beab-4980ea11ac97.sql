
-- Daily reflections
CREATE TABLE public.daily_reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reflection_date date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  transport_mode text,
  meals text,
  energy_mindful boolean DEFAULT false,
  water_mindful boolean DEFAULT false,
  waste_mindful boolean DEFAULT false,
  mood text,
  notes text,
  estimated_kg_co2_today numeric,
  ecosystem_delta numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, reflection_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_reflections TO authenticated;
GRANT ALL ON public.daily_reflections TO service_role;

ALTER TABLE public.daily_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own reflections"
  ON public.daily_reflections FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER daily_reflections_set_updated_at
  BEFORE UPDATE ON public.daily_reflections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Streaks
CREATE TABLE public.streaks (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_reflection_date date,
  total_reflections integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.streaks TO authenticated;
GRANT ALL ON public.streaks TO service_role;

ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own streak"
  ON public.streaks FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER streaks_set_updated_at
  BEFORE UPDATE ON public.streaks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Streak upsert helper
CREATE OR REPLACE FUNCTION public.upsert_streak_for_user(_user_id uuid, _today date)
RETURNS public.streaks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing public.streaks;
  new_current integer;
  new_longest integer;
BEGIN
  SELECT * INTO existing FROM public.streaks WHERE user_id = _user_id;

  IF NOT FOUND THEN
    INSERT INTO public.streaks (user_id, current_streak, longest_streak, last_reflection_date, total_reflections)
    VALUES (_user_id, 1, 1, _today, 1)
    RETURNING * INTO existing;
    RETURN existing;
  END IF;

  IF existing.last_reflection_date = _today THEN
    RETURN existing;
  ELSIF existing.last_reflection_date = _today - INTERVAL '1 day' THEN
    new_current := existing.current_streak + 1;
  ELSE
    new_current := 1;
  END IF;

  new_longest := GREATEST(existing.longest_streak, new_current);

  UPDATE public.streaks
  SET current_streak = new_current,
      longest_streak = new_longest,
      last_reflection_date = _today,
      total_reflections = existing.total_reflections + 1
  WHERE user_id = _user_id
  RETURNING * INTO existing;

  RETURN existing;
END;
$$;
