// ============================================================
// BalloonCraft — SEO Utility Functions
// Pure functions — no side effects, no imports from React or Supabase
// ============================================================

// ── Controlled vocabulary ────────────────────────────────────

export const SERVICE_TYPES = [
  'Organic Balloon Garland',
  'Balloon Arch',
  'Balloon Garland',
  'Balloon Column',
  'Entrance Install',
  'Balloon Wall',
  'Photo Backdrop',
  'Step-and-Repeat Frame',
  'Balloon Sculpture',
  'Balloon Bouquet',
  'Balloon Ceiling',
  'Table Centerpieces',
  'Marquee Letters',
  'Grab-and-Go Garland',
  'Branded Corporate Install',
  'Custom Installation',
];

export const EVENT_TYPES = [
  'Wedding',
  'Birthday',
  'Corporate',
  'Baby Shower',
  'Bridal Shower',
  'Engagement Party',
  'Graduation',
  'Prom',
  'Homecoming',
  'Grand Opening',
  'Retail Launch',
  'Office Party',
  'Community Event',
  'Gala',
  'Brand Activation',
  'Fundraiser',
  'Sports Banquet',
  'School Event',
  'Holiday',
];

export const GEO_CITIES = [
  'Kansas City',
  'Overland Park',
  'Olathe',
  "Lee's Summit",
  'Independence',
  'Blue Springs',
  'Liberty',
  'Lenexa',
  'Shawnee',
  'Parkville',
  'North Kansas City',
  'Prairie Village',
  'Leawood',
  'Belton',
  'Raymore',
  'Other',
];

export const LOCAL_SERVICE_AREAS = [
  'Kansas City, MO',
  'Overland Park, KS',
  'Olathe, KS',
  "Lee's Summit, MO",
  'Blue Springs, MO',
  'Liberty, MO',
  'Lenexa, KS',
  'Leawood, KS',
  'Parkville, MO',
  'North Kansas City, MO',
  'Prairie Village, KS',
  'Shawnee, KS',
  'Independence, MO',
  'Belton, MO',
  'Raymore, MO',
  'Johnson County, KS',
];

export const LOCAL_SERVICE_HIGHLIGHTS = [
  {
    title: 'Statement balloon arches and organic garlands',
    description: 'Full, photo-ready installs for entryways, dessert tables, staircases, stages, and focal walls.',
  },
  {
    title: 'Backdrops, walls, and branded photo moments',
    description: 'Custom balloon walls, step-and-repeat styling, and event backdrops that make guests stop and take photos.',
  },
  {
    title: 'Grand openings, retail launches, and brand activations',
    description: 'High-impact decor for storefronts, ribbon cuttings, office parties, and promotional events that need energy and visibility.',
  },
  {
    title: 'Weddings, showers, birthdays, and milestone parties',
    description: 'Romantic, playful, or over-the-top installs tailored to the tone of your celebration and venue.',
  },
  {
    title: 'School events, proms, graduations, and community celebrations',
    description: 'Decor that fills gyms, auditoriums, halls, and outdoor spaces with color, spirit, and crowd-pleasing scale.',
  },
  {
    title: 'Delivery, setup, styling, and teardown planning',
    description: 'From design through install-day logistics, BalloonCraft KC handles the details so your event feels polished and easy.',
  },
];

export const LOCAL_EVENT_HIGHLIGHTS = [
  'Weddings and rehearsal dinners',
  'Birthdays and anniversary parties',
  'Baby showers and bridal showers',
  'Graduations, proms, and homecomings',
  'Grand openings and retail launches',
  'Corporate parties and branded activations',
  'School events and sports banquets',
  'Galas, fundraisers, and community celebrations',
];

export const LOCAL_HOME_FAQS = [
  {
    question: 'How far ahead should I book balloon decor in Kansas City?',
    answer: 'For weddings, corporate installs, and large custom builds in the Kansas City metro, booking several weeks ahead is best. For smaller garlands or simple installs, earlier is still better so your event date stays open.',
  },
  {
    question: 'Do you travel outside Kansas City for balloon arches and garlands?',
    answer: 'Yes. BalloonCraft KC serves Kansas City, Overland Park, Olathe, Lee’s Summit, Lenexa, Leawood, Prairie Village, Shawnee, Independence, and nearby Johnson County venues.',
  },
  {
    question: 'Can you handle corporate events, grand openings, and branded installs?',
    answer: 'Yes. We design balloon walls, branded backdrops, entry installations, photo moments, and launch-day decor for stores, offices, schools, teams, and community events.',
  },
  {
    question: 'Do you offer custom balloon backdrops for birthdays, showers, and weddings?',
    answer: 'Yes. We create custom balloon garlands, arches, walls, backdrops, marquees, and other installs for birthdays, baby showers, weddings, graduations, holiday parties, and more.',
  },
  {
    question: 'Do you decorate schools, proms, graduations, and community events?',
    answer: 'Yes. BalloonCraft KC creates large-scale decor for school dances, graduation parties, spirit events, banquets, fundraisers, and community celebrations across the KC metro.',
  },
  {
    question: 'Can BalloonCraft KC provide setup help beyond just dropping off balloons?',
    answer: 'Yes. We can handle design planning, delivery, on-site installation, styling, and event-ready placement so the final result feels complete and polished.',
  },
  {
    question: 'How long do balloon installations last?',
    answer: 'Indoor installs usually hold up much longer than outdoor installs. Outdoor balloon decor depends on heat, wind, direct sun, and setup timing, so we plan designs around Kansas City weather and venue conditions.',
  },
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
  const businessName = siteContent?.navbar?.brand || siteContent?.navbar?.logo_text || 'BalloonCraft KC';
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.ballooncraftkc.com';
  const locality = post.geo_city || 'Kansas City';
  const keywords = [
    ...(post.service_types || []),
    ...(post.event_types || []),
    post.geo_city,
    ...(post.tags || []),
  ].filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${siteUrl}/projects/${post.slug}#article`,
    headline: post.title || '',
    description: post.meta_description || post.excerpt || '',
    image: resolveOgImage(post),
    datePublished: post.publish_date || post.created_at || '',
    dateModified: post.updated_at || post.created_at || '',
    mainEntityOfPage: `${siteUrl}/projects/${post.slug}`,
    articleSection: post.category || 'Balloon Decor',
    keywords: keywords.join(', '),
    about: keywords.map((keyword) => ({
      '@type': 'Thing',
      name: keyword,
    })),
    author: {
      '@type': 'Person',
      name: post.author || businessName,
    },
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${siteUrl}#website`,
      url: siteUrl,
      name: businessName,
    },
    publisher: {
      '@type': 'LocalBusiness',
      '@id': `${siteUrl}#localbusiness`,
      name: businessName,
      url: siteUrl,
      address: {
        '@type': 'PostalAddress',
        addressLocality: locality,
        addressRegion: 'MO',
        addressCountry: 'US',
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
  const base = domain.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `https://${base}${p}`;
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

const STATIC_PAGES = ['/', '/about', '/projects', '/testimonials', '/contact'];
const STATIC_PAGE_DEFS = [
  { path: '/', pageKey: 'hero', changefreq: 'weekly', priority: '1.0' },
  { path: '/about', pageKey: 'about', changefreq: 'monthly', priority: '0.8' },
  { path: '/projects', pageKey: 'projects', changefreq: 'weekly', priority: '0.9' },
  { path: '/testimonials', pageKey: 'testimonials', changefreq: 'monthly', priority: '0.7' },
  { path: '/contact', pageKey: 'contact', changefreq: 'monthly', priority: '0.8' },
  { path: '/privacy', pageKey: 'privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms', pageKey: 'terms', changefreq: 'yearly', priority: '0.3' },
  { path: '/legal', pageKey: 'legal', changefreq: 'yearly', priority: '0.3' },
];

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatAbsoluteUrl(baseUrl, path) {
  const normalizedBase = String(baseUrl || '').replace(/\/$/, '');
  if (!path || path === '/') return `${normalizedBase}/`;
  return `${normalizedBase}${path.startsWith('/') ? path : `/${path}`}`;
}

function formatDateOnly(value) {
  if (!value) return new Date().toISOString().split('T')[0];
  return String(value).split('T')[0];
}

function createUrlNode({ loc, lastmod, changefreq, priority, images = [] }) {
  const imageNodes = images
    .filter(Boolean)
    .map((imageUrl) => `\n    <image:image>\n      <image:loc>${escapeXml(imageUrl)}</image:loc>\n    </image:image>`)
    .join('');

  return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${escapeXml(lastmod)}</lastmod>\n    <changefreq>${escapeXml(changefreq)}</changefreq>\n    <priority>${escapeXml(priority)}</priority>${imageNodes}\n  </url>`;
}

/**
 * Generate a sitemap XML string from published posts and static pages.
 */
export function generateSitemapXml(posts, domain) {
  const urls = [
    ...STATIC_PAGES.map(path => ({
      loc: formatCanonicalUrl(domain, path),
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: path === '/' ? '1.0' : '0.8',
    })),
    ...posts.map(p => ({
      loc: formatCanonicalUrl(domain, `/projects/${p.slug}`),
      lastmod: (p.updated_at || p.created_at || new Date().toISOString()).split('T')[0],
      changefreq: 'monthly',
      priority: '0.8',
    })),
  ];

  const urlEntries = urls
    .map((u) => createUrlNode(u))
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>`;
}

export function generateSitemapIndexXml(baseUrl) {
  const normalizedBase = String(baseUrl || '').replace(/\/$/, '');
  const entries = [
    `${normalizedBase}/sitemaps/pages.xml`,
    `${normalizedBase}/sitemaps/projects.xml`,
  ]
    .map((loc) => `  <sitemap>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${formatDateOnly()}</lastmod>\n  </sitemap>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>`;
}

export function generateStaticPageSitemapXml(baseUrl, pageUpdates = {}, pageContent = {}) {
  const urls = STATIC_PAGE_DEFS.map((page) => {
    const imageCandidate = page.pageKey === 'hero'
      ? pageContent?.hero?.image
      : pageContent?.[page.pageKey]?.image;

    return {
      loc: formatAbsoluteUrl(baseUrl, page.path),
      lastmod: formatDateOnly(pageUpdates[page.pageKey]),
      changefreq: page.changefreq,
      priority: page.priority,
      images: imageCandidate ? [imageCandidate] : [],
    };
  });

  const urlEntries = urls.map((url) => createUrlNode(url)).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urlEntries}\n</urlset>`;
}

export function generateProjectSitemapXml(projects = [], baseUrl) {
  const urls = projects.map((project) => {
    const images = [
      project.og_image,
      project.featured_image,
      ...(Array.isArray(project.gallery_images_meta) ? project.gallery_images_meta.map((image) => image?.url) : []),
      ...(Array.isArray(project.gallery_images) ? project.gallery_images : []),
    ].filter(Boolean);

    return {
      loc: formatAbsoluteUrl(baseUrl, `/projects/${project.slug}`),
      lastmod: formatDateOnly(project.updated_at || project.publish_date || project.created_at),
      changefreq: 'monthly',
      priority: '0.8',
      images: [...new Set(images)].slice(0, 8),
    };
  });

  const urlEntries = urls.map((url) => createUrlNode(url)).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urlEntries}\n</urlset>`;
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
