-- Supabase Schema for Forge Mobile & Web

-- 1. Table: workout_sessions
-- Represents a single workout session performed by the user
CREATE TABLE IF NOT EXISTS public.workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    blueprint_id UUID REFERENCES public.blueprints(id) ON DELETE SET NULL, -- Optional link to a specific blueprint
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for workout_sessions
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for workout_sessions
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.workout_sessions;
CREATE POLICY "Users can insert their own sessions" 
    ON public.workout_sessions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own sessions" ON public.workout_sessions;
CREATE POLICY "Users can view their own sessions" 
    ON public.workout_sessions FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own sessions" ON public.workout_sessions;
CREATE POLICY "Users can update their own sessions" 
    ON public.workout_sessions FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.workout_sessions;
CREATE POLICY "Users can delete their own sessions" 
    ON public.workout_sessions FOR DELETE 
    USING (auth.uid() = user_id);


-- 2. Table: exercise_logs
-- Represents the actual performance of a specific exercise set during a workout session
CREATE TABLE IF NOT EXISTS public.exercise_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL, -- Links to your ExerciseLibrary ID (e.g., 'squat_barre')
    day TEXT NOT NULL, -- e.g., 'Lundi' (To match the theoretical Blueprint day if applicable)
    set_index INTEGER NOT NULL, -- The index of the set in the workout (0, 1, 2...)
    planned_weight NUMERIC,
    planned_reps INTEGER,
    planned_rpe NUMERIC,
    actual_weight NUMERIC,
    actual_reps INTEGER,
    actual_rpe NUMERIC,
    is_completed BOOLEAN DEFAULT true,
    skipped_reason TEXT, -- e.g., 'fatigue', 'injury', 'time'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for exercise_logs
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;

-- Policies for exercise_logs
-- Note: Security is delegated to the parent workout_session via a subquery or join,
-- but Supabase allows simpler rules using auth.uid() if we add user_id to exercise_logs.
-- For simplicity and performance, we'll add user_id to exercise_logs.

ALTER TABLE public.exercise_logs ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Users can insert their own logs" ON public.exercise_logs;
CREATE POLICY "Users can insert their own logs" 
    ON public.exercise_logs FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own logs" ON public.exercise_logs;
CREATE POLICY "Users can view their own logs" 
    ON public.exercise_logs FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own logs" ON public.exercise_logs;
CREATE POLICY "Users can update their own logs" 
    ON public.exercise_logs FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own logs" ON public.exercise_logs;
CREATE POLICY "Users can delete their own logs" 
    ON public.exercise_logs FOR DELETE 
    USING (auth.uid() = user_id);

-- Indexes for fast querying
CREATE INDEX idx_workout_sessions_user_id ON public.workout_sessions(user_id);
CREATE INDEX idx_exercise_logs_user_id ON public.exercise_logs(user_id);
CREATE INDEX idx_exercise_logs_session_id ON public.exercise_logs(session_id);

-- 3. Table: users (Profiles)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    pdc NUMERIC DEFAULT 75,
    pr_squat NUMERIC DEFAULT 100,
    pr_bench NUMERIC DEFAULT 80,
    pr_deadlift NUMERIC DEFAULT 120,
    pr_ohp NUMERIC DEFAULT 50,
    max_snc NUMERIC DEFAULT 15.0,
    age INTEGER DEFAULT 28,
    sleep_hours NUMERIC DEFAULT 8,
    caloric_status TEXT DEFAULT 'maintenance',
    stress_level TEXT DEFAULT 'moderate',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 4. Table: blueprints
CREATE TABLE IF NOT EXISTS public.blueprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    state JSONB NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.blueprints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own non-deleted blueprints" ON public.blueprints;
CREATE POLICY "Users can view their own non-deleted blueprints" ON public.blueprints FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can insert their own blueprints" ON public.blueprints;
CREATE POLICY "Users can insert their own blueprints" ON public.blueprints FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own blueprints" ON public.blueprints;
CREATE POLICY "Users can update their own blueprints" ON public.blueprints FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- For soft deletes, users update deleted_at. Real deletes are possible but soft delete is preferred.
DROP POLICY IF EXISTS "Users can delete their own blueprints" ON public.blueprints;
CREATE POLICY "Users can delete their own blueprints" ON public.blueprints FOR DELETE USING (auth.uid() = user_id);

-- Add total_tonnage to workout_sessions
ALTER TABLE public.workout_sessions ADD COLUMN IF NOT EXISTS total_tonnage NUMERIC DEFAULT 0;

-- Trigger Function: Update session tonnage
CREATE OR REPLACE FUNCTION update_session_tonnage()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        UPDATE public.workout_sessions
        SET total_tonnage = (
            SELECT COALESCE(SUM(actual_weight * actual_reps), 0)
            FROM public.exercise_logs
            WHERE session_id = OLD.session_id AND is_completed = true
        )
        WHERE id = OLD.session_id;
        RETURN OLD;
    ELSE
        UPDATE public.workout_sessions
        SET total_tonnage = (
            SELECT COALESCE(SUM(actual_weight * actual_reps), 0)
            FROM public.exercise_logs
            WHERE session_id = NEW.session_id AND is_completed = true
        )
        WHERE id = NEW.session_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger: On exercise_logs insert/update/delete
DROP TRIGGER IF EXISTS trigger_update_session_tonnage ON public.exercise_logs;
CREATE TRIGGER trigger_update_session_tonnage
AFTER INSERT OR UPDATE OF actual_weight, actual_reps, is_completed OR DELETE
ON public.exercise_logs
FOR EACH ROW
EXECUTE FUNCTION update_session_tonnage();
