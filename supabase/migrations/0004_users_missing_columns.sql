-- =====================================================================================
-- FORGE MIGRATION 0004 — COLONNES MANQUANTES DANS public.users
-- Ajoute les colonnes requises par le moteur et ProfileCalibrator
-- qui etaient absentes de la table (donnees perdues a chaque reinstallation)
-- =====================================================================================

-- 1. gender : requis par ProfileCalibrator (ratios de force male/female)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female')) DEFAULT 'male';

-- 2. is_beginner : derive de experience_level, cache la logique dans le moteur
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_beginner BOOLEAN DEFAULT FALSE;

-- 3. daily_vfc : baseline HRV en millisecondes (Heart Rate Variability)
--    Utilise par TelemetryAdapter pour calibrer la recuperation SNC
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS daily_vfc NUMERIC(6,2) CONSTRAINT check_daily_vfc_range CHECK (daily_vfc IS NULL OR (daily_vfc >= 0 AND daily_vfc <= 200));

-- 4. biometric_constants : blob JSON calibre par ProfileCalibrator
--    Stocke UserBiometricConstants (baseTauMetabolic, baseTauDamage, k1, k2, etc.)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS biometric_constants JSONB;

-- 5. Mettre a jour la fonction de creation de profil pour inclure les nouveaux champs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, pdc, max_snc, gender, is_beginner)
  VALUES (new.id, 75, 15.0, 'male', false)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RLS : les nouvelles colonnes heritent des politiques existantes sur public.users
--    (lecture/ecriture limitees au user_id concerne — deja configure en 0000)
--    Aucune nouvelle policy necessaire.

-- 7. Index pour requetes frequentes par gender (statistiques agregees anonymisees)
CREATE INDEX IF NOT EXISTS idx_users_gender ON public.users(gender);
