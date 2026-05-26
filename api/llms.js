import { GEO_CITIES } from '../src/lib/seo.js';
import { DEFAULT_CONTACT_CONTENT } from '../src/lib/siteDefaults.js';
import { createSupabaseAdminClient, parseSiteContentRows } from './_seo-utils.js';

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
  const serviceArea = GEO_CITIES.filter(city => city !== 'Other');

  return [
    `# ${footer.company_name}`,
    '',
    `${footer.company_name} is a Kansas City metro balloon decor studio offering custom balloon installations for weddings, birthdays, baby showers, graduations, corporate events, grand openings, galas, and private celebrations.`,
    '',
    '## Primary services',
    '',
    ...PRIMARY_SERVICES.map(service => `- ${service}`),
    '',
    '## Service area',
    '',
    ...serviceArea.map(city => `- ${city}`),
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

export default async function handler(req, res) {
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
