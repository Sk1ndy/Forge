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
CREATE POLICY "Users can insert their own sessions" 
    ON public.workout_sessions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own sessions" 
    ON public.workout_sessions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" 
    ON public.workout_sessions FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

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

CREATE POLICY "Users can insert their own logs" 
    ON public.exercise_logs FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own logs" 
    ON public.exercise_logs FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own logs" 
    ON public.exercise_logs FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own logs" 
    ON public.exercise_logs FOR DELETE 
    USING (auth.uid() = user_id);

-- Indexes for fast querying
CREATE INDEX idx_workout_sessions_user_id ON public.workout_sessions(user_id);
CREATE INDEX idx_exercise_logs_user_id ON public.exercise_logs(user_id);
CREATE INDEX idx_exercise_logs_session_id ON public.exercise_logs(session_id);
