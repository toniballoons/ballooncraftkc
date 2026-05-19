import { createClient } from '@supabase/supabase-js';
import { generateSitemapXml } from '../src/lib/seo.js';

export default async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).send('Supabase environment variables not configured');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: posts, error } = await supabase
    .from('projects')
    .select('slug, updated_at, created_at, featured_image')
    .eq('status', 'published');

  const { data: pageContent, error: pageError } = await supabase
    .from('site_content')
    .select('page_key, updated_at');

  if (error) {
    console.error('Sitemap query error:', error);
    return res.status(500).send('Failed to generate sitemap');
  }

  if (pageError) {
    console.error('Sitemap page content query error:', pageError);
    return res.status(500).send('Failed to generate sitemap');
  }

  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'ballooncraftkc.com';
  const pageUpdates = Object.fromEntries((pageContent || []).map(page => [page.page_key, page.updated_at]));
  const xml = generateSitemapXml(posts || [], `${protocol}://${host}`, pageUpdates);

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  return res.status(200).send(xml);
}
