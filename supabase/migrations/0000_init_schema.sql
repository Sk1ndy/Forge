-- =====================================================================================
-- FORGE INIT SCHEMA (0000)
-- A unified, secure, and optimized schema for the Forge application.
-- =====================================================================================

-- ─────────────────────────────────────────────────────────────────────────────────
-- 1. USERS (Profiles)
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.users (
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

INSERT INTO public.exercises (id, nom, tier_snc, muscle_primaire, muscles_secondaires, equipment, tension_matrix) VALUES
('squat', 'Squat Arrière', 1, 'quadriceps', ARRAY['gluteal', 'hamstring', 'lowerBack'], 'poids_libre', '{"quadriceps": 1.0, "gluteal": 0.7, "lowerBack": 0.4, "hamstring": 0.15}'),
('deadlift', 'Soulevé de Terre', 1, 'lowerBack', ARRAY['gluteal', 'hamstring', 'trapezius', 'forearm', 'upperBack'], 'poids_libre', '{"lowerBack": 1.0, "gluteal": 0.8, "hamstring": 0.85, "trapezius": 0.5, "forearm": 0.4, "upperBack": 0.3}'),
('bench_press', 'Développé Couché', 2, 'chest', ARRAY['frontDeltoid', 'triceps'], 'poids_libre', '{"chest": 1.0, "frontDeltoid": 0.6, "triceps": 0.5}'),
('ohp', 'Overhead Press (OHP)', 1, 'frontDeltoid', ARRAY['triceps', 'trapezius'], 'poids_libre', '{"frontDeltoid": 1.0, "triceps": 0.5, "upperChest": 0.2, "trapezius": 0.3}'),
('pull_ups', 'Tractions', 2, 'upperBack', ARRAY['biceps', 'forearm', 'trapezius'], 'pdc', '{"upperBack": 1.0, "biceps": 0.6, "forearm": 0.4, "trapezius": 0.2}'),
('barbell_row', 'Rowing Barre', 1, 'upperBack', ARRAY['trapezius', 'biceps', 'lowerBack', 'forearm'], 'poids_libre', '{"upperBack": 1.0, "trapezius": 0.6, "rhomboids": 0.6, "biceps": 0.5, "lowerBack": 0.5, "forearm": 0.4}'),
('dips', 'Dips', 2, 'chest', ARRAY['triceps', 'frontDeltoid'], 'pdc', '{"lowerChest": 0.8, "chest": 0.4, "triceps": 0.8, "frontDeltoid": 0.5}'),
('biceps_curl', 'Curl Biceps (Barre/Haltères)', 3, 'biceps', ARRAY['forearm'], 'poids_libre', '{"biceps": 1.0, "forearm": 0.3}'),
('triceps_pushdown', 'Extension Triceps Poulie', 3, 'triceps', ARRAY[]::text[], 'machine', '{"triceps": 1.0}'),
('incline_bench', 'Développé Incliné', 2, 'chest', ARRAY['frontDeltoid', 'triceps'], 'poids_libre', '{"upperChest": 1.0, "chest": 0.4, "frontDeltoid": 0.7, "triceps": 0.4}'),
('leg_press', 'Presse à Cuisses', 2, 'quadriceps', ARRAY['gluteal'], 'machine', '{"quadriceps": 1.0, "gluteal": 0.4}'),
('leg_curl', 'Leg Curl', 3, 'hamstring', ARRAY[]::text[], 'machine', '{"hamstring": 1.0}'),
('leg_extension', 'Leg Extension', 3, 'quadriceps', ARRAY[]::text[], 'machine', '{"quadriceps": 1.0}'),
('lateral_raise', 'Élévations Latérales', 3, 'deltoids', ARRAY[]::text[], 'poids_libre', '{"deltoids": 1.0}'),
('face_pull', 'Face Pull', 3, 'rearDeltoid', ARRAY['trapezius'], 'machine', '{"rearDeltoid": 1.0, "trapezius": 0.5, "rhomboids": 0.6}'),
('calf_raise', 'Mollets Debout', 3, 'calves', ARRAY[]::text[], 'poids_libre', '{"calves": 1.0}'),
('crunchs', 'Crunchs Abdominaux', 3, 'abs', ARRAY[]::text[], 'pdc', '{"abs": 1.0}'),
('plank', 'Planche Gainage', 3, 'abs', ARRAY['obliques', 'lowerBack'], 'pdc', '{"abs": 1.0, "obliques": 0.5, "lowerBack": 0.3}'),
('lunges', 'Fentes Haltères', 2, 'quadriceps', ARRAY['gluteal', 'hamstring'], 'poids_libre', '{"quadriceps": 0.8, "gluteal": 0.7, "hamstring": 0.2}'),
('hip_thrust', 'Hip Thrust', 2, 'gluteal', ARRAY['hamstring'], 'poids_libre', '{"gluteal": 1.0, "hamstring": 0.3}'),
('pec_deck', 'Pec Deck', 3, 'chest', ARRAY[]::text[], 'machine', '{"chest": 1.0}'),
('lat_pulldown', 'Tirage Poitrine Poulie', 2, 'upperBack', ARRAY['biceps', 'trapezius', 'forearm'], 'machine', '{"upperBack": 1.0, "biceps": 0.5, "trapezius": 0.3, "forearm": 0.2}');

-- ─────────────────────────────────────────────────────────────────────────────────
-- 3. BLUEPRINTS (Planning)
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.blueprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    state JSONB NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_blueprints_user_id ON public.blueprints(user_id);

ALTER TABLE public.blueprints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own non-deleted blueprints" ON public.blueprints FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);
CREATE POLICY "Users can insert their own blueprints" ON public.blueprints FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own blueprints" ON public.blueprints FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own blueprints" ON public.blueprints FOR DELETE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────────
-- 4. WORKOUT SESSIONS (Séances)
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    blueprint_id UUID REFERENCES public.blueprints(id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    total_tonnage NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_workout_sessions_user_id ON public.workout_sessions(user_id);

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own sessions" ON public.workout_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sessions" ON public.workout_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sessions" ON public.workout_sessions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sessions" ON public.workout_sessions FOR DELETE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────────
-- 5. EXERCISE LOGS (Séries)
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.exercise_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL REFERENCES public.exercises(id),
    day TEXT NOT NULL,
    week INTEGER DEFAULT 1,
    set_index INTEGER NOT NULL,
    planned_weight NUMERIC,
    planned_reps INTEGER,
    planned_rpe NUMERIC,
    actual_weight NUMERIC,
    actual_reps INTEGER,
    actual_rpe NUMERIC,
    is_completed BOOLEAN DEFAULT true,
    skipped_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index critiques pour accélérer les requêtes de l'Engine (par user_id et par session_id)
CREATE INDEX idx_exercise_logs_user_id ON public.exercise_logs(user_id);
CREATE INDEX idx_exercise_logs_session_id ON public.exercise_logs(session_id);
CREATE INDEX idx_exercise_logs_exercise_id ON public.exercise_logs(exercise_id);

ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own logs" ON public.exercise_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own logs" ON public.exercise_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own logs" ON public.exercise_logs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own logs" ON public.exercise_logs FOR DELETE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────────
-- 6. TRIGGERS (Automatisations Backend)
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_session_tonnage()
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_session_tonnage
AFTER INSERT OR UPDATE OF actual_weight, actual_reps, is_completed OR DELETE
ON public.exercise_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_session_tonnage();
