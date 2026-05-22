-- ============================================================
-- BalloonCraft KC — Customer portal, billing, and reporting
-- ============================================================

-- Shared updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Shared email normalizer
CREATE OR REPLACE FUNCTION public.normalize_email_value()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email = lower(trim(NEW.email));
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================
-- User profiles + role helpers
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id      uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        text NOT NULL UNIQUE,
  full_name    text,
  phone        text,
  role         text NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS normalize_user_profile_email ON public.user_profiles;
CREATE TRIGGER normalize_user_profile_email
  BEFORE INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.normalize_email_value();

DROP TRIGGER IF EXISTS user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    lower(NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'phone',
    CASE
      WHEN lower(NEW.email) = 'tonihall015@gmail.com' THEN 'admin'
      ELSE 'customer'
    END
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.user_profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, public.user_profiles.phone),
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.user_profiles (user_id, email, full_name, phone, role)
SELECT
  id,
  lower(email),
  COALESCE(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name', split_part(email, '@', 1)),
  raw_user_meta_data ->> 'phone',
  CASE
    WHEN lower(email) = 'tonihall015@gmail.com' THEN 'admin'
    ELSE 'customer'
  END
FROM auth.users
ON CONFLICT (user_id) DO UPDATE
SET
  email = EXCLUDED.email,
  full_name = COALESCE(public.user_profiles.full_name, EXCLUDED.full_name),
  phone = COALESCE(public.user_profiles.phone, EXCLUDED.phone),
  updated_at = now();

UPDATE public.user_profiles
SET role = 'admin'
WHERE email = 'tonihall015@gmail.com';

CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_profiles
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_app_role() = 'admin', false)
$$;

-- ============================================================
-- Customers
-- ============================================================

CREATE TABLE IF NOT EXISTS public.customers (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name                 text,
  email                     text NOT NULL UNIQUE,
  phone                     text,
  company_name              text,
  preferred_contact_method  text,
  preferred_payment_method  text,
  contract_notes            text,
  internal_notes            text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS normalize_customer_email ON public.customers;
CREATE TRIGGER normalize_customer_email
  BEFORE INSERT OR UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.normalize_email_value();

DROP TRIGGER IF EXISTS customers_updated_at ON public.customers;
CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.sync_customer_with_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.customers (user_id, full_name, email, phone)
  VALUES (NEW.user_id, NEW.full_name, NEW.email, NEW.phone)
  ON CONFLICT (email) DO UPDATE
  SET
    user_id = COALESCE(public.customers.user_id, EXCLUDED.user_id),
    full_name = COALESCE(EXCLUDED.full_name, public.customers.full_name),
    phone = COALESCE(EXCLUDED.phone, public.customers.phone),
    updated_at = now();

  UPDATE public.customers
  SET
    user_id = NEW.user_id,
    updated_at = now()
  WHERE email = NEW.email
    AND (user_id IS NULL OR user_id = NEW.user_id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_customer_from_user_profile ON public.user_profiles;
CREATE TRIGGER sync_customer_from_user_profile
  AFTER INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_customer_with_user_profile();

INSERT INTO public.customers (user_id, full_name, email, phone)
SELECT user_id, full_name, email, phone
FROM public.user_profiles
ON CONFLICT (email) DO UPDATE
SET
  user_id = COALESCE(public.customers.user_id, EXCLUDED.user_id),
  full_name = COALESCE(public.customers.full_name, EXCLUDED.full_name),
  phone = COALESCE(public.customers.phone, EXCLUDED.phone),
  updated_at = now();

CREATE OR REPLACE FUNCTION public.ensure_customer_for_email(
  p_email text,
  p_name text DEFAULT NULL,
  p_phone text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_email text;
  linked_user_id uuid;
  ensured_customer_id uuid;
BEGIN
  IF p_email IS NULL OR btrim(p_email) = '' THEN
    RETURN NULL;
  END IF;

  normalized_email := lower(trim(p_email));

  SELECT user_id
  INTO linked_user_id
  FROM public.user_profiles
  WHERE email = normalized_email
  LIMIT 1;

  INSERT INTO public.customers (email, full_name, phone, user_id)
  VALUES (
    normalized_email,
    NULLIF(trim(COALESCE(p_name, '')), ''),
    NULLIF(trim(COALESCE(p_phone, '')), ''),
    linked_user_id
  )
  ON CONFLICT (email) DO UPDATE
  SET
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.customers.full_name),
    phone = COALESCE(NULLIF(EXCLUDED.phone, ''), public.customers.phone),
    user_id = COALESCE(public.customers.user_id, EXCLUDED.user_id),
    updated_at = now()
  RETURNING id INTO ensured_customer_id;

  RETURN ensured_customer_id;
END;
$$;

-- ============================================================
-- Contact submissions -> customers
-- ============================================================

ALTER TABLE public.contact_submissions
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS contact_submissions_updated_at ON public.contact_submissions;
CREATE TRIGGER contact_submissions_updated_at
  BEFORE UPDATE ON public.contact_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.attach_customer_to_contact_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.customer_id := public.ensure_customer_for_email(NEW.email, NEW.name, NEW.phone);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contact_submissions_attach_customer ON public.contact_submissions;
CREATE TRIGGER contact_submissions_attach_customer
  BEFORE INSERT OR UPDATE ON public.contact_submissions
  FOR EACH ROW EXECUTE FUNCTION public.attach_customer_to_contact_submission();

UPDATE public.contact_submissions
SET customer_id = public.ensure_customer_for_email(email, name, phone)
WHERE email IS NOT NULL
  AND customer_id IS NULL;

-- ============================================================
-- Billing settings
-- ============================================================

CREATE TABLE IF NOT EXISTS public.billing_settings (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name             text NOT NULL DEFAULT 'BalloonCraft KC',
  business_email            text,
  business_phone            text,
  business_address          text,
  invoice_prefix            text NOT NULL DEFAULT 'BC',
  default_due_days          integer NOT NULL DEFAULT 7 CHECK (default_due_days >= 0),
  default_tax_rate          numeric(7,4) NOT NULL DEFAULT 0 CHECK (default_tax_rate >= 0 AND default_tax_rate <= 1),
  accepted_payment_methods  text[] NOT NULL DEFAULT ARRAY['venmo', 'cashapp', 'zelle', 'cash', 'check', 'other'],
  venmo_handle              text,
  venmo_url                 text,
  cashapp_handle            text,
  cashapp_url               text,
  zelle_detail              text,
  contract_template_url     text,
  contract_instructions     text,
  payment_instructions      text,
  invoice_footer            text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.billing_settings ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS billing_settings_updated_at ON public.billing_settings;
CREATE TRIGGER billing_settings_updated_at
  BEFORE UPDATE ON public.billing_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.billing_settings (
  business_name,
  invoice_prefix,
  default_due_days,
  default_tax_rate,
  payment_instructions,
  invoice_footer
)
SELECT
  'BalloonCraft KC',
  'BC',
  7,
  0,
  'Payments are handled outside the website. Use the payment methods listed on each invoice and attach your signed contract before the event.',
  'Thank you for choosing BalloonCraft KC. We appreciate your business.'
WHERE NOT EXISTS (
  SELECT 1 FROM public.billing_settings
);

-- ============================================================
-- Invoices + line items + payments
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq START WITH 1001;

CREATE OR REPLACE FUNCTION public.generate_invoice_number(prefix_override text DEFAULT NULL)
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

  RETURN effective_prefix || '-' || to_char(current_date, 'YYYY') || '-' || lpad(nextval('public.invoice_number_seq')::text, 4, '0');
END;
$$;

CREATE TABLE IF NOT EXISTS public.invoices (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id           uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  contact_submission_id uuid REFERENCES public.contact_submissions(id) ON DELETE SET NULL,
  invoice_number        text NOT NULL UNIQUE DEFAULT public.generate_invoice_number(),
  title                 text NOT NULL,
  description           text,
  status                text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'partially_paid', 'paid', 'cancelled')),
  currency              text NOT NULL DEFAULT 'USD',
  contract_status       text NOT NULL DEFAULT 'not_sent' CHECK (contract_status IN ('not_sent', 'sent', 'signed', 'received')),
  external_contract_url text,
  issued_at             date NOT NULL DEFAULT current_date,
  due_at                date,
  event_date            date,
  subtotal_amount       numeric(12,2) NOT NULL DEFAULT 0,
  discount_amount       numeric(12,2) NOT NULL DEFAULT 0,
  tax_rate              numeric(7,4) NOT NULL DEFAULT 0,
  tax_amount            numeric(12,2) NOT NULL DEFAULT 0,
  total_amount          numeric(12,2) NOT NULL DEFAULT 0,
  amount_paid           numeric(12,2) NOT NULL DEFAULT 0,
  balance_due           numeric(12,2) NOT NULL DEFAULT 0,
  payment_terms         text,
  payment_instructions  text,
  payment_methods       text[] NOT NULL DEFAULT '{}',
  internal_notes        text,
  customer_notes        text,
  last_sent_at          timestamptz,
  paid_at               timestamptz,
  created_by            uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS invoices_updated_at ON public.invoices;
CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.apply_invoice_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  settings_row public.billing_settings%ROWTYPE;
BEGIN
  SELECT *
  INTO settings_row
  FROM public.billing_settings
  ORDER BY created_at ASC
  LIMIT 1;

  IF NEW.issued_at IS NULL THEN
    NEW.issued_at := current_date;
  END IF;

  IF NEW.due_at IS NULL AND settings_row.default_due_days IS NOT NULL THEN
    NEW.due_at := NEW.issued_at + settings_row.default_due_days;
  END IF;

  IF COALESCE(NEW.tax_rate, 0) = 0 AND settings_row.default_tax_rate IS NOT NULL THEN
    NEW.tax_rate := settings_row.default_tax_rate;
  END IF;

  IF (NEW.payment_methods IS NULL OR cardinality(NEW.payment_methods) = 0) AND settings_row.accepted_payment_methods IS NOT NULL THEN
    NEW.payment_methods := settings_row.accepted_payment_methods;
  END IF;

  IF (NEW.payment_instructions IS NULL OR btrim(NEW.payment_instructions) = '') AND settings_row.payment_instructions IS NOT NULL THEN
    NEW.payment_instructions := settings_row.payment_instructions;
  END IF;

  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS invoices_apply_defaults ON public.invoices;
CREATE TRIGGER invoices_apply_defaults
  BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.apply_invoice_defaults();

CREATE TABLE IF NOT EXISTS public.invoice_line_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity    numeric(12,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price  numeric(12,2) NOT NULL DEFAULT 0,
  taxable     boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS invoice_line_items_updated_at ON public.invoice_line_items;
CREATE TRIGGER invoice_line_items_updated_at
  BEFORE UPDATE ON public.invoice_line_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.payments (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id           uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  customer_id          uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  payment_date         date NOT NULL DEFAULT current_date,
  amount               numeric(12,2) NOT NULL CHECK (amount > 0),
  payment_method       text NOT NULL DEFAULT 'manual',
  processor            text,
  processor_reference  text,
  status               text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  notes                text,
  recorded_by          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS payments_updated_at ON public.payments;
CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.recalculate_invoice_totals(target_invoice_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invoice_status text;
  invoice_last_sent_at timestamptz;
  subtotal_value numeric(12,2) := 0;
  taxable_subtotal_value numeric(12,2) := 0;
  discount_value numeric(12,2) := 0;
  tax_rate_value numeric(7,4) := 0;
  tax_amount_value numeric(12,2) := 0;
  paid_value numeric(12,2) := 0;
  total_value numeric(12,2) := 0;
BEGIN
  SELECT
    status,
    last_sent_at,
    COALESCE(discount_amount, 0),
    COALESCE(tax_rate, 0)
  INTO
    invoice_status,
    invoice_last_sent_at,
    discount_value,
    tax_rate_value
  FROM public.invoices
  WHERE id = target_invoice_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT
    COALESCE(sum(quantity * unit_price), 0),
    COALESCE(sum(CASE WHEN taxable THEN quantity * unit_price ELSE 0 END), 0)
  INTO
    subtotal_value,
    taxable_subtotal_value
  FROM public.invoice_line_items
  WHERE invoice_id = target_invoice_id;

  SELECT
    COALESCE(sum(
      CASE
        WHEN status = 'completed' THEN amount
        WHEN status = 'refunded' THEN amount * -1
        ELSE 0
      END
    ), 0)
  INTO paid_value
  FROM public.payments
  WHERE invoice_id = target_invoice_id;

  tax_amount_value := round(taxable_subtotal_value * tax_rate_value, 2);
  total_value := GREATEST(round(subtotal_value - discount_value + tax_amount_value, 2), 0);

  UPDATE public.invoices
  SET
    subtotal_amount = round(subtotal_value, 2),
    tax_amount = tax_amount_value,
    total_amount = total_value,
    amount_paid = round(paid_value, 2),
    balance_due = GREATEST(round(total_value - paid_value, 2), 0),
    status = CASE
      WHEN invoice_status = 'cancelled' THEN 'cancelled'
      WHEN total_value > 0 AND paid_value >= total_value THEN 'paid'
      WHEN paid_value > 0 THEN CASE WHEN invoice_status = 'draft' THEN 'draft' ELSE 'partially_paid' END
      WHEN invoice_status IN ('paid', 'partially_paid') THEN CASE WHEN invoice_last_sent_at IS NOT NULL THEN 'sent' ELSE 'draft' END
      ELSE invoice_status
    END,
    paid_at = CASE
      WHEN total_value > 0 AND paid_value >= total_value THEN COALESCE(paid_at, now())
      ELSE NULL
    END,
    updated_at = now()
  WHERE id = target_invoice_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.recalculate_invoice_totals_from_related_row()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.recalculate_invoice_totals(COALESCE(NEW.invoice_id, OLD.invoice_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.recalculate_invoice_totals_from_invoice_row()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.recalculate_invoice_totals(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS invoice_line_items_recalculate_invoice ON public.invoice_line_items;
CREATE TRIGGER invoice_line_items_recalculate_invoice
  AFTER INSERT OR UPDATE OR DELETE ON public.invoice_line_items
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_invoice_totals_from_related_row();

DROP TRIGGER IF EXISTS payments_recalculate_invoice ON public.payments;
CREATE TRIGGER payments_recalculate_invoice
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_invoice_totals_from_related_row();

DROP TRIGGER IF EXISTS invoices_recalculate_invoice ON public.invoices;
CREATE TRIGGER invoices_recalculate_invoice
  AFTER INSERT OR UPDATE OF discount_amount, tax_rate ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_invoice_totals_from_invoice_row();

-- ============================================================
-- RLS cleanup on existing public/admin tables
-- ============================================================

DROP POLICY IF EXISTS "public_insert_contact" ON public.contact_submissions;
DROP POLICY IF EXISTS "auth_all_contact" ON public.contact_submissions;
DROP POLICY IF EXISTS contact_submissions_public_insert ON public.contact_submissions;
DROP POLICY IF EXISTS contact_submissions_admin_all ON public.contact_submissions;
DROP POLICY IF EXISTS "public_read_published_projects" ON public.projects;
DROP POLICY IF EXISTS "auth_all_projects" ON public.projects;
DROP POLICY IF EXISTS "public_read_site_content" ON public.site_content;
DROP POLICY IF EXISTS "auth_write_site_content" ON public.site_content;
DROP POLICY IF EXISTS "public_read_site_themes" ON public.site_themes;
DROP POLICY IF EXISTS "auth_write_site_themes" ON public.site_themes;
DROP POLICY IF EXISTS "public_read_approved_testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "auth_all_testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "public_read_site_assets" ON public.site_assets;
DROP POLICY IF EXISTS "auth_write_site_assets" ON public.site_assets;

-- Existing tables: public read as before, admin write only
CREATE POLICY projects_public_read_published
  ON public.projects FOR SELECT TO anon
  USING (status = 'published');

CREATE POLICY projects_admin_all
  ON public.projects FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY site_content_public_read
  ON public.site_content FOR SELECT TO anon
  USING (true);

CREATE POLICY site_content_admin_all
  ON public.site_content FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY site_themes_public_read
  ON public.site_themes FOR SELECT TO anon
  USING (true);

CREATE POLICY site_themes_admin_all
  ON public.site_themes FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY testimonials_public_read_approved
  ON public.testimonials FOR SELECT TO anon
  USING (status = 'approved');

CREATE POLICY testimonials_admin_all
  ON public.testimonials FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY site_assets_public_read
  ON public.site_assets FOR SELECT TO anon
  USING (true);

CREATE POLICY site_assets_admin_all
  ON public.site_assets FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY contact_submissions_public_insert
  ON public.contact_submissions FOR INSERT TO anon
  WITH CHECK ((SELECT auth.role()) = 'anon');

CREATE POLICY contact_submissions_admin_all
  ON public.contact_submissions FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY contact_submissions_customer_read
  ON public.contact_submissions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.customers
      WHERE customers.id = contact_submissions.customer_id
        AND customers.user_id = auth.uid()
    )
  );

-- User profiles
DROP POLICY IF EXISTS user_profiles_admin_all ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_self_select ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_self_update ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_self_insert ON public.user_profiles;

CREATE POLICY user_profiles_admin_all
  ON public.user_profiles FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY user_profiles_self_select
  ON public.user_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY user_profiles_self_insert
  ON public.user_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND role = COALESCE(public.current_app_role(), 'customer'));

CREATE POLICY user_profiles_self_update
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND role = COALESCE(public.current_app_role(), role));

-- Customers
DROP POLICY IF EXISTS customers_admin_all ON public.customers;
DROP POLICY IF EXISTS customers_self_select ON public.customers;
DROP POLICY IF EXISTS customers_self_update ON public.customers;

CREATE POLICY customers_admin_all
  ON public.customers FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY customers_self_select
  ON public.customers FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY customers_self_update
  ON public.customers FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Billing settings
DROP POLICY IF EXISTS billing_settings_admin_all ON public.billing_settings;

CREATE POLICY billing_settings_admin_all
  ON public.billing_settings FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Invoices
DROP POLICY IF EXISTS invoices_admin_all ON public.invoices;
DROP POLICY IF EXISTS invoices_customer_read ON public.invoices;

CREATE POLICY invoices_admin_all
  ON public.invoices FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY invoices_customer_read
  ON public.invoices FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.customers
      WHERE customers.id = invoices.customer_id
        AND customers.user_id = auth.uid()
    )
  );

-- Invoice line items
DROP POLICY IF EXISTS invoice_line_items_admin_all ON public.invoice_line_items;
DROP POLICY IF EXISTS invoice_line_items_customer_read ON public.invoice_line_items;

CREATE POLICY invoice_line_items_admin_all
  ON public.invoice_line_items FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY invoice_line_items_customer_read
  ON public.invoice_line_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.invoices
      JOIN public.customers ON customers.id = invoices.customer_id
      WHERE invoices.id = invoice_line_items.invoice_id
        AND customers.user_id = auth.uid()
    )
  );

-- Payments
DROP POLICY IF EXISTS payments_admin_all ON public.payments;
DROP POLICY IF EXISTS payments_customer_read ON public.payments;

CREATE POLICY payments_admin_all
  ON public.payments FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY payments_customer_read
  ON public.payments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.customers
      WHERE customers.id = payments.customer_id
        AND customers.user_id = auth.uid()
    )
  );
