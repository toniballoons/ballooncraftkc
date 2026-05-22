// ============================================================
// BalloonCraft — SEO Utility Functions
// Pure functions — no side effects, no imports from React or Supabase
// ============================================================

// ── Controlled vocabulary ────────────────────────────────────

export const SERVICE_TYPES = [
  'Balloon Arch',
  'Balloon Garland',
  'Balloon Column',
  'Balloon Wall',
  'Photo Backdrop',
  'Balloon Sculpture',
  'Balloon Bouquet',
  'Balloon Ceiling',
  'Marquee Letters',
  'Custom Installation',
];

export const EVENT_TYPES = [
  'Wedding',
  'Birthday',
  'Corporate',
  'Baby Shower',
  'Graduation',
  'Office Party',
  'Community Event',
  'Gala',
  'Brand Activation',
  'Holiday',
];

export const GEO_CITIES = [
  'Kansas City',
  'Overland Park',
  'Olathe',
  "Lee's Summit",
  'Independence',
  'Lenexa',
  'Shawnee',
  'Prairie Village',
  'Leawood',
  'Other',
];

export const PRIMARY_SERVICE_PHRASES = [
  'balloon decor Kansas City',
  'balloon decorations Kansas City',
  'balloon arch Kansas City',
  'balloon garland Kansas City',
  'balloon wall Kansas City',
  'balloon backdrop Kansas City',
  'balloon delivery Kansas City',
  'balloon installation Kansas City',
];

export const PRIMARY_EVENT_PHRASES = [
  'wedding balloon decor',
  'birthday balloon decor',
  'baby shower balloon decor',
  'graduation balloon decor',
  'corporate event balloon decor',
  'grand opening balloon decor',
];

// ── Slug utilities ───────────────────────────────────────────

/**
 * Convert a title string to a URL-safe slug.
 * e.g. "Pink Balloon Arch — Wedding!" → "pink-balloon-arch-wedding"
 */
export function generateSlug(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Sanitize a manually entered slug: lowercase + spaces → hyphens.
 * Idempotent: sanitizeSlug(sanitizeSlug(s)) === sanitizeSlug(s)
 */
export function sanitizeSlug(raw) {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Ensure a slug is unique within a set of existing slugs.
 * Appends -2, -3, etc. until unique.
 * @param {string} base - The desired slug
 * @param {string[]} existingSlugs - All slugs currently in use
 * @param {string} [currentId] - ID of the post being edited (excluded from collision check)
 */
export function resolveUniqueSlug(base, existingSlugs, currentId) {
  const others = existingSlugs.filter(s => s !== base || currentId === undefined);
  if (!others.includes(base)) return base;
  let counter = 2;
  while (others.includes(`${base}-${counter}`)) counter++;
  return `${base}-${counter}`;
}

// ── Text utilities ───────────────────────────────────────────

/**
 * Strip HTML tags and common Markdown markers from a string.
 */
export function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')           // HTML tags
    .replace(/#{1,6}\s/g, '')          // Markdown headings
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
    .replace(/\*([^*]+)\*/g, '$1')     // Italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
    .replace(/^\s*[-*+]\s/gm, '')      // List markers
    .replace(/^\s*\d+\.\s/gm, '')      // Ordered list markers
    .trim();
}

/**
 * Truncate a string to max characters.
 */
export function truncate(str, max) {
  if (!str) return '';
  return str.slice(0, max);
}

export function normalizeBaseUrl(domainOrUrl = 'https://ballooncraftkc.com') {
  if (!domainOrUrl) return 'https://ballooncraftkc.com';
  if (/^https?:\/\//i.test(domainOrUrl)) return domainOrUrl.replace(/\/$/, '');
  return `https://${domainOrUrl.replace(/\/$/, '')}`;
}

export function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildSeoKeywordSet(...groups) {
  return [...new Set(groups.flat().filter(Boolean))];
}

// ── SEO auto-fill ────────────────────────────────────────────

/**
 * Auto-fill empty SEO fields from post content.
 * Returns { filled: updatedForm, didFill: boolean }
 */
export function autoFillSeoFields(form) {
  const filled = { ...form };
  let didFill = false;

  if (!filled.meta_title && filled.title) {
    filled.meta_title = truncate(filled.title, 60);
    didFill = true;
  }

  if (!filled.meta_description) {
    if (filled.excerpt) {
      filled.meta_description = truncate(filled.excerpt, 160);
      didFill = true;
    } else if (filled.content) {
      filled.meta_description = truncate(stripHtml(filled.content), 160);
      didFill = true;
    }
  }

  if (!filled.og_image) {
    if (filled.featured_image) {
      filled.og_image = filled.featured_image;
      didFill = true;
    } else {
      const firstMeta = Array.isArray(filled.gallery_images_meta) && filled.gallery_images_meta[0]?.url;
      const firstPlain = Array.isArray(filled.gallery_images) && filled.gallery_images[0];
      if (firstMeta) {
        filled.og_image = firstMeta;
        didFill = true;
      } else if (firstPlain) {
        filled.og_image = firstPlain;
        didFill = true;
      }
    }
  }

  return { filled, didFill };
}

// ── OG image resolution ──────────────────────────────────────

/**
 * Resolve the best OG image for a post using a waterfall fallback.
 */
export function resolveOgImage(post, siteDefaultOg = '') {
  if (post.og_image) return post.og_image;
  if (post.featured_image) return post.featured_image;
  if (Array.isArray(post.gallery_images_meta) && post.gallery_images_meta[0]?.url) {
    return post.gallery_images_meta[0].url;
  }
  if (Array.isArray(post.gallery_images) && post.gallery_images[0]) {
    return post.gallery_images[0];
  }
  return siteDefaultOg;
}

// ── JSON-LD structured data ──────────────────────────────────

/**
 * Build a BlogPosting + LocalBusiness JSON-LD object for a post page.
 */
export function buildJsonLd(post, siteContent = {}) {
  const businessName =
    siteContent?.footer?.company_name ||
    siteContent?.navbar?.logo_text ||
    'BalloonCraft KC';
  const siteUrl = normalizeBaseUrl(
    typeof window !== 'undefined' ? window.location.origin : 'https://ballooncraftkc.com'
  );
  const locality = post.geo_city || 'Kansas City';
  const canonicalUrl = formatCanonicalUrl(siteUrl, `/projects/${post.slug || ''}`);
  const ogImage = resolveOgImage(post, formatCanonicalUrl(siteUrl, '/logo.png'));
  const keywords = buildSeoKeywordSet(
    post.focus_keyword ? [post.focus_keyword] : [],
    post.service_types || [],
    post.event_types || [],
    post.tags || [],
    post.geo_city ? [post.geo_city] : []
  );

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${canonicalUrl}#article`,
    mainEntityOfPage: canonicalUrl,
    url: canonicalUrl,
    headline: post.title || '',
    description: post.meta_description || post.excerpt || '',
    image: ogImage ? [ogImage] : [],
    datePublished: post.publish_date || post.created_at || '',
    dateModified: post.updated_at || post.created_at || '',
    articleSection: (post.event_types || []).join(', '),
    keywords: keywords.join(', '),
    about: keywords.map(name => ({
      '@type': 'Thing',
      name,
    })),
    contentLocation: {
      '@type': 'Place',
      name: post.event_location || locality,
      address: {
        '@type': 'PostalAddress',
        addressLocality: locality,
        addressRegion: 'MO',
        addressCountry: 'US',
      },
    },
    author: {
      '@type': post.author ? 'Person' : 'Organization',
      name: post.author || businessName,
    },
    publisher: {
      '@type': 'Organization',
      name: businessName,
      '@id': `${siteUrl}#website`,
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: formatCanonicalUrl(siteUrl, '/logo.png'),
      },
    },
  };
}

// ── SEO score ────────────────────────────────────────────────

/**
 * Compute a 0–4 SEO score for a post based on focus keyword presence.
 * Returns { score: number, checks: [inTitle, inMetaDesc, inContent, inSlug] }
 */
export function computeSeoScore(keyword, post) {
  if (!keyword) return { score: 0, checks: [false, false, false, false] };
  const kw = keyword.toLowerCase();
  const checks = [
    (post.title || '').toLowerCase().includes(kw),
    (post.meta_description || '').toLowerCase().includes(kw),
    stripHtml(post.content || '').toLowerCase().includes(kw),
    (post.slug || '').toLowerCase().includes(kw),
  ];
  return { score: checks.filter(Boolean).length, checks };
}

// ── Related posts ────────────────────────────────────────────

/**
 * Find up to 3 related published posts for a given post.
 * Scoring: +2 per shared service_type, +1 per shared event_type.
 * Falls back to most recent posts.
 */
export function computeRelatedPosts(current, candidates) {
  const pool = candidates.filter(
    p => p.id !== current.id && p.status === 'published'
  );

  const scored = pool.map(p => {
    let score = 0;
    const currentServices = current.service_types || [];
    const currentEvents = current.event_types || [];
    (p.service_types || []).forEach(s => { if (currentServices.includes(s)) score += 2; });
    (p.event_types || []).forEach(e => { if (currentEvents.includes(e)) score += 1; });
    return { post: p, score };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.post.created_at) - new Date(a.post.created_at);
  });

  return scored.slice(0, 3).map(s => s.post);
}

// ── Dashboard stat helpers ───────────────────────────────────

/**
 * Count messages received in the last 7 days.
 */
export function computeWeeklyMessageCount(messages) {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return messages.filter(m => new Date(m.created_at).getTime() >= cutoff).length;
}

/**
 * Count projects by status.
 */
export function computeStatusCounts(projects) {
  return projects.reduce(
    (acc, p) => {
      if (p.status === 'published') acc.published++;
      else if (p.status === 'draft') acc.draft++;
      else if (p.status === 'archived') acc.archived++;
      return acc;
    },
    { published: 0, draft: 0, archived: 0 }
  );
}

/**
 * Count published posts missing critical SEO fields.
 */
export function computeSeoHealthCounts(projects) {
  const published = projects.filter(p => p.status === 'published');
  return {
    missingMeta: published.filter(p => !p.meta_description).length,
    missingKeyword: published.filter(p => !p.focus_keyword).length,
    missingImage: published.filter(p => !p.featured_image).length,
  };
}

// ── URL utilities ────────────────────────────────────────────

/**
 * Build a canonical URL with no double slashes.
 */
export function formatCanonicalUrl(domain, path) {
  const base = normalizeBaseUrl(domain);
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

/**
 * Append geo city to a meta title if not already present.
 * Idempotent: calling twice produces the same result.
 */
export function appendGeoToTitle(metaTitle, geoCity) {
  if (!geoCity || !metaTitle) return metaTitle || '';
  if (metaTitle.includes(geoCity)) return metaTitle;
  return `${metaTitle} | ${geoCity}`;
}

// ── Sitemap builder ──────────────────────────────────────────

const STATIC_PAGES = [
  {
    path: '/',
    changefreq: 'weekly',
    priority: '1.0',
    pageKeys: ['hero', 'about', 'contact'],
    imageSources: [
      { pageKey: 'hero', fields: ['image'] },
      { pageKey: 'about', fields: ['image'] },
      { pageKey: 'contact', fields: ['image'] },
    ],
  },
  {
    path: '/about',
    changefreq: 'monthly',
    priority: '0.8',
    pageKeys: ['about'],
    imageSources: [{ pageKey: 'about', fields: ['image'] }],
  },
  { path: '/projects', changefreq: 'weekly', priority: '0.9', pageKeys: ['projects'], imageSources: [] },
  {
    path: '/testimonials',
    changefreq: 'monthly',
    priority: '0.7',
    pageKeys: ['testimonials'],
    imageSources: [{ pageKey: 'testimonials', fields: ['bg_image'] }],
  },
  {
    path: '/contact',
    changefreq: 'monthly',
    priority: '0.8',
    pageKeys: ['contact'],
    imageSources: [{ pageKey: 'contact', fields: ['image'] }],
  },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3', pageKeys: ['privacy'], imageSources: [] },
  { path: '/terms', changefreq: 'yearly', priority: '0.3', pageKeys: ['terms'], imageSources: [] },
  { path: '/legal', changefreq: 'yearly', priority: '0.3', pageKeys: ['legal'], imageSources: [] },
];

function getLatestPageDate(pageKeys = [], pageUpdates = {}) {
  const dates = pageKeys
    .map(key => pageUpdates[key])
    .filter(Boolean)
    .map(value => new Date(value).toISOString().split('T')[0]);
  return dates.sort().reverse()[0] || new Date().toISOString().split('T')[0];
}

function buildOpeningHours(hours = '') {
  if (!hours) return [];
  return hours.split('|').map(part => part.trim()).filter(Boolean);
}

const DAY_ORDER = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const DAY_MAP = {
  mon: 'monday',
  monday: 'monday',
  tue: 'tuesday',
  tues: 'tuesday',
  tuesday: 'tuesday',
  wed: 'wednesday',
  weds: 'wednesday',
  wednesday: 'wednesday',
  thu: 'thursday',
  thur: 'thursday',
  thurs: 'thursday',
  thursday: 'thursday',
  fri: 'friday',
  friday: 'friday',
  sat: 'saturday',
  saturday: 'saturday',
  sun: 'sunday',
  sunday: 'sunday',
};

function toSchemaDay(dayToken = '') {
  const normalized = DAY_MAP[dayToken.trim().toLowerCase()];
  return normalized ? `https://schema.org/${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}` : null;
}

function expandDayRange(startToken = '', endToken = '') {
  const start = DAY_MAP[startToken.trim().toLowerCase()];
  const end = DAY_MAP[endToken.trim().toLowerCase()];

  if (!start) return [];
  if (!end || start === end) {
    return [toSchemaDay(startToken)].filter(Boolean);
  }

  const startIndex = DAY_ORDER.indexOf(start);
  const endIndex = DAY_ORDER.indexOf(end);
  if (startIndex === -1 || endIndex === -1) return [];

  if (startIndex <= endIndex) {
    return DAY_ORDER.slice(startIndex, endIndex + 1).map(day => `https://schema.org/${day.charAt(0).toUpperCase()}${day.slice(1)}`);
  }

  return [...DAY_ORDER.slice(startIndex), ...DAY_ORDER.slice(0, endIndex + 1)]
    .map(day => `https://schema.org/${day.charAt(0).toUpperCase()}${day.slice(1)}`);
}

function normalizeTimeTo24Hour(value = '') {
  const match = value.trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = match[2] || '00';
  const meridiem = match[3];

  if (hours === 12) {
    hours = meridiem === 'am' ? 0 : 12;
  } else if (meridiem === 'pm') {
    hours += 12;
  }

  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

function buildOpeningHoursSpecifications(hours = '') {
  return buildOpeningHours(hours)
    .map(segment => {
      const match = segment.match(/^([A-Za-z]{3,9})(?:\s*-\s*([A-Za-z]{3,9}))?\s*:?\s*([0-9:\s]+(?:am|pm))\s*-\s*([0-9:\s]+(?:am|pm))$/i);
      if (!match) return null;

      const days = match[2] ? expandDayRange(match[1], match[2]) : [toSchemaDay(match[1])].filter(Boolean);
      const opens = normalizeTimeTo24Hour(match[3]);
      const closes = normalizeTimeTo24Hour(match[4]);

      if (days.length === 0 || !opens || !closes) return null;

      return {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: days,
        opens,
        closes,
      };
    })
    .filter(Boolean);
}

function toAbsoluteImageUrl(imageUrl = '', siteUrl = 'https://ballooncraftkc.com') {
  if (!imageUrl) return '';
  return /^https?:\/\//i.test(imageUrl) ? imageUrl : formatCanonicalUrl(siteUrl, imageUrl);
}

function dedupeImageEntries(entries = []) {
  const seen = new Set();

  return entries.filter(entry => {
    const key = entry?.loc;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildImageEntryXml(image = {}) {
  const titleEntry = image.title ? `\n      <image:title>${escapeXml(image.title)}</image:title>` : '';
  const captionEntry = image.caption ? `\n      <image:caption>${escapeXml(image.caption)}</image:caption>` : '';

  return `\n    <image:image>\n      <image:loc>${escapeXml(image.loc)}</image:loc>${titleEntry}${captionEntry}\n    </image:image>`;
}

function buildUrlSetXml(urls = []) {
  const urlEntries = urls
    .map(url => {
      const imageEntries = (url.images || []).map(buildImageEntryXml).join('');

      return `  <url>\n    <loc>${escapeXml(url.loc)}</loc>\n    <lastmod>${escapeXml(url.lastmod)}</lastmod>\n    <changefreq>${escapeXml(url.changefreq)}</changefreq>\n    <priority>${escapeXml(url.priority)}</priority>${imageEntries}\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urlEntries}\n</urlset>`;
}

function buildSitemapIndexXml(entries = []) {
  const body = entries
    .map(entry => {
      const lastmod = entry.lastmod ? `\n    <lastmod>${escapeXml(entry.lastmod)}</lastmod>` : '';
      return `  <sitemap>\n    <loc>${escapeXml(entry.loc)}</loc>${lastmod}\n  </sitemap>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>`;
}

function buildStaticPageImages(page = {}, pageContent = {}, domain) {
  const images = (page.imageSources || [])
    .flatMap(source => {
      const content = pageContent[source.pageKey] || {};
      return (source.fields || [])
        .map(field => content[field])
        .filter(Boolean)
        .map(imageUrl => ({
          loc: toAbsoluteImageUrl(imageUrl, domain),
          title: page.path === '/' ? 'BalloonCraft KC home page' : `BalloonCraft KC ${page.path.replace(/^\//, '')} page`,
        }));
    });

  return dedupeImageEntries(images);
}

function buildProjectImageEntries(project = {}, domain) {
  const galleryMetaImages = Array.isArray(project.gallery_images_meta)
    ? project.gallery_images_meta.map(item => item?.url).filter(Boolean)
    : [];
  const galleryImages = Array.isArray(project.gallery_images)
    ? project.gallery_images.filter(Boolean)
    : [];
  const imageCandidates = [
    project.featured_image,
    project.og_image,
    ...galleryMetaImages,
    ...galleryImages,
  ].filter(Boolean);

  return dedupeImageEntries(
    imageCandidates.slice(0, 6).map(imageUrl => ({
      loc: toAbsoluteImageUrl(imageUrl, domain),
      title: project.title || 'BalloonCraft KC project',
      caption: project.excerpt || project.title || undefined,
    }))
  );
}

export function buildSocialLinks(socialLinks = {}) {
  return Object.values(socialLinks).filter(link => typeof link === 'string' && /^https?:\/\//i.test(link));
}

export function buildAreaServedList(cities = GEO_CITIES.filter(city => city !== 'Other')) {
  return cities.map(city => ({
    '@type': 'City',
    name: city,
  }));
}

export function buildWebsiteJsonLd({
  title = 'BalloonCraft KC',
  description = '',
  path = '/',
  siteUrl = 'https://ballooncraftkc.com',
} = {}) {
  const normalizedSiteUrl = normalizeBaseUrl(siteUrl);
  const url = formatCanonicalUrl(normalizedSiteUrl, path);

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${normalizedSiteUrl}#website`,
    name: title,
    url: normalizedSiteUrl,
    description,
    inLanguage: 'en-US',
    publisher: {
      '@type': 'Organization',
      '@id': `${normalizedSiteUrl}#organization`,
      name: 'BalloonCraft KC',
      url: normalizedSiteUrl,
    },
    potentialAction: {
      '@type': 'ViewAction',
      target: url,
    },
  };
}

export function buildOrganizationJsonLd({
  title = 'BalloonCraft KC',
  siteUrl = 'https://ballooncraftkc.com',
  contactContent = {},
  footerContent = {},
} = {}) {
  const normalizedSiteUrl = normalizeBaseUrl(siteUrl);
  const companyName = footerContent.company_name || title || 'BalloonCraft KC';
  const sameAs = buildSocialLinks(contactContent.social_links);

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${normalizedSiteUrl}#organization`,
    name: companyName,
    url: normalizedSiteUrl,
    logo: formatCanonicalUrl(normalizedSiteUrl, '/logo.png'),
    email: contactContent.email || undefined,
    telephone: contactContent.phone || undefined,
    sameAs,
  };
}

export function buildLocalBusinessJsonLd({
  title = 'BalloonCraft KC',
  description = '',
  path = '/',
  image = '',
  siteUrl = 'https://ballooncraftkc.com',
  contactContent = {},
  footerContent = {},
  serviceTypes = SERVICE_TYPES,
  eventTypes = EVENT_TYPES,
  areaServed = GEO_CITIES.filter(city => city !== 'Other'),
} = {}) {
  const normalizedSiteUrl = normalizeBaseUrl(siteUrl);
  const url = formatCanonicalUrl(normalizedSiteUrl, path);
  const companyName = footerContent.company_name || title || 'BalloonCraft KC';
  const sameAs = buildSocialLinks(contactContent.social_links);
  const areaServedList = buildAreaServedList(areaServed);
  const openingHoursSpecification = buildOpeningHoursSpecifications(contactContent.hours);
  const offerItems = buildSeoKeywordSet(serviceTypes, eventTypes).map(name => ({
    '@type': 'Offer',
    itemOffered: {
      '@type': 'Service',
      name,
    },
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${normalizedSiteUrl}#localbusiness`,
    additionalType: 'https://schema.org/ProfessionalService',
    name: companyName,
    url: normalizedSiteUrl,
    description,
    image: toAbsoluteImageUrl(image || '/logo.png', normalizedSiteUrl),
    logo: formatCanonicalUrl(normalizedSiteUrl, '/logo.png'),
    telephone: contactContent.phone || undefined,
    email: contactContent.email || undefined,
    openingHoursSpecification: openingHoursSpecification.length > 0 ? openingHoursSpecification : undefined,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Kansas City',
      addressRegion: 'MO',
      addressCountry: 'US',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      telephone: contactContent.phone || undefined,
      email: contactContent.email || undefined,
      areaServed: 'Kansas City Metro',
      availableLanguage: 'English',
      url,
    },
    areaServed: areaServedList,
    serviceArea: areaServedList,
    sameAs,
    slogan: footerContent.tagline || undefined,
    keywords: buildSeoKeywordSet(serviceTypes, eventTypes, areaServed).join(', '),
    knowsAbout: buildSeoKeywordSet(serviceTypes, eventTypes),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Balloon decor services',
      itemListElement: offerItems,
    },
  };
}

export function buildServiceJsonLd({
  serviceName = 'Custom balloon decor and event installations',
  description = '',
  path = '/',
  image = '',
  siteUrl = 'https://ballooncraftkc.com',
  footerContent = {},
  serviceTypes = SERVICE_TYPES,
  eventTypes = EVENT_TYPES,
  areaServed = GEO_CITIES.filter(city => city !== 'Other'),
} = {}) {
  const normalizedSiteUrl = normalizeBaseUrl(siteUrl);
  const url = formatCanonicalUrl(normalizedSiteUrl, path);
  const companyName = footerContent.company_name || 'BalloonCraft KC';
  const areaServedList = buildAreaServedList(areaServed);

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${url}#service`,
    name: serviceName,
    serviceType: buildSeoKeywordSet(serviceTypes, eventTypes),
    description,
    url,
    image: toAbsoluteImageUrl(image || '/logo.png', normalizedSiteUrl),
    areaServed: areaServedList,
    provider: {
      '@type': 'LocalBusiness',
      '@id': `${normalizedSiteUrl}#localbusiness`,
      name: companyName,
      url: normalizedSiteUrl,
    },
    offers: buildSeoKeywordSet(serviceTypes, eventTypes).map(name => ({
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name,
      },
    })),
  };
}

export function buildBreadcrumbJsonLd(items = [], siteUrl = 'https://ballooncraftkc.com') {
  const normalizedSiteUrl = normalizeBaseUrl(siteUrl);

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: formatCanonicalUrl(normalizedSiteUrl, item.path),
    })),
  };
}

export function buildFaqJsonLd(faqs = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function buildProjectCollectionJsonLd(
  projects = [],
  {
    title = 'Balloon Decor Portfolio',
    description = '',
    path = '/projects',
    image = '',
    siteUrl = 'https://ballooncraftkc.com',
  } = {}
) {
  const normalizedSiteUrl = normalizeBaseUrl(siteUrl);
  const url = formatCanonicalUrl(normalizedSiteUrl, path);

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}#collection`,
    url,
    name: title,
    description,
    image: image || undefined,
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${normalizedSiteUrl}#website`,
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListOrder: 'https://schema.org/ItemListUnordered',
      numberOfItems: projects.length,
      itemListElement: projects.map((project, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: formatCanonicalUrl(normalizedSiteUrl, `/projects/${project.slug}`),
        name: project.title,
      })),
    },
  };
}

export function buildStaticPageSitemapEntries(domain, pageUpdates = {}, pageContent = {}) {
  return STATIC_PAGES.map(page => ({
    loc: formatCanonicalUrl(domain, page.path),
    lastmod: getLatestPageDate(page.pageKeys, pageUpdates),
    changefreq: page.changefreq,
    priority: page.priority,
    images: buildStaticPageImages(page, pageContent, domain),
  }));
}

export function buildProjectSitemapEntries(posts = [], domain = 'https://ballooncraftkc.com') {
  return posts.map(project => ({
    loc: formatCanonicalUrl(domain, `/projects/${project.slug}`),
    lastmod: (project.updated_at || project.publish_date || project.created_at || new Date().toISOString()).split('T')[0],
    changefreq: 'monthly',
    priority: '0.8',
    images: buildProjectImageEntries(project, domain),
  }));
}

export function generateStaticPageSitemapXml(domain, pageUpdates = {}, pageContent = {}) {
  return buildUrlSetXml(buildStaticPageSitemapEntries(domain, pageUpdates, pageContent));
}

export function generateProjectSitemapXml(posts = [], domain = 'https://ballooncraftkc.com') {
  return buildUrlSetXml(buildProjectSitemapEntries(posts, domain));
}

export function generateSitemapIndexXml(domain, pageLastmod = '', projectLastmod = '') {
  return buildSitemapIndexXml([
    {
      loc: formatCanonicalUrl(domain, '/sitemaps/pages.xml'),
      lastmod: pageLastmod || undefined,
    },
    {
      loc: formatCanonicalUrl(domain, '/sitemaps/projects.xml'),
      lastmod: projectLastmod || undefined,
    },
  ]);
}

/**
 * Backward-compatible combined sitemap builder.
 */
export function generateSitemapXml(posts, domain, pageUpdates = {}, pageContent = {}) {
  return buildUrlSetXml([
    ...buildStaticPageSitemapEntries(domain, pageUpdates, pageContent),
    ...buildProjectSitemapEntries(posts, domain),
  ]);
}

// ── Duplicate post helper ────────────────────────────────────

/**
 * Create a duplicate post object ready for the editor.
 */
export function duplicatePost(post) {
  const { id, created_at, updated_at, ...rest } = post;
  return {
    ...rest,
    title: `Copy of ${post.title}`,
    status: 'draft',
    slug: '',
  };
}

// ── Bulk status update helper ────────────────────────────────

/**
 * Apply a new status to all posts whose IDs are in selectedIds.
 * Returns a new array — does not mutate the input.
 */
export function applyBulkStatus(posts, selectedIds, newStatus) {
  return posts.map(p =>
    selectedIds.includes(p.id) ? { ...p, status: newStatus } : p
  );
}

// ── Character counter color ──────────────────────────────────

/**
 * Return the color class for a character counter.
 * @param {number} length - Current character count
 * @param {number} max - Maximum allowed characters
 * @param {number} [optimalMin] - Start of optimal range
 */
export function getCounterColor(length, max, optimalMin) {
  if (length > max) return 'red';
  if (optimalMin !== undefined && length >= optimalMin && length <= max) return 'green';
  return 'gray';
}
