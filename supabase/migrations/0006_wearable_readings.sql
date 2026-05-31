-- =====================================================================================
-- FORGE MIGRATION 0006 — TABLE wearable_readings
-- Persiste l'historique des donnees physiologiques des montres connectees
-- Structure alignee sur RawWearableDataSchema (schemas.ts)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS public.wearable_readings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Source de la donnee (aligne sur RawWearableDataSchema.source)
  source       TEXT NOT NULL CHECK (source IN ('apple', 'garmin', 'whoop', 'manual')),
  recorded_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Cardio
  hrv_ms          NUMERIC(6,2) CONSTRAINT check_hrv_range     CHECK (hrv_ms IS NULL OR (hrv_ms >= 0 AND hrv_ms <= 300)),
  resting_hr      NUMERIC(5,1) CONSTRAINT check_hr_range      CHECK (resting_hr IS NULL OR (resting_hr >= 30 AND resting_hr <= 150)),

  -- Sommeil
  sleep_total_minutes  INTEGER CONSTRAINT check_sleep_total CHECK (sleep_total_minutes IS NULL OR (sleep_total_minutes >= 0 AND sleep_total_minutes <= 1440)),
  sleep_deep_minutes   INTEGER CONSTRAINT check_sleep_deep  CHECK (sleep_deep_minutes IS NULL OR (sleep_deep_minutes >= 0 AND sleep_deep_minutes <= 720)),
  sleep_rem_minutes    INTEGER CONSTRAINT check_sleep_rem   CHECK (sleep_rem_minutes IS NULL OR (sleep_rem_minutes >= 0 AND sleep_rem_minutes <= 720)),

  -- Scores synthetiques
  readiness_score NUMERIC(5,2) CONSTRAINT check_readiness CHECK (readiness_score IS NULL OR (readiness_score >= 0 AND readiness_score <= 100)),
  stress_score    NUMERIC(5,2) CONSTRAINT check_stress    CHECK (stress_score IS NULL OR (stress_score >= 0 AND stress_score <= 100)),

  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index O(1) pour recuperer les 7 derniers jours d'un utilisateur
CREATE INDEX idx_wearable_readings_user_date ON public.wearable_readings(user_id, recorded_at DESC);

-- RLS : lecture et ecriture strictement limitees au user_id concerne
ALTER TABLE public.wearable_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wearable readings"
  ON public.wearable_readings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wearable readings"
  ON public.wearable_readings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wearable readings"
  ON public.wearable_readings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Pas de DELETE policy : soft delete via recorded_at (les donnees physiologiques sont precieuses pour Banister)
