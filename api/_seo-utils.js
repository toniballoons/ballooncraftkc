import { DEFAULT_CONTENT } from '../src/lib/siteDefaults.js';
import { createSupabaseServerClient } from './_supabase.js';

export function getBaseUrl(req) {
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'www.ballooncraftkc.com';
  return `${protocol}://${host}`;
}

export function createSupabaseAdminClient() {
  return createSupabaseServerClient({
    allowPublishableFallback: true,
    requireKey: false,
  });
}

export function parseSiteContentRows(rows = []) {
  const pageUpdates = {};
  const pageContent = { ...DEFAULT_CONTENT };

  for (const row of rows) {
    if (!row?.page_key) continue;
    if (row.updated_at) {
      pageUpdates[row.page_key] = row.updated_at;
    }

    if (!row.content_json) continue;

    try {
      pageContent[row.page_key] = JSON.parse(row.content_json);
    } catch (error) {
      console.warn(`Failed to parse site_content for ${row.page_key}:`, error);
    }
  }

  return { pageUpdates, pageContent };
}
