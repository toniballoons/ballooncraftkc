-- ============================================================
-- BalloonCraft KC — Newsletter signups
-- ============================================================

CREATE TABLE IF NOT EXISTS public.newsletter_signups (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email              text NOT NULL UNIQUE,
  full_name          text,
  source             text NOT NULL DEFAULT 'homepage',
  status             text NOT NULL DEFAULT 'subscribed' CHECK (status IN ('subscribed', 'unsubscribed')),
  unsubscribe_token  uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  subscribed_at      timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at    timestamptz,
  metadata           jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.newsletter_signups ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS normalize_newsletter_email ON public.newsletter_signups;
CREATE TRIGGER normalize_newsletter_email
  BEFORE INSERT OR UPDATE ON public.newsletter_signups
  FOR EACH ROW EXECUTE FUNCTION public.normalize_email_value();

DROP POLICY IF EXISTS newsletter_signups_public_insert ON public.newsletter_signups;
DROP POLICY IF EXISTS newsletter_signups_admin_read ON public.newsletter_signups;
DROP POLICY IF EXISTS newsletter_admin_delete ON public.newsletter_signups;

CREATE POLICY newsletter_signups_public_insert
  ON public.newsletter_signups FOR INSERT TO anon
  WITH CHECK ((SELECT auth.role()) = 'anon');

CREATE POLICY newsletter_signups_admin_all
  ON public.newsletter_signups FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
