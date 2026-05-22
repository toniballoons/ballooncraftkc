import { generateSitemapIndexXml } from '../src/lib/seo.js';
import { getBaseUrl } from './_seo-utils.js';

export default async function handler(req, res) {
  const baseUrl = getBaseUrl(req);
  const xml = generateSitemapIndexXml(baseUrl);

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  return res.status(200).send(xml);
}
