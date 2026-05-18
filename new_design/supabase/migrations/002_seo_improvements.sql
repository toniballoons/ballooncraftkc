-- ============================================================
-- BalloonCraft — SEO & Admin UX Improvements Migration
-- Run this in the Supabase SQL editor after 001_initial_schema.sql
-- ============================================================

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS focus_keyword       text,
  ADD COLUMN IF NOT EXISTS service_types       text[]      DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS event_types         text[]      DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS geo_city            text,
  ADD COLUMN IF NOT EXISTS client_quote        text,
  ADD COLUMN IF NOT EXISTS client_quote_name   text,
  ADD COLUMN IF NOT EXISTS gallery_images_meta jsonb       DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS updated_at          timestamptz DEFAULT now();

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS projects_updated_at ON projects;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
