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
    .select('slug, updated_at, created_at')
    .eq('status', 'published');

  if (error) {
    console.error('Sitemap query error:', error);
    return res.status(500).send('Failed to generate sitemap');
  }

  const domain = req.headers.host || 'ballooncraft.com';
  const xml = generateSitemapXml(posts || [], domain);

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.status(200).send(xml);
}
