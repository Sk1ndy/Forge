-- Migration: 0008_subscriptions
-- Description: Table pour gérer les abonnements Stripe (Freemium, Pro, Elite)

CREATE TYPE public.subscription_tier AS ENUM ('free', 'pro', 'elite');
CREATE TYPE public.subscription_status AS ENUM ('active', 'cancelled', 'past_due', 'unpaid', 'trialing');

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tier public.subscription_tier NOT NULL DEFAULT 'free',
  status public.subscription_status NOT NULL DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour la récupération rapide de l'abonnement actif d'un user
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);

-- RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Note: Les insertions/mises à jour se feront via une Edge Function sécurisée (Webhook Stripe)
