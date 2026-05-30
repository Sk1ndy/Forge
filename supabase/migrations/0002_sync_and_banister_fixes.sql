-- =====================================================================================
-- FORGE SYNC & BANISTER FIXES (0002)
-- Applies Offline-First sync optimizations and strict Soft-Delete cascading.
-- =====================================================================================

-- ─────────────────────────────────────────────────────────────────────────────────
-- 1. OFFLINE-FIRST: AJOUT DES TIMESTAMPS `updated_at`
-- ─────────────────────────────────────────────────────────────────────────────────
-- Ajout des colonnes pour la synchro delta
ALTER TABLE public.workout_sessions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.exercise_logs ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Fonction générique pour mettre à jour le timestamp automatiquement
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Application des triggers
CREATE TRIGGER trigger_workout_sessions_updated_at
    BEFORE UPDATE ON public.workout_sessions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trigger_exercise_logs_updated_at
    BEFORE UPDATE ON public.exercise_logs
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────────
-- 2. BANISTER SAFETY: CASCADE SOFT-DELETE
-- ─────────────────────────────────────────────────────────────────────────────────
-- Si une séance est supprimée (soft-delete), ses séries doivent disparaître avec elle
CREATE OR REPLACE FUNCTION public.cascade_soft_delete_session()
RETURNS TRIGGER AS $$
BEGIN
    -- Si deleted_at vient de passer à NOT NULL
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
        UPDATE public.exercise_logs
        SET deleted_at = NEW.deleted_at
        WHERE session_id = NEW.id;
    END IF;
    
    -- Si la séance est restaurée (deleted_at passe à NULL)
    IF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
        UPDATE public.exercise_logs
        SET deleted_at = NULL
        WHERE session_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_cascade_soft_delete_session
    AFTER UPDATE OF deleted_at ON public.workout_sessions
    FOR EACH ROW EXECUTE FUNCTION public.cascade_soft_delete_session();

-- ─────────────────────────────────────────────────────────────────────────────────
-- 3. OPTIMISATIONS MÉTIER (BIOMÉCANIQUE)
-- ─────────────────────────────────────────────────────────────────────────────────
-- Ajout de la catégorie PPL pour les requêtes analytiques Web
ALTER TABLE public.exercises ADD COLUMN ppl_category TEXT;

-- Ajout du RPE de séance global (sRPE) pour le calcul de charge
ALTER TABLE public.workout_sessions 
    ADD COLUMN session_rpe NUMERIC,
    ADD CONSTRAINT check_session_rpe_range CHECK (session_rpe IS NULL OR (session_rpe >= 0 AND session_rpe <= 10));
