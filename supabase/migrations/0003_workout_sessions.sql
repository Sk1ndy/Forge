-- Migration pour la fonctionnalité Work Mode (Tracking et Surcharge Progressive)

-- 1. Table des Sessions
CREATE TABLE IF NOT EXISTS public.workout_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    blueprint_id UUID REFERENCES public.blueprints(id) ON DELETE SET NULL,
    exercise_data JSONB DEFAULT '{}'::jsonb
);

-- Index pour accélérer les requêtes par utilisateur
CREATE INDEX idx_workout_sessions_user_id ON public.workout_sessions(user_id);

-- RLS
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert their own sessions" ON public.workout_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own sessions" ON public.workout_sessions FOR SELECT USING (auth.uid() = user_id);

-- 2. Table des Logs d'Exercices
CREATE TABLE IF NOT EXISTS public.exercise_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL,
    sets INTEGER NOT NULL,
    reps INTEGER NOT NULL,
    actual_weight REAL NOT NULL,
    rpe REAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour accélérer la recherche des derniers logs pour la surcharge progressive
CREATE INDEX idx_exercise_logs_exercise_id ON public.exercise_logs(exercise_id);
CREATE INDEX idx_exercise_logs_session_id ON public.exercise_logs(session_id);

-- RLS
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;
-- Note: Security should ideally join on workout_sessions.user_id for RLS, but for simplicity here we rely on the session insert.
-- We can create a policy based on a subquery:
CREATE POLICY "Users can insert logs for their sessions" ON public.exercise_logs FOR INSERT WITH CHECK (
    session_id IN (SELECT id FROM public.workout_sessions WHERE user_id = auth.uid())
);
CREATE POLICY "Users can view logs for their sessions" ON public.exercise_logs FOR SELECT USING (
    session_id IN (SELECT id FROM public.workout_sessions WHERE user_id = auth.uid())
);
