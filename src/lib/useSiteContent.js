import { useQuery } from '@tanstack/react-query';
import * as SiteContent from '@/entities/SiteContent';
import { DEFAULT_CONTENT } from './siteDefaults';
import {
  getCachedSiteContent,
  getCachedSiteContentMap,
  setCachedSiteContent,
  setCachedSiteContentMap,
} from './siteContentCache';

export function useSiteContent(pageKey) {
  const { data, isLoading } = useQuery({
    queryKey: ['site-content', pageKey],
    queryFn: async () => {
      const results = await SiteContent.filter({ page_key: pageKey });
      if (results.length > 0 && results[0].content_json) {
        const parsed = JSON.parse(results[0].content_json);
        setCachedSiteContent(pageKey, parsed);
        return parsed;
      }
      const fallback = DEFAULT_CONTENT[pageKey] || {};
      setCachedSiteContent(pageKey, fallback);
      return fallback;
    },
    initialData: () => getCachedSiteContent(pageKey),
    staleTime: 1000 * 60 * 5,
  });

  return { content: data, isLoading };
}

export function useAllSiteContent() {
  const { data, isLoading } = useQuery({
    queryKey: ['site-content-all'],
    queryFn: async () => {
      const results = await SiteContent.list();
      const contentMap = { ...DEFAULT_CONTENT };
      results.forEach(item => {
        if (item.content_json) {
          contentMap[item.page_key] = JSON.parse(item.content_json);
        }
      });
      setCachedSiteContentMap(contentMap);
      return contentMap;
    },
    initialData: () => getCachedSiteContentMap(),
    staleTime: 1000 * 60 * 5,
  });

  return { content: data, isLoading };
}
