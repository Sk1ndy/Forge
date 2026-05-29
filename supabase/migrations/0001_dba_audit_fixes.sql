-- =====================================================================================
-- FORGE DBA AUDIT FIXES (0001)
-- Applies critical security, integrity, and performance fixes.
-- =====================================================================================

-- ─────────────────────────────────────────────────────────────────────────────────
-- 1. SOFT DELETE SUR LES SESSIONS ET LOGS (Protection de l'historique de Banister)
-- ─────────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.workout_sessions ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.exercise_logs ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

-- Remplacement des politiques DELETE (blocage) et SELECT (filtre)
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.workout_sessions;
CREATE POLICY "Users can view their own sessions" ON public.workout_sessions 
    FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.workout_sessions;
-- Suppression physique interdite (aucune policy DELETE recréée)

DROP POLICY IF EXISTS "Users can view their own logs" ON public.exercise_logs;
CREATE POLICY "Users can view their own logs" ON public.exercise_logs 
    FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can delete their own logs" ON public.exercise_logs;
-- Suppression physique interdite

-- ─────────────────────────────────────────────────────────────────────────────────
-- 2. TRIGGER DE SYNCHRONISATION AUTH -> USERS (Intégrité des profils)
-- ─────────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, pdc, max_snc)
  VALUES (new.id, 75, 15.0);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existait déjà pour être idempotent
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────────
-- 3. INDEXATION PERFORMANTE (Élimination des Full Table Scans)
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE INDEX idx_workout_sessions_blueprint ON public.workout_sessions(blueprint_id, user_id);
CREATE INDEX idx_exercises_tension_matrix ON public.exercises USING GIN (tension_matrix);
CREATE INDEX idx_blueprints_state ON public.blueprints USING GIN (state);

-- ─────────────────────────────────────────────────────────────────────────────────
-- 4. OPTIMISATIONS DE TYPES ET CONTRAINTES STRICTES
-- ─────────────────────────────────────────────────────────────────────────────────
-- Transformation du texte libre en ENUM strict pour les jours
CREATE TYPE public.day_of_week AS ENUM ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');

-- Note: USING permet de caster le texte existant vers l'ENUM s'il est valide
ALTER TABLE public.exercise_logs 
  ALTER COLUMN day TYPE public.day_of_week USING day::public.day_of_week,
  ADD CONSTRAINT check_week_positive CHECK (week > 0);

-- Optimisation de la mémoire (INTEGER -> SMALLINT)
ALTER TABLE public.exercises ALTER COLUMN tier_snc TYPE SMALLINT;
ALTER TABLE public.exercise_logs ALTER COLUMN set_index TYPE SMALLINT;

-- Contrainte de sécurité sur le tier SNC
ALTER TABLE public.exercises ADD CONSTRAINT check_tier_snc CHECK (tier_snc BETWEEN 1 AND 3);
