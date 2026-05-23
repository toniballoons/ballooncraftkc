-- ============================================================
-- BalloonCraft KC — Client Operations / Invoicing / Agreements
-- ============================================================

CREATE TABLE IF NOT EXISTS clients (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_code     text NOT NULL UNIQUE,
  status          text NOT NULL DEFAULT 'lead',
  contact_name    text NOT NULL,
  business_name   text,
  email           text NOT NULL,
  phone           text,
  event_type      text,
  event_date      date,
  venue_name      text,
  venue_address   text,
  guest_count     integer,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_code          text NOT NULL UNIQUE,
  client_id             uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  status                text NOT NULL DEFAULT 'draft',
  invoice_title         text NOT NULL,
  event_type            text,
  event_date            date,
  event_location        text,
  service_summary       text,
  contract_amount       numeric(10,2) NOT NULL DEFAULT 0,
  down_payment_amount   numeric(10,2) NOT NULL DEFAULT 0,
  down_payment_due_date date,
  final_payment_amount  numeric(10,2) NOT NULL DEFAULT 0,
  final_payment_due_date date,
  payment_links         jsonb NOT NULL DEFAULT '{}'::jsonb,
  payment_instructions  text,
  additional_terms      text,
  sent_at               timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoice_payments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id          uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  transaction_code    text NOT NULL UNIQUE,
  confirmation_code   text NOT NULL UNIQUE,
  status              text NOT NULL DEFAULT 'recorded',
  payment_method      text,
  source_reference    text,
  amount              numeric(10,2) NOT NULL,
  paid_at             timestamptz NOT NULL DEFAULT now(),
  recorded_by         text,
  note                text,
  email_receipt_sent  boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contract_templates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_code   text NOT NULL UNIQUE,
  status          text NOT NULL DEFAULT 'active',
  name            text NOT NULL,
  description     text,
  subject_line    text,
  intro_text      text,
  document_title  text NOT NULL,
  body_text       text NOT NULL,
  closing_text    text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contract_packages (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_code          text NOT NULL UNIQUE,
  access_token          text NOT NULL UNIQUE,
  client_id             uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  invoice_id            uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  template_id           uuid REFERENCES contract_templates(id) ON DELETE SET NULL,
  status                text NOT NULL DEFAULT 'sent',
  email_stage           text NOT NULL DEFAULT 'downpayment',
  packet_title          text NOT NULL,
  subject_line          text,
  recipient_name        text NOT NULL,
  recipient_email       text NOT NULL,
  merged_fields         jsonb NOT NULL DEFAULT '{}'::jsonb,
  payment_links         jsonb NOT NULL DEFAULT '{}'::jsonb,
  payment_instructions  text,
  document_title        text NOT NULL,
  document_intro        text,
  document_body         text NOT NULL,
  document_closing      text,
  viewed_at             timestamptz,
  signed_name           text,
  signed_initials       text,
  signed_title          text,
  signature_value       text,
  agreed_to_terms       boolean NOT NULL DEFAULT false,
  signed_at             timestamptz,
  signer_ip             text,
  completion_email_sent boolean NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_all_clients" ON clients;
CREATE POLICY "auth_all_clients"
  ON clients FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_all_invoices" ON invoices;
CREATE POLICY "auth_all_invoices"
  ON invoices FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_all_invoice_payments" ON invoice_payments;
CREATE POLICY "auth_all_invoice_payments"
  ON invoice_payments FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_all_contract_templates" ON contract_templates;
CREATE POLICY "auth_all_contract_templates"
  ON contract_templates FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_all_contract_packages" ON contract_packages;
CREATE POLICY "auth_all_contract_packages"
  ON contract_packages FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
