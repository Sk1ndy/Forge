-- Migration: Ajout des colonnes de gabarit additionnelles à la table users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS sleep_hours numeric(4,2),
ADD COLUMN IF NOT EXISTS caloric_status text,
ADD COLUMN IF NOT EXISTS stress_level text;
