CREATE TABLE IF NOT EXISTS public.exercises (
  id text PRIMARY KEY,
  nom text NOT NULL,
  tier_snc integer NOT NULL,
  muscle_primaire text NOT NULL,
  muscles_secondaires text[] NOT NULL DEFAULT '{}',
  equipment text NOT NULL,
  tension_matrix jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Allow read access for everyone
CREATE POLICY "Allow public read access to exercises" ON public.exercises
  FOR SELECT USING (true);

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
