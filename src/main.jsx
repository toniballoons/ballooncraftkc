import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { supabase } from '@/api/supabaseClient'
import { queryClientInstance } from '@/lib/query-client'
import { DEFAULT_CONTENT } from '@/lib/siteDefaults'
import {
  applyThemeCssVars,
  normalizeThemeId,
  THEME_SETTINGS_KEY,
} from '@/lib/ThemeContext'
import { getThemeById } from '@/lib/themes'
import { setCachedSiteContentMap } from '@/lib/siteContentCache'

const BOOTSTRAP_TIMEOUT_MS = 900;

async function bootstrapPublicSite() {
  try {
    const siteContentKeys = [...Object.keys(DEFAULT_CONTENT), THEME_SETTINGS_KEY];
    const timeout = new Promise((resolve) => {
      window.setTimeout(() => resolve({ timedOut: true }), BOOTSTRAP_TIMEOUT_MS);
    });

    const request = supabase
      .from('site_content')
      .select('page_key, content_json')
      .in('page_key', siteContentKeys)
      .then(({ data, error }) => {
        if (error) {
          throw new Error(error.message);
        }
        return { data };
      });

    const result = await Promise.race([request, timeout]);
    if (!result || result.timedOut || !Array.isArray(result.data)) {
      return;
    }

    const contentMap = { ...DEFAULT_CONTENT };
    let activeThemeId = null;

    result.data.forEach((item) => {
      if (!item?.content_json) {
        return;
      }

      try {
        const parsed = JSON.parse(item.content_json);
        if (item.page_key === THEME_SETTINGS_KEY) {
          activeThemeId = normalizeThemeId(parsed.theme_id);
        } else {
          contentMap[item.page_key] = parsed;
        }
      } catch {
        // Ignore malformed rows so the site can keep booting.
      }
    });

    setCachedSiteContentMap(contentMap);
    queryClientInstance.setQueryData(['site-content-all'], contentMap);

    Object.entries(contentMap).forEach(([pageKey, content]) => {
      queryClientInstance.setQueryData(['site-content', pageKey], content);
    });

    if (activeThemeId) {
      queryClientInstance.setQueryData(['active-theme'], activeThemeId);
      applyThemeCssVars(getThemeById(activeThemeId));
    }
  } catch {
    // Fall back to cached/default content if the fast bootstrap path fails.
  }
}

bootstrapPublicSite().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
  )
})
