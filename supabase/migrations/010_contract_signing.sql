-- ============================================================
-- BalloonCraft KC — Contract generation + hosted signing
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS public.contract_number_seq START WITH 1001;

CREATE OR REPLACE FUNCTION public.generate_contract_number(prefix_override text DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  effective_prefix text;
BEGIN
  SELECT invoice_prefix
  INTO effective_prefix
  FROM public.billing_settings
  ORDER BY created_at ASC
  LIMIT 1;

  effective_prefix := COALESCE(NULLIF(prefix_override, ''), NULLIF(effective_prefix, ''), 'BC');

  RETURN effective_prefix || '-CTR-' || to_char(current_date, 'YYYY') || '-' || lpad(nextval('public.contract_number_seq')::text, 4, '0');
END;
$$;

CREATE TABLE IF NOT EXISTS public.contracts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id         uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  invoice_id          uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  contract_number     text NOT NULL UNIQUE DEFAULT public.generate_contract_number(),
  signing_token       uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  title               text NOT NULL DEFAULT 'BalloonCraft KC Custom Event Agreement',
  status              text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'signed', 'cancelled')),
  client_name         text NOT NULL,
  client_email        text NOT NULL,
  client_phone        text,
  event_name          text,
  event_date          date,
  event_time          text,
  event_location      text,
  setup_address       text,
  contract_total      numeric(12,2) NOT NULL DEFAULT 0,
  retainer_amount     numeric(12,2) NOT NULL DEFAULT 0,
  balance_due_date    date,
  payload             jsonb NOT NULL DEFAULT '{}'::jsonb,
  sent_at             timestamptz,
  viewed_at           timestamptz,
  signed_at           timestamptz,
  signer_name         text,
  signer_email        text,
  signer_initials     text,
  signature_data_url  text,
  signer_ip           text,
  signer_user_agent   text,
  created_by          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS contracts_updated_at ON public.contracts;
CREATE TRIGGER contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.apply_contract_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;

  NEW.client_email := lower(trim(NEW.client_email));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contracts_apply_defaults ON public.contracts;
CREATE TRIGGER contracts_apply_defaults
  BEFORE INSERT OR UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.apply_contract_defaults();

CREATE TABLE IF NOT EXISTS public.contract_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id  uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  event_type   text NOT NULL CHECK (event_type IN ('created', 'sent', 'viewed', 'signed', 'resent', 'downloaded', 'cancelled')),
  ip_address   text,
  user_agent   text,
  metadata     jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contract_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.create_contract_event(
  target_contract_id uuid,
  target_event_type text,
  target_ip text DEFAULT NULL,
  target_user_agent text DEFAULT NULL,
  target_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.contract_events (contract_id, event_type, ip_address, user_agent, metadata)
  VALUES (target_contract_id, target_event_type, target_ip, target_user_agent, COALESCE(target_metadata, '{}'::jsonb))
$$;

DROP POLICY IF EXISTS contracts_admin_all ON public.contracts;
DROP POLICY IF EXISTS contract_events_admin_all ON public.contract_events;

CREATE POLICY contracts_admin_all
  ON public.contracts FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY contract_events_admin_all
  ON public.contract_events FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
