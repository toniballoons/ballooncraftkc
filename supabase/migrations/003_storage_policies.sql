-- ============================================================
-- Storage bucket policies for site-assets
-- Run this in the Supabase SQL editor after creating the
-- site-assets bucket with Public enabled.
-- ============================================================

-- Allow authenticated users to upload files
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public read access to all files in site-assets
CREATE POLICY "Public read site-assets"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'site-assets');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated upload site-assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'site-assets');

-- Allow authenticated users to update/replace files
CREATE POLICY "Authenticated update site-assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'site-assets');

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated delete site-assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'site-assets');
