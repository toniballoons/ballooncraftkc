-- ============================================================
-- BalloonCraft KC — Newsletter Signups and Unsubscribes
-- ============================================================

CREATE TABLE IF NOT EXISTS newsletter_signups (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email               text NOT NULL UNIQUE,
  first_name          text,
  source              text,
  status              text NOT NULL DEFAULT 'active',
  marketing_consent   boolean NOT NULL DEFAULT true,
  unsubscribe_token   text NOT NULL UNIQUE,
  subscribed_at       timestamptz NOT NULL DEFAULT now(),
  confirmed_at        timestamptz,
  unsubscribed_at     timestamptz,
  unsubscribe_reason  text,
  unsubscribe_note    text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE newsletter_signups
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS marketing_consent boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS unsubscribe_token text,
  ADD COLUMN IF NOT EXISTS subscribed_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz,
  ADD COLUMN IF NOT EXISTS unsubscribe_reason text,
  ADD COLUMN IF NOT EXISTS unsubscribe_note text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'newsletter_signups_unsubscribe_token_key'
  ) THEN
    ALTER TABLE newsletter_signups
      ADD CONSTRAINT newsletter_signups_unsubscribe_token_key UNIQUE (unsubscribe_token);
  END IF;
END $$;

ALTER TABLE newsletter_signups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "newsletter_signups_auth_all" ON newsletter_signups;
CREATE POLICY "newsletter_signups_auth_all"
  ON newsletter_signups FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
