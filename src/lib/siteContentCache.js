import { DEFAULT_CONTENT } from './siteDefaults';

const SITE_CONTENT_CACHE_KEY = 'ballooncraftkc_site_content_cache_v1';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readCache() {
  if (!canUseStorage()) {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(SITE_CONTENT_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeCache(cache) {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(SITE_CONTENT_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage write issues so the site still renders normally.
  }
}

export function getCachedSiteContent(pageKey) {
  const cache = readCache();
  return cache[pageKey] || DEFAULT_CONTENT[pageKey] || {};
}

export function getCachedSiteContentMap() {
  return {
    ...DEFAULT_CONTENT,
    ...readCache(),
  };
}

export function setCachedSiteContent(pageKey, content) {
  const cache = readCache();
  writeCache({
    ...cache,
    [pageKey]: content,
  });
}

export function setCachedSiteContentMap(contentMap) {
  writeCache(contentMap);
}
