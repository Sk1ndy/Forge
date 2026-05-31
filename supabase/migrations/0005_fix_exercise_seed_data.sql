-- =====================================================================================
-- FORGE MIGRATION 0005 — FIX EXERCISE SEED DATA
-- Met à jour les équipements et les catégories PPL des exercices
-- qui avaient été initialisés à 'unknown' dans le seed d'origine.
-- =====================================================================================

-- 1. Catégorie Core & Abdominaux
UPDATE public.exercises SET equipment = 'poids_libre', ppl_category = 'core' WHERE id IN ('ab_wheel_rollout', 'russian_twist');
UPDATE public.exercises SET equipment = 'machine', ppl_category = 'core' WHERE id = 'cable_crunch';

-- 2. Catégorie Push & Pectoraux / Épaules / Triceps
UPDATE public.exercises SET equipment = 'poids_libre', ppl_category = 'push' WHERE id IN (
  'decline_bench_press', 'db_pullover', 'seated_db_press', 'front_raise', 
  'overhead_triceps_extension', 'close_grip_bench_press', 'french_press'
);
UPDATE public.exercises SET equipment = 'machine', ppl_category = 'push' WHERE id IN (
  'machine_fly', 'cable_lateral_raise', 'machine_shoulder_press'
);
UPDATE public.exercises SET equipment = 'pdc', ppl_category = 'push' WHERE id IN (
  'push_ups', 'weighted_dips'
);

-- 3. Catégorie Pull & Dos / Biceps / Trapèzes
UPDATE public.exercises SET equipment = 'pdc', ppl_category = 'pull' WHERE id = 'chin_ups';
UPDATE public.exercises SET equipment = 'machine', ppl_category = 'pull' WHERE id IN (
  'close_grip_pulldown', 'machine_row', 'cable_curl'
);
UPDATE public.exercises SET equipment = 'poids_libre', ppl_category = 'pull' WHERE id IN (
  'db_shrugs', 'barbell_shrugs', 'upright_row', 'preacher_curl', 'concentration_curl'
);

-- 4. Catégorie Legs & Cuisses / Lombaires / Fessiers / Mollets
UPDATE public.exercises SET equipment = 'poids_libre', ppl_category = 'legs' WHERE id IN (
  'good_mornings', 'front_squat', 'sumo_deadlift'
);
UPDATE public.exercises SET equipment = 'machine', ppl_category = 'legs' WHERE id IN (
  'hack_squat', 'leg_press_45', 'seated_calf_raise', 'standing_calf_raise'
);
UPDATE public.exercises SET equipment = 'pdc', ppl_category = 'legs' WHERE id = 'back_extension';
