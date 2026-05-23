-- ============================================================
-- BalloonCraft KC — Uploaded contract documents + signer fields
-- ============================================================

ALTER TABLE contract_templates
  ADD COLUMN IF NOT EXISTS uploaded_documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS signature_fields jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE contract_packages
  ADD COLUMN IF NOT EXISTS uploaded_documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS signature_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS signature_field_values jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE contract_templates
SET
  uploaded_documents = COALESCE(uploaded_documents, '[]'::jsonb),
  signature_fields = COALESCE(signature_fields, '[]'::jsonb)
WHERE uploaded_documents IS NULL OR signature_fields IS NULL;

UPDATE contract_packages
SET
  uploaded_documents = COALESCE(uploaded_documents, '[]'::jsonb),
  signature_fields = COALESCE(signature_fields, '[]'::jsonb),
  signature_field_values = COALESCE(signature_field_values, '{}'::jsonb)
WHERE uploaded_documents IS NULL OR signature_fields IS NULL OR signature_field_values IS NULL;
