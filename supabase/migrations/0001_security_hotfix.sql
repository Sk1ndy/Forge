-- =====================================================================================
-- FORGE SECURITY HOTFIX (0001)
-- Patches IDORs, enhances data integrity constraints, and optimizes triggers.
-- =====================================================================================

-- ─────────────────────────────────────────────────────────────────────────────────
-- 1. BLUEPRINTS: Soft-Delete Bypass Fix
-- ─────────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can update their own blueprints" ON public.blueprints;
CREATE POLICY "Users can update their own blueprints" ON public.blueprints 
FOR UPDATE USING (auth.uid() = user_id AND deleted_at IS NULL) 
WITH CHECK (auth.uid() = user_id AND deleted_at IS NULL);

-- ─────────────────────────────────────────────────────────────────────────────────
-- 2. WORKOUT SESSIONS: IDOR Fix for Blueprint ID
-- ─────────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.workout_sessions;
CREATE POLICY "Users can insert their own sessions" ON public.workout_sessions 
FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    (blueprint_id IS NULL OR blueprint_id IN (SELECT id FROM public.blueprints WHERE user_id = auth.uid()))
);

DROP POLICY IF EXISTS "Users can update their own sessions" ON public.workout_sessions;
CREATE POLICY "Users can update their own sessions" ON public.workout_sessions 
FOR UPDATE USING (auth.uid() = user_id) 
WITH CHECK (
    auth.uid() = user_id AND 
    (blueprint_id IS NULL OR blueprint_id IN (SELECT id FROM public.blueprints WHERE user_id = auth.uid()))
);

-- ─────────────────────────────────────────────────────────────────────────────────
-- 3. EXERCISE LOGS: IDOR Fix & Math Constraints
-- ─────────────────────────────────────────────────────────────────────────────────
-- Drop existing insert/update policies to replace them with safer ones
DROP POLICY IF EXISTS "Users can insert their own logs" ON public.exercise_logs;
CREATE POLICY "Users can insert their own logs" ON public.exercise_logs 
FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    session_id IN (SELECT id FROM public.workout_sessions WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update their own logs" ON public.exercise_logs;
CREATE POLICY "Users can update their own logs" ON public.exercise_logs 
FOR UPDATE USING (auth.uid() = user_id) 
WITH CHECK (
    auth.uid() = user_id AND 
    session_id IN (SELECT id FROM public.workout_sessions WHERE user_id = auth.uid())
);

-- Add math integrity CHECK constraints (prevents RPE 15 or negative weights)
ALTER TABLE public.exercise_logs ADD CONSTRAINT check_rpe_range CHECK (actual_rpe >= 0 AND actual_rpe <= 10);
ALTER TABLE public.exercise_logs ADD CONSTRAINT check_weight_positive CHECK (actual_weight >= 0);
ALTER TABLE public.exercise_logs ADD CONSTRAINT check_reps_positive CHECK (actual_reps >= 0);

-- Create compound index for fast 6-week queries by the Engine
CREATE INDEX IF NOT EXISTS idx_exercise_logs_user_date ON public.exercise_logs(user_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────────
-- 4. TRIGGERS: O(1) Incremental Tonnage Update
-- ─────────────────────────────────────────────────────────────────────────────────
-- Drop the old O(N^2) trigger
DROP TRIGGER IF EXISTS trigger_update_session_tonnage ON public.exercise_logs;
DROP FUNCTION IF EXISTS public.update_session_tonnage();

-- Create a new incremental (Delta) trigger function
CREATE OR REPLACE FUNCTION public.incremental_session_tonnage()
RETURNS TRIGGER AS $$
DECLARE
    old_tonnage NUMERIC := 0;
    new_tonnage NUMERIC := 0;
BEGIN
    -- Calculate the tonnage contribution of the old row (if it was completed)
    IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') AND OLD.is_completed = true THEN
        old_tonnage := COALESCE(OLD.actual_weight * OLD.actual_reps, 0);
    END IF;

    -- Calculate the tonnage contribution of the new row (if it is completed)
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.is_completed = true THEN
        new_tonnage := COALESCE(NEW.actual_weight * NEW.actual_reps, 0);
    END IF;

    IF (TG_OP = 'DELETE') THEN
        UPDATE public.workout_sessions
        SET total_tonnage = total_tonnage - old_tonnage
        WHERE id = OLD.session_id;
        RETURN OLD;
    ELSIF (TG_OP = 'INSERT') THEN
        UPDATE public.workout_sessions
        SET total_tonnage = total_tonnage + new_tonnage
        WHERE id = NEW.session_id;
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF OLD.session_id = NEW.session_id THEN
            -- Same session, just apply the delta
            UPDATE public.workout_sessions
            SET total_tonnage = total_tonnage - old_tonnage + new_tonnage
            WHERE id = NEW.session_id;
        ELSE
            -- Session ID changed (log moved), subtract from old, add to new
            UPDATE public.workout_sessions
            SET total_tonnage = total_tonnage - old_tonnage
            WHERE id = OLD.session_id;
            
            UPDATE public.workout_sessions
            SET total_tonnage = total_tonnage + new_tonnage
            WHERE id = NEW.session_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_incremental_session_tonnage
AFTER INSERT OR UPDATE OF actual_weight, actual_reps, is_completed, session_id OR DELETE
ON public.exercise_logs
FOR EACH ROW
EXECUTE FUNCTION public.incremental_session_tonnage();
