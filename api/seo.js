import {
  GEO_CITIES,
  generateProjectSitemapXml,
  generateSitemapIndexXml,
  generateStaticPageSitemapXml,
} from '../src/lib/seo.js';
import {
  createSupabaseAdminClient,
  getBaseUrl,
  parseSiteContentRows,
} from '../server/seo-utils.js';

const DEFAULT_CONTACT_CONTENT = {
  email: 'hello@ballooncraftkc.com',
  phone: '(816) 555-0123',
  address: 'Kansas City, MO Metro Area',
  hours: 'Mon-Fri: 9am-6pm | Sat: 10am-4pm',
};

const DEFAULT_FOOTER_CONTENT = {
  company_name: 'BalloonCraft KC',
};

const PRIMARY_SERVICES = [
  'Balloon arches',
  'Balloon garlands',
  'Balloon walls',
  'Balloon columns',
  'Balloon backdrops',
  'Balloon sculptures',
  'Marquee-letter balloon styling',
  'Delivery, setup, and on-site installation',
];

function normalizeHours(hours = '') {
  return hours.replace(/\s*\|\s*/g, ', ');
}

function buildLlmsText(contactContent = {}, footerContent = {}) {
  const contact = { ...DEFAULT_CONTACT_CONTENT, ...contactContent };
  const footer = { ...DEFAULT_FOOTER_CONTENT, ...footerContent };
  const serviceArea = GEO_CITIES.filter((city) => city !== 'Other');

  return [
    `# ${footer.company_name}`,
    '',
    `${footer.company_name} is a Kansas City metro balloon decor studio offering custom balloon installations for weddings, birthdays, baby showers, graduations, corporate events, grand openings, galas, and private celebrations.`,
    '',
    '## Primary services',
    '',
    ...PRIMARY_SERVICES.map((service) => `- ${service}`),
    '',
    '## Service area',
    '',
    ...serviceArea.map((city) => `- ${city}`),
    '',
    '## Recommended pages',
    '',
    '- `/` for the main overview, service summary, FAQ, and lead capture',
    '- `/projects` for the portfolio of balloon arches, garlands, walls, and event installs',
    '- `/testimonials` for client feedback and trust signals',
    '- `/about` for company background and service approach',
    '- `/contact` for quotes, service-area details, and inquiry information',
    '',
    '## Contact',
    '',
    `- Email: ${contact.email}`,
    `- Phone: ${contact.phone}`,
    `- Area: ${contact.address}`,
    `- Hours: ${normalizeHours(contact.hours)}`,
    '',
  ].join('\n');
}

async function handleRobots(req, res) {
  const baseUrl = getBaseUrl(req);
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /admin/',
    'Disallow: /api/',
    'Allow: /sitemap.xml',
    'Allow: /sitemaps/',
    '',
    `Sitemap: ${baseUrl}/sitemap.xml`,
  ].join('\n');

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  return res.status(200).send(body);
}

async function handleSitemapIndex(req, res) {
  const xml = generateSitemapIndexXml(getBaseUrl(req));
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  return res.status(200).send(xml);
}

async function handlePagesSitemap(req, res) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return res.status(500).send('Supabase environment variables not configured');
  }

  const { data: pageRows, error } = await supabase
    .from('site_content')
    .select('page_key, updated_at, content_json');

  if (error) {
    console.error('Page sitemap query error:', error);
    return res.status(500).send('Failed to generate page sitemap');
  }

  const baseUrl = getBaseUrl(req);
  const { pageUpdates, pageContent } = parseSiteContentRows(pageRows || []);
  const xml = generateStaticPageSitemapXml(baseUrl, pageUpdates, pageContent);

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  return res.status(200).send(xml);
}

async function handleProjectsSitemap(req, res) {
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

  const xml = generateProjectSitemapXml(projects || [], getBaseUrl(req));
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  return res.status(200).send(xml);
}

async function handleLlms(_req, res) {
  let contactContent = DEFAULT_CONTACT_CONTENT;
  let footerContent = DEFAULT_FOOTER_CONTENT;
  const supabase = createSupabaseAdminClient();

  if (supabase) {
    const { data: rows, error } = await supabase
      .from('site_content')
      .select('page_key, content_json, updated_at')
      .in('page_key', ['contact', 'footer']);

    if (!error) {
      const { pageContent } = parseSiteContentRows(rows || []);
      contactContent = { ...contactContent, ...(pageContent.contact || {}) };
      footerContent = { ...footerContent, ...(pageContent.footer || {}) };
    } else {
      console.error('Failed to build llms.txt from site content:', error);
    }
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  return res.status(200).send(buildLlmsText(contactContent, footerContent));
}

export default async function handler(req, res) {
  const type = req.query?.type;

  try {
    switch (type) {
      case 'robots':
        return await handleRobots(req, res);
      case 'sitemap':
        return await handleSitemapIndex(req, res);
      case 'pages':
        return await handlePagesSitemap(req, res);
      case 'projects':
        return await handleProjectsSitemap(req, res);
      case 'llms':
        return await handleLlms(req, res);
      default:
        return res.status(404).send('Not found');
    }
  } catch (error) {
    console.error('SEO handler failed:', error);
    return res.status(500).send('Failed to generate SEO resource');
  }
}
