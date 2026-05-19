import { useEffect } from 'react';
import { formatCanonicalUrl, normalizeBaseUrl } from '@/lib/seo';

const SITE_NAME = 'BalloonCraft KC';
const DEFAULT_IMAGE = '/logo.png';
const MANAGED_JSONLD_SELECTOR = 'script[data-seo-managed="true"]';

function upsertMeta(selector, createTag, content) {
  if (!content) return null;
  let element = document.head.querySelector(selector);
  if (!element) {
    element = createTag();
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
  return element;
}

function upsertLink(rel, href) {
  let element = document.head.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
  return element;
}

function setJsonLdScripts(schema = []) {
  document.head.querySelectorAll(MANAGED_JSONLD_SELECTOR).forEach(node => node.remove());

  schema
    .flat()
    .filter(Boolean)
    .forEach((jsonLd, index) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.seoManaged = 'true';
      script.id = `seo-jsonld-${index}`;
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    });
}

export function usePageSeo({
  title,
  description,
  path = '/',
  image = DEFAULT_IMAGE,
  type = 'website',
  keywords = [],
  schema = [],
  noindex = false,
} = {}) {
  useEffect(() => {
    const siteUrl = normalizeBaseUrl(
      typeof window !== 'undefined' ? window.location.origin : 'https://ballooncraftkc.com'
    );
    const canonicalUrl = formatCanonicalUrl(siteUrl, path);
    const resolvedImage = image?.startsWith('http') ? image : formatCanonicalUrl(siteUrl, image || DEFAULT_IMAGE);
    const robotsValue = `${noindex ? 'noindex' : 'index'},follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1`;

    if (title) {
      document.title = title;
    }

    upsertLink('canonical', canonicalUrl);

    upsertMeta('meta[name="description"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      return meta;
    }, description);

    upsertMeta('meta[name="robots"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'robots');
      return meta;
    }, robotsValue);

    upsertMeta('meta[name="googlebot"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'googlebot');
      return meta;
    }, robotsValue);

    upsertMeta('meta[name="keywords"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'keywords');
      return meta;
    }, keywords.filter(Boolean).join(', '));

    upsertMeta('meta[name="application-name"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'application-name');
      return meta;
    }, SITE_NAME);

    upsertMeta('meta[name="twitter:card"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'twitter:card');
      return meta;
    }, resolvedImage ? 'summary_large_image' : 'summary');

    upsertMeta('meta[name="twitter:title"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'twitter:title');
      return meta;
    }, title);

    upsertMeta('meta[name="twitter:description"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'twitter:description');
      return meta;
    }, description);

    upsertMeta('meta[name="twitter:image"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'twitter:image');
      return meta;
    }, resolvedImage);

    upsertMeta('meta[property="og:title"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:title');
      return meta;
    }, title);

    upsertMeta('meta[property="og:description"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:description');
      return meta;
    }, description);

    upsertMeta('meta[property="og:type"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:type');
      return meta;
    }, type);

    upsertMeta('meta[property="og:url"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:url');
      return meta;
    }, canonicalUrl);

    upsertMeta('meta[property="og:image"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:image');
      return meta;
    }, resolvedImage);

    upsertMeta('meta[property="og:image:alt"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:image:alt');
      return meta;
    }, title || SITE_NAME);

    upsertMeta('meta[property="og:site_name"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:site_name');
      return meta;
    }, SITE_NAME);

    upsertMeta('meta[property="og:locale"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:locale');
      return meta;
    }, 'en_US');

    setJsonLdScripts(schema);
  }, [description, image, keywords, noindex, path, schema, title, type]);
}
