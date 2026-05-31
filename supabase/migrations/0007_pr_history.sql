-- =====================================================================================
-- FORGE MIGRATION 0007 — TABLE pr_history
-- Persiste l'historique des PRs (1RM estimes et reels) par utilisateur et exercice
-- Supporte le tracking de force pour l'evolution temporelle (Screen E.1)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS public.pr_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id  TEXT NOT NULL REFERENCES public.exercises(id),

  -- PR estime par le moteur via estimate1RM()
  estimated_1rm   NUMERIC(7,2) CONSTRAINT check_estimated_1rm CHECK (estimated_1rm IS NULL OR (estimated_1rm >= 0 AND estimated_1rm <= 2000)),

  -- Donnees brutes qui ont permis l'estimation
  actual_weight   NUMERIC(7,2) CONSTRAINT check_actual_weight CHECK (actual_weight IS NULL OR actual_weight >= 0),
  actual_reps     INTEGER      CONSTRAINT check_actual_reps   CHECK (actual_reps IS NULL OR (actual_reps >= 1 AND actual_reps <= 100)),

  -- Formule utilisee pour le calcul
  formula_used    TEXT CHECK (formula_used IN ('epley', 'brzycki', 'manual', 'estimated')),

  -- Source de la saisie
  source          TEXT DEFAULT 'engine' CHECK (source IN ('engine', 'manual', 'calibrator')),

  recorded_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour requetes par utilisateur et exercice (courbe de progression)
CREATE INDEX idx_pr_history_user_exercise ON public.pr_history(user_id, exercise_id, recorded_at DESC);

-- RLS
ALTER TABLE public.pr_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pr history"
  ON public.pr_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pr history"
  ON public.pr_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Pas de UPDATE : les PRs sont immuables (audit trail de la progression)
-- Pas de DELETE : les PRs sont immuables (modele de Banister depend de l'historique)
