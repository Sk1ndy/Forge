-- Migration: 0010_notification_preferences
-- Description: Table pour gérer les opt-ins aux notifications push intelligentes du moteur

CREATE TABLE public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  notify_snc_recovery BOOLEAN NOT NULL DEFAULT TRUE,      -- sncPercentage > 90%
  notify_burnout_alert BOOLEAN NOT NULL DEFAULT TRUE,     -- chronicSncStress > 3.0
  notify_monotony BOOLEAN NOT NULL DEFAULT TRUE,          -- monotonyAlerts
  notify_injury_risk BOOLEAN NOT NULL DEFAULT TRUE,       -- injuryPredictions
  notify_session_reminder BOOLEAN NOT NULL DEFAULT TRUE,  -- Séance non enregistrée
  push_token TEXT,                                        -- Token Expo / APNs / FCM
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification preferences"
  ON public.notification_preferences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
