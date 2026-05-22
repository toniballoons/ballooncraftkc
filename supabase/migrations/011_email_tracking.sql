-- ============================================================
-- BalloonCraft KC — Client email activity tracking
-- ============================================================

CREATE TABLE IF NOT EXISTS public.email_deliveries (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_token   uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  related_type     text NOT NULL,
  related_id       uuid,
  recipient_name   text,
  recipient_email  text NOT NULL,
  subject          text NOT NULL,
  status           text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'opened')),
  sent_at          timestamptz NOT NULL DEFAULT now(),
  first_opened_at  timestamptz,
  last_opened_at   timestamptz,
  open_count       integer NOT NULL DEFAULT 0,
  metadata         jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.email_deliveries ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.mark_email_delivery_open(target_token uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.email_deliveries
  SET
    status = 'opened',
    first_opened_at = COALESCE(first_opened_at, now()),
    last_opened_at = now(),
    open_count = open_count + 1
  WHERE tracking_token = target_token;
END;
$$;

DROP POLICY IF EXISTS email_deliveries_admin_all ON public.email_deliveries;

CREATE POLICY email_deliveries_admin_all
  ON public.email_deliveries FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
