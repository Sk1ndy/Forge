-- Migration: 0009_referrals
-- Description: Table pour gérer les parrainages (Acquisition Organique)

CREATE TYPE public.referral_status AS ENUM ('pending', 'rewarded', 'rejected');

CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- Rempli quand l'utilisateur s'inscrit
  referral_code TEXT NOT NULL UNIQUE,
  status public.referral_status NOT NULL DEFAULT 'pending',
  rewarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes pour recherche rapide par code ou parrain
CREATE INDEX idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_code ON public.referrals(referral_code);

-- RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referrals"
  ON public.referrals
  FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
