-- ============================================================
-- BalloonCraft — Initial Supabase Schema
-- Run this in the Supabase SQL editor or via `supabase db push`
-- ============================================================

-- contact_submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  email       text NOT NULL,
  phone       text,
  event_type  text,
  event_date  date,
  message     text NOT NULL,
  status      text NOT NULL DEFAULT 'new',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- projects
CREATE TABLE IF NOT EXISTS projects (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text NOT NULL,
  slug             text NOT NULL UNIQUE,
  excerpt          text,
  content          text,
  featured_image   text,
  gallery_images   text[],
  category         text,
  tags             text[],
  meta_title       text,
  meta_description text,
  meta_keywords    text,
  og_image         text,
  status           text NOT NULL DEFAULT 'draft',
  featured         boolean NOT NULL DEFAULT false,
  event_date       date,
  event_location   text,
  client_name      text,
  publish_date     date,
  author           text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- site_content
CREATE TABLE IF NOT EXISTS site_content (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key     text NOT NULL UNIQUE,
  content_json text,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- site_themes
CREATE TABLE IF NOT EXISTS site_themes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key        text NOT NULL,
  active     boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- testimonials
CREATE TABLE IF NOT EXISTS testimonials (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  role       text,
  quote      text NOT NULL,
  rating     integer,
  avatar_url text,
  featured   boolean NOT NULL DEFAULT false,
  status     text NOT NULL DEFAULT 'approved',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- site_assets
CREATE TABLE IF NOT EXISTS site_assets (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  file_url   text NOT NULL,
  category   text,
  tags       text[],
  width      integer,
  height     integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Row-Level Security
-- ============================================================

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects            ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content        ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_themes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials        ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_assets         ENABLE ROW LEVEL SECURITY;

-- contact_submissions: public INSERT, authenticated full access
CREATE POLICY "public_insert_contact"
  ON contact_submissions FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "auth_all_contact"
  ON contact_submissions FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- projects: public SELECT published only, authenticated full CRUD
CREATE POLICY "public_read_published_projects"
  ON projects FOR SELECT TO anon
  USING (status = 'published');

CREATE POLICY "auth_all_projects"
  ON projects FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- site_content: public SELECT, authenticated write
CREATE POLICY "public_read_site_content"
  ON site_content FOR SELECT TO anon USING (true);

CREATE POLICY "auth_write_site_content"
  ON site_content FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- site_themes: public SELECT, authenticated write
CREATE POLICY "public_read_site_themes"
  ON site_themes FOR SELECT TO anon USING (true);

CREATE POLICY "auth_write_site_themes"
  ON site_themes FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- testimonials: public SELECT approved only, authenticated full CRUD
CREATE POLICY "public_read_approved_testimonials"
  ON testimonials FOR SELECT TO anon
  USING (status = 'approved');

CREATE POLICY "auth_all_testimonials"
  ON testimonials FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- site_assets: public SELECT, authenticated write
CREATE POLICY "public_read_site_assets"
  ON site_assets FOR SELECT TO anon USING (true);

CREATE POLICY "auth_write_site_assets"
  ON site_assets FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ============================================================
-- Storage bucket: site-assets
-- Run this separately or create via Supabase dashboard:
--   Bucket name: site-assets
--   Public: true
-- ============================================================
