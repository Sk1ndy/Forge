-- =====================================================================================
-- FORGE MASTER SCHEMA (0000)
-- A unified, secure, and highly optimized schema for the Forge application.
-- =====================================================================================

-- ─────────────────────────────────────────────────────────────────────────────────
-- 0. CLEANUP (Drop existing tables to ensure a clean reset)
-- ─────────────────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.exercise_logs CASCADE;
DROP TABLE IF EXISTS public.workout_sessions CASCADE;
DROP TABLE IF EXISTS public.blueprints CASCADE;
DROP TABLE IF EXISTS public.exercises CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────────
-- 1. USERS (Profiles)
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    pdc NUMERIC DEFAULT 75 CONSTRAINT check_pdc_positive CHECK (pdc > 0),
    pr_squat NUMERIC DEFAULT 100,
    pr_bench NUMERIC DEFAULT 80,
    pr_deadlift NUMERIC DEFAULT 120,
    pr_ohp NUMERIC DEFAULT 50,
    max_snc NUMERIC DEFAULT 15.0 CONSTRAINT check_max_snc_positive CHECK (max_snc >= 0),
    age INTEGER DEFAULT 28 CONSTRAINT check_age_positive CHECK (age > 0),
    sleep_hours NUMERIC DEFAULT 8,
    caloric_status TEXT DEFAULT 'maintenance',
    stress_level TEXT DEFAULT 'moderate',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────────────────────────
-- 2. EXERCISES (Library)
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.exercises (
    id TEXT PRIMARY KEY,
    nom TEXT NOT NULL,
    tier_snc INTEGER NOT NULL,
    muscle_primaire TEXT NOT NULL,
    muscles_secondaires TEXT[] NOT NULL DEFAULT '{}',
    equipment TEXT NOT NULL,
    tension_matrix JSONB NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
-- Global library: everyone can read, only service_role (admins) can insert/update/delete.
CREATE POLICY "Allow public read access to exercises" ON public.exercises FOR SELECT USING (true);

-- ─────────────────────────────────────────────────────────────────────────────────
-- 3. BLUEPRINTS (Planning)
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.blueprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    state JSONB NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Constraint for Composite Foreign Keys
    CONSTRAINT blueprints_id_user_id_key UNIQUE (id, user_id)
);

CREATE INDEX idx_blueprints_user_id ON public.blueprints(user_id);

ALTER TABLE public.blueprints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own non-deleted blueprints" ON public.blueprints FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);
CREATE POLICY "Users can insert their own blueprints" ON public.blueprints FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own blueprints" ON public.blueprints FOR UPDATE USING (auth.uid() = user_id AND deleted_at IS NULL) WITH CHECK (auth.uid() = user_id AND deleted_at IS NULL);
-- SEC: Hard delete removed (only soft delete via update is allowed)

-- ─────────────────────────────────────────────────────────────────────────────────
-- 4. WORKOUT SESSIONS (Séances)
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    blueprint_id UUID,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    total_tonnage NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Constraint for Dates
    CONSTRAINT check_session_dates CHECK (ended_at IS NULL OR ended_at >= started_at),
    -- Composite Key constraint for downstream Exercise Logs
    CONSTRAINT workout_sessions_id_user_id_key UNIQUE (id, user_id),
    -- Composite Foreign Key to Blueprint
    CONSTRAINT workout_sessions_blueprint_id_user_id_fkey FOREIGN KEY (blueprint_id, user_id) REFERENCES public.blueprints(id, user_id) ON DELETE SET NULL
);

CREATE INDEX idx_workout_sessions_user_id ON public.workout_sessions(user_id);

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
-- Using Pure O(1) policies thanks to Composite FKs
CREATE POLICY "Users can view their own sessions" ON public.workout_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sessions" ON public.workout_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sessions" ON public.workout_sessions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sessions" ON public.workout_sessions FOR DELETE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────────
-- 5. EXERCISE LOGS (Séries)
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.exercise_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL REFERENCES public.exercises(id),
    day TEXT NOT NULL,
    week INTEGER DEFAULT 1,
    set_index INTEGER NOT NULL,
    planned_weight NUMERIC CONSTRAINT check_planned_weight_positive CHECK (planned_weight IS NULL OR planned_weight >= 0),
    planned_reps INTEGER CONSTRAINT check_planned_reps_positive CHECK (planned_reps IS NULL OR planned_reps >= 0),
    planned_rpe NUMERIC CONSTRAINT check_planned_rpe_range CHECK (planned_rpe IS NULL OR (planned_rpe >= 0 AND planned_rpe <= 10)),
    actual_weight NUMERIC CONSTRAINT check_actual_weight_positive CHECK (actual_weight IS NULL OR actual_weight >= 0),
    actual_reps INTEGER CONSTRAINT check_actual_reps_positive CHECK (actual_reps IS NULL OR actual_reps >= 0),
    actual_rpe NUMERIC CONSTRAINT check_actual_rpe_range CHECK (actual_rpe IS NULL OR (actual_rpe >= 0 AND actual_rpe <= 10)),
    is_completed BOOLEAN DEFAULT true,
    skipped_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Composite Foreign Key to Workout Session
    CONSTRAINT exercise_logs_session_id_user_id_fkey FOREIGN KEY (session_id, user_id) REFERENCES public.workout_sessions(id, user_id) ON DELETE CASCADE
);

CREATE INDEX idx_exercise_logs_user_id ON public.exercise_logs(user_id);
CREATE INDEX idx_exercise_logs_session_id ON public.exercise_logs(session_id);
CREATE INDEX idx_exercise_logs_exercise_id ON public.exercise_logs(exercise_id);
-- Compound index for fast 6-week queries by the Engine
CREATE INDEX IF NOT EXISTS idx_exercise_logs_user_date ON public.exercise_logs(user_id, created_at DESC);

ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;
-- Using Pure O(1) policies thanks to Composite FKs
CREATE POLICY "Users can view their own logs" ON public.exercise_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own logs" ON public.exercise_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own logs" ON public.exercise_logs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own logs" ON public.exercise_logs FOR DELETE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────────
-- 6. TRIGGERS (Automatisations Backend)
-- ─────────────────────────────────────────────────────────────────────────────────
-- Incremental (Delta) trigger function O(1)
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
