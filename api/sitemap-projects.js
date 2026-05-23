import { generateProjectSitemapXml } from '../src/lib/seo.js';
import { createSupabaseAdminClient, getBaseUrl } from './_seo-utils.js';

export default async function handler(req, res) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return res.status(500).send('Supabase environment variables not configured');
  }

  const { data: projects, error } = await supabase
    .from('projects')
    .select('slug, title, excerpt, featured_image, og_image, gallery_images, gallery_images_meta, publish_date, updated_at, created_at')
    .eq('status', 'published');

  if (error) {
    console.error('Project sitemap query error:', error);
    return res.status(500).send('Failed to generate project sitemap');
  }

  const baseUrl = getBaseUrl(req);
  const xml = generateProjectSitemapXml(projects || [], baseUrl);

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  return res.status(200).send(xml);
}
