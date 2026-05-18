import { useQuery } from '@tanstack/react-query';
import * as SiteContent from '@/entities/SiteContent';
import { DEFAULT_CONTENT } from './siteDefaults';

export function useSiteContent(pageKey) {
  const { data, isLoading } = useQuery({
    queryKey: ['site-content', pageKey],
    queryFn: async () => {
      const results = await SiteContent.filter({ page_key: pageKey });
      if (results.length > 0 && results[0].content_json) {
        return JSON.parse(results[0].content_json);
      }
      return DEFAULT_CONTENT[pageKey] || {};
    },
    initialData: DEFAULT_CONTENT[pageKey] || {},
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
      return contentMap;
    },
    initialData: DEFAULT_CONTENT,
  });

  return { content: data, isLoading };
}
