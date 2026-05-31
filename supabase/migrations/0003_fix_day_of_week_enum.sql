-- =====================================================================================
-- FORGE MIGRATION 0003 — FIX ENUM day_of_week
-- Aligne les valeurs de l'ENUM avec le moteur et les schemas Zod ('mon'...'sun')
-- 
-- ATTENTION : La migration 0001 a cree un ENUM avec 'Monday'...'Sunday'.
-- Cette migration corrige l'enum SANS modifier 0001 (immuable en prod).
-- =====================================================================================

-- Etape 1 : Revert de la colonne vers TEXT (supprime la dependance a l'ancien ENUM)
ALTER TABLE public.exercise_logs
  ALTER COLUMN day TYPE TEXT;

-- Etape 2 : Normaliser les valeurs existantes (au cas ou des 'Monday' auraient ete inserees)
UPDATE public.exercise_logs SET day = 'mon' WHERE day IN ('Monday', 'mon', '0');
UPDATE public.exercise_logs SET day = 'tue' WHERE day IN ('Tuesday', 'tue', '1');
UPDATE public.exercise_logs SET day = 'wed' WHERE day IN ('Wednesday', 'wed', '2');
UPDATE public.exercise_logs SET day = 'thu' WHERE day IN ('Thursday', 'thu', '3');
UPDATE public.exercise_logs SET day = 'fri' WHERE day IN ('Friday', 'fri', '4');
UPDATE public.exercise_logs SET day = 'sat' WHERE day IN ('Saturday', 'sat', '5');
UPDATE public.exercise_logs SET day = 'sun' WHERE day IN ('Sunday', 'sun', '6');

-- Etape 3 : Supprimer l'ancien ENUM incorrect (forcer la propagation)
DROP TYPE IF EXISTS public.day_of_week CASCADE;

-- Etape 4 : Creer le nouvel ENUM avec les valeurs courtes (alignees avec le moteur)
CREATE TYPE public.day_of_week AS ENUM ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun');

-- Etape 5 : Reconvertir la colonne vers le bon ENUM
ALTER TABLE public.exercise_logs
  ALTER COLUMN day TYPE public.day_of_week USING day::public.day_of_week;

-- Etape 6 : Re-ajouter la contrainte de semaine positive (elle avait ete droppee avec le CAST)
ALTER TABLE public.exercise_logs
  DROP CONSTRAINT IF EXISTS check_week_positive;
ALTER TABLE public.exercise_logs
  ADD CONSTRAINT check_week_positive CHECK (week > 0);
